import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import AdminLayout from './AdminLayout';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Bots = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bots, setBots] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBot, setSelectedBot] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    total: 1,
    totalDocs: 0
  });

  const [formData, setFormData] = useState({
    name: '',
    dnis: '', // as comma-separated string for input
    type: 'voice',
    webhook_url: '',
    asr_provider: {
      name: 'google',
      config: {
        apiKey: '',
        language: 'en-US',
        model: 'latest_long'
      }
    },
    tts_provider: {
      name: 'google',
      config: {
        apiKey: '',
        voice: 'en-US-Wavenet-D',
        speakingRate: 1.0
      }
    },
    channels: '', // as comma-separated string for input
    clientId: '',
    description: '',
    active: true,
    settings: {
      maxConversationLength: 300,
      enableRecording: true,
      enableTranscription: true
    },
    // Chat-specific fields
    welcome_message: 'Welcome! How can I help you today?',
    user_prompt_fields: [
      { name: 'name', label: 'Your Name', required: true, type: 'text' },
      { name: 'email', label: 'Email Address', required: true, type: 'email' },
      { name: 'phone', label: 'Phone Number', required: false, type: 'phone' }
    ],
    chat_settings: {
      require_user_details: true,
      auto_save_conversations: true
    }
  });

  const [filters, setFilters] = useState({
    clientId: '',
    type: '',
    active: ''
  });

  // Add a separate loading state for create/update actions
  const [actionLoading, setActionLoading] = useState(false);

  // Webhook URL validation state
  const [webhookValid, setWebhookValid] = useState(true);
  const [webhookValidating, setWebhookValidating] = useState(false);

  useEffect(() => {
    fetchBots();
    fetchClients();
  }, [filters, pagination.current]);

  const fetchBots = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination?.current || 1,
        limit: 6,
        ...filters
      });
      const response = await api.get(`/api/admin/bots?${params}`);
      let botsList = [];
      if (Array.isArray(response.data.bots)) {
        botsList = response.data.bots;
      } else if (Array.isArray(response.data)) {
        botsList = response.data;
      }
      setBots(botsList);
      setPagination(response.data.pagination || {
        current: 1,
        total: 1,
        totalDocs: botsList.length
      });
    } catch (error) {
      setBots([]);
      toast.error('Failed to fetch bots');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/clients');
      // Handle the correct response format from backend
      if (response.data && response.data.clients) {
        setClients(response.data.clients);
        console.log('Clients set successfully:', response.data.clients.length);
        console.log('First client data structure:', response.data.clients[0]);
      } else {
        console.error('Unexpected response format:', response.data);
        setClients([]);
        toast.error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      toast.error('Failed to fetch clients');
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  // Debug: visualize clients
  useEffect(() => {
    console.log('Clients:', clients);
  }, [clients]);

  // Webhook URL validation function
  const validateWebhookUrl = async (url) => {
    if (!url) {
      setWebhookValid(false);
      return false;
    }

    // Basic URL format validation
    try {
      const urlObj = new URL(url);
      if (!urlObj.protocol.startsWith('http')) {
        setWebhookValid(false);
        return false;
      }
    } catch (error) {
      setWebhookValid(false);
      return false;
    }

    try {
      setWebhookValidating(true);
      
      // Test with actual n8n webhook format
      const testPayload = {
        message: 'test message for webhook validation',
        sessionId: 'test-session-' + Date.now(),
        userId: 'test-user',
        timestamp: new Date().toISOString(),
        // Add common n8n webhook fields
        type: 'message',
        channel: 'web',
        metadata: {
          source: 'webhook-validation'
        }
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        // For webhook validation, just check if the endpoint responds successfully
        // Don't require specific response format as n8n webhooks can have various formats
        setWebhookValid(true);
        return true;
      } else {
        setWebhookValid(false);
        return false;
      }
    } catch (error) {
      console.error('Webhook validation error:', error);
      setWebhookValid(false);
      return false;
    } finally {
      setWebhookValidating(false);
    }
  };

  // Validate webhook when URL changes
  useEffect(() => {
    if (formData.webhook_url) {
      const timeoutId = setTimeout(() => {
        validateWebhookUrl(formData.webhook_url);
      }, 1000); // Debounce for 1 second

      return () => clearTimeout(timeoutId);
    } else {
      setWebhookValid(false);
    }
  }, [formData.webhook_url]);

  // Auto-switch to voice type if chat is selected but webhook is invalid
  useEffect(() => {
    if (formData.type === 'chat' && !webhookValid && formData.webhook_url) {
      setFormData(prev => ({ ...prev, type: 'voice' }));
      toast.error('Switched to Voice Bot - Invalid webhook URL for Chat Bot');
    }
  }, [formData.type, webhookValid, formData.webhook_url]);

  const handleCreateBot = async () => {
    setActionLoading(true);
    // Frontend validation for required fields
    if (!formData.webhook_url) {
      toast.error('Webhook URL is required');
      setActionLoading(false);
      return;
    }

    // Check webhook validation for chat bots
    if (formData.type === 'chat') {
      if (!webhookValid) {
        toast.error('Please provide a valid webhook URL to create a chat bot');
        setActionLoading(false);
        return;
      }
      
      // Double-check webhook validation before creating
      const isValid = await validateWebhookUrl(formData.webhook_url);
      if (!isValid) {
        toast.error('Webhook URL validation failed. Please check the URL and try again.');
        setActionLoading(false);
        return;
      }
    }
    // Only validate these fields for voice bots
    if (formData.type === 'voice') {
      if (!formData.asr_provider.name) {
        toast.error('ASR Provider is required');
        setActionLoading(false);
        return;
      }
      if (!formData.tts_provider.name) {
        toast.error('TTS Provider is required');
        setActionLoading(false);
        return;
      }
      if (!formData.asr_provider.config.apiKey) {
        toast.error('ASR API Key is required');
        setActionLoading(false);
        return;
      }
      if (!formData.tts_provider.config.apiKey) {
        toast.error('TTS API Key is required');
        setActionLoading(false);
        return;
      }
    }
    try {
      // Transform formData to match backend schema
      const payload = {
        ...formData,
        tts_provider: formData.tts_provider,
        asr_provider: formData.asr_provider,
        webhook_url: formData.webhook_url,
      };
      // Remove empty clientId
      if (!payload.clientId) {
        delete payload.clientId;
      }
      // For non-voice bots, remove these fields from payload
      if (formData.type !== 'voice') {
        delete payload.asr_provider;
        delete payload.tts_provider;
        delete payload.settings;
        delete payload.channels;
      }

      // DNIS required only for voice and sms bots
      if (formData.type === 'voice' || formData.type === 'sms') {
        payload.dnis = Array.isArray(formData.dnis)
          ? formData.dnis
          : formData.dnis
            ? formData.dnis.split(',').map(s => s.trim()).filter(Boolean)
            : [];
        if (!payload.dnis || !payload.dnis.length) {
          toast.error('DNIS is required for Voice/SMS bots');
          setActionLoading(false);
          return;
        }
      } else {
        // For chat/whatsapp, strictly remove dnis from payload
        if ('dnis' in payload) delete payload.dnis;
      }
      // Extra safety: always remove dnis if not voice/sms
      if (formData.type !== 'voice' && formData.type !== 'sms') {
        delete payload.dnis;
      }

      const response = await api.post('/api/admin/bots', payload);
      setBots([response.data, ...bots]);
      setShowCreateModal(false);
      resetForm();
      toast.success('Bot created successfully');
    } catch (error) {
      console.error('Error creating bot:', error);
      toast.error(error.response?.data?.message || 'Failed to create bot');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateBot = async () => {
    setActionLoading(true);
    
    // Check webhook validation for chat bots
    if (formData.type === 'chat') {
      if (!webhookValid) {
        toast.error('Please provide a valid webhook URL to update this chat bot');
        setActionLoading(false);
        return;
      }
      
      // Double-check webhook validation before updating
      const isValid = await validateWebhookUrl(formData.webhook_url);
      if (!isValid) {
        toast.error('Webhook URL validation failed. Please check the URL and try again.');
        setActionLoading(false);
        return;
      }
    }
    
    try {
      // Transform formData to match backend schema
      const payload = {
        ...formData,
        tts_provider: formData.tts_provider,
        asr_provider: formData.asr_provider,
        webhook_url: formData.webhook_url,
      };
      // Remove empty clientId
      if (!payload.clientId) {
        delete payload.clientId;
      }
      
      // Only delete providers if not voice type
      if (formData.type !== 'voice') {
        delete payload.tts_provider;
        delete payload.asr_provider;
      }
      
      // Don't delete webhook_url - it should be updated

      // DNIS required only for voice and sms bots
      if (formData.type === 'voice' || formData.type === 'sms') {
        payload.dnis = Array.isArray(formData.dnis)
          ? formData.dnis
          : formData.dnis
            ? formData.dnis.split(',').map(s => s.trim()).filter(Boolean)
            : [];
        if (!payload.dnis || !payload.dnis.length) {
          toast.error('DNIS is required for Voice/SMS bots');
          setActionLoading(false);
          return;
        }
      } else {
        // For chat/whatsapp, do not send dnis
        delete payload.dnis;
      }
      // Extra safety: always remove dnis if not voice/sms
      if (formData.type !== 'voice' && formData.type !== 'sms') {
        delete payload.dnis;
      }

      console.log('Update payload:', payload);
      const response = await api.put(`/api/admin/bots/${selectedBot._id}`, payload);
      setBots(bots.map(bot => bot._id === selectedBot._id ? response.data : bot));
      setShowEditModal(false);
      setSelectedBot(null);
      resetForm();
      toast.success('Bot updated successfully');
    } catch (error) {
      console.error('Error updating bot:', error);
      toast.error(error.response?.data?.message || 'Failed to update bot');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBot = async (botId) => {
    if (!window.confirm('Are you sure you want to delete this bot?')) return;
    
    try {
      await api.delete(`/api/admin/bots/${botId}`);
      setBots(bots.filter(bot => bot._id !== botId));
      toast.success('Bot deleted successfully');
    } catch (error) {
      console.error('Error deleting bot:', error);
      toast.error('Failed to delete bot');
    }
  };

  const handleToggleStatus = async (botId) => {
    try {
      const response = await api.patch(`/api/admin/bots/${botId}/toggle`);
      setBots(bots.map(bot => bot._id === botId ? response.data : bot));
      toast.success('Bot status updated');
    } catch (error) {
      console.error('Error toggling bot status:', error);
      toast.error('Failed to update bot status');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      dnis: '', // as comma-separated string for input
      type: 'voice',
      webhook_url: '',
      asr_provider: {
        name: 'google',
        config: {
          apiKey: '',
          language: 'en-US',
          model: 'latest_long'
        }
      },
      tts_provider: {
        name: 'google',
        config: {
          apiKey: '',
          voice: 'en-US-Wavenet-D',
          speakingRate: 1.0
        }
      },
      channels: '', // as comma-separated string for input
      clientId: '',
      description: '',
      active: true,
      settings: {
        maxConversationLength: 300,
        enableRecording: true,
        enableTranscription: true
      },
      // Chat-specific fields
      welcome_message: 'Welcome! How can I help you today?',
      user_prompt_fields: [
        { name: 'name', label: 'Your Name', required: true, type: 'text' },
        { name: 'email', label: 'Email Address', required: true, type: 'email' },
        { name: 'phone', label: 'Phone Number', required: false, type: 'phone' }
      ],
      chat_settings: {
        require_user_details: true,
        auto_save_conversations: true
      }
    });
    
    // Reset webhook validation state
    setWebhookValid(true);
    setWebhookValidating(false);
  };

  const openEditModal = (bot) => {
    setSelectedBot(bot);
    setFormData({
      name: bot.name || '',
      dnis: Array.isArray(bot.dnis) ? bot.dnis.join(',') : bot.dnis || '',
      type: bot.type || 'voice',
      webhook_url: bot.webhook_url || '',
      asr_provider: bot.asr_provider || { name: '', config: {} },
      tts_provider: bot.tts_provider || { name: '', config: {} },
      channels: Array.isArray(bot.channels) ? bot.channels.join(',') : bot.channels || '',
      clientId: typeof bot.clientId === 'object' ? bot.clientId?._id : bot.clientId || '',
      description: bot.description || '',
      active: typeof bot.active === 'boolean' ? bot.active : true,
      settings: bot.settings || { maxConversationLength: 300, enableRecording: true, enableTranscription: true },
      // Chat-specific fields
      welcome_message: bot.welcome_message || 'Welcome! How can I help you today?',
      user_prompt_fields: bot.user_prompt_fields || [
        { name: 'name', label: 'Your Name', required: true, type: 'text' },
        { name: 'email', label: 'Email Address', required: true, type: 'email' },
        { name: 'phone', label: 'Phone Number', required: false, type: 'phone' }
      ],
      chat_settings: bot.chat_settings || {
        require_user_details: true,
        auto_save_conversations: true
      }
    });
    setShowEditModal(true);
  };

  const getBotTypeIcon = (type) => {
    const icons = {
      voice: '📞',
      chat: '💬',
      whatsapp: '📱',
      sms: '📨'
    };
    return icons[type] || '🤖';
  };

  const getStatusBadge = (active) => {
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {active ? 'Active' : 'Inactive'}
      </span>
    );
  };

  // Chat-specific functions
  const updateUserPromptField = (index, field, value) => {
    const updatedFields = [...formData.user_prompt_fields];
    updatedFields[index] = { ...updatedFields[index], [field]: value };
    setFormData({ ...formData, user_prompt_fields: updatedFields });
  };

  const addUserPromptField = () => {
    setFormData({
      ...formData,
      user_prompt_fields: [
        ...formData.user_prompt_fields,
        { name: '', label: '', required: false, type: 'text' }
      ]
    });
  };

  const removeUserPromptField = (index) => {
    const updatedFields = formData.user_prompt_fields.filter((_, i) => i !== index);
    setFormData({ ...formData, user_prompt_fields: updatedFields });
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="mr-3 text-blue-500 hover:text-blue-700 focus:outline-none"
              title="Go Back"
              style={{ fontSize: '1.5rem', lineHeight: 1 }}
            >
              ←
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Bot Management</h1>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Create New Bot
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
              <select
                value={filters.clientId}
                onChange={(e) => setFilters({...filters, clientId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Clients</option>
                {clients.map(client => (
                  <option key={client._id} value={client._id}>
                    {client.name || 'No Name'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({...filters, type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="voice">Voice</option>
                <option value="chat">Chat</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="sms">SMS</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.active}
                onChange={(e) => setFilters({...filters, active: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({clientId: '', type: '', active: ''})}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Bots Table */}
        <div className="bg-white rounded-lg shadow w-full overflow-x-hidden">
          <table className="w-full table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bot</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DNIS</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center">Loading...</td>
                  </tr>
                ) : bots && Array.isArray(bots) && bots.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">No bots found</td>
                  </tr>
                ) : (
                  Array.isArray(bots) && bots.map((bot) => (
                    <tr key={bot._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">{getBotTypeIcon(bot.type)}</span>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{bot.name}</div>
                            {bot.description && (
                              <div className="text-sm text-gray-500">{bot.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full capitalize">
                          {bot.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(() => {
                          try {
                            if (bot && bot.clientId && typeof bot.clientId === 'object' && bot.clientId.name) {
                              return bot.clientId.name;
                            } else if (typeof bot?.clientId === 'string') {
                              // Try to find the client name from the clients array
                              const found = clients.find(c => c._id === bot.clientId);
                              return found ? found.name : '—';
                            } else {
                              return '—';
                            }
                          } catch (e) {
                            return '—';
                          }
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {bot.dnis || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(bot.active)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(bot.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {bot.type === 'chat' && (
                            <a
                              href={`/chat/${bot._id}`}
                              target="_blank"
                              className="text-green-600 hover:text-green-900"
                            >
                              Test Chat
                            </a>
                          )}
                          <button
                            onClick={() => openEditModal(bot)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleStatus(bot._id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            {bot.active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteBot(bot._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {pagination && pagination.total > 1 && pagination.current && pagination.totalDocs !== undefined && (
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

        {/* Create/Edit Modal */}
        {(showCreateModal || showEditModal) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">
                {showCreateModal ? 'Create New Bot' : 'Edit Bot'}
              </h2>
              {/* Wrap modal content in a form to prevent default submit */}
              <form
                onSubmit={e => {
                  e.preventDefault();
                  if (actionLoading) return;
                  showCreateModal ? handleCreateBot() : handleUpdateBot();
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Basic Information</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bot Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter bot name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bot Type</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({...formData, type: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="voice">Voice Bot</option>
                        <option value="chat">Chat Bot</option>
                        <option value="whatsapp">WhatsApp Bot</option>
                        <option value="sms">SMS Bot</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                      <select
                        value={formData.clientId}
                        onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Client</option>
                        {clients.map(client => (
                          <option key={client._id} value={client._id}>
                            {client.name || 'No Name'}
                          </option>
                        ))}
                      </select>
                    </div>

                    {(formData.type === 'voice' || formData.type === 'sms') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">DNIS (Phone Number)</label>
                        <input
                          type="text"
                          value={formData.dnis}
                          onChange={(e) => setFormData({...formData, dnis: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="+1234567890"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        n8n Webhook URL <span className="text-red-500">*</span>
                        {webhookValidating && <span className="text-blue-500 ml-2">Validating...</span>}
                        {!webhookValidating && formData.webhook_url && (
                          <span className={`ml-2 ${webhookValid ? 'text-green-500' : 'text-red-500'}`}>
                            {webhookValid ? '✓ Valid' : '✗ Invalid'}
                          </span>
                        )}
                      </label>
                      <input
                        type="url"
                        value={formData.webhook_url}
                        onChange={(e) => setFormData({...formData, webhook_url: e.target.value})}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                          formData.webhook_url 
                            ? webhookValid 
                              ? 'border-green-300 focus:ring-green-500' 
                              : 'border-red-300 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        placeholder="https://bots.torisedigital.com/webhook/your-bot-id"
                        required
                      />
                      {formData.webhook_url && !webhookValid && (
                        <p className="text-red-500 text-sm mt-1">
                          Invalid webhook URL. Please check the URL and try again.
                        </p>
                      )}
                      {formData.webhook_url && webhookValid && (
                        <p className="text-green-600 text-sm mt-1">
                          ✓ Webhook URL is valid and responding correctly
                        </p>
                      )}
                      {!formData.webhook_url && (
                        <p className="text-gray-500 text-sm mt-1">
                          Enter your n8n webhook URL (e.g., https://bots.torisedigital.com/webhook/your-bot-id)
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="3"
                        placeholder="Optional description"
                      />
                    </div>

                    {/* Chat-specific fields */}
                    {formData.type === 'chat' && !webhookValid && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">
                              Chat configuration disabled
                            </h3>
                            <div className="mt-2 text-sm text-yellow-700">
                              <p>
                                Please provide a valid n8n webhook URL to enable chat configuration options.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {formData.type === 'chat' && webhookValid && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Welcome Message</label>
                          <input
                            type="text"
                            value={formData.welcome_message}
                            onChange={(e) => setFormData({...formData, welcome_message: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Welcome message for users"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">User Prompt Fields</label>
                          <div className="space-y-2 border border-gray-300 rounded-lg p-3 bg-gray-50">
                            {formData.user_prompt_fields.map((field, index) => (
                              <div key={index} className="grid grid-cols-4 gap-2">
                                <input
                                  type="text"
                                  value={field.name}
                                  onChange={(e) => updateUserPromptField(index, 'name', e.target.value)}
                                  placeholder="Field name"
                                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                                <input
                                  type="text"
                                  value={field.label}
                                  onChange={(e) => updateUserPromptField(index, 'label', e.target.value)}
                                  placeholder="Field label"
                                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                                <select
                                  value={field.type}
                                  onChange={(e) => updateUserPromptField(index, 'type', e.target.value)}
                                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                                >
                                  <option value="text">Text</option>
                                  <option value="email">Email</option>
                                  <option value="phone">Phone</option>
                                </select>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={field.required}
                                    onChange={(e) => updateUserPromptField(index, 'required', e.target.checked)}
                                    className="w-4 h-4"
                                  />
                                  <span className="text-xs">Required</span>
                                  <button
                                    type="button"
                                    onClick={() => removeUserPromptField(index)}
                                    className="text-red-500 text-xs"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={addUserPromptField}
                              className="text-blue-600 text-sm hover:text-blue-800"
                            >
                              + Add Field
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={formData.chat_settings.require_user_details}
                              onChange={(e) => setFormData({
                                ...formData,
                                chat_settings: {
                                  ...formData.chat_settings,
                                  require_user_details: e.target.checked
                                }
                              })}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">Require user details before chat</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={formData.chat_settings.auto_save_conversations}
                              onChange={(e) => setFormData({
                                ...formData,
                                chat_settings: {
                                  ...formData.chat_settings,
                                  auto_save_conversations: e.target.checked
                                }
                              })}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">Auto-save conversations</span>
                          </label>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Provider Configuration - Only for Voice bots */}
                  {formData.type === 'voice' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Provider Configuration</h3>
                      {/* ASR Provider */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ASR Provider <span className="text-red-500">*</span></label>
                        <select
                          value={formData.asr_provider.name}
                          onChange={(e) => setFormData({
                            ...formData,
                            asr_provider: {
                              ...formData.asr_provider,
                              name: e.target.value
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="">Select ASR Provider</option>
                          <option value="google">Google Speech-to-Text</option>
                          <option value="aws">AWS Transcribe</option>
                          <option value="azure">Azure Speech Services</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ASR API Key</label>
                        <input
                          type="password"
                          value={formData.asr_provider.config.apiKey}
                          onChange={(e) => setFormData({
                            ...formData,
                            asr_provider: {
                              ...formData.asr_provider,
                              config: {
                                ...formData.asr_provider.config,
                                apiKey: e.target.value
                              }
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter API key"
                        />
                      </div>

                      {/* TTS Provider */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">TTS Provider <span className="text-red-500">*</span></label>
                        <select
                          value={formData.tts_provider.name}
                          onChange={(e) => setFormData({
                            ...formData,
                            tts_provider: {
                              ...formData.tts_provider,
                              name: e.target.value
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="">Select TTS Provider</option>
                          <option value="google">Google Text-to-Speech</option>
                          <option value="aws">AWS Polly</option>
                          <option value="azure">Azure Speech Services</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">TTS API Key</label>
                        <input
                          type="password"
                          value={formData.tts_provider.config.apiKey}
                          onChange={(e) => setFormData({
                            ...formData,
                            tts_provider: {
                              ...formData.tts_provider,
                              config: {
                                ...formData.tts_provider.config,
                                apiKey: e.target.value
                              }
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter API key"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">TTS Voice</label>
                        <input
                          type="text"
                          value={formData.tts_provider.config.voice}
                          onChange={(e) => setFormData({
                            ...formData,
                            tts_provider: {
                              ...formData.tts_provider,
                              config: {
                                ...formData.tts_provider.config,
                                voice: e.target.value
                              }
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter TTS voice name"
                        />
                      </div>

                      {/* Settings */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Settings</label>
                        <input
                          type="number"
                          value={formData.settings.maxConversationLength}
                          onChange={(e) => setFormData({
                            ...formData,
                            settings: {
                              ...formData.settings,
                              maxConversationLength: Number(e.target.value)
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Max Conversation Length"
                        />
                      </div>

                      {/* Channels */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Channels</label>
                        <input
                          type="text"
                          value={formData.channels}
                          onChange={(e) => setFormData({ ...formData, channels: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Comma separated channels (e.g. voice,text)"
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    disabled={actionLoading}
                  >
                    {actionLoading ? (showCreateModal ? 'Creating...' : 'Updating...') : (showCreateModal ? 'Create Bot' : 'Update Bot')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AdminLayout>
  );
};

export default Bots; 