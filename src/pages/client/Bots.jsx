import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ClientBots = () => {
  const { user } = useAuth();
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.client_id) {
      fetchClientBots();
    }
  }, [user]);

  const fetchClientBots = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/admin/bots/client/${user.client_id}`);
      setBots(response.data);
    } catch (error) {
      console.error('Error fetching client bots:', error);
      toast.error('Failed to fetch bots');
    } finally {
      setLoading(false);
    }
  };

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

  if (!user?.client_id) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">
          No client access available
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Bots</h1>
        <p className="text-gray-600 mt-2">View and monitor your bot configurations</p>
      </div>
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : bots.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">No bots configured yet</div>
          <p className="text-sm text-gray-400">Contact your administrator to set up bots for your account</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bots.map((bot) => (
            <div key={bot._id} className="bg-gray-50 rounded-lg shadow p-6 border border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <span className="text-3xl mr-3">{getBotTypeIcon(bot.type)}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{bot.name}</h3>
                    <span className="text-sm text-gray-500 capitalize">{bot.type} Bot</span>
                  </div>
                </div>
                {getStatusBadge(bot.active)}
              </div>
              {bot.description && (
                <div className="mb-2 text-gray-700 text-sm">{bot.description}</div>
              )}
              <div className="text-xs text-gray-500 mb-2">Provider: {getProviderName(bot.tts_provider?.name)}</div>
              <div className="flex gap-2 text-xs">
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">{bot.channels?.length ? bot.channels.join(', ') : 'No Channels'}</span>
                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">{bot.active ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientBots; 