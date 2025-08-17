# 🚀 Chat Widget Documentation

## Overview

The Chat Widget is a lightweight, embeddable chat solution that can be integrated into any website. It provides a seamless chat experience with N8N webhook integration, user details capture, and automatic conversation logging.

## Features

- ✅ **Easy Integration**: Single script tag integration
- ✅ **User Details Capture**: Name, email, and mobile number collection
- ✅ **N8N Webhook Integration**: Connect with your N8N workflows
- ✅ **Conversation Logging**: Automatic database storage
- ✅ **Responsive Design**: Works on all devices
- ✅ **Customizable**: Easy to style and configure
- ✅ **Real-time Chat**: Instant messaging with typing indicators
- ✅ **Session Management**: Unique session tracking

## Quick Start

### 1. Include the Widget Script

Add this script tag to your HTML:

```html
<script src="http://localhost:5001/chat-widget.js"></script>
```

### 2. Initialize the Widget

```javascript
// Initialize with your bot ID
ChatWidget.init('YOUR_BOT_ID');
```

### 3. Complete Example

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Website</title>
</head>
<body>
    <h1>Welcome to My Website</h1>
    <p>This is my website content...</p>
    
    <!-- Chat Widget -->
    <script src="http://localhost:5001/chat-widget.js"></script>
    <script>
        ChatWidget.init('bot_123');
    </script>
</body>
</html>
```

## Configuration

### Default Configuration

```javascript
const CONFIG = {
    position: 'bottom-right',    // Widget position
    width: '350px',              // Widget width
    height: '500px',             // Widget height
    zIndex: 9999,                // Z-index for layering
    apiUrl: 'http://109.73.166.213:5000',  // Your API URL
    widgetUrl: 'http://localhost:5001' // Your frontend URL
};
```

### Customizing Configuration

To customize the widget, edit the `CONFIG` object in `chat-widget.js`:

```javascript
const CONFIG = {
    position: 'bottom-left',     // Change position
    width: '400px',              // Change width
    height: '600px',             // Change height
    zIndex: 10000,               // Change z-index
    apiUrl: 'https://your-api.com',      // Your production API
    widgetUrl: 'https://your-frontend.com' // Your production frontend
};
```

## API Integration

### Required Backend Endpoints

The widget requires these API endpoints to function:

1. **GET /api/admin/bots/:id** - Fetch bot information
2. **POST /api/conversations/save** - Save conversation logs

### N8N Webhook Format

The widget sends data to your N8N webhook in this format:

```json
{
    "message": "User's message",
    "sessionId": "unique_session_id",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "userDetails": {
        "name": "John Doe",
        "email": "john@example.com",
        "mobile": "+1234567890"
    }
}
```

Expected N8N response:

```json
{
    "reply": "Bot's response message"
}
```

## User Flow

1. **Widget Toggle**: User clicks the chat button (bottom-right corner)
2. **User Form**: Widget displays form to capture user details
3. **Form Submission**: User fills name, email, mobile and submits
4. **Chat Interface**: Widget switches to chat mode
5. **Message Exchange**: User and bot exchange messages
6. **Auto-save**: Conversation is saved when page unloads

## Styling Customization

### CSS Variables

You can customize the widget appearance by modifying CSS in `chat-widget.js`:

```css
#chat-widget-container {
    /* Main container styles */
}

#chat-widget-header {
    background: #007bff;  /* Header background color */
}

#chat-widget-toggle {
    background: #007bff;  /* Toggle button color */
}
```

### Color Scheme

Default colors:
- Primary: `#007bff` (Blue)
- Secondary: `#0056b3` (Dark Blue)
- Background: `#f8f9fa` (Light Gray)
- Text: `#333` (Dark Gray)

## Advanced Usage

### Multiple Widgets

You can have multiple widgets on the same page:

```javascript
// Initialize multiple widgets
ChatWidget.init('support_bot');
ChatWidget.init('sales_bot');
```

### Manual Conversation Saving

```javascript
// Save conversation manually
ChatWidget.saveConversation();
```

### Widget State Management

```javascript
// Access widget state (read-only)
console.log(window.ChatWidget);
```

## Browser Compatibility

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+
- ✅ Mobile browsers

## Security Considerations

1. **CORS**: Ensure your API allows requests from client domains
2. **HTTPS**: Use HTTPS in production for secure communication
3. **Input Validation**: Validate user inputs on the server side
4. **Rate Limiting**: Implement rate limiting on your API endpoints

## Troubleshooting

### Common Issues

1. **Widget not appearing**
   - Check if script is loaded correctly
   - Verify bot ID is valid
   - Check browser console for errors

2. **Chat not working**
   - Verify N8N webhook URL is correct
   - Check webhook response format
   - Ensure API endpoints are accessible

3. **Styling conflicts**
   - Check z-index conflicts
   - Verify CSS specificity
   - Test on different browsers

### Debug Mode

Enable debug logging by adding this before widget initialization:

```javascript
// Enable debug mode
localStorage.setItem('chat-widget-debug', 'true');
ChatWidget.init('bot_123');
```

## Production Deployment

### 1. Update URLs

Change localhost URLs to your production URLs:

```javascript
const CONFIG = {
    apiUrl: 'https://your-api-domain.com',
    widgetUrl: 'https://your-frontend-domain.com'
};
```

### 2. CORS Configuration

Ensure your backend allows requests from client domains:

```javascript
// Backend CORS configuration
app.use(cors({
    origin: ['https://client-domain.com', 'https://another-client.com']
}));
```

### 3. SSL Certificate

Use HTTPS in production for secure communication.

### 4. CDN Deployment

Deploy the widget script to a CDN for better performance:

```html
<script src="https://cdn.your-domain.com/chat-widget.js"></script>
```

## Support

For support and questions:
- Check the demo page: `http://localhost:5001/widget-demo.html`
- Review browser console for error messages
- Verify API endpoints are working
- Test with different bot IDs

## License

This widget is part of the TD Engine project and follows the same licensing terms.

---

**Note**: Make sure your backend server and N8N webhook are running before testing the widget.
