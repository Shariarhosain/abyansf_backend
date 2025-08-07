import notificationService from '../services/notificationService.js';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
          const { token, userId, role } = data;
          let authenticatedUserId = userId;
          let authenticatedRole = role;

          // Method 1: If token is provided, validate it and extract user info
          if (token) {
            try {
              // Handle demo tokens for testing
              if (token.startsWith('demo.')) {
                const mockPayload = JSON.parse(atob(token.split('.')[1]));
                authenticatedUserId = mockPayload.userId;
                authenticatedRole = mockPayload.role;
                console.log(`Demo token authentication: ${authenticatedUserId} - Role: ${authenticatedRole}`);
              } else {
                // Real JWT token validation
                const decoded = jwt.verify(token, process.env.SECRET_CODE);
                authenticatedUserId = decoded.userId || decoded.id;
                
                // Get user details from database to get the role
                const user = await prisma.user.findUnique({
                  where: { id: authenticatedUserId },
                  select: { id: true, role: true, name: true, email: true }
                });

                if (!user) {
                  socket.emit('error', { message: 'User not found' });
                  return;
                }

                authenticatedRole = user.role;
                console.log(`User authenticated via JWT: ${user.name} (${user.email}) - Role: ${user.role}`);
              }
            } catch (jwtError) {
              socket.emit('error', { message: 'Invalid or expired token' });
              return;
            }
          }
          // Method 2: Direct userId and role (for testing or if you have other auth methods)
          else if (userId && role) {
            // For demo/testing purposes, allow any userId without database validation
            if (userId.startsWith('demo') || userId.startsWith('test') || userId.startsWith('user')) {
              authenticatedUserId = userId;
              authenticatedRole = role;
              console.log(`Demo user authentication: ${userId} - Role: ${role}`);
            } else {
              // Verify user exists in database for real users
              const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, role: true, name: true, email: true }
              });

              if (!user) {
                socket.emit('error', { message: 'User not found in database. For testing, try a userId starting with "demo", "test", or "user"' });
                return;
              }

              // Verify the role matches
              if (user.role !== role) {
                socket.emit('error', { message: 'Role mismatch' });
                return;
              }

              authenticatedUserId = userId;
              authenticatedRole = role;
              
              console.log(`User authenticated via direct credentials: ${user.name} (${user.email}) - Role: ${user.role}`);
            }
          }
          else {
            socket.emit('error', { message: 'Token or userId/role is required for authentication' });
            return;
          }

          if (!authenticatedUserId) {
            socket.emit('error', { message: 'User ID is required for authentication' });
            return;
          }

          // Store user-socket mapping
          if (!this.userSockets.has(authenticatedUserId)) {
            this.userSockets.set(authenticatedUserId, new Set());
          }
          this.userSockets.get(authenticatedUserId).add(socket.id);

          // Join user-specific room
          socket.join(`user_${authenticatedUserId}`);
          
          // Join role-specific room
          if (authenticatedRole === 'ADMIN') {
            socket.join('admins');
          } else {
            socket.join('users');
          }

          // Store user info in socket
          socket.userId = authenticatedUserId;
          socket.userRole = authenticatedRole;

          // Send current unread count
          const unreadCount = await notificationService.getUnreadCount(authenticatedUserId);
          socket.emit('unread_count_update', unreadCount);

          // Send success authentication response
          socket.emit('authenticated', { 
            userId: authenticatedUserId, 
            role: authenticatedRole,
            message: 'Successfully authenticated'
          });

          console.log(`User ${authenticatedUserId} authenticated and joined rooms`);
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
