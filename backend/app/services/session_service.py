import json
import uuid
from typing import Dict, Any, Optional, List
from app.models import Session, Answer, Database
from app.services.validation_service import ValidationService

class SessionService:
    """Business logic for session management"""
    
    def __init__(self, db: Database, flow_config: Dict[str, Any]):
        self.db = db
        self.session_model = Session(db)
        self.answer_model = Answer(db)
        self.validation = ValidationService(flow_config)
        self.questions = sorted(flow_config['questions'], key=lambda q: q['order'])
        # In-memory storage for incomplete sessions
        self.pending_answers = {}
        # Store session metadata temporarily
        self.pending_sessions = {}
    
    def start_session(self, ip_address: str, user_agent: str) -> Dict[str, Any]:
        """Start a new session and return first question WITHOUT creating DB record yet"""
        session_id = str(uuid.uuid4())
        
        # Store session metadata in memory (don't create in DB yet)
        self.pending_sessions[session_id] = {
            'ip_address': ip_address,
            'user_agent': user_agent
        }
        
        # Initialize pending answers storage
        self.pending_answers[session_id] = {}
        
        first_question = self.questions[0]
        
        return {
            'session_id': session_id,
            'question': self._format_question(first_question),
            'progress': {'current': 1, 'total': len(self.questions), 'percentage': 0}
        }
    
    def submit_answer(self, session_id: str, question_id: str, answer: Any) -> Dict[str, Any]:
        """Submit an answer and get next question or summary"""
        # Check if session exists in DB
        session = self.session_model.get(session_id)
        
        # If this is the first answer, create the session in DB now
        if not session:
            if session_id in self.pending_sessions:
                # Get stored metadata
                metadata = self.pending_sessions[session_id]
                self.session_model.create(
                    session_id, 
                    metadata['ip_address'], 
                    metadata['user_agent']
                )
                session = self.session_model.get(session_id)
            else:
                return {'error': 'Session not found'}, 404
        
        if session['status'] == 'completed':
            return {'error': 'Session already completed'}, 400
        
        # Sanitize and validate
        answer = self.validation.sanitize_answer(answer)
        is_valid, error_msg = self.validation.validate_answer(question_id, answer)
        
        if not is_valid:
            return {'error': error_msg}, 400
        
        # Store answer in memory (not in DB yet)
        answer_text = json.dumps(answer) if isinstance(answer, list) else str(answer)
        
        if session_id not in self.pending_answers:
            self.pending_answers[session_id] = {}
        
        self.pending_answers[session_id][question_id] = answer_text
        self.session_model.touch(session_id)
        
        # Get next question
        current_index = next((i for i, q in enumerate(self.questions) if q['id'] == question_id), -1)
        
        if current_index == -1:
            return {'error': 'Invalid question ID'}, 400
        
        if current_index + 1 < len(self.questions):
            # Return next question
            next_question = self.questions[current_index + 1]
            return {
                'session_id': session_id,
                'question': self._format_question(next_question),
                'progress': self._get_progress_from_memory(session_id)
            }, 200
        else:
            # Last question - NOW save all answers to DB
            self._save_all_answers_to_db(session_id)
            self.session_model.update_status(session_id, 'completed')
            
            # Clear from memory
            if session_id in self.pending_answers:
                del self.pending_answers[session_id]
            if session_id in self.pending_sessions:
                del self.pending_sessions[session_id]
            
            return {
                'session_id': session_id,
                'completed': True,
                'summary': self.get_summary(session_id),
                'progress': {'current': len(self.questions), 'total': len(self.questions), 'percentage': 100}
            }, 200
    
    def _save_all_answers_to_db(self, session_id: str):
        """Save all pending answers to database"""
        if session_id in self.pending_answers:
            for question_id, answer_text in self.pending_answers[session_id].items():
                self.answer_model.save(session_id, question_id, answer_text)
    
    def get_summary(self, session_id: str) -> Dict[str, Any]:
        """Get full response summary for a session"""
        session = self.session_model.get(session_id)
        if not session:
            return None
        
        answers = self.answer_model.get_by_session(session_id)
        
        # Parse JSON answers
        formatted_answers = {}
        for ans in answers:
            try:
                value = json.loads(ans['answer_text'])
            except:
                value = ans['answer_text']
            formatted_answers[ans['question_id']] = value
        
        return {
            'session_id': session_id,
            'status': session['status'],
            'created_at': session['created_at'],
            'last_updated': session['last_updated'],
            'answers': formatted_answers
        }
    
    def _format_question(self, question: Dict[str, Any]) -> Dict[str, Any]:
        """Format question for frontend"""
        formatted = {
            'id': question['id'],
            'text': question['question_text'],
            'type': question['type'],
            'required': question['required']
        }
        
        if 'options' in question:
            formatted['options'] = question['options']
        if 'placeholder' in question:
            formatted['placeholder'] = question['placeholder']
        if 'validation' in question:
            formatted['validation'] = question['validation']
        
        return formatted
    
    def _get_progress_from_memory(self, session_id: str) -> Dict[str, int]:
        """Calculate progress from in-memory answers"""
        answers_count = len(self.pending_answers.get(session_id, {}))
        current = answers_count + 1
        total = len(self.questions)
        
        return {
            'current': min(current, total),
            'total': total,
            'percentage': int((answers_count / total) * 100)
        }
