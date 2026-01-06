from flask import Blueprint, request, jsonify

bp = Blueprint('session', __name__, url_prefix='/session')

# Global variable to store service (will be set during app initialization)
session_service = None

def init_service(service):
    """Initialize the service for this blueprint"""
    global session_service
    session_service = service

@bp.route('/start', methods=['POST'])
def start_session():
    """Start a new session"""
    try:
        # Get client info
        data = request.get_json() or {}
        client_info = {
            'ip_address': data.get('ip_address') or request.headers.get('X-Forwarded-For', request.remote_addr),
            'user_agent': data.get('user_agent') or request.headers.get('User-Agent', 'unknown')
        }
        
        # Start session with client_info dict
        result = session_service.start_session(client_info)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/<session_id>/answer', methods=['POST'])  # ✅ FIXED!
def submit_answer(session_id):
    """Submit an answer"""
    try:
        data = request.get_json()
        
        if not data or 'question_id' not in data or 'answer' not in data:
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Submit answer - new service returns dict, not tuple
        result = session_service.submit_answer(
            session_id,
            data['question_id'],
            data['answer']
        )
        
        return jsonify(result), 200
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/summary/<session_id>', methods=['GET'])
def get_summary(session_id):
    """Get session summary"""
    try:
        summary = session_service.get_summary(session_id)
        return jsonify(summary), 200
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500
