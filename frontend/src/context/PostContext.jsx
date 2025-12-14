/**
 * Post Context for managing posts, likes, and comments state globally.
 * Provides optimistic updates and syncs state across all components.
 */
import React, { createContext, useContext, useState, useCallback } from 'react';
import { postAPI } from '../services/api';
import toast from 'react-hot-toast';

const PostContext = createContext(null);

export const usePost = () => {
  const context = useContext(PostContext);
  if (!context) {
    throw new Error('usePost must be used within a PostProvider');
  }
  return context;
};

export const PostProvider = ({ children }) => {
  // Store posts by ID for quick access
  const [posts, setPosts] = useState({});
  // Store feed posts order
  const [feedPosts, setFeedPosts] = useState([]);
  // Store user profile posts
  const [userPosts, setUserPosts] = useState({}); // { username: [postIds] }
  // Loading states
  const [loading, setLoading] = useState(false);

  // Get a post by ID
  const getPost = useCallback((postId) => {
    return posts[postId] || null;
  }, [posts]);

  // Update a post in the store
  const updatePost = useCallback((postId, updates) => {
    setPosts((prev) => {
      const existingPost = prev[postId];
      if (!existingPost) return prev;
      
      return {
        ...prev,
        [postId]: {
          ...existingPost,
          ...updates,
        },
      };
    });
  }, []);

  // Add or update a post
  const setPost = useCallback((post) => {
    setPosts((prev) => ({
      ...prev,
      [post.id]: post,
    }));
  }, []);

  // Add multiple posts
  const setPostsBatch = useCallback((newPosts) => {
    setPosts((prev) => {
      const updated = { ...prev };
      newPosts.forEach((post) => {
        updated[post.id] = post;
      });
      return updated;
    });
  }, []);

  // Set feed posts
  const setFeed = useCallback((postIds) => {
    setFeedPosts(postIds);
  }, []);

  // Add posts to feed
  const addToFeed = useCallback((postIds) => {
    setFeedPosts((prev) => {
      const existing = new Set(prev);
      postIds.forEach((id) => existing.add(id));
      return Array.from(existing);
    });
  }, []);

  // Set user posts
  const setUserPostsList = useCallback((username, postIds) => {
    setUserPosts((prev) => ({
      ...prev,
      [username]: postIds,
    }));
  }, []);

  // Like a post (optimistic update)
  const likePost = useCallback(async (postId) => {
    const post = posts[postId];
    if (!post) return;

    // Optimistic update
    const wasLiked = post.is_liked || false;
    const oldLikeCount = post.like_count || 0;

    updatePost(postId, {
      is_liked: true,
      like_count: oldLikeCount + (wasLiked ? 0 : 1),
    });

    try {
      await postAPI.like(postId);
      // Update with server response if needed
    } catch (error) {
      // Revert on error
      updatePost(postId, {
        is_liked: wasLiked,
        like_count: oldLikeCount,
      });
      toast.error(error.response?.data?.error || 'Failed to like post');
      throw error;
    }
  }, [posts, updatePost]);

  // Unlike a post (optimistic update)
  const unlikePost = useCallback(async (postId) => {
    const post = posts[postId];
    if (!post) return;

    // Optimistic update
    const wasLiked = post.is_liked || false;
    const oldLikeCount = post.like_count || 0;

    updatePost(postId, {
      is_liked: false,
      like_count: Math.max(0, oldLikeCount - (wasLiked ? 1 : 0)),
    });

    try {
      await postAPI.unlike(postId);
      // Update with server response if needed
    } catch (error) {
      // Revert on error
      updatePost(postId, {
        is_liked: wasLiked,
        like_count: oldLikeCount,
      });
      toast.error(error.response?.data?.error || 'Failed to unlike post');
      throw error;
    }
  }, [posts, updatePost]);

  // Toggle like (optimistic update)
  const toggleLike = useCallback(async (postId) => {
    let post = posts[postId];
    
    // If post not in context, fetch it first
    if (!post) {
      try {
        const response = await postAPI.getById(postId);
        post = response.data;
        setPost(post);
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to load post');
        throw error;
      }
    }

    // Perform optimistic update inline to avoid closure issues
    const wasLiked = post.is_liked || false;
    const oldLikeCount = post.like_count || 0;

    // Optimistic update
    updatePost(postId, {
      is_liked: !wasLiked,
      like_count: wasLiked ? Math.max(0, oldLikeCount - 1) : oldLikeCount + 1,
    });

    try {
      if (wasLiked) {
        await postAPI.unlike(postId);
      } else {
        await postAPI.like(postId);
      }
    } catch (error) {
      // Revert on error
      updatePost(postId, {
        is_liked: wasLiked,
        like_count: oldLikeCount,
      });
      toast.error(error.response?.data?.error || 'Failed to toggle like');
      throw error;
    }
  }, [posts, updatePost, setPost]);

  // Add comment (optimistic update)
  const addComment = useCallback(async (postId, text, user) => {
    const post = posts[postId];
    if (!post) return;

    // Optimistic update - increment comment count
    const oldCommentCount = post.comment_count || 0;
    updatePost(postId, {
      comment_count: oldCommentCount + 1,
    });

    try {
      const response = await postAPI.addComment(postId, text);
      // The comment will be fetched separately by CommentList
      toast.success('Comment added');
      return response.data;
    } catch (error) {
      // Revert on error
      updatePost(postId, {
        comment_count: oldCommentCount,
      });
      toast.error(error.response?.data?.error || 'Failed to add comment');
      throw error;
    }
  }, [posts, updatePost]);

  // Add new post to feed
  const addNewPost = useCallback((post) => {
    setPost(post);
    setFeedPosts((prev) => [post.id, ...prev]);
  }, [setPost]);

  // Refresh a single post from server
  const refreshPost = useCallback(async (postId) => {
    try {
      const response = await postAPI.getById(postId);
      setPost(response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to refresh post:', error);
      throw error;
    }
  }, [setPost]);

  // Clear all posts (useful for logout)
  const clearPosts = useCallback(() => {
    setPosts({});
    setFeedPosts([]);
    setUserPosts({});
  }, []);

  const value = {
    // State
    posts,
    feedPosts,
    userPosts,
    loading,
    setLoading,
    
    // Getters
    getPost,
    
    // Setters
    setPost,
    setPostsBatch,
    setFeed,
    addToFeed,
    setUserPostsList,
    updatePost,
    
    // Actions
    likePost,
    unlikePost,
    toggleLike,
    addComment,
    addNewPost,
    refreshPost,
    clearPosts,
  };

  return <PostContext.Provider value={value}>{children}</PostContext.Provider>;
};
