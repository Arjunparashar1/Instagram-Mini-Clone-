/**
 * Post detail page component.
 * Displays a single post with full details, comments, and interactions.
 * Uses PostContext for state management - no page refresh needed!
 */
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePost } from '../context/PostContext';
import { postAPI } from '../services/api';
import CommentList from '../components/CommentList';
import toast from 'react-hot-toast';

// Default avatar fallback
const DEFAULT_AVATAR = 'https://via.placeholder.com/150?text=User';

const PostDetail = () => {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const { getPost, setPost, toggleLike, addComment, refreshPost, deletePost } = usePost();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get post from context (may already be loaded)
  const post = getPost(id);
  
  // Check if current user is the post owner
  const isOwnPost = isAuthenticated && user && post && post.user_id === user.id;

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      // Try to get from context first
      let postData = getPost(id);
      
      // If not in context, fetch from API
      if (!postData) {
        const response = await postAPI.getById(id);
        postData = response.data;
        setPost(postData);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load post');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to like posts');
      navigate('/login');
      return;
    }

    try {
      await toggleLike(id);
    } catch (error) {
      // Error already handled in context
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !isAuthenticated) return;

    setIsSubmitting(true);
    try {
      await addComment(id, commentText, user);
      setCommentText('');
      // Comment count is updated optimistically in context
      // Refresh comments list by triggering a re-render
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
      await deletePost(id);
      // Navigate to feed after successful deletion
      navigate('/');
    } catch (error) {
      // Error already handled in context
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <div className="text-gray-500">Loading post...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <div className="text-gray-500">Post not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-primary hover:text-blue-600 flex items-center space-x-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span>Back</span>
      </button>

      <div className="bg-white border border-gray-200 rounded-xl shadow-card overflow-hidden">
        <div className="md:flex">
          {/* Post Image */}
          <div className="md:w-1/2">
            <img
              src={post.image_url}
              alt={post.caption || 'Post image'}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              loading="lazy"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/500x500?text=Image+Not+Found';
              }}
            />
          </div>

          {/* Post Details */}
          <div className="md:w-1/2 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
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

            {/* Comments Section */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Caption */}
              {post.caption && (
                <div>
                  <Link
                    to={`/profile/${post.username}`}
                    className="font-semibold text-gray-900 hover:text-primary mr-2"
                  >
                    {post.username}
                  </Link>
                  <span className="text-gray-800">{post.caption}</span>
                </div>
              )}

              {/* Comments List */}
              <CommentList postId={id} key={post.comment_count} />
            </div>

            {/* Actions */}
            <div className="border-t border-gray-200 p-4 space-y-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleLike}
                  className={`focus:outline-none transition-all hover:scale-110 active:scale-95 ${
                    post?.is_liked ? 'text-red-500' : 'text-gray-700 hover:text-red-500'
                  }`}
                >
                  <svg
                    className="w-6 h-6"
                    fill={post?.is_liked ? 'currentColor' : 'none'}
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
              </div>

              {(post?.like_count || 0) > 0 && (
                <p className="font-semibold text-gray-900">{post.like_count} likes</p>
              )}

              <p className="text-gray-500 text-sm">{formatDate(post.created_at)}</p>

              {/* Comment Form */}
              {isAuthenticated && (
                <form onSubmit={handleComment} className="flex items-center space-x-2 pt-3 border-t border-gray-100">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim() || isSubmitting}
                    className="text-primary font-semibold hover:text-blue-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors px-3 py-2"
                  >
                    {isSubmitting ? 'Posting...' : 'Post'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;

