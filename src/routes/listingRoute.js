import express from 'express';
import listingController from '../controllers/listingController.js';
import { uploadImages } from '../utils/multer.js';
import verifyToken from '../middlewares/verifytoken.js';

const router = express.Router();
// Protected routes (require authentication)
router.use(verifyToken);
// Public routes
router.get('/', listingController.getAllListings);
router.get('/:id', listingController.getListingById);
router.post('/search', listingController.searchListings);



// Admin/User routes for creating and managing listings
router.post('/', uploadImages, listingController.createListing);
router.put('/:id', uploadImages, listingController.updateListing);
router.delete('/:id', listingController.deleteListing);
router.post('/delete-image', listingController.deleteListingImage);

export default router;