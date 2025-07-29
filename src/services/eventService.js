import { PrismaClient } from "@prisma/client";
import { uploadSingleImage, deleteImage, validateImageFile } from '../utils/imghelper.js';
import AppError from "../utils/error.js";
import  publishToQueue  from '../utils/publisher.js';
import notificationService from "./notificationService.js"; // Import notification service

import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

const getFilenameFromUrl = (url) => {
    if (!url) return null;
    try {
        return new URL(url).pathname.split('/').pop();
    } catch (e) {
        return url.split('/').pop();
    }
};


const eventService = {
    async createEvent(eventData, files) {
        const { title, date, time, description, max_person, location } = eventData;

        if (!title || !date || !time || !description || !max_person || !location) {
            throw new AppError('All fields are required', 400);
        }

        if (!files || !files.event_img || !files.event_img[0]) {
            throw new AppError('Event image is required', 400);
        }



        const event = await prisma.event.create({
            data: {
                title,
                event_img: "uploding....",
                date: new Date(date),
                time,
                description,
                max_person: parseInt(max_person, 10),
                location,
                status: 'Active',
            },
        });

        if (files.event_img && files.event_img[0]) {
            setImmediate(async () => {
                try {
                    validateImageFile(files.event_img[0]);
                    const uploadResult = await uploadSingleImage(files.event_img[0]);
                    console.log('Image uploaded successfully:', uploadResult.url);
                    await prisma.event.update({
                        where: { id: event.id },
                        data: { event_img: uploadResult.url },
                    });
                } catch (error) {
                    console.error('Error uploading image:', error);
                }
            });
        }

        return event;
    },

    async getAllEvents(options = {}) {
        const { page = 1, limit = 10, status } = options;
        const skip = (page - 1) * limit;
        const where = {};
        if (status) {
            where.status = status;
        }

        const [events, total] = await Promise.all([
            prisma.event.findMany({
                where,
                skip,
                take: limit,
                orderBy: { date: 'desc' },
                include: { _count: { select: { bookings: true } }, bookings: { include: { user: true } } },
            }),
            prisma.event.count({ where }),
        ]);

        return {
            events,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        };
    },

    async getUpcomingEvents(options = {}) {
        const { page = 1, limit = 10 } = options;
        const skip = (page - 1) * limit;
        const where = {
            date: { gte: new Date() },
            status: 'Active',
        };

        const [events, total] = await Promise.all([
            prisma.event.findMany({
                where,
                skip,
                take: limit,
                orderBy: { date: 'asc' },
                include: { _count: { select: { bookings: true } } },
            }),
            prisma.event.count({ where }),
        ]);

        return {
            events,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        };
    },

    async getPastEvents(options = {}) {
        const { page = 1, limit = 10 } = options;
        const skip = (page - 1) * limit;
        const where = {
            date: { lt: new Date() },
        };

        const [events, total] = await Promise.all([
            prisma.event.findMany({
                where,
                skip,
                take: limit,
                orderBy: { date: 'desc' },
                include: { _count: { select: { bookings: true } } },
            }),
            prisma.event.count({ where }),
        ]);

        return {
            events,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        };
    },

    async getEventById(id) {
        const event = await prisma.event.findUnique({
            where: { id: parseInt(id, 10) },
            include: {
                bookings: {
                    include: {
                        user: { select: { id: true, name: true, email: true } },
                    },
                },
            },
        });

        if (!event) {
            throw new AppError('Event not found', 404);
        }
        return event;
    },

    async updateEvent(id, updateData, files) {
        const eventId = parseInt(id, 10);
        const existingEvent = await prisma.event.findUnique({ where: { id: eventId } });

        if (!existingEvent) {
            throw new AppError('Event not found', 404);
        }

        if (files && files.event_img && files.event_img[0]) {
         setImmediate(async () => {
            try {
                validateImageFile(files.event_img[0]);
                const uploadResult = await uploadSingleImage(files.event_img[0]);
                console.log('Image uploaded successfully:', uploadResult.url);
                updateData.event_img = uploadResult.url;
            } catch (error) {
                console.error('Error uploading image:', error);
            }
        });
    }

        if(updateData.max_person) {
            updateData.max_person = parseInt(updateData.max_person, 10);
        }
        
        if(updateData.date) {
            updateData.date = new Date(updateData.date);
        }

        const updatedEvent = await prisma.event.update({
            where: { id: eventId },
            data: updateData,
        });

        return updatedEvent;
    },

    async deleteEvent(id) {
        const eventId = parseInt(id, 10);
        const event = await prisma.event.findUnique({ where: { id: eventId } });

        if (!event) {
            throw new AppError('Event not found', 404);
        }


        const deletedBookings = await prisma.eventBooking.deleteMany({ where: { eventId } });

        if(!deletedBookings) {
            throw new AppError('Failed to delete event bookings', 500);
        }
        const deletedEvent = await prisma.event.delete({ where: { id: eventId } });

        if (event.event_img) {
            setImmediate(async () => {
                try {
                    const filename = getFilenameFromUrl(event.event_img);
                    if (filename) await deleteImage(filename).catch(err => console.error("Failed to delete event image:", err));
                    console.log('Event image deleted successfully');
                } catch (error) {
                    console.error("Error deleting event image:", error);
                }
            });
        }

        return {
            success: true,
            message: 'Event deleted successfully',
            event: deletedEvent,
            bookings: deletedBookings.count,
        };
    },




    async bookEvent(userId, eventId) {
        eventId = parseInt(eventId, 10);
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: { _count: { select: { bookings: true } } },
        });

        if (!event) throw new AppError('Event not found', 404);
        if (event.status !== 'Active') throw new AppError('Event is not active for booking', 400);
      //  if (event._count.bookings >= event.max_person) throw new AppError('Event is fully booked', 400);

        const existingBooking = await prisma.eventBooking.findUnique({
            where: { userId_eventId: { userId, eventId } },
            include: { event: true, user: true },
        });

        if (existingBooking) throw new AppError('You have already booked this event', 409);

        const booking = await prisma.eventBooking.create({
            data: { userId, eventId, status: 'Pending' },
            include: { event: true, user: true },
        });

        console.log('Event booked successfully:', booking);
          // Send booking confirmation in background
      setImmediate(async () => {
        try {
          await publishToQueue("event_booking", {
            type: "event_booking_request_confirmation",
            details: booking
          });
          console.log("Booking confirmation task published for booking:", booking.id);
          

          let adminEmail = process.env.ADMIN_EMAIL;
          console.log("Admin email:", adminEmail);
          if (!adminEmail) {
            const adminUser = await prisma.user.findFirst({
              where: { role: 'ADMIN' },
              select: { email: true }
            });
            adminEmail = adminUser?.email;
          }
          await publishToQueue("event_booking", {
            type: "event_booking_confirmation_foradmin",
            details: booking,
            userEmail: adminEmail,

          });
          console.log("Booking confirmation for admin task published for booking:", booking.id);
            // --- NOTIFICATION ---
        await notificationService.createNotification(
            userId,
            'Event Booking Request Received',
            `Your booking request for the event ${event.title} has been received.`
        );
        await notificationService.createNotificationForAdmins(
            'New Event Booking',
            `${booking.user.name} has booked a spot for the event ${event.title}.`
        );
        // --- END NOTIFICATION ---

        } catch (error) {
          console.error("Failed to publish booking confirmation:", error.message);
        }
      });


        return booking;
    },

    async updateBooking(bookingId, updateData) {
        bookingId = parseInt(bookingId, 10);
        const booking = await prisma.eventBooking.findUnique({ where: { id: bookingId } });

        if (!booking) throw new AppError('Booking not found', 404);

        const updatedBooking = await prisma.eventBooking.update({
            where: { id: bookingId },
            data: updateData,
            include: { event: true, user: true },
        });

        setImmediate(async () => {
            try {
                await publishToQueue("event_booking", {
                    type: "event_booking_request_status_update",
                    details: updatedBooking
                });
                console.log("Booking update task published for booking:", updatedBooking.id);
                    // --- NOTIFICATION ---
        if (booking.status !== updatedBooking.status) {
            await notificationService.createNotification(
                updatedBooking.userId,
                'Event Booking Status Updated',
                `The status of your booking for ${updatedBooking.event.title} has been updated to ${updatedBooking.status}.`
            );
            await notificationService.createNotificationForAdmins(
                'Event Booking Status Updated',
                `The booking for ${updatedBooking.user.name} for the event ${updatedBooking.event.title} has been updated to ${updatedBooking.status}.`
            );
        }
        // --- END NOTIFICATION ---
            } catch (error) {
                console.error("Failed to publish booking update:", error.message);
            }
        });

        return updatedBooking;
    },




    async getUserEventHistory(userId, options = {}) {
        const { filter = 'all', page = 1, limit = 10 } = options;
        const skip = (page - 1) * limit;

        const where = { userId };
        const eventWhere = {};

        switch (filter.toLowerCase()) {
            case 'past':
                eventWhere.date = { lt: new Date() };
                break;
            case 'active':
                eventWhere.date = { gte: new Date() };
                where.status = 'Booked';
                break;
            case 'cancel':
                where.status = 'Cancelled';
                break;
            case 'all':
            default:
                // No extra filters needed
                break;
        }
        
        where.event = eventWhere;

        const [bookings, total] = await Promise.all([
            prisma.eventBooking.findMany({
                where,
                skip,
                take: limit,
                include: { event: true },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.eventBooking.count({ where }),
        ]);

        return {
            bookings,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        };
    },

    async getUserPastEvents(userId, options = {}) {
        const { page = 1, limit = 10 } = options;
        const skip = (page - 1) * limit;

        const where = {
            userId,
            event: {
                date: { lt: new Date() },
            },
        };

        const [events, total] = await Promise.all([
            prisma.eventBooking.findMany({
                where,
                skip,
                take: limit,
                include: { event: true },
                orderBy: { event: { date: 'desc' } },
            }),
            prisma.eventBooking.count({ where }),
        ]);

        return {
            events,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        };
    },
    async getUserUpcomingEvents(userId, options = {}) {
        const { page = 1, limit = 10 } = options;
        const skip = (page - 1) * limit;

        const where = {
            userId,
            event: {
                date: { gte: new Date() },
            },
        };

        const [events, total] = await Promise.all([
            prisma.eventBooking.findMany({
                where,
                skip,
                take: limit,
                include: { event: true },
                orderBy: { event: { date: 'asc' } },
            }),
            prisma.eventBooking.count({ where }),
        ]);

        return {
            events,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        };
    },
    async getUserCancelledEvents(userId, options = {}) {
        const { page = 1, limit = 10 } = options;
        const skip = (page - 1) * limit;

        const where = {
            userId,
            status: 'Cancelled',
        };

        const [events, total] = await Promise.all([
            prisma.eventBooking.findMany({
                where,
                skip,
                take: limit,
                include: { event: true },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.eventBooking.count({ where }),
        ]);

        return {
            events,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        };
    },

    async getEventBookingById(bookingId, userId) {
        const booking = await prisma.eventBooking.findUnique({
            where: { id: parseInt(bookingId, 10), userId: userId },
            include: { event: true },
        });

        if (!booking) {
            throw new AppError('Booking not found', 404);
        }

        return booking;
    },

    async deleteEventBooking(bookingId) {
        const booking = await prisma.eventBooking.findUnique({
            where: { id: parseInt(bookingId, 10) },
        });

        if (!booking) {
            throw new AppError('Booking not found', 404);
        }

        const deletedBooking = await prisma.eventBooking.delete({
            where: { id: parseInt(bookingId, 10) },
            include: { event: true, user: true },
        });

        setImmediate(async () => {
            try {
                await publishToQueue("event_booking", {
                    type: "event_booking_request_deleted",
                    details: deletedBooking,
                });
                console.log("Booking deletion task published for booking:", deletedBooking.id);
            } catch (error) {
                console.error("Failed to publish booking deletion:", error.message);
            }
        });
    },
};

export default eventService;
