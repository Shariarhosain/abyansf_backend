import express from 'express';
import notificationController from '../controllers/notificationController.js';
import verifyToken from '../middlewares/verifytoken.js';

const router = express.Router();

router.use(verifyToken); // Middleware to verify token for protected routes

// Get notifications for the logged-in user
router.get('/user', notificationController.getUserNotifications);

// Get all notifications (Admin only)
router.get('/admin', notificationController.getAllNotificationsForAdmin);

// Get unread notification count for the logged-in user
router.get('/unread-count', notificationController.getUnreadCount);

// Get unread notification counts for multiple users (Admin only)
router.post('/unread-counts/users', notificationController.getUnreadCountsForUsers);

// Get unread notification counts for all admin users (Admin only)
router.get('/unread-counts/admins', notificationController.getUnreadCountsForAdmins);

// Mark all notifications as read for the logged-in user
router.put('/read', notificationController.markAsRead);

// Mark a specific notification as read by notification ID
router.put('/read/:notificationId', notificationController.markSpecificNotificationAsRead);

// Test endpoints (remove in production)
router.post('/test/create', notificationController.createTestNotification);
router.post('/test/create-for-admins', notificationController.createTestNotificationForAdmins);

export default router;
