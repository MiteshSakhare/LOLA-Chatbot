"""
Integration tests for full user flow
"""
import pytest

def test_full_flow(client):
    """Test complete session flow"""
    # Start session
    response = client.post('/session/start')
    assert response.status_code == 201
    data = response.get_json()
    session_id = data['session_id']
    
    # Submit first answer
    response = client.post(f'/session/{session_id}/answer', json={
        'question_id': 'business_name_timezone',
        'answer': 'Test Corp, EST'
    })
    assert response.status_code == 200
    
    # Verify progress
    data = response.get_json()
    assert data['progress']['current'] == 2
    
    # Get summary
    response = client.get(f'/session/{session_id}/summary')
    assert response.status_code == 200
    data = response.get_json()
    assert 'business_name_timezone' in data['answers']
