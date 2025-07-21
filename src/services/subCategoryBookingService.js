import { PrismaClient } from "@prisma/client";
import AppError from "../utils/error.js";
import publishToQueue from "../utils/publisher.js";

import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();
const deepMerge = (target, source) => {
  const output = { ...target };
  if (target && typeof target === 'object' && source && typeof source === 'object') {
    Object.keys(source).forEach(key => {
      if (source[key] && typeof source[key] === 'object' && key in target && target[key] && typeof target[key] === 'object') {
        // If both target and source have an object for the same key, recurse
        output[key] = deepMerge(target[key], source[key]);
      } else {
        // Otherwise, just assign the source value
        output[key] = source[key];
      }
    });
  }
  return output;
};
const subCategoryBookingService = {

  async createRequest(requestDetails, userId) {
    if (!requestDetails || Object.keys(requestDetails).length === 0) {
      throw new AppError("Request details cannot be empty", 400);
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const request = await prisma.subCategoryBooking.create({
      data: {
        userId,
        bookingInfo: requestDetails,
        subCategoryId: requestDetails.subCategoryId,
        status: "Pending",
      },
     
    });

    // Send notifications in the background
    setImmediate(async () => {
      try {

        const fullRequestDetails = await prisma.subCategoryBooking.findUnique({
          where: { id: request.id }
          , include: {
            user: { select: { email: true, name: true } },
            subCategory: true,
          }
        });
        // Notify user of confirmation
        await publishToQueue("sub_category_booking", {
          type: "sub_category_booking_request_confirmation",
          details: fullRequestDetails,
          userEmail: user.email,
        });

        // Notify admin of new request
        const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
        const adminEmail = adminUser ? adminUser.email : process.env.ADMIN_EMAIL;
        if (adminEmail) {
          await publishToQueue("sub_category_booking", {
            type: "sub_category_booking_request_admin_notification",
            details: fullRequestDetails,
            adminEmail: adminEmail,
          });
        }
      } catch (error) {
        console.error("Failed to publish  booking request tasks:", error);
      }
    });

    return {
      success: true,
      message: "Your  booking request has been submitted successfully.",
      data: request,
    };
  },

  
  async getAllRequests(page = 1, limit = 10, filters = {}) {
    const skip = (page - 1) * limit;
    const { status, userId } = filters;

    const where = {
      ...(status && { status }),
      ...(userId && { userId }),
      //must have a subCategoryId to filter by subcategory convert string to number
      ...(filters.subCategoryId && { subCategoryId: parseInt(filters.subCategoryId) }),
    };

    const [requests, total] = await Promise.all([
      prisma.subCategoryBooking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true, email: true } },
            subCategory: true,
        },
      }),
      prisma.subCategoryBooking.count({ where }),
    ]);

    return {
      success: true,
      data: {
        requests,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    };
  },

  
  async getUserRequests(userId, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;

      const [requests, total] = await Promise.all([
        prisma.subCategoryBooking.findMany({
          where: { userId },
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: { user: { select: { id: true, name: true, email: true } },
            subCategory: true,
          },
        }),
        prisma.subCategoryBooking.count({ where: { userId } }),
      ]);

      return {
        success: true,
        data: {
          requests,
          pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        },
      };
    } catch (error) {
      console.error("Error fetching user requests:", error);
      throw new AppError("Failed to fetch user requests", 500);
    }
  },

  /**
   * Retrieves a single concierge request by its ID.
   * @param {number} id - The ID of the request.
   * @returns {object} The found request.
   */
  async getRequestById(id) {
    const request = await prisma.subCategoryBooking.findUnique({
      where: { id: parseInt(id) },
      include: { user: { select: { id: true, name: true, email: true } },
        subCategory: true,
        },

    });

    if (!request) {
      throw new AppError("Sub-category booking request not found", 404);
    }

    return { success: true, data: request };
  },

 
/**
 * Updates a booking request's status and/or its bookingInfo JSON data.
 * The message queue is only triggered if the 'status' field is changed.
 *
 * @param {string|number} id - The ID of the subCategoryBooking to update.
 * @param {object} updateData - An object containing the fields to update.
 * e.g., { status: 'confirmed', nameOfHotel: 'New Hotel' }
 */
