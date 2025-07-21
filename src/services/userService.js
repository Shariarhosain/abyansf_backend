import { PrismaClient } from "@prisma/client";
import publishToQueue from "../utils/publisher.js"; // Adjust the path as necessary
import { uploadSingleImage, validateImageFile } from '../utils/imghelper.js';
import AppError from "../utils/error.js";
import generateToken from "../middlewares/jwt.js"; // Adjust the path as necessary
import dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();

const userService = {
  // Email validation helper

  // Generate 4 digit verification code
  generateVerificationCode() {
    return Math.floor(1000 + Math.random() * 9000);
  },
  generateTempPassword() {
    const length = 8;
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let tempPassword = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      tempPassword += charset[randomIndex];
    }
    return tempPassword;
  },

  // Create user with initial verification
  async createUser(userData) {
    const { name, email, whatsapp, fcm_token } = userData;
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email }, { whatsapp }],
        },
      });

      if (existingUser) {
        throw new AppError("User with this email or whatsapp already exists",412);
      }

      // Create user
      const user = await prisma.user.create({
        data: {
          name,
          email,
          whatsapp,
          fcm_token,
          profile_pic: process.env.PROFILE_PIC,
          isActive: false,
          isVerified: false,
        },
      });

      setImmediate(async () => {
        const code = this.generateVerificationCode();
        const expiryTime = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

        // Create verification record
        await prisma.verification.create({
          data: {
            email: user.email,
            userId: user.id,
            code: parseInt(code, 10), // Ensure code is stored as an integer
            time: expiryTime,
            isUsed: false,
          },
        });

        // Trigger email verification event
        await publishToQueue("user_tasks", {
          type: "email_verification",
          email: user.email,
          name: user.name,
          code,
          userId: user.id,
        });

        // Log action
        await this.createLog(
          user.id,
          "USER_REGISTRATION",
          "User registered and verification email sent"
        );
      });

      return {
        success: true,
        message:
          "User registered successfully. Please check your email for verification code.",
        userId: user.id,
      };
    } catch (error) {
      throw new AppError(`Registration failed: ${error.message}`, 400);
    }
  },

  // Email verification resend
  async resendVerificationEmail(email) {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new AppError("User not found", 404);
      }

     
      setImmediate(async () => {
        // Generate new verification code
        const code = this.generateVerificationCode();
        const expiryTime = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

        // Update or create verification record
        await prisma.verification.create({
          data: {
            email: user.email,
            code: parseInt(code, 10),
            time: expiryTime,
            isUsed: false,
            userId: user.id, // Associate with user
          },
        });

        // Trigger email verification event
        await publishToQueue("user_tasks", {
          type: "email_verification",
          email: user.email,
          name: user.name,
          code,
          userId: user.id,
        });
      });

      return {
        success: true,
        message: "Verification email resent successfully",
      };
    } catch (error) {
      throw new AppError(`Failed to resend verification email: ${error.message}`, 400);
    }
  },

  // Verify email code
  async verifyEmail(email, code) {
    try {
      const verification = await prisma.verification.findFirst({
        where: {
          email,
          code: parseInt(code),
          isUsed: false,
          time: {
            gte: new Date(),
          },
        },
      });

      if (!verification) {
        throw new AppError("Invalid or expired verification code", 400);
      }
      setImmediate(async () => {
        // Mark verification as used
        await prisma.verification.update({
          where: { id: verification.id },
          data: { isUsed: true },
        });

        // Update user as verified
        const user = await prisma.user.update({
          where: { email: email },
          data: { isVerified: true },
        });

        // Log action
        await this.createLog(
          user.id,
          "EMAIL_VERIFIED",
          "Email verification completed"
        );
      });
      return {
        success: true,
        message: "Email verification successful",
      };
    } catch (error) {
      throw new AppError(`Verification failed: ${error.message}`, 400);
    }
  },

  // Admin: Send payment link
  async sendPaymentLink(userId) {
    try {
      console.log("userId", userId);
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.isVerified) {
        throw new AppError("User not found or not verified", 404);
      }

      setImmediate(async () => {
        // Update payment link sent status
        await prisma.user.update({
          where: { id: userId },
          data: { send_payment_link: true },
        });

        // Trigger payment link event
        await publishToQueue("user_tasks", {
          type: "payment_link",
          email: user.email,
          name: user.name,
          userId: user.id,
        });

        // Log action
        await this.createLog(
          userId,
          "PAYMENT_LINK_SENT",
          "Payment link sent to user"
        );
      });

      return {
        success: true,
        message: "Payment link and details sent successfully",
      };
    } catch (error) {
      throw new AppError(`Failed to send payment link: ${error.message}`, 400);
    }
  },

  // Admin: Confirm payment and activate account
  async confirmPayment(userId, packageInfo) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (user.isActive) {
        throw new AppError("User is already active", 400);
      }

      if (!user) {
        throw new AppError("User not found", 404);
      }

      if (!user.isVerified) {
        throw new AppError("User is not verified", 400);
      }

      setImmediate(async () => {
        const tempPassword = this.generateTempPassword();
        // Update user status
        await prisma.user.update({
          where: { id: userId },
          data: {
            paid: true,
            package: packageInfo,
            isActive: true,
            password: tempPassword, // Store temporary password
          },
        });

        // Trigger Firebase user creation
        await publishToQueue("firebase_tasks", {
          type: "register",
          email: user.email,
          password: tempPassword,
          displayName: user.name,
        });

        await publishToQueue("user_tasks", {
          type: "payment_confirmation",
          email: user.email,
          name: user.name,
          userId: user.id,
          packageInfo: packageInfo,
          tempPassword: tempPassword,
        });
        console.log(
          "Payment confirmation task published",
          user.email,
          user.name,
          user.id
        );

        // Log action
        await this.createLog(
          userId,
          "PAYMENT_CONFIRMED",
          `Payment confirmed and account activated with package: ${packageInfo}`
        );
      });

      return {
        success: true,
        message: "Payment confirmed and account activated",
      };
    } catch (error) {
      throw new AppError(`Failed to confirm payment: ${error.message}`, 400);
    }
  },

  // Get user by ID
  async getUserById(id) {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          whatsapp: true,
          profile_pic: true,
          role: true,
          isActive: true,
          isVerified: true,
          paid: true,
          package: true,
          send_payment_link: true,
          fcm_token: true,
          uid: true,
          password: true, // Include password for internal use only
          createdAt: true,
        },
      });

      if (!user) {
        throw new AppError("User not found", 404);
      }

      return user;
    } catch (error) {
      throw new AppError(`Failed to get user: ${error.message}`, 400);
    }
   
  },

  // Get all users (admin)
  async getAllUsers(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          whatsapp: true,
          profile_pic: true,
          role: true,
          isActive: true,
          isVerified: true,
          paid: true,
          package: true,
          send_payment_link: true,
          fcm_token: true,
          uid: true,
          password: true, // Include password
          createdAt: true,
        },
      }),
      prisma.user.count(),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

