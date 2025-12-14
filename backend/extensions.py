"""
Extensions module to initialize Flask extensions.
This pattern prevents circular imports and keeps code modular.
"""
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS

# Initialize extensions (will be initialized in app.py)
db = SQLAlchemy()
jwt = JWTManager()
cors = CORS()

