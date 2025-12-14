/**
 * Comment list component for displaying comments on a post.
 * Fetches and displays comments with user information.
 * Allows comment owners to delete their comments.
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePost } from '../context/PostContext';
import { postAPI } from '../services/api';
import toast from 'react-hot-toast';

// Default avatar fallback
const DEFAULT_AVATAR = 'https://via.placeholder.com/150?text=User';

// Helper function to normalize profile picture URLs
const normalizeProfilePicUrl = (url) => {
  if (!url) return url;
  // If it's already a full URL (http/https), return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // If it's a relative path (starts with /), prepend API base URL
  if (url.startsWith('/')) {
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${apiBaseUrl}${url}`;
  }
  return url;
};

const CommentList = ({ postId, onCommentDeleted }) => {
  const { user, isAuthenticated } = useAuth();
  const { deleteComment } = usePost();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingCommentId, setDeletingCommentId] = useState(null);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await postAPI.getComments(postId);
        const comments = (response.data.comments || []).map((comment) => ({
          ...comment,
          profile_pic_url: normalizeProfilePicUrl(comment.profile_pic_url),
        }));
        setComments(comments);
      } catch (error) {
        console.error('Failed to fetch comments:', error);
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      fetchComments();
    }
  }, [postId]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  const handleDeleteComment = async (commentId, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated || !user) {
      toast.error('Please login to delete comments');
      return;
    }

    const confirmed = window.confirm('Are you sure you want to delete this comment?');
    if (!confirmed) return;

    setDeletingCommentId(commentId);
    try {
      // Use PostContext to update comment count
      await deleteComment(commentId, postId);
      
      // Remove comment from UI immediately
      setComments((prevComments) => prevComments.filter((c) => c.id !== commentId));
      
      // Notify parent component if callback provided
      if (onCommentDeleted) {
        onCommentDeleted();
      }
      
      toast.success('Comment deleted successfully');
    } catch (error) {
      // Error already handled in context
    } finally {
      setDeletingCommentId(null);
    }
  };

  if (loading) {
    return <div className="text-gray-500 text-sm">Loading comments...</div>;
  }

  if (comments.length === 0) {
    return <div className="text-gray-500 text-sm">No comments yet</div>;
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => {
        const isOwnComment = isAuthenticated && user && comment.user_id === user.id;
        
        return (
          <div key={comment.id} className="flex items-start space-x-3 group">
            <img
              src={comment.profile_pic_url || DEFAULT_AVATAR}
              alt={comment.username}
              className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-gray-200"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.target.src = DEFAULT_AVATAR;
              }}
            />
            <div className="flex-1 min-w-0">
              <div className="bg-gray-50 rounded-xl px-4 py-2.5 flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/profile/${comment.username}`}
                    className="font-semibold text-gray-900 hover:text-primary text-sm mr-2 transition-colors"
                  >
                    {comment.username}
                  </Link>
                  <span className="text-gray-800 text-sm leading-relaxed break-words">{comment.text}</span>
                </div>
                {isOwnComment && (
                  <button
                    onClick={(e) => handleDeleteComment(comment.id, e)}
                    disabled={deletingCommentId === comment.id}
                    className="ml-2 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    title="Delete comment"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                )}
              </div>
              <span className="text-gray-500 text-xs ml-4 mt-1 block">{formatDate(comment.created_at)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CommentList;

