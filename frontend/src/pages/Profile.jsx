/**
 * User profile page component.
 * Displays user information, posts grid, and follow/unfollow functionality.
 * Uses PostContext to sync post data across pages.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePost } from '../context/PostContext';
import { userAPI } from '../services/api';
import toast from 'react-hot-toast';

// Default avatar fallback
const DEFAULT_AVATAR = 'https://via.placeholder.com/150?text=User';

const Profile = () => {
  const { username } = useParams();
  const { user: currentUser, isAuthenticated, updateUser } = useAuth();
  const { posts, setPostsBatch, setUserPostsList, getPost, deletePost } = usePost();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState(null);
  const [showUpdateProfilePic, setShowUpdateProfilePic] = useState(false);
  const [profilePicUrl, setProfilePicUrl] = useState('');
  const [isUpdatingProfilePic, setIsUpdatingProfilePic] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadMethod, setUploadMethod] = useState('url'); // 'url' or 'upload'

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getProfile(username);
      const profileData = response.data;
      
      // Ensure profile picture URL is absolute if it's a relative path
      if (profileData.profile_pic_url && profileData.profile_pic_url.startsWith('/static')) {
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        profileData.profile_pic_url = `${apiBaseUrl}${profileData.profile_pic_url}`;
      }
      
      setProfile(profileData);
      setFollowing(profileData.is_following || false);
      
      // Store posts in context
      if (profileData.posts && profileData.posts.length > 0) {
        setPostsBatch(profileData.posts);
        const postIds = profileData.posts.map((post) => post.id);
        setUserPostsList(username, postIds);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load profile');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  // Get posts from context (may have been updated)
  const profilePosts = useMemo(() => {
    if (!profile?.posts) return [];
    return profile.posts.map((post) => getPost(post.id) || post);
  }, [profile, posts, getPost]);

  const handleFollow = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to follow users');
      navigate('/login');
      return;
    }

    try {
      if (following) {
        await userAPI.unfollow(profile.id);
        setFollowing(false);
        setProfile((prev) => ({
          ...prev,
          followers_count: prev.followers_count - 1,
        }));
        toast.success(`Unfollowed ${profile.username}`);
      } else {
        await userAPI.follow(profile.id);
        setFollowing(true);
        setProfile((prev) => ({
          ...prev,
          followers_count: prev.followers_count + 1,
        }));
        toast.success(`Following ${profile.username}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update follow status');
    }
  };

  const handleDeletePost = async (postId, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isOwnProfile) return;
    
    const confirmed = window.confirm('Are you sure you want to delete this post? This action cannot be undone.');
    if (!confirmed) return;

    setDeletingPostId(postId);
    try {
      await deletePost(postId);
      // Update profile posts count
      setProfile((prev) => ({
        ...prev,
        posts: prev.posts ? prev.posts.filter((p) => p.id !== postId) : [],
      }));
    } catch (error) {
      // Error already handled in context
    } finally {
      setDeletingPostId(null);
    }
  };

  const handleUpdateProfilePicture = async (e) => {
    e.preventDefault();
    
    if (uploadMethod === 'url') {
      // URL-based update
      if (!profilePicUrl.trim()) {
        toast.error('Please enter a valid image URL');
        return;
      }

      // Basic URL validation
      if (!profilePicUrl.startsWith('http://') && !profilePicUrl.startsWith('https://')) {
        toast.error('Please enter a valid HTTP/HTTPS URL');
        return;
      }

      setIsUpdatingProfilePic(true);
      try {
        const response = await userAPI.updateProfileImage(profilePicUrl);
        const updatedUser = response.data.user;
        
        // Update profile state
        setProfile((prev) => ({
          ...prev,
          profile_pic_url: updatedUser.profile_pic_url,
        }));
        
        // Update auth context user data
        updateUser(updatedUser);
        
        // Reset form
        setProfilePicUrl('');
        setShowUpdateProfilePic(false);
        toast.success('Profile picture updated successfully!');
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to update profile picture');
      } finally {
        setIsUpdatingProfilePic(false);
      }
    } else {
      // File upload
      if (!selectedFile) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file type
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error('Invalid file type. Please select a PNG, JPG, JPEG, or GIF image');
        return;
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (selectedFile.size > maxSize) {
        toast.error('File size too large. Maximum size is 5MB');
        return;
      }

      setIsUpdatingProfilePic(true);
      try {
        const response = await userAPI.uploadProfileImage(selectedFile);
        const updatedUser = response.data.user;
        
        // Update profile state with full URL
        // Backend returns relative path like /static/profile_pics/filename.jpg
        // We need to prepend the API base URL
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const imageUrl = response.data.profile_image.startsWith('http') 
          ? response.data.profile_image 
          : `${apiBaseUrl}${response.data.profile_image}`;
        
        // Update the user object with the full URL
        const updatedUserWithFullUrl = {
          ...updatedUser,
          profile_pic_url: imageUrl,
        };
        
        setProfile((prev) => ({
          ...prev,
          profile_pic_url: imageUrl,
        }));
        
        // Update auth context user data with full URL
        updateUser(updatedUserWithFullUrl);
        
        // Reset form
        setSelectedFile(null);
        setShowUpdateProfilePic(false);
        toast.success('Profile picture uploaded successfully!');
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to upload profile picture');
      } finally {
        setIsUpdatingProfilePic(false);
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleImageError = (e) => {
    e.target.src = DEFAULT_AVATAR;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <div className="text-gray-500">User not found</div>
      </div>
    );
  }

  const isOwnProfile = profile.is_own_profile || currentUser?.username === username;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-8">
          <div className="relative">
            <img
              src={profile.profile_pic_url || DEFAULT_AVATAR}
              alt={profile.username}
              className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
              referrerPolicy="no-referrer"
              onError={handleImageError}
            />
            {isOwnProfile && (
              <button
                onClick={() => setShowUpdateProfilePic(!showUpdateProfilePic)}
                className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 hover:bg-blue-600 transition-colors shadow-md"
                title="Update profile picture"
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
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </button>
            )}
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center md:items-center space-y-4 md:space-y-0 md:space-x-6 mb-4">
              <h1 className="text-2xl font-bold text-gray-900">{profile.username}</h1>
              {isOwnProfile ? (
                <Link
                  to="/create-post"
                  className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                >
                  Create Post
                </Link>
              ) : (
                <button
                  onClick={handleFollow}
                  className={`px-4 py-2 rounded-lg font-semibold ${
                    following
                      ? 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                      : 'bg-primary text-white hover:bg-blue-600'
                  }`}
                >
                  {following ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
            <div className="flex justify-center md:justify-start space-x-6 mb-4">
              <div>
                <span className="font-semibold">{profilePosts?.length || 0}</span>
                <span className="text-gray-600 ml-1">posts</span>
              </div>
              <div>
                <span className="font-semibold">{profile.followers_count || 0}</span>
                <span className="text-gray-600 ml-1">followers</span>
              </div>
              <div>
                <span className="font-semibold">{profile.following_count || 0}</span>
                <span className="text-gray-600 ml-1">following</span>
              </div>
            </div>
            {profile.email && (
              <p className="text-gray-600 text-sm">{profile.email}</p>
            )}
          </div>
        </div>
        
        {/* Update Profile Picture Form */}
        {isOwnProfile && showUpdateProfilePic && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <form onSubmit={handleUpdateProfilePicture} className="space-y-4">
              {/* Upload Method Toggle */}
              <div className="flex space-x-4 mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setUploadMethod('url');
                    setSelectedFile(null);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    uploadMethod === 'url'
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  From URL
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUploadMethod('upload');
                    setProfilePicUrl('');
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    uploadMethod === 'upload'
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Upload File
                </button>
              </div>

              {/* URL Input */}
              {uploadMethod === 'url' && (
                <div>
                  <label htmlFor="profilePicUrl" className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Picture URL
                  </label>
                  <input
                    type="url"
                    id="profilePicUrl"
                    value={profilePicUrl}
                    onChange={(e) => setProfilePicUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={isUpdatingProfilePic}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Enter a valid image URL (must start with http:// or https://)
                  </p>
                </div>
              )}

              {/* File Upload Input */}
              {uploadMethod === 'upload' && (
                <div>
                  <label htmlFor="profilePicFile" className="block text-sm font-medium text-gray-700 mb-2">
                    Select Image File
                  </label>
                  <input
                    type="file"
                    id="profilePicFile"
                    accept="image/png,image/jpeg,image/jpg,image/gif"
                    onChange={handleFileChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-blue-600"
                    disabled={isUpdatingProfilePic}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Supported formats: PNG, JPG, JPEG, GIF (Max size: 5MB)
                  </p>
                  {selectedFile && (
                    <p className="mt-2 text-sm text-gray-700">
                      Selected: <span className="font-medium">{selectedFile.name}</span> ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={
                    isUpdatingProfilePic ||
                    (uploadMethod === 'url' && !profilePicUrl.trim()) ||
                    (uploadMethod === 'upload' && !selectedFile)
                  }
                  className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isUpdatingProfilePic ? 'Updating...' : uploadMethod === 'url' ? 'Update Picture' : 'Upload Picture'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUpdateProfilePic(false);
                    setProfilePicUrl('');
                    setSelectedFile(null);
                    setUploadMethod('url');
                  }}
                  disabled={isUpdatingProfilePic}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Posts Grid */}
      {profilePosts && profilePosts.length > 0 ? (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Posts</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {profilePosts.map((post) => (
              <div key={post.id} className="relative aspect-square group">
                <Link
                  to={`/post/${post.id}`}
                  className="block w-full h-full"
                >
                  <img
                    src={post.image_url}
                    alt={post.caption || 'Post'}
                    className="w-full h-full object-cover rounded-lg border border-gray-200 group-hover:opacity-90 transition-opacity"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/300x300?text=Image+Not+Found';
                    }}
                  />
                </Link>
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg flex items-center justify-center transition-all">
                  <div className="opacity-0 group-hover:opacity-100 text-white flex items-center space-x-4">
                    <span className="flex items-center space-x-1">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                      <span>{post.like_count}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M21.99 4c0-1.1-.89-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
                      </svg>
                      <span>{post.comment_count}</span>
                    </span>
                  </div>
                </div>
                {isOwnProfile && (
                  <button
                    onClick={(e) => handleDeletePost(post.id, e)}
                    disabled={deletingPostId === post.id}
                    className="absolute top-2 right-2 text-white bg-red-500 hover:bg-red-600 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete post"
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
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <p className="text-gray-500">No posts yet</p>
        </div>
      )}
    </div>
  );
};

export default Profile;

