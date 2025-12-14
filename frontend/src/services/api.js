/**
 * API service module for making HTTP requests to the backend.
 * Uses Axios with interceptors to automatically attach JWT tokens.
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach JWT token to all requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // For FormData, let the browser set Content-Type with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle token expiration and errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear storage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API endpoints
export const authAPI = {
  signup: (data) => api.post('/api/auth/signup', data),
  login: (data) => api.post('/api/auth/login', data),
};

// User API endpoints
export const userAPI = {
  getAllUsers: () => api.get('/api/users'),
  getProfile: (username) => api.get(`/api/users/${username}`),
  follow: (userId) => api.post(`/api/users/follow/${userId}`),
  unfollow: (userId) => api.delete(`/api/users/unfollow/${userId}`),
  getFollowers: (userId) => api.get(`/api/users/${userId}/followers`),
  getFollowing: (userId) => api.get(`/api/users/${userId}/following`),
  updateProfileImage: (imageUrl) => api.put('/api/users/profile-image', { profile_image: imageUrl }),
  uploadProfileImage: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    // Content-Type will be set automatically by axios for FormData
    return api.post('/api/users/profile-image/upload', formData);
  },
};

// Post API endpoints
export const postAPI = {
  create: (data) => api.post('/api/posts', data),
  getById: (postId) => api.get(`/api/posts/${postId}`),
  delete: (postId) => api.delete(`/api/posts/${postId}`),
  getUserPosts: (userId, page = 1, limit = 10) => 
    api.get(`/api/posts/user/${userId}`, { params: { page, limit } }),
  like: (postId) => api.post(`/api/posts/${postId}/like`),
  unlike: (postId) => api.delete(`/api/posts/${postId}/like`),
  addComment: (postId, text) => api.post(`/api/posts/${postId}/comments`, { text }),
  getComments: (postId) => api.get(`/api/posts/${postId}/comments`),
  getFeed: (page = 1, limit = 10) => 
    api.get('/api/posts/feed', { params: { page, limit } }),
};

export default api;

