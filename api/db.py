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
