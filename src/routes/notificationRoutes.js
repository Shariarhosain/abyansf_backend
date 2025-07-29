import express from 'express';
import notificationController from '../controllers/notificationController.js';
import verifyToken from '../middlewares/verifytoken.js';

const router = express.Router();

router.use(verifyToken); // Middleware to verify token for protected routes

// Get notifications for the logged-in user
router.get('/', notificationController.getUserNotifications);

// Get all notifications (Admin only)
router.get('/admin', notificationController.getAllNotificationsForAdmin);

// Mark a notification as read
router.patch('/:notificationId/read', notificationController.markAsRead);

export default router;
