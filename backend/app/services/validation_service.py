import json
from typing import Dict, Any, List, Tuple

class ValidationService:
    """Validates user inputs based on question configuration"""
    
    def __init__(self, flow_config: Dict[str, Any]):
        self.questions = {q['id']: q for q in flow_config['questions']}
    
    def validate_answer(self, question_id: str, answer: Any) -> Tuple[bool, str]:
        """
        Validate answer for a given question
        Returns: (is_valid, error_message)
        """
        if question_id not in self.questions:
            return False, "Invalid question ID"
        
        question = self.questions[question_id]
        
        # Check required
        if question['required']:
            if answer is None or answer == "" or (isinstance(answer, list) and len(answer) == 0):
                return False, "This question is required"
        
        # Type-specific validation
        if question['type'] == 'text':
            return self._validate_text(answer, question.get('validation', {}))
        elif question['type'] == 'single_choice':
            return self._validate_single_choice(answer, question.get('options', []))
        elif question['type'] == 'multi_choice':
            return self._validate_multi_choice(answer, question.get('options', []), question.get('validation', {}))
        
        return True, ""
    
    def _validate_text(self, answer: str, validation: Dict) -> Tuple[bool, str]:
        """Validate text input"""
        if not isinstance(answer, str):
            return False, "Answer must be text"
        
        answer = answer.strip()
        min_length = validation.get('min_length', 0)
        max_length = validation.get('max_length', 10000)
        
        if len(answer) < min_length:
            return False, f"Answer must be at least {min_length} characters"
        if len(answer) > max_length:
            return False, f"Answer must not exceed {max_length} characters"
        
        return True, ""
    
    def _validate_single_choice(self, answer: str, options: List[str]) -> Tuple[bool, str]:
        """Validate single choice"""
        if not isinstance(answer, str):
            return False, "Answer must be a string"
        
        if answer not in options:
            return False, f"Invalid option. Must be one of: {', '.join(options)}"
        
        return True, ""
    
    def _validate_multi_choice(self, answer: List[str], options: List[str], validation: Dict) -> Tuple[bool, str]:
        """Validate multi choice"""
        if not isinstance(answer, list):
            return False, "Answer must be a list"
        
        # Check all selections are valid
        for item in answer:
            if item not in options:
                return False, f"Invalid option: {item}"
        
        # Check min/max selections
        min_sel = validation.get('min_selections', 0)
        max_sel = validation.get('max_selections', len(options))
        
        if len(answer) < min_sel:
            return False, f"Please select at least {min_sel} option(s)"
        if len(answer) > max_sel:
            return False, f"Please select at most {max_sel} option(s)"
        
        return True, ""
    
    def sanitize_answer(self, answer: Any) -> Any:
        """Sanitize user input"""
        if isinstance(answer, str):
            return answer.strip()[:10000]  # Max length protection
        elif isinstance(answer, list):
            return [str(item).strip()[:500] for item in answer if item][:20]  # Max 20 items
        return answer
