import { PrismaClient } from '@prisma/client';
import AppError from '../utils/error.js';

const prisma = new PrismaClient();

// Socket handler will be injected from app.js
let socketHandler = null;

const notificationService = {
  // Method to set socket handler
  setSocketHandler(handler) {
    socketHandler = handler;
  },

  /**
   * Creates a notification for a user.
   * @param {String} userId - The ID of the user to notify.
   * @param {String} title - The title of the notification.
   * @param {String} message - The message content of the notification.
   * @returns {Promise<Object>} The created notification.
   */
  async createNotification(userId, title, message, role = 'USER') {
    try {
      if (!userId || !title || !message) {
        throw new AppError('User ID, title, and message are required to create a notification.', 400);
      }

      const notification = await prisma.notification.create({
        data: {
          userId,
          role,
          title,
          message,
        },
      });

      // In a real-world app, you would also push this to a real-time service (e.g., WebSockets, FCM)
      console.log(`Notification created for user ${userId}: ${title}`);

      // Send real-time notification via Socket.IO
      if (socketHandler) {
        await socketHandler.sendNotificationToUser(userId, notification);
      }

      return notification;
    } catch (error) {
      // Log the error but don't prevent the primary operation from completing
      console.error(`Failed to create notification: ${error.message}`);
    }
  },

  /**
   * Creates a notification for all admin users.
   * @param {String} title - The title of the notification.
   * @param {String} message - The message content of the notification.
   * @returns {Promise<void>}
   */
  async createNotificationForAdmins(title, message) {
    try {
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
      });
      if (admins.length === 0) {
        console.warn('No admin users found to send notification.');
        return [];
      }

      const notifications = [];
      for (const admin of admins) {
        const notification = await this.createNotification(admin.id, title, message, 'ADMIN');
        notifications.push(notification);
      }

      // Send real-time notification to all admins via Socket.IO
      if (socketHandler && notifications.length > 0) {
        await socketHandler.sendNotificationToAdmins(notifications[0]); // Send one notification as sample
      }

      return notifications;
    } catch (error) {
      console.error(`Failed to create notification for admins: ${error.message}`);
    }
  },

  /**
   * Retrieves notifications for a specific user.
   * @param {String} userId - The ID of the user.
   * @param {Object} options - Pagination options { page, limit }.
   * @returns {Promise<Object>} A list of notifications and pagination details.
   */
  async getUserNotifications(userId, { page = 1, limit = 10 }) {
    try {
      const skip = (page - 1) * limit;
      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where: { userId },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.notification.count({ where: { userId } }),
      ]);

      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new AppError(`Failed to retrieve notifications: ${error.message}`, 500);
    }
  },

  /**
   * Retrieves all notifications for admin users.
   * @param {Object} options - Pagination options { page, limit }.
   * @returns {Promise<Object>} A list of all notifications and pagination details.
   */
  async getAllNotificationsForAdmin({ page = 1, limit = 10 }) {
    try {
        const skip = (page - 1) * limit;
        const [notifications, total] = await Promise.all([
            prisma.notification.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        }
                    }
                }
            }),
            prisma.notification.count(),
        ]);

        return {
            notifications,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    } catch (error) {
        throw new AppError(`Failed to retrieve all notifications: ${error.message}`, 500);
    }
  },

  /**
   * Marks a notification as read.
   * @param {String} notificationId - The ID of the notification to mark as read.
   * @returns {Promise<Object>} The updated notification.
   */
  async markAsRead(userId) {
    try {
      
      //find user role 
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // If the user  role is user mark all notifications as read his notifications
      if (user.role === 'USER') {
        return await prisma.notification.updateMany({
          where: { userId, isRead: false, role: 'USER' },
          data: { isRead: true },
        });
      }
      // If the user is admin mark all notifications as read
      if (user.role === 'ADMIN') {
        return await prisma.notification.updateMany({
          where: { userId, isRead: false, role: 'ADMIN' },
          data: { isRead: true },
        });
      }

      return await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });
    } catch (error) {
      throw new AppError(`Failed to mark notification as read: ${error.message}`, 500);
    }
  },

  /**
   * Gets the unread notification count for a specific user.
   * @param {String} userId - The ID of the user.
   * @returns {Promise<Object>} Object containing unread count.
   */
  async getUnreadCount(userId) {
    try {
      if (!userId) {
        throw new AppError('User ID is required', 400);
      }

      let userRole = 'USER'; // Default role for demo users

      // For demo/test users, skip database user lookup
      if (userId.startsWith('demo') || userId.startsWith('test') || userId.startsWith('user')) {
        console.log(`Demo user ${userId} - returning demo unread count`);
        
        // Get actual notifications if any exist for this demo user
        const unreadCount = await prisma.notification.count({
          where: {
            userId,
            isRead: false
          }
        });

        return {
          userId,
          unreadCount,
          role: userRole
        };
      }

      // Get user role to determine which notifications to count
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      userRole = user.role;

      let whereCondition = {
        userId,
        isRead: false
      };

      // Add role filter based on user role
      if (user.role === 'USER') {
        whereCondition.role = 'USER';
      } else if (user.role === 'ADMIN') {
        whereCondition.role = 'ADMIN';
      }

      const unreadCount = await prisma.notification.count({
        where: whereCondition
      });

      return {
        userId,
        unreadCount,
        role: user.role
      };
    } catch (error) {
      throw new AppError(`Failed to get unread count: ${error.message}`, 500);
    }
  },

  /**
   * Gets unread notification counts for multiple users (Admin only).
   * @param {Array} userIds - Array of user IDs to get counts for.
   * @returns {Promise<Array>} Array of objects containing userId and unread count.
   */
  async getUnreadCountsForUsers(userIds = []) {
    try {
      if (!Array.isArray(userIds) || userIds.length === 0) {
        // If no specific users requested, get counts for all users with unread notifications
        const usersWithUnread = await prisma.notification.groupBy({
          by: ['userId'],
          where: { isRead: false },
          _count: { id: true },
        });

        // Get user details for the response
        const userDetails = await prisma.user.findMany({
          where: { id: { in: usersWithUnread.map(u => u.userId) } },
          select: { id: true, name: true, email: true, role: true }
        });

        return usersWithUnread.map(userUnread => {
          const user = userDetails.find(u => u.id === userUnread.userId);
          return {
            userId: userUnread.userId,
            userName: user?.name || 'Unknown',
            userEmail: user?.email || 'Unknown',
            userRole: user?.role || 'USER',
            unreadCount: userUnread._count.id
          };
        });
      }

      // Get counts for specific users
      const results = await Promise.all(
        userIds.map(async (userId) => {
          try {
            const result = await this.getUnreadCount(userId);
            const user = await prisma.user.findUnique({
              where: { id: userId },
              select: { name: true, email: true, role: true }
            });
            return {
              ...result,
              userName: user?.name || 'Unknown',
              userEmail: user?.email || 'Unknown'
            };
          } catch (error) {
            return {
              userId,
              unreadCount: 0,
              error: error.message
            };
          }
        })
      );

      return results;
    } catch (error) {
      throw new AppError(`Failed to get unread counts for users: ${error.message}`, 500);
    }
  },

  /**
   * Gets unread notification counts for all admin users.
   * @returns {Promise<Array>} Array of objects containing admin userId and unread count.
   */
  async getUnreadCountsForAdmins() {
    try {
      const adminUsers = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true, name: true, email: true }
      });

      const adminIds = adminUsers.map(admin => admin.id);
      
      if (adminIds.length === 0) {
        return [];
      }

      const unreadCounts = await Promise.all(
        adminIds.map(async (adminId) => {
          const count = await prisma.notification.count({
            where: {
              userId: adminId,
              role: 'ADMIN',
              isRead: false
            }
          });

          const admin = adminUsers.find(a => a.id === adminId);
          return {
            userId: adminId,
            userName: admin.name || 'Unknown',
            userEmail: admin.email || 'Unknown',
            userRole: 'ADMIN',
            unreadCount: count
          };
        })
      );

      return unreadCounts.filter(admin => admin.unreadCount > 0);
    } catch (error) {
      throw new AppError(`Failed to get unread counts for admins: ${error.message}`, 500);
    }
  },

  /**
   * Marks a specific notification as read by notification ID.
   * @param {String} notificationId - The ID of the notification to mark as read.
   * @param {String} userId - The ID of the user (for authorization).
   * @returns {Promise<Object>} The updated notification.
   */
  async markSpecificNotificationAsRead(notificationId, userId) {
    try {
      if (!notificationId || !userId) {
        throw new AppError('Notification ID and User ID are required', 400);
      }

      // Check if notification exists and belongs to user
      const notification = await prisma.notification.findFirst({
        where: {
          id: notificationId,
          userId: userId
        }
      });

      if (!notification) {
        throw new AppError('Notification not found or does not belong to this user', 404);
      }

      const updatedNotification = await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });

      return updatedNotification;
    } catch (error) {
      throw new AppError(`Failed to mark notification as read: ${error.message}`, 500);
    }
  },
};

export default notificationService;
