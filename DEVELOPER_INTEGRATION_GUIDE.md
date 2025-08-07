# Developer Guide: How to Integrate Real-time Notifications

## 🚀 Quick Start Guide

This guide shows developers exactly how to integrate the notification system into their applications.

## Method 1: Using JWT Token (Recommended)

### Frontend Integration

#### React/Next.js Example

```javascript
// hooks/useNotifications.js
import { useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';

export const useNotifications = () => {
  const [socket, setSocket] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const connectSocket = useCallback(() => {
    // Get JWT token from your auth system (localStorage, cookies, etc.)
    const token = localStorage.getItem('authToken'); // or however you store your JWT
    
    if (!token) {
      console.error('No auth token found');
      return;
    }

    const newSocket = io('http://localhost:3000');
    
    newSocket.on('connect', () => {
      console.log('Connected to server');
      
      // Authenticate using JWT token - the server will extract userId and role
      newSocket.emit('authenticate', { token });
    });

    newSocket.on('authenticated', (data) => {
      console.log('Successfully authenticated:', data);
      setIsConnected(true);
    });

    newSocket.on('unread_count_update', (data) => {
      setUnreadCount(data.unreadCount);
    });

    newSocket.on('new_notification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      // Show toast/popup notification here
      showNotificationToast(notification);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      setIsConnected(false);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(newSocket);
    
    return newSocket;
  }, []);

  useEffect(() => {
    const socketInstance = connectSocket();
    return () => socketInstance?.close();
  }, [connectSocket]);

  const markAllAsRead = () => {
    socket?.emit('mark_notification_read', {});
  };

  const markAsRead = (notificationId) => {
    socket?.emit('mark_notification_read', { notificationId });
  };

  const refreshUnreadCount = () => {
    socket?.emit('get_unread_count');
  };

  return {
    unreadCount,
    notifications,
    isConnected,
    markAllAsRead,
    markAsRead,
    refreshUnreadCount
  };
};

// Helper function for toast notifications
const showNotificationToast = (notification) => {
  // Using react-hot-toast example
  // toast(notification.title, {
  //   description: notification.message,
  //   duration: 5000,
  // });
  
  // Or using browser native notifications
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(notification.title, {
      body: notification.message,
      icon: '/notification-icon.png'
    });
  }
};
```

#### Using the Hook in Components

```javascript
// components/NotificationBell.jsx
import React from 'react';
import { useNotifications } from '../hooks/useNotifications';

const NotificationBell = () => {
  const { unreadCount, markAllAsRead, isConnected } = useNotifications();

  return (
    <div className="notification-bell">
      <button onClick={() => setShowDropdown(!showDropdown)}>
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>
      
      <div className="status">
        Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>
      
      {unreadCount > 0 && (
        <button onClick={markAllAsRead}>
          Mark all as read
        </button>
      )}
    </div>
  );
};

export default NotificationBell;
```

#### Vanilla JavaScript Example

```html
<!DOCTYPE html>
<html>
<head>
    <title>Notification Integration</title>
    <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
</head>
<body>
    <div id="notification-bell">
        🔔 <span id="unread-count">0</span>
    </div>
    <div id="status">Disconnected</div>
    <button onclick="markAllAsRead()">Mark All Read</button>

    <script>
        class NotificationManager {
            constructor() {
                this.socket = null;
                this.init();
            }

            init() {
                // Get JWT token from wherever you store it
                const token = localStorage.getItem('authToken');
                
                if (!token) {
                    console.error('No auth token found');
                    return;
                }

                this.socket = io('http://localhost:3000');
                this.setupEventListeners();
                
                this.socket.on('connect', () => {
                    // Authenticate with JWT token
                    this.socket.emit('authenticate', { token });
                });
            }

            setupEventListeners() {
                this.socket.on('authenticated', (data) => {
                    console.log('Authenticated as:', data);
                    document.getElementById('status').textContent = 
                        `Connected as ${data.role}`;
                });

                this.socket.on('unread_count_update', (data) => {
                    document.getElementById('unread-count').textContent = 
                        data.unreadCount;
                });

                this.socket.on('new_notification', (notification) => {
                    this.showNotification(notification);
                });

                this.socket.on('error', (error) => {
                    console.error('Socket error:', error);
                    document.getElementById('status').textContent = 
                        'Error: ' + error.message;
                });
            }

            showNotification(notification) {
                // Create popup notification
                const popup = document.createElement('div');
                popup.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #007bff;
                    color: white;
                    padding: 15px;
                    border-radius: 5px;
                    z-index: 1000;
                `;
                popup.innerHTML = `
                    <strong>${notification.title}</strong><br>
                    ${notification.message}
                `;
                document.body.appendChild(popup);
                
                setTimeout(() => popup.remove(), 5000);
            }

            markAllAsRead() {
                this.socket?.emit('mark_notification_read', {});
            }
        }

        // Initialize when page loads
        let notificationManager;
        window.addEventListener('load', () => {
            notificationManager = new NotificationManager();
        });

        function markAllAsRead() {
            notificationManager.markAllAsRead();
        }
    </script>
