/**
 * Feed page component displaying personalized feed of posts.
 * Implements pagination for loading more posts.
 * Uses PostContext for state management - no page refresh needed!
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePost } from '../context/PostContext';
import { postAPI } from '../services/api';
import PostCard from '../components/PostCard';
import toast from 'react-hot-toast';

const Feed = () => {
  const { isAuthenticated } = useAuth();
  const { feedPosts, posts, setPostsBatch, setFeed, addToFeed, setLoading } = usePost();
  const [loading, setLocalLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Get actual post objects from IDs
  const postsList = useMemo(() => {
    return feedPosts.map((postId) => posts[postId]).filter(Boolean);
  }, [feedPosts, posts]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFeed();
    } else {
      setLocalLoading(false);
    }
  }, [isAuthenticated, page]);

  const fetchFeed = async () => {
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
      toast.error(error.response?.data?.error || 'Failed to load feed');
    } finally {
      setLocalLoading(false);
      setLoadingMore(false);
    }
  };

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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Feed</h1>
      <div className="space-y-6">
        {postsList.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-8 text-center">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Feed;