/**
 * A helper function to deeply merge two objects.
 * @param {object} target - The original object.
 * @param {object} source - The object with new/updated properties.
 * @returns {object} The merged object.
 */



// The main function, now using deepMerge
async  updateRequestStatus(id, updateData) {
  const bookingId = parseInt(id, 10);

  if (isNaN(bookingId)) {
    return { success: false, message: "Invalid booking ID." };
  }
  if (!updateData || Object.keys(updateData).length === 0) {
    return { success: false, message: "No update data provided." };
  }

  const currentBooking = await prisma.subCategoryBooking.findUnique({
    where: { id: bookingId },
  });

  if (!currentBooking) {
    return { success: false, message: `Booking with ID ${bookingId} not found.` };
  }

  const { status, ...bookingInfoUpdates } = updateData;
  const dataToUpdate = {};

  // Check if there are updates for the bookingInfo JSON field
  if (Object.keys(bookingInfoUpdates).length > 0) {
    // Perform a DEEP MERGE to update nested properties (like 'guests.children')
    // without replacing the entire parent object ('guests').
    dataToUpdate.bookingInfo = deepMerge(currentBooking.bookingInfo, bookingInfoUpdates);
  }

  if (status) {
    dataToUpdate.status = status;
  }

  const updatedRequest = await prisma.subCategoryBooking.update({
    where: { id: bookingId },
    data: dataToUpdate,
    include: { user: { select: { name: true, email: true } }, subCategory: true },
  });

  if (status && status !== currentBooking.status) {
    setImmediate(async () => {
      try {

     
        await publishToQueue("sub_category_booking", {
          type: "sub_category_booking_request_status_update",
          details: updatedRequest,
          userEmail: updatedRequest.user.email,
        });
        console.log(`Published status update for booking ID: ${bookingId}`);
      } catch (error) {
        console.error("Failed to publish status update task:", error);
      }
    });
  }

  return {
    success: true,
    message: "Booking updated successfully.",
    data: updatedRequest,
  };
},


  async deleteRequest(id) {
    try {
      const bookingId = parseInt(id, 10);
      if (isNaN(bookingId)) {
        throw new AppError("Invalid booking ID", 400);
      }

      const request = await prisma.subCategoryBooking.findUnique({
        where: { id: bookingId },
      });

      if (!request) {
        throw new AppError("Sub-category booking request not found", 404);
      }

      const deletedRequest = await prisma.subCategoryBooking.delete({
        where: { id: bookingId },
        include: { user: { select: { email: true, name: true } }, subCategory: true },
      });
      // Optionally, publish a message to the queue about the deletion
      setImmediate(async () => {
        try {
          await publishToQueue("sub_category_booking", {
            type: "sub_category_booking_request_deleted",
            details: deletedRequest,
            userEmail: deletedRequest.user.email,
          });
        } catch (error) {
          console.error("Failed to publish delete request task:", error);
        }
      });

      return { success: true, message: "Sub-category booking request deleted successfully." };
    } catch (error) {
      if (error instanceof AppError) {
        throw error; // Re-throw custom errors
      }
      console.error("Error deleting sub-category booking request:", error);
      throw new AppError("Failed to delete sub-category booking request", 500);
    }
  },

  // Unified booking service that groups all bookings by status in one response

