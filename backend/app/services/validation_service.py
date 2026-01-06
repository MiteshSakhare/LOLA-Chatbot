"""
Validation service for question answers
Enhanced to support new input types: multi_field, ranking, scale
"""

class ValidationService:
    @staticmethod
    def validate_answer(question, answer):
        """
        Validate an answer against question requirements
        
        Args:
            question: Question node from flow_config
            answer: User's answer
            
        Returns:
            tuple: (is_valid, error_message)
        """
        input_type = question.get('input_type', 'text')
        required = question.get('required', False)
        
        # Check if answer exists when required
        if required:
            if answer is None or answer == '':
                return False, "This field is required"
            
            # Check for empty collections
            if input_type in ['multi_choice', 'ranking']:
                if isinstance(answer, list) and len(answer) == 0:
                    return False, "Please select at least one option"
            
            # Check for empty objects
            if input_type in ['multi_field', 'scale']:
                if isinstance(answer, dict):
                    if not answer:
                        return False, "Please fill in all fields"
                    if input_type == 'multi_field':
                        empty_fields = [k for k, v in answer.items() if not v or str(v).strip() == '']
                        if empty_fields:
                            return False, f"Please fill in: {', '.join(empty_fields)}"
                    if input_type == 'scale':
                        missing = [k for k, v in answer.items() if v is None]
                        if missing:
                            return False, "Please rate all items"
        
        # Type-specific validation
        if input_type == 'text':
            return ValidationService._validate_text(question, answer)
        elif input_type == 'single_choice':
            return ValidationService._validate_single_choice(question, answer)
        elif input_type == 'multi_choice':
            return ValidationService._validate_multi_choice(question, answer)
        elif input_type == 'multi_field':
            return ValidationService._validate_multi_field(question, answer)
        elif input_type == 'ranking':
            return ValidationService._validate_ranking(question, answer)
        elif input_type == 'scale':
            return ValidationService._validate_scale(question, answer)
        
        return True, None
    
    @staticmethod
    def _validate_text(question, answer):
        """Validate text input"""
        if not isinstance(answer, str):
            return False, "Invalid text format"
        
        validation = question.get('validation', {})
        
        # Min length
        if 'min_length' in validation:
            if len(answer) < validation['min_length']:
                return False, f"Minimum {validation['min_length']} characters required"
        
        # Max length
        if 'max_length' in validation:
            if len(answer) > validation['max_length']:
                return False, f"Maximum {validation['max_length']} characters allowed"
        
        # Pattern matching (if needed)
        if 'pattern' in validation:
            import re
            if not re.match(validation['pattern'], answer):
                return False, validation.get('pattern_message', 'Invalid format')
        
        return True, None
    
    @staticmethod
    def _validate_single_choice(question, answer):
        """Validate single choice input"""
        if not isinstance(answer, str):
            return False, "Invalid selection format"
        
        options = question.get('options', [])
        if answer not in options:
            return False, "Invalid option selected"
        
        return True, None
    
    @staticmethod
    def _validate_multi_choice(question, answer):
        """Validate multiple choice input"""
        if not isinstance(answer, list):
            return False, "Invalid selection format"
        
        options = question.get('options', [])
        validation = question.get('validation', {})
        
        # Check if all answers are valid options (or start with "Other:")
        for item in answer:
            if not (item in options or item.startswith('Other:')):
                return False, f"Invalid option: {item}"
        
        # Min selections
        if 'min_selections' in validation:
            if len(answer) < validation['min_selections']:
                return False, f"Please select at least {validation['min_selections']} option(s)"
        
        # Max selections
        if 'max_selections' in validation:
            if len(answer) > validation['max_selections']:
                return False, f"Please select at most {validation['max_selections']} option(s)"
        
        return True, None
    
    @staticmethod
    def _validate_multi_field(question, answer):
        """Validate multi-field input"""
        if not isinstance(answer, dict):
            return False, "Invalid format for multi-field answer"
        
        fields = question.get('fields', [])
        field_names = [f['name'] for f in fields]
        
        # Check if all required fields are present
        for field_name in field_names:
            if field_name not in answer:
                return False, f"Missing field: {field_name}"
        
        # Check for extra fields
        for key in answer.keys():
            if key not in field_names:
                return False, f"Unknown field: {key}"
        
        return True, None
    
    @staticmethod
    def _validate_ranking(question, answer):
        """Validate ranking input"""
        if not isinstance(answer, list):
            return False, "Invalid ranking format"
        
        options = question.get('options', [])
        
        # Check if ranking contains all options
        if set(answer) != set(options):
            return False, "Ranking must include all options exactly once"
        
        # Check for duplicates
        if len(answer) != len(set(answer)):
            return False, "Duplicate items in ranking"
        
        return True, None
    
    @staticmethod
    def _validate_scale(question, answer):
        """Validate scale/slider input"""
        if not isinstance(answer, dict):
            return False, "Invalid format for scale answer"
        
        fields = question.get('fields', [])
        
        for field in fields:
            field_name = field['name']
            if field_name not in answer:
                return False, f"Missing rating for: {field['label']}"
            
            value = answer[field_name]
            if not isinstance(value, (int, float)):
                return False, f"Invalid rating value for: {field['label']}"
            
            min_val = field.get('min', 1)
            max_val = field.get('max', 10)
            
            if value < min_val or value > max_val:
                return False, f"Rating for {field['label']} must be between {min_val} and {max_val}"
        
        return True, None
    
    @staticmethod
    def format_answer_for_display(input_type, answer):
        """
        Format answer for display/storage
        
        Args:
            input_type: Type of input
            answer: Raw answer
            
        Returns:
            str: Formatted answer
        """
        if answer is None or answer == '':
            return 'No answer provided'
        
        if input_type == 'multi_choice':
            if isinstance(answer, list):
                return ', '.join(answer)
        
        elif input_type == 'ranking':
            if isinstance(answer, list):
                return ', '.join([f"{i+1}. {item}" for i, item in enumerate(answer)])
        
        elif input_type == 'multi_field':
            if isinstance(answer, dict):
                return ' | '.join([f"{k}: {v}" for k, v in answer.items()])
        
        elif input_type == 'scale':
            if isinstance(answer, dict):
                return ' | '.join([f"{k}: {v}" for k, v in answer.items()])
        
        return str(answer)
