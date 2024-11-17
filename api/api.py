from os import environ
from traceback import format_exc
from flask import Flask, request, jsonify
import log, db

api = Flask(__name__)
#TODO: implement these
authenticated = True
allowed = True
#TODO: get user ID from token, not request

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
    """
    request json: {
        user (ID) *required* TODO: get from token
        task: { *required*
            parent: (ID)

            title (str)
            order (int)
            point_estimate (int)
            time_estimate_seconds (int)
            description (str)
            x0 (int)
            x1 (int)
            y0 (int)
            y1 (int)
            color (char[6])
        }
    }
    """
    try:
        assert('user' in request.json and 'task' in request.json)
    except:
        return "malformed request.  Missing 'user' or 'task' in payload", 400

    try:
        assert(allowed)
    except:
        return "not allowed", 403

    try:
        return jsonify(db.create_task(user=request.json['user'], task=request.json['task'])), 200
    except:
        log.stderr(format_exc())
        return '👎', 500

@api.route('/task', methods=['PATCH'])
def update_task():
    """
    request json: {
        user (ID) *required* TODO: get from token
        task: {
            id (ID) *required*
            parents: [
                (ID)
            ]
            children: [
                (ID)
            ]

            title (str)
            order (int)
            point_estimate (int)
            time_estimate_seconds (int)
            description (str)
            x0 (int)
            x1 (int)
            y0 (int)
            y1 (int)
            color (char[6])
        }
    }
    """
    try:
        assert('user' in request.json and 'task' in request.json)
    except:
        return "malformed request.  Missing 'user' or 'task' in payload", 400
    
    try:
        assert(allowed)
    except:
        return "not allowed", 403

    try:
        return jsonify(db.update_task(user=request.json['user'], task=request.json['task'])), 200
    except:
        log.stderr(format_exc())
        return '👎', 500

@api.route('/tasks', methods=['GET'])
def get_tasks():
    #TODO: get user from token instead of URL parameters
    try:
        return jsonify({"tasks": db.get_tasks(request.args.get("user"))}), 200
    except:
        log.stderr(format_exc())
        return '👎', 500

if __name__ == '__main__':
    api.run(host='0.0.0.0', port=80, debug=True)
