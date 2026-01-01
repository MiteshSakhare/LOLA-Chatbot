import pytest
from app.services.validation_service import ValidationService

@pytest.fixture
def flow_config():
    return {
        "questions": [
            {
                "id": "test_text",
                "type": "text",
                "required": True,
                "validation": {"min_length": 5, "max_length": 100}
            },
            {
                "id": "test_choice",
                "type": "single_choice",
                "required": True,
                "options": ["A", "B", "C"]
            },
            {
                "id": "test_multi",
                "type": "multi_choice",
                "required": True,
                "options": ["X", "Y", "Z"],
                "validation": {"min_selections": 2, "max_selections": 3}
            }
        ]
    }

def test_text_validation(flow_config):
    validator = ValidationService(flow_config)
    
    # Valid
    valid, _ = validator.validate_answer("test_text", "Hello World")
    assert valid
    
    # Too short
    valid, msg = validator.validate_answer("test_text", "Hi")
    assert not valid
    assert "at least 5" in msg
    
    # Empty
    valid, msg = validator.validate_answer("test_text", "")
    assert not valid

def test_single_choice_validation(flow_config):
    validator = ValidationService(flow_config)
    
    # Valid
    valid, _ = validator.validate_answer("test_choice", "A")
    assert valid
    
    # Invalid option
    valid, msg = validator.validate_answer("test_choice", "D")
    assert not valid
    assert "Invalid option" in msg

def test_multi_choice_validation(flow_config):
    validator = ValidationService(flow_config)
    
    # Valid
    valid, _ = validator.validate_answer("test_multi", ["X", "Y"])
    assert valid
    
    # Too few selections
    valid, msg = validator.validate_answer("test_multi", ["X"])
    assert not valid
    assert "at least 2" in msg
    
    # Invalid option
    valid, msg = validator.validate_answer("test_multi", ["X", "Y", "Invalid"])
    assert not valid

def test_sanitization(flow_config):
    validator = ValidationService(flow_config)
    
    # Text sanitization
    sanitized = validator.sanitize_answer("  test  ")
    assert sanitized == "test"
    
    # List sanitization
    sanitized = validator.sanitize_answer(["  item1  ", "item2"])
    assert sanitized == ["item1", "item2"]
