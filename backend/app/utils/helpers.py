"""
Helper utility functions
"""
import re
import json
import uuid
from datetime import datetime
from typing import Any, Optional
from flask import Request

def sanitize_input(text: str, max_length: int = 10000) -> str:
    """
    Sanitize user input to prevent injection attacks
    
    Args:
        text: Input text to sanitize
        max_length: Maximum allowed length
        
    Returns:
        Sanitized string
    """
    if not isinstance(text, str):
        return ""
    
    # Remove null bytes
    text = text.replace('\x00', '')
    
    # Strip whitespace
    text = text.strip()
    
    # Limit length
    text = text[:max_length]
    
    return text


def format_timestamp(dt: Optional[datetime] = None) -> str:
    """
    Format datetime to ISO 8601 string
    
    Args:
        dt: Datetime object (defaults to now)
        
    Returns:
        ISO formatted string
    """
    if dt is None:
        dt = datetime.utcnow()
    return dt.isoformat() + 'Z'


def generate_session_id() -> str:
    """
    Generate a unique session ID
    
    Returns:
        UUID4 string
    """
    return str(uuid.uuid4())


def parse_json_safe(text: str) -> Any:
    """
    Safely parse JSON string
    
    Args:
        text: JSON string to parse
        
    Returns:
        Parsed object or original string if parsing fails
    """
    try:
        return json.loads(text)
    except (json.JSONDecodeError, TypeError):
        return text


def validate_session_id_format(session_id: str) -> bool:
    """
    Validate session ID format (UUID4)
    
    Args:
        session_id: Session ID to validate
        
    Returns:
        True if valid UUID4 format
    """
    uuid_pattern = re.compile(
        r'^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
        re.IGNORECASE
    )
    return bool(uuid_pattern.match(session_id))


def get_client_ip(request: Request) -> str:
    """
    Get client IP address from request
    Handles proxy forwarding headers
    
    Args:
        request: Flask request object
        
    Returns:
        Client IP address
    """
    # Check for proxy headers first
    forwarded_for = request.headers.get('X-Forwarded-For')
    if forwarded_for:
        # X-Forwarded-For can contain multiple IPs, take the first one
        return forwarded_for.split(',')[0].strip()
    
    real_ip = request.headers.get('X-Real-IP')
    if real_ip:
        return real_ip
    
    # Fallback to direct connection IP
    return request.remote_addr or 'unknown'


def truncate_text(text: str, max_length: int = 100, suffix: str = '...') -> str:
    """
    Truncate text to maximum length
    
    Args:
        text: Text to truncate
        max_length: Maximum length
        suffix: Suffix to add if truncated
        
    Returns:
        Truncated text
    """
    if len(text) <= max_length:
        return text
    return text[:max_length - len(suffix)] + suffix


def is_valid_email(email: str) -> bool:
    """
    Basic email validation
    
    Args:
        email: Email address to validate
        
    Returns:
        True if valid email format
    """
    email_pattern = re.compile(
        r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    )
    return bool(email_pattern.match(email))


def chunk_list(items: list, chunk_size: int) -> list:
    """
    Split list into chunks
    
    Args:
        items: List to chunk
        chunk_size: Size of each chunk
        
    Returns:
        List of chunks
    """
    return [items[i:i + chunk_size] for i in range(0, len(items), chunk_size)]


def safe_dict_get(d: dict, keys: list, default: Any = None) -> Any:
    """
    Safely get nested dictionary value
    
    Args:
        d: Dictionary to search
        keys: List of keys to traverse
        default: Default value if key not found
        
    Returns:
        Value or default
    """
    current = d
    for key in keys:
        if not isinstance(current, dict) or key not in current:
            return default
        current = current[key]
    return current
