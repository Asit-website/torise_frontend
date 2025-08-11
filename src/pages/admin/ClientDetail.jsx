import { useParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Card, CardBody, Typography, Button, Badge } from '@material-tailwind/react';
import { Edit, UserPlus } from 'lucide-react';
import AdminLayout from './AdminLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ClientDetail = () => {
  const { id } = useParams();
  const [tab, setTab] = useState(0);
  const [client, setClient] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ avatarsText: 0, avatarsVoice: 0, voiceMinutes: 0, textSessions: 0, totalUsers: 0 });
  const [conversationLogs, setConversationLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  // User modal state
  const [showUserModal, setShowUserModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [userFormData, setUserFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'client_admin',
    client_id: id,
    status: 'active',
    password: ''
  });

  // Fetch client and users
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const clientRes = await api.get(`/api/clients/${id}`);
        setClient(clientRes.data);
        const usersRes = await api.get('/api/users', { params: { client: id, limit: 100 } });
        setUsers(usersRes.data.users || []);
        const avatarsText = (clientRes.data.assigned_avatar_ids || []).filter(a => a.type === 'text').length;
        const avatarsVoice = (clientRes.data.assigned_avatar_ids || []).filter(a => a.type === 'voice').length;
        setStats({
          avatarsText,
          avatarsVoice,
          voiceMinutes: clientRes.data.voiceMinutes || 0,
          textSessions: clientRes.data.textSessions || 0,
          totalUsers: (usersRes.data.users || []).length
        });
      } catch (err) {
        setClient(null);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Fetch conversation logs when tab changes
  useEffect(() => {
    if (tab === 4 && client) { // Conversations Logs tab
      fetchConversationLogs();
    }
  }, [tab, client]);

  const fetchConversationLogs = async () => {
    if (!client) return;
    
    setLoadingLogs(true);
    try {
      let allLogs = [];
      
      // First, fetch logs by client_id (for chat conversations)
      try {
        const clientResponse = await api.get('/api/conversations', {
          params: { 
            clientId: client._id,
            limit: 100
          }
        });
        if (clientResponse.data && clientResponse.data.conversations) {
          allLogs = [...allLogs, ...clientResponse.data.conversations];
        }
      } catch (error) {
        console.error('Error fetching logs by client_id:', error);
      }
      
      // Then, fetch logs for this client's application SIDs (for voice conversations)
      const applicationSids = client.application_sid || [];
      if (applicationSids.length > 0) {
        for (const sid of applicationSids) {
          try {
            const response = await api.get('/api/conversations', {
              params: { 
                application_sid: sid,
                limit: 50
              }
            });
            if (response.data && response.data.conversations) {
              allLogs = [...allLogs, ...response.data.conversations];
            }
          } catch (error) {
            console.error(`Error fetching logs for SID ${sid}:`, error);
          }
        }
      }
      
      // Remove duplicates based on call_sid
      const uniqueLogs = allLogs.filter((log, index, self) => 
        index === self.findIndex(l => l.call_sid === log.call_sid)
      );
      
      // Sort by date (newest first)
      uniqueLogs.sort((a, b) => new Date(b.started_at) - new Date(a.started_at));
      setConversationLogs(uniqueLogs);
      
      console.log(`Fetched ${uniqueLogs.length} conversation logs for client ${client.name}`);
    } catch (error) {
      console.error('Error fetching conversation logs:', error);
      toast.error('Failed to fetch conversation logs');
    } finally {
      setLoadingLogs(false);
    }
  };

  const [selectedConversation, setSelectedConversation] = useState(null);
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Overview");
  const transcriptionRef = useRef();

  const viewConversationDetails = (log) => {
    setSelectedConversation(log);
    setOpen(true);
  };

  // Calculate metadata for the modal
  const metadata = selectedConversation ? {
    date: selectedConversation.created_at ? new Date(selectedConversation.created_at).toLocaleDateString() : "—",
    duration: selectedConversation.duration_minutes || "0s",
    status: selectedConversation.answered ? "Answered" : "Not Answered",
    channelType: selectedConversation.channel_type || "Unknown",
    applicationSid: selectedConversation.application_sid || "N/A"
  } : {
    date: "—",
    duration: "0s",
    status: "Unknown",
    channelType: "Unknown",
    applicationSid: "N/A"
  };

  // Add/Edit User Handlers
  const openAddUserModal = () => {
    setEditUser(null);
    setUserFormData({
      firstName: '',
      lastName: '',
      email: '',
      role: 'client_admin',
      client_id: id,
      status: 'active',
      password: ''
    });
    setShowUserModal(true);
  };
  const openEditUserModal = (user) => {
    setEditUser(user);
    setUserFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      client_id: id,
      status: user.status,
      password: ''
    });
    setShowUserModal(true);
  };
  const handleUserModalClose = () => {
    setShowUserModal(false);
    setEditUser(null);
  };
  const handleUserFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editUser) {
        // Edit user
        await api.put(`/api/users/${editUser._id}`, userFormData);
        toast.success('User updated successfully');
      } else {
        // Add user
        await api.post('/api/users', userFormData);
        toast.success('User created successfully');
      }
      handleUserModalClose();
      // Refresh users
      const usersRes = await api.get('/api/users', { params: { client: id, limit: 100 } });
      setUsers(usersRes.data.users || []);
      setStats((s) => ({ ...s, totalUsers: (usersRes.data.users || []).length }));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save user');
    }
  };
  // Disable/Enable User
  const handleDisableUser = async (user) => {
    try {
      await api.put(`/api/users/${user._id}`, { ...user, status: user.status === 'active' ? 'disabled' : 'active' });
      toast.success(user.status === 'active' ? 'User disabled' : 'User enabled');
      const usersRes = await api.get('/api/users', { params: { client: id, limit: 100 } });
      setUsers(usersRes.data.users || []);
      setStats((s) => ({ ...s, totalUsers: (usersRes.data.users || []).length }));
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };
  // Delete User
  const handleDeleteUser = async (user) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/api/users/${user._id}`);
      toast.success('User deleted');
      const usersRes = await api.get('/api/users', { params: { client: id, limit: 100 } });
      setUsers(usersRes.data.users || []);
      setStats((s) => ({ ...s, totalUsers: (usersRes.data.users || []).length }));
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  // Pagination logic for conversation logs
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = conversationLogs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(conversationLogs.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // PDF Download Function
  const downloadTranscriptionAsPDF = () => {
    if (!selectedConversation?.message_log?.length) {
      toast.error('No messages to download');
      return;
    }

    try {
      // Create PDF content
      const conversationId = selectedConversation?.call_sid || selectedConversation?.conversation_id || 'Unknown';
      const date = selectedConversation?.created_at ? new Date(selectedConversation.created_at).toLocaleDateString() : 'Unknown';
      const channelType = selectedConversation?.channel_type || 'Unknown';
      const applicationSid = selectedConversation?.application_sid || 'N/A';
      
      let pdfContent = `
        <html>
          <head>
            <title>Conversation Transcript - ${conversationId}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
              .metadata { background: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
              .metadata table { width: 100%; }
              .metadata td { padding: 5px; }
              .message { margin: 10px 0; padding: 10px; border-radius: 5px; }
              .user-message { background: #e8f5e8; border-left: 4px solid #28a745; margin-left: 20px; }
              .agent-message { background: #f0f0f0; border-left: 4px solid #007bff; margin-right: 20px; }
              .timestamp { font-size: 12px; color: #666; margin-top: 5px; }
              .sender { font-weight: bold; margin-bottom: 5px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Conversation Transcript</h1>
              <h2>${conversationId}</h2>
            </div>
            
            <div class="metadata">
              <table>
                <tr><td><strong>Date:</strong></td><td>${date}</td></tr>
                <tr><td><strong>Channel Type:</strong></td><td>${channelType}</td></tr>
                <tr><td><strong>Application SID:</strong></td><td>${applicationSid}</td></tr>
                <tr><td><strong>Total Messages:</strong></td><td>${selectedConversation.message_log.length}</td></tr>
              </table>
            </div>
            
            <h3>Conversation Messages:</h3>
      `;

      // Add each message to PDF content
      selectedConversation.message_log.forEach((message, index) => {
        const isUser = message.sender === 'user';
        const timestamp = message.timestamp ? new Date(message.timestamp).toLocaleString() : '—';
        const sender = isUser ? 'User' : 'Agent';
        
        pdfContent += `
          <div class="message ${isUser ? 'user-message' : 'agent-message'}">
            <div class="sender">${sender}</div>
            <div>${message.message}</div>
            <div class="timestamp">${timestamp}</div>
          </div>
        `;
      });

      pdfContent += `
          </body>
        </html>
      `;

      // Create blob and download
      const blob = new Blob([pdfContent], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `conversation-${conversationId}-${date}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Conversation transcript downloaded successfully!');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download transcript');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-4 text-blue-600 text-lg">Loading...</span>
        </div>
      </AdminLayout>
    );
  }
  if (!client) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <span className="text-red-600 text-lg">Client not found.</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Header */}
      <Card className="mb-6">
        <CardBody className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-700 border">
              {client.name?.slice(0,2).toUpperCase()}
            </div>
            <div>
              <Typography variant="h4" className="font-bold mb-1">{client.name}</Typography>
              <div className="flex items-center gap-2 mb-1">
                <Badge color={client.status === 'active' ? 'green' : 'red'} className="uppercase">{client.status}</Badge>
                <Button size="sm" color="blue" className="ml-2 px-4 py-1"><Edit className="h-4 w-4 inline mr-1" />Edit</Button>
              </div>
              <div className="text-sm text-gray-600 flex flex-wrap gap-4">
                <span>Primary contact <b>{client.contact_email || 'N/A'}</b></span>
                <span>Default Language: <b>{client.default_language || 'N/A'}</b></span>
                <span>Service: <b>{client.service || 'Standard'}</b></span>
                <span>Last Activity: <b>{client.updated_at ? new Date(client.updated_at).toLocaleDateString() : 'N/A'}</b></span>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-6">
          {['Overview', 'Users', 'Avatars', 'Application SIDs', 'Conversations Logs'].map((label, idx) => (
            <button
              key={label}
              className={`py-2 px-4 font-semibold border-b-2 transition-colors ${tab === idx ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-blue-600'}`}
              onClick={() => setTab(idx)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {/* Tab Content */}
      {tab === 0 && (
        <div>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="p-4 flex flex-col items-center justify-center">
              <Typography variant="h6">Total Avatars Assigned</Typography>
              <Typography variant="h4" className="font-bold mt-2">{stats.avatarsText} TEXT, {stats.avatarsVoice} VOICE</Typography>
            </Card>
            <Card className="p-4 flex flex-col items-center justify-center">
              <Typography variant="h6">Monthly Minutes Used (Voice)</Typography>
              <Typography variant="h4" className="font-bold mt-2">{stats.voiceMinutes}</Typography>
            </Card>
            <Card className="p-4 flex flex-col items-center justify-center">
              <Typography variant="h6">Monthly Minutes/Session Used (Text)</Typography>
              <Typography variant="h4" className="font-bold mt-2">{stats.textSessions}</Typography>
            </Card>
            <Card className="p-4 flex flex-col items-center justify-center">
              <Typography variant="h6">Total Users</Typography>
              <Typography variant="h4" className="font-bold mt-2">{stats.totalUsers}</Typography>
            </Card>
          </div>
        </div>
      )}
      {tab === 1 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <Typography variant="h5">Users</Typography>
            <Button color="blue" size="sm" className="flex items-center gap-2" onClick={openAddUserModal}><UserPlus className="h-4 w-4" />Add user</Button>
          </div>
          {/* Users Table */}
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-200 p-3 text-left font-semibold">NAME</th>
                  <th className="border border-gray-200 p-3 text-left font-semibold">EMAIL</th>
                  <th className="border border-gray-200 p-3 text-left font-semibold">ROLE</th>
                  <th className="border border-gray-200 p-3 text-left font-semibold">STATUS</th>
                  <th className="border border-gray-200 p-3 text-left font-semibold">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="border border-gray-200 p-3 flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-700 mr-2">{u.name?.slice(0,2).toUpperCase()}</span>
                      {u.name}
                    </td>
                    <td className="border border-gray-200 p-3">{u.email}</td>
                    <td className="border border-gray-200 p-3">{u.role}</td>
                    <td className="border border-gray-200 p-3">{u.status}</td>
                    <td className="border border-gray-200 p-3">
                      <div className="flex gap-2">
                        <Button size="sm" color="blue" variant="outlined" onClick={() => openEditUserModal(u)}>Edit</Button>
                        <Button size="sm" color="gray" variant="outlined" onClick={() => handleDisableUser(u)}>{u.status === 'active' ? 'Disable' : 'Enable'}</Button>
                        <Button size="sm" color="red" variant="outlined" onClick={() => handleDeleteUser(u)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* User Modal */}
          {showUserModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">{editUser ? 'Edit User' : 'Register User for Client'}</h2>
                <form onSubmit={handleUserFormSubmit}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      value={userFormData.firstName}
                      onChange={e => setUserFormData({ ...userFormData, firstName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      value={userFormData.lastName}
                      onChange={e => setUserFormData({ ...userFormData, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={userFormData.email}
                      onChange={e => setUserFormData({ ...userFormData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                    <select
                      value={userFormData.role}
                      onChange={e => setUserFormData({ ...userFormData, role: e.target.value })}
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
                      onChange={e => setUserFormData({ ...userFormData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="invited">Invited</option>
                    </select>
                  </div>
                  {!editUser && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={userFormData.password}
                        onChange={e => setUserFormData({ ...userFormData, password: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Set a password (min 6 chars)"
                        required
                        minLength={6}
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                    >
                      {editUser ? 'Update User' : 'Create User'}
                    </button>
                    <button
                      type="button"
                      onClick={handleUserModalClose}
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
      )}
      {tab === 3 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <Typography variant="h5">Application SIDs</Typography>
            <div className="text-sm text-gray-600">
              Total SIDs: {client?.application_sid?.length || 0}
            </div>
          </div>
          
          {client?.application_sid && client.application_sid.length > 0 ? (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 p-3 text-left font-semibold">#</th>
                      <th className="border border-gray-200 p-3 text-left font-semibold">Application SID</th>
                      <th className="border border-gray-200 p-3 text-left font-semibold">Status</th>
                      <th className="border border-gray-200 p-3 text-left font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {client.application_sid.map((sid, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-200 p-3">
                          <span className="font-semibold">{index + 1}</span>
                        </td>
                        <td className="border border-gray-200 p-3">
                          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                            {sid}
                          </span>
                        </td>
                        <td className="border border-gray-200 p-3">
                          <Badge color="green" className="uppercase">Active</Badge>
                        </td>
                                                 <td className="border border-gray-200 p-3">
                           <Button 
                             size="sm" 
                             color="gray" 
                             variant="outlined"
                             onClick={() => {
                               navigator.clipboard.writeText(sid);
                               toast.success('SID copied to clipboard!');
                             }}
                           >
                             Copy SID
                           </Button>
                         </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No Application SIDs assigned to this client.</p>
              <p className="text-sm mt-2">Application SIDs are used to identify and track client-specific conversations and activities.</p>
            </div>
          )}
        </div>
      )}
      {tab === 4 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <Typography variant="h5">Conversation Logs</Typography>
            <div className="text-sm text-gray-600">
              Application SIDs: {client?.application_sid?.join(', ') || 'None'}
            </div>
          </div>
          
          {loadingLogs ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2">Loading conversation logs...</span>
            </div>
          ) : conversationLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No conversation logs found for this client.</p>
              <p className="text-sm mt-2">Application SIDs: {client?.application_sid?.join(', ') || 'None'}</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                                 <table className="w-full border-collapse border border-gray-200">
                   <thead>
                     <tr className="bg-gray-50">
                       <th className="border border-gray-200 p-3 text-left font-semibold">Call SID</th>
                       <th className="border border-gray-200 p-3 text-left font-semibold">Application SID</th>
                       <th className="border border-gray-200 p-3 text-left font-semibold">Channel Type</th>
                       <th className="border border-gray-200 p-3 text-left font-semibold">From</th>
                       <th className="border border-gray-200 p-3 text-left font-semibold">To</th>
                       <th className="border border-gray-200 p-3 text-left font-semibold">Attempted At</th>
                       <th className="border border-gray-200 p-3 text-left font-semibold">Answered</th>
                       <th className="border border-gray-200 p-3 text-left font-semibold">Duration</th>
                       <th className="border border-gray-200 p-3 text-left font-semibold">Messages</th>
                       <th className="border border-gray-200 p-3 text-left font-semibold">Actions</th>
                     </tr>
                   </thead>
                  <tbody>
                                         {currentItems.map((log, index) => (
                       <tr key={log._id || index} className="hover:bg-gray-50">
                         <td className="border border-gray-200 p-3">
                           <span className="font-mono text-sm">{log.call_sid || log.conversation_id}</span>
                         </td>
                         <td className="border border-gray-200 p-3">
                           <span className="text-gray-700">{log.application_sid || 'N/A'}</span>
                         </td>
                         <td className="border border-gray-200 p-3">
                                                       <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                              log.channel_type === 'voice' ? 'bg-blue-100 text-blue-800' : 
                              log.channel_type === 'chat' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {log.channel_type || 'N/A'}
                            </span>
                         </td>
                         <td className="border border-gray-200 p-3">
                           <span className="text-gray-700">{log.from_number || log.calling_number || 'N/A'}</span>
                         </td>
                         <td className="border border-gray-200 p-3">
                           <span className="text-gray-700">{log.to_number || log.ivr_number || 'N/A'}</span>
                         </td>
                         <td className="border border-gray-200 p-3">
                           <span className="text-gray-700">
                             {log.started_at ? new Date(log.started_at).toLocaleString() : 'N/A'}
                           </span>
                         </td>
                         <td className="border border-gray-200 p-3">
                           <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                             log.answered ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                           }`}>
                             {log.answered ? 'Yes' : 'No'}
                           </span>
                         </td>
                         <td className="border border-gray-200 p-3">
                           <span className="text-gray-700 font-medium">
                             {log.duration_minutes || '0s'}
                           </span>
                         </td>
                         <td className="border border-gray-200 p-3">
                           <span className="text-gray-700 font-medium">
                             {log.message_log?.length || 0}
                           </span>
                         </td>
                         <td className="border border-gray-200 p-3">
                           <button
                             onClick={() => viewConversationDetails(log)}
                             className="text-blue-600 text-xs underline hover:text-blue-800 transition"
                           >
                             View Conversation
                           </button>
                         </td>
                       </tr>
                     ))}
                                    </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between mt-4 px-4 py-3 bg-white border-t border-gray-200">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-700">
                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, conversationLogs.length)} of {conversationLogs.length} results
                  </span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    <option value={5}>5 per page</option>
                    <option value={10}>10 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => handlePageChange(pageNumber)}
                        className={`px-3 py-1 text-sm border rounded ${
                          currentPage === pageNumber
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
         </div>
       )}

       {/* Modal Section */}
       {open && (
         <div className="fixed inset-0 z-50 flex items-center justify-center w-full h-full bg-black bg-opacity-40">
           <div className="relative w-full h-full bg-white p-6 overflow-hidden max-w-6xl mx-auto rounded-lg shadow-lg">
             <button
               onClick={() => setOpen(false)}
               className="absolute top-4 right-[20rem] text-gray-500 hover:text-gray-800 text-3xl font-bold z-50"
             >
               &times;
             </button>
             <div className="flex gap-6 h-full">
               {/* Left side */}
               <div className="flex-1 overflow-y-auto pr-4 border-r">
                 <h3 className="text-lg font-semibold mb-4">
                   Conversation: {selectedConversation?.call_sid || selectedConversation?.conversation_id}
                 </h3>

                 {/* Tabs */}
                 <div className="flex space-x-4 border-b mb-4">
                   {["Overview", "Transcription"].map((tab) => (
                     <button
                       key={tab}
                       className={`pb-2 text-sm font-medium ${
                         activeTab === tab
                           ? "border-b-2 border-black text-black"
                           : "text-gray-500"
                       }`}
                       onClick={() => setActiveTab(tab)}
                     >
                       {tab}
                     </button>
                   ))}
                 </div>

                 {/* Tab content */}
                 {activeTab === "Overview" && (
                   <div className="text-sm text-gray-700 space-y-2 p-4 bg-gray-50 rounded shadow">
                     <p>Conversation summary and metadata will be shown here.</p>
                     <p className="text-xs text-gray-500 mt-2">
                       Call status: <span className="text-green-600 font-medium">{metadata.status}</span>
                     </p>
                     <p className="text-xs text-gray-500">
                       Channel Type: <span className="text-blue-600 font-medium">{metadata.channelType}</span>
                     </p>
                     <p className="text-xs text-gray-500">
                       Application SID: <span className="text-purple-600 font-medium">{metadata.applicationSid}</span>
                     </p>
                   </div>
                 )}

                                   {activeTab === "Transcription" && (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-semibold">Conversation Messages</h4>
                        {selectedConversation?.message_log?.length > 0 && (
                          <Button 
                            size="sm" 
                            color="blue" 
                            variant="outlined"
                            onClick={() => downloadTranscriptionAsPDF()}
                            className="flex items-center gap-2"
                          >
                            📄 Download PDF
                          </Button>
                        )}
                      </div>
                      <div ref={transcriptionRef} className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
                        {selectedConversation?.message_log?.length ? (
                          selectedConversation.message_log.map((e, i) => {
                            const isUser = e.sender === "user";
                            const timestamp = e.timestamp
                              ? new Date(e.timestamp).toLocaleString()
                              : "—";
                            return (
                              <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                                <div className="max-w-[80%]">
                                  <div
                                    className={`rounded-xl px-4 py-2 text-sm shadow ${
                                      isUser
                                        ? "bg-green-50 text-gray-800 border border-green-200"
                                        : "bg-gray-100 text-gray-900 border border-gray-300"
                                    }`}
                                  >
                                    {e.message}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">{timestamp}</div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-sm text-gray-500">No messages found.</div>
                        )}
                      </div>
                    </div>
                  )}
               </div>

               {/* Right metadata panel */}
               <div className="w-64 flex-shrink-0 bg-gray-50 rounded p-4 shadow-inner overflow-y-auto h-full">
                 <h4 className="text-sm font-semibold mb-3">Metadata</h4>
                 <ul className="text-sm text-gray-700 space-y-2">
                   <li><strong>Date:</strong> {metadata.date}</li>
                   <li><strong>Connection duration:</strong> {metadata.duration} Sec</li>
                   <li><strong>Call status:</strong> <span className="text-green-600 font-medium">{metadata.status}</span></li>
                   <li><strong>Channel Type:</strong> <span className="text-blue-600 font-medium">{metadata.channelType}</span></li>
                   <li><strong>Application SID:</strong> <span className="text-purple-600 font-medium">{metadata.applicationSid}</span></li>
                 </ul>
               </div>
             </div>
           </div>
         </div>
       )}
     </AdminLayout>
   );
 };

export default ClientDetail; 