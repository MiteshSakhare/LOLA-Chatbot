import csv
import io
from flask import Blueprint, request, jsonify, Response

bp = Blueprint('admin', __name__, url_prefix='/admin')

# Global variables to store models (will be set during app initialization)
session_model = None
answer_model = None

def init_models(sess_model, ans_model):
    """Initialize the models for this blueprint"""
    global session_model, answer_model
    session_model = sess_model
    answer_model = ans_model

@bp.route('/responses', methods=['GET'])
def list_responses():
    """Get paginated list of all sessions"""
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    
    offset = (page - 1) * per_page
    sessions = session_model.list_all(limit=per_page, offset=offset)
    total = session_model.count()
    
    return jsonify({
        'sessions': sessions,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': total,
            'pages': (total + per_page - 1) // per_page
        }
    }), 200

@bp.route('/response/<session_id>', methods=['GET'])
def get_response(session_id):
    """Get full detail for one session"""
    session = session_model.get(session_id)
    if not session:
        return jsonify({'error': 'Session not found'}), 404
    
    answers = answer_model.get_by_session(session_id)
    
    return jsonify({
        'session': session,
        'answers': answers
    }), 200

@bp.route('/response/<session_id>', methods=['DELETE'])
def delete_response(session_id):
    """Delete a session and all its answers"""
    session = session_model.get(session_id)
    if not session:
        return jsonify({'error': 'Session not found'}), 404
    
    # Delete session (cascade will delete answers)
    session_model.delete(session_id)
    
    return jsonify({'message': 'Session deleted successfully'}), 200

@bp.route('/cleanup', methods=['POST'])
def cleanup_abandoned():
    """Cleanup abandoned sessions with no answers"""
    minutes = int(request.args.get('minutes', 30))
    deleted_count = session_model.cleanup_abandoned(minutes)
    
    return jsonify({
        'message': f'Cleaned up {deleted_count} abandoned session(s)',
        'deleted_count': deleted_count
    }), 200

@bp.route('/export', methods=['GET'])
def export_responses():
    """Export responses as CSV"""
    format_type = request.args.get('format', 'csv')
    
    if format_type != 'csv':
        return jsonify({'error': 'Only CSV format supported'}), 400
    
    # Get all completed sessions
    sessions = session_model.list_all(limit=10000)
    
    # Create CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow(['Session ID', 'Status', 'Created At', 'Question ID', 'Answer'])
    
    # Write data
    for session in sessions:
        answers = answer_model.get_by_session(session['id'])
        for answer in answers:
            writer.writerow([
                session['id'],
                session['status'],
                session['created_at'],
                answer['question_id'],
                answer['answer_text']
            ])
    
    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': 'attachment;filename=responses.csv'}
    )
