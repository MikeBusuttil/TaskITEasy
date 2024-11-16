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

def create_task(user=None, task=None):
    task_keys = ['title', 'order', 'point_estimate', 'time_estimate', 'description', 'x0', 'x1', 'y0', 'y1', 'color']
    task_props = ', '.join([f'{key}: ${key}' for key in task_keys if key in task])
    params = dict(id=user) | {key: task[key] for key in task_keys if key in task}
    
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
        f"    (person)-[:created {{at: datetime()}}]->(task)",
        "RETURN elementId(task) AS id"
    ])

    with DB() as db:
        results = db.run(cql, params)
        id = [r['id'] for r in results][0]
    return id
