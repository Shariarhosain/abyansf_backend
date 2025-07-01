import express from 'express';
import userController from '../controllers/userController.js';

const router = express.Router();

// Public routes
router.post('/register', userController.registerUser);
router.post('/verify-email', userController.verifyEmail);
router.put('/reset-password', userController.resetPassword);

// User routes
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
//router.get('/:userId/logs', userController.getUserLogs);

// Admin routes
router.get('/', userController.getAllUsers);
router.post('/:userId/send-payment-link', userController.sendPaymentLink);
router.post('/:userId/confirm-payment', userController.confirmPayment);
//router.get('/admin/dashboard-stats', userController.getDashboardStats);
// Resend verification email
router.post('/resend-verification-email', userController.resendVerificationEmail);

export default router;