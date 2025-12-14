"""
Main Flask application entry point for InstaMini.
Initializes extensions, registers blueprints, and sets up error handling.
"""
import sys
import os
from pathlib import Path

# Add parent directory to Python path to allow imports
# This allows running the app from the backend directory
parent_dir = Path(__file__).parent.parent
if str(parent_dir) not in sys.path:
    sys.path.insert(0, str(parent_dir))

from flask import Flask, jsonify, request
from backend.config import Config
from backend.extensions import db, jwt, cors
from backend.routes import auth_bp, users_bp, posts_bp
from backend.models import User, Post, Comment, follows, likes


def create_app(config_class=Config):
    """
    Application factory pattern for creating Flask app instance.
    This pattern allows for easy testing and configuration management.
    """
    # Configure Flask app with static folder for serving uploaded files
    # static_folder is relative to the backend directory
    backend_dir = Path(__file__).parent
    app = Flask(__name__, static_folder=str(backend_dir / 'static'), static_url_path='/static')
    app.config.from_object(config_class)
    
    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app, origins=app.config['CORS_ORIGINS'], supports_credentials=True)
    
    # Register blueprints for modular route organization
    app.register_blueprint(auth_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(posts_bp)
    
    # Create database tables (for development; use migrations in production)
    with app.app_context():
        db.create_all()
    
    # Error handlers for consistent API responses
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'error': 'Resource not found',
            'path': request.path,
            'method': request.method
        }), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
    
    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({'error': 'Unauthorized. Please login.'}), 401
    
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({'error': 'Bad request'}), 400
    
    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({'status': 'healthy', 'message': 'InstaMini API is running'}), 200
    
    # Debug endpoint to list all available routes (useful for development)
    @app.route('/api/routes', methods=['GET'])
    def list_routes():
        """List all available API routes for debugging."""
        routes = []
        for rule in app.url_map.iter_rules():
            if rule.endpoint != 'static':
                routes.append({
                    'endpoint': rule.endpoint,
                    'path': str(rule),
                    'methods': list(rule.methods - {'HEAD', 'OPTIONS'})
                })
        return jsonify({'routes': routes}), 200
    
    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)

