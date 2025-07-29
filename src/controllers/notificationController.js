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
      const { notificationId } = req.params;
      const notification = await notificationService.markAsRead(notificationId);
      
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
};

export default notificationController;
