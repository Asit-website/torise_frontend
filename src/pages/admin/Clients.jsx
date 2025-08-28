import { useAuth } from "../../contexts/AuthContext";
import { useState, useEffect } from "react";
import api from '../../services/api';
import toast from 'react-hot-toast';
import AdminLayout from './AdminLayout';
import { Eye, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

const Clients = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    country: '',
    contact_email: '',
    application_sid: '', // comma-separated string for input
    supports_text: false,
    supports_voice: false,
    status: 'active',
    notes: '',
    service: 'Standard',
    default_language: ''
  });
  const [userFormData, setUserFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'client_admin',
    client_id: '',
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
    
    fetchClients();
  }, [searchTerm]);

  useEffect(() => {
    fetchClients();
  }, [pagination.current, searchTerm]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      console.log('Fetching clients with search term:', searchTerm);
      const response = await api.get('/api/clients', {
        params: { search: searchTerm, page: pagination.current, limit: 6 }
      });
      console.log('Clients API Response:', response.data);
      console.log('Response status:', response.status);
      
      // Handle the correct response format from backend
      if (response.data && response.data.clients) {
        setClients(response.data.clients);
        setPagination({
          current: response.data.page || 1,
          total: response.data.totalPages || 1,
          totalDocs: response.data.total || response.data.clients.length
        });
        console.log('Clients set successfully:', response.data.clients.length);
        console.log('First client data structure:', response.data.clients[0]);
      } else {
        console.error('Unexpected response format:', response.data);
        setClients([]);
        setPagination({ current: 1, total: 1, totalDocs: 0 });
        toast.error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      setClients([]);
      setPagination({ current: 1, total: 1, totalDocs: 0 });
      toast.error('Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClient = async (clientId) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        await api.delete(`/api/clients/${clientId}`);
        toast.success('Client deleted successfully');
        fetchClients();
      } catch (error) {
        console.error('Error deleting client:', error);
        toast.error('Failed to delete client');
      }
    }
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        application_sid: formData.application_sid.split(',').map(sid => sid.trim()).filter(Boolean)
      };
      const response = await api.post('/api/clients', payload);
      toast.success('Client created successfully');
      setShowCreateModal(false);
      setFormData({
        name: '',
        industry: '',
        country: '',
        contact_email: '',
        application_sid: '',
        supports_text: false,
        supports_voice: false,
        status: 'active',
        notes: '',
        default_language: ''
      });
      fetchClients();
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error(error.response?.data?.message || 'Failed to create client');
    }
  };

  const handleEditClient = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        application_sid: formData.application_sid.split(',').map(sid => sid.trim()).filter(Boolean)
      };
      const response = await api.put(`/api/clients/${selectedClient._id}`, payload);
      toast.success('Client updated successfully');
      setShowEditModal(false);
      setSelectedClient(null);
      setFormData({
        name: '',
        industry: '',
        country: '',
        contact_email: '',
        application_sid: '',
        supports_text: false,
        supports_voice: false,
        status: 'active',
        notes: '',
        default_language: ''
      });
      fetchClients();
    } catch (error) {
      console.error('Error updating client:', error);
      toast.error(error.response?.data?.message || 'Failed to update client');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/users', userFormData);
      toast.success('User created successfully');
      setShowUserModal(false);
      setUserFormData({
        firstName: '',
        lastName: '',
        email: '',
        role: 'client_admin',
        client_id: '',
        status: 'active',
        password: ''
      });
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(error.response?.data?.message || 'Failed to create user');
    }
  };

  const openEditModal = (client) => {
    setSelectedClient(client);
    setFormData({
      name: client.name || '',
      industry: client.industry || '',
      country: client.country || '',
      contact_email: client.contact_email || '',
      application_sid: (client.application_sid || []).join(', '),
      supports_text: client.supports_text || false,
      supports_voice: client.supports_voice || false,
      status: client.status || 'active',
      notes: client.notes || '',
      service: client.service || 'Standard',
      default_language: client.default_language || ''
    });
    setShowEditModal(true);
  };

  const openCreateModal = () => {
    setFormData({
      name: '',
      industry: '',
      country: '',
      contact_email: '',
      application_sid: '',
      supports_text: false,
      supports_voice: false,
      status: 'active',
      notes: '',
      service: 'Standard',
      default_language: ''
    });
    setShowCreateModal(true);
  };

  const openUserModal = (client) => {
    setUserFormData({
      firstName: '',
      lastName: '',
      email: '',
      role: 'client_admin',
      client_id: client._id,
      status: 'active',
      password: ''
    });
    setShowUserModal(true);
  };

  const exportToExcel = () => {
    try {
      // Prepare data for export
      const exportData = clients.map(client => ({
        'Client Name': client.name || 'N/A',
        'Industry': client.industry || 'N/A',
        'Country': client.country || 'N/A',
        'Contact Email': client.contact_email || 'N/A',
        'Service': client.service || 'Standard',
        'Status': client.status || 'N/A',
        'Application SIDs': Array.isArray(client.application_sid) ? client.application_sid.join(', ') : client.application_sid || 'N/A',
        'Supports Text': client.supports_text ? 'Yes' : 'No',
        'Supports Voice': client.supports_voice ? 'Yes' : 'No',
        'Default Language': client.default_language || 'N/A',
        'Notes': client.notes || 'N/A',
        'Created At': client.created_at ? new Date(client.created_at).toLocaleDateString() : 'N/A',
        'Updated At': client.updated_at ? new Date(client.updated_at).toLocaleDateString() : 'N/A'
      }));

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Auto-size columns
      const columnWidths = [
        { wch: 20 }, // Client Name
        { wch: 15 }, // Industry
        { wch: 15 }, // Country
        { wch: 25 }, // Contact Email
        { wch: 15 }, // Service
        { wch: 10 }, // Status
        { wch: 30 }, // Application SIDs
        { wch: 12 }, // Supports Text
        { wch: 12 }, // Supports Voice
        { wch: 15 }, // Default Language
        { wch: 30 }, // Notes
        { wch: 15 }, // Created At
        { wch: 15 }  // Updated At
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Clients');

      // Generate filename with current date
      const date = new Date().toISOString().split('T')[0];
      const filename = `clients_export_${date}.xlsx`;

      // Save file
      XLSX.writeFile(workbook, filename);
      
      toast.success('Clients exported to Excel successfully!');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Failed to export clients to Excel');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading clients...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Client Management</h1>
              <p className="text-gray-600">Manage all clients in the system</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={exportToExcel}
                disabled={clients.length === 0}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center gap-2"
                title="Export clients to Excel"
              >
                <Download className="h-4 w-4" />
                Export to Excel
              </button>
              <button 
                onClick={openCreateModal}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <span>+</span>
                Add Client
              </button>
            </div>
          </div>

          {/* Clients Table */}
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
                <span className="text-xl">🏢</span>
                <h2 className="text-xl font-semibold">Clients ({clients?.length || 0})</h2>
              </div>
              <input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                style={{ background: 'white' }}
              />
            </div>
            <div className="p-6">
              {clients?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No clients found</p>
                </div>
              ) : (
                <div>
                  <p className="mb-4 text-sm text-gray-600">Total clients: {clients?.length || 0}</p>
                  {/* Debug Info */}
                  <div className="mb-4 p-4 bg-gray-100 rounded-lg">
                    <h3 className="font-bold mb-2">Debug Info:</h3>
                    <p>Clients array length: {clients?.length}</p>
                    <p>First client name: {clients?.[0]?.name || 'No name'}</p>
                    <p>First client email: {clients?.[0]?.contact_email || 'No email'}</p>
                  </div>
                  {/* Simple Table */}
                  <table className="w-full table-auto border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-3 text-left font-semibold">Client Name</th>
                        <th className="border border-gray-300 p-3 text-left font-semibold">Industry</th>
                        <th className="border border-gray-300 p-3 text-left font-semibold">Country</th>
                        <th className="border border-gray-300 p-3 text-left font-semibold">Contact Email</th>
                        <th className="border border-gray-300 p-3 text-left font-semibold">Service</th>
                        <th className="border border-gray-300 p-3 text-left font-semibold">Status</th>
                        <th className="border border-gray-300 p-3 text-left font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clients?.map((client, index) => {
                        return (
                          <tr key={client._id || index} className="hover:bg-gray-50">
                            <td className="border border-gray-300 p-3">
                              <span className="font-medium text-gray-900">
                                {client?.name || 'N/A'}
                              </span>
                            </td>
                            <td className="border border-gray-300 p-3">
                              <span className="text-gray-700">
                                {client?.industry || 'N/A'}
                              </span>
                            </td>
                            <td className="border border-gray-300 p-3">
                              <span className="text-gray-700">
                                {client?.country || 'N/A'}
                              </span>
                            </td>
                            <td className="border border-gray-300 p-3">
                              <span className="text-gray-700">
                                {client?.contact_email || 'N/A'}
                              </span>
                            </td>
                            <td className="border border-gray-300 p-3">
                              <span className="text-gray-700">
                                {client?.service || 'Standard'}
                              </span>
                            </td>
                            <td className="border border-gray-300 p-3">
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                client?.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {client?.status || 'N/A'}
                              </span>
                            </td>
                            <td className="border border-gray-300 p-3">
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => openEditModal(client)}
                                  className="bg-blue-500 hover:bg-blue-600 text-white p-1 rounded"
                                  title="Edit Client"
                                >
                                  ✏️
                                </button>
                                <button 
                                  onClick={() => openUserModal(client)}
                                  className="bg-green-500 hover:bg-green-600 text-white p-1 rounded"
                                  title="Register User for this Client"
                                >
                                  👤
                                </button>
                                <button 
                                  className="bg-red-500 hover:bg-red-600 text-white p-1 rounded"
                                  onClick={() => handleDeleteClient(client._id)}
                                  title="Delete Client"
                                >
                                  🗑️
                                </button>
                                <button
                                  className="bg-gray-500 hover:bg-gray-700 text-white p-1 rounded"
                                  onClick={() => navigate(`/admin/clients/${client._id}`)}
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4" />
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

          {/* Create Client Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md overflow-y-auto max-h-[80vh]">
                <h2 className="text-xl font-bold mb-4">Create New Client</h2>
                <form onSubmit={handleCreateClient}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                    <input
                      type="text"
                      value={formData.industry}
                      onChange={(e) => setFormData({...formData, industry: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({...formData, country: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
              </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                    <input
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
              </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Application SID(s) (comma separated)</label>
                    <input
                      type="text"
                      value={formData.application_sid}
                      onChange={(e) => setFormData({...formData, application_sid: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. 1,2,3"
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
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                </select>
              </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
                    <select
                      value={formData.service}
                      onChange={(e) => setFormData({...formData, service: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Standard">Standard</option>
                      <option value="Premium">Premium</option>
                      <option value="Enterprise">Enterprise</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="3"
                    />
              </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Default Language (TTS/SSML)</label>
                    <select
                      value={formData.default_language}
                      onChange={e => setFormData({ ...formData, default_language: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Language</option>
                      <option value="en-US">English (US)</option>
                      <option value="hi-IN">Hindi (IN)</option>
                      <option value="en-IN">English (IN)</option>
                      <option value="ta-IN">Tamil (IN)</option>
                      <option value="mr-IN">Marathi (IN)</option>
                      {/* Add more as needed */}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                    >
                      Create Client
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

          {/* Edit Client Modal */}
          {showEditModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md overflow-y-auto max-h-[80vh]">
                <h2 className="text-xl font-bold mb-4">Edit Client</h2>
                <form onSubmit={handleEditClient}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                    <input
                      type="text"
                      value={formData.industry}
                      onChange={(e) => setFormData({...formData, industry: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({...formData, country: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                    <input
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Application SID(s) (comma separated)</label>
                    <input
                      type="text"
                      value={formData.application_sid}
                      onChange={(e) => setFormData({...formData, application_sid: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. 1,2,3"
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
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
                    <select
                      value={formData.service}
                      onChange={(e) => setFormData({...formData, service: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Standard">Standard</option>
                      <option value="Premium">Premium</option>
                      <option value="Enterprise">Enterprise</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="3"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Default Language (TTS/SSML)</label>
                    <select
                      value={formData.default_language}
                      onChange={e => setFormData({ ...formData, default_language: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Language</option>
                      <option value="en-US">English (US)</option>
                      <option value="hi-IN">Hindi (IN)</option>
                      <option value="en-IN">English (IN)</option>
                      <option value="ta-IN">Tamil (IN)</option>
                      <option value="mr-IN">Marathi (IN)</option>
                      {/* Add more as needed */}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                    >
                      Update Client
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

          {/* Create User for Client Modal */}
          {showUserModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Register User for Client</h2>
                <form onSubmit={handleCreateUser}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      value={userFormData.firstName}
                      onChange={(e) => setUserFormData({...userFormData, firstName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      value={userFormData.lastName}
                      onChange={(e) => setUserFormData({...userFormData, lastName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={userFormData.email}
                      onChange={(e) => setUserFormData({...userFormData, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
              </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                    <select
                      value={userFormData.role}
                      onChange={(e) => setUserFormData({...userFormData, role: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="client_admin">Client Admin</option>
                      <option value="client_manager">Client Manager</option>
                      <option value="client_viewer">Client Viewer</option>
                    </select>
              </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={userFormData.status}
                      onChange={(e) => setUserFormData({...userFormData, status: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="invited">Invited</option>
                    </select>
              </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password (Optional)</label>
                    <input
                      type="password"
                      value={userFormData.password}
                      onChange={(e) => setUserFormData({...userFormData, password: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Leave empty for auto-generated password"
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
                      onClick={() => setShowUserModal(false)}
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

export default Clients; 