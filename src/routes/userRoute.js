import express from 'express';
import userController from '../controllers/userController.js';
import { upload } from '../utils/multer.js';
import verifyToken from '../middlewares/verifytoken.js';


const router = express.Router();

// Public routes
router.post('/register', userController.registerUser);
router.post('/verify-email', userController.verifyEmail);
router.put('/reset-password', userController.resetPassword);
router.post('/resend-verification-email', userController.resendVerificationEmail);
router.post('/login', userController.loginUser);
router.get('/admin/whatsapp-number', userController.adminWhatsAppNumber);

// Middleware to verify token for protected routes
router.use(verifyToken);
// User routes
router.get('/search/:id', userController.getUserById);
router.get('/', userController.getAllUsers);
router.put('/:id', upload, userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.get('/self', userController.getUserUid); // Assuming you want to get the current user based on token
//router.get('/:userId/logs', userController.getUserLogs);

// Admin routes
router.get('/', userController.getAllUsers);
router.post('/:userId/send-payment-link', userController.sendPaymentLink);
router.post('/:userId/confirm-payment', userController.confirmPayment);
router.get('/admin/dashboard-stats', userController.getDashboardStats);



 export default router;