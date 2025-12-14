/**
 * Navigation bar component with responsive design.
 * Shows different links based on authentication status.
 */
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePost } from '../context/PostContext';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { clearPosts } = usePost();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    clearPosts(); // Clear posts state on logout
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary">InstaMini</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-4 sm:space-x-6">
            {isAuthenticated ? (
              <>
                <Link
                  to="/"
                  className="text-gray-700 hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-gray-50"
                >
                  Home
                </Link>
                <Link
                  to="/explore"
                  className="text-gray-700 hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-gray-50"
                >
                  Explore
                </Link>
                <Link
                  to="/create-post"
                  className="text-gray-700 hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-gray-50"
                >
                  Create Post
                </Link>
                <Link
                  to={`/profile/${user?.username}`}
                  className="text-gray-700 hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-gray-50"
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-all hover:shadow-md active:scale-95"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-primary transition-colors px-3 py-2 rounded-md hover:bg-gray-50"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-all hover:shadow-md active:scale-95"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

