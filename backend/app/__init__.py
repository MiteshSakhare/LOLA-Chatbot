import json
import os
from flask import Flask, jsonify
from flask_cors import CORS
from .models import Database, Session, Answer
from .services.session_service import SessionService
from .services.validation_service import ValidationService

def create_app():
    app = Flask(__name__)
    
    # Enable CORS
    CORS(app, resources={
        r"/*": {
            "origins": ["http://localhost:5173", "http://localhost:3000"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type"]
        }
    })
    
    # Load flow configuration
    flow_config_path = os.path.join(os.path.dirname(__file__), 'flow_config.json')
    with open(flow_config_path, 'r') as f:
        flow_config = json.load(f)
    
    # Initialize database and models
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'lola.db')
    db = Database(db_path)
    session_model = Session(db)
    answer_model = Answer(db)
    
    # Initialize services
    session_service = SessionService(flow_config, session_model, answer_model)
    validation_service = ValidationService()
    
    # Store in app config for access in routes
    app.config['SESSION_SERVICE'] = session_service
    app.config['VALIDATION_SERVICE'] = validation_service
    app.config['SESSION_MODEL'] = session_model
    app.config['ANSWER_MODEL'] = answer_model
    
    # Register blueprints
    from .routes import session, admin
    
    # Initialize services/models in routes
    session.init_service(session_service)
    admin.init_models(session_model, answer_model)
    
    app.register_blueprint(session.bp)
    app.register_blueprint(admin.bp)
    
    # ✅ ADD ROOT ROUTE HERE
    @app.route('/')
    def index():
        """API information endpoint"""
        return jsonify({
            'status': 'running',
            'service': 'Lola Discovery Chatbot API',
            'version': '1.0',
            'endpoints': {
                'session': {
                    'start': 'POST /session/start',
                    'submit_answer': 'POST /session/<session_id>/answer',
                    'get_summary': 'GET /session/summary/<session_id>'
                },
                'admin': {
                    'list_responses': 'GET /admin/responses?page=1&per_page=20',
                    'get_response': 'GET /admin/response/<session_id>',
                    'delete_response': 'DELETE /admin/response/<session_id>',
                    'export': 'GET /admin/export?format=csv',
                    'cleanup': 'POST /admin/cleanup?minutes=30'
                }
            },
            'frontend': 'http://localhost:5173',
            'docs': 'Access the frontend to start using the chatbot'
        }), 200
    
    # Health check endpoint
    @app.route('/health')
    def health():
        """Health check endpoint"""
        return jsonify({'status': 'healthy', 'timestamp': str(db_path)}), 200
    
    return app
