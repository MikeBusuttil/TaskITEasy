from neo4j import GraphDatabase
from os import environ
import log

class DB:
    '''
    usage:
    with DB() as db:
        result = db.run("MATCH (a:Person) RETURN a.name AS name")
        names = [record["name"] for record in result]
    '''
    def __enter__(self):
        self.driver = GraphDatabase.driver("bolt://db:7687", auth=("neo4j", environ["DB_PASSWORD"]))
        return self.driver.session()

    def __exit__(self, *exception):
        self.driver.session().close()
        self.driver.close()

def create_user(user=None, org=None):
    params = dict(person=user, org=org or user)
    cql = f"""
    CREATE
        (person:Person {{name: $person}}),
        (org:Organization {{name: $org}}),
        (person)-[:IN]->(org)
    RETURN elementId(person) AS id
    """
    with DB() as db:
        results = db.run(cql, params)
        id = [r['id'] for r in results][0]
    return id

def _format_task_data(task):
    task_keys = ['title', 'order', 'point_estimate', 'time_estimate_seconds', 'description', 'x0', 'x1', 'y0', 'y1', 'color']
    task_props = ', '.join([f'{key}: ${key}' for key in task_keys if key in task])
    params = {key: task[key] for key in task_keys if key in task}
    return params, task_props

def create_task(user=None, task=None):
    params, task_props = _format_task_data(task)
    params["id"] = user
    
    #TODO: clean this up to look more like update_tasks
    parent_match, parent_relation = "", ""
    if "parent" in task:
        parent_match = "\n".join(["MATCH (parent:Task)", "WHERE elementId(parent) = $parent"])
        parent_relation = "    (parent)-[:includes]->(task),"
        params['parent'] = task["parent"]

    cql = "\n".join([
        "MATCH (person:Person)-[]->(org:Organization)",
        "WHERE elementId(person) = $id",
        parent_match,
        "CREATE",
        f"    (task:Task {{{task_props}}}),",
        "    (org)-[:owns]->(task),",
        parent_relation,
        "    (person)-[:created {at: datetime()}]->(task)",
        "RETURN elementId(task) AS id"
    ])

    with DB() as db:
        results = db.run(cql, params)
        id = [r['id'] for r in results][0]
    return id

def update_task(task=None, user=None):
    params, task_props = _format_task_data(task)
    params['task_id'] = task['id']
    params['user_id'] = user

    matches = [
        "MATCH (person:Person)",
        "WHERE elementId(person) = $user_id",
        "MATCH (task:Task)",
        "WHERE elementId(task) = $task_id",
        "OPTIONAL MATCH (:Task)-[parent_bonds:includes]->(task:Task)-[child_bonds:includes]->(:Task)",
    ]
    relations = ["CREATE (person)-[:updated {at: datetime()}]->(task)"]


    for relation, tasks in [
        ['parent', task['parents'] if 'parents' in task else []],
        ['child', task['children'] if 'children' in task else []]
    ]:
        for n, task_id in enumerate(tasks):
            matches.extend([f"MATCH ({relation}{n}:Task)", f"WHERE elementId({relation}{n}) = ${relation}{n}"])
            relations.append(f"MERGE ({relation}{n})-[:includes]->(task)" if relation == 'parent' else f"MERGE (task)-[:includes]->({relation}{n})")
            params[f"{relation}{n}"] = task_id

    cql = matches + [
        f"SET task = {{{task_props}}}",
        "DELETE parent_bonds, child_bonds",
    ] + relations
    cql = "\n".join(cql)
    log.stderr("\n", params, "\n", cql)

    with DB() as db:
        db.run(cql, params)
    
    return True

def delete_task(task=None, user=None):
    params = dict(
        task_id=task,
        user_id=user,
    )
    
    cql = "\n".join([
        "MATCH (person:Person)-[]->(org:Organization)-[:owns]->(task:Task)",
        "WHERE elementId(person) = $user_id",
        "AND elementId(task) = $task_id",
        "DETACH DELETE task",
    ])
    with DB() as db:
        db.run(cql, params)
    
    return True

def _merge_task(result):
    return dict(
        id=result['id'],
        created=str(result['created']),
        parents = list(set(result['parents'])),
        children = list(set(result['children'])),
        **result['properties'],
    )
def get_tasks(user=None):
    params = dict(user_id=user)

    cql = "\n".join([
        "MATCH (person:Person)-[]->(org:Organization)-[:owns]->(task:Task)",
        "WHERE elementId(person) = $user_id",
        "OPTIONAL MATCH (parents:Task)-[]->(task)",
        "OPTIONAL MATCH (task)-[]->(children:Task)",
        "OPTIONAL MATCH (:Person)-[c:created]->(task)",
        "RETURN elementId(task) as id, properties(task) as properties, COLLECT(elementId(children)) as children, COLLECT(elementId(parents)) as parents, c.at as created",
    ])

    with DB() as db:
        #TODO: ignore warning from collecting null parent/children
        results = db.run(cql, params)
        tasks = [_merge_task(r) for r in results]
    return tasks
