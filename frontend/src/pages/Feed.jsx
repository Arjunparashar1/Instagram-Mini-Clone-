/**
 * Feed page component displaying personalized feed of posts.
 * Implements pagination for loading more posts.
 * Uses PostContext for state management - no page refresh needed!
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePost } from '../context/PostContext';
import { postAPI } from '../services/api';
import PostCard from '../components/PostCard';
import toast from 'react-hot-toast';

const Feed = () => {
  const { isAuthenticated } = useAuth();
  const { feedPosts, posts, setPostsBatch, setFeed, addToFeed } = usePost();
  const [loading, setLocalLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Get actual post objects from IDs
  const postsList = useMemo(() => {
    return feedPosts.map((postId) => posts[postId]).filter(Boolean);
  }, [feedPosts, posts]);

  const fetchFeed = useCallback(async () => {
    try {
      if (page === 1) {
        setLocalLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await postAPI.getFeed(page, 10);
      const newPosts = response.data.posts || [];

      // Store posts in context
      setPostsBatch(newPosts);
      const postIds = newPosts.map((post) => post.id);

      if (page === 1) {
        setFeed(postIds);
      } else {
        addToFeed(postIds);
      }

      setHasMore(response.data.has_next || false);
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to load feed';
      toast.error(errorMessage);
      console.error('Feed loading error:', error);
    } finally {
      setLocalLoading(false);
      setLoadingMore(false);
    }
  }, [page, setPostsBatch, setFeed, addToFeed]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFeed();
    } else {
      setLocalLoading(false);
    }
  }, [isAuthenticated, fetchFeed]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to InstaMini</h2>
        <p className="text-gray-600 mb-6">
          Please login or sign up to view your personalized feed
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <div className="text-gray-500">Loading feed...</div>
      </div>
    );
  }

  if (postsList.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Your feed is empty</h2>
        <p className="text-gray-600 mb-6">
          Follow some users or create your first post to see content here!
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Your Feed</h1>
      <div className="space-y-6">
        {postsList.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-10 text-center">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="bg-primary text-white px-8 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-md active:scale-98 font-medium"
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Feed;

