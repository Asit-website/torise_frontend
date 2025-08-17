(function() {
    'use strict';
    
    // Configuration
    const CONFIG = {
        position: 'bottom-right',
        width: '350px',
        height: '500px',
        zIndex: 9999,
        apiUrl: 'http://109.73.166.213:5000', // Change this to your API URL
        widgetUrl: 'http://localhost:5001' // Change this to your frontend URL
    };
    
    // Widget state
    let widgetState = {
        isOpen: false,
        botId: null,
        sessionId: null,
        userDetails: {},
        messages: []
    };
    
    // Create widget HTML
    function createWidgetHTML() {
        const widgetHTML = `
            <div id="chat-widget-container" style="display: none;">
                <div id="chat-widget-header">
                    <div class="chat-widget-title">
                        <span id="chat-widget-bot-name">Chat Support</span>
                    </div>
                    <div class="chat-widget-controls">
                        <button id="chat-widget-minimize" class="chat-widget-btn">−</button>
                        <button id="chat-widget-close" class="chat-widget-btn">×</button>
                    </div>
                </div>
                
                <div id="chat-widget-body">
                    <div id="chat-widget-messages"></div>
                    
                    <div id="chat-widget-user-form" style="display: block;">
                        <div class="chat-widget-form-title">Please provide your details to start chat</div>
                        <form id="chat-widget-form">
                            <div class="chat-widget-form-group">
                                <input type="text" id="chat-widget-name" placeholder="Your Name" required>
                            </div>
                            <div class="chat-widget-form-group">
                                <input type="email" id="chat-widget-email" placeholder="Your Email" required>
                            </div>
                            <div class="chat-widget-form-group">
                                <input type="tel" id="chat-widget-mobile" placeholder="Your Mobile Number" required>
                            </div>
                            <button type="submit" class="chat-widget-submit-btn">Start Chat</button>
                        </form>
                    </div>
                    
                    <div id="chat-widget-input-container" style="display: none;">
                        <form id="chat-widget-message-form">
                            <input type="text" id="chat-widget-message-input" placeholder="Type your message..." />
                            <button type="submit" class="chat-widget-send-btn">Send</button>
                        </form>
                    </div>
                </div>
            </div>
            
            <div id="chat-widget-toggle" style="display: none;">
                <div class="chat-widget-toggle-icon">💬</div>
                <div class="chat-widget-toggle-text">Chat with us</div>
            </div>
        `;
        
        return widgetHTML;
    }
    
    // Create widget styles
    function createWidgetStyles() {
        const styles = `
            <style>
                #chat-widget-container {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    width: ${CONFIG.width};
                    height: ${CONFIG.height};
                    background: white;
                    border-radius: 10px;
                    box-shadow: 0 5px 20px rgba(0,0,0,0.2);
                    z-index: ${CONFIG.zIndex};
                    font-family: Arial, sans-serif;
                    overflow: hidden;
                }
                
                #chat-widget-header {
                    background: #007bff;
                    color: white;
                    padding: 15px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .chat-widget-title {
                    font-weight: bold;
                    font-size: 16px;
                }
                
                .chat-widget-controls {
                    display: flex;
                    gap: 5px;
                }
                
                .chat-widget-btn {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 18px;
                    cursor: pointer;
                    padding: 0 5px;
                }
                
                .chat-widget-btn:hover {
                    opacity: 0.8;
                }
                
                #chat-widget-body {
                    height: calc(100% - 60px);
                    display: flex;
                    flex-direction: column;
                }
                
                #chat-widget-messages {
                    flex: 1;
                    padding: 15px;
                    overflow-y: auto;
                    background: #f8f9fa;
                }
                
                .chat-widget-message {
                    margin-bottom: 10px;
                    padding: 10px;
                    border-radius: 10px;
                    max-width: 80%;
                    word-wrap: break-word;
                }
                
                .chat-widget-message.user {
                    background: #007bff;
                    color: white;
                    margin-left: auto;
                }
                
                .chat-widget-message.bot {
                    background: white;
                    color: #333;
                    border: 1px solid #ddd;
                }
                
                .chat-widget-message-time {
                    font-size: 11px;
                    opacity: 0.7;
                    margin-top: 5px;
                }
                
                #chat-widget-user-form {
                    padding: 20px;
                    background: white;
                }
                
                .chat-widget-form-title {
                    text-align: center;
                    margin-bottom: 15px;
                    font-weight: bold;
                    color: #333;
                }
                
                .chat-widget-form-group {
                    margin-bottom: 15px;
                }
                
                .chat-widget-form-group input {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    font-size: 14px;
                    box-sizing: border-box;
                }
                
                .chat-widget-submit-btn {
                    width: 100%;
                    padding: 12px;
                    background: #007bff;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    font-size: 14px;
                    cursor: pointer;
                }
                
                .chat-widget-submit-btn:hover {
                    background: #0056b3;
                }
                
                #chat-widget-input-container {
                    padding: 15px;
                    background: white;
                    border-top: 1px solid #ddd;
                }
                
                #chat-widget-message-form {
                    display: flex;
                    gap: 10px;
                }
                
                #chat-widget-message-input {
                    flex: 1;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    font-size: 14px;
                }
                
                .chat-widget-send-btn {
                    padding: 10px 15px;
                    background: #007bff;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                }
                
                .chat-widget-send-btn:hover {
                    background: #0056b3;
                }
                
                #chat-widget-toggle {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: #007bff;
                    color: white;
                    padding: 15px 20px;
                    border-radius: 50px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                    z-index: ${CONFIG.zIndex - 1};
                    transition: all 0.3s ease;
                }
                
                #chat-widget-toggle:hover {
                    background: #0056b3;
                    transform: scale(1.05);
                }
                
                .chat-widget-toggle-icon {
                    font-size: 20px;
                }
                
                .chat-widget-toggle-text {
                    font-size: 14px;
                    font-weight: bold;
                }
                
                .chat-widget-typing {
                    padding: 10px;
                    background: white;
                    border: 1px solid #ddd;
                    border-radius: 10px;
                    max-width: 80%;
                    margin-bottom: 10px;
                }
                
                .chat-widget-typing-indicator {
                    display: flex;
                    gap: 5px;
                }
                
                .chat-widget-typing-dot {
                    width: 8px;
                    height: 8px;
                    background: #999;
                    border-radius: 50%;
                    animation: typing 1.4s infinite ease-in-out;
                }
                
                .chat-widget-typing-dot:nth-child(1) { animation-delay: -0.32s; }
                .chat-widget-typing-dot:nth-child(2) { animation-delay: -0.16s; }
                
                @keyframes typing {
                    0%, 80%, 100% { transform: scale(0); }
                    40% { transform: scale(1); }
                }
            </style>
        `;
        
        return styles;
    }
    
    // Initialize widget
    function initWidget(botId) {
        widgetState.botId = botId;
        widgetState.sessionId = 'widget_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Add styles to head
        const styleElement = document.createElement('div');
        styleElement.innerHTML = createWidgetStyles();
        document.head.appendChild(styleElement.firstElementChild);
        
        // Add widget HTML to body
        const widgetElement = document.createElement('div');
        widgetElement.innerHTML = createWidgetHTML();
        
        // Append all child elements (both container and toggle)
        while (widgetElement.firstChild) {
            document.body.appendChild(widgetElement.firstChild);
        }
        
        // Add event listeners
        addEventListeners();
        
        // Show toggle button
        const toggleButton = document.getElementById('chat-widget-toggle');
        if (toggleButton) {
            toggleButton.style.display = 'flex';
        }
    }


    
    // Add event listeners
    function addEventListeners() {
        // Toggle button
        const toggleButton = document.getElementById('chat-widget-toggle');
        if (toggleButton) {
            toggleButton.addEventListener('click', (e) => {
                e.preventDefault();
                toggleWidget();
            });
        }
        
        // Header controls
        const minimizeButton = document.getElementById('chat-widget-minimize');
        const closeButton = document.getElementById('chat-widget-close');
        if (minimizeButton) {
            minimizeButton.addEventListener('click', (e) => {
                e.preventDefault();
                toggleWidget();
            });
        }
        if (closeButton) {
            closeButton.addEventListener('click', (e) => {
                e.preventDefault();
                closeWidget();
            });
        }
        
        // User form
        const userForm = document.getElementById('chat-widget-form');
        if (userForm) {
            userForm.addEventListener('submit', handleUserFormSubmit);
        }
        
        // Message form
        const messageForm = document.getElementById('chat-widget-message-form');
        if (messageForm) {
            messageForm.addEventListener('submit', handleMessageSubmit);
        }
        
        // Message input enter key
        const messageInput = document.getElementById('chat-widget-message-input');
        if (messageInput) {
            messageInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleMessageSubmit(e);
                }
            });
        }
    }
    
    // Toggle widget
    async function toggleWidget() {
        const container = document.getElementById('chat-widget-container');
        const toggle = document.getElementById('chat-widget-toggle');
        
        if (widgetState.isOpen) {
            // Save conversation when minimizing
            await saveConversation();
            container.style.display = 'none';
            toggle.style.display = 'flex';
        } else {
            container.style.display = 'block';
            toggle.style.display = 'none';
        }
        
        widgetState.isOpen = !widgetState.isOpen;
    }
    
    // Close widget
    async function closeWidget() {
        // Save conversation before closing
        await saveConversation();
        
        document.getElementById('chat-widget-container').style.display = 'none';
        document.getElementById('chat-widget-toggle').style.display = 'flex';
        widgetState.isOpen = false;
    }
    
    // Handle user form submit
    async function handleUserFormSubmit(e) {
        e.preventDefault();
        
        const name = document.getElementById('chat-widget-name').value;
        const email = document.getElementById('chat-widget-email').value;
        const mobile = document.getElementById('chat-widget-mobile').value;
        
        widgetState.userDetails = { name, email, mobile };
        
        // Hide form and show chat
        document.getElementById('chat-widget-user-form').style.display = 'none';
        document.getElementById('chat-widget-input-container').style.display = 'block';
        

        
        // Add welcome message
        addMessage('bot', 'Thank you! How can I help you today?');
        
        // Fetch bot info and add welcome message
        try {
            const response = await fetch(`${CONFIG.apiUrl}/api/admin/bots/${widgetState.botId}`);
            const bot = await response.json();
            
            if (bot && bot.name) {
                document.getElementById('chat-widget-bot-name').textContent = bot.name;
                addMessage('bot', `Welcome to ${bot.name}! How can I help you today?`);
            }
        } catch (error) {
            console.error('Error fetching bot info:', error);
        }
    }
    
    // Handle message submit
    async function handleMessageSubmit(e) {
        e.preventDefault();
        
        const input = document.getElementById('chat-widget-message-input');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Add user message
        addMessage('user', message);
        input.value = '';
        
        // Show typing indicator
        showTypingIndicator();
        
        try {
            // Get bot info
            const botResponse = await fetch(`${CONFIG.apiUrl}/api/admin/bots/${widgetState.botId}`);
            const bot = await botResponse.json();
            
            if (!bot || !bot.webhook_url) {
                addMessage('bot', 'Sorry, this bot is not configured for chat.');
                hideTypingIndicator();
                return;
            }
            
            // Send to N8N webhook with query parameter format (like Postman)
            const webhookUrl = `${bot.webhook_url}?message=${encodeURIComponent(message)}`;
            
            const webhookResponse = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({}) // Empty body since we're using query params
            });
            
            hideTypingIndicator();
            
            if (webhookResponse.ok) {
                const webhookData = await webhookResponse.json();
                console.log('🔗 Widget Webhook Response:', webhookData);
                const botReply = webhookData.reply || 'Thank you for your message. I will get back to you soon.';
                console.log('✅ Widget Using webhook reply:', botReply);
                addMessage('bot', botReply);
            } else {
                console.log('❌ Widget Webhook error:', webhookResponse.status);
                addMessage('bot', 'I am currently processing your request. Please wait a moment.');
            }
            
        } catch (error) {
            console.error('Error sending message:', error);
            hideTypingIndicator();
            addMessage('bot', 'I am currently processing your request. Please wait a moment.');
        }
    }
    
    // Add message to chat
    function addMessage(type, content) {
        const messagesContainer = document.getElementById('chat-widget-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-widget-message ${type}`;
        
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageDiv.innerHTML = `
            <div>${content}</div>
            <div class="chat-widget-message-time">${time}</div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Store message
        widgetState.messages.push({
            type,
            content,
            timestamp: new Date()
        });
    }
    
    // Show typing indicator
    function showTypingIndicator() {
        const messagesContainer = document.getElementById('chat-widget-messages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chat-widget-message bot chat-widget-typing';
        typingDiv.id = 'chat-widget-typing-indicator';
        
        typingDiv.innerHTML = `
            <div class="chat-widget-typing-indicator">
                <div class="chat-widget-typing-dot"></div>
                <div class="chat-widget-typing-dot"></div>
                <div class="chat-widget-typing-dot"></div>
            </div>
        `;
        
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Hide typing indicator
    function hideTypingIndicator() {
        const typingIndicator = document.getElementById('chat-widget-typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    // Save conversation to database
    async function saveConversation() {
        if (widgetState.messages.length === 0) return;
        
        try {
            // Get bot info to get client_id
            let clientId = null;
            try {
                const botResponse = await fetch(`${CONFIG.apiUrl}/api/admin/bots/${widgetState.botId}`);
                const bot = await botResponse.json();
                if (bot && bot.client_id) {
                    clientId = bot.client_id;
                }
            } catch (error) {
                console.error('Error fetching bot info for client_id:', error);
            }
            
            const conversationData = {
                conversation_id: widgetState.sessionId,
                bot_id: widgetState.botId,
                client_id: clientId,
                channel_type: 'chat',
                user_details: widgetState.userDetails,
                message_log: widgetState.messages.map(msg => ({
                    sender: msg.type === 'user' ? 'user' : 'agent',
                    message: msg.content,
                    timestamp: msg.timestamp,
                    sentiment: 'neutral',
                    tags: []
                })),
                started_at: widgetState.messages[0]?.timestamp || new Date(),
                ended_at: new Date(),
                duration_minutes: Math.floor((new Date() - (widgetState.messages[0]?.timestamp || new Date())) / 1000 / 60),
                status: 'completed'
            };
            
            console.log('Saving conversation:', conversationData);
            
            const response = await fetch(`${CONFIG.apiUrl}/api/conversations/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(conversationData)
            });
            
            if (response.ok) {
                console.log('Conversation saved successfully');
            } else {
                console.error('Failed to save conversation:', response.status);
            }
            
        } catch (error) {
            console.error('Error saving conversation:', error);
        }
    }
    
    // Save conversation when page unloads
    window.addEventListener('beforeunload', saveConversation);
    
    // Expose init function globally
    window.ChatWidget = {
        init: initWidget,
        saveConversation: saveConversation
    };
    
})();
