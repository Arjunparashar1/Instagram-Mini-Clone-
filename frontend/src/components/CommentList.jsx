/**
 * Comment list component for displaying comments on a post.
 * Fetches and displays comments with user information.
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { postAPI } from '../services/api';

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

const CommentList = ({ postId }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div className="text-gray-500 text-sm">Loading comments...</div>;
  }

  if (comments.length === 0) {
    return <div className="text-gray-500 text-sm">No comments yet</div>;
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <div key={comment.id} className="flex items-start space-x-3">
          <img
            src={comment.profile_pic_url || DEFAULT_AVATAR}
            alt={comment.username}
            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.target.src = DEFAULT_AVATAR;
            }}
          />
          <div className="flex-1">
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <Link
                to={`/profile/${comment.username}`}
                className="font-semibold text-gray-900 hover:text-primary text-sm mr-2"
              >
                {comment.username}
              </Link>
              <span className="text-gray-800 text-sm">{comment.text}</span>
            </div>
            <span className="text-gray-500 text-xs ml-3">{formatDate(comment.created_at)}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CommentList;

