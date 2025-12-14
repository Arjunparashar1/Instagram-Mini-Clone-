/**
 * Post card component for displaying posts in feed.
 * Shows image, caption, likes, comments, and interaction buttons.
 * Uses PostContext for optimistic updates - no page refresh needed!
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePost } from '../context/PostContext';
import toast from 'react-hot-toast';
import CommentList from './CommentList';

// Default avatar fallback
const DEFAULT_AVATAR = 'https://via.placeholder.com/150?text=User';

const PostCard = ({ post: initialPost }) => {
  const { isAuthenticated, user } = useAuth();
  const { getPost, setPost, toggleLike, addComment, deletePost } = usePost();
  
  // Get the latest post data from context (may have been updated)
  const post = getPost(initialPost.id) || initialPost;
  
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Check if current user is the post owner
  const isOwnPost = isAuthenticated && user && post.user_id === user.id;

  // Ensure post is in context
  useEffect(() => {
    if (initialPost) {
      setPost(initialPost);
    }
  }, [initialPost, setPost]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to like posts');
      return;
    }

    try {
      await toggleLike(post.id);
    } catch (error) {
      // Error already handled in context
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !isAuthenticated) return;

    setIsSubmitting(true);
    try {
      await addComment(post.id, commentText, user);
      setCommentText('');
      // Comment count is updated optimistically in context
    } catch (error) {
      // Error already handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!isOwnPost) return;
    
    const confirmed = window.confirm('Are you sure you want to delete this post? This action cannot be undone.');
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deletePost(post.id);
      // Post is removed from state in context
    } catch (error) {
      // Error already handled in context
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg mb-6 shadow-sm">
      {/* Post Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <img
            src={post.profile_pic_url || DEFAULT_AVATAR}
            alt={post.username}
            className="w-10 h-10 rounded-full object-cover"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.target.src = DEFAULT_AVATAR;
            }}
          />
          <Link
            to={`/profile/${post.username}`}
            className="font-semibold text-gray-900 hover:text-primary"
          >
            {post.username}
          </Link>
          <span className="text-gray-500 text-sm">{formatDate(post.created_at)}</span>
        </div>
        {isOwnPost && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-red-500 hover:text-red-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Delete post"
          >
            <svg
              className="w-5 h-5"
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

      {/* Post Image */}
      <img
        src={post.image_url}
        alt={post.caption || 'Post image'}
        className="w-full object-cover"
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={(e) => {
          e.target.src = 'https://via.placeholder.com/500x500?text=Image+Not+Found';
        }}
      />

      {/* Post Actions */}
      <div className="p-4">
        <div className="flex items-center space-x-4 mb-2">
          <button
            onClick={handleLike}
            className={`focus:outline-none transition-transform hover:scale-110 ${
              post.is_liked ? 'text-red-500' : 'text-gray-700'
            }`}
          >
            <svg
              className="w-6 h-6"
              fill={post.is_liked ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="text-gray-700 hover:text-primary focus:outline-none"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </button>
        </div>

        {/* Like Count */}
        {(post.like_count || 0) > 0 && (
          <p className="font-semibold text-gray-900 mb-2">{post.like_count} likes</p>
        )}

        {/* Caption */}
        {post.caption && (
          <div className="mb-2">
            <Link
              to={`/profile/${post.username}`}
              className="font-semibold text-gray-900 hover:text-primary mr-2"
            >
              {post.username}
            </Link>
            <span className="text-gray-800">{post.caption}</span>
          </div>
        )}

        {/* View Comments Link */}
        {(post.comment_count || 0) > 0 && !showComments && (
          <button
            onClick={() => setShowComments(true)}
            className="text-gray-500 text-sm mb-2 hover:text-primary"
          >
            View all {post.comment_count} comments
          </button>
        )}

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4">
            <CommentList postId={post.id} key={post.comment_count} />
          </div>
        )}

        {/* Comment Form */}
        {isAuthenticated && (
          <form onSubmit={handleComment} className="mt-4 flex items-center space-x-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={!commentText.trim() || isSubmitting}
              className="text-primary font-semibold hover:text-blue-600 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              Post
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default PostCard;

