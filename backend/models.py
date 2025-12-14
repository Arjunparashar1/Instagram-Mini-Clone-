"""
Database models for InstaMini.
Defines all database tables and relationships using SQLAlchemy ORM.
"""
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from backend.extensions import db

# Association tables for many-to-many relationships
# These are intermediate tables that connect users to users (follows) and users to posts (likes)

# Follow relationship: Many-to-many between users (a user can follow many users, and be followed by many)
follows = db.Table(
    'follows',
    db.Column('follower_id', db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), primary_key=True),
    db.Column('followed_id', db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), primary_key=True),
    db.UniqueConstraint('follower_id', 'followed_id', name='unique_follow')  # Prevent duplicate follows
)

# Like relationship: Many-to-many between users and posts
likes = db.Table(
    'likes',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), primary_key=True),
    db.Column('post_id', db.Integer, db.ForeignKey('post.id', ondelete='CASCADE'), primary_key=True),
    db.UniqueConstraint('user_id', 'post_id', name='unique_like')  # Prevent duplicate likes
)


class User(db.Model):
    """
    User model representing registered users in the system.
    Includes authentication fields and relationships to posts, follows, and likes.
    """
    __tablename__ = 'user'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    profile_pic_url = db.Column(db.String(500), default='https://via.placeholder.com/150')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    # One-to-many: A user can have many posts
    posts = db.relationship('Post', backref='author', lazy='dynamic', cascade='all, delete-orphan')
    
    # Many-to-many: Users following this user (followers)
    followers = db.relationship(
        'User',
        secondary=follows,
        primaryjoin=(follows.c.followed_id == id),
        secondaryjoin=(follows.c.follower_id == id),
        backref=db.backref('following', lazy='dynamic'),
        lazy='dynamic'
    )
    
    # Many-to-many: Posts liked by this user
    liked_posts = db.relationship('Post', secondary=likes, backref=db.backref('liked_by', lazy='dynamic'))
    
    # One-to-many: Comments made by this user
    comments = db.relationship('Comment', backref='author', lazy='dynamic', cascade='all, delete-orphan')
    
    def set_password(self, password):
        """Hash and store password securely using Werkzeug."""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Verify password against stored hash."""
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        """Convert user object to dictionary for JSON responses."""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'profile_pic_url': self.profile_pic_url,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<User {self.username}>'


class Post(db.Model):
    """
    Post model representing user-created posts with images and captions.
    Each post belongs to one user and can have many likes and comments.
    """
    __tablename__ = 'post'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), nullable=False, index=True)
    image_url = db.Column(db.String(500), nullable=False)
    caption = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    # One-to-many: A post can have many comments
    comments = db.relationship('Comment', backref='post', lazy='dynamic', cascade='all, delete-orphan', order_by='Comment.created_at')
    
    def get_like_count(self):
        """Get the number of likes for this post."""
        return self.liked_by.count()
    
    def is_liked_by(self, user_id):
        """Check if a specific user has liked this post."""
        if not user_id:
            return False
        return self.liked_by.filter_by(id=user_id).first() is not None
    
    def to_dict(self, current_user_id=None):
        """Convert post object to dictionary for JSON responses."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'username': self.author.username if self.author else None,
            'profile_pic_url': self.author.profile_pic_url if self.author else None,
            'image_url': self.image_url,
            'caption': self.caption,
            'like_count': self.get_like_count(),
            'is_liked': self.is_liked_by(current_user_id),
            'comment_count': self.comments.count(),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<Post {self.id} by User {self.user_id}>'


class Comment(db.Model):
    """
    Comment model representing user comments on posts.
    Each comment belongs to one user and one post.
    """
    __tablename__ = 'comment'
    
    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey('post.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), nullable=False)
    text = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Convert comment object to dictionary for JSON responses."""
        return {
            'id': self.id,
            'post_id': self.post_id,
            'user_id': self.user_id,
            'username': self.author.username if self.author else None,
            'profile_pic_url': self.author.profile_pic_url if self.author else None,
            'text': self.text,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<Comment {self.id} on Post {self.post_id}>'

