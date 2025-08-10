import highlightService from '../services/highlightService.js';

const highlightController = {
  // Create a new highlight
  async createHighlight(req, res, next) {
    try {
      const result = await highlightService.createHighlight(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  // Get all highlights with pagination and filtering
  async getAllHighlights(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const filters = {
        type: req.query.type,
        isActive: req.query.isActive
      };

      const result = await highlightService.getAllHighlights(page, limit, filters);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  // Get highlight by ID
  async getHighlightById(req, res, next) {
    try {
      const { id } = req.params;
      const result = await highlightService.getHighlightById(id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  // Update highlight
  async updateHighlight(req, res, next) {
    try {
      const { id } = req.params;
      const result = await highlightService.updateHighlight(id, req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  // Delete highlight
  async deleteHighlight(req, res, next) {
    try {
      const { id } = req.params;
      const result = await highlightService.deleteHighlight(id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  // Toggle highlight active status
  async toggleHighlightStatus(req, res, next) {
    try {
      const { id } = req.params;
      const result = await highlightService.toggleHighlightStatus(id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  // Get highlights by type
  async getHighlightsByType(req, res, next) {
    try {
      const { type } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const result = await highlightService.getHighlightsByType(type, page, limit);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
};

export default highlightController;
