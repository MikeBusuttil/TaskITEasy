from os import environ
from traceback import format_exc
from flask import Flask, request, jsonify
import log, db

api = Flask(__name__)
authenticated = True

@api.route('/user', methods=['POST'])
def create_user():
    # ip_address = request.environ.get('HTTP_X_REAL_IP') or request.remote_addr
    try:
        params = {key: request.json[key] for key in ['user', 'org'] if key in request.json}
        user_id = db.create_user(**params)
        return jsonify(dict(user_id=user_id)), 200
    except:
        log.stderr(format_exc())
        return '👎', 500

@api.route('/task', methods=['POST'])
def create_task():
    try:
        params = {key: request.json[key] for key in ['user', 'task'] if key in request.json}
        return jsonify(db.create_task(**params)), 200
    except:
        log.stderr(format_exc())
        return '👎', 500

@api.route('/get', methods=['POST'])
def get():
    try:
        return jsonify({"records": db.get(request.json['filter'])}), 200
    except:
        return '👎', 500

if __name__ == '__main__':
    api.run(host='0.0.0.0', port=80, debug=True)
