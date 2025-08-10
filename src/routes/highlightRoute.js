import express from 'express';
import highlightController from '../controllers/highlightController.js';
import verifyToken from '../middlewares/verifytoken.js';

const router = express.Router();

// Protected routes (require authentication)
router.use(verifyToken);

// ============ HIGHLIGHT ROUTES ============

// Get all highlights with filtering and pagination
router.get('/', highlightController.getAllHighlights);

// Get highlights by type (SUBCATEGORY, MINI_CATEGORY, LISTING)
router.get('/type/:type', highlightController.getHighlightsByType);

// Get highlight by ID
router.get('/:id', highlightController.getHighlightById);

// Create new highlight
router.post('/', highlightController.createHighlight);

// Update highlight
router.put('/:id', highlightController.updateHighlight);

// Toggle highlight active status
router.patch('/:id/toggle-status', highlightController.toggleHighlightStatus);

// Delete highlight
router.delete('/:id', highlightController.deleteHighlight);

export default router;
