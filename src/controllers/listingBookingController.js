import listingBookingService from '../services/listingBookingService.js';

const listingBookingController = {
  // Create new booking
  async createBooking(req, res, next) {
    try {
      const email = req.user.email; // From auth middleware

      const result = await listingBookingService.createBooking(req.body, email );
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  // Get all bookings (admin)
  async getAllBookings(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const filters = {
        userId: req.query.userId,
        listingId: req.query.listingId,
        status: req.query.status,
        bookingDate: req.query.bookingDate
      };

      const result = await listingBookingService.getAllBookings(page, limit, filters);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  // Get booking by ID
  async getBookingById(req, res, next) {
    try {
      const { id } = req.params;
      const result = await listingBookingService.getBookingById(id);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  // Get current user's bookings
  async getUserBookings(req, res, next) {
    try {
      const userId = req.user.userId; // From auth middleware
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const result = await listingBookingService.getUserBookings(userId, page, limit);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  // Get specific user's bookings (admin or self)
  async getBookingsByUserId(req, res, next) {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      // Check if user can access these bookings
      if (req.user.id !== userId && req.user.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view these bookings'
        });
      }

      const result = await listingBookingService.getUserBookings(userId, page, limit);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  // Update booking status
  async updateBookingStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updatedBy = req.user.userId; // From auth middleware
      console.log('Update Booking Status:', req.user);

      console.log('Update Booking Status:', { id, status, updatedBy });

      const result = await listingBookingService.updateBookingStatus(id, status, updatedBy, req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  // Cancel booking
  async cancelBooking(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = req.user.id;

      const result = await listingBookingService.cancelBooking(id, userId, reason);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  // Get booking statistics (admin)
  async getBookingStats(req, res, next) {
    try {
      // Check if user is admin
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view booking statistics'
        });
      }

      const result = await listingBookingService.getBookingStats();
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteBooking(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.userId; // From auth middleware


       console.log('Delete Booking:', { id, userId });
      const result = await listingBookingService.deleteBooking(id, userId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
};

export default listingBookingController;