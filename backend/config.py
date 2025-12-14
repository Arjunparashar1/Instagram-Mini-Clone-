"""
Configuration module for InstaMini backend.
Handles environment variables and Flask app configuration.
"""
import os
from datetime import timedelta
from pathlib import Path

class Config:
    """Base configuration class with default settings."""
    
    # Database configuration
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///instamini.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT configuration for secure token-based authentication
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'your-secret-key-change-in-production'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)  # Token expires in 24 hours
    
    # CORS configuration for frontend communication
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:5173').split(',')
    
    # File upload configuration
    BASE_DIR = Path(__file__).parent.parent
    UPLOAD_FOLDER = BASE_DIR / 'backend' / 'static' / 'profile_pics'
    POST_IMAGES_FOLDER = BASE_DIR / 'backend' / 'static' / 'post_images'
    MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # 5MB max file size
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

