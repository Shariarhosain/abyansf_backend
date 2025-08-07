import { PrismaClient } from '@prisma/client';
import AppError from '../utils/error.js';
import { uploadSingleImage, uploadMultipleImages, validateImageFile, deleteImage } from '../utils/imghelper.js';
import  dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

const categoryService = {
  // ============ MAIN CATEGORY OPERATIONS ============
  
  // Create main category
  async createMainCategory(data) {
    try {
      const { name } = data;

      if (!name) {
        throw new AppError('Category name is required', 400);
      }

      // Check if category already exists
      const existingCategory = await prisma.mainCategory.findUnique({
        where: { name }
      });

      if (existingCategory) {
        throw new AppError('Main category already exists', 400);
      }

      const mainCategory = await prisma.mainCategory.create({
        data: { name }
      });

      // Background task for any additional processing
      setImmediate(() => {
        console.log(`Main category "${name}" created successfully with ID: ${mainCategory.id}`);
        // Add any background logging or notifications here
      });

      return {
        success: true,
        message: 'Main category created successfully',
        data: mainCategory
      };
    } catch (error) {
      throw new AppError(`Failed to create main category: ${error.message}`, 400);
    }
  },

  // Get all main categories
  async getAllMainCategories(page = 1, limit = 100) {
    try {
      const skip = (page - 1) * limit;

      const [mainCategories, total] = await Promise.all([
        prisma.mainCategory.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            subCategories: {
              include: {
                specificCategories: true,
                miniSubCategory: true
              }
            }
          }
        }),
        prisma.mainCategory.count()
      ]);

      return {
        success: true,
        data: {
          mainCategories,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      };
    } catch (error) {
      throw new AppError(`Failed to fetch main categories: ${error.message}`, 500);
    }
  },

  // Get main category by ID
  async getMainCategoryById(id) {
    try {
      const mainCategory = await prisma.mainCategory.findUnique({
        where: { id: parseInt(id) },
        include: {
          subCategories: {
            include: {
              specificCategories: true
            }
          }
        }
      });

      if (!mainCategory) {
        throw new AppError('Main category not found', 404);
      }

      return {
        success: true,
        data: mainCategory
      };
    } catch (error) {
      throw new AppError(`Failed to fetch main category: ${error.message}`, 500);
    }
  },

  // Update main category
  async updateMainCategory(id, updateData) {
    try {
      const { name } = updateData;

      // Check if category exists
      const existingCategory = await prisma.mainCategory.findUnique({
        where: { id: parseInt(id) }
      });

      if (!existingCategory) {
        throw new AppError('Main category not found', 404);
      }

      // Check if new name already exists (if name is being updated)
      if (name && name !== existingCategory.name) {
        const nameExists = await prisma.mainCategory.findUnique({
          where: { name }
        });

        if (nameExists) {
          throw new AppError('Category name already exists', 400);
        }
      }

      const updatedCategory = await prisma.mainCategory.update({
        where: { id: parseInt(id) },
        data: updateData,
        include: {
          subCategories: true
        }
      });

      // Background task for logging updates
      setImmediate(() => {
        console.log(`Main category updated: ${existingCategory.name} -> ${updatedCategory.name}`);
      });

      return {
        success: true,
        message: 'Main category updated successfully',
        data: updatedCategory
      };
    } catch (error) {
      throw new AppError(`Failed to update main category: ${error.message}`, 400);
    }
  },

  // Delete main category
  async deleteMainCategory(id) {
    try {
      const mainCategory = await prisma.mainCategory.findUnique({
        where: { id: parseInt(id) },
        include: {
          subCategories: true
        }
      });

      if (!mainCategory) {
        throw new AppError('Main category not found', 404);
      }

      await prisma.mainCategory.delete({
        where: { id: parseInt(id) }
      });

      // Background cleanup tasks
      setImmediate(() => {
        console.log(`Main category "${mainCategory.name}" deleted successfully`);
        // Add any cleanup notifications or logging here
      });

      return {
        success: true,
        message: 'Main category deleted successfully'
      };
    } catch (error) {
      throw new AppError(`Failed to delete main category: ${error.message}`, 400);
    }
  },

  // ============ SUB CATEGORY OPERATIONS (MULTIPLE) ============

  // Create multiple sub categories with images
  async createMultipleSubCategories(data, files) {
    try {
      console.log(files, data);
      const { subCategories, mainCategoryId } = data;

      if (!subCategories || !Array.isArray(subCategories) || subCategories.length === 0) {
        throw new AppError('Sub categories array is required', 400);
      }

      if (!mainCategoryId) {
        throw new AppError('Main category ID is required', 400);
      }

      // Check if main category exists
      const mainCategory = await prisma.mainCategory.findUnique({
        where: { id: parseInt(mainCategoryId) }
      });

      if (!mainCategory) {
        throw new AppError('Main category not found', 404);
      }

      // Check for duplicate sub category names and collect existing ones
      const existingSubCategories = [];
      for (const subCategoryData of subCategories) {
        const existingSubCategory = await prisma.subCategory.findFirst({
          where: {
            name: subCategoryData.name,
            mainCategoryId: parseInt(mainCategoryId)
          }
        });

        if (existingSubCategory) {
          existingSubCategories.push(subCategoryData.name);
        }
      }

      if (existingSubCategories.length > 0) {
        throw new AppError(`Sub categories already exist in this main category: ${existingSubCategories.join(', ')}`, 400);
      }

      // Return success immediately and handle all processing in background
      setImmediate(async () => {
        try {
          const createdSubCategories = [];
          const errors = [];

          // Process all sub categories creation
          for (let i = 0; i < subCategories.length; i++) {
            try {
              const subCategoryData = subCategories[i];
              console.log("Creating sub category:", subCategoryData);

              const subCategory = await prisma.subCategory.create({
                data: {
                  name: subCategoryData.name,
                  img: null, // Initially null
                  hasSpecificCategory: subCategoryData.hasSpecificCategory === 'true' || subCategoryData.hasSpecificCategory === true || false,
                  contractWhatsapp: subCategoryData.contractWhatsapp === 'true' || subCategoryData.contractWhatsapp === true || false,
                  hasForm: subCategoryData.hasForm === 'true' || subCategoryData.hasForm === true || false,
                  fromName: subCategoryData.fromName || null,
                  mainCategoryId: parseInt(mainCategoryId)
                },
                include: {
                  mainCategory: true,
                  specificCategories: true
                }
              });

              createdSubCategories.push(subCategory);
              console.log(`Sub category "${subCategoryData.name}" created successfully`);

              // Upload image for this sub category if file exists
              if (files && files.images && files.images[i]) {
                try {
                  validateImageFile(files.images[i]);
                  const uploadResult = await uploadSingleImage(files.images[i]);

                  // Update sub category with image URL
                  await prisma.subCategory.update({
                    where: { id: subCategory.id },
                    data: { img: uploadResult.url }
                  });

                  console.log(`Image uploaded for sub category ID ${subCategory.id} (${subCategory.name}):`, uploadResult.filename);
                } catch (uploadError) {
                  console.error(`Image upload failed for sub category ID ${subCategory.id}:`, uploadError.message);
                }
              }
              if (files && files.heroImage && files.heroImage[i]) {
                try {
                  validateImageFile(files.heroImage[i]);
                  const heroUploadResult = await uploadSingleImage(files.heroImage[i]);

                  await prisma.heroSection.create({
                    data: {
                      imageUrl: heroUploadResult.url,
                      subCategoryId: subCategory.id
                    }
                  });

                  console.log(`Hero image uploaded for sub category ID ${subCategory.id} (${subCategory.name}):`, heroUploadResult.filename);
                } catch (heroUploadError) {
                  console.error(`Hero image upload failed for sub category ID ${subCategory.id}:`, heroUploadError.message);
                }
              }

            } catch (error) {
              errors.push(`Failed to create '${subCategories[i]?.name || 'unknown'}': ${error.message}`);
              console.error(`Error creating sub category '${subCategories[i]?.name || 'unknown'}':`, error.message);
            }
          }

          console.log(`Background processing completed: ${createdSubCategories.length} sub categories created, ${errors.length} errors`);

        } catch (backgroundError) {
          console.error("Background processing failed:", backgroundError.message);
        }
      });

      return {
        success: true,
        message: 'Sub categories creation initiated, processing in background',
        data: {
          mainCategoryId: parseInt(mainCategoryId),
          mainCategoryName: mainCategory.name,
          totalItemsToProcess: subCategories.length,
          hasFiles: !!(files && files.images && files.images.length > 0)
        }
      };
    } catch (error) {
      throw new AppError(`Failed to initiate sub categories creation: ${error.message}`, 400);
    }
  },


  async createSubCategory(data, files) {
    try {
      console.log(data);
      const { name, hasSpecificCategory: hasSpecificCategoryRaw = false, mainCategoryId, contractWhatsapp: contractWhatsappRaw = false, hasForm: hasFormRaw = false, fromName, hasMiniSubCategory: hasMiniSubCategoryRaw = false, description } = data;

      if (!name || !mainCategoryId) {
        throw new AppError('Sub category name and main category ID are required', 400);
      }

      // Check if main category exists
      const mainCategory = await prisma.mainCategory.findUnique({
        where: { id: parseInt(mainCategoryId) },
      });

      if (!mainCategory) {
        throw new AppError('Main category not found', 404);
      }

      // Check if sub category already exists
      const existingSubCategory = await prisma.subCategory.findFirst({
        where: {
          name,
          mainCategoryId: parseInt(mainCategoryId),
        },
      });

      if (existingSubCategory) {
        throw new AppError('Sub category already exists in this main category', 400);
      }

      // Return success immediately and handle everything in background
      setImmediate(async () => {
        try {
          // String to boolean conversion
          const hasSpecificCategory = hasSpecificCategoryRaw === 'true' || hasSpecificCategoryRaw === true;
          const contractWhatsapp = contractWhatsappRaw === 'true' || contractWhatsappRaw === true;
          const hasForm = hasFormRaw === 'true' || hasFormRaw === true;
          const hasMiniSubCategory = hasMiniSubCategoryRaw === 'true' || hasMiniSubCategoryRaw === true;

          // Format description as JSON if provided
          let formattedDescription = null;
          if (description) {
            try {
              // If description is already an object, use it directly
              if (typeof description === 'object') {
                formattedDescription = description;
              } else if (typeof description === 'string') {
                // Try to parse as JSON first, if it fails, wrap in content object
                try {
                  formattedDescription = JSON.parse(description);
                } catch {
                  formattedDescription = { content: description };
                }
              }
            } catch (jsonError) {
              console.warn('Failed to format description as JSON, setting to null:', jsonError.message);
              formattedDescription = null;
            }
          }

          // Create subCategory
          const subCategory = await prisma.subCategory.create({
            data: {
              name,
              img: null, // Initially null
              hasSpecificCategory,
              mainCategoryId: parseInt(mainCategoryId),
              description: formattedDescription,
              contractWhatsapp,
              hasForm,
              fromName,
              hasMiniSubCategory
            },
            include: {
              mainCategory: true,
              specificCategories: true,
            },
          });

          console.log(`Sub category "${name}" created successfully with ID: ${subCategory.id}`);

          // Handle image upload if file is provided
          if (files) {
            try {
              validateImageFile(files.image[0]);
              const uploadResult = await uploadSingleImage(files.image[0]);

              // Update sub category with image URL
              await prisma.subCategory.update({
                where: { id: subCategory.id },
                data: { img: uploadResult.url },
              });

              if(files.heroImage && files.heroImage[0]) {
                validateImageFile(files.heroImage[0]);
                const heroUploadResult = await uploadSingleImage(files.heroImage[0]);

                await prisma.heroSection.create({
                  data: {
                    imageUrl: heroUploadResult.url,
                    subCategoryId: subCategory.id,
                  }
                });

                console.log(`Hero image uploaded for sub category "${name}":`, heroUploadResult.url);
              }

              console.log(`Image uploaded for sub category "${name}":`, uploadResult.url);
            } catch (uploadError) {
              console.error(`Image upload failed for sub category "${name}":`, uploadError.message);
            }
          }

        } catch (backgroundError) {
          console.error(`Background processing failed for sub category "${name}":`, backgroundError.message);
        }
      });

      return {
        success: true,
        message: 'Sub category creation initiated, processing in background',
        data: {
          mainCategoryId: parseInt(mainCategoryId),
          mainCategoryName: mainCategory.name,
          subCategoryName: name,
          hasFile: !!files
        }
      };
    } catch (error) {
      throw new AppError(`Failed to initiate sub category creation: ${error.message}`, 400);
    }
  },

  // Get all sub categories
  async getAllSubCategories(page = 1, limit = 10, mainCategoryId = null) {
    try {
      const skip = (page - 1) * limit;
      const where = mainCategoryId ? { mainCategoryId: parseInt(mainCategoryId, 10) } : {};

      // Fetch both the sub-categories and the total count in parallel
      const [subCategories, total] = await Promise.all([
        prisma.subCategory.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            heroSection: {
              select: {
                imageUrl: true,
              }
            },
            mainCategory: true,
            specificCategories: {
              include: {
                listings: true
              }
            },
            miniSubCategory: true,
          }
        }),
        prisma.subCategory.count({ where })
      ]);

      // Format the description for each sub-category
      const formattedSubCategories = subCategories.map(subCategory => {
        // Create a mutable copy to avoid modifying the original object directly
        const modifiedSubCategory = { ...subCategory };
        
        if (modifiedSubCategory.description) {
          try {
            let descContent = '';
            
            // Extract content string from description object or convert if it's not an object
            if (typeof modifiedSubCategory.description === 'object' && modifiedSubCategory.description !== null && modifiedSubCategory.description.content) {
              descContent = modifiedSubCategory.description.content;
            } else if (typeof modifiedSubCategory.description === 'object' && modifiedSubCategory.description !== null) {
              // Fallback for objects without a 'content' property
              descContent = JSON.stringify(modifiedSubCategory.description);
            } else {
              // Handle cases where it might already be a string or other primitive type
              descContent = String(modifiedSubCategory.description);
            }
            
            // Enhanced formatting for better mobile and web display
            modifiedSubCategory.description = descContent
              .replace(/\\n/g, '\n')           // Replace escaped newlines with actual newlines
              .replace(/\n{3,}/g, '\n\n')      // Replace multiple consecutive newlines with double newlines
              .replace(/\t/g, '    ')          // Replace tabs with 4 spaces for better alignment
              .replace(/•\s*/g, '• ')          // Ensure bullet points have proper spacing
              .replace(/^\s*•/gm, '• ')        // Fix bullet points at start of lines
              .split('\n')                     // Split into lines
              .map(line => {
                const trimmed = line.trim();
                // Preserve structure for headers and bullet points
                if (trimmed.includes(':') && !trimmed.startsWith('•')) {
                  return `\n${trimmed}\n`;     // Add spacing around headers
                }
                if (trimmed.startsWith('•')) {
                  return `  ${trimmed}`;       // Indent bullet points
                }
                return trimmed;
              })
              .filter(line => line.length > 0) // Remove empty lines
              .join('\n')                      // Join with single newlines
              .replace(/\n{3,}/g, '\n\n')      // Clean up excessive newlines again
              .replace(/^\n+|\n+$/g, '')       // Remove leading/trailing newlines
              .trim();
              
          } catch (error) {
            console.warn(`Failed to format description for subcategory ${modifiedSubCategory.id}:`, error.message);
            // If formatting fails, set a default value
            modifiedSubCategory.description = "Description not available.";
          }
        } else {
          // If no description exists, provide a default value
          modifiedSubCategory.description = "";
        }
        
        return modifiedSubCategory;
      });

      return {
        success: true,
        data: {
          subCategories: formattedSubCategories,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      };
    } catch (error) {
      // Throw a structured application error for better error handling upstream
      throw new AppError(`Failed to fetch sub categories: ${error.message}`, 500);
    }
  },

    // Get sub category by ID with individual WhatsApp link
    async getSubCategoryById(id) {
      try {
        const subCategory = await prisma.subCategory.findUnique({
          where: { id: parseInt(id) },
          include: {
            heroSection: {
              select: {
                imageUrl: true,
              }
            },
            mainCategory: true,
            specificCategories: {
              include: {
                listings: true
              }
            },
            miniSubCategory: true // Include mini sub categories if needed
          }
        });

        if (!subCategory) {
          throw new AppError('Sub category not found', 404);
        }

        const result = {
          success: true,
          data: subCategory
        };

        // Add individual WhatsApp details if contractWhatsapp is true
        if (subCategory.contractWhatsapp === true) {
          result.data.adminWhatsApp = await this.getAdminWhatsAppForSubCategory(subCategory);
        }

        return result;
      } catch (error) {
        throw new AppError(`Failed to fetch sub category: ${error.message}`, 500);
      }
    },

    // Get admin WhatsApp for individual sub category
    async getAdminWhatsAppForSubCategory(subCategory) {
      try {
        // Get admin WhatsApp number
        const adminWhatsApp = await this.getAdminWhatsAppNumber();
        
        // Create inquiry message for this specific category
        const inquiryDetails = {
          serviceName: subCategory.name,
          serviceId: subCategory.id,
          mainCategory: subCategory.mainCategory?.name,
          description: subCategory.description,
          listingsCount: subCategory.specificCategories?.reduce((total, spec) => 
            total + (spec.listings?.length || 0), 0) || 0,
          imageUrl: subCategory.heroSection?.imageUrl || subCategory.img,
          specificCategories: subCategory.specificCategories?.map(spec => ({
            name: spec.name,
            listingsCount: spec.listings?.length || 0
          })) || []
        };

        return {
          whatsapp: adminWhatsApp.whatsapp,
          whatsappLink: adminWhatsApp.whatsappLink,
          whatsappLinkWithInquiry: this.generateServiceInquiryLink(
            adminWhatsApp.whatsapp, 
            inquiryDetails
          ),
          mobileWhatsappLink: this.generateMobileWhatsAppLink(
            adminWhatsApp.whatsapp,
            inquiryDetails
          ),
          serviceName: subCategory.name,
          message: `Service inquiry available for ${subCategory.name}`
        };
      } catch (error) {
        throw new AppError(`Failed to get admin WhatsApp for category: ${error.message}`, 500);
      }
    },

    // Generate WhatsApp link with service inquiry message
    generateServiceInquiryLink(phoneNumber, inquiryDetails) {
      let cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
      
      if (cleanNumber.startsWith('+')) {
        cleanNumber = cleanNumber.substring(1);
      }
      
      if (cleanNumber.length < 10) {
        throw new Error('Invalid phone number format');
      }

      const message = this.createServiceInquiryMessage(inquiryDetails);
      const encodedMessage = encodeURIComponent(message);
      return `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
    },

    // Generate mobile WhatsApp link
    generateMobileWhatsAppLink(phoneNumber, inquiryDetails) {
      let cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
      
      if (cleanNumber.startsWith('+')) {
        cleanNumber = cleanNumber.substring(1);
      }
      
      if (cleanNumber.length < 10) {
        throw new Error('Invalid phone number format');
      }

      const message = this.createServiceInquiryMessage(inquiryDetails);
      const encodedMessage = encodeURIComponent(message);
      return `whatsapp://send?phone=${cleanNumber}&text=${encodedMessage}`;
    },

    // Create beautiful service inquiry message
    createServiceInquiryMessage(details) {
      let message = `Hello Admin!\n\n`;
      message += `SERVICE INQUIRY\n\n`;
      
      message += `Service Name: ${details.serviceName}\n`;
      
      // Add description if available - send line by line from JSON
      if (details.description) {
        let descriptionText = '';
        try {
          if (typeof details.description === 'object' && details.description !== null) {
        // If it's already an object, extract content line by line
        if (details.description.content) {
          descriptionText = details.description.content;
        } else {
          // Convert object to readable format - handle nested objects properly
          descriptionText = Object.entries(details.description)
            .map(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            // Handle nested objects
            const nestedContent = Object.entries(value)
              .map(([nestedKey, nestedValue]) => `  ${nestedKey}: ${nestedValue}`)
              .join('\n');
            return `${key}:\n${nestedContent}`;
          }
          return `${key}: ${value}`;
            })
            .join('\n');
        }
          } else if (typeof details.description === 'string') {
        // Try to parse as JSON first
        try {
          const parsed = JSON.parse(details.description);
          if (parsed.content) {
            descriptionText = parsed.content;
          } else {
            descriptionText = Object.entries(parsed)
          .map(([key, value]) => {
            if (typeof value === 'object' && value !== null) {
              // Handle nested objects in parsed JSON
              const nestedContent = Object.entries(value)
            .map(([nestedKey, nestedValue]) => `  ${nestedKey}: ${nestedValue}`)
            .join('\n');
              return `${key}:\n${nestedContent}`;
            }
            return `${key}: ${value}`;
          })
          .join('\n');
          }
        } catch {
          // If not valid JSON, use as plain text
          descriptionText = details.description.trim();
        }
          } else {
        descriptionText = String(details.description).trim();
          }
          
          if (descriptionText) {
        // Format description line by line
        const formattedDescription = descriptionText
          .replace(/\\n/g, '\n')
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .join('\n');
        
        message += `Description:\n${formattedDescription}\n`;
          }
        } catch (error) {
          // Fallback in case of any errors
          console.warn('Error formatting description for WhatsApp message:', error);
          message += `Description: Service details available\n`;
        }
      }
      
      message += `\nINQUIRY PURPOSE:\n`;
      message += `I'm interested in contract opportunities for this service.\n\n`;
      
      message += `QUESTIONS:\n`;
      message += `- What contract services are available for this service?\n`;
      message += `- What are the terms and pricing?\n`;
      message += `- What are the requirements to get started?\n`;
      message += `- How does the contract process work?\n`;
      message += `- Are there any special offers or packages?\n\n`;
      
      message += `Please provide detailed information about contract opportunities for this service.\n\n`;
      message += `Thank you for your time!`;

      return message;
    },

  // Get admin WhatsApp number (reuse from previous service)
  async getAdminWhatsAppNumber() {
    try {
      const envWhatsApp = process.env.ADMIN_WHATSAPP_NUMBER;
      let whatsappNumber;
      
      if (envWhatsApp) {
        whatsappNumber = envWhatsApp;
      } else {
        const adminUser = await prisma.user.findFirst({
          where: { role: "ADMIN" },
          select: { whatsapp: true },
        });
        
        if (!adminUser || !adminUser.whatsapp) {
          throw new AppError("Admin WhatsApp number not found", 404);
        }
        
        whatsappNumber = adminUser.whatsapp;
      }

      return {
        whatsapp: whatsappNumber,
        whatsappLink: this.generateBasicWhatsAppLink(whatsappNumber)
      };
    } catch (error) {
      throw new AppError(`Failed to get admin WhatsApp: ${error.message}`, 500);
    }
  },

  // Generate basic WhatsApp link
  generateBasicWhatsAppLink(phoneNumber) {
    const cleanNumber = phoneNumber.replace(/[^\d+]/g, '').replace('+', '');
    return `https://wa.me/${cleanNumber}`;
  },

  // Helper method to get only WhatsApp enabled categories
  async getWhatsAppEnabledCategories(mainCategoryId = null) {
    try {
      const where = {
        contractWhatsapp: true,
        ...(mainCategoryId && { mainCategoryId: parseInt(mainCategoryId) })
      };

      const categories = await prisma.subCategory.findMany({
        where,
        include: {
          heroSection: {
            select: { imageUrl: true }
          },
          mainCategory: true,
          specificCategories: {
            include: { listings: true }
          }
        }
      });

      if (categories.length === 0) {
        return {
          success: true,
          message: "No categories with WhatsApp contract option found",
          data: []
        };
      }

      // Add individual WhatsApp links to each category
      const categoriesWithWhatsApp = await Promise.all(
        categories.map(async (category) => {
          const adminWhatsApp = await this.getAdminWhatsAppForSubCategory(category);
          return {
            ...category,
            adminWhatsApp
          };
        })
      );

      return {
        success: true,
        data: {
          categories: categoriesWithWhatsApp,
          totalWhatsAppEnabled: categoriesWithWhatsApp.length
        }
      };
    } catch (error) {
      throw new AppError(`Failed to get WhatsApp enabled categories: ${error.message}`, 500);
    }
  },



















