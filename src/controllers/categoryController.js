import categoryService from '../services/categotyService.js';

const categoryController = {
  // ============ MAIN CATEGORY CONTROLLERS ============

  // Create main category
  async createMainCategory(req, res, next) {
    try {
      const result = await categoryService.createMainCategory(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  // Get all main categories
  async getAllMainCategories(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const result = await categoryService.getAllMainCategories(page, limit);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  // Get main category by ID
  async getMainCategoryById(req, res, next) {
    try {
      const { id } = req.params;
      const result = await categoryService.getMainCategoryById(id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  // Update main category
  async updateMainCategory(req, res, next) {
    try {
      const { id } = req.params;
      const result = await categoryService.updateMainCategory(id, req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  // Delete main category
  async deleteMainCategory(req, res, next) {
    try {
      const { id } = req.params;
      const result = await categoryService.deleteMainCategory(id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  // ============ SUB CATEGORY CONTROLLERS (MULTIPLE SUPPORT) ============

  // Create single sub category with image
  async createSubCategory(req, res, next) {
    try {
      const result = await categoryService.createSubCategory(req.body, req.files);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  // Create multiple sub categories with images
  async createMultipleSubCategories(req, res, next) {
    try {
      // Parse subCategories from form data
      const subCategoriesData = JSON.parse(req.body.subCategories || '[]');
      const data = {
        subCategories: subCategoriesData,
        mainCategoryId: req.body.mainCategoryId
        
      };

      console.log("Creating multiple sub categories:", data);

      const result = await categoryService.createMultipleSubCategories(data, req.files);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  // Get all sub categories
  async getAllSubCategories(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const mainCategoryId = req.query.mainCategoryId;

      const result = await categoryService.getAllSubCategories(page, limit, mainCategoryId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  // Get sub category by ID
  async getSubCategoryById(req, res, next) {
    try {
      const { id } = req.params;
      const result = await categoryService.getSubCategoryById(id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  // Update sub category with image
  async updateSubCategory(req, res, next) {
    try {
      const { id } = req.params;
      console.log("Updating sub category:", req.body, req.files);
      const result = await categoryService.updateSubCategory(id, req.body, req.files);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  // Delete sub category
  async deleteSubCategory(req, res, next) {
    try {
      const { id } = req.params;
      const result = await categoryService.deleteSubCategory(id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  // ============ SPECIFIC CATEGORY CONTROLLERS (MULTIPLE SUPPORT WITH HERO IMAGES) ============

  // Create single specific category with hero image
  async createSpecificCategory(req, res, next) {
    try {
      console.log("Creating specific category:", req.body);
      
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Request body is required'
        });
      }
      
      const result = await categoryService.createSpecificCategory(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  // Create multiple specific categories with hero image
  async createMultipleSpecificCategories(req, res, next) {
    try {
      // Parse specificCategories from form data
      const specificCategoriesData = JSON.parse(req.body.specificCategories || '[]');
      const data = {
        specificCategories: specificCategoriesData,
        subCategoryId: req.body.subCategoryId
      };
      console.log("Creating multiple specific categories:", req.files);

      const result = await categoryService.createMultipleSpecificCategories(data, req.files);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  // Get all specific categories
  async getAllSpecificCategories(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const subCategoryId = req.query.subCategoryId;

      const result = await categoryService.getAllSpecificCategories(page, limit, subCategoryId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  // Get specific category by ID
  async getSpecificCategoryById(req, res, next) {
    try {
      const { id } = req.params;
      const result = await categoryService.getSpecificCategoryById(id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  // Update specific category
  async updateSpecificCategory(req, res, next) {
    try {
      const { id } = req.params;
      const result = await categoryService.updateSpecificCategory(id, req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  // Delete specific category
  async deleteSpecificCategory(req, res, next) {
    try {
      const { id } = req.params;
      const result = await categoryService.deleteSpecificCategory(id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  // ============ HERO SECTION CONTROLLERS ============

  // Get all hero sections
  async getAllHeroSections(req, res, next) {
    try {
      const result = await categoryService.getAllHeroSections();
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  // Upload hero image for sub category (NEW)
  async uploadHeroImage(req, res, next) {
    try {
      const { subCategoryId } = req.params;
      
      if (!req.files) {
        return res.status(400).json({
          success: false,
          message: 'Hero image file is required'
        });
      }

      const result = await categoryService.uploadHeroImage(subCategoryId, req.files);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  // Update hero section image
  async updateHeroSectionImage(req, res, next) {
    try {
      const { subCategoryId } = req.params;
      
      if (!req.files) {
        return res.status(400).json({
          success: false,
          message: 'Hero image file is required'
        });
      }

      console.log("Updating hero section image for sub category:", subCategoryId, req.files);

      const result = await categoryService.updateHeroSectionImage(subCategoryId, req.files);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  // Delete hero section for sub category (NEW)
  async deleteHeroSection(req, res, next) {
    try {
      const { subCategoryId } = req.params;
      const result = await categoryService.deleteHeroSection(subCategoryId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  // ============ UTILITY CONTROLLERS ============

  // Get category hierarchy
  async getCategoryHierarchy(req, res, next) {
    try {
      const result = await categoryService.getCategoryHierarchy();
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  // Search categories
  async searchCategories(req, res, next) {
    try {
      const { q: searchTerm, type = 'all' } = req.query;
      
      if (!searchTerm) {
        return res.status(400).json({
          success: false,
          message: 'Search term is required'
        });
      }

      const result = await categoryService.searchCategories(searchTerm, type);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
};

export default categoryController;