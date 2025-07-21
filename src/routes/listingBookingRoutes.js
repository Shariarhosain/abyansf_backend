import express from 'express';
import listingBookingController from '../controllers/listingBookingController.js';
import verifyToken from '../middlewares/verifytoken.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// User routes
router.post('/', listingBookingController.createBooking);
router.get('/my-bookings', listingBookingController.getUserBookings);
router.get('/:id', listingBookingController.getBookingById);
router.patch('/:id/cancel', listingBookingController.cancelBooking);

// Admin routes
router.get('/', listingBookingController.getAllBookings);
router.get('/user/:userId', listingBookingController.getBookingsByUserId);
router.put('/:id', listingBookingController.updateBookingStatus);
router.get('/admin/stats', listingBookingController.getBookingStats);

//delete booking
router.delete('/:id', listingBookingController.deleteBooking);

export default router;