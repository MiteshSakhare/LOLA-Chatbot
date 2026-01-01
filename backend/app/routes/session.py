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
    ip_address = request.headers.get('X-Forwarded-For', request.remote_addr)
    user_agent = request.headers.get('User-Agent', '')
    
    result = session_service.start_session(ip_address, user_agent)
    return jsonify(result), 201

@bp.route('/<session_id>/answer', methods=['POST'])
def submit_answer(session_id):
    """Submit an answer"""
    data = request.get_json()
    
    if not data or 'question_id' not in data or 'answer' not in data:
        return jsonify({'error': 'Missing required fields'}), 400
    
    result, status = session_service.submit_answer(
        session_id,
        data['question_id'],
        data['answer']
    )
    return jsonify(result), status

@bp.route('/<session_id>/summary', methods=['GET'])
def get_summary(session_id):
    """Get session summary"""
    summary = session_service.get_summary(session_id)
    
    if not summary:
        return jsonify({'error': 'Session not found'}), 404
    
    return jsonify(summary), 200
