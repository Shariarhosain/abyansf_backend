import notificationService from '../services/notificationService.js';

class SocketHandler {
  constructor(io) {
    this.io = io;
    this.userSockets = new Map(); // userId -> Set of socket IDs
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Socket connected: ${socket.id}`);

      // Handle user authentication and room joining
      socket.on('authenticate', async (data) => {
        try {
          const { userId, role } = data;
          
          if (!userId) {
            socket.emit('error', { message: 'User ID is required for authentication' });
            return;
          }

          // Store user-socket mapping
          if (!this.userSockets.has(userId)) {
            this.userSockets.set(userId, new Set());
          }
          this.userSockets.get(userId).add(socket.id);

          // Join user-specific room
          socket.join(`user_${userId}`);
          
          // Join role-specific room
          if (role === 'ADMIN') {
            socket.join('admins');
          } else {
            socket.join('users');
          }

          // Store user info in socket
          socket.userId = userId;
          socket.userRole = role;

          // Send current unread count
          const unreadCount = await notificationService.getUnreadCount(userId);
          socket.emit('unread_count_update', unreadCount);

          console.log(`User ${userId} authenticated and joined rooms`);
        } catch (error) {
          console.error('Authentication error:', error);
          socket.emit('error', { message: 'Authentication failed' });
        }
      });

      // Handle request for unread count
      socket.on('get_unread_count', async () => {
        try {
          if (!socket.userId) {
            socket.emit('error', { message: 'User not authenticated' });
            return;
          }

          const unreadCount = await notificationService.getUnreadCount(socket.userId);
          socket.emit('unread_count_update', unreadCount);
        } catch (error) {
          console.error('Get unread count error:', error);
          socket.emit('error', { message: 'Failed to get unread count' });
        }
      });

      // Handle admin request for all user unread counts
      socket.on('get_all_unread_counts', async () => {
        try {
          if (!socket.userId || socket.userRole !== 'ADMIN') {
            socket.emit('error', { message: 'Admin access required' });
            return;
          }

          const allUnreadCounts = await notificationService.getUnreadCountsForUsers();
          socket.emit('all_unread_counts_update', allUnreadCounts);
        } catch (error) {
          console.error('Get all unread counts error:', error);
          socket.emit('error', { message: 'Failed to get all unread counts' });
        }
      });

      // Handle mark as read
      socket.on('mark_notification_read', async (data) => {
        try {
          if (!socket.userId) {
            socket.emit('error', { message: 'User not authenticated' });
            return;
          }

          const { notificationId } = data;
          
          if (notificationId) {
            // Mark specific notification as read
            await notificationService.markSpecificNotificationAsRead(notificationId, socket.userId);
          } else {
            // Mark all notifications as read
            await notificationService.markAsRead(socket.userId);
          }

          // Send updated unread count
          const unreadCount = await notificationService.getUnreadCount(socket.userId);
          socket.emit('unread_count_update', unreadCount);

          // Notify admins about updated counts if this is a user
          if (socket.userRole !== 'ADMIN') {
            this.notifyAdminsAboutUnreadCountChange();
          }

        } catch (error) {
          console.error('Mark as read error:', error);
          socket.emit('error', { message: 'Failed to mark notification as read' });
        }
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
        
        if (socket.userId) {
          const userSockets = this.userSockets.get(socket.userId);
          if (userSockets) {
            userSockets.delete(socket.id);
            if (userSockets.size === 0) {
              this.userSockets.delete(socket.userId);
            }
          }
        }
      });
    });
  }

  // Method to send notification to specific user
  async sendNotificationToUser(userId, notification) {
    try {
      // Send to user's room
      this.io.to(`user_${userId}`).emit('new_notification', notification);
      
      // Send updated unread count
      const unreadCount = await notificationService.getUnreadCount(userId);
      this.io.to(`user_${userId}`).emit('unread_count_update', unreadCount);
      
      console.log(`Notification sent to user ${userId}`);
    } catch (error) {
      console.error('Error sending notification to user:', error);
    }
  }

  // Method to send notification to all admins
  async sendNotificationToAdmins(notification) {
    try {
      // Send to admins room
      this.io.to('admins').emit('new_notification', notification);
      
      // Send updated unread counts for all admins
      const adminUnreadCounts = await notificationService.getUnreadCountsForAdmins();
      this.io.to('admins').emit('admin_unread_counts_update', adminUnreadCounts);
      
      console.log('Notification sent to all admins');
    } catch (error) {
      console.error('Error sending notification to admins:', error);
    }
  }

  // Method to notify admins about unread count changes
  async notifyAdminsAboutUnreadCountChange() {
    try {
      const allUnreadCounts = await notificationService.getUnreadCountsForUsers();
      this.io.to('admins').emit('all_unread_counts_update', allUnreadCounts);
    } catch (error) {
      console.error('Error notifying admins about unread count change:', error);
    }
  }

  // Method to send unread count update to specific user
  async sendUnreadCountUpdate(userId) {
    try {
      const unreadCount = await notificationService.getUnreadCount(userId);
      this.io.to(`user_${userId}`).emit('unread_count_update', unreadCount);
    } catch (error) {
      console.error('Error sending unread count update:', error);
    }
  }

  // Method to broadcast unread count updates to all users
  async broadcastUnreadCountUpdates() {
    try {
      for (const userId of this.userSockets.keys()) {
        await this.sendUnreadCountUpdate(userId);
      }
    } catch (error) {
      console.error('Error broadcasting unread count updates:', error);
    }
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.userSockets.size;
  }

  // Get connected users
  getConnectedUsers() {
    return Array.from(this.userSockets.keys());
  }

  // Check if user is online
  isUserOnline(userId) {
    return this.userSockets.has(userId);
  }
}

export default SocketHandler;