async updateSubCategory(id, updateData, files) {
  try {
    const { name, hasSpecificCategory, mainCategoryId, contractWhatsapp, hasForm, fromName, description } = updateData;

    // Check if sub category exists
    const existingSubCategory = await prisma.subCategory.findUnique({
      where: { id: parseInt(id) },
      include: { heroSection: true }
    });

    if (!existingSubCategory) {
      throw new AppError('Sub category not found', 404);
    }

    // Check if main category exists (if being updated)
    if (mainCategoryId) {
      const mainCategory = await prisma.mainCategory.findUnique({
        where: { id: parseInt(mainCategoryId) }
      });
      if (!mainCategory) {
        throw new AppError('Main category not found', 404);
      }
    }

    // Check for duplicate name in the same main category
    if (name) {
      const targetMainCategoryId = mainCategoryId || existingSubCategory.mainCategoryId;
      const duplicateCheck = await prisma.subCategory.findFirst({
        where: {
          name,
          mainCategoryId: parseInt(targetMainCategoryId),
          id: { not: parseInt(id) }
        }
      });
      if (duplicateCheck) {
        throw new AppError('Sub category name already exists in this main category', 400);
      }
    }

    // Return success immediately and handle all processing in background
    setImmediate(async () => {
      try {
        // Update sub category data
       await prisma.subCategory.update({
          where: { id: parseInt(id) },
          data: {
            ...(name && { name }),
            ...(hasSpecificCategory !== undefined && {
              hasSpecificCategory: hasSpecificCategory === 'true' || hasSpecificCategory === true
            }),
            ...(mainCategoryId && { mainCategoryId: parseInt(mainCategoryId) }),
            ...(contractWhatsapp !== undefined && { 
              contractWhatsapp: contractWhatsapp === 'true' || contractWhatsapp === true 
            }),
            ...(hasForm !== undefined && { 
              hasForm: hasForm === 'true' || hasForm === true 
            }),
            ...(fromName !== undefined && { fromName }),
    
            ...(description && { description: typeof description === 'object' ? description : JSON.parse(description) })
          },
          include: {
            mainCategory: true,
            specificCategories: true,
            heroSection: true
          }
        });

        console.log(`Sub category "${existingSubCategory.name}" updated successfully`);

        // Handle sub category image update
        if (files?.image?.[0]) {
          try {
            validateImageFile(files.image[0]);

            // Delete old sub category image if exists
            if (existingSubCategory.img) {
              try {
                const oldFilename = existingSubCategory.img.split('/').pop();
                await deleteImage(oldFilename);
                console.log("Old sub category image deleted:", oldFilename);
              } catch (deleteError) {
                console.warn("Failed to delete old sub category image:", deleteError.message);
              }
            }

            // Upload new sub category image
            const uploadResult = await uploadSingleImage(files.image[0]);
            
            // Update sub category with new image URL
            await prisma.subCategory.update({
              where: { id: parseInt(id) },
              data: { img: uploadResult.url }
            });

            console.log("Sub category image updated:", uploadResult.url);
          } catch (imageError) {
            console.error("Sub category image update failed:", imageError.message);
          }
        }

        // Handle hero image update
        if (files?.heroImage?.[0]) {
          try {
            validateImageFile(files.heroImage[0]);

            // Delete old hero image if exists
            if (existingSubCategory.heroSection?.imageUrl) {
              try {
                const oldFilename = existingSubCategory.heroSection.imageUrl.split('/').pop();
                await deleteImage(oldFilename);
                console.log("Old hero image deleted:", oldFilename);
              } catch (deleteError) {
                console.warn("Failed to delete old hero image:", deleteError.message);
              }
            }

            // Upload new hero image
            const uploadResult = await uploadSingleImage(files.heroImage[0]);
            
            // Update or create hero section
            await prisma.heroSection.upsert({
              where: { subCategoryId: parseInt(id) },
              update: { imageUrl: uploadResult.url },
              create: {
                imageUrl: uploadResult.url,
                subCategoryId: parseInt(id)
              }
            });

            console.log("Hero image updated:", uploadResult.url);
          } catch (heroError) {
            console.error("Hero image update failed:", heroError.message);
          }
        }

      } catch (backgroundError) {
        console.error("Background processing failed:", backgroundError.message);
      }
    });

    return {
      success: true,
      message: 'Sub category update initiated, processing in background',
    };
  } catch (error) {
    throw new AppError(`Failed to initiate sub category update: ${error.message}`, 400);
  }
},


  // Delete sub category with image cleanup
  async deleteSubCategory(id) {
    try {
      const subCategory = await prisma.subCategory.findUnique({
        where: { id: parseInt(id) },
        include: {
          specificCategories: true
        }
      });

      if (!subCategory) {
        throw new AppError('Sub category not found', 404);
      }

      await prisma.subCategory.delete({
        where: { id: parseInt(id) }
      });

      // Background cleanup tasks
      setImmediate(async () => {
        // Delete associated image if exists
        if (subCategory.img) {
          try {
            const filename = subCategory.img.split('/').pop();
            await deleteImage(filename);
            console.log("Sub category image deleted:", filename);
          } catch (deleteError) {
            console.warn("Failed to delete sub category image:", deleteError.message);
          }
        }
        
        console.log(`Sub category "${subCategory.name}" deleted successfully`);
      });

      return {
        success: true,
        message: 'Sub category deleted successfully'
      };
    } catch (error) {
      throw new AppError(`Failed to delete sub category: ${error.message}`, 400);
    }
  },

  // ============ SPECIFIC CATEGORY OPERATIONS (MULTIPLE WITH HERO IMAGES) ============

  // Create multiple specific categories with hero section images
  async createMultipleSpecificCategories(data, heroImageFile) {
    try {
      const { specificCategories, subCategoryId } = data;

      if (!specificCategories || !Array.isArray(specificCategories) || specificCategories.length === 0) {
        throw new AppError('Specific categories array is required', 400);
      }

      if (!subCategoryId) {
        throw new AppError('Sub category ID is required', 400);
      }

      // Check if sub category exists
      const subCategory = await prisma.subCategory.findUnique({
        where: { id: parseInt(subCategoryId) },
        include: { heroSection: true }
      });

      if (!subCategory) {
        throw new AppError('Sub category not found', 404);
      }

      // Return success immediately and handle all processing in background
      setImmediate(async () => {
        try {
          let heroImageUrl = null;

          // Handle hero image upload if provided
          if (heroImageFile) {
            try {
              validateImageFile(heroImageFile.heroImage[0]);
              const uploadResult = await uploadSingleImage(heroImageFile.heroImage[0]);
              heroImageUrl = uploadResult.url;
              
              // Delete old hero image if exists
              if (subCategory.heroSection?.imageUrl) {
                try {
                  const oldFilename = subCategory.heroSection.imageUrl.split('/').pop();
                  await deleteImage(oldFilename);
                  console.log("Old hero image deleted:", oldFilename);
                } catch (deleteError) {
                  console.warn("Failed to delete old hero image:", deleteError.message);
                }
              }

              // Update/create hero section
              await prisma.heroSection.upsert({
                where: { subCategoryId: parseInt(subCategoryId) },
                update: { imageUrl: heroImageUrl },
                create: {
                  imageUrl: heroImageUrl,
                  subCategoryId: parseInt(subCategoryId)
                }
              });

              console.log("Hero image uploaded and updated:", heroImageUrl);
            } catch (uploadError) {
              console.error("Hero image upload failed:", uploadError.message);
            }
          }

          // Process specific categories creation
          const createdSpecificCategories = [];
          const errors = [];

          for (const specificCategoryData of specificCategories) {
            try {
              // Check if specific category already exists
              const existingSpecificCategory = await prisma.specificCategory.findFirst({
                where: {
                  name: specificCategoryData.name,
                  subCategoryId: parseInt(subCategoryId)
                }
              });

              if (existingSpecificCategory) {
                errors.push(`Specific category '${specificCategoryData.name}' already exists`);
                continue;
              }

              const specificCategory = await prisma.specificCategory.create({
                data: {
                  name: specificCategoryData.name,
                  subCategoryId: parseInt(subCategoryId)
                },
                include: {
                  subCategory: {
                    include: {
                      mainCategory: true,
                      heroSection: true
                    }
                  }
                }
              });

              createdSpecificCategories.push(specificCategory);
              console.log(`Specific category "${specificCategoryData.name}" created successfully`);

            } catch (error) {
              errors.push(`Failed to create '${specificCategoryData.name}': ${error.message}`);
              console.error(`Error creating specific category '${specificCategoryData.name}':`, error.message);
            }
          }

          console.log(`Background processing completed: ${createdSpecificCategories.length} specific categories created, ${errors.length} errors`);
          if (heroImageUrl) {
            console.log(`Hero image applied to sub category "${subCategory.name}"`);
          }

        } catch (backgroundError) {
          console.error("Background processing failed:", backgroundError.message);
        }
      });

      return {
        success: true,
        message: 'Specific categories creation initiated, processing in background',
        data: {
          subCategoryId: parseInt(subCategoryId),
          subCategoryName: subCategory.name,
          totalItemsToProcess: specificCategories.length,
          hasHeroImage: !!heroImageFile
        }
      };
    } catch (error) {
      throw new AppError(`Failed to initiate specific categories creation: ${error.message}`, 400);
    }
  },

  // Create single specific category with hero image
  async createSpecificCategory(data) {
    try {
      const { name, subCategoryId } = data;

      if (!name || !subCategoryId) {
        throw new AppError('Specific category name and sub category ID are required', 400);
      }

      // Check if sub category exists
      const subCategory = await prisma.subCategory.findUnique({
        where: { id: parseInt(subCategoryId) },
        include: { heroSection: true }
      });

      if (!subCategory) {
        throw new AppError('Sub category not found', 404);
      }

      // Check if specific category already exists in this sub category
      const existingSpecificCategory = await prisma.specificCategory.findFirst({
        where: {
          name,
          subCategoryId: parseInt(subCategoryId)
        }
      });

      if (existingSpecificCategory) {
        throw new AppError('Specific category already exists in this sub category', 400);
      }

      const specificCategory = await prisma.specificCategory.create({
        data: {
          name,
          subCategoryId: parseInt(subCategoryId)
        },
        include: {
          subCategory: {
            include: {
              mainCategory: true,
              heroSection: true
            }
          }
        }
      });

      // Background task for logging
      setImmediate(() => {
        console.log(`Specific category "${name}" created under sub category "${subCategory.name}"`);
      });

      return {
        success: true,
        message: 'Specific category created successfully',
        data: specificCategory
      };
    } catch (error) {
      throw new AppError(`Failed to create specific category: ${error.message}`, 400);
    }
  },

  async getAllSpecificCategories(page = 1, limit = 10, subCategoryId = null) {
    try {
      const skip = (page - 1) * limit;
      const where = subCategoryId ? { subCategoryId: parseInt(subCategoryId) } : {};

      const [specificCategories, total] = await Promise.all([
        prisma.specificCategory.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            subCategory: {
              include: {
                mainCategory: true,
                heroSection: true
              }
            },
            listings: true
          }
        }),
        prisma.specificCategory.count({ where })
      ]);

      // Transform data if subCategoryId is provided
      if (subCategoryId) {
        // Get subcategory details first
        const subCategory = specificCategories.length > 0 ? specificCategories[0].subCategory : null;
        
        const transformedSpecificCategories = specificCategories.map(category => ({
          id: category.id,
          name: category.name,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt,
          listings: category.listings
        }));

        return {
          success: true,
          data: {
            subCategory: {
              id: subCategory?.id,
              name: subCategory?.name,
              img: subCategory?.img,
              hasSpecificCategory: subCategory?.hasSpecificCategory,
              mainCategoryId: subCategory?.mainCategoryId,
              createdAt: subCategory?.createdAt,
              updatedAt: subCategory?.updatedAt,
              mainCategory: subCategory?.mainCategory,
              herosection_img: subCategory?.heroSection?.imageUrl || null
            },
            specificCategories: transformedSpecificCategories,
            pagination: {
              page,
              limit,
              total,
              pages: Math.ceil(total / limit)
            }
          }
        };
      }

      return {
        success: true,
        data: {
          specificCategories,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      };
    } catch (error) {
      throw new AppError(`Failed to fetch specific categories: ${error.message}`, 500);
    }
  },

  // Get specific category by ID
  async getSpecificCategoryById(id) {
    try {
      const specificCategory = await prisma.specificCategory.findUnique({
        where: { id: parseInt(id) },
        include: {
          subCategory: {
            include: {
              mainCategory: true
            }
          },
          listings: true,
        }
      });

      if (!specificCategory) {
        throw new AppError('Specific category not found', 404);
      }

      return {
        success: true,
        data: specificCategory
      };
    } catch (error) {
      throw new AppError(`Failed to fetch specific category: ${error.message}`, 500);
    }
  },

  // Update specific category
  async updateSpecificCategory(id, updateData) {
    try {
      const { name, subCategoryId } = updateData;

      // Check if specific category exists
      const existingSpecificCategory = await prisma.specificCategory.findUnique({
        where: { id: parseInt(id) }
      });

      if (!existingSpecificCategory) {
        throw new AppError('Specific category not found', 404);
      }

      // Check if sub category exists (if being updated)
      let subCategory = null;
      if (subCategoryId) {
        subCategory = await prisma.subCategory.findUnique({
          where: { id: parseInt(subCategoryId) }
        });

        if (!subCategory) {
          throw new AppError('Sub category not found', 404);
        }
      }

      // Check for duplicate name in the same sub category
      if (name) {
        const targetSubCategoryId = subCategoryId || existingSpecificCategory.subCategoryId;
        const duplicateCheck = await prisma.specificCategory.findFirst({
          where: {
            name,
            subCategoryId: parseInt(targetSubCategoryId),
            id: { not: parseInt(id) }
          }
        });

        if (duplicateCheck) {
          throw new AppError('Specific category name already exists in this sub category', 400);
        }
      }

      // Return success immediately and handle update in background
      setImmediate(async () => {
        try {
         

          const updatedSpecificCategory = await prisma.specificCategory.update({
            where: { id: parseInt(id) },
            data: {
              ...(name && { name }),
              ...(subCategoryId && { subCategoryId: parseInt(subCategoryId) })
            },
           
          });

          if(subCategoryId) {
            // Update the target subcategory to have hasSpecificCategory: true
            await prisma.subCategory.update({
              where: { id: parseInt(subCategoryId) },
              data: {
                hasSpecificCategory: true
              }
            });
            
            // Check if the old subcategory still has other specific categories
            const oldSubCategorySpecificCategories = await prisma.specificCategory.findMany({
              where: { subCategoryId: existingSpecificCategory.subCategoryId }
            });
            
            // If the old subcategory has no more specific categories, set hasSpecificCategory to false
            if (oldSubCategorySpecificCategories.length === 0) {
              await prisma.subCategory.update({
                where: { id: existingSpecificCategory.subCategoryId },
                data: { hasSpecificCategory: false }
              });
            }
          }

          console.log(`Specific category "${existingSpecificCategory.name}" updated successfully to "${updatedSpecificCategory.name}"`);
        } catch (updateError) {
          console.error(`Failed to update specific category in background: ${updateError.message}`);
        }
      });

      return {
        success: true,
        message: 'Specific category update initiated, processing in background',
        data: {
          id: parseInt(id),
          previousName: existingSpecificCategory.name,
          newName: name || existingSpecificCategory.name,
          subCategoryId: subCategoryId || existingSpecificCategory.subCategoryId
        }
      };
    } catch (error) {
      throw new AppError(`Failed to initiate specific category update: ${error.message}`, 400);
    }
  },

  // Delete specific category
  async deleteSpecificCategory(id) {
    try {
      const specificCategory = await prisma.specificCategory.findUnique({
        where: { id: parseInt(id) },
        include: {
          listings: true,
        }
      });

      if (!specificCategory) {
        throw new AppError('Specific category not found', 404);
      }

      await prisma.specificCategory.delete({
        where: { id: parseInt(id) }
      });

      // Background cleanup tasks
      setImmediate(async () => {
        // Delete hero section image if exists
        if (specificCategory.heroSection?.imageUrl) {
          try {
            const filename = specificCategory.heroSection.imageUrl.split('/').pop();
            await deleteImage(filename);
            console.log("Hero section image deleted:", filename);
          } catch (deleteError) {
            console.warn("Failed to delete hero section image:", deleteError.message);
          }
        }
        
        console.log(`Specific category "${specificCategory.name}" deleted successfully`);

        // from specificCategory check if it was the last one in its sub category, then set sub category hasSpecificCategory to false
        const subCategoryUpdate = await prisma.subCategory.update({
          where: { id: specificCategory.subCategoryId },
          data: {
            hasSpecificCategory: false
          }
        });
        console.log(`Sub category "${subCategoryUpdate.name}" hasSpecificCategory set to false`);
      });

      return {
        success: true,
        message: 'Specific category deleted successfully'
      };
    } catch (error) {
      throw new AppError(`Failed to delete specific category: ${error.message}`, 400);
    }
  },

  // ============ HERO SECTION OPERATIONS ============

  // Get all hero sections
  async getAllHeroSections() {
    try {
      const heroSections = await prisma.heroSection.findMany({
        include: {
          subCategory: {
            include: {
              mainCategory: true,
              specificCategories: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return {
        success: true,
        data: heroSections
      };
    } catch (error) {
      throw new AppError(`Failed to fetch hero sections: ${error.message}`, 500);
    }
  },

  // Upload hero image for sub category (NEW)
  async uploadHeroImage(subCategoryId, heroImageFile) {
    try {
      if (!heroImageFile) {
        throw new AppError('Hero image file is required', 400);
      }

      // Check if sub category exists
      const subCategory = await prisma.subCategory.findUnique({
        where: { id: parseInt(subCategoryId) },
        include: { heroSection: true }
      });

      if (!subCategory) {
        throw new AppError('Sub category not found', 404);
      }

      // Check if hero section already exists
      if (subCategory.heroSection) {
        throw new AppError('Hero section already exists for this sub category. Use PUT to update.', 400);
      }

      // Return success immediately and handle all processing in background
      setImmediate(async () => {
        try {
          // Upload hero image
          validateImageFile(heroImageFile.heroImage[0]);
          const uploadResult = await uploadSingleImage(heroImageFile.heroImage[0]);
          const imageUrl = uploadResult.url;

          // Create hero section
          const heroSection = await prisma.heroSection.create({
            data: {
              imageUrl: imageUrl,
              subCategoryId: parseInt(subCategoryId)
            },
            include: {
              subCategory: {
                include: {
                  mainCategory: true,
                  specificCategories: true
                }
              }
            }
          });

          console.log(`Hero section created for sub category: ${subCategory.name} with image: ${imageUrl}`);
        } catch (backgroundError) {
          console.error(`Background processing failed for hero image upload: ${backgroundError.message}`);
        }
      });

      return {
        success: true,
        message: 'Hero image upload initiated, processing in background',
        data: {
          subCategoryId: parseInt(subCategoryId),
          subCategoryName: subCategory.name,
          hasFile: true
        }
      };
    } catch (error) {
      throw new AppError(`Failed to initiate hero image upload: ${error.message}`, 400);
    }
  },

  // Update hero section image (EXISTING - MODIFIED FOR BACKGROUND PROCESSING)
  async updateHeroSectionImage(subCategoryId, heroImageFile) {
    try {
      if (!heroImageFile || !heroImageFile.heroImage || !heroImageFile.heroImage[0]) {
        throw new AppError('Hero image file is required', 400);
      }

      // Check if sub category exists
      const subCategory = await prisma.subCategory.findUnique({
        where: { id: parseInt(subCategoryId) },
        include: { heroSection: true }
      });

      if (!subCategory) {
        throw new AppError('Sub category not found', 404);
      }

      if (!subCategory.heroSection) {
        throw new AppError('No hero section found for this sub category. Use POST to create one.', 404);
      }

      // Return success immediately and handle all processing in background
      setImmediate(async () => {
        try {
          // Delete old hero image first if exists
          if (subCategory.heroSection?.imageUrl) {
            try {
              const oldFilename = subCategory.heroSection.imageUrl.split('/').pop();
              await deleteImage(oldFilename);
              console.log("Old hero image deleted:", oldFilename);
            } catch (deleteError) {
              console.warn("Failed to delete old hero image:", deleteError.message);
            }
          }

          // Upload new hero image
          validateImageFile(heroImageFile.heroImage[0]);
          const uploadResult = await uploadSingleImage(heroImageFile.heroImage[0]);
          const newImageUrl = uploadResult.url;

          // Update or create hero section
          await prisma.heroSection.upsert({
            where: { subCategoryId: parseInt(subCategoryId) },
            update: { imageUrl: newImageUrl },
            create: {
              imageUrl: newImageUrl,
              subCategoryId: parseInt(subCategoryId)
            },
            include: {
              subCategory: {
                include: {
                  mainCategory: true,
                  specificCategories: true
                }
              }
            }
          });

          console.log(`Hero section image updated for sub category: ${subCategory.name} with new image: ${newImageUrl}`);

        } catch (backgroundError) {
          console.error(`Background processing failed for hero section image update: ${backgroundError.message}`);
        }
      });

      return {
        success: true,
        message: 'Hero section image update initiated, processing in background',
        data: {
          subCategoryId: parseInt(subCategoryId),
          subCategoryName: subCategory.name,
          hasFile: true
        }
      };
    } catch (error) {
      throw new AppError(`Failed to initiate hero section image update: ${error.message}`, 400);
    }
  },

  // Delete hero section for sub category (NEW)
  async deleteHeroSection(subCategoryId) {
    try {
      // Check if sub category exists
      const subCategory = await prisma.subCategory.findUnique({
        where: { id: parseInt(subCategoryId) },
        include: { heroSection: true }
      });

      if (!subCategory) {
        throw new AppError('Sub category not found', 404);
      }

      if (!subCategory.heroSection) {
        throw new AppError('No hero section found for this sub category', 404);
      }

      // Delete hero section
      await prisma.heroSection.delete({
        where: { subCategoryId: parseInt(subCategoryId) }
      });

      // Background image cleanup
      setImmediate(async () => {
        // Delete hero image file
        if (subCategory.heroSection.imageUrl) {
          try {
            const filename = subCategory.heroSection.imageUrl.split('/').pop();
            await deleteImage(filename);
            console.log("Hero section image deleted:", filename);
          } catch (deleteError) {
            console.warn("Failed to delete hero section image:", deleteError.message);
          }
        }
        
        console.log(`Hero section deleted for sub category: ${subCategory.name}`);
      });

      return {
        success: true,
        message: 'Hero section deleted successfully'
      };
    } catch (error) {
      throw new AppError(`Failed to delete hero section: ${error.message}`, 400);
    }
  },

  // ============ UTILITY OPERATIONS ============

  // Get category hierarchy
  async getCategoryHierarchy() {
    try {
      const hierarchy = await prisma.mainCategory.findMany({
        include: {
          subCategories: {
            include: {
              specificCategories: {
                include: {
                  heroSection: true
                }
              }
            }
          }
        },
        orderBy: { name: 'asc' }
      });

      return {
        success: true,
        data: hierarchy
      };
    } catch (error) {
      throw new AppError(`Failed to fetch category hierarchy: ${error.message}`, 500);
    }
  },

  // Search categories by name
  async searchCategories(searchTerm, type = 'all') {
    try {
      const results = {};

      if (type === 'all' || type === 'main') {
        results.mainCategories = await prisma.mainCategory.findMany({
          where: {
            name: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          },
          include: {
            subCategories: true
          }
        });
      }

      if (type === 'all' || type === 'sub') {
        results.subCategories = await prisma.subCategory.findMany({
          where: {
            name: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          },
          include: {
            mainCategory: true,
            specificCategories: true
          }
        });
      }

      if (type === 'all' || type === 'specific') {
        results.specificCategories = await prisma.specificCategory.findMany({
          where: {
            name: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          },
          include: {
            subCategory: {
              include: {
                mainCategory: true
              }
            },
            heroSection: true
          }
        });
      }

      return {
        success: true,
        data: results
      };
    } catch (error) {
      throw new AppError(`Failed to search categories: ${error.message}`, 500);
    }
  },

// ============ MINI SUB CATEGORY OPERATIONS ============


async createMiniSubCategory(data, files) {
    try {
        const { name, subCategoryId, hasSpecificCategory: hasSpecificCategoryRaw = false, contractWhatsapp: contractWhatsappRaw = false, hasForm: hasFormRaw = false, fromName } = data;

        if (!name || !subCategoryId) {
            throw new AppError('Mini sub category name and parent sub category ID are required', 400);
        }

        // Check if parent sub category exists
        const subCategory = await prisma.subCategory.findUnique({
            where: { id: parseInt(subCategoryId) },
        });

        if (!subCategory) {
            throw new AppError('Parent sub category not found', 404);
        }

        // Check if mini sub category already exists within the same parent
        const existingMiniSubCategory = await prisma.miniSubCategory.findFirst({
            where: {
                name,
                subCategoryId: parseInt(subCategoryId),
            },
        });

        if (existingMiniSubCategory) {
            throw new AppError('Mini sub category already exists in this sub category', 400);
        }

        // Return success immediately and handle DB creation/file upload in the background
        setImmediate(async () => {
            try {
                // Convert string inputs to boolean
                const hasSpecificCategory = hasSpecificCategoryRaw === 'true' || hasSpecificCategoryRaw === true;
                const contractWhatsapp = contractWhatsappRaw === 'true' || contractWhatsappRaw === true;
                const hasForm = hasFormRaw === 'true' || hasFormRaw === true;

                // Create the mini sub category with image as null initially
                const miniSubCategory = await prisma.miniSubCategory.create({
                    data: {
                        name,
                        img: null,
                        hasSpecificCategory,
                        contractWhatsapp,
                        hasForm,
                        fromName: fromName || null,
                        subCategoryId: parseInt(subCategoryId),
                    }
                });

                console.log(`Mini sub category "${name}" created successfully with ID: ${miniSubCategory.id}`);

                // Handle image upload if a file is provided
                if (files?.image?.[0]) {
                    try {
                        validateImageFile(files.image[0]);
                        const uploadResult = await uploadSingleImage(files.image[0]);

                        // Update the record with the uploaded image URL
                        await prisma.miniSubCategory.update({
                            where: { id: miniSubCategory.id },
                            data: { img: uploadResult.url },
                        });

                        console.log(`Image uploaded for mini sub category "${name}":`, uploadResult.url);
                    } catch (uploadError) {
                        console.error(`Image upload failed for mini sub category "${name}":`, uploadError.message);
                    }
                }
            } catch (backgroundError) {
                console.error(`Background processing failed for mini sub category "${name}":`, backgroundError.message);
            }
        });

        return {
            success: true,
            message: 'Mini sub category creation initiated, processing in background',
            data: {
                subCategoryId: parseInt(subCategoryId),
                subCategoryName: subCategory.name,
                miniSubCategoryName: name,
                hasFile: !!(files?.image?.[0])
            }
        };
    } catch (error) {
        throw new AppError(`Failed to initiate mini sub category creation: ${error.message}`, 400);
    }
},

/**
 * Retrieves all mini sub categories with pagination.
 * @param {number} page - The current page number.
 * @param {number} limit - The number of items per page.
 * @param {number|null} subCategoryId - Optional parent sub category ID to filter by.
 * @returns {Promise<object>} A list of mini sub categories and pagination details.
 */
async getAllMiniSubCategories(page = 1, limit = 10, subCategoryId = null) {
    try {
        const skip = (page - 1) * limit;
        const where = subCategoryId ? { subCategoryId: parseInt(subCategoryId) } : {};

        const [miniSubCategories, total] = await Promise.all([
            prisma.miniSubCategory.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    subCategory: {
                        include: {
                            mainCategory: true
                        }
                    }
                }
            }),
            prisma.miniSubCategory.count({ where })
        ]);

        return {
            success: true,
            data: {
                miniSubCategories,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        };
    } catch (error) {
        throw new AppError(`Failed to fetch mini sub categories: ${error.message}`, 500);
    }
},

/**
 * Retrieves a single mini sub category by its ID.
 * @param {string|number} id - The ID of the mini sub category.
 * @returns {Promise<object>} The mini sub category data.
 */
async getMiniSubCategoryById(id) {
    try {
        const miniSubCategory = await prisma.miniSubCategory.findUnique({
            where: { id: parseInt(id) },
            include: {
                subCategory: {
                    include: {
                        mainCategory: true
                    }
                }
            }
        });

        if (!miniSubCategory) {
            throw new AppError('Mini sub category not found', 404);
        }

        return {
            success: true,
            data: miniSubCategory
        };
    } catch (error) {
        throw new AppError(`Failed to fetch mini sub category: ${error.message}`, 500);
    }
},

/**
 * Updates an existing mini sub category, with background processing for file operations.
 * @param {string|number} id - The ID of the mini sub category to update.
 * @param {object} updateData - The data to update.
 * @param {object} files - The uploaded files for image replacement.
 * @returns {Promise<object>} Confirmation message.
 */
async updateMiniSubCategory(id, updateData, files) {
    try {
        if (!updateData || typeof updateData !== 'object') {
            throw new AppError('Update data for mini sub category is required', 400);
        }
        const { name, subCategoryId } = updateData;

        // Check if the mini sub category exists
        const existingMiniSubCategory = await prisma.miniSubCategory.findUnique({
            where: { id: parseInt(id) },
        });

        if (!existingMiniSubCategory) {
            throw new AppError('Mini sub category not found', 404);
        }

        // If name is being updated, check for duplicates in the target sub category
        if (name) {
            const targetSubCategoryId = subCategoryId || existingMiniSubCategory.subCategoryId;
            const duplicateCheck = await prisma.miniSubCategory.findFirst({
                where: {
                    name,
                    subCategoryId: parseInt(targetSubCategoryId),
                    id: { not: parseInt(id) }
                }
            });
            if (duplicateCheck) {
                throw new AppError('A mini sub category with this name already exists in the target sub category', 400);
            }
        }

        // Return success immediately and handle updates in the background
        setImmediate(async () => {
            try {
                // Prepare data for update, converting string booleans to boolean
                const dataToUpdate = {};
                for (const key in updateData) {
                    if (Object.hasOwnProperty.call(updateData, key)) {
                        const value = updateData[key];
                        if (['hasSpecificCategory', 'contractWhatsapp', 'hasForm'].includes(key)) {
                            dataToUpdate[key] = value === 'true' || value === true;
                        } else if (key === 'subCategoryId') {
                            dataToUpdate[key] = parseInt(value);
                        } else if (value !== undefined && value !== null) {
                            dataToUpdate[key] = value;
                        }
                    }
                }

                // Update the database record
                await prisma.miniSubCategory.update({
                    where: { id: parseInt(id) },
                    data: dataToUpdate,
                });

                console.log(`Mini sub category ID ${id} updated successfully.`);

                // Handle image replacement if a new image is provided
                if (files?.image?.[0]) {
                    try {
                        validateImageFile(files.image[0]);

                        // Delete the old image if it exists
                        if (existingMiniSubCategory.img) {
                            const oldFilename = existingMiniSubCategory.img.split('/').pop();
                            await deleteImage(oldFilename);
                            console.log("Old mini sub category image deleted:", oldFilename);
                        }

                        // Upload the new image
                        const uploadResult = await uploadSingleImage(files.image[0]);

                        // Update the record with the new image URL
                        await prisma.miniSubCategory.update({
                            where: { id: parseInt(id) },
                            data: { img: uploadResult.url }
                        });
                        console.log("Mini sub category image updated:", uploadResult.url);
                    } catch (imageError) {
                        console.error("Mini sub category image update failed:", imageError.message);
                    }
                }
            } catch (backgroundError) {
                console.error(`Background update failed for mini sub category ID ${id}:`, backgroundError.message);
            }
        });

        return {
            success: true,
            message: 'Mini sub category update initiated, processing in background',
        };
    } catch (error) {
        throw new AppError(`Failed to initiate mini sub category update: ${error.message}`, 400);
    }
},

/**
 * Deletes a mini sub category and its associated image.
 * @param {string|number} id - The ID of the mini sub category to delete.
 * @returns {Promise<object>} Confirmation message.
 */
async deleteMiniSubCategory(id) {
    try {
        // Find the category to ensure it exists and get its details
        const miniSubCategory = await prisma.miniSubCategory.findUnique({
            where: { id: parseInt(id) },
        });

        if (!miniSubCategory) {
            throw new AppError('Mini sub category not found', 404);
        }

        // Delete the database record
        await prisma.miniSubCategory.delete({
            where: { id: parseInt(id) }
        });

        // Perform image cleanup in the background
        setImmediate(async () => {
            if (miniSubCategory.img) {
                try {
                    const filename = miniSubCategory.img.split('/').pop();
                    await deleteImage(filename);
                    console.log("Mini sub category image deleted:", filename);
                } catch (deleteError) {
                    console.warn("Failed to delete mini sub category image:", deleteError.message);
                }
            }
            console.log(`Mini sub category "${miniSubCategory.name}" and its assets deleted successfully.`);
        });

        return {
            success: true,
            message: 'Mini sub category deleted successfully'
        };
    } catch (error) {
        throw new AppError(`Failed to delete mini sub category: ${error.message}`, 400);
    }
},

};

export default categoryService;