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

// Test endpoints (remove in production) - These don't require auth for easier testing
router.post('/test/create', (req, res, next) => {
    // Temporarily bypass auth for test endpoints
    req.user = { userId: req.body.userId || 'test-user', role: req.body.role || 'USER' };
    next();
}, notificationController.createTestNotification);

router.post('/test/create-for-admins', (req, res, next) => {
    // Temporarily bypass auth for test endpoints
    req.user = { userId: 'test-admin', role: 'ADMIN' };
    next();
}, notificationController.createTestNotificationForAdmins);

export default router;
