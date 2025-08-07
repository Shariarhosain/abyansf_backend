import { PrismaClient } from "@prisma/client";
import { uploadSingleImage, validateImageFile, deleteImage } from '../utils/imghelper.js';
import AppError from "../utils/error.js";
import  dotenv from 'dotenv';
dotenv.config();
const prisma = new PrismaClient();
// A helper function to extract filename from URL
const getFilenameFromUrl = (url) => {
  if (!url) return null;
  return url.split('/').pop();
};
const listingService = {
  // Create new listing
 async createListing(listingData, files) {
    try {
        const {
            name,
            location,
            member_privileges,
            member_privileges_description,
            description,
            hours,
            formName,
            venueName,
            specificCategoryId,
            menuImages,
            typeofservice,
           contractWhatsapp = false,
           fromName = null,
           hasForm = false,

        } = listingData;

        console.log("Received listing data:", listingData);

        // // Validate required fields
        // if (!name || !location || !specificCategoryId) {
        //     throw new AppError('Name, location, and specific category are required', 400);
        // }

        // Verify specific category exists
        const specificCategory = await prisma.specificCategory.findUnique({
            where: { id: parseInt(specificCategoryId) }
        });

        if (!specificCategory) {
            throw new AppError('Specific category not found', 404);
        }
      const contractWhatsappBool = contractWhatsapp === 'true' || contractWhatsapp === true;
      const hasFormBool = hasForm === 'true' || hasForm === true;
      const fromNameValue = fromName ? fromName : null;

        const listing = await prisma.listing.create({
            data: {
                name,
                main_image: 'uploading...',
                sub_images: [],
                location : location ? location : null,
                member_privileges:  Array.isArray(member_privileges) ? member_privileges : [member_privileges].filter(Boolean) || [],
                member_privileges_description: member_privileges_description ? member_privileges_description : null,
                description: description ? description : null,
                contractWhatsapp: contractWhatsappBool,
                fromName: fromNameValue,
                hasForm: hasFormBool,
                hours: Array.isArray(hours) ? hours : [hours].filter(Boolean) || [],
                ...(formName !== undefined && { formName }),
                venueName: Array.isArray(venueName) ? venueName : [venueName].filter(Boolean) || [],
                specificCategory: {
                    connect: { id: parseInt(specificCategoryId) }
                },
                ...(menuImages !== undefined && { menuImages }),
                typeofservice: Array.isArray(typeofservice) ? typeofservice : [typeofservice].filter(Boolean) || [],
                isActive: true // Default to active
            },
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

        // Handle image uploads in background
        setImmediate(async () => {
            try {
                let mainImageUrl = null;
                let subImageUrls = [];
                let menuImageUrls = [];

                // Upload main image
                if (files && files.main_image && files.main_image[0]) {
                    validateImageFile(files.main_image[0]);
                    const mainUploadResult = await uploadSingleImage(files.main_image[0]);
                    mainImageUrl = mainUploadResult.url;
                    console.log("Main image uploaded:", mainUploadResult.url);
                }

                // Upload sub images
                if (files && files.sub_images && files.sub_images.length > 0) {
                    for (const file of files.sub_images) {
                        try {
                            validateImageFile(file);
                            const subUploadResult = await uploadSingleImage(file);
                            subImageUrls.push(subUploadResult.url);
                            console.log("Sub image uploaded:", subUploadResult.url);
                        } catch (error) {
                            console.error("Failed to upload sub image:", error.message);
                        }
                    }
                }

                //menuImages
                    if (files && files.menuImages && files.menuImages.length > 0) {
                            for (const file of files.menuImages) {
                            try {
                                    validateImageFile(file);
                                    const menuUploadResult = await uploadSingleImage(file);
                                    menuImageUrls.push(menuUploadResult.url);
                                    console.log("Menu image uploaded:", menuUploadResult.url);
                            } catch (error) {
                                    console.error("Failed to upload menu image:", error.message);
                            }
                            }
                    }

                // Update listing with uploaded image URLs
                if (mainImageUrl || subImageUrls.length > 0) {
                    await prisma.listing.update({
                        where: { id: listing.id },
                        data: {
                            ...(mainImageUrl && { main_image: mainImageUrl }),
                            ...(subImageUrls.length > 0 && { sub_images: subImageUrls }),
                            ...(menuImageUrls.length > 0 && { menuImages: menuImageUrls })
                        }
                    });
                }
            } catch (error) {
                console.error("Background image upload failed:", error.message);
                // Update listing to indicate upload failure
                await prisma.listing.update({
                    where: { id: listing.id },
                    data: { main_image: 'upload_failed' }
                });
            }
        });

        return {
            success: true,
            message: "Listing created successfully. Images are being processed.",
            data: listing
        };
    } catch (error) {
        throw new AppError(`Failed to create listing: ${error.message}`, 400);
    }
},

  // Get all listings with pagination
  async getAllListings(page = 1, limit = 10, filters = {}) {
    const skip = (page - 1) * limit;
    const { specificCategoryId, location, isActive } = filters;

    const where = {
      ...(specificCategoryId && { specificCategoryId: parseInt(specificCategoryId) }),
      ...(location && { location: { contains: location, mode: 'insensitive' } }),
      ...(isActive !== undefined && { isActive: Boolean(isActive) })
    };

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          specificCategory: {
            include: {
              subCategory: {
                include: {
                  mainCategory: true
                }
              }
            }
          },
          bookings: {
            select: {
              id: true,
              status: true,
              bookingDate: true
            }
          }
        }
      }),
      prisma.listing.count({ where })
    ]);

    // Fix hours, venueName, and typeofservice to be arrays of strings, not arrays with a single JSON string
    const fixedListings = listings.map(listing => {
      let hours = listing.hours;
      let venueName = listing.venueName;
      let typeofservice = listing.typeofservice;

      // If hours is an array with a single string that looks like a JSON array, parse it
      if (
        Array.isArray(hours) &&
        hours.length === 1 &&
        typeof hours[0] === "string" &&
        hours[0].trim().startsWith("[") &&
        hours[0].trim().endsWith("]")
      ) {
        try {
          const parsed = JSON.parse(hours[0]);
          if (Array.isArray(parsed)) hours = parsed;
        } catch (e) {
          // ignore parse error, keep as is
        }
      }

      // Same for venueName
      if (
        Array.isArray(venueName) &&
        venueName.length === 1 &&
        typeof venueName[0] === "string" &&
        venueName[0].trim().startsWith("[") &&
        venueName[0].trim().endsWith("]")
      ) {
        try {
          const parsed = JSON.parse(venueName[0]);
          if (Array.isArray(parsed)) venueName = parsed;
        } catch (e) {
          // ignore parse error, keep as is
        }
      }

      // Same for typeofservice
      if (
        Array.isArray(typeofservice) &&
        typeofservice.length === 1 &&
        typeof typeofservice[0] === "string" &&
        typeofservice[0].trim().startsWith("[") &&
        typeofservice[0].trim().endsWith("]")
      ) {
        try {
          const parsed = JSON.parse(typeofservice[0]);
          if (Array.isArray(parsed)) typeofservice = parsed;
        } catch (e) {
          // ignore parse error, keep as is
        }
      }

      return {
        ...listing,
        hours,
        venueName,
        typeofservice
      };
    });

    return {
      listings: fixedListings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  },

  
  // Get listing by ID
  async getListingById(id) {
    const listing = await prisma.listing.findUnique({
      where: { id: parseInt(id) },
      include: {
        specificCategory: {
          include: {
            subCategory: {
              include: {
                mainCategory: true
              }
            }
          }
        },
        bookings: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!listing) {
      throw new AppError('Listing not found', 404);
    }

    // Fix hours, venueName, and typeofservice to be arrays of strings, not arrays with a single JSON string
    let hours = listing.hours;
    let venueName = listing.venueName;
    let typeofservice = listing.typeofservice;

    // If hours is an array with a single string that looks like a JSON array, parse it
    if (
      Array.isArray(hours) &&
      hours.length === 1 &&
      typeof hours[0] === "string" &&
      hours[0].trim().startsWith("[") &&
      hours[0].trim().endsWith("]")
    ) {
      try {
        const parsed = JSON.parse(hours[0]);
        if (Array.isArray(parsed)) hours = parsed;
      } catch (e) {
        // ignore parse error, keep as is
      }
    }

    // Same for venueName
    if (
      Array.isArray(venueName) &&
      venueName.length === 1 &&
      typeof venueName[0] === "string" &&
      venueName[0].trim().startsWith("[") &&
      venueName[0].trim().endsWith("]")
    ) {
      try {
        const parsed = JSON.parse(venueName[0]);
        if (Array.isArray(parsed)) venueName = parsed;
      } catch (e) {
        // ignore parse error, keep as is
      }
    }

    // Same for typeofservice
    if (
      Array.isArray(typeofservice) &&
      typeofservice.length === 1 &&
      typeof typeofservice[0] === "string" &&
      typeofservice[0].trim().startsWith("[") &&
      typeofservice[0].trim().endsWith("]")
    ) {
      try {
        const parsed = JSON.parse(typeofservice[0]);
        if (Array.isArray(parsed)) typeofservice = parsed;
      } catch (e) {
        // ignore parse error, keep as is
      }
    }

    const result = {
      ...listing,
      hours,
      venueName,
      typeofservice
    };

    // Add individual WhatsApp details if contractWhatsapp is true
    if (listing.contractWhatsapp === true) {
      result.adminWhatsApp = await this.getAdminWhatsAppForListing(result);
    }

    return result;
  },

  // Get admin WhatsApp for individual listing
  async getAdminWhatsAppForListing(listing) {
    try {
      // Get admin WhatsApp number
      const adminWhatsApp = await this.getAdminWhatsAppNumber();
      
      // Create inquiry message for this specific listing
      const inquiryDetails = {
        serviceName: listing.name,
        serviceId: listing.id,
        location: listing.location,
        description: listing.description,
        categoryName: listing.specificCategory?.name,
        subCategoryName: listing.specificCategory?.subCategory?.name,
        mainCategoryName: listing.specificCategory?.subCategory?.mainCategory?.name,
        memberPrivileges: listing.member_privileges,
        memberPrivilegesDescription: listing.member_privileges_description,
        hours: listing.hours,
        venueName: listing.venueName,
        typeofservice: listing.typeofservice,
        fromName: listing.fromName
      };

      return {
        whatsapp: adminWhatsApp.whatsapp,
        whatsappLink: adminWhatsApp.whatsappLink,
        whatsappLinkWithInquiry: this.generateListingInquiryLink(
          adminWhatsApp.whatsapp, 
          inquiryDetails
        ),
        mobileWhatsappLink: this.generateMobileWhatsAppLinkForListing(
          adminWhatsApp.whatsapp,
          inquiryDetails
        ),
        serviceName: listing.name,
        message: `Service inquiry available for ${listing.name}`
      };
    } catch (error) {
      throw new AppError(`Failed to get admin WhatsApp for listing: ${error.message}`, 500);
    }
  },

  // Generate WhatsApp link with listing inquiry message
  generateListingInquiryLink(phoneNumber, inquiryDetails) {
    let cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
    
    if (cleanNumber.startsWith('+')) {
      cleanNumber = cleanNumber.substring(1);
    }
    
    if (cleanNumber.length < 10) {
      throw new Error('Invalid phone number format');
    }

    const message = this.createListingInquiryMessage(inquiryDetails);
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
  },

  // Generate mobile WhatsApp link for listing
  generateMobileWhatsAppLinkForListing(phoneNumber, inquiryDetails) {
    let cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
    
    if (cleanNumber.startsWith('+')) {
      cleanNumber = cleanNumber.substring(1);
    }
    
    if (cleanNumber.length < 10) {
      throw new Error('Invalid phone number format');
    }

    const message = this.createListingInquiryMessage(inquiryDetails);
    const encodedMessage = encodeURIComponent(message);
    return `whatsapp://send?phone=${cleanNumber}&text=${encodedMessage}`;
  },

  // Create beautiful listing inquiry message
  createListingInquiryMessage(details) {
    let message = `Hello Admin!\n\n`;
    message += `SERVICE INQUIRY\n\n`;
    
    message += `Service Name: ${details.serviceName}\n`;
    
    if (details.location) {
      message += `Location: ${details.location}\n`;
    }

    // Add description if available
    if (details.description) {
      let descriptionText = '';
      try {
        if (typeof details.description === 'object' && details.description !== null) {
          if (details.description.content) {
            descriptionText = details.description.content;
          } else {
            descriptionText = Object.entries(details.description)
              .map(([key, value]) => {
                if (typeof value === 'object' && value !== null) {
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
          try {
            const parsed = JSON.parse(details.description);
            if (parsed.content) {
              descriptionText = parsed.content;
            } else {
              descriptionText = Object.entries(parsed)
                .map(([key, value]) => {
                  if (typeof value === 'object' && value !== null) {
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
            descriptionText = details.description.trim();
          }
        } else {
          descriptionText = String(details.description).trim();
        }
        
        if (descriptionText) {
          const formattedDescription = descriptionText
            .replace(/\\n/g, '\n')
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .join('\n');
          
          message += `Description:\n${formattedDescription}\n`;
        }
      } catch (error) {
        console.warn('Error formatting description for WhatsApp message:', error);
        message += `Description: Service details available\n`;
      }
    }

    if (details.categoryName) {
      message += `Category: ${details.categoryName}\n`;
    }

    if (details.typeofservice && details.typeofservice.length > 0) {
      message += `Service Type: ${details.typeofservice.join(', ')}\n`;
    }

    if (details.hours && details.hours.length > 0) {
      message += `Operating Hours: ${details.hours.join(', ')}\n`;
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

  // Get admin WhatsApp number
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




  // Update listing
  async updateListing(id, updateData, files) {
    try {
      const existingListing = await prisma.listing.findUnique({
        where: { id: parseInt(id) }
      });

      if (!existingListing) {
        throw new AppError('Listing not found', 404);
      }

      // Process non-file updates immediately
      const {
        name,
        location,
        member_privileges,
        member_privileges_description,
        description,
        hours,
        formName,
        venueName,
        specificCategoryId,
        menuImages,
        typeofservice,
        isActive,
        contractWhatsapp = false,
        fromName = null,
        hasForm = false,
      } = updateData;


      // string to boolean
      const contractWhatsappBool = contractWhatsapp === 'true' || contractWhatsapp === true;
      const hasFormBool = hasForm === 'true' || hasForm === true;
      const fromNameValue = fromName ? fromName : null;

      const updatedListing = await prisma.listing.update({
        where: { id: parseInt(id) },
        data: {
          ...(name && { name }),
          ...(location && { location }),
          ...(member_privileges && { 
            member_privileges: Array.isArray(member_privileges) ? member_privileges : [member_privileges].filter(Boolean)
          }),
          ...(member_privileges_description !== undefined && { member_privileges_description }),
          ...(description !== undefined && { description }),
          ...(hours && { 
            hours: Array.isArray(hours) ? hours : [hours].filter(Boolean)
          }),
          ...(venueName !== undefined && { venueName: Array.isArray(venueName) ? venueName : [venueName].filter(Boolean) }),
          ...(specificCategoryId && { specificCategoryId: parseInt(specificCategoryId) }),
          ...(menuImages !== undefined && { menuImages }),
          ...(typeofservice !== undefined && { typeofservice: Array.isArray(typeofservice) ? typeofservice : [typeofservice].filter(Boolean) }),
          ...(isActive !== undefined && { isActive: Boolean(isActive) }),
          ...(contractWhatsapp !== undefined && { contractWhatsapp: contractWhatsappBool }),
          ...(fromName !== undefined && { fromName: fromNameValue }),
          ...(hasForm !== undefined && { hasForm: hasFormBool })
        },
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

      // Handle image uploads/updates in background
      setImmediate(async () => {
        try {
          let mainImageUrl = null;
          let subImageUrls = Array.isArray(existingListing.sub_images) ? [...existingListing.sub_images] : [];
          let menuImageUrls = Array.isArray(existingListing.menuImages) ? [...existingListing.menuImages] : [];

          // Upload new main image if provided
          if (files && files.main_image && files.main_image[0]) {
            validateImageFile(files.main_image[0]);
            const mainUploadResult = await uploadSingleImage(files.main_image[0]);
            mainImageUrl = mainUploadResult.url;

            // Delete old main image
            if (existingListing.main_image && existingListing.main_image !== 'uploading...' && existingListing.main_image !== 'upload_failed') {
              try {
                await deleteImage(existingListing.main_image);
              } catch (error) {
                console.error("Failed to delete old main image:", error.message);
              }
            }
          }

          // Upload new sub images if provided
          if (files && files.sub_images && files.sub_images.length > 0) {
            const newSubImageUrls = [];
            for (const file of files.sub_images) {
              try {
                validateImageFile(file);
                const subUploadResult = await uploadSingleImage(file);
                newSubImageUrls.push(subUploadResult.url);
                console.log("Sub image uploaded:", subUploadResult.url);
              } catch (error) {
                console.error("Failed to upload sub image:", error.message);
              }
            }
            subImageUrls = [...subImageUrls, ...newSubImageUrls];
          }

          // Upload new menu images if provided
          if (files && files.menuImages && files.menuImages.length > 0) {
            const newMenuImageUrls = [];
            for (const file of files.menuImages) {
              try {
                validateImageFile(file);
                const menuUploadResult = await uploadSingleImage(file);
                newMenuImageUrls.push(menuUploadResult.url);
                console.log("Menu image uploaded:", menuUploadResult.url);
              } catch (error) {
                console.error("Failed to upload menu image:", error.message);
              }
            }
            menuImageUrls = [...menuImageUrls, ...newMenuImageUrls];
          }

          // Update listing with new image URLs
          if (mainImageUrl || files?.sub_images?.length > 0 || files?.menuImages?.length > 0) {
            await prisma.listing.update({
              where: { id: parseInt(id) },
              data: {
                ...(mainImageUrl && { main_image: mainImageUrl }),
                ...(subImageUrls && { sub_images: subImageUrls }),
                ...(menuImageUrls && { menuImages: menuImageUrls })
              }
            });
          }
        } catch (error) {
          console.error("Background image update failed:", error.message);
        }
      });

      return {
        success: true,
        message: "Listing updated successfully. Images are being processed.",
        data: updatedListing
      };
    } catch (error) {
      throw new AppError(`Failed to update listing: ${error.message}`, 400);
    }
  },

  

  // Search listings
  async searchListings(searchParams) {
    const {
      query,
      specificCategoryId,
      location,
      page = 1,
      limit = 10
    } = searchParams;

    const skip = (page - 1) * limit;

    const where = {
      AND: [
        { isActive: true },
        ...(query ? [{
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { location: { contains: query, mode: 'insensitive' } }
          ]
        }] : []),
        ...(specificCategoryId ? [{ specificCategoryId: parseInt(specificCategoryId) }] : []),
        ...(location ? [{ location: { contains: location, mode: 'insensitive' } }] : [])
      ]
    };

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
      }),
      prisma.listing.count({ where })
    ]);

    return {
      listings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  },



// Updated function to delete any listing image in background and update listing in background
async deleteListingImage(imageUrl, listingId) {
  try {
    if (!listingId || !imageUrl) {
      throw new AppError('Listing ID and Image URL are required', 400);
    }

    // 1. Fetch the full listing object by its ID
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new AppError('Listing not found', 404);
    }

    let imageField = null;
    let updatedData = {};

    // 2. Check which field the imageUrl belongs to
    if (listing.main_image === imageUrl) {
      imageField = 'main_image';
      updatedData.main_image = null; // Set main image to null
    } else if (listing.sub_images && listing.sub_images.includes(imageUrl)) {
      imageField = 'sub_images';
      updatedData.sub_images = listing.sub_images.filter(url => url !== imageUrl);
    } else if (listing.menuImages && listing.menuImages.includes(imageUrl)) {
      imageField = 'menuImages';
      updatedData.menuImages = listing.menuImages.filter(url => url !== imageUrl);
    }

    // 3. If a match was found, update the database and delete the file in background
    if (imageField) {
      setImmediate(async () => {
        try {
          // Update the listing in the database
          await prisma.listing.update({
            where: { id: parseInt(listingId) },
            data: updatedData,
          });

          console.log(`Updated listing ${listingId}: removed ${imageField} ${imageUrl}`);

          // Delete the actual image file from storage
          const filename = getFilenameFromUrl(imageUrl);
          if (filename) {
            await deleteImage(filename);
          }
          console.log(`Deleted image ${filename} from storage`);
        } catch (error) {
          console.error("Background image deletion/update failed:", error.message);
        }
      });

      return { success: true, message: 'Image deletion is being processed in background' };
    } else {
      // 4. If no match was found anywhere
      throw new AppError('Image URL not found in this listing', 404);
    }

  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(`Failed to delete image: ${error.message}`, 500);
  }
},

async deleteListing(id) {
    try {
      const listing = await prisma.listing.findUnique({
        where: { id: parseInt(id) }
      });

      if (!listing) {
        throw new AppError('Listing not found', 404);
      }

      // Delete images in background
      setImmediate(async () => {
        try {
          // Delete main image
          if (listing.main_image && listing.main_image !== 'uploading...' && listing.main_image !== 'upload_failed') {
            // Delete the main image file
            const filename = getFilenameFromUrl(listing.main_image);
            await deleteImage(filename);
            console.log("Deleted main image:", filename);
          }

          // Delete sub images
          for (const subImage of listing.sub_images || []) {
            if (subImage && subImage !== 'uploading...' && subImage !== 'upload_failed') {
              // Delete each sub image file
              const filename = getFilenameFromUrl(subImage);
              await deleteImage(filename);
              console.log("Deleted sub image:", filename);
            }
          }

          // Delete menu images
          for (const menuImage of listing.menuImages || []) {
            if (menuImage && menuImage !== 'uploading...' && menuImage !== 'upload_failed') {
              // Delete each menu image file
              const filename = getFilenameFromUrl(menuImage);
              await deleteImage(filename);
              console.log("Deleted menu image:", filename);
            }
          }
        } catch (error) {
          console.error("Failed to delete listing images:", error.message);
        }
      });

      // Delete the listing itself
      await prisma.listing.delete({
        where: { id: parseInt(id) }
      });

      return { success: true, message: 'Listing deleted successfully' };
    } catch (error) {
      throw new AppError(`Failed to delete listing: ${error.message}`, 500);
    }
  }

};

export default listingService;