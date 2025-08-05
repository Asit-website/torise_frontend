import { useAuth } from '../contexts/AuthContext';
import { 
  Card, 
  CardBody, 
  CardHeader, 
  Typography, 
  Button,
  Badge
} from "@material-tailwind/react";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import AdminLayout from './admin/AdminLayout';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Main Dashboard component
const Dashboard = () => {
  const { user, loading } = useAuth();
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [avatars, setAvatars] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [avatarsLoading, setAvatarsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [usageRange, setUsageRange] = useState('7');
  const usageData = {
    '7': {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      minutes: [120, 150, 170, 140, 180, 200, 220],
      text: [300, 320, 310, 400, 420, 410, 430],
    },
    '30': {
      labels: [
        'Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7', 'Day 8', 'Day 9', 'Day 10',
        'Day 11', 'Day 12', 'Day 13', 'Day 14', 'Day 15', 'Day 16', 'Day 17', 'Day 18', 'Day 19', 'Day 20',
        'Day 21', 'Day 22', 'Day 23', 'Day 24', 'Day 25', 'Day 26', 'Day 27', 'Day 28', 'Day 29', 'Day 30',
      ],
      minutes: [120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230, 240, 250, 260, 270, 280, 290, 300, 310, 320, 330, 340, 350, 360, 370, 380, 390, 400, 410],
      text: [300, 310, 320, 330, 340, 350, 360, 370, 380, 390, 400, 410, 420, 430, 440, 450, 460, 470, 480, 490, 500, 510, 520, 530, 540, 550, 560, 570, 580, 590],
    },
  };
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [addUserForm, setAddUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'client_admin',
    client_id: '',
    status: 'active',
    password: ''
  });
  const [addClientForm, setAddClientForm] = useState({
    name: '',
    industry: '',
    country: '',
    contact_email: '',
    app_sid: '',
    supports_text: false,
    supports_voice: false,
    status: 'active',
    notes: '',
    default_language: ''
  });
  const [recentCompanies, setRecentCompanies] = useState([]);
  const [recentCompaniesLoading, setRecentCompaniesLoading] = useState(false);
  const [clientBots, setClientBots] = useState([]);
  const [clientBotsLoading, setClientBotsLoading] = useState(false);

  const isAdmin = ['admin', 'super_admin', 'internal_admin'].includes(user?.role);
  const isClient = ['client_admin', 'client_manager', 'client_viewer'].includes(user?.role);
  const isSupport = user?.role === 'support_agent';

  const navigate = useNavigate();

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchClients();
      fetchAvatars();
      fetchRecentCompanies();
    }
    if (isClient && user?.client_id) {
      fetchClientBots();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, searchTerm, isClient, user]);

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await api.get('/api/users', {
        params: { search: searchTerm }
      });
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      setClientsLoading(true);
      const response = await api.get('/api/clients');
      setClients(response.data.clients || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to fetch clients');
    } finally {
      setClientsLoading(false);
    }
  };

  const fetchAvatars = async () => {
    try {
      setAvatarsLoading(true);
      const response = await api.get('/api/avatars');
      setAvatars(response.data.avatars || []);
    } catch (error) {
      console.error('Error fetching avatars:', error);
      toast.error('Failed to fetch avatars');
    } finally {
      setAvatarsLoading(false);
    }
  };

  const fetchRecentCompanies = async () => {
    try {
      setRecentCompaniesLoading(true);
      const response = await api.get('/api/clients', {
        params: { limit: 5, page: 1, sort: '-created_at' }
      });
      const clients = response.data.clients || [];
      // Fetch all users to count agents per client
      const usersRes = await api.get('/api/users', { params: { limit: 1000 } });
      const users = usersRes.data.users || [];
      // Map clients with agent count
      const companiesWithAgents = clients.map(client => {
        const agentCount = users.filter(u => u.client_id === client._id).length;
        return { ...client, agentCount };
      });
      setRecentCompanies(companiesWithAgents);
    } catch (error) {
      setRecentCompanies([]);
    } finally {
      setRecentCompaniesLoading(false);
    }
  };

  const fetchClientBots = async () => {
    try {
      setClientBotsLoading(true);
      const response = await api.get(`/api/admin/bots/client/${user.client_id}`);
      setClientBots(response.data);
    } catch (error) {
      console.error('Error fetching client bots:', error);
      toast.error('Failed to fetch bots');
    } finally {
      setClientBotsLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!addUserForm.password || addUserForm.password.length < 6) {
      toast.error('Password is required and must be at least 6 characters.');
      return;
    }
    try {
      await api.post('/api/users', addUserForm);
      toast.success('User created successfully');
      setShowAddUserModal(false);
      setAddUserForm({
        firstName: '',
        lastName: '',
        email: '',
        role: 'client_admin',
        client_id: '',
        status: 'active',
        password: ''
      });
      fetchUsers();
      navigate('/admin/users');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create user');
    }
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/clients', addClientForm);
      toast.success('Client created successfully');
      setShowAddClientModal(false);
      setAddClientForm({
        name: '',
        industry: '',
        country: '',
        contact_email: '',
        app_sid: '',
        supports_text: false,
        supports_voice: false,
        status: 'active',
        notes: '',
        default_language: ''
      });
      fetchClients();
      navigate('/admin/clients');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create client');
    }
  };

  // Calculate active users (status === 'active')
  const activeUsers = users.filter(user => user.status === 'active').length;

  // Mock data for top 5 avatar categories (you can replace this with real API data)
  const topAvatarCategories = [
    { name: 'School', count: 15 },
    { name: 'Real Estate', count: 9 },
    { name: 'Hospitality', count: 8 },
    { name: 'Telecom', count: 7 },
    { name: 'E-Commerce', count: 7 }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-4 text-blue-600 text-lg">Loading...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-4 text-blue-600 text-lg">Loading user...</span>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
          <Typography variant="h3" className="mb-2">
            Welcome back, {user?.firstName || user?.name || 'User'}!
          </Typography>
          <Typography variant="lead" className="opacity-90">
            Here's what's happening with your account today.
          </Typography>
        </div>

        {/* Admin Dashboard Cards */}
        {isAdmin && (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Clients */}
              <Card className="bg-white shadow-lg">
                <CardBody className="text-center p-6">
                  <div className="mx-auto mb-4 rounded-full bg-blue-100 p-3 w-fit text-blue-500">
                    <span className="text-2xl">🏢</span>
                  </div>
                  <Typography variant="h5" color="blue-gray" className="mb-2 font-semibold">
                    Total Clients
                  </Typography>
                  <Typography variant="h4" className="text-blue-600 font-bold mb-4">
                    {clientsLoading ? '...' : clients.length}
                  </Typography>
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => navigate('/admin/clients')}
                  >
                    View All
                  </Button>
                </CardBody>
              </Card>

              {/* Active Users */}
              <Card className="bg-white shadow-lg">
                <CardBody className="text-center p-6">
                  <div className="mx-auto mb-4 rounded-full bg-green-100 p-3 w-fit text-green-500">
                    <span className="text-2xl">👥</span>
                  </div>
                  <Typography variant="h5" color="blue-gray" className="mb-2 font-semibold">
                    Active Users
                  </Typography>
                  <Typography variant="h4" className="text-green-600 font-bold mb-4">
                    {usersLoading ? '...' : activeUsers}
                  </Typography>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => navigate('/admin/users')}
                  >
                    View All
                  </Button>
                </CardBody>
              </Card>

              {/* Total Avatars */}
              <Card className="bg-white shadow-lg">
                <CardBody className="text-center p-6">
                  <div className="mx-auto mb-4 rounded-full bg-purple-100 p-3 w-fit text-purple-500">
                    <span className="text-2xl">👤</span>
                  </div>
                  <Typography variant="h5" color="blue-gray" className="mb-2 font-semibold">
                    Total Avatars
                  </Typography>
                  <Typography variant="h4" className="text-purple-600 font-bold mb-4">
                    {avatarsLoading ? '...' : avatars.length}
                  </Typography>
                  <Button
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={() => navigate('/admin/avatars')}
                  >
                    View All
                  </Button>
                </CardBody>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-white shadow-lg">
                <CardBody className="text-center p-6">
                  <div className="mx-auto mb-4 rounded-full bg-gray-100 p-3 w-fit text-gray-500">
                    <span className="text-2xl">➕</span>
                  </div>
                  <Typography variant="h5" color="blue-gray" className="mb-2 font-semibold">
                    Quick Actions
                  </Typography>
                  <div className="space-y-3">
                    <Button
                      size="sm"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => setShowAddUserModal(true)}
                    >
                      + Add User
                    </Button>
                    <Button
                      size="sm"
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => setShowAddClientModal(true)}
                    >
                      + Add Client
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Top Avatar Categories */}
            <Card className="bg-white shadow-lg">
              <CardHeader color="white" className="relative h-16 flex items-center px-4">
                <span className="text-xl">📊</span>
                <Typography variant="h6" color="black" className="ml-2">Top 5 Avatar Categories</Typography>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  {topAvatarCategories.map((category, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-orange-500">#{index + 1}</span>
                        <Typography variant="h6" color="blue-gray" className="font-medium">
                          {category.name}
                        </Typography>
                      </div>
                      <Badge color="orange" className="text-sm">
                        {category.count} avatars
                      </Badge>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <Button
                    size="sm"
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                    onClick={() => navigate('/admin/avatars')}
                  >
                    View All
                  </Button>
                </div>
              </CardBody>
            </Card>

            {/* Usage Chart */}
            <Card className="bg-white shadow-lg">
              <CardBody>
                <div className="flex items-center justify-between mb-4">
                  <Typography variant="h5" color="blue-gray" className="font-semibold">
                    Usage Details (Minutes/Text)
                  </Typography>
                  <div className="flex gap-2">
                    {['7', '30'].map((range) => (
                      <button
                        key={range}
                        className={`px-4 py-1 rounded-lg text-sm font-semibold border transition-colors ${
                          usageRange === range
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50'
                        }`}
                        onClick={() => setUsageRange(range)}
                      >
                        Last {range} Days
                      </button>
                    ))}
                  </div>
                </div>
                <Line
                  data={{
                    labels: usageData[usageRange].labels,
                    datasets: [
                      {
                        label: 'Minutes',
                        data: usageData[usageRange].minutes,
                        borderColor: '#2563eb',
                        backgroundColor: 'rgba(37,99,235,0.1)',
                        tension: 0.4,
                        fill: true,
                      },
                      {
                        label: 'Text',
                        data: usageData[usageRange].text,
                        borderColor: '#f59e42',
                        backgroundColor: 'rgba(245,158,66,0.1)',
                        tension: 0.4,
                        fill: true,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: { legend: { position: 'top' }, title: { display: false } },
                    scales: { y: { beginAtZero: true } },
                  }}
                  height={300}
                />
              </CardBody>
            </Card>

            {/* Recently Active Companies */}
            <Card className="bg-white shadow-lg mt-6">
              <CardHeader color="blue" className="relative h-16 flex items-center px-4">
                <Typography variant="h6" color="white">Recently Active Companies</Typography>
              </CardHeader>
              <CardBody>
                {recentCompaniesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-4 text-blue-600 text-lg">Loading...</span>
                  </div>
                ) : recentCompanies.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">No recent activity found.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border p-3 text-left font-semibold">Company Name</th>
                          <th className="border p-3 text-left font-semibold">Country</th>
                          <th className="border p-3 text-left font-semibold"># Agents</th>
                          <th className="border p-3 text-left font-semibold">Text</th>
                          <th className="border p-3 text-left font-semibold">Voice</th>
                          <th className="border p-3 text-left font-semibold">Last Session Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentCompanies.map((c, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="border p-3 font-medium text-gray-900">{c.name}</td>
                            <td className="border p-3 text-gray-700">{c.country}</td>
                            <td className="border p-3 text-gray-700">{c.agentCount}</td>
                            <td className="border p-3 text-gray-700">N/A</td>
                            <td className="border p-3 text-gray-700">N/A</td>
                            <td className="border p-3 text-gray-700">
                              {c.created_at ? new Date(c.created_at).toLocaleString() : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardBody>
            </Card>
          </>
        )}

        {/* Client Dashboard */}
        {isClient && (
          <Card>
            <CardHeader color="blue" className="relative h-16 flex items-center px-4">
              <Typography variant="h6" color="white">Client Dashboard</Typography>
            </CardHeader>
            <CardBody>
              <Typography>Welcome to your client dashboard. (Add client-specific stats and features here.)</Typography>
            </CardBody>
          </Card>
        )}

        {/* Support Agent Dashboard */}
        {isSupport && (
          <Card>
            <CardHeader color="green" className="relative h-16 flex items-center px-4">
              <Typography variant="h6" color="white">Support Agent Dashboard</Typography>
            </CardHeader>
            <CardBody>
              <Typography>Welcome to your support dashboard. (Add support-specific tools here.)</Typography>
            </CardBody>
          </Card>
        )}

        {/* Fallback Role Message */}
        {!isAdmin && !isClient && !isSupport && (
          <Card>
            <CardBody>
              <Typography>You are logged in as: {user?.role || 'Unknown'}</Typography>
            </CardBody>
          </Card>
        )}

        {/* Add User Modal */}
        {showAddUserModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Create New User</h2>
              <form onSubmit={handleAddUser}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    value={addUserForm.firstName}
                    onChange={e => setAddUserForm({ ...addUserForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    value={addUserForm.lastName}
                    onChange={e => setAddUserForm({ ...addUserForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={addUserForm.email}
                    onChange={e => setAddUserForm({ ...addUserForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select
                    value={addUserForm.role}
                    onChange={e => setAddUserForm({ ...addUserForm, role: e.target.value })}
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
                    value={addUserForm.client_id}
                    onChange={e => setAddUserForm({ ...addUserForm, client_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Client</option>
                    {clients.map(client => (
                      <option key={client._id} value={client._id}>{client.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password <span className="text-red-500">*</span></label>
                  <input
                    type="password"
                    value={addUserForm.password}
                    onChange={e => setAddUserForm({ ...addUserForm, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Set a password (min 6 chars)"
                    required
                    minLength={6}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                    onClick={() => setShowAddUserModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Add User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Client Modal */}
        {showAddClientModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md overflow-y-auto max-h-[80vh]">
              <h2 className="text-xl font-bold mb-4">Create New Client</h2>
              <form onSubmit={handleAddClient}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                  <input
                    type="text"
                    value={addClientForm.name}
                    onChange={e => setAddClientForm({ ...addClientForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                  <input
                    type="text"
                    value={addClientForm.industry}
                    onChange={e => setAddClientForm({ ...addClientForm, industry: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                  <input
                    type="text"
                    value={addClientForm.country}
                    onChange={e => setAddClientForm({ ...addClientForm, country: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                  <input
                    type="email"
                    value={addClientForm.contact_email}
                    onChange={e => setAddClientForm({ ...addClientForm, contact_email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">App SID</label>
                  <input
                    type="text"
                    value={addClientForm.app_sid}
                    onChange={e => setAddClientForm({ ...addClientForm, app_sid: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="mb-4 flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={addClientForm.supports_text}
                      onChange={e => setAddClientForm({ ...addClientForm, supports_text: e.target.checked })}
                      className="mr-2"
                    />
                    Supports Text
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={addClientForm.supports_voice}
                      onChange={e => setAddClientForm({ ...addClientForm, supports_voice: e.target.checked })}
                      className="mr-2"
                    />
                    Supports Voice
                  </label>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Default Language (TTS/SSML)</label>
                  <select
                    value={addClientForm.default_language}
                    onChange={e => setAddClientForm({ ...addClientForm, default_language: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Language</option>
                    <option value="en-US">English (US)</option>
                    <option value="hi-IN">Hindi (IN)</option>
                    <option value="en-IN">English (IN)</option>
                    <option value="ta-IN">Tamil (IN)</option>
                    <option value="mr-IN">Marathi (IN)</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={addClientForm.notes}
                    onChange={e => setAddClientForm({ ...addClientForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                    onClick={() => setShowAddClientModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Add Client
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Dashboard;

function getBotTypeIcon(type) {
  const icons = {
    voice: '📞',
    chat: '💬',
    whatsapp: '📱',
    sms: '📨'
  };
  return icons[type] || '🤖';
}
function getStatusBadge(active) {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
      active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    }`}>
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}
function getProviderName(provider) {
  const names = {
    google: 'Google',
    aws: 'AWS',
    azure: 'Azure'
  };
  return names[provider] || provider;
}
