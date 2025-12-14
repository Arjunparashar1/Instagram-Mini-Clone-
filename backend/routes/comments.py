"""
Comment-related routes for deleting comments.
Demonstrates authorization checks and protected routes.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.extensions import db
from backend.models import Comment

comments_bp = Blueprint('comments', __name__, url_prefix='/api/comments')


@comments_bp.route('/<int:comment_id>', methods=['DELETE'])
@jwt_required()  # Protected route: must be logged in to delete comments
def delete_comment(comment_id):
    """
    Delete a comment endpoint.
    Only the comment owner can delete their own comment.
    """
    try:
        current_user_id = get_jwt_identity()
        comment = Comment.query.get(comment_id)
        
        if not comment:
            return jsonify({'error': 'Comment not found'}), 404
        
        # Check if current user is the comment owner
        if comment.user_id != current_user_id:
            return jsonify({'error': 'Unauthorized. You can only delete your own comments.'}), 403
        
        # Delete the comment
        db.session.delete(comment)
        db.session.commit()
        
        return jsonify({
            'message': 'Comment deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

