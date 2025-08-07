# 🚀 HOW TO USE: Real-time Notifications with Unread Counts

## The Simple Answer to "How do I get userId and role?"

### **Method 1: From JWT Token (Recommended)**

When you authenticate users in your app, you create a JWT token that contains user information. Here's how to use it:

```javascript
// 1. In your frontend, get the token you received during login
const token = localStorage.getItem('authToken'); // or from cookies, context, etc.

// 2. Connect to Socket.IO and authenticate
const socket = io('http://localhost:3000');

socket.on('connect', () => {
    // The server will automatically extract userId and role from your token
    socket.emit('authenticate', { token });
});

socket.on('authenticated', (data) => {
    console.log('Connected as:', data.userId, data.role);
    // Now you'll start receiving unread count updates
});
```

**That's it!** The server automatically:
- ✅ Validates your JWT token
- ✅ Extracts `userId` and `role` from the token
- ✅ Connects you to the notification system
- ✅ Sends you real-time unread counts

### **Method 2: Manual (for Testing)**

If you don't have JWT set up yet, you can manually specify:

```javascript
socket.emit('authenticate', { 
    userId: 'user123', 
    role: 'USER' 
});
```

## 📱 Complete Working Examples

### React App Integration

```javascript
// hooks/useNotifications.js
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

export function useNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Get your JWT token (however you store it)
    const token = localStorage.getItem('authToken');
    
    if (!token) return;

    const newSocket = io('http://localhost:3000');
    
    newSocket.on('connect', () => {
      // Authenticate with your JWT token
      newSocket.emit('authenticate', { token });
    });

    newSocket.on('unread_count_update', (data) => {
      setUnreadCount(data.unreadCount);
    });

    newSocket.on('new_notification', (notification) => {
      // Show toast notification
      toast.success(notification.title);
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  return { unreadCount, socket };
}

// Component using the hook
function NotificationBell() {
  const { unreadCount } = useNotifications();
  
  return (
    <div className="notification-bell">
      🔔 
      {unreadCount > 0 && (
        <span className="badge">{unreadCount}</span>
      )}
    </div>
  );
}
```

### Vanilla JavaScript Integration

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
</head>
<body>
    <div id="notification-icon">
        🔔 <span id="unread-count">0</span>
    </div>

    <script>
        // Initialize notifications
        function initNotifications() {
            // Get your JWT token
            const token = localStorage.getItem('authToken');
            
            if (!token) {
                console.log('No auth token found');
                return;
            }

            const socket = io('http://localhost:3000');
            
            socket.on('connect', () => {
                socket.emit('authenticate', { token });
            });

            socket.on('unread_count_update', (data) => {
                document.getElementById('unread-count').textContent = data.unreadCount;
            });

            socket.on('new_notification', (notification) => {
                alert(`New notification: ${notification.title}`);
            });
        }

        // Start when page loads
        window.addEventListener('load', initNotifications);
    </script>
</body>
</html>
```

### Mobile App (React Native)

```javascript
// NotificationService.js
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

class NotificationService {
  async connect() {
    const token = await AsyncStorage.getItem('authToken');
    
    this.socket = io('http://your-server.com:3000');
    
    this.socket.on('connect', () => {
      this.socket.emit('authenticate', { token });
    });

    this.socket.on('unread_count_update', (data) => {
      // Update app badge
      this.updateAppBadge(data.unreadCount);
    });
  }

  updateAppBadge(count) {
    // Update app icon badge with unread count
    // Using react-native-notification-badge or similar
  }
}

export default new NotificationService();
```

## 🔑 Your JWT Token Structure

Your JWT token should contain at minimum:

```javascript
// When creating JWT in your login endpoint:
const payload = {
    userId: user.id,        // Required: unique user identifier
    role: user.role,        // Required: 'USER' or 'ADMIN'
    email: user.email,      // Optional but recommended
    name: user.name,        // Optional
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
};

const token = jwt.sign(payload, process.env.SECRET_CODE);

// Send this token to your frontend after successful login
res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
```

## 📊 What You Get

Once connected, your app automatically receives:

### 1. Current Unread Count
```javascript
socket.on('unread_count_update', (data) => {
    console.log(`You have ${data.unreadCount} unread notifications`);
    // Update your UI badge: 🔔 5
});
```

### 2. Real-time New Notifications
```javascript
socket.on('new_notification', (notification) => {
    console.log('New notification:', notification.title);
    // Show popup, play sound, etc.
});
```

### 3. Admin Features (if role is ADMIN)
```javascript
// Get all users' unread counts
socket.emit('get_all_unread_counts');

socket.on('all_unread_counts_update', (counts) => {
    // Display dashboard: "John: 3 unread", "Jane: 1 unread"
    console.log('All user counts:', counts);
});
```

## 🛠️ Testing Your Integration

### 1. Start the Server
```bash
npm run dev
```

### 2. Test with the Demo
Open `notification-demo.html` in your browser and test both authentication methods.

### 3. Create Test Notifications
```javascript
// Create a notification for testing
fetch('http://localhost:3000/api/notifications/test/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        userId: 'user123',
        title: 'Test Notification',
        message: 'This is a test',
        role: 'USER'
    })
});
```

## 🎯 Real-world Usage Scenarios

### E-commerce App
```javascript
// When user places order
await notificationService.createNotificationForAdmins(
    'New Order', 
    `Order #${orderId} placed by ${user.name}`
);

// When order status changes
await notificationService.createNotification(
    order.userId,
    'Order Updated',
    `Your order #${orderId} is now ${status}`
);
```

### Social Media App
```javascript
// When someone likes your post
await notificationService.createNotification(
    post.userId,
    'New Like',
    `${liker.name} liked your post`
);

// When you get a message
await notificationService.createNotification(
    recipientId,
    'New Message',
    `You have a new message from ${sender.name}`
);
```

### Admin Dashboard
```javascript
// Get overview of all users with unread notifications
socket.emit('get_all_unread_counts');

socket.on('all_unread_counts_update', (counts) => {
    // Display in admin panel:
    counts.forEach(user => {
        console.log(`${user.userName}: ${user.unreadCount} unread`);
    });
});
```

## 🔧 Troubleshooting

### "No auth token found"
- Make sure you're storing the JWT token after login
- Check localStorage, cookies, or wherever you store it

### "Invalid or expired token"
- Verify your JWT token is valid
- Check if token has expired
- Ensure SECRET_CODE matches between login and Socket.IO

### "User not found"
- The userId in your JWT token must exist in your database
- Check your user table

### Not receiving notifications
- Ensure you're authenticated first
- Check browser console for errors
- Verify server is running on correct port

## 🚀 Ready to Go!

That's it! Your notification system is ready. Users will automatically get:
- ✅ Real-time unread counts (like "🔔 5")
- ✅ Instant notification delivery
- ✅ Automatic updates when they read notifications
- ✅ Admin dashboard showing all user activity

The system handles everything automatically once you authenticate with your JWT token! 🎉
