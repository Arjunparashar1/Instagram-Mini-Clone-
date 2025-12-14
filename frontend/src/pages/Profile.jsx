/**
 * User profile page component.
 * Displays user information, posts grid, and follow/unfollow functionality.
 */
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import toast from 'react-hot-toast';

const Profile = () => {
  const { username } = useParams();
  const { user: currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getProfile(username);
      setProfile(response.data);
      setFollowing(response.data.is_following || false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load profile');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

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
          <img
            src={profile.profile_pic_url || 'https://via.placeholder.com/150'}
            alt={profile.username}
            className="w-24 h-24 rounded-full object-cover"
          />
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
                <span className="font-semibold">{profile.posts?.length || 0}</span>
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
      </div>

      {/* Posts Grid */}
      {profile.posts && profile.posts.length > 0 ? (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Posts</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {profile.posts.map((post) => (
              <Link
                key={post.id}
                to={`/post/${post.id}`}
                className="relative aspect-square group"
              >
                <img
                  src={post.image_url}
                  alt={post.caption || 'Post'}
                  className="w-full h-full object-cover rounded-lg border border-gray-200 group-hover:opacity-90 transition-opacity"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/300x300?text=Image+Not+Found';
                  }}
                />
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
              </Link>
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

