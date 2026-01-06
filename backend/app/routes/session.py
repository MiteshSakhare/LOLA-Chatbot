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

@bp.route('/<session_id>/answer', methods=['POST'])
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


@bp.route('/<session_id>', methods=['DELETE', 'POST'])
def delete_session(session_id):
    """Delete an in-progress session"""
    try:
        # Handle sendBeacon POST with _method=DELETE
        if request.method == 'POST':
            method = request.form.get('_method', '').upper()
            if method != 'DELETE':
                return jsonify({'error': 'Invalid method'}), 400
        
        # Get services from app config
        from flask import current_app
        session_model = current_app.config['SESSION_MODEL']
        
        session = session_model.get(session_id)
        if not session:
            return jsonify({'message': 'Session not found or already deleted'}), 200
        
        # Only delete if in_progress (preserve completed sessions)
        if session['status'] == 'in_progress':
            session_model.delete(session_id)
            return jsonify({'message': 'Session deleted successfully'}), 200
        else:
            return jsonify({'message': 'Session already completed'}), 200
            
    except Exception as e:
        print(f"[ERROR] Delete session failed: {str(e)}")
        return jsonify({'error': str(e)}), 500
