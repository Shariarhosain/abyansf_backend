import express from 'express';
import subCategoryBookingController from '../controllers/subCategoryBookingController.js';
import verifyToken from '../middlewares/verifytoken.js';

const router = express.Router();

// All sub-category booking routes require a valid user token.
router.use(verifyToken);

// === User Routes ===
// Submit a new concierge request
router.post('/', subCategoryBookingController.createRequest);

// Get all requests made by the currently logged-in user
router.get('/my-requests', subCategoryBookingController.getUserRequests);
// Update the status of a request
router.put('/update/:id', subCategoryBookingController.updateRequestStatus);


// === Admin Routes ===
// Get all concierge requests (for admin dashboard)
router.get('/', subCategoryBookingController.getAllRequests);

// Get a specific request by its ID (admin can view any)
router.get('/:id', subCategoryBookingController.getRequestById);


// Delete a request
router.delete('/:id', subCategoryBookingController.deleteRequest);


router.get('/grouped/self', subCategoryBookingController.getAllBookingsGrouped);
router.get('/self/grouped-with-status-pagination', subCategoryBookingController.getAllBookingsWithStatusPagination);

router.get('/admin/all-users/grouped', subCategoryBookingController.getAllUsersBookingsGrouped);

router.get('/admin/all-users/grouped-with-status-pagination', subCategoryBookingController.getAllUsersBookingsWithStatusPagination);
export default router;