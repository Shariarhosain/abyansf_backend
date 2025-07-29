import express from 'express';
import eventController from '../controllers/eventController.js';
import { upload } from '../utils/multer.js';
import verifyToken from '../middlewares/verifytoken.js';

const router = express.Router();




// Protected Routes - All routes below this line are protected
router.use(verifyToken);

// Public routes
router.get('/upcoming', eventController.getUpcomingEvents);
router.get('/past', eventController.getPastEvents);
router.get('/:id', eventController.getEventById);
router.get('/', eventController.getAllEvents);

// Admin routes
router.post('/', upload, eventController.createEvent);
router.put('/:id', upload, eventController.updateEvent);
router.delete('/:id', eventController.deleteEvent);

//delete bookings
router.delete('/booking/:bookingId', eventController.deleteEventBooking);

// User routes
router.post('/book', eventController.bookEvent);
router.put('/update/:bookingId', eventController.updateEventBooking);
router.get('/history/me', eventController.getUserEventHistory);
router.get('/history/me/past', eventController.getUserPastEvents);
router.get('/history/me/upcoming', eventController.getUserUpcomingEvents);
router.get('/history/me/cancelled', eventController.getUserCancelledEvents);




export default router;