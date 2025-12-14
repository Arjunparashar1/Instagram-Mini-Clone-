"""
Routes package initialization.
Registers all blueprints for modular route organization.
"""
from backend.routes.auth import auth_bp
from backend.routes.users import users_bp
from backend.routes.posts import posts_bp

__all__ = ['auth_bp', 'users_bp', 'posts_bp']

