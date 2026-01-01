"""
Pytest configuration and shared fixtures
"""
import pytest
import tempfile
import os
from pathlib import Path
from app import create_app
from app.config import Config
from app.models import Database, Session, Answer

class TestConfig(Config):
    """Test configuration"""
    TESTING = True
    SECRET_KEY = 'test-secret-key'
    
    def __init__(self):
        super().__init__()
        # Create a temporary database file for testing
        self.temp_db = tempfile.NamedTemporaryFile(delete=False, suffix='.db')
        self.DATABASE_PATH = self.temp_db.name
        # Use the real flow_config.json
        self.FLOW_CONFIG_PATH = Path(__file__).parent.parent / 'app' / 'flow_config.json'

@pytest.fixture(scope='function')
def app():
    """Create test application"""
    config = TestConfig()
    app = create_app(config)
    
    yield app
    
    # Cleanup: remove temporary database
    try:
        os.unlink(config.DATABASE_PATH)
    except:
        pass

@pytest.fixture
def client(app):
    """Create test client"""
    return app.test_client()

@pytest.fixture(scope='function')
def db():
    """Create test database"""
    temp_db = tempfile.NamedTemporaryFile(delete=False, suffix='.db')
    database = Database(temp_db.name)
    
    yield database
    
    # Cleanup
    try:
        os.unlink(temp_db.name)
    except:
        pass

@pytest.fixture
def session_model(db):
    """Create session model"""
    return Session(db)

@pytest.fixture
def answer_model(db):
    """Create answer model"""
    return Answer(db)
