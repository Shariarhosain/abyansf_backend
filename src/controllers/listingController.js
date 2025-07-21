import listingService from '../services/listingService.js';

const listingController = {
  // Create new listing
  async createListing(req, res, next) {
    try {
      const result = await listingService.createListing(req.body, req.files);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  // Get all listings
  async getAllListings(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const filters = {
        specificCategoryId: req.query.specificCategoryId,
        location: req.query.location,
        isActive: req.query.isActive
      };

      const result = await listingService.getAllListings(page, limit, filters);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  // Get listing by ID
  async getListingById(req, res, next) {
    try {
      const { id } = req.params;
      const result = await listingService.getListingById(id);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  // Update listing
  async updateListing(req, res, next) {
    try {
      const { id } = req.params;
      const result = await listingService.updateListing(id, req.body, req.files);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  // Delete listing
  async deleteListing(req, res, next) {
    try {
      const { id } = req.params;
      const result = await listingService.deleteListing(id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  // Delete listing image by URL
  async deleteListingImage(req, res, next) {
    try {
      const { imageUrl, listingId,} = req.body;
      console.log("Deleting image:", imageUrl, "from listing ID:", listingId);
      const result = await listingService.deleteListingImage(imageUrl, listingId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  // Search listings
  async searchListings(req, res, next) {
    try {
      const result = await listingService.searchListings(req.body);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
};

export default listingController;