import csv
import io
import json
from flask import Blueprint, request, jsonify, Response, send_file
from datetime import datetime

bp = Blueprint('admin', __name__, url_prefix='/admin')

# Global variables to store models
session_model = None
answer_model = None

def init_models(sess_model, ans_model):
    """Initialize the models for this blueprint"""
    global session_model, answer_model
    session_model = sess_model
    answer_model = ans_model

# ============================================
# LIST ALL SESSIONS
# ============================================
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

# ============================================
# GET SINGLE SESSION DETAIL
# ============================================
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

# ============================================
# DELETE SESSION
# ============================================
@bp.route('/response/<session_id>', methods=['DELETE'])
def delete_response(session_id):
    """Delete a session and all its answers"""
    session = session_model.get(session_id)
    if not session:
        return jsonify({'error': 'Session not found'}), 404
    
    session_model.delete(session_id)
    return jsonify({'message': 'Session deleted successfully'}), 200

# ============================================
# CLEANUP STALE SESSIONS (5 MINUTES)
# ============================================
@bp.route('/cleanup', methods=['POST'])
def cleanup_stale():
    """Cleanup stale sessions (inactive for X minutes)"""
    minutes = int(request.args.get('minutes', 5))
    deleted_count = session_model.cleanup_stale(minutes)
    
    return jsonify({
        'message': f'Cleaned up {deleted_count} stale session(s)',
        'deleted_count': deleted_count
    }), 200

# ============================================
# AUTO-CLEANUP (Background scheduler calls this)
# ============================================
@bp.route('/auto-cleanup', methods=['POST'])
def auto_cleanup():
    """Auto cleanup - called by scheduler every 5 minutes"""
    deleted_count = session_model.cleanup_stale(minutes=5)
    return jsonify({
        'message': f'Auto-cleanup completed: {deleted_count} session(s) removed',
        'deleted_count': deleted_count
    }), 200

# ============================================
# GET FULL DATABASE VIEW
# ============================================
@bp.route('/database/all', methods=['GET'])
def get_all_database():
    """Get ALL sessions with ALL answers - complete database view"""
    try:
        all_data = session_model.get_all_with_answers()
        return jsonify({
            'total_sessions': len(all_data),
            'sessions': all_data
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================
# DATABASE STATS
# ============================================
@bp.route('/stats', methods=['GET'])
def get_stats():
    """Get database statistics"""
    try:
        total_sessions = session_model.count()
        all_sessions = session_model.list_all(limit=10000)
        
        completed = sum(1 for s in all_sessions if s['status'] == 'completed')
        in_progress = sum(1 for s in all_sessions if s['status'] == 'in_progress')
        
        total_answers = sum(s['answers_count'] for s in all_sessions)
        
        return jsonify({
            'total_sessions': total_sessions,
            'completed_sessions': completed,
            'in_progress_sessions': in_progress,
            'total_answers': total_answers,
            'completion_rate': round((completed / total_sessions * 100), 2) if total_sessions > 0 else 0
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================
# ENHANCED CSV EXPORT (WITH QUESTIONS & ANSWERS)
# ============================================
@bp.route('/export', methods=['GET'])
def export_csv():
    """Export responses as CSV with questions and answers"""
    try:
        # Get ALL sessions with answers
        all_data = session_model.get_all_with_answers()
        
        # Create CSV in memory
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'Session ID',
            'Status',
            'Created At',
            'Last Activity',
            'IP Address',
            'Total Answers',
            'Question Number',
            'Question ID',
            'Question Text',
            'Answer',
            'Answered At'
        ])
        
        # Write data
        for session in all_data:
            answers = session.get('answers', [])
            
            if len(answers) == 0:
                # Session with no answers
                writer.writerow([
                    session['id'],
                    session['status'],
                    session['created_at'],
                    session.get('last_activity', 'N/A'),
                    session.get('ip_address', 'N/A'),
                    0,
                    'N/A',
                    'N/A',
                    'No responses yet',
                    'N/A',
                    'N/A'
                ])
            else:
                # Session with responses
                for idx, answer in enumerate(answers, 1):
                    # Format answer
                    answer_text = answer['answer_text']
                    try:
                        # Try to parse JSON answers
                        parsed = json.loads(answer_text)
                        if isinstance(parsed, dict):
                            answer_text = ' | '.join([f"{k}: {v}" for k, v in parsed.items()])
                        elif isinstance(parsed, list):
                            answer_text = ', '.join(str(item) for item in parsed)
                    except:
                        pass  # Keep original text
                    
                    writer.writerow([
                        session['id'],
                        session['status'],
                        session['created_at'],
                        session.get('last_activity', 'N/A'),
                        session.get('ip_address', 'N/A'),
                        len(answers),
                        idx,
                        answer['question_id'],
                        answer.get('question_text', 'N/A'),
                        answer_text,
                        answer['created_at']
                    ])
        
        # Prepare file
        output.seek(0)
        filename = f"lola_responses_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
        return Response(
            output.getvalue(),
            mimetype='text/csv',
            headers={'Content-Disposition': f'attachment;filename={filename}'}
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================
# LEGACY CLEANUP (backwards compatibility)
# ============================================
@bp.route('/cleanup-incomplete', methods=['POST'])
def cleanup_incomplete_sessions():
    """Legacy cleanup endpoint"""
    try:
        data = request.get_json() or {}
        minutes = data.get('minutes', 5)
        deleted = session_model.cleanup_stale(minutes=minutes)
        return jsonify({
            'message': f'Cleaned up {deleted} incomplete sessions',
            'deleted_count': deleted
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
