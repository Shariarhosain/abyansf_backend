import { PrismaClient } from "@prisma/client";
import AppError from "../utils/error.js";
import publishToQueue from "../utils/publisher.js";

const prisma = new PrismaClient();

const listingBookingService = {
  // Create new booking
  async createBooking(bookingData,email2) {
    try {
      const {
        listingId,
        bookingDate,
        bookingTime,
        name,
        email,
        whatsapp,
        typeofservice,
        venueName,
        numberofguest_adult,
        numberofguest_child
      } = bookingData;

      // Validate required fields
      if (!listingId) {
        throw new AppError('User ID and Listing ID are required', 400);
      }

      // Check if listing exists and is active
      const listing = await prisma.listing.findUnique({
        where: { id: parseInt(listingId) },
        include: {
          specificCategory: {
            include: {
              subCategory: {
                include: {
                  mainCategory: true
                }
              }
            }
          }
        }
      });

      if (!listing) {
        throw new AppError('Listing not found', 404);
      }

      if (!listing.isActive) {
        throw new AppError('This listing is not available for booking', 400);
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { email: email2 }
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Create booking
      const booking = await prisma.listingBooking.create({
        data: {
          userId: user.id,
          listingId: parseInt(listingId),
          bookingDate: bookingDate ? new Date(bookingDate) : null,
          bookingTime,
          name: name || user.name,
          email: email || user.email,
          whatsapp: whatsapp || user.whatsapp,
          typeofservice,
          venueName,
          numberofguest_adult: numberofguest_adult ? parseInt(numberofguest_adult) : null,
          numberofguest_child: numberofguest_child ? parseInt(numberofguest_child) : null,
          status: 'Pending'
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              whatsapp: true
            }
          },
          listing: {
            include: {
              specificCategory: {
                include: {
                  subCategory: {
                    include: {
                      mainCategory: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      // Send booking confirmation in background
      setImmediate(async () => {
        try {
          await publishToQueue("booking_tasks", {
            type: "booking_confirmation",
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
          await publishToQueue("booking_tasks", {
            type: "booking_confirmation_foradmin",
            details: booking,
            userEmail: adminEmail,

          });
          console.log("Booking confirmation for admin task published for booking:", booking.id);
        } catch (error) {
          console.error("Failed to publish booking confirmation:", error.message);
        }
      });

      return {
        success: true,
        message: "Booking created successfully",
        data: booking
      };
    } catch (error) {
      throw new AppError(`Failed to create booking: ${error.message}`, 400);
    }
  },
  // Get all bookings with pagination
  async getAllBookings(page = 1, limit = 10, filters = {}) {
    const skip = (page - 1) * limit;
    const { userId, listingId, status, bookingDate } = filters;

    const where = {
      ...(userId && { userId }),
      ...(listingId && { listingId: parseInt(listingId) }),
      ...(status && { status }),
      ...(bookingDate && { 
        bookingDate: {
          gte: new Date(bookingDate + 'T00:00:00.000Z'),
          lt: new Date(bookingDate + 'T23:59:59.999Z')
        }
      })
    };

    const [bookings, total] = await Promise.all([
      prisma.listingBooking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              whatsapp: true
            }
          },
          listing: {
            include: {
              specificCategory: {
                include: {
                  subCategory: {
                    include: {
                      mainCategory: true
                    }
                  }
                }
              }
            }
          }
        }
      }),
      prisma.listingBooking.count({ where })
    ]);

    // Fix listing fields: hours, typeofservice, venueName to be arrays
    const fixedBookings = bookings.map(booking => {
      const listing = booking.listing;
      return {
        ...booking,
        listing: {
          ...listing,
          hours: Array.isArray(listing.hours)
            ? listing.hours.flatMap(h => {
                try {
                  const parsed = JSON.parse(h);
                  return Array.isArray(parsed) ? parsed : [h];
                } catch {
                  return [h];
                }
              })
            : [],
          typeofservice: Array.isArray(listing.typeofservice)
            ? listing.typeofservice.flatMap(t => {
                try {
                  const parsed = JSON.parse(t);
                  return Array.isArray(parsed) ? parsed : [t];
                } catch {
                  return [t];
                }
              })
            : [],
          venueName: Array.isArray(listing.venueName)
            ? listing.venueName.flatMap(v => {
                try {
                  const parsed = JSON.parse(v);
                  return Array.isArray(parsed) ? parsed : [v];
                } catch {
                  return [v];
                }
              })
            : [],
        }
      };
    });

    return {
      bookings: fixedBookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  },

  // Get booking by ID
  async getBookingById(id) {
    const booking = await prisma.listingBooking.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            whatsapp: true
          }
        },
        listing: {
          include: {
            specificCategory: {
              include: {
                subCategory: {
                  include: {
                    mainCategory: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    // Fix listing fields: hours, typeofservice, venueName to be arrays
    const listing = booking.listing;
    const fixedListing = {
      ...listing,
      hours: Array.isArray(listing.hours)
        ? listing.hours.flatMap(h => {
            try {
              const parsed = JSON.parse(h);
              return Array.isArray(parsed) ? parsed : [h];
            } catch {
              return [h];
            }
          })
        : [],
      typeofservice: Array.isArray(listing.typeofservice)
        ? listing.typeofservice.flatMap(t => {
            try {
              const parsed = JSON.parse(t);
              return Array.isArray(parsed) ? parsed : [t];
            } catch {
              return [t];
            }
          })
        : [],
      venueName: Array.isArray(listing.venueName)
        ? listing.venueName.flatMap(v => {
            try {
              const parsed = JSON.parse(v);
              return Array.isArray(parsed) ? parsed : [v];
            } catch {
              return [v];
            }
          })
        : [],
    };

    return {
      ...booking,
      listing: fixedListing
    };
  },

  // Get user bookings
  async getUserBookings(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      prisma.listingBooking.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          listing: {
            include: {
              specificCategory: {
                include: {
                  subCategory: {
                    include: {
                      mainCategory: true
                    }
                  }
                }
              }
            }
          }
        }
      }),
      prisma.listingBooking.count({ where: { userId } })
    ]);

    // Fix listing fields: hours, typeofservice, venueName to be arrays
    const fixedBookings = bookings.map(booking => {
      const listing = booking.listing;
      return {
        ...booking,
        listing: {
          ...listing,
          hours: Array.isArray(listing.hours)
            ? listing.hours.flatMap(h => {
                try {
                  // Try to parse stringified array
                  const parsed = JSON.parse(h);
                  return Array.isArray(parsed) ? parsed : [h];
                } catch {
                  return [h];
                }
              })
            : [],
          typeofservice: Array.isArray(listing.typeofservice)
            ? listing.typeofservice.flatMap(t => {
                try {
                  const parsed = JSON.parse(t);
                  return Array.isArray(parsed) ? parsed : [t];
                } catch {
                  return [t];
                }
              })
            : [],
          venueName: Array.isArray(listing.venueName)
            ? listing.venueName.flatMap(v => {
                try {
                  const parsed = JSON.parse(v);
                  return Array.isArray(parsed) ? parsed : [v];
                } catch {
                  return [v];
                }
              })
            : [],
        }
      };
    });

    return {
      bookings: fixedBookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  },

  // Update booking status
  async updateBookingStatus(id, status, updatedBy, updateData = {}) {
    try {
      if (!updatedBy) {
        throw new AppError('Updater user ID is required', 400);
      }

      const booking = await prisma.listingBooking.findUnique({
        where: { id: parseInt(id) },
        include: {
          user: true,
          listing: true
        }
      });

      if (!booking) {
        throw new AppError('Booking not found', 404);
      }

      // Get updater user
      const updater = await prisma.user.findUnique({
        where: { id: updatedBy }
      });
      if (!updater) {
        throw new AppError('Updater user not found', 404);
      }

      // Role-based update logic
      let dataToUpdate = { status };
      if (updater.role === 'ADMIN') {
        // Admin can update any field
        dataToUpdate = { ...dataToUpdate, ...updateData };
      } else if (updater.role === 'USER') {
        if (booking.userId !== updatedBy) {
          throw new AppError('Not authorized to update this booking', 403);
        }
        if (booking.status === 'Pending') {
          // User can update all fields if status is Pending
          dataToUpdate = { ...dataToUpdate, ...updateData };
        } else {
          // User cannot update any information if status is Confirmed, Cancelled, or Completed
          throw new AppError('You cannot edit booking information after confirmation, cancellation, or completion', 403);
        }
      } else {
        throw new AppError('Invalid user role', 403);
      }

      const updatedBooking = await prisma.listingBooking.update({
        where: { id: parseInt(id) },
        data: dataToUpdate,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              whatsapp: true
            }
          },
          listing: true
        }
      });

      // Only send notification if status changed
      if (booking.status !== updatedBooking.status) {
        setImmediate(async () => {
          try {
            await publishToQueue("booking_tasks", {
              type: "booking_update",
              details: updatedBooking,
            });
            console.log("Booking update task published for booking:", booking.id);
          } catch (error) {
            console.error("Failed to publish booking update:", error.message);
          }
        });
      }

      return {
        success: true,
        message: `Booking updated successfully`,
        data: updatedBooking
      };
    } catch (error) {
      throw new AppError(`Failed to update booking: ${error.message}`, 400);
    }
  },

  // Cancel booking
  async cancelBooking(id, userId, reason = null) {
    try {
      const booking = await prisma.listingBooking.findUnique({
        where: { id: parseInt(id) },
        include: {
          user: true,
          listing: true
        }
      });

      if (!booking) {
        throw new AppError('Booking not found', 404);
      }

      // Get user info
      const user = await prisma.user.findUnique({
        where: { id: typeof userId === 'string' ? parseInt(userId) : userId }
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Only admin can cancel any booking, user can only cancel if status is Pending and owns the booking
      if (user.role !== 'ADMIN') {
        if (booking.userId !== userId) {
          throw new AppError('Not authorized to cancel this booking', 403);
        }
        if (booking.status !== 'Pending') {
          throw new AppError('You can only cancel bookings that are pending', 400);
        }
      }

      if (booking.status === 'Cancelled') {
        throw new AppError('Booking is already cancelled', 400);
      }

      if (booking.status === 'Completed') {
        throw new AppError('Cannot cancel completed booking', 400);
      }

      const updatedBooking = await prisma.listingBooking.update({
        where: { id: parseInt(id) },
        data: { status: 'Cancelled' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              whatsapp: true
            }
          },
          listing: true
        }
      });

      // Send cancellation notification in background
      setImmediate(async () => {
        try {
          await publishToQueue("booking_tasks", {
            type: "booking_cancellation",
            bookingId: booking.id,
            userEmail: booking.email,
            userName: booking.name,
            listingName: booking.listing.name,
            cancellationReason: reason
          });
          console.log("Booking cancellation task published for booking:", booking.id);
        } catch (error) {
          console.error("Failed to publish booking cancellation:", error.message);
        }
      });

      return {
        success: true,
        message: "Booking cancelled successfully",
        data: updatedBooking
      };
    } catch (error) {
      throw new AppError(`Failed to cancel booking: ${error.message}`, 400);
    }
  },

  // Get booking statistics
  async getBookingStats() {
    try {
      const [totalBookings, pendingBookings, confirmedBookings, cancelledBookings, completedBookings] = await Promise.all([
        prisma.listingBooking.count(),
        prisma.listingBooking.count({ where: { status: 'Pending' } }),
        prisma.listingBooking.count({ where: { status: 'Confirmed' } }),
        prisma.listingBooking.count({ where: { status: 'Cancelled' } }),
        prisma.listingBooking.count({ where: { status: 'Completed' } })
      ]);

      // Get bookings by date (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentBookings = await prisma.listingBooking.findMany({
        where: {
          createdAt: {
            gte: sevenDaysAgo
          }
        },
        select: {
          createdAt: true,
          status: true
        }
      });

      return {
        totalBookings,
        pendingBookings,
        confirmedBookings,
        cancelledBookings,
        completedBookings,
        recentBookings
      };
    } catch (error) {
      throw new AppError(`Failed to get booking statistics: ${error.message}`, 500);
    }
  },



  // Delete booking
  async deleteBooking(id, userId) {
    try {
      // Get user info
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Only admin can delete booking
      if (user.role !== 'ADMIN') {
        throw new AppError('Only admin can delete bookings', 403);
      }

      const booking = await prisma.listingBooking.findUnique({
        where: { id: parseInt(id) },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              whatsapp: true
            }
          },
          listing: true
        }
      });

      if (!booking) {
        throw new AppError('Booking not found', 404);
      }

      // Delete booking
      await prisma.listingBooking.delete({
        where: { id: parseInt(id) }
      });

      // Publish booking deletion task in background
      setImmediate(async () => {
        try {
          await publishToQueue("booking_tasks", {
            type: "booking_deleted",
            deletedAt: new Date(),
            details: booking
          });
          console.log("Booking deletion task published for booking:", booking.id);
        } catch (error) {
          console.error("Failed to publish booking deletion:", error.message);
        }
      });

      return {
        success: true,
        message: 'Booking deleted successfully'
      };
    } catch (error) {
      throw new AppError(`Failed to delete booking: ${error.message}`, 400);
    }
  }
};

export default listingBookingService;