//get user by email without password

async getUserByUid(uid) {
    try {
      console.log("Fetching user by UID:", uid);
      const user = await prisma.user.findUnique({
        where: { uid },
        select: {
          id: true,
          name: true,
          email: true,
          whatsapp: true,
          profile_pic: true,
          role: true,
          isActive: true,
          isVerified: true,
          paid: true,
          package: true,
          send_payment_link: true,
          fcm_token: true,
          uid: true,
          createdAt: true,
        },
      });

      if (!user) {
        throw new AppError("User not found", 404);
      }

      return user;
    } catch (error) {
      throw new AppError(`Failed to get user by UID: ${error.message}`, 400);
    }

},

  async updateUser(id, updateData, files) {
    try {
      // Validate updateData parameter
      if (!updateData || typeof updateData !== 'object') {
        updateData = {};
      }

      // Check if email is being attempted to be changed
      if (updateData.email) {
        throw new AppError("Email cannot be changed", 400);
      }
      
      // Check if there's any data to update
      if (Object.keys(updateData).length === 0 && !files) {
        throw new AppError("No valid data provided for update", 400);
      }

      // Separate password from other update data
      const { password, ...otherData } = updateData;

      // First, update the non-file and non-password data immediately for responsiveness
      let user;
      if (Object.keys(otherData).length > 0) {
        user = await prisma.user.update({
          where: { id },
          data: otherData,
        });
      } else {
        user = await prisma.user.findUnique({ where: { id } });
      }

      // Handle file upload and password update in the background
      setImmediate(async () => {
        try {
          // Handle file upload if provided
          if (files) {
            // Validate the file before upload
            validateImageFile(files.image[0]);

            // Upload using the utility function
            const uploadResult = await uploadSingleImage(files.image[0]);
            console.log("Upload successful:", uploadResult);

            await prisma.user.update({
              where: { id: user.id },
              data: { profile_pic: uploadResult.url },
            });
          }

          // Handle password update if provided
          if (password) {
            // Update password in database
            await prisma.user.update({
              where: { id: user.id },
              data: { password: password },
            });

            // Trigger Firebase password reset
            const firebaseResult = await publishToQueue("firebase_tasks", {
              type: "resetPassword",
              uid: user.uid,
              newPassword: password,
            });
            console.log("Firebase password reset result:", firebaseResult);

            // Send notification email
            await publishToQueue("user_tasks", {
              type: "password_reset",
              name: user.name,
              email: user.email,
            });
            
            console.log("Password reset task published for user:", user.email);
          }
        } catch (err) {
          console.error("Background update failed:", err);
        }
      });

      return user;
    } catch (error) {
      throw new AppError(`Failed to update user: ${error.message}`, 400);
    }
  },

  // Delete user
  async deleteUser(id, publishEvent) {
    try {
      const user = await prisma.user.findUnique({ where: { id } });

      if (!user) {
        throw new Error("User not found");
      }

      // Delete related records first
      await prisma.verification.deleteMany({ where: { userId: id } });
      await prisma.log.deleteMany({ where: { userId: id } });

      // Delete user
      await prisma.user.delete({ where: { id } });

      setImmediate(async () => {
        // Delete from Firebase if uid exists
        if (user.uid) {
           await publishToQueue("firebase_tasks", {
            type: "deleteUser",
            uid: user.uid,
          });
        }
      });

      return { success: true, message: "User deleted successfully" };
    } catch (error) {
      throw new AppError(`Failed to delete user: ${error.message}`, 400);
    }
  },

  // Create log entry
  async createLog(userId, action, details = null) {
    return await prisma.log.create({
      data: {
        userId,
        action,
        details,
      },
    });
  },

  // Get user logs
  async getUserLogs(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    return await prisma.log.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    });
  },

  // Admin: Get dashboard stats
  async getDashboardStats() {
    const [totalUsers, activeUsers, verifiedUsers, paidUsers] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.user.count({ where: { isVerified: true } }),
        prisma.user.count({ where: { paid: true } }),
      ]);

    return {
      totalUsers,
      activeUsers,
      verifiedUsers,
      paidUsers,
      pendingVerification: totalUsers - verifiedUsers,
      pendingPayment: verifiedUsers - paidUsers,
    };
  },

  // Reset user password
  async resetPassword(email, newPassword) {
    try {
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        throw new AppError("User not found", 404);
      }

      setImmediate(async () => {
        // Update user password
        await prisma.user.update({
          where: { email },
          data: { password: newPassword },
        });

        // Trigger Firebase password reset
        const firebaseResult = await publishToQueue("firebase_tasks", {
          type: "resetPassword",
          uid: user.uid,
          newPassword,
        });
        console.log("Firebase password reset result:", firebaseResult);

        await publishToQueue("user_tasks", {
          type: "password_reset",
          name: user.name,
          email: user.email,
        });

        // Log action
        await this.createLog(
          user.id,
          "PASSWORD_RESET",
          "User password reset successfully"
        );
      });

      return { success: true, message: "Password reset successfully" };
    } catch (error) {
      throw new AppError(`Failed to reset password: ${error.message}`, 400);
    }
  },

  // User login
  async loginUser(email, password, rememberMe = false) {
    try {
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user || !user.password || user.password !== password) {
        throw new AppError("Invalid email or password", 401);
      }
      if (!user.isActive) {
        throw new AppError("Your account is not active", 403);
      }
      if (!user.isVerified) {
        throw new AppError("Your account is not verified", 403);
      }
     const token = generateToken(
        user.id,
        user.uid,
        user.email,
        user.role,
        rememberMe
      );

      

      return { success: true, message:"Login successful", token };
    } catch (error) {
      throw new AppError(`Failed to login user: ${error.message}`, 400);
    }
  },

  // Admin WhatsApp number
async adminWhatsAppNumber() {
  try {
    // First, check environment variable
    const envWhatsApp = process.env.ADMIN_WHATSAPP_NUMBER;
    if (envWhatsApp) {
      return { 
        success: true, 
        whatsapp: envWhatsApp,
        whatsappLink: this.generateWhatsAppLink(envWhatsApp)
      };
    }

    // Fallback to database
    const adminUser = await prisma.user.findFirst({
      where: {
        role: "ADMIN",
      },
      select: {
        whatsapp: true,
      },
    });

    if (!adminUser || !adminUser.whatsapp) {
      throw new AppError("Admin WhatsApp number not found", 404);
    }

    return { 
      success: true, 
      whatsapp: adminUser.whatsapp,
      whatsappLink: this.generateWhatsAppLink(adminUser.whatsapp)
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    
    throw new AppError(
      `Failed to get admin WhatsApp number: ${error.message}`, 
      500
    );
  }
},
generateWhatsAppLink(phoneNumber, message = '') {
  const cleanNumber = phoneNumber.replace(/[^\d+]/g, '').replace('+', '');
  
  if (message) {
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
  }
  
  return `https://wa.me/${cleanNumber}`;
}


};

export default userService;
