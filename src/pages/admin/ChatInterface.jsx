import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import AdminLayout from './AdminLayout';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const ChatInterface = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBot, setSelectedBot] = useState(null);
  const [showChatWindow, setShowChatWindow] = useState(false);

  useEffect(() => {
    fetchChatBots();
  }, []);

  const fetchChatBots = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/bots?type=chat');
      // Filter bots that have valid webhook URLs
      const validBots = (response.data.bots || []).filter(bot => 
        bot.webhook_url && bot.webhook_url.trim() !== ''
      );
      setBots(validBots);
    } catch (error) {
      console.error('Error fetching chat bots:', error);
      toast.error('Failed to fetch chat bots');
      setBots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTestChat = (bot) => {
    setSelectedBot(bot);
    setShowChatWindow(true);
  };

  const handleCloseChat = () => {
    setShowChatWindow(false);
    setSelectedBot(null);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading chat bots...</div>
        </div>
      </AdminLayout>
    );
  }

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
            <h1 className="text-2xl font-bold text-gray-900">Chat Interface</h1>
          </div>
        </div>

        {bots.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Chat Bots Found</h3>
            <p className="text-gray-500 mb-6">Create a chat bot first to test the chat interface.</p>
            <button
              onClick={() => navigate('/admin/bots')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Go to Bot Management
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bots.map((bot) => (
              <div key={bot._id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <div className="flex items-center mb-4">
                  <span className="text-3xl mr-3">💬</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{bot.name}</h3>
                    <p className="text-sm text-gray-500">{bot.description || 'No description'}</p>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      bot.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {bot.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Welcome Message:</span>
                    <span className="text-sm text-gray-900 truncate max-w-32">
                      {bot.welcome_message || 'Default'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">User Fields:</span>
                    <span className="text-sm text-gray-900">
                      {bot.user_prompt_fields?.length || 0} fields
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Webhook URL:</span>
                    <span className={`text-sm font-medium ${
                      bot.webhook_url ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {bot.webhook_url ? '✓ Configured' : '✗ Missing'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleTestChat(bot)}
                    disabled={!bot.active || !bot.webhook_url}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition ${
                      bot.active && bot.webhook_url
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    title={!bot.webhook_url ? 'No webhook URL configured' : 'Test Chat'}
                  >
                    Test Chat
                  </button>
                  
                  <button
                    onClick={() => navigate(`/admin/bots`)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                  >
                    Manage
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Chat Window Modal */}
        {showChatWindow && selectedBot && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💬</span>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedBot.name}</h3>
                    <p className="text-sm text-gray-500">Chat Interface</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseChat}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ✕
                </button>
              </div>
              
              <div className="flex-1 p-4">
                <iframe
                  src={`/chat/${selectedBot._id}`}
                  className="w-full h-full border-0 rounded-lg"
                  title="Chat Interface"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ChatInterface; 