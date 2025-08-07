# Real-time Notification System API Documentation

## Overview
This notification system provides REST APIs and real-time Socket.IO integration for managing notifications with unread counts for specific users and admins.

## Features
- ✅ Create notifications for specific users
- ✅ Create notifications for all admin users
- ✅ Get unread notification counts for individual users
- ✅ Get unread notification counts for multiple users (Admin only)
- ✅ Get unread notification counts for all admin users
- ✅ Mark notifications as read (all or specific)
- ✅ Real-time notification delivery via Socket.IO
- ✅ Real-time unread count updates
- ✅ User-specific and role-based notification filtering

## REST API Endpoints

### Authentication Required
All endpoints require authentication. Include your JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### 1. Get User Notifications
```
GET /api/notifications/user?page=1&limit=10
```
Get paginated notifications for the authenticated user.

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

### 2. Get All Notifications (Admin Only)
```
GET /api/notifications/admin?page=1&limit=10
```
Get all notifications across all users (Admin access required).

### 3. Get Unread Count for Current User
```
GET /api/notifications/unread-count
```
Get the unread notification count for the authenticated user.

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user123",
    "unreadCount": 5,
    "role": "USER"
  }
}
```

### 4. Get Unread Counts for Multiple Users (Admin Only)
```
POST /api/notifications/unread-counts/users
Content-Type: application/json

{
  "userIds": ["user1", "user2", "user3"] // Optional, if not provided, returns all users with unread notifications
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "userId": "user1",
      "userName": "John Doe",
      "userEmail": "john@example.com",
      "userRole": "USER",
      "unreadCount": 3
    },
    {
      "userId": "user2",
      "userName": "Jane Smith",
      "userEmail": "jane@example.com",
      "userRole": "USER",
      "unreadCount": 1
    }
  ]
}
```

### 5. Get Unread Counts for All Admins (Admin Only)
```
GET /api/notifications/unread-counts/admins
```
Get unread notification counts for all admin users.

### 6. Mark All Notifications as Read
```
PUT /api/notifications/read
```
Mark all notifications as read for the authenticated user.

### 7. Mark Specific Notification as Read
```
PUT /api/notifications/read/:notificationId
```
Mark a specific notification as read.

### 8. Test Endpoints (Remove in Production)
```
POST /api/notifications/test/create
Content-Type: application/json

{
  "userId": "user123",
  "title": "Test Notification",
  "message": "This is a test message",
  "role": "USER"
}
```

```
POST /api/notifications/test/create-for-admins
Content-Type: application/json

{
  "title": "Admin Notification",
  "message": "This is an admin message"
}
```

## Socket.IO Real-time Events

### Client-side Connection
```javascript
const socket = io('http://localhost:3000');
```

### Authentication
After connecting, authenticate the user:
```javascript
socket.emit('authenticate', {
  userId: 'user123',
  role: 'USER' // or 'ADMIN'
});
```

### Client Events (Emit to Server)

#### 1. authenticate
```javascript
socket.emit('authenticate', {
  userId: 'user123',
  role: 'USER'
});
```

#### 2. get_unread_count
```javascript
socket.emit('get_unread_count');
```

#### 3. get_all_unread_counts (Admin only)
```javascript
socket.emit('get_all_unread_counts');
```

#### 4. mark_notification_read
```javascript
// Mark all as read
socket.emit('mark_notification_read', {});

// Mark specific notification as read
socket.emit('mark_notification_read', {
  notificationId: 'notification123'
});
```

### Server Events (Listen from Server)

#### 1. unread_count_update
```javascript
socket.on('unread_count_update', (data) => {
  console.log('Unread count:', data.unreadCount);
  // Update UI with new unread count
});
```

#### 2. new_notification
```javascript
socket.on('new_notification', (notification) => {
  console.log('New notification:', notification);
  // Display notification to user
  // Update unread count
});
```

#### 3. all_unread_counts_update (Admin only)
```javascript
socket.on('all_unread_counts_update', (counts) => {
  console.log('All user counts:', counts);
  // Update admin dashboard with all user counts
});
```

#### 4. admin_unread_counts_update (Admin only)
```javascript
socket.on('admin_unread_counts_update', (counts) => {
  console.log('Admin counts:', counts);
  // Update admin counts display
});
```

#### 5. error
```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error.message);
});
```

## Usage Examples

### Frontend JavaScript Integration

#### Basic Setup
```javascript
class NotificationManager {
  constructor(userId, userRole) {
    this.socket = io('http://localhost:3000');
    this.userId = userId;
    this.userRole = userRole;
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.socket.on('connect', () => {
      this.authenticate();
    });

    this.socket.on('unread_count_update', (data) => {
      this.updateUnreadCountUI(data.unreadCount);
    });

    this.socket.on('new_notification', (notification) => {
      this.showNotificationPopup(notification);
      this.refreshUnreadCount();
    });
  }

