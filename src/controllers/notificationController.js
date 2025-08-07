import notificationService from '../services/notificationService.js';
import AppError from '../utils/error.js';

const notificationController = {
  /**
   * Get notifications for the logged-in user.
   */
  async getUserNotifications(req, res, next) {
    try {
      const userId = req.user.userId; // Assuming user ID is stored in req.user after token verification
      const { page, limit } = req.query;
      const result = await notificationService.getUserNotifications(userId, { page, limit });
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all notifications (Admin only).
   */
  async getAllNotificationsForAdmin(req, res, next) {
    try {
        const { page, limit } = req.query;
        const result = await notificationService.getAllNotificationsForAdmin({ page, limit });
        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
  },

  /**
   * Mark a notification as read.
   */
  async markAsRead(req, res, next) {
    try {
      const userId = req.user.userId; // Assuming user ID is stored in req.user after token verification
      
      const notification = await notificationService.markAsRead(userId);
      
      // Optional: Check if the user has permission to mark this as read
      // For now, any authenticated user can mark any notification as read if they have the ID.
      // You might want to add a check: if (notification.userId !== req.user.id) ...

      res.status(200).json({
        success: true,
        message: 'Notification marked as read.',
        data: notification,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Mark a specific notification as read by notification ID.
   */
  async markSpecificNotificationAsRead(req, res, next) {
    try {
      const userId = req.user.userId;
      const { notificationId } = req.params;
      
      const notification = await notificationService.markSpecificNotificationAsRead(notificationId, userId);

      res.status(200).json({
        success: true,
        message: 'Notification marked as read.',
        data: notification,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get unread notification count for the logged-in user.
   */
  async getUnreadCount(req, res, next) {
    try {
      const userId = req.user.userId;
      const result = await notificationService.getUnreadCount(userId);
      
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get unread notification counts for multiple users (Admin only).
   */
  async getUnreadCountsForUsers(req, res, next) {
    try {
      // Check if user is admin
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin role required.',
        });
      }

      const { userIds } = req.body; // Array of user IDs, optional
      const result = await notificationService.getUnreadCountsForUsers(userIds);
      
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get unread notification counts for all admin users (Super Admin only).
   */
  async getUnreadCountsForAdmins(req, res, next) {
    try {
      // Check if user is admin
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin role required.',
        });
      }

      const result = await notificationService.getUnreadCountsForAdmins();
      
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Test endpoint to create a notification (for testing purposes).
   */
  async createTestNotification(req, res, next) {
    try {
      const { userId, title, message, role } = req.body;
      
      if (!userId || !title || !message) {
        return res.status(400).json({
          success: false,
          message: 'userId, title, and message are required',
        });
      }

      const notification = await notificationService.createNotification(userId, title, message, role);
      
      res.status(201).json({
        success: true,
        message: 'Test notification created successfully',
        data: notification,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Test endpoint to create notifications for all admins (for testing purposes).
   */
  async createTestNotificationForAdmins(req, res, next) {
    try {
      const { title, message } = req.body;
      
      if (!title || !message) {
        return res.status(400).json({
          success: false,
          message: 'title and message are required',
        });
      }

      const notifications = await notificationService.createNotificationForAdmins(title, message);
      
      res.status(201).json({
        success: true,
        message: 'Test notifications created for all admins',
        data: notifications,
      });
    } catch (error) {
      next(error);
    }
  },
};

export default notificationController;
