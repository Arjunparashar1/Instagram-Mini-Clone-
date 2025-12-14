"""
User-related routes for profile viewing and follow/unfollow functionality.
Demonstrates many-to-many relationships and protected routes.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.extensions import db
from backend.models import User, Post, follows

users_bp = Blueprint('users', __name__, url_prefix='/api/users')


@users_bp.route('/<username>', methods=['GET'])
@jwt_required(optional=True)  # Optional: allows viewing profiles without login
def get_user_profile(username):
    """
    Get user profile with posts, followers, and following counts.
    Shows follow status if current user is logged in.
    """
    try:
        user = User.query.filter_by(username=username).first()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        current_user_id = get_jwt_identity()  # None if not logged in
        
        # Get followers and following counts
        followers_count = user.followers.count()
        following_count = user.following.count()
        
        # Check if current user is following this user
        is_following = False
        if current_user_id:
            current_user = User.query.get(current_user_id)
            if current_user:
                is_following = current_user.following.filter_by(id=user.id).first() is not None
        
        # Get user's posts (limit to recent posts for performance)
        posts = user.posts.order_by(Post.created_at.desc()).limit(50).all()
        
        profile_data = user.to_dict()
        profile_data.update({
            'followers_count': followers_count,
            'following_count': following_count,
            'is_following': is_following,
            'is_own_profile': current_user_id == user.id,
            'posts': [post.to_dict(current_user_id) for post in posts]
        })
        
        return jsonify(profile_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@users_bp.route('/follow/<int:user_id>', methods=['POST'])
@jwt_required()  # Protected route: requires valid JWT token
def follow_user(user_id):
    """
    Follow a user endpoint.
    Creates a many-to-many relationship between current user and target user.
    """
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        target_user = User.query.get(user_id)
        
        if not target_user:
            return jsonify({'error': 'User not found'}), 404
        
        # Prevent self-follow
        if current_user_id == user_id:
            return jsonify({'error': 'Cannot follow yourself'}), 400
        
        # Check if already following
        if current_user.following.filter_by(id=user_id).first():
            return jsonify({'error': 'Already following this user'}), 400
        
        # Add follow relationship (many-to-many)
        current_user.following.append(target_user)
        db.session.commit()
        
        return jsonify({
            'message': f'Successfully followed {target_user.username}',
            'followers_count': target_user.followers.count()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@users_bp.route('/unfollow/<int:user_id>', methods=['DELETE'])
@jwt_required()  # Protected route: requires valid JWT token
def unfollow_user(user_id):
    """
    Unfollow a user endpoint.
    Removes the many-to-many relationship between current user and target user.
    """
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        target_user = User.query.get(user_id)
        
        if not target_user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if currently following
        if not current_user.following.filter_by(id=user_id).first():
            return jsonify({'error': 'Not following this user'}), 400
        
        # Remove follow relationship
        current_user.following.remove(target_user)
        db.session.commit()
        
        return jsonify({
            'message': f'Successfully unfollowed {target_user.username}',
            'followers_count': target_user.followers.count()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@users_bp.route('/<int:user_id>/followers', methods=['GET'])
@jwt_required(optional=True)
def get_followers(user_id):
    """Get list of users following a specific user."""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        followers = [follower.to_dict() for follower in user.followers.all()]
        return jsonify({'followers': followers, 'count': len(followers)}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@users_bp.route('/<int:user_id>/following', methods=['GET'])
@jwt_required(optional=True)
def get_following(user_id):
    """Get list of users that a specific user is following."""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        following = [followed.to_dict() for followed in user.following.all()]
        return jsonify({'following': following, 'count': len(following)}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

