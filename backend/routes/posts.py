"""
Post-related routes for creating posts, likes, comments, and feed.
Demonstrates CRUD operations, many-to-many relationships, and pagination.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.extensions import db
from backend.models import Post, User, Comment, likes

posts_bp = Blueprint('posts', __name__, url_prefix='/api/posts')


@posts_bp.route('', methods=['POST'])
@jwt_required()  # Protected route: only authenticated users can create posts
def create_post():
    """
    Create a new post endpoint.
    Requires authentication and validates image URL and caption.
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or not data.get('image_url'):
            return jsonify({'error': 'Image URL is required'}), 400
        
        image_url = data['image_url'].strip()
        caption = data.get('caption', '').strip()
        
        # Create new post
        new_post = Post(
            user_id=current_user_id,
            image_url=image_url,
            caption=caption
        )
        
        db.session.add(new_post)
        db.session.commit()
        
        return jsonify({
            'message': 'Post created successfully',
            'post': new_post.to_dict(current_user_id)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@posts_bp.route('/<int:post_id>', methods=['GET'])
@jwt_required(optional=True)  # Optional: allows viewing posts without login
def get_post(post_id):
    """Get a specific post by ID with all details."""
    try:
        post = Post.query.get(post_id)
        
        if not post:
            return jsonify({'error': 'Post not found'}), 404
        
        current_user_id = get_jwt_identity()
        
        # Get comments for this post
        comments = post.comments.order_by(Comment.created_at.asc()).all()
        
        post_data = post.to_dict(current_user_id)
        post_data['comments'] = [comment.to_dict() for comment in comments]
        
        return jsonify(post_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@posts_bp.route('/user/<int:user_id>', methods=['GET'])
@jwt_required(optional=True)
def get_user_posts(user_id):
    """
    Get all posts by a specific user with pagination.
    
    This endpoint fetches posts for the user specified by user_id parameter,
    NOT the current logged-in user. Used for profile pages and user post listings.
    """
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Pagination parameters
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        limit = min(limit, 50)  # Max 50 posts per page
        
        # Query posts for the specified user (user_id parameter)
        # Uses the user.posts relationship which correctly filters by user_id
        # Ordered by newest first
        pagination = user.posts.order_by(Post.created_at.desc()).paginate(
            page=page, per_page=limit, error_out=False
        )
        
        current_user_id = get_jwt_identity()
        
        return jsonify({
            'posts': [post.to_dict(current_user_id) for post in pagination.items],
            'page': page,
            'limit': limit,
            'total': pagination.total,
            'pages': pagination.pages,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@posts_bp.route('/<int:post_id>/like', methods=['POST'])
@jwt_required()  # Protected route: must be logged in to like
def like_post(post_id):
    """
    Like a post endpoint.
    Creates a many-to-many relationship between user and post.
    """
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        post = Post.query.get(post_id)
        
        if not post:
            return jsonify({'error': 'Post not found'}), 404
        
        # Check if already liked
        if post.is_liked_by(current_user_id):
            return jsonify({'error': 'Post already liked'}), 400
        
        # Add like relationship (many-to-many)
        post.liked_by.append(current_user)
        db.session.commit()
        
        return jsonify({
            'message': 'Post liked successfully',
            'like_count': post.get_like_count(),
            'is_liked': True
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@posts_bp.route('/<int:post_id>/like', methods=['DELETE'])
@jwt_required()  # Protected route: must be logged in to unlike
def unlike_post(post_id):
    """
    Unlike a post endpoint.
    Removes the many-to-many relationship between user and post.
    """
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        post = Post.query.get(post_id)
        
        if not post:
            return jsonify({'error': 'Post not found'}), 404
        
        # Check if currently liked
        if not post.is_liked_by(current_user_id):
            return jsonify({'error': 'Post not liked'}), 400
        
        # Remove like relationship
        post.liked_by.remove(current_user)
        db.session.commit()
        
        return jsonify({
            'message': 'Post unliked successfully',
            'like_count': post.get_like_count(),
            'is_liked': False
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@posts_bp.route('/<int:post_id>/comments', methods=['POST'])
@jwt_required()  # Protected route: must be logged in to comment
def add_comment(post_id):
    """
    Add a comment to a post endpoint.
    Creates a one-to-many relationship (post has many comments).
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or not data.get('text'):
            return jsonify({'error': 'Comment text is required'}), 400
        
        post = Post.query.get(post_id)
        if not post:
            return jsonify({'error': 'Post not found'}), 404
        
        # Create new comment
        new_comment = Comment(
            post_id=post_id,
            user_id=current_user_id,
            text=data['text'].strip()
        )
        
        db.session.add(new_comment)
        db.session.commit()
        
        return jsonify({
            'message': 'Comment added successfully',
            'comment': new_comment.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@posts_bp.route('/<int:post_id>/comments', methods=['GET'])
@jwt_required(optional=True)
def get_comments(post_id):
    """Get all comments for a specific post."""
    try:
        post = Post.query.get(post_id)
        if not post:
            return jsonify({'error': 'Post not found'}), 404
        
        comments = post.comments.order_by(Comment.created_at.asc()).all()
        
        return jsonify({
            'comments': [comment.to_dict() for comment in comments],
            'count': len(comments)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@posts_bp.route('/feed', methods=['GET'])
@jwt_required()  # Protected route: personalized feed requires authentication
def get_feed():
    """
    Get personalized feed endpoint.
    Returns posts from users that the current user follows, plus their own posts.
    Implements pagination for performance.
    
    Query Logic:
    - Queries the follows table directly to get IDs of users the current user follows
    - The follows table structure: follower_id (current user) -> followed_id (user being followed)
    - Creates a list of user IDs: [followed_user_ids] + [current_user_id]
    - Filters posts where Post.user_id is in this list
    - Results are ordered by newest first (created_at DESC)
    
    This approach is more reliable than using relationship lazy loading and ensures
    we always get posts from followed users plus the current user's own posts.
    """
    try:
        from backend.models import follows
        
        current_user_id = get_jwt_identity()
        
        # Pagination parameters
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        limit = min(limit, 50)  # Max 50 posts per page
        
        # Query the follows table directly to get IDs of users the current user follows
        # This is more reliable than using relationship lazy loading
        # SELECT followed_id FROM follows WHERE follower_id = current_user_id
        followed_ids_result = db.session.query(follows.c.followed_id).filter(
            follows.c.follower_id == current_user_id
        ).all()
        
        # Extract user IDs from query result and add current user's ID
        # This list contains: [users we follow] + [ourselves]
        following_ids = [row[0] for row in followed_ids_result]
        following_ids.append(current_user_id)  # Always include own posts
        
        # If user follows no one, following_ids will just be [current_user_id]
        # This ensures we still see our own posts even if we don't follow anyone
        
        # Query posts from followed users and self, ordered by newest first
        # Filter: Post.user_id IN (following_ids)
        pagination = Post.query.filter(
            Post.user_id.in_(following_ids)
        ).order_by(
            Post.created_at.desc()
        ).paginate(
            page=page, per_page=limit, error_out=False
        )
        
        return jsonify({
            'posts': [post.to_dict(current_user_id) for post in pagination.items],
            'page': page,
            'limit': limit,
            'total': pagination.total,
            'pages': pagination.pages,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