async getUserBookingsGrouped(userId, page = 1, limit = 10) {
  try {
    const skip = (page - 1) * limit;

    // Fetch all listing bookings
    const [listingBookings, listingTotal] = await Promise.all([
      prisma.listingBooking.findMany({
        where: { userId: userId },
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
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.listingBooking.count({ where: { userId } })
    ]);

    // Fetch all subcategory bookings
    const [subCategoryBookings, subCategoryTotal] = await Promise.all([
      prisma.subCategoryBooking.findMany({
        where: { userId: userId },
        include: {
          subCategory: {
            include: {
              mainCategory: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.subCategoryBooking.count({ where: { userId } })
    ]);

    // Transform listing bookings
    const transformedListingBookings = listingBookings.map(booking => {
      const listing = booking.listing;
      
      // Fix array fields that might be stringified
      const fixArrayField = (field) => {
        if (!Array.isArray(field)) return [];
        return field.flatMap(item => {
          try {
            const parsed = JSON.parse(item);
            return Array.isArray(parsed) ? parsed : [item];
          } catch {
            return [item];
          }
        });
      };

      return {
        id: booking.id,
        type: 'listing',
        userId: booking.userId,
        status: booking.status,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        
        // Booking specific details
        bookingDate: booking.bookingDate,
        bookingTime: booking.bookingTime,
        name: booking.name,
        email: booking.email,
        whatsapp: booking.whatsapp,
        venueName: booking.venueName,
        typeofservice: booking.typeofservice,
        numberofguest_adult: booking.numberofguest_adult,
        numberofguest_child: booking.numberofguest_child,
        
        // Listing details
        listing: {
          id: listing.id,
          name: listing.name,
          main_image: listing.main_image,
          sub_images: listing.sub_images,
          location: listing.location,
          description: listing.description,
          formName: listing.formName,
          isActive: listing.isActive,
          menuImages: listing.menuImages,
          member_privileges: listing.member_privileges,
          member_privileges_description: listing.member_privileges_description,
          
          // Fixed array fields
          hours: fixArrayField(listing.hours),
          typeofservice: fixArrayField(listing.typeofservice),
          venueName: fixArrayField(listing.venueName),
          
          // Category information
          specificCategory: listing.specificCategory,
          subCategory: listing.specificCategory?.subCategory,
          mainCategory: listing.specificCategory?.subCategory?.mainCategory
        },
        
        user: booking.user
      };
    });

    // Transform subcategory bookings
    const transformedSubCategoryBookings = subCategoryBookings.map(booking => ({
      id: booking.id,
      type: 'subcategory',
      userId: booking.userId,
      status: booking.status,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      
      // Subcategory booking specific details
      bookingInfo: booking.bookingInfo,
      
      // Category information
      subCategory: booking.subCategory,
      mainCategory: booking.subCategory?.mainCategory,
      
      user: booking.user
    }));

    // Combine all bookings
    const allBookings = [...transformedListingBookings, ...transformedSubCategoryBookings];
    
    // Sort by creation date (newest first)
    allBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Group bookings by status
    const groupedBookings = {
      all: allBookings,
      pending: allBookings.filter(booking => booking.status.toLowerCase() === 'pending'),
      confirmed: allBookings.filter(booking => booking.status.toLowerCase() === 'confirmed'),
      complete: allBookings.filter(booking => booking.status.toLowerCase() === 'complete'),
      cancelled: allBookings.filter(booking => booking.status.toLowerCase() === 'cancelled')
    };

    // Apply pagination to each group
    const paginatedGroups = {};
    Object.keys(groupedBookings).forEach(status => {
      paginatedGroups[status] = groupedBookings[status].slice(skip, skip + limit);
    });

    // Calculate counts for each status
    const statusCounts = {
      all: allBookings.length,
      pending: groupedBookings.pending.length,
      confirmed: groupedBookings.confirmed.length,
      complete: groupedBookings.complete.length,
      cancelled: groupedBookings.cancelled.length
    };

    return {
      success: true,
      data: {
        all: paginatedGroups.all,
        pending: paginatedGroups.pending,
        confirmed: paginatedGroups.confirmed,
        complete: paginatedGroups.complete,
        cancelled: paginatedGroups.cancelled,
        
        // Pagination details
        pagination: {
          page,
          limit,
          counts: {
            all: statusCounts.all,
            pending: statusCounts.pending,
            confirmed: statusCounts.confirmed,
            complete: statusCounts.complete,
            cancelled: statusCounts.cancelled
          },
          pages: {
            all: Math.ceil(statusCounts.all / limit),
            pending: Math.ceil(statusCounts.pending / limit),
            confirmed: Math.ceil(statusCounts.confirmed / limit),
            complete: Math.ceil(statusCounts.complete / limit),
            cancelled: Math.ceil(statusCounts.cancelled / limit)
          }
        }
      }
    };

  } catch (error) {
    console.error("Error fetching grouped user bookings:", error);
    throw new AppError("Failed to fetch user bookings", 500);
  }
},

// Alternative method with status-specific pagination (if you want different page for each status)
async getUserBookingsGroupedWithStatusPagination(userId, pagination = {}) {
  try {
    // Default pagination for each status
    const defaultPagination = { page: 1, limit: 10 };
    const statusPagination = {
      all: { ...defaultPagination, ...pagination.all },
      pending: { ...defaultPagination, ...pagination.pending },
      confirmed: { ...defaultPagination, ...pagination.confirmed },
      complete: { ...defaultPagination, ...pagination.complete },
      cancelled: { ...defaultPagination, ...pagination.cancelled }
    };

    // Fetch all data first (same as above method)
    const [listingBookings, subCategoryBookings] = await Promise.all([
      prisma.listingBooking.findMany({
        where: { userId },
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
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.subCategoryBooking.findMany({
        where: { userId },
        include: {
          subCategory: {
            include: {
              mainCategory: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    // Transform bookings (same transformation logic as above)
    const transformedListingBookings = listingBookings.map(booking => {
      // ... same transformation logic as above
      const listing = booking.listing;
      const fixArrayField = (field) => {
        if (!Array.isArray(field)) return [];
        return field.flatMap(item => {
          try {
            const parsed = JSON.parse(item);
            return Array.isArray(parsed) ? parsed : [item];
          } catch {
            return [item];
          }
        });
      };

      return {
        id: booking.id,
        type: 'listing',
        userId: booking.userId,
        status: booking.status,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        bookingDate: booking.bookingDate,
        bookingTime: booking.bookingTime,
        name: booking.name,
        email: booking.email,
        whatsapp: booking.whatsapp,
        venueName: booking.venueName,
        typeofservice: booking.typeofservice,
        numberofguest_adult: booking.numberofguest_adult,
        numberofguest_child: booking.numberofguest_child,
        listing: {
          ...listing,
          hours: fixArrayField(listing.hours),
          typeofservice: fixArrayField(listing.typeofservice),
          venueName: fixArrayField(listing.venueName),
          specificCategory: listing.specificCategory,
          subCategory: listing.specificCategory?.subCategory,
          mainCategory: listing.specificCategory?.subCategory?.mainCategory
        },
        user: booking.user
      };
    });

    const transformedSubCategoryBookings = subCategoryBookings.map(booking => ({
      id: booking.id,
      type: 'subcategory',
      userId: booking.userId,
      status: booking.status,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      bookingInfo: booking.bookingInfo,
      subCategory: booking.subCategory,
      mainCategory: booking.subCategory?.mainCategory,
      user: booking.user
    }));

    // Combine and sort
    const allBookings = [...transformedListingBookings, ...transformedSubCategoryBookings];
    allBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Group by status
    const groupedBookings = {
      all: allBookings,
      pending: allBookings.filter(booking => booking.status.toLowerCase() === 'pending'),
      confirmed: allBookings.filter(booking => booking.status.toLowerCase() === 'confirmed'),
      complete: allBookings.filter(booking => booking.status.toLowerCase() === 'complete'),
      cancelled: allBookings.filter(booking => booking.status.toLowerCase() === 'cancelled')
    };

    // Apply different pagination for each status
    const paginatedGroups = {};
    Object.keys(groupedBookings).forEach(status => {
      const { page, limit } = statusPagination[status];
      const skip = (page - 1) * limit;
      paginatedGroups[status] = groupedBookings[status].slice(skip, skip + limit);
    });

    // Calculate counts
    const statusCounts = {
      all: allBookings.length,
      pending: groupedBookings.pending.length,
      confirmed: groupedBookings.confirmed.length,
      complete: groupedBookings.complete.length,
      cancelled: groupedBookings.cancelled.length
    };

    return {
      success: true,
      data: {
        all: paginatedGroups.all,
        pending: paginatedGroups.pending,
        confirmed: paginatedGroups.confirmed,
        complete: paginatedGroups.complete,
        cancelled: paginatedGroups.cancelled,
        
        pagination: {
          all: {
            page: statusPagination.all.page,
            limit: statusPagination.all.limit,
            total: statusCounts.all,
            pages: Math.ceil(statusCounts.all / statusPagination.all.limit)
          },
          pending: {
            page: statusPagination.pending.page,
            limit: statusPagination.pending.limit,
            total: statusCounts.pending,
            pages: Math.ceil(statusCounts.pending / statusPagination.pending.limit)
          },
          confirmed: {
            page: statusPagination.confirmed.page,
            limit: statusPagination.confirmed.limit,
            total: statusCounts.confirmed,
            pages: Math.ceil(statusCounts.confirmed / statusPagination.confirmed.limit)
          },
          complete: {
            page: statusPagination.complete.page,
            limit: statusPagination.complete.limit,
            total: statusCounts.complete,
            pages: Math.ceil(statusCounts.complete / statusPagination.complete.limit)
          },
          cancelled: {
            page: statusPagination.cancelled.page,
            limit: statusPagination.cancelled.limit,
            total: statusCounts.cancelled,
            pages: Math.ceil(statusCounts.cancelled / statusPagination.cancelled.limit)
          }
        }
      }
    };

  } catch (error) {
    console.error("Error fetching grouped user bookings with status pagination:", error);
    throw new AppError("Failed to fetch user bookings", 500);
  }
},






async getAllUsersBookingsGrouped(page = 1, limit = 10, filters = {}) {
    try {
      const skip = (page - 1) * limit;
      const where = {};
      
      // Apply filters if provided
      if (filters.status) {
        where.status = filters.status;
      }
      if (filters.userId) {
        where.userId = filters.userId;
      }
      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
        if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
      }

      // Use Promise.all for parallel queries - much faster
      const [
        listingBookings,
        listingTotal,
        subCategoryBookings,
        subCategoryTotal,
        userCount
      ] = await Promise.all([
        // Listing bookings with optimized includes
        prisma.listingBooking.findMany({
          where,
          include: {
            listing: {
              select: {
                id: true,
                name: true,
                main_image: true,
                location: true,
                formName: true,
                isActive: true,
                specificCategory: {
                  select: {
                    id: true,
                    name: true,
                    subCategory: {
                      select: {
                        id: true,
                        name: true,
                        mainCategory: {
                          select: {
                            id: true,
                            name: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                whatsapp: true,
                role: true,
                isActive: true,
                paid: true,
                package: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: skip
        }),
        
        // Count for listing bookings
        prisma.listingBooking.count({ where }),
        
        // SubCategory bookings with optimized includes
        prisma.subCategoryBooking.findMany({
          where,
          include: {
            subCategory: {
              select: {
                id: true,
                name: true,
                mainCategory: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                whatsapp: true,
                role: true,
                isActive: true,
                paid: true,
                package: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: skip
        }),
        
        // Count for subcategory bookings
        prisma.subCategoryBooking.count({ where }),
        
        // Total unique users count
        prisma.user.count()
      ]);

      // Transform data with minimal processing
      const transformedListingBookings = listingBookings.map(booking => ({
        id: booking.id,
        type: 'listing',
        userId: booking.userId,
        status: booking.status,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        bookingDate: booking.bookingDate,
        bookingTime: booking.bookingTime,
        customerInfo: {
          name: booking.name,
          email: booking.email,
          whatsapp: booking.whatsapp
        },
        bookingDetails: {
          venueName: booking.venueName,
          typeofservice: booking.typeofservice,
          numberofguest_adult: booking.numberofguest_adult,
          numberofguest_child: booking.numberofguest_child
        },
        listing: booking.listing,
        user: booking.user
      }));

      const transformedSubCategoryBookings = subCategoryBookings.map(booking => ({
        id: booking.id,
        type: 'subcategory',
        userId: booking.userId,
        status: booking.status,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        bookingInfo: booking.bookingInfo,
        subCategory: booking.subCategory,
        user: booking.user
      }));

      // Combine and sort
      const allBookings = [...transformedListingBookings, ...transformedSubCategoryBookings]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Get status counts using aggregation - more efficient
      const [listingStatusCounts, subCategoryStatusCounts] = await Promise.all([
        prisma.listingBooking.groupBy({
          by: ['status'],
          _count: true,
          where
        }),
        prisma.subCategoryBooking.groupBy({
          by: ['status'],
          _count: true,
          where
        })
      ]);

      // Combine status counts
      const statusCounts = {
        all: listingTotal + subCategoryTotal,
        pending: 0,
        confirmed: 0,
        complete: 0,
        cancelled: 0
      };

      // Process status counts
      [...listingStatusCounts, ...subCategoryStatusCounts].forEach(item => {
        const status = item.status.toLowerCase();
        if (statusCounts[status] !== undefined) {
          statusCounts[status] += item._count;
        }
      });

      return {
        success: true,
        data: {
          bookings: allBookings,
          stats: {
            totalBookings: statusCounts.all,
            totalUsers: userCount,
            statusBreakdown: {
              pending: statusCounts.pending,
              confirmed: statusCounts.confirmed,
              complete: statusCounts.complete,
              cancelled: statusCounts.cancelled
            }
          },
          pagination: {
            page,
            limit,
            total: statusCounts.all,
            pages: Math.ceil(statusCounts.all / limit)
          }
        }
      };

    } catch (error) {
      console.error("Error fetching all users bookings:", error);
      throw new AppError("Failed to fetch all users bookings", 500);
    }
  },

async getAllUsersBookingsGroupedByStatus(paginationOptions = {}) {
  try {
    // Set default pagination for each status
    const defaultPagination = { page: 1, limit: 10 };
    const statusPagination = {
      all: { ...defaultPagination, ...paginationOptions.all },
      pending: { ...defaultPagination, ...paginationOptions.pending },
      confirmed: { ...defaultPagination, ...paginationOptions.confirmed },
      complete: { ...defaultPagination, ...paginationOptions.complete },
      cancelled: { ...defaultPagination, ...paginationOptions.cancelled }
    };

    // Fetch counts first for efficiency
    const [
      listingStatusCounts,
      subCategoryStatusCounts,
      totalUsers
    ] = await Promise.all([
      prisma.listingBooking.groupBy({
        by: ['status'],
        _count: true
      }),
      prisma.subCategoryBooking.groupBy({
        by: ['status'],
        _count: true
      }),
      prisma.user.count()
    ]);

    // Calculate total counts by status
    const statusCounts = {
      all: 0,
      pending: 0,
      confirmed: 0,
      complete: 0,
      cancelled: 0
    };

    [...listingStatusCounts, ...subCategoryStatusCounts].forEach(item => {
      const status = item.status.toLowerCase();
      if (statusCounts[status] !== undefined) {
        statusCounts[status] += item._count;
      }
      statusCounts.all += item._count;
    });

    // Initialize bookingsByStatus with proper keys
    const bookingsByStatus = {
      Pending: [],
      Confirmed: [],
      Complete: [],
      Cancelled: [],
      all: []
    };

    // Map lowercase keys to proper case for database queries and response
    const statusKeyMapping = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      complete: 'Complete',
      cancelled: 'Cancelled'
    };

    // Fetch data for each status with specific pagination
    const statusKeys = ['pending', 'confirmed', 'complete', 'cancelled'];
    
    await Promise.all(statusKeys.map(async (statusKey) => {
      const properCaseStatus = statusKeyMapping[statusKey];
      
      if (statusCounts[statusKey] > 0) {
        const { page, limit } = statusPagination[statusKey];
        const skip = (page - 1) * limit;
        
        const [listingBookings, subCategoryBookings] = await Promise.all([
          prisma.listingBooking.findMany({
            where: { status: properCaseStatus }, // Use proper case
            include: {
              listing: {
                select: {
                  id: true,
                  name: true,
                  main_image: true,
                  location: true,
                  specificCategory: {
                    select: {
                      name: true,
                      subCategory: {
                        select: {
                          name: true,
                          mainCategory: {
                            select: { name: true }
                          }
                        }
                      }
                    }
                  }
                }
              },
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  whatsapp: true,
                  package: true
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: skip
          }),
          prisma.subCategoryBooking.findMany({
            where: { status: properCaseStatus }, // Use proper case
            include: {
              subCategory: {
                select: {
                  name: true,
                  mainCategory: {
                    select: { name: true }
                  }
                }
              },
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  whatsapp: true,
                  package: true
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: skip
          })
        ]);

        // Transform and combine
        const transformed = [
          ...listingBookings.map(b => ({
            id: b.id,
            type: 'listing',
            userId: b.userId,
            status: b.status,
            createdAt: b.createdAt,
            listing: b.listing,
            user: b.user,
            bookingDetails: {
              date: b.bookingDate,
              time: b.bookingTime,
              venueName: b.venueName,
              guests: {
                adults: b.numberofguest_adult,
                children: b.numberofguest_child
              }
            }
          })),
          ...subCategoryBookings.map(b => ({
            id: b.id,
            type: 'subcategory',
            userId: b.userId,
            status: b.status,
            createdAt: b.createdAt,
            subCategory: b.subCategory,
            user: b.user,
            bookingInfo: b.bookingInfo
          }))
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        bookingsByStatus[properCaseStatus] = transformed;
      } else {
        bookingsByStatus[properCaseStatus] = [];
      }
    }));

    // Get all bookings with pagination
    const allPage = statusPagination.all.page;
    const allLimit = statusPagination.all.limit;
    const allSkip = (allPage - 1) * allLimit;

    const [allListingBookings, allSubCategoryBookings] = await Promise.all([
      prisma.listingBooking.findMany({
        include: {
          listing: {
            select: {
              id: true,
              name: true,
              main_image: true,
              location: true,
              specificCategory: {
                select: {
                  name: true,
                  subCategory: {
                    select: {
                      name: true,
                      mainCategory: {
                        select: { name: true }
                      }
                    }
                  }
                }
              }
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              whatsapp: true,
              package: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: allLimit,
        skip: allSkip
      }),
      prisma.subCategoryBooking.findMany({
        include: {
          subCategory: {
            select: {
              name: true,
              mainCategory: {
                select: { name: true }
              }
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              whatsapp: true,
              package: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: allLimit,
        skip: allSkip
      })
    ]);

    bookingsByStatus.all = [
      ...allListingBookings.map(b => ({
        id: b.id,
        type: 'listing',
        userId: b.userId,
        status: b.status,
        createdAt: b.createdAt,
        listing: b.listing,
        user: b.user,
        bookingDetails: {
          date: b.bookingDate,
          time: b.bookingTime,
          venueName: b.venueName,
          guests: {
            adults: b.numberofguest_adult,
            children: b.numberofguest_child
          }
        }
      })),
      ...allSubCategoryBookings.map(b => ({
        id: b.id,
        type: 'subcategory',
        userId: b.userId,
        status: b.status,
        createdAt: b.createdAt,
        subCategory: b.subCategory,
        user: b.user,
        bookingInfo: b.bookingInfo
      }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return {
      success: true,
      data: {
        bookings: bookingsByStatus,
        stats: {
          totalUsers,
          totalBookings: statusCounts.all,
          statusBreakdown: {
            pending: statusCounts.pending,
            confirmed: statusCounts.confirmed,
            complete: statusCounts.complete,
            cancelled: statusCounts.cancelled
          }
        },
        pagination: {
          all: {
            page: statusPagination.all.page,
            limit: statusPagination.all.limit,
            total: statusCounts.all,
            pages: Math.ceil(statusCounts.all / statusPagination.all.limit)
          },
          pending: {
            page: statusPagination.pending.page,
            limit: statusPagination.pending.limit,
            total: statusCounts.pending,
            pages: Math.ceil(statusCounts.pending / statusPagination.pending.limit)
          },
          confirmed: {
            page: statusPagination.confirmed.page,
            limit: statusPagination.confirmed.limit,
            total: statusCounts.confirmed,
            pages: Math.ceil(statusCounts.confirmed / statusPagination.confirmed.limit)
          },
          complete: {
            page: statusPagination.complete.page,
            limit: statusPagination.complete.limit,
            total: statusCounts.complete,
            pages: Math.ceil(statusCounts.complete / statusPagination.complete.limit)
          },
          cancelled: {
            page: statusPagination.cancelled.page,
            limit: statusPagination.cancelled.limit,
            total: statusCounts.cancelled,
            pages: Math.ceil(statusCounts.cancelled / statusPagination.cancelled.limit)
          }
        }
      }
    };

  } catch (error) {
    console.error("Error fetching all users bookings grouped by status:", error);
    throw new AppError("Failed to fetch grouped bookings", 500);
  }
}

  
};

export default subCategoryBookingService;