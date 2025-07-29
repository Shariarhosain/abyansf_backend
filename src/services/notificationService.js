import { PrismaClient } from '@prisma/client';
import AppError from '../utils/error.js';

const prisma = new PrismaClient();

const notificationService = {
  /**
   * Creates a notification for a user.
   * @param {String} userId - The ID of the user to notify.
   * @param {String} title - The title of the notification.
   * @param {String} message - The message content of the notification.
   * @returns {Promise<Object>} The created notification.
   */
  async createNotification(userId, title, message) {
    try {
      if (!userId || !title || !message) {
        throw new AppError('User ID, title, and message are required to create a notification.', 400);
      }

      const notification = await prisma.notification.create({
        data: {
          userId,
          title,
          message,
        },
      });

      // In a real-world app, you would also push this to a real-time service (e.g., WebSockets, FCM)
      console.log(`Notification created for user ${userId}: ${title}`);

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

      for (const admin of admins) {
        await this.createNotification(admin.id, title, message);
      }
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
  async markAsRead(notificationId) {
    try {
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
      });

      if (!notification) {
        throw new AppError('Notification not found', 404);
      }

      return await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });
    } catch (error) {
      throw new AppError(`Failed to mark notification as read: ${error.message}`, 500);
    }
  },
};

export default notificationService;