  authenticate() {
    this.socket.emit('authenticate', {
      userId: this.userId,
      role: this.userRole
    });
  }

  refreshUnreadCount() {
    this.socket.emit('get_unread_count');
  }

  markAllAsRead() {
    this.socket.emit('mark_notification_read', {});
  }

  markAsRead(notificationId) {
    this.socket.emit('mark_notification_read', {
      notificationId: notificationId
    });
  }

  updateUnreadCountUI(count) {
    // Update your UI element
    document.getElementById('unread-count').textContent = count;
    const badge = document.getElementById('notification-badge');
    badge.style.display = count > 0 ? 'inline' : 'none';
  }

  showNotificationPopup(notification) {
    // Create and show notification popup
    const popup = document.createElement('div');
    popup.className = 'notification-popup';
    popup.innerHTML = `
      <h4>${notification.title}</h4>
      <p>${notification.message}</p>
    `;
    document.body.appendChild(popup);
    
    // Auto-remove after 5 seconds
    setTimeout(() => popup.remove(), 5000);
  }
}

// Initialize
const notificationManager = new NotificationManager('user123', 'USER');
```

#### Admin Dashboard Example
```javascript
class AdminDashboard {
  constructor() {
    this.socket = io('http://localhost:3000');
    this.setupAdminEvents();
  }

  setupAdminEvents() {
    this.socket.on('connect', () => {
      this.socket.emit('authenticate', {
        userId: 'admin123',
        role: 'ADMIN'
      });
    });

    this.socket.on('all_unread_counts_update', (counts) => {
      this.updateUserCountsTable(counts);
    });
  }

  getAllUserCounts() {
    this.socket.emit('get_all_unread_counts');
  }

  updateUserCountsTable(counts) {
    const tableBody = document.getElementById('user-counts-table');
    tableBody.innerHTML = '';
    
    counts.forEach(userCount => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${userCount.userName}</td>
        <td>${userCount.userEmail}</td>
        <td>${userCount.userRole}</td>
        <td>${userCount.unreadCount}</td>
      `;
      tableBody.appendChild(row);
    });
  }
}
```

### React Hook Example
```javascript
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

export const useNotifications = (userId, userRole) => {
  const [socket, setSocket] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    
    newSocket.on('connect', () => {
      newSocket.emit('authenticate', { userId, role: userRole });
    });

    newSocket.on('unread_count_update', (data) => {
      setUnreadCount(data.unreadCount);
    });

    newSocket.on('new_notification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, [userId, userRole]);

  const markAllAsRead = () => {
    if (socket) {
      socket.emit('mark_notification_read', {});
    }
  };

  const markAsRead = (notificationId) => {
    if (socket) {
      socket.emit('mark_notification_read', { notificationId });
    }
  };

  return {
    unreadCount,
    notifications,
    markAllAsRead,
    markAsRead,
    refreshCount: () => socket?.emit('get_unread_count')
  };
};
```

## Security Considerations

1. **Authentication**: All Socket.IO connections should be authenticated
2. **Role-based Access**: Admin-only endpoints are protected
3. **User Isolation**: Users can only see their own notifications
4. **Rate Limiting**: Consider implementing rate limiting for notification creation
5. **Input Validation**: All inputs are validated on the server side

## Database Schema

The notification system uses the following Prisma schema:

```prisma
model Notification {
  id        String   @id @default(cuid())
  userId    String
  title     String
  message   String
  isRead    Boolean  @default(false)
  role      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([isRead])
  @@index([createdAt])
}
```

## Testing

Use the provided `notification-demo.html` file to test the notification system:

1. Open the HTML file in a browser
2. Enter a User ID and select role
3. Click "Connect & Authenticate"
4. Test creating notifications and see real-time updates

## Production Deployment Notes

1. Remove test endpoints before deploying to production
2. Configure CORS properly for your domain
3. Set up proper SSL/TLS for WebSocket connections
4. Consider using Redis for scaling Socket.IO across multiple servers
5. Implement proper logging and monitoring
6. Set up database indexes for optimal performance

## Error Handling

All API endpoints return standardized error responses:

```json
{
  "success": false,
  "message": "Error description",
  "status": "error"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error
