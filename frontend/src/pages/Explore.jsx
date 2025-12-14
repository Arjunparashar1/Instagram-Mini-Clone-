/**
 * Explore/Discover page component.
 * Displays all users with search functionality and follow/unfollow buttons.
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import toast from 'react-hot-toast';

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

const Explore = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [followingStates, setFollowingStates] = useState({}); // Track follow state for each user

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchUsers();
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    // Filter users based on search query (client-side)
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter((user) =>
        user.username.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getAllUsers();
      const usersData = (response.data.users || []).map((user) => ({
        ...user,
        profile_pic_url: normalizeProfilePicUrl(user.profile_pic_url),
      }));
      setUsers(usersData);
      setFilteredUsers(usersData);
      
      // Initialize following states
      const states = {};
      usersData.forEach((user) => {
        states[user.id] = user.is_following || false;
      });
      setFollowingStates(states);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId, username, currentFollowingState) => {
    if (!isAuthenticated) {
      toast.error('Please login to follow users');
      navigate('/login');
      return;
    }

    try {
      if (currentFollowingState) {
        await userAPI.unfollow(userId);
        setFollowingStates((prev) => ({ ...prev, [userId]: false }));
        // Update followers count in the users list
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === userId
              ? { ...user, followers_count: Math.max(0, user.followers_count - 1) }
              : user
          )
        );
        toast.success(`Unfollowed ${username}`);
      } else {
        await userAPI.follow(userId);
        setFollowingStates((prev) => ({ ...prev, [userId]: true }));
        // Update followers count in the users list
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === userId
              ? { ...user, followers_count: user.followers_count + 1 }
              : user
          )
        );
        toast.success(`Following ${username}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update follow status');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <div className="text-gray-500">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Explore</h1>
        <p className="text-gray-600">Discover and follow other users</p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative">
          <input
            type="text"
            placeholder="Search users by username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
          />
          <svg
            className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Users List */}
      {filteredUsers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredUsers.map((user) => {
            const isFollowing = followingStates[user.id] || false;
            return (
              <div
                key={user.id}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-card-hover transition-all"
              >
                <div className="flex items-center space-x-4">
                  {/* Profile Picture */}
                  <Link to={`/profile/${user.username}`}>
                    <img
                      src={user.profile_pic_url || DEFAULT_AVATAR}
                      alt={user.username}
                      className="w-16 h-16 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.target.src = DEFAULT_AVATAR;
                      }}
                    />
                  </Link>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/profile/${user.username}`}
                      className="block hover:text-primary transition-colors"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {user.username}
                      </h3>
                    </Link>
                    <div className="flex space-x-4 mt-1 text-sm text-gray-600">
                      <span>
                        <span className="font-semibold">{user.followers_count || 0}</span>{' '}
                        followers
                      </span>
                      <span>
                        <span className="font-semibold">{user.following_count || 0}</span>{' '}
                        following
                      </span>
                    </div>
                  </div>

                  {/* Follow Button */}
                  <button
                    onClick={() => handleFollow(user.id, user.username, isFollowing)}
                    className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all hover:shadow-md active:scale-98 ${
                      isFollowing
                        ? 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                        : 'bg-primary text-white hover:bg-blue-600'
                    }`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-xl shadow-card">
          {searchQuery.trim() ? (
            <p className="text-gray-500">No users found matching "{searchQuery}"</p>
          ) : (
            <p className="text-gray-500">No users to display</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Explore;
