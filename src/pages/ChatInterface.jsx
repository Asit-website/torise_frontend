import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './ChatInterface.css';

const ChatInterface = () => {
  const { botId } = useParams();
  const [messages, setMessages] = useState([]);
  const [userDetails, setUserDetails] = useState({});
  const [showUserForm, setShowUserForm] = useState(true);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [error, setError] = useState('');
  const [botInfo, setBotInfo] = useState(null);
  const [sessionId, setSessionId] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (botId) {
      fetchBotInfo();
      // Generate session ID
      setSessionId(`chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    }
  }, [botId]);

  // Optional: Save conversation when page is unloaded (commented out to only save on disconnect button)
  // useEffect(() => {
  //   const handleBeforeUnload = async () => {
  //     if (messages.length > 0) {
  //       await saveConversationToDatabase();
  //     }
  //   };

  //   window.addEventListener('beforeunload', handleBeforeUnload);
    
  //   return () => {
  //     window.removeEventListener('beforeunload', handleBeforeUnload);
  //   };
  // }, [messages]);

  // Validate webhook URL
  const validateWebhookUrl = async (url) => {
    try {
      const testPayload = {
        message: 'test',
        sessionId: 'test_session',
        timestamp: new Date().toISOString()
      };

      const response = await axios.post(url, testPayload, {
        timeout: 5000,
        headers: { 'Content-Type': 'application/json' }
      });

      // Check if response is ok and has expected structure
      return response.status >= 200 && response.status < 300;
    } catch (error) {
      console.error('Webhook validation failed:', error);
      return false;
    }
  };

  const fetchBotInfo = async () => {
    try {
      const response = await axios.get(`https://torise-backend-1.onrender.com/api/admin/bots/${botId}`);
      const bot = response.data;
      
      if (!bot || !bot.active) {
        setError('Bot not found or inactive');
        return;
      }

      // Check if bot has webhook URL for chat functionality
      if (!bot.webhook_url || bot.webhook_url.trim() === '') {
        setError('This bot is not configured for chat. Please contact the administrator.');
        return;
      }

      // Validate webhook URL
      const isWebhookValid = await validateWebhookUrl(bot.webhook_url);
      if (!isWebhookValid) {
        setError('This bot\'s webhook URL is not responding correctly. Please contact the administrator.');
        return;
      }

      setBotInfo(bot);
      
      // Add welcome message
      setMessages([{
        id: Date.now(),
        type: 'bot',
        content: `Welcome to ${bot.name}! Please provide your details to get started.`,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error fetching bot:', error);
      setError('Error loading bot information');
    }
  };

  const handleUserDetailsSubmit = (e) => {
    e.preventDefault();
    setShowUserForm(false);
    
    // Add user details received message
    setMessages(prev => [...prev, {
      id: Date.now(),
      type: 'bot',
      content: 'Thank you! How can I help you today?',
      timestamp: new Date()
    }]);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!currentMessage.trim() || !botInfo || !botInfo.webhook_url || botInfo.webhook_url.trim() === '') {
      setError('Chat is not available for this bot. Please contact the administrator.');
      return;
    }

    // Validate webhook URL before sending message
    const isWebhookValid = await validateWebhookUrl(botInfo.webhook_url);
    if (!isWebhookValid) {
      setError('Webhook URL is not responding. Please contact the administrator.');
      return;
    }

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: currentMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    try {
      // Send to N8N webhook with correct format
      const n8nPayload = {
        message: currentMessage,
        sessionId: sessionId,
        timestamp: new Date().toISOString()
      };

      const response = await axios.post(botInfo.webhook_url, n8nPayload, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
      });

      let botReply = 'Thank you for your message. I will get back to you soon.';
      
      if (response.data && response.data.reply) {
        botReply = response.data.reply;
      }

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: botReply,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);

    } catch (webhookError) {
      console.error('N8N webhook error:', webhookError);
      
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'I am currently processing your request. Please wait a moment.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConversationToDatabase = async () => {
    // Don't save if bot doesn't have webhook URL
    if (!botInfo || !botInfo.webhook_url || botInfo.webhook_url.trim() === '') {
      console.log('❌ Not saving conversation - bot has no webhook URL');
      return;
    }

    // Validate webhook URL before saving
    const isWebhookValid = await validateWebhookUrl(botInfo.webhook_url);
    if (!isWebhookValid) {
      console.log('❌ Not saving conversation - webhook URL is invalid');
      return;
    }

    try {
      console.log('💾 Saving conversation to database...');
      console.log('Messages to save:', messages);
      
      // Calculate actual duration
      const startTime = messages.length > 0 ? new Date(messages[0].timestamp) : new Date();
      const endTime = new Date();
      const durationMinutes = Math.floor((endTime - startTime) / 1000 / 60);
      
      const conversationData = {
        conversation_id: sessionId,
        bot_id: botId,
        client_id: botInfo?.clientId, // Add client_id from bot info
        channel_type: 'chat',
        user_details: userDetails,
        message_log: messages.map(msg => ({
          sender: msg.type === 'user' ? 'user' : 'agent',
          message: msg.content || '',
          timestamp: msg.timestamp || new Date(),
          sentiment: 'neutral',
          tags: []
        })),
        started_at: startTime,
        ended_at: endTime,
        duration_minutes: durationMinutes,
        status: 'completed'
      };

      console.log('Conversation data to save:', JSON.stringify(conversationData, null, 2));

      const response = await axios.post('https://torise-backend-1.onrender.com/api/conversations/save', conversationData, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
      });

      console.log('✅ Conversation saved to database successfully:', response.data);
      return true;

    } catch (error) {
      console.error('❌ Error saving conversation:', error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
      }
      return false;
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    
    if (messages.length > 0) {
      console.log('🔌 Disconnecting and saving conversation...');
      
      const success = await saveConversationToDatabase();
      if (success) {
        alert('✅ Conversation saved successfully! You can view it in the Conversation Logs.');
      } else {
        alert('❌ Failed to save conversation. Please try again.');
      }
    } else {
      console.log('🔌 No messages to save, disconnecting...');
    }
    
    // Clear messages immediately after saving
    setMessages([]);
    setCurrentMessage('');
    setUserDetails({});
    setShowUserForm(true);
    
    // Show a brief message that conversation was cleared
    setTimeout(() => {
      alert('💬 Chat messages cleared. You can start a new conversation.');
    }, 100);
    
    // Close the chat window after a short delay
    setTimeout(() => {
      window.close();
    }, 500);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!botId) {
    return (
      <div className="chat-container">
        <div className="error-message">
          <h2>Error</h2>
          <p>No bot ID provided. Please provide a valid bot ID.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chat-container">
        <div className="error-message">
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>{botInfo?.name || 'Chat Bot'}</h2>
        <div className="header-controls">
          <div className="connection-status connected">
            🟢 Connected
          </div>
          <button 
            onClick={handleDisconnect}
            disabled={isDisconnecting}
            className={`disconnect-btn ${isDisconnecting ? 'disconnecting' : ''}`}
            title="Disconnect and save conversation"
          >
            {isDisconnecting ? '⏳ Saving...' : '🔌 Disconnect'}
          </button>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.type}`}>
            <div className="message-content">
              {message.content}
            </div>
            <div className="message-time">
              {formatTime(message.timestamp)}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="message bot">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {showUserForm && botInfo?.user_prompt_fields && (
        <div className="user-form-overlay">
          <div className="user-form">
            <h3>Please provide your details</h3>
            <form onSubmit={handleUserDetailsSubmit}>
              {botInfo.user_prompt_fields.map((field) => (
                <div key={field.name} className="form-group">
                  <label htmlFor={field.name}>{field.label}</label>
                  <input
                    type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
                    id={field.name}
                    name={field.name}
                    value={userDetails[field.name] || ''}
                    onChange={handleInputChange}
                    required={field.required}
                    placeholder={field.label}
                  />
                </div>
              ))}
              <button type="submit" className="submit-btn">
                Start Chat
              </button>
            </form>
          </div>
        </div>
      )}

      {!showUserForm && (
        <form className="chat-input-form" onSubmit={handleSendMessage}>
          <input
            type="text"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            placeholder={botInfo?.webhook_url ? "Type your message..." : "Chat not available"}
            disabled={isLoading || !botInfo?.webhook_url}
            className="chat-input"
          />
          <button 
            type="submit" 
            disabled={!currentMessage.trim() || isLoading || !botInfo?.webhook_url}
            className="send-btn"
          >
            Send
          </button>
        </form>
      )}
    </div>
  );
};

export default ChatInterface; 