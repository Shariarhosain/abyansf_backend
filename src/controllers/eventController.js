import eventService from '../services/eventService.js';
import AppError from '../utils/error.js';

const eventController = {
    async createEvent(req, res, next) {
        try {
            const event = await eventService.createEvent(req.body, req.files);
            res.status(201).json({
                success: true,
                message: 'Event created successfully',
                data: event,
            });
        } catch (error) {
            next(error);
        }
    },

    async getAllEvents(req, res, next) {
        try {
            const { page, limit, status } = req.query;
            // limit and page int
            const pageInt = parseInt(page, 10) || 1;
            const limitInt = parseInt(limit, 10) || 10;
            const events = await eventService.getAllEvents({ page: pageInt, limit: limitInt, status });
            res.status(200).json({
                success: true,
                data: events,
            });
        } catch (error) {
            next(error);
        }
    },

    async getUpcomingEvents(req, res, next) {
        try {
            const { page, limit } = req.query;
            const events = await eventService.getUpcomingEvents({ page, limit });
            res.status(200).json({
                success: true,
                data: events,
            });
        } catch (error) {
            next(error);
        }
    },

    async getPastEvents(req, res, next) {
        try {
            const { page, limit } = req.query;
            // limit and page int
            const pageInt = parseInt(page, 10) || 1;
            const limitInt = parseInt(limit, 10) || 10;
            const events = await eventService.getPastEvents({ page: pageInt, limit: limitInt });
            res.status(200).json({
                success: true,
                data: events,
            });
        } catch (error) {
            next(error);
        }
    },

    async getEventById(req, res, next) {
        try {
            const event = await eventService.getEventById(req.params.id);
            res.status(200).json({
                success: true,
                data: event,
            });
        } catch (error) {
            next(error);
        }
    },

    async updateEvent(req, res, next) {
        try {
            const event = await eventService.updateEvent(req.params.id, req.body, req.files);
            res.status(200).json({
                success: true,
                message: 'Event updated successfully',
                data: event,
            });
        } catch (error) {
            next(error);
        }
    },

    async deleteEvent(req, res, next) {
        try {
            await eventService.deleteEvent(req.params.id);
            res.status(200).json({
                success: true,
                message: 'Event deleted successfully',
            });
        } catch (error) {
            next(error);
        }
    },

    async bookEvent(req, res, next) {
        try {
            const { eventId } = req.body;
            const userId = req.user.userId; // Assuming user ID is from auth middleware
            console.log('Booking event for user:', userId, 'Event ID:', eventId);
            const booking = await eventService.bookEvent(userId, eventId);
            res.status(201).json({
                success: true,
                message: 'Event booked successfully',
                data: booking,
            });
        } catch (error) {
            next(error);
        }
    },

    async updateEventBooking(req, res, next) {
        try {
            const { bookingId } = req.params;
            const booking = await eventService.updateBooking(bookingId, req.body);
            res.status(200).json({
                success: true,
                message: 'Event booking updated successfully',
                data: booking,
            });
        } catch (error) {
            next(error);
        }
    },

    async getUserEventHistory(req, res, next) {
        try {
            const userId = req.user.userId; // Assuming user ID is from auth middleware
            const { filter, page, limit } = req.query; // filter can be 'all', 'past', 'active', 'cancel'
            const history = await eventService.getUserEventHistory(userId, { filter, page, limit });
            res.status(200).json({
                success: true,
                data: history,
            });
        } catch (error) {
            next(error);
        }
    },

    async getUserPastEvents(req, res, next) {
        try {
            const userId = req.user.userId; // Assuming user ID is from auth middleware
            const events = await eventService.getUserPastEvents(userId);
            res.status(200).json({
                success: true,
                data: events,
            });
        } catch (error) {
            next(error);
        }
    },
    async getUserUpcomingEvents(req, res, next) {
        try {
            const userId = req.user.userId; // Assuming user ID is from auth middleware
            const events = await eventService.getUserUpcomingEvents(userId);
            res.status(200).json({
                success: true,
                data: events,
            });
        } catch (error) {
            next(error);
        }
    },
    async getUserCancelledEvents(req, res, next) {
        try {
            const userId = req.user.userId; // Assuming user ID is from auth middleware
            const events = await eventService.getUserCancelledEvents(userId);
            res.status(200).json({
                success: true,
                data: events,
            });
        } catch (error) {
            next(error);
        }
    },
    async getEventById(req, res, next) {
        try {
            const event = await eventService.getEventById(req.params.id);
            res.status(200).json({
                success: true,
                data: event,
            });
        } catch (error) {
            next(error);
        }
    },

    async getEventBookingById(req, res, next) {
        try {
            const bookingId = req.params.bookingId;
            const userId = req.user.userId; // Assuming user ID is from auth middleware
            console.log('Fetching booking details for user:', userId, 'Booking ID:', bookingId);
            if (!bookingId) {
                return res.status(400).json({
                    success: false,
                    message: 'Booking ID is required',
                });
            }
            const booking = await eventService.getEventBookingById(bookingId, userId);
            res.status(200).json({
                success: true,
                data: booking,
            });
        } catch (error) {
            next(error);
        }
    },

    async deleteEventBooking(req, res, next) {
        try {
            const bookingId = req.params.bookingId;
            if (!bookingId) {
                return res.status(400).json({
                    success: false,
                    message: 'Booking ID is required',
                });
            }
         
            await eventService.deleteEventBooking(bookingId);
            res.status(200).json({
                success: true,
                message: 'Event booking deleted successfully',
            });
        } catch (error) {
            next(error);
        }
    },


};

export default eventController;