</body>
</html>
```

## Method 2: Getting JWT Token from Different Sources

### From localStorage

```javascript
const token = localStorage.getItem('authToken');
socket.emit('authenticate', { token });
```

### From Cookies

```javascript
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

const token = getCookie('authToken');
socket.emit('authenticate', { token });
```

### From HTTP Header (if you have it in memory)

```javascript
// If you store token in a variable after login
let authToken = null;

// After login API call
const loginResponse = await fetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
});

const { token } = await loginResponse.json();
authToken = token;

// Connect to socket
socket.emit('authenticate', { token: authToken });
```

### From React Context/Redux

```javascript
// If using React Context
const { token } = useAuth();
socket.emit('authenticate', { token });

// If using Redux
const token = useSelector(state => state.auth.token);
socket.emit('authenticate', { token });
```

## Method 3: Manual Authentication (for Testing)

If you don't have JWT tokens set up yet, you can manually authenticate:

```javascript
// For testing purposes - you need to know the userId and role
socket.emit('authenticate', { 
    userId: 'user123', 
    role: 'USER' 
});
```

## Complete Implementation Example

### Node.js/Express Frontend

```javascript
// client.js
const io = require('socket.io-client');

class NotificationClient {
    constructor(serverUrl, token) {
        this.socket = io(serverUrl);
        this.token = token;
        this.setupConnection();
    }

    setupConnection() {
        this.socket.on('connect', () => {
            console.log('Connected to notification server');
            this.authenticate();
        });

        this.socket.on('authenticated', (data) => {
            console.log(`Authenticated as ${data.role}:`, data.userId);
        });

        this.socket.on('unread_count_update', (data) => {
            console.log(`Unread notifications: ${data.unreadCount}`);
            this.updateUI(data.unreadCount);
        });

        this.socket.on('new_notification', (notification) => {
            console.log('New notification:', notification);
            this.handleNewNotification(notification);
        });
    }

    authenticate() {
        this.socket.emit('authenticate', { token: this.token });
    }

    updateUI(count) {
        // Update your UI here
        document.querySelector('.notification-badge').textContent = count;
    }

    handleNewNotification(notification) {
        // Handle new notification
        this.showToast(notification.title, notification.message);
    }

    showToast(title, message) {
        console.log(`📢 ${title}: ${message}`);
    }

    markAllAsRead() {
        this.socket.emit('mark_notification_read', {});
    }
}

// Usage
const token = 'your-jwt-token-here';
const notificationClient = new NotificationClient('http://localhost:3000', token);
```

## Mobile App Integration (React Native)

```javascript
// NotificationService.js
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

class NotificationService {
    constructor() {
        this.socket = null;
        this.listeners = new Set();
    }

    async connect() {
        try {
            // Get token from AsyncStorage
            const token = await AsyncStorage.getItem('authToken');
            
            if (!token) {
                throw new Error('No auth token found');
            }

            this.socket = io('http://your-server.com:3000');
            
            this.socket.on('connect', () => {
                console.log('Connected to notification server');
                this.socket.emit('authenticate', { token });
            });

            this.socket.on('authenticated', (data) => {
                console.log('Authenticated:', data);
                this.notifyListeners('connected', data);
            });

            this.socket.on('unread_count_update', (data) => {
                this.notifyListeners('unreadCount', data.unreadCount);
            });

            this.socket.on('new_notification', (notification) => {
                this.notifyListeners('newNotification', notification);
                this.showPushNotification(notification);
            });

        } catch (error) {
            console.error('Connection error:', error);
        }
    }

    addListener(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    notifyListeners(event, data) {
        this.listeners.forEach(callback => callback(event, data));
    }

    showPushNotification(notification) {
        // Show push notification using react-native-push-notification
        // or expo-notifications
    }

    markAllAsRead() {
        this.socket?.emit('mark_notification_read', {});
    }
}

export default new NotificationService();
```

## What Your JWT Token Should Contain

Your JWT token should include at minimum:

```javascript
// When creating JWT token in your login endpoint
const tokenPayload = {
    userId: user.id,        // or 'id'
    email: user.email,
    role: user.role,        // 'USER' or 'ADMIN'
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
};

const token = jwt.sign(tokenPayload, process.env.SECRET_CODE);
```

## Testing Your Integration

1. **Start your server**: `npm run dev`
2. **Open browser console**
3. **Set a token**: `localStorage.setItem('authToken', 'your-actual-jwt-token')`
4. **Open the demo**: `notification-demo.html`
5. **Click "Connect & Authenticate"**

## Common Issues & Solutions

### Issue: "Invalid or expired token"
**Solution**: Check that your JWT token is valid and contains `userId` field

### Issue: "User not found"
**Solution**: Ensure the userId in your JWT token exists in your database

### Issue: "No auth token found"
**Solution**: Make sure you're storing and retrieving the token correctly

### Issue: Socket not connecting
**Solution**: Check CORS settings in your server configuration

## Production Deployment

1. **Use HTTPS/WSS**: `wss://your-domain.com`
2. **Proper CORS**: Configure for your domain only
3. **Token refresh**: Handle token expiration
4. **Error handling**: Implement reconnection logic
5. **Rate limiting**: Prevent spam connections

This guide should help any developer integrate the notification system easily! 🚀
