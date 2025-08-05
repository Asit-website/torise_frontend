import { useAuth } from "../../contexts/AuthContext";
import { useState, useEffect } from "react";
import api from '../../services/api';
import toast from 'react-hot-toast';
import AdminLayout from './AdminLayout';

const Avatars = () => {
  const { user } = useAuth();
  const [avatars, setAvatars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'text',
    assigned_language: '',
    supports_text: false,
    supports_voice: false,
    status: 'draft',
    category: ''
  });

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    console.log('Current user:', user);
    console.log('Token exists:', !!token);
    
    if (!token) {
      console.error('No token found');
      toast.error('Please login again');
      return;
    }
    
    fetchAvatars();
  }, [searchTerm]);

  const fetchAvatars = async () => {
    try {
      setLoading(true);
      console.log('Fetching avatars with search term:', searchTerm);
      const response = await api.get('/api/avatars', {
        params: { search: searchTerm }
      });
      console.log('Avatars API Response:', response.data);
      console.log('Response status:', response.status);
      
      // Handle the correct response format from backend
      if (response.data && response.data.avatars) {
        setAvatars(response.data.avatars);
        console.log('Avatars set successfully:', response.data.avatars.length);
        console.log('First avatar data structure:', response.data.avatars[0]);
      } else {
        console.error('Unexpected response format:', response.data);
        setAvatars([]);
        toast.error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error fetching avatars:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      toast.error('Failed to fetch avatars');
      setAvatars([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAvatar = async (avatarId) => {
    if (window.confirm('Are you sure you want to delete this avatar?')) {
      try {
        await api.delete(`/api/avatars/${avatarId}`);
        toast.success('Avatar deleted successfully');
        fetchAvatars();
      } catch (error) {
        console.error('Error deleting avatar:', error);
        toast.error('Failed to delete avatar');
      }
    }
  };

  const handleCreateAvatar = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/avatars', formData);
      toast.success('Avatar created successfully');
      setShowCreateModal(false);
      setFormData({
        name: '',
        type: 'text',
        assigned_language: '',
        supports_text: false,
        supports_voice: false,
        status: 'draft',
        category: ''
      });
      fetchAvatars();
    } catch (error) {
      console.error('Error creating avatar:', error);
      toast.error(error.response?.data?.message || 'Failed to create avatar');
    }
  };

  const handleEditAvatar = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(`/api/avatars/${selectedAvatar._id}`, formData);
      toast.success('Avatar updated successfully');
      setShowEditModal(false);
      setSelectedAvatar(null);
      setFormData({
        name: '',
        type: 'text',
        assigned_language: '',
        supports_text: false,
        supports_voice: false,
        status: 'draft',
        category: ''
      });
      fetchAvatars();
    } catch (error) {
      console.error('Error updating avatar:', error);
      toast.error(error.response?.data?.message || 'Failed to update avatar');
    }
  };

  const openEditModal = (avatar) => {
    setSelectedAvatar(avatar);
    setFormData({
      name: avatar.name || '',
      type: avatar.type || 'text',
      assigned_language: avatar.assigned_language || '',
      supports_text: avatar.supports_text || false,
      supports_voice: avatar.supports_voice || false,
      status: avatar.status || 'draft',
      category: avatar.category || ''
    });
    setShowEditModal(true);
  };

  const openCreateModal = () => {
    setFormData({
      name: '',
      type: 'text',
      assigned_language: '',
      supports_text: false,
      supports_voice: false,
      status: 'draft',
      category: ''
    });
    setShowCreateModal(true);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading avatars...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Avatar Management</h1>
              <p className="text-gray-600">Manage all avatars in the system</p>
            </div>
            <button 
              onClick={openCreateModal}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <span>+</span>
              Add Avatar
            </button>
          </div>

          {/* Search */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex items-center gap-4">
              <input
                type="text"
                placeholder="Search avatars..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Avatars Table */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="bg-blue-500 text-white px-6 py-4 rounded-t-lg">
              <div className="flex items-center gap-3">
                <span className="text-xl">👤</span>
                <h2 className="text-xl font-semibold">Avatars ({avatars?.length || 0})</h2>
              </div>
            </div>
            
    <div className="p-6">
              {avatars?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No avatars found</p>
      </div>
              ) : (
                <div>
                  <p className="mb-4 text-sm text-gray-600">Total avatars: {avatars?.length || 0}</p>
                  
                  {/* Debug Info */}
                  <div className="mb-4 p-4 bg-gray-100 rounded-lg">
                    <h3 className="font-bold mb-2">Debug Info:</h3>
                    <p>Avatars array length: {avatars?.length}</p>
                    <p>First avatar name: {avatars?.[0]?.name || 'No name'}</p>
                    <p>First avatar type: {avatars?.[0]?.type || 'No type'}</p>
                  </div>
                  
                  {/* Simple Table */}
          <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
              <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 p-3 text-left font-semibold">Avatar Name</th>
                          <th className="border border-gray-300 p-3 text-left font-semibold">Type</th>
                          <th className="border border-gray-300 p-3 text-left font-semibold">Language</th>
                          <th className="border border-gray-300 p-3 text-left font-semibold">Supports Text</th>
                          <th className="border border-gray-300 p-3 text-left font-semibold">Supports Voice</th>
                          <th className="border border-gray-300 p-3 text-left font-semibold">Status</th>
                          <th className="border border-gray-300 p-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                        {avatars?.map((avatar, index) => {
                          console.log(`Rendering avatar ${index}:`, avatar);
                          return (
                            <tr key={avatar._id || index} className="hover:bg-gray-50">
                              <td className="border border-gray-300 p-3">
                                <span className="font-medium text-gray-900">
                                  {avatar?.name || 'N/A'}
                                </span>
                              </td>
                              <td className="border border-gray-300 p-3">
                                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800`}>
                                  {avatar?.type || 'N/A'}
                                </span>
                              </td>
                              <td className="border border-gray-300 p-3">
                                <span className="text-gray-700">
                                  {avatar?.assigned_language || 'N/A'}
                                </span>
                              </td>
                              <td className="border border-gray-300 p-3">
                                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                  avatar?.supports_text ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {avatar?.supports_text ? 'Yes' : 'No'}
                                </span>
                              </td>
                              <td className="border border-gray-300 p-3">
                                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                  avatar?.supports_voice ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {avatar?.supports_voice ? 'Yes' : 'No'}
                                </span>
                              </td>
                              <td className="border border-gray-300 p-3">
                                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                  avatar?.status === 'live' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                                }`}>
                                  {avatar?.status || 'N/A'}
                                </span>
                              </td>
                              <td className="border border-gray-300 p-3">
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => openEditModal(avatar)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white p-1 rounded"
                                  >
                                    ✏️
                                  </button>
                                  <button 
                                    className="bg-red-500 hover:bg-red-600 text-white p-1 rounded"
                                    onClick={() => handleDeleteAvatar(avatar._id)}
                                  >
                                    🗑️
                                  </button>
                                </div>
                    </td>
                  </tr>
                          );
                        })}
              </tbody>
            </table>
                  </div>
          </div>
        )}
      </div>
          </div>

          {/* Create Avatar Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Create New Avatar</h2>
                <form onSubmit={handleCreateAvatar}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Avatar Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
              </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="text">Text</option>
                      <option value="voice">Voice</option>
                </select>
              </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                    <input
                      type="text"
                      value={formData.assigned_language}
                      onChange={(e) => setFormData({...formData, assigned_language: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., English, Spanish, Hindi"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Customer Service, Sales"
                    />
              </div>
                  <div className="mb-4 flex gap-4">
                <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.supports_text}
                        onChange={(e) => setFormData({...formData, supports_text: e.target.checked})}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Supports Text</span>
                </label>
                <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.supports_voice}
                        onChange={(e) => setFormData({...formData, supports_voice: e.target.checked})}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Supports Voice</span>
                </label>
              </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="draft">Draft</option>
                      <option value="live">Live</option>
                </select>
              </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                    >
                      Create Avatar
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                    >
                      Cancel
                    </button>
              </div>
            </form>
          </div>
        </div>
      )}

          {/* Edit Avatar Modal */}
          {showEditModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Edit Avatar</h2>
                <form onSubmit={handleEditAvatar}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Avatar Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="text">Text</option>
                      <option value="voice">Voice</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                    <input
                      type="text"
                      value={formData.assigned_language}
                      onChange={(e) => setFormData({...formData, assigned_language: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., English, Spanish, Hindi"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Customer Service, Sales"
                    />
                  </div>
                  <div className="mb-4 flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.supports_text}
                        onChange={(e) => setFormData({...formData, supports_text: e.target.checked})}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Supports Text</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.supports_voice}
                        onChange={(e) => setFormData({...formData, supports_voice: e.target.checked})}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Supports Voice</span>
                    </label>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="draft">Draft</option>
                      <option value="live">Live</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                    >
                      Update Avatar
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                    >
                      Cancel
                    </button>
            </div>
                </form>
          </div>
        </div>
      )}
    </div>
      </div>
    </AdminLayout>
  );
};

export default Avatars; 