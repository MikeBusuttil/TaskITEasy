from os import environ
from traceback import format_exc
from flask import Flask, request, jsonify
import log, db

api = Flask(__name__)
authenticated = True

@api.route('/store', methods=['POST'])
def store():
    # ip_address = request.environ.get('HTTP_X_REAL_IP') or request.remote_addr
    try:
        db.store(request.json['records'])
    except:
        log.stderr(format_exc())
        return '👎', 500

    return '👍', 200

@api.route('/rmse', methods=['POST'])
def rmse():
    try:
        assert(authenticated)
    except:
        log.stderr(request.json['key'] if request.is_json and 'key' in request.json else 'key error')
        log.stderr(environ.get('AGENT_KEY'))
        return jsonify({"msg": "unauthorized"}), 401
    
    try:
        assert('filter' in request.json)
    except:
        return jsonify({"msg": "malformed request.  Missing 'filter' payload"}), 400

    try:
        return jsonify(db.rmse(request.json['filter'])), 200
    except:
        return '👎', 500

@api.route('/get', methods=['POST'])
def get():
    try:
        return jsonify({"records": db.get(request.json['filter'])}), 200
    except:
        return '👎', 500

if __name__ == '__main__':
    api.run()
