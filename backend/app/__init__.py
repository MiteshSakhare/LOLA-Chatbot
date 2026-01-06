import json
import os
from datetime import datetime
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
    
    # Store in app config
    app.config['SESSION_SERVICE'] = session_service
    app.config['VALIDATION_SERVICE'] = validation_service
    app.config['SESSION_MODEL'] = session_model
    app.config['ANSWER_MODEL'] = answer_model
    
    # Register blueprints
    from .routes import session, admin
    
    session.init_service(session_service)
    admin.init_models(session_model, answer_model)
    
    app.register_blueprint(session.bp)
    app.register_blueprint(admin.bp)
    
    # Root route
    @app.route('/')
    def index():
        """API information endpoint"""
        return jsonify({
            'status': 'running',
            'service': 'Lola Discovery Chatbot API',
            'version': '2.0',
            'features': [
                'Auto-cleanup after 5 minutes of inactivity',
                'Session recovery',
                'IST timezone support'
            ],
            'endpoints': {
                'session': {
                    'start': 'POST /session/start',
                    'submit_answer': 'POST /session/<id>/answer',
                    'get_summary': 'GET /session/summary/<id>'
                },
                'admin': {
                    'list_responses': 'GET /admin/responses',
                    'delete_response': 'DELETE /admin/response/<id>',
                    'export_csv': 'GET /admin/export',
                    'cleanup': 'POST /admin/cleanup?minutes=5'
                }
            }
        }), 200
    
    # Health check
    @app.route('/health')
    def health():
        """Health check endpoint"""
        return jsonify({
            'status': 'healthy',
            'database': str(db_path),
            'auto_cleanup': 'enabled (5 minutes)',
            'timezone': 'IST'
        }), 200
    
    # Auto-cleanup scheduler (5 minutes)
    import atexit
    from apscheduler.schedulers.background import BackgroundScheduler
    
    def cleanup_stale_sessions():
        """Clean up sessions stale for more than 5 minutes"""
        with app.app_context():
            try:
                deleted = session_model.cleanup_stale(minutes=5)
                current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                if deleted > 0:
                    print(f"[{current_time}] 🗑️ AUTO-CLEANUP: Deleted {deleted} stale session(s)")
                else:
                    print(f"[{current_time}] ✅ AUTO-CLEANUP: No stale sessions")
            except Exception as e:
                print(f"[AUTO-CLEANUP ERROR]: {e}")
    
    # Only run scheduler in main process
    if os.environ.get('WERKZEUG_RUN_MAIN') == 'true' or not app.debug:
        scheduler = BackgroundScheduler()
        scheduler.add_job(
            func=cleanup_stale_sessions,
            trigger="interval",
            minutes=5,
            id='cleanup_stale_sessions',
            replace_existing=True
        )
        scheduler.start()
        print("✅ Auto-cleanup scheduler started (5-minute intervals)")
        atexit.register(lambda: scheduler.shutdown())
    
    return app
