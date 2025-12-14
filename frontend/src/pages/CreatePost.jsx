/**
 * Create post page component.
 * Allows authenticated users to create new posts with image file upload and caption.
 * Adds new post to PostContext for instant UI update.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePost } from '../context/PostContext';
import { postAPI } from '../services/api';
import toast from 'react-hot-toast';

const CreatePost = () => {
  const { isAuthenticated, user } = useAuth();
  const { addNewPost } = usePost();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    image: null,
    caption: '',
  });
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    if (e.target.name === 'image') {
      const file = e.target.files[0];
      if (file) {
        // Validate file type
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
          toast.error('Invalid file type. Please select a PNG, JPG, JPEG, or GIF image.');
          e.target.value = '';
          return;
        }
        
        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          toast.error('File size too large. Maximum size is 5MB.');
          e.target.value = '';
          return;
        }
        
        setFormData({
          ...formData,
          image: file,
        });
        
        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result);
        };
        reader.readAsDataURL(file);
      }
    } else {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.image) {
      toast.error('Please select an image file');
      return;
    }
    
    setLoading(true);

    try {
      const response = await postAPI.create(formData.image, formData.caption);
      const newPost = response.data.post;
      
      // Add new post to context for instant UI update
      addNewPost(newPost);
      
      toast.success('Post created successfully!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Post</h1>
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
              Image
            </label>
            <input
              id="image"
              name="image"
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/gif"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-blue-600"
              onChange={handleChange}
            />
            <p className="mt-2 text-sm text-gray-500">
              Select an image file from your computer (PNG, JPG, JPEG, or GIF, max 5MB)
            </p>
          </div>

          {preview && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preview
              </label>
              <img
                src={preview}
                alt="Preview"
                className="w-full max-h-96 object-contain rounded-lg border border-gray-200"
              />
            </div>
          )}

          <div>
            <label htmlFor="caption" className="block text-sm font-medium text-gray-700 mb-2">
              Caption
            </label>
            <textarea
              id="caption"
              name="caption"
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Write a caption..."
              value={formData.caption}
              onChange={handleChange}
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;

