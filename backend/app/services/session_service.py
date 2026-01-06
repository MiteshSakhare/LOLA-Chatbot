"""
Session service for managing question flow
Enhanced with activity tracking for auto-cleanup
"""

import json
from datetime import datetime
from typing import Optional, Dict, Any, List

class SessionService:
    def __init__(self, flow_config: dict, session_model, answer_model):
        self.flow_config = flow_config
        self.session_model = session_model
        self.answer_model = answer_model
        self.nodes_dict = {node['id']: node for node in flow_config['nodes']}
    
    def start_session(self, client_info: dict) -> dict:
        """Start a new session"""
        import uuid
        
        # Generate session ID
        session_id = str(uuid.uuid4())
        
        # Create session with initial activity
        session = self.session_model.create(
            session_id=session_id,
            ip_address=client_info.get('ip_address', 'unknown'),
            user_agent=client_info.get('user_agent', 'unknown')
        )
        
        # Get first question
        first_node_id = self.flow_config['nodes'][0]['id']
        first_question = self._get_question_node(first_node_id)
        
        return {
            'session_id': session_id,
            'question': self._format_question(first_question),
            'progress': self._calculate_progress(session_id)
        }
    
    def submit_answer(self, session_id: str, question_id: str, answer: Any) -> dict:
        """
        Submit an answer and get next question
        Updates activity timestamp on each call
        """
        # Update activity timestamp FIRST
        self.session_model.update_activity(session_id)
        
        # Validate session
        session = self.session_model.get(session_id)
        if not session:
            raise ValueError("Invalid session")
        
        if session['status'] == 'completed':
            raise ValueError("Session already completed")
        
        # Get current question node
        current_node = self.nodes_dict.get(question_id)
        if not current_node or current_node['type'] != 'question':
            raise ValueError("Invalid question")
        
        # Save answer WITH question text
        answer_text = self._serialize_answer(answer, current_node.get('input_type'))
        question_text = current_node.get('text', '')
        
        self.answer_model.save(
            session_id=session_id,
            question_id=question_id,
            answer_text=answer_text,
            question_text=question_text  # ✅ Store question text
        )
        
        # Determine next node
        next_node_id = self._get_next_node(current_node, answer, session_id)
        
        # Check if we've reached the end
        if next_node_id == 'end':
            self.session_model.update_status(session_id, 'completed')
            return {
                'completed': True,
                'message': self.nodes_dict.get('end', {}).get('message', 'Thank you!')
            }
        
        # Get next question
        next_node = self.nodes_dict.get(next_node_id)
        
        # Handle conditional nodes
        while next_node and next_node['type'] == 'conditional':
            next_node_id = self._evaluate_conditional(next_node, session_id)
            next_node = self.nodes_dict.get(next_node_id)
        
        if not next_node or next_node['type'] != 'question':
            # End of flow
            self.session_model.update_status(session_id, 'completed')
            return {
                'completed': True,
                'message': 'Thank you for completing the questionnaire!'
            }
        
        return {
            'question': self._format_question(next_node),
            'progress': self._calculate_progress(session_id),
            'completed': False
        }
    
    def _get_next_node(self, current_node: dict, answer: Any, session_id: str) -> str:
        """Determine the next node based on current node and answer"""
        next_id = current_node.get('next')
        if not next_id:
            return 'end'
        
        # If next is conditional, evaluate it
        next_node = self.nodes_dict.get(next_id)
        if next_node and next_node['type'] == 'conditional':
            return self._evaluate_conditional(next_node, session_id)
        
        return next_id
    
    def _evaluate_conditional(self, conditional_node: dict, session_id: str) -> str:
        """Evaluate a conditional node"""
        condition = conditional_node.get('condition', {})
        check_type = condition.get('check_type')
        
        # Handle different condition types
        if check_type == 'has_answer':
            question_id = condition.get('question_id')
            answer = self._get_answer(session_id, question_id)
            result = answer is not None and answer != ''
        
        elif check_type == 'first_rank':
            question_id = condition.get('question_id')
            value = condition.get('value')
            answer = self._get_answer(session_id, question_id)
            
            if answer:
                try:
                    first_item = answer.split(',')[0].split('. ', 1)[1] if '. ' in answer else answer
                    result = value in first_item
                except:
                    result = False
            else:
                result = False
        
        elif check_type == 'shopify_connected':
            result = False
        
        elif check_type == 'contains':
            question_id = condition.get('question_id')
            value = condition.get('value')
            answer = self._get_answer(session_id, question_id)
            result = value in str(answer) if answer else False
        
        else:
            result = False
        
        return conditional_node['if_true'] if result else conditional_node['if_false']
    
    def _get_answer(self, session_id: str, question_id: str) -> Optional[str]:
        """Get a previously submitted answer"""
        answers = self.answer_model.get_by_session(session_id)
        for ans in answers:
            if ans['question_id'] == question_id:
                return ans['answer_text']
        return None
    
    def _serialize_answer(self, answer: Any, input_type: str) -> str:
        """Convert answer to storable string format"""
        if answer is None:
            return ''
        
        if input_type == 'multi_choice':
            if isinstance(answer, list):
                return ', '.join(answer)
        elif input_type == 'ranking':
            if isinstance(answer, list):
                return ', '.join([f"{i+1}. {item}" for i, item in enumerate(answer)])
        elif input_type in ['multi_field', 'scale']:
            if isinstance(answer, dict):
                return json.dumps(answer)
        
        return str(answer)
    
    def _format_question(self, node: dict) -> dict:
        """Format question node for API response"""
        return {
            'id': node['id'],
            'text': node['text'],
            'input_type': node.get('input_type', 'text'),
            'options': node.get('options', []),
            'fields': node.get('fields', []),
            'required': node.get('required', False),
            'help_text': node.get('help_text'),
            'placeholder': node.get('placeholder'),
            'allow_other': node.get('allow_other', False),
            'validation': node.get('validation', {})
        }
    
    def _get_question_node(self, node_id: str) -> Optional[dict]:
        """Get a question node by ID"""
        return self.nodes_dict.get(node_id)
    
    def _calculate_progress(self, session_id: str) -> dict:
        """Calculate session progress"""
        # Count total question nodes
        total_questions = sum(1 for node in self.flow_config['nodes'] 
                            if node['type'] == 'question')
        
        # Count answered questions
        answered = len(self.answer_model.get_by_session(session_id))
        
        percentage = int((answered / total_questions) * 100) if total_questions > 0 else 0
        
        return {
            'current': answered,
            'total': total_questions,
            'percentage': percentage
        }
    
    def get_summary(self, session_id: str) -> dict:
        """Get session summary with all Q&A"""
        session = self.session_model.get(session_id)
        if not session:
            raise ValueError("Session not found")
        
        answers = self.answer_model.get_by_session(session_id)
        
        # Format answers with questions
        formatted_answers = []
        for answer in answers:
            node = self.nodes_dict.get(answer['question_id'])
            formatted_answers.append({
                'question_id': answer['question_id'],
                'question_text': answer.get('question_text', node.get('text', '') if node else ''),
                'answer': answer['answer_text'],
                'input_type': node.get('input_type', 'text') if node else 'text'
            })
        
        return {
            'session_id': session_id,
            'status': session['status'],
            'created_at': session['created_at'],
            'last_activity': session.get('last_activity'),
            'answers': formatted_answers
        }
