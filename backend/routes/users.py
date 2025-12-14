"""
User-related routes for profile viewing and follow/unfollow functionality.
Demonstrates many-to-many relationships and protected routes.
"""
import os
import uuid
from werkzeug.utils import secure_filename
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.extensions import db
from backend.models import User, Post, follows

users_bp = Blueprint('users', __name__, url_prefix='/api/users')


def allowed_file(filename):
    """Check if file extension is allowed."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']


@users_bp.route('', methods=['GET'])
@jwt_required()  # Protected route: requires authentication to discover users
def get_all_users():
    """
    Get all users (except current user) for discover/explore page.
    Returns list of users with followers_count, following_count, and is_following status.
    """
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get all users except the current user
        all_users = User.query.filter(User.id != current_user_id).all()
        
        # Build response with follow status and counts
        users_data = []
        for user in all_users:
            followers_count = user.followers.count()
            following_count = user.following.count()
            is_following = current_user.following.filter_by(id=user.id).first() is not None
            
            user_dict = user.to_dict()
            user_dict.update({
                'followers_count': followers_count,
                'following_count': following_count,
                'is_following': is_following
            })
            users_data.append(user_dict)
        
        return jsonify({'users': users_data, 'count': len(users_data)}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


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
        # This queries all posts by the specific user (user.posts relationship)
        # Ordered by newest first, limited to 50 for initial profile load
        # Note: This correctly fetches posts for the profile being viewed, not the current user
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


@users_bp.route('/profile-image', methods=['PUT', 'PATCH'])
@jwt_required()  # Protected route: requires valid JWT token
def update_profile_image():
    """
    Update user's profile picture endpoint.
    Validates image URL and updates the user's profile_pic_url field.
    """
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Validate required field
        if not data or 'profile_image' not in data:
            return jsonify({'error': 'profile_image field is required'}), 400
        
        profile_image_url = data['profile_image'].strip()
        
        # Validate that it's a non-empty string
        if not profile_image_url or not isinstance(profile_image_url, str):
            return jsonify({'error': 'profile_image must be a valid string URL'}), 400
        
        # Basic URL validation (check if it starts with http:// or https://)
        if not (profile_image_url.startswith('http://') or profile_image_url.startswith('https://')):
            return jsonify({'error': 'profile_image must be a valid HTTP/HTTPS URL'}), 400
        
        # Update profile picture
        current_user.profile_pic_url = profile_image_url
        db.session.commit()
        
        return jsonify({
            'message': 'Profile picture updated successfully',
            'user': current_user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@users_bp.route('/profile-image/upload', methods=['POST'])
@jwt_required()  # Protected route: requires valid JWT token
def upload_profile_image():
    """
    Upload user's profile picture endpoint.
    Accepts image files (png, jpg, jpeg, gif) and saves them to the server.
    Updates the user's profile_pic_url field with the file path.
    """
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if file is present in request
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        # Check if file was actually selected
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Validate file type
        if not allowed_file(file.filename):
            return jsonify({
                'error': 'Invalid file type. Allowed types: png, jpg, jpeg, gif'
            }), 400
        
        # Ensure upload directory exists
        upload_folder = current_app.config['UPLOAD_FOLDER']
        os.makedirs(upload_folder, exist_ok=True)
        
        # Generate unique filename to prevent conflicts
        file_ext = file.filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{current_user.id}_{uuid.uuid4().hex[:8]}.{file_ext}"
        secure_name = secure_filename(unique_filename)
        
        # Save file
        file_path = os.path.join(upload_folder, secure_name)
        file.save(file_path)
        
        # Generate URL path for the uploaded image
        # The static files will be served from /static/profile_pics/
        # Note: Frontend will prepend the API base URL if needed
        image_url = f"/static/profile_pics/{secure_name}"
        
        # Update user's profile picture URL
        current_user.profile_pic_url = image_url
        db.session.commit()
        
        return jsonify({
            'message': 'Profile picture uploaded successfully',
            'profile_image': image_url,
            'user': current_user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        # Clean up file if database update fails
        if 'file_path' in locals() and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except:
                pass
        return jsonify({'error': str(e)}), 500

