/**
 * Post card component for displaying posts in feed.
 * Shows image, caption, likes, comments, and interaction buttons.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { postAPI } from '../services/api';
import toast from 'react-hot-toast';
import CommentList from './CommentList';

const PostCard = ({ post, onUpdate }) => {
  const { isAuthenticated, user } = useAuth();
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [likeCount, setLikeCount] = useState(post.like_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentCount, setCommentCount] = useState(post.comment_count || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to like posts');
      return;
    }

    try {
      if (isLiked) {
        await postAPI.unlike(post.id);
        setIsLiked(false);
        setLikeCount((prev) => prev - 1);
        toast.success('Post unliked');
      } else {
        await postAPI.like(post.id);
        setIsLiked(true);
        setLikeCount((prev) => prev + 1);
        toast.success('Post liked');
      }
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to like post');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !isAuthenticated) return;

    setIsSubmitting(true);
    try {
      await postAPI.addComment(post.id, commentText);
      setCommentText('');
      setCommentCount((prev) => prev + 1);
      toast.success('Comment added');
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add comment');
    } finally {
      setIsSubmitting(false);
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
      <div className="flex items-center space-x-3 p-4">
        <img
          src={post.profile_pic_url || 'https://via.placeholder.com/150'}
          alt={post.username}
          className="w-10 h-10 rounded-full object-cover"
          referrerPolicy="no-referrer"
        />
        <Link
          to={`/profile/${post.username}`}
          className="font-semibold text-gray-900 hover:text-primary"
        >
          {post.username}
        </Link>
        <span className="text-gray-500 text-sm">{formatDate(post.created_at)}</span>
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
              isLiked ? 'text-red-500' : 'text-gray-700'
            }`}
          >
            <svg
              className="w-6 h-6"
              fill={isLiked ? 'currentColor' : 'none'}
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
        {likeCount > 0 && (
          <p className="font-semibold text-gray-900 mb-2">{likeCount} likes</p>
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
        {commentCount > 0 && !showComments && (
          <button
            onClick={() => setShowComments(true)}
            className="text-gray-500 text-sm mb-2 hover:text-primary"
          >
            View all {commentCount} comments
          </button>
        )}

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4">
            <CommentList postId={post.id} />
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

