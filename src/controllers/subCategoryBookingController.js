import subCategoryBookingService from '../services/subCategoryBookingService.js';

const subCategoryBookingController = {
  async createRequest(req, res, next) {
    try {
      const userId = req.user.userId; // From verifyToken middleware
      const requestDetails = req.body;
      const result = await subCategoryBookingService.createRequest(requestDetails, userId);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  async getAllRequests(req, res, next) {
    try {
    //   if (req.user.role !== 'ADMIN') {
    //     return res.status(403).json({ success: false, message: 'Forbidden' });
    //   }
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const result = await subCategoryBookingService.getAllRequests(page, limit, req.query);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async getUserRequests(req, res, next) {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const result = await subCategoryBookingService.getUserRequests(userId, page, limit);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async getRequestById(req, res, next) {
    try {
      const result = await subCategoryBookingService.getRequestById(req.params.id);
    //   if (req.user.role !== 'ADMIN' && req.user.id !== result.data.userId) {
    //     return res.status(403).json({ success: false, message: 'Forbidden' });
    //   }
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async updateRequestStatus(req, res, next) {
    try {
    //   if (req.user.role !== 'ADMIN') {
    //     return res.status(403).json({ success: false, message: 'Forbidden' });
    //   }
    console.log(req.params.id, req.body);
      const result = await subCategoryBookingService.updateRequestStatus(req.params.id,req.body );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async deleteRequest(req, res, next) {
    try {
      // if (req.user.role !== 'ADMIN') {
      //   return res.status(403).json({ success: false, message: 'Forbidden' });
      // }
      const result = await subCategoryBookingService.deleteRequest(req.params.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },










   async getAllBookingsGrouped(req, res) {
    try {
      const { userId } = req.user.userId; // Assuming user is authenticated

      const { 
        page = 1, 
        limit = 10
      } = req.query;

      const result = await subCategoryBookingService.getUserBookingsGrouped(
        userId, 
        parseInt(page), 
        parseInt(limit)
      );

      res.status(200).json(result);
    } catch (error) {
      console.error('Error in getAllBookingsGrouped:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to fetch bookings'
      });
    }
  },

  // Get all bookings with different pagination for each status
  async getAllBookingsWithStatusPagination(req, res) {
    try {
      const { userId } = req.user.userId;
      
      // Parse pagination for different statuses from query params
      // e.g., ?all_page=1&all_limit=5&pending_page=2&pending_limit=10
      const pagination = {
        all: {
          page: parseInt(req.query.all_page) || 1,
          limit: parseInt(req.query.all_limit) || 10
        },
        pending: {
          page: parseInt(req.query.pending_page) || 1,
          limit: parseInt(req.query.pending_limit) || 10
        },
        confirmed: {
          page: parseInt(req.query.confirmed_page) || 1,
          limit: parseInt(req.query.confirmed_limit) || 10
        },
        complete: {
          page: parseInt(req.query.complete_page) || 1,
          limit: parseInt(req.query.complete_limit) || 10
        },
        cancelled: {
          page: parseInt(req.query.cancelled_page) || 1,
          limit: parseInt(req.query.cancelled_limit) || 10
        }
      };

      const result = await subCategoryBookingService.getUserBookingsGroupedWithStatusPagination(
        userId, 
        pagination
      );

      res.status(200).json(result);
    } catch (error) {
      console.error('Error in getAllBookingsWithStatusPagination:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to fetch bookings'
      });
    }
  },






  // Admin: Get all users bookings grouped
  async getAllUsersBookingsGrouped(req, res) {
    try {
      // Check if user is admin
      // if (req.user.role !== 'ADMIN') {
      //   return res.status(403).json({
      //     success: false,
      //     message: 'Access denied. Admin privileges required.'
      //   });
      // }

      const { 
        page = 1, 
        limit = 10,
        status,
        userId,
        startDate,
        endDate
      } = req.query;

      // Build filters
      const filters = {};
      if (status) filters.status = status;
      if (userId) filters.userId = userId;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      // Set timeout for the query
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );

      const result = await Promise.race([
        subCategoryBookingService.getAllUsersBookingsGrouped(
          parseInt(page), 
          parseInt(limit),
          filters
        ),
        timeoutPromise
      ]);

      res.status(200).json(result);
    } catch (error) {
      console.error('Error in getAllUsersBookingsGrouped:', error);
      
      if (error.message === 'Request timeout') {
        return res.status(504).json({
          success: false,
          message: 'Request timed out. Try with smaller page size.'
        });
      }
      
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to fetch all users bookings'
      });
    }
  },

  // Admin: Get all users bookings with status pagination
  async getAllUsersBookingsWithStatusPagination(req, res) {
    try {
      // // Check if user is admin
      // if (req.user.role !== 'ADMIN') {
      //   return res.status(403).json({
      //     success: false,
      //     message: 'Access denied. Admin privileges required.'
      //   });
      // }

      // Parse pagination for different statuses
      const pagination = {
        all: {
          page: parseInt(req.query.all_page) || 1,
          limit: parseInt(req.query.all_limit) || 10
        },
        pending: {
          page: parseInt(req.query.pending_page) || 1,
          limit: parseInt(req.query.pending_limit) || 10
        },
        confirmed: {
          page: parseInt(req.query.confirmed_page) || 1,
          limit: parseInt(req.query.confirmed_limit) || 10
        },
        complete: {
          page: parseInt(req.query.complete_page) || 1,
          limit: parseInt(req.query.complete_limit) || 10
        },
        cancelled: {
          page: parseInt(req.query.cancelled_page) || 1,
          limit: parseInt(req.query.cancelled_limit) || 10
        }
      };

      // Set timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 15000)
      );

      const result = await Promise.race([
        subCategoryBookingService.getAllUsersBookingsGroupedByStatus(pagination),
        timeoutPromise
      ]);

      res.status(200).json(result);
    } catch (error) {
      console.error('Error in getAllUsersBookingsWithStatusPagination:', error);
      
      if (error.message === 'Request timeout') {
        return res.status(504).json({
          success: false,
          message: 'Request timed out. Try with smaller page sizes.'
        });
      }
      
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to fetch bookings'
      });
    }
  }

};

export default subCategoryBookingController;