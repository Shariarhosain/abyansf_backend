import express from 'express';
import { upload } from '../utils/multer.js';
import categoryController from '../controllers/categoryController.js';
import verifyToken from '../middlewares/verifytoken.js';

const router = express.Router();

// Protected routes (require authentication)
router.use(verifyToken);

// ============ UTILITY ROUTES (PUBLIC) ============
router.get('/hierarchy', categoryController.getCategoryHierarchy);
router.get('/search', categoryController.searchCategories);

// ============ MAIN CATEGORY ROUTES (NO IMAGE) ============
router.get('/main', categoryController.getAllMainCategories);
router.get('/main/:id', categoryController.getMainCategoryById);
router.post('/main', categoryController.createMainCategory);
router.put('/main/:id', categoryController.updateMainCategory);
router.delete('/main/:id', categoryController.deleteMainCategory);

// ============ SUB CATEGORY ROUTES (WITH IMAGE SUPPORT) ============
router.get('/sub', categoryController.getAllSubCategories);
router.get('/sub/:id', categoryController.getSubCategoryById);

// Single sub category creation
router.post('/sub', upload, categoryController.createSubCategory);

// Multiple sub categories creation
router.post('/sub/multiple', upload, categoryController.createMultipleSubCategories);

router.put('/sub/:id', upload, categoryController.updateSubCategory);

router.delete('/sub/:id', categoryController.deleteSubCategory);

// ============ SPECIFIC CATEGORY ROUTES (WITH HERO IMAGE SUPPORT) ============
router.get('/specific', categoryController.getAllSpecificCategories);
router.get('/specific/:id', categoryController.getSpecificCategoryById);

// Single specific category creation
router.post('/specific', categoryController.createSpecificCategory);

// Multiple specific categories creation with hero image
router.post('/specific/multiple', upload, categoryController.createMultipleSpecificCategories);

router.put('/specific/:id', categoryController.updateSpecificCategory);
router.delete('/specific/:id', categoryController.deleteSpecificCategory);

// ============ HERO SECTION ROUTES ============
router.get('/hero', categoryController.getAllHeroSections);

// NEW: Upload hero image for sub category
router.post('/hero/:subCategoryId', upload, categoryController.uploadHeroImage);

// Update hero section image
router.put('/hero/:subCategoryId', upload, categoryController.updateHeroSectionImage);

// NEW: Delete hero section for sub category
router.delete('/hero/:subCategoryId', categoryController.deleteHeroSection);

export default router;