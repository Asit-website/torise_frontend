import { useAuth } from "../../contexts/AuthContext";
import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import AdminLayout from './AdminLayout';
import { useNavigate } from 'react-router-dom';

const Users2 = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users1, setUsers1] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'client_admin',
    client_id: '',
    application_sid: [],
    status: 'active',
    password: ''
  });
  const [pagination, setPagination] = useState({ current: 1, total: 1, totalDocs: 0 });

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
    
    fetchUsers();
    fetchClients();
  }, [searchTerm]);

  useEffect(() => {
    fetchUsers();
  }, [pagination.current, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // First, test if the backend is responding
      try {
        const healthResponse = await api.get('/api/health');
        console.log('Backend health check:', healthResponse.data);
      } catch (healthError) {
        console.error('Backend health check failed:', healthError);
        toast.error('Backend server is not responding');
        setLoading(false);
        return;
      }
      
      console.log('Fetching users with search term:', searchTerm);
      const response = await api.get('/api/users', {
        params: { search: searchTerm, page: pagination.current, limit: 6 }
      });
      console.log('Users API Response:', response.data);
      console.log('Response status:', response.status);
      
      // Handle the correct response format from backend
      if (response.data && response.data.users) {
        setUsers1(response.data.users);
        setPagination({
          current: response.data.page || 1,
          total: response.data.totalPages || 1,
          totalDocs: response.data.total || response.data.users.length
        });
        console.log('Users set successfully:', response.data.users.length);
        console.log('First user data structure:', response.data.users[0]);
      } else {
        console.error('Unexpected response format:', response.data);
        setUsers1([]);
        setPagination({ current: 1, total: 1, totalDocs: 0 });
        toast.error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      setUsers1([]);
      setPagination({ current: 1, total: 1, totalDocs: 0 });
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await api.get('/api/clients');
      if (response.data && response.data.clients) {
        setClients(response.data.clients);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/api/users/${userId}`);
        toast.success('User deleted successfully');
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error('Failed to delete user');
      }
    }
  };

  // When client is selected, auto-assign application_sid
  const handleClientChange = (e) => {
    const clientId = e.target.value;
    setFormData(prev => ({ ...prev, client_id: clientId }));
    const selected = clients.find(c => c._id === clientId);
    setFormData(prev => ({ ...prev, application_sid: selected?.application_sid || [] }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!formData.password || formData.password.length < 6) {
      toast.error('Password is required and must be at least 6 characters.');
      return;
    }
    try {
      const payload = { ...formData };
      const response = await api.post('/api/users', payload);
      toast.success('User created successfully');
      setShowCreateModal(false);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        role: 'client_admin',
        client_id: '',
        application_sid: [],
        status: 'active',
        password: ''
      });
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(error.response?.data?.message || 'Failed to create user');
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(`/api/users/${selectedUser._id}`, formData);
      toast.success('User updated successfully');
      setShowEditModal(false);
      setSelectedUser(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        role: 'client_admin',
        client_id: '',
        status: 'active',
        password: ''
      });
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(error.response?.data?.message || 'Failed to update user');
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      role: user.role || 'client_admin',
      client_id: user.client_id || '',
      status: user.status || 'active',
      password: ''
    });
    setShowEditModal(true);
  };

  const openCreateModal = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      role: 'client_admin',
      client_id: '',
      application_sid: [],
      status: 'active',
      password: ''
    });
    setShowCreateModal(true);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading users...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600">Manage all users in the system</p>
            </div>
            <button 
              onClick={openCreateModal}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <span>+</span>
              Add User
            </button>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-lg shadow-sm w-full overflow-x-hidden">
            <div className="bg-blue-500 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate(-1)}
                  className="mr-3 text-blue-200 hover:text-white focus:outline-none"
                  title="Go Back"
                  style={{ fontSize: '1.5rem', lineHeight: 1 }}
                >
                  ←
                </button>
                <span className="text-xl">👥</span>
                <h2 className="text-xl font-semibold">Users ({users1?.length || 0})</h2>
              </div>
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                style={{ background: 'white' }}
              />
            </div>
            <div className="p-6">
              {users1?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No users found</p>
                </div>
              ) : (
                <div>
                  <p className="mb-4 text-sm text-gray-600">Total users: {users1?.length || 0}</p>
                  {/* Debug Info */}
                  <div className="mb-4 p-4 bg-gray-100 rounded-lg">
                    <h3 className="font-bold mb-2">Debug Info:</h3>
                    <p>Users array length: {users1?.length}</p>
                    <p>First user name: {users1?.[0]?.name || 'No name'}</p>
                    <p>First user email: {users1?.[0]?.email || 'No email'}</p>
                  </div>
                  {/* Simple Table */}
                  <table className="w-full table-auto border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-3 text-left font-semibold">First Name</th>
                        <th className="border border-gray-300 p-3 text-left font-semibold">Last Name</th>
                        <th className="border border-gray-300 p-3 text-left font-semibold">Email</th>
                        <th className="border border-gray-300 p-3 text-left font-semibold">Role</th>
                        <th className="border border-gray-300 p-3 text-left font-semibold">Client</th>
                        <th className="border border-gray-300 p-3 text-left font-semibold">Status</th>
                        <th className="border border-gray-300 p-3 text-left font-semibold">Joined</th>
                        <th className="border border-gray-300 p-3 text-left font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users1?.map((u, index) => {
                        return (
                          <tr key={u._id || index} className="hover:bg-gray-50">
                            <td className="border border-gray-300 p-3">
                              <span className="font-medium text-gray-900">
                                {u?.firstName || 'N/A'}
                              </span>
                            </td>
                            <td className="border border-gray-300 p-3">
                              <span className="font-medium text-gray-900">
                                {u?.lastName || 'N/A'}
                              </span>
                            </td>
                            <td className="border border-gray-300 p-3">
                              <span className="text-gray-700">
                                {u?.email || 'N/A'}
                              </span>
                            </td>
                            <td className="border border-gray-300 p-3">
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                u?.role ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {u?.role || 'N/A'}
                              </span>
                            </td>
                            <td className="border border-gray-300 p-3">
                              <span className="text-gray-700">
                                {u?.client_id?.name || 'No Client'}
                              </span>
                            </td>
                            <td className="border border-gray-300 p-3">
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                u?.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {u?.status || 'N/A'}
                              </span>
                            </td>
                            <td className="border border-gray-300 p-3">
                              <span className="text-gray-700">
                                {u?.createdAt ? new Date(u?.createdAt).toLocaleDateString() : 'N/A'}
                              </span>
                            </td>
                            <td className="border border-gray-300 p-3">
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => openEditModal(u)}
                                  className="bg-blue-500 hover:bg-blue-600 text-white p-1 rounded"
                                >
                                  ✏️
                                </button>
                                <button 
                                  className="bg-red-500 hover:bg-red-600 text-white p-1 rounded"
                                  onClick={() => handleDeleteUser(u._id)}
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
              )}
            </div>
          </div>

          {pagination && pagination.total > 1 && (
  <div className="flex justify-between items-center mt-6">
    <div className="text-sm text-gray-700">
      Showing {((pagination.current - 1) * 6) + 1} to {Math.min(pagination.current * 6, pagination.totalDocs)} of {pagination.totalDocs} results
    </div>
    <div className="flex space-x-2">
      <button
        onClick={() => setPagination({...pagination, current: pagination.current - 1})}
        disabled={pagination.current === 1}
        className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
      >
        Previous
      </button>
      <span className="px-3 py-2 text-sm">
        Page {pagination.current} of {pagination.total}
      </span>
      <button
        onClick={() => setPagination({...pagination, current: pagination.current + 1})}
        disabled={pagination.current === pagination.total}
        className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
      >
        Next
      </button>
    </div>
  </div>
)}

          {/* Create User Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Create New User</h2>
                <form onSubmit={handleCreateUser}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="client_admin">Client Admin</option>
                      <option value="client_manager">Client Manager</option>
                      <option value="client_viewer">Client Viewer</option>
                      <option value="internal_admin">Internal Admin</option>
                      <option value="super_admin">Super Admin</option>
                      <option value="business_manager">Business Manager</option>
                      <option value="campaign_manager">Campaign Manager</option>
                      <option value="support_agent">Support Agent</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Client</label>
                    <select
                      value={formData.client_id}
                      onChange={handleClientChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Client</option>
                      {clients.map(client => (
                        <option key={client._id} value={client._id}>{client.name}</option>
                  ))}
                </select>
              </div>
                  {formData.application_sid.length > 0 && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Application SID(s)</label>
                      <input
                        type="text"
                        value={formData.application_sid.join(', ')}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-200 bg-gray-100 rounded-lg"
                      />
                    </div>
                  )}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password <span className="text-red-500">*</span></label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Set a password (min 6 chars)"
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                    >
                      Create User
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

          {/* Edit User Modal */}
          {showEditModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Edit User</h2>
                <form onSubmit={handleEditUser}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="client_admin">Client Admin</option>
                      <option value="client_manager">Client Manager</option>
                      <option value="client_viewer">Client Viewer</option>
                      <option value="internal_admin">Internal Admin</option>
                      <option value="super_admin">Super Admin</option>
                      <option value="business_manager">Business Manager</option>
                      <option value="campaign_manager">Campaign Manager</option>
                      <option value="support_agent">Support Agent</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Client</label>
                    <select
                      value={formData.client_id}
                      onChange={handleClientChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Client</option>
                      {clients.map(client => (
                    <option key={client._id} value={client._id}>{client.name}</option>
                  ))}
                </select>
              </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="disabled">Disabled</option>
                      <option value="invited">Invited</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                    >
                      Update User
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

export default Users2; 