import json
from flask import Flask
from flask_cors import CORS
from app.config import Config
from app.models import Database, Session, Answer
from app.services.session_service import SessionService
from app.routes import session, admin

def create_app(config_class=Config):
    """Application factory"""
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Enable CORS with proper configuration
    CORS(app, resources={
        r"/*": {
            "origins": ["http://localhost:5173", "http://127.0.0.1:5173"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type"],
        }
    })
    
    # Initialize database
    db = Database(str(config_class.DATABASE_PATH))
    
    # Load flow configuration
    with open(config_class.FLOW_CONFIG_PATH, 'r') as f:
        flow_config = json.load(f)
    
    # Initialize services and models
    session_service = SessionService(db, flow_config)
    session_model = Session(db)
    answer_model = Answer(db)
    
    # Initialize blueprints with dependencies
    session.init_service(session_service)
    admin.init_models(session_model, answer_model)
    
    # Register blueprints
    app.register_blueprint(session.bp)
    app.register_blueprint(admin.bp)
    
    # Health check
    @app.route('/health', methods=['GET'])
    def health():
        return {'status': 'healthy'}, 200
    
    # Root route
    @app.route('/', methods=['GET'])
    def index():
        return {'message': 'Lola Discovery Chatbot API', 'version': '1.0.0'}, 200
    
    return app
