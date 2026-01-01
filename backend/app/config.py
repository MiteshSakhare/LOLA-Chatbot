import os
from pathlib import Path

class Config:
    """Application configuration"""
    BASE_DIR = Path(__file__).parent.parent
    DATABASE_PATH = os.getenv('DATABASE_PATH', BASE_DIR / 'data' / 'lola.db')
    FLOW_CONFIG_PATH = BASE_DIR / 'app' / 'flow_config.json'
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:5173').split(',')
    MAX_SESSIONS_PER_IP = int(os.getenv('MAX_SESSIONS_PER_IP', '10'))
    SESSION_TIMEOUT_HOURS = int(os.getenv('SESSION_TIMEOUT_HOURS', '24'))
