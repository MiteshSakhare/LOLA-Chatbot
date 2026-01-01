"""
Test session management functionality
"""
import pytest
import json

class TestSessionAPI:
    """Test session API endpoints"""
    
    def test_start_session(self, client):
        """Test starting a new session"""
        response = client.post('/session/start')
        assert response.status_code == 201
        
        data = response.get_json()
        assert 'session_id' in data
        assert 'question' in data
        assert 'progress' in data
        
        # Verify first question
        assert data['question']['id'] == 'business_name_timezone'
        assert data['question']['type'] == 'text'
        assert data['progress']['current'] == 1
    
    def test_submit_valid_answer(self, client):
        """Test submitting a valid answer"""
        # Start session
        response = client.post('/session/start')
        session_id = response.get_json()['session_id']
        
        # Submit answer
        response = client.post(
            f'/session/{session_id}/answer',
            json={
                'question_id': 'business_name_timezone',
                'answer': 'Test Business, PST'
            },
            content_type='application/json'
        )
        
        assert response.status_code == 200
        data = response.get_json()
        
        # Should return next question
        assert 'question' in data
        assert data['question']['id'] == 'vertical'
        assert data['progress']['current'] == 2
    
    def test_submit_invalid_answer(self, client):
        """Test submitting invalid answer"""
        response = client.post('/session/start')
        session_id = response.get_json()['session_id']
        
        # Submit too short answer
        response = client.post(
            f'/session/{session_id}/answer',
            json={
                'question_id': 'business_name_timezone',
                'answer': 'A'
            },
            content_type='application/json'
        )
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data
    
    def test_submit_missing_fields(self, client):
        """Test submitting with missing fields"""
        response = client.post('/session/start')
        session_id = response.get_json()['session_id']
        
        response = client.post(
            f'/session/{session_id}/answer',
            json={'question_id': 'business_name_timezone'},
            content_type='application/json'
        )
        
        assert response.status_code == 400
    
    def test_get_summary(self, client):
        """Test getting session summary"""
        # Start session and submit answer
        response = client.post('/session/start')
        session_id = response.get_json()['session_id']
        
        client.post(
            f'/session/{session_id}/answer',
            json={
                'question_id': 'business_name_timezone',
                'answer': 'Test Corp, EST'
            },
            content_type='application/json'
        )
        
        # Get summary
        response = client.get(f'/session/{session_id}/summary')
        assert response.status_code == 200
        
        data = response.get_json()
        assert data['session_id'] == session_id
        assert 'business_name_timezone' in data['answers']
        assert data['answers']['business_name_timezone'] == 'Test Corp, EST'
    
    def test_invalid_session_id(self, client):
        """Test with invalid session ID"""
        response = client.post(
            '/session/invalid-id/answer',
            json={
                'question_id': 'business_name_timezone',
                'answer': 'Test'
            },
            content_type='application/json'
        )
        
        assert response.status_code == 404


class TestSessionModel:
    """Test session model"""
    
    def test_create_session(self, session_model):
        """Test creating a session"""
        session = session_model.create(
            'test-session-id',
            '127.0.0.1',
            'Mozilla/5.0'
        )
        
        assert session is not None
        assert session['id'] == 'test-session-id'
        assert session['status'] == 'in_progress'
    
    def test_get_session(self, session_model):
        """Test getting a session"""
        session_model.create('test-id', '127.0.0.1', 'Mozilla')
        session = session_model.get('test-id')
        
        assert session is not None
        assert session['id'] == 'test-id'
    
    def test_update_status(self, session_model):
        """Test updating session status"""
        session_model.create('test-id', '127.0.0.1', 'Mozilla')
        session_model.update_status('test-id', 'completed')
        
        session = session_model.get('test-id')
        assert session['status'] == 'completed'
    
    def test_list_sessions(self, session_model):
        """Test listing sessions"""
        # Create multiple sessions
        for i in range(5):
            session_model.create(f'test-{i}', '127.0.0.1', 'Mozilla')
        
        sessions = session_model.list_all(limit=3)
        assert len(sessions) == 3
    
    def test_count_sessions(self, session_model):
        """Test counting sessions"""
        for i in range(3):
            session_model.create(f'test-{i}', '127.0.0.1', 'Mozilla')
        
        count = session_model.count()
        assert count == 3


class TestAnswerModel:
    """Test answer model"""
    
    def test_save_answer(self, session_model, answer_model):
        """Test saving an answer"""
        session_model.create('test-session', '127.0.0.1', 'Mozilla')
        answer_model.save('test-session', 'question1', 'answer1')
        
        answer = answer_model.get('test-session', 'question1')
        assert answer == 'answer1'
    
    def test_update_answer(self, session_model, answer_model):
        """Test updating an answer"""
        session_model.create('test-session', '127.0.0.1', 'Mozilla')
        answer_model.save('test-session', 'question1', 'answer1')
        answer_model.save('test-session', 'question1', 'answer2')
        
        answer = answer_model.get('test-session', 'question1')
        assert answer == 'answer2'
    
    def test_get_answers_by_session(self, session_model, answer_model):
        """Test getting all answers for a session"""
        session_model.create('test-session', '127.0.0.1', 'Mozilla')
        answer_model.save('test-session', 'q1', 'a1')
        answer_model.save('test-session', 'q2', 'a2')
        answer_model.save('test-session', 'q3', 'a3')
        
        answers = answer_model.get_by_session('test-session')
        assert len(answers) == 3
        assert any(a['question_id'] == 'q1' for a in answers)


class TestCompleteFlow:
    """Test complete user flow"""
    
    def test_full_12_question_flow(self, client):
        """Test completing all 12 questions"""
        # Start session
        response = client.post('/session/start')
        session_id = response.get_json()['session_id']
        
        # Define all answers
        answers = [
            ('business_name_timezone', 'Acme Corp, PST'),
            ('vertical', 'Retail'),
            ('brand', 'Modern minimalist design with blue and white colors'),
            ('success', 'Grow revenue'),
            ('revenue', '$1m-$5m'),
            ('retention_reason', ['Awesome product', 'Great price']),
            ('dropoff_stage', 'During check-out'),
            ('dropoff_reason', 'Price'),
            ('email_role', 'Revenue engine'),
            ('email_performance', ['Awareness', 'Conversion moment']),
            ('ideal_customer', 'Age: 25-40, Gender: All, Income: $50k-$100k, Location: Urban areas, Values: Sustainable and organic'),
            ('top_goals', ['Increase repeat purchases', 'Boost revenue', 'Improve email engagement'])
        ]
        
        # Submit all answers
        for question_id, answer in answers[:-1]:  # All but last
            response = client.post(
                f'/session/{session_id}/answer',
                json={'question_id': question_id, 'answer': answer},
                content_type='application/json'
            )
            assert response.status_code == 200
        
        # Submit last answer - should complete
        response = client.post(
            f'/session/{session_id}/answer',
            json={'question_id': answers[-1][0], 'answer': answers[-1][1]},
            content_type='application/json'
        )
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['completed'] is True
        assert data['progress']['percentage'] == 100
        
        # Verify summary
        summary = data['summary']
        assert len(summary['answers']) == 12
        assert summary['status'] == 'completed'
