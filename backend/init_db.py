"""
Database initialization script.
Creates all database tables if they don't exist.
Run this script to initialize the database before starting the app.
"""
from backend.app import create_app
from backend.extensions import db

app = create_app()

with app.app_context():
    db.create_all()
    print("Database initialized successfully!")
    print("Tables created: User, Post, Comment, Follows, Likes")
