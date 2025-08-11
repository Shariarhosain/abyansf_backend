import { PrismaClient } from '@prisma/client';
import AppError from '../utils/error.js';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

const highlightService = {
  // Create a new highlight
async createHighlight(data) {
    try {
        const { subCategoryId, miniSubCategoryId, listingId, priority, specificCategoryId } = data;

        // Determine type based on which ID is provided
        let type;
        if (listingId) {
            type = 'LISTING';
        } else if (miniSubCategoryId) {
            type = 'MINI_CATEGORY';
        } else if (subCategoryId) {
            type = 'SUBCATEGORY';
        } else if (specificCategoryId) {
            type = 'SPECIFIC_CATEGORY';
        } else {
            throw new AppError('At least one ID (subCategoryId, miniSubCategoryId, or listingId) is required', 400);
        }

        // Verify that the referenced entity exists
        if (type === 'SUBCATEGORY') {
            const subCategory = await prisma.subCategory.findUnique({ where: { id: parseInt(subCategoryId) } });
            if (!subCategory) {
                throw new AppError('SubCategory not found', 404);
            }
        }
        if (type === 'MINI_CATEGORY') {
            const miniSubCategory = await prisma.miniSubCategory.findUnique({ where: { id: parseInt(miniSubCategoryId) } });
            if (!miniSubCategory) {
                throw new AppError('MiniSubCategory not found', 404);
            }
        }
        if (type === 'LISTING') {
            const listing = await prisma.listing.findUnique({ where: { id: parseInt(listingId) } });
            if (!listing) {
                throw new AppError('Listing not found', 404);
            }
        }


        if (type === 'SPECIFIC_CATEGORY') {
            const specificCategory = await prisma.specificCategory.findUnique({ where: { id: parseInt(specificCategoryId) } });
            if (!specificCategory) {
                throw new AppError('SpecificCategory not found', 404);
            }
        }
        // Get the highest priority and increment by 1
        let finalPriority;
        if (priority !== undefined) {
            finalPriority = parseInt(priority);
        } else {
            const highestPriorityHighlight = await prisma.highlight.findFirst({
                orderBy: { priority: 'desc' }
            });
            finalPriority = highestPriorityHighlight ? highestPriorityHighlight.priority + 1 : 1;
        }

        const highlightData = {
            type,
            priority: finalPriority,
            subCategoryId: type === 'SUBCATEGORY' ? parseInt(subCategoryId) : null,
            miniSubCategoryId: type === 'MINI_CATEGORY' ? parseInt(miniSubCategoryId) : null,
            listingId: type === 'LISTING' ? parseInt(listingId) : null,
            specificCategoryId: type === 'SPECIFIC_CATEGORY' ? parseInt(specificCategoryId) : null,
        };

        const highlight = await prisma.highlight.create({
            data: highlightData,
            include: {
                subCategory: true,
                miniSubCategory: true,
                listing: true,
                specificCategory: true,
            }
        });

        return {
            success: true,
            message: 'Highlight created successfully',
            data: highlight
        };
    } catch (error) {
        throw new AppError(`Failed to create highlight: ${error.message}`, 500);
    }
},

// Get all highlights with pagination and filtering
async getAllHighlights(page = 1, limit = 10, filters = {}) {
    try {
        const skip = (page - 1) * limit;
        const { type, isActive } = filters;

        const whereClause = { isActive: true }; // Default filter for active highlights
        if (type) whereClause.type = type;
        if (isActive !== undefined) whereClause.isActive = isActive === 'true';

        const [highlights, totalCount] = await Promise.all([
            prisma.highlight.findMany({
                where: whereClause,
                include: {
                    subCategory: true,
                    miniSubCategory: true,
                    listing: true,
                    specificCategory: true,
                },
                orderBy: [
                    { priority: 'asc' },
                    { createdAt: 'desc' }
                ],
                skip,
                take: limit,
            }),
            prisma.highlight.count({ where: whereClause })
        ]);

        const totalPages = Math.ceil(totalCount / limit);

        return {
            success: true,
            data: highlights,
            pagination: {
                currentPage: page,
                totalPages,
                totalCount,
                hasNext: page < totalPages,
                hasPrevious: page > 1
            }
        };
    } catch (error) {
        throw new AppError(`Failed to fetch highlights: ${error.message}`, 500);
    }
},

  // Get highlight by ID
  async getHighlightById(id) {
    try {
      const highlight = await prisma.highlight.findUnique({
        where: { id: parseInt(id) },
        include: {
          subCategory: true,
          miniSubCategory: true,
          listing: true,
          specificCategory: true,
        }
      });

      if (!highlight) {
        throw new AppError('Highlight not found', 404);
      }

      return {
        success: true,
        data: highlight
      };
    } catch (error) {
      throw new AppError(`Failed to fetch highlight: ${error.message}`, 500);
    }
  },

  // Update highlight
  async updateHighlight(id, data) {
    try {
      const existingHighlight = await prisma.highlight.findUnique({
        where: { id: parseInt(id) }
      });

      if (!existingHighlight) {
        throw new AppError('Highlight not found', 404);
      }

      const { type, subCategoryId, miniSubCategoryId, listingId, priority, isActive, specificCategoryId } = data;

      const updateData = {};
      if (type !== undefined) {
        updateData.type = type;
        // Reset all reference IDs when type changes
        updateData.subCategoryId = null;
        updateData.miniSubCategoryId = null;
        updateData.listingId = null;
        updateData.specificCategoryId = null;
      }
      if (priority !== undefined) updateData.priority = parseInt(priority);
      if (isActive !== undefined) updateData.isActive = isActive === 'true';

      // Set the appropriate reference ID based on type
      if (type === 'SUBCATEGORY' && subCategoryId) {
        updateData.subCategoryId = parseInt(subCategoryId);
      } else if (type === 'MINI_CATEGORY' && miniSubCategoryId) {
        updateData.miniSubCategoryId = parseInt(miniSubCategoryId);
      } else if (type === 'LISTING' && listingId) {
        updateData.listingId = parseInt(listingId);
      } else if (type === 'SPECIFIC_CATEGORY' && specificCategoryId) {
        updateData.specificCategoryId = parseInt(specificCategoryId);
      }
      

      const updatedHighlight = await prisma.highlight.update({
        where: { id: parseInt(id) },
        data: updateData,
        include: {
          subCategory: true,
          miniSubCategory: true,
          listing: true,
          specificCategory: true,
        }
      });

      return {
        success: true,
        message: 'Highlight updated successfully',
        data: updatedHighlight
      };
    } catch (error) {
      throw new AppError(`Failed to update highlight: ${error.message}`, 500);
    }
  },

  // Delete highlight
  async deleteHighlight(id) {
    try {
      const existingHighlight = await prisma.highlight.findUnique({
        where: { id: parseInt(id) }
      });

      if (!existingHighlight) {
        throw new AppError('Highlight not found', 404);
      }

      await prisma.highlight.delete({
        where: { id: parseInt(id) }
      });

      return {
        success: true,
        message: 'Highlight deleted successfully'
      };
    } catch (error) {
      throw new AppError(`Failed to delete highlight: ${error.message}`, 500);
    }
  },

  // Toggle highlight active status
  async toggleHighlightStatus(id) {
    try {
      const existingHighlight = await prisma.highlight.findUnique({
        where: { id: parseInt(id) }
      });

      if (!existingHighlight) {
        throw new AppError('Highlight not found', 404);
      }

      const updatedHighlight = await prisma.highlight.update({
        where: { id: parseInt(id) },
        data: { isActive: !existingHighlight.isActive },
        include: {
          subCategory: true,
          miniSubCategory: true,
          listing: true,
        }
      });

      return {
        success: true,
        message: `Highlight ${updatedHighlight.isActive ? 'activated' : 'deactivated'} successfully`,
        data: updatedHighlight
      };
    } catch (error) {
      throw new AppError(`Failed to toggle highlight status: ${error.message}`, 500);
    }
  },

  // Get highlights by type
  async getHighlightsByType(type, page = 1, limit = 10) {
    try {
      const validTypes = ['SUBCATEGORY', 'MINI_CATEGORY', 'LISTING'];
      if (!validTypes.includes(type)) {
        throw new AppError('Invalid highlight type', 400);
      }

      const skip = (page - 1) * limit;

      const [highlights, totalCount] = await Promise.all([
        prisma.highlight.findMany({
          where: { type, isActive: true },
          include: {
            subCategory: true,
            miniSubCategory: true,
            listing: true,
          },
          orderBy: [
            { priority: 'desc' },
            { createdAt: 'desc' }
          ],
          skip,
          take: limit,
        }),
        prisma.highlight.count({ where: { type, isActive: true } })
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        success: true,
        data: highlights,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNext: page < totalPages,
          hasPrevious: page > 1
        }
      };
    } catch (error) {
      throw new AppError(`Failed to fetch highlights by type: ${error.message}`, 500);
    }
  }
};

export default highlightService;
