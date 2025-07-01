import { PrismaClient } from '@prisma/client';

import publishToQueue  from '../utils/publisher.js'; // Adjust the path as necessary

const prisma = new PrismaClient();

const userService = {
    // Email validation helper
  

    // Generate 4 digit verification code
    generateVerificationCode() {
        return Math.floor(1000 + Math.random() * 9000);
    },
    generateTempPassword() {
        const length = 8;
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let tempPassword = "";
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * charset.length);
            tempPassword += charset[randomIndex];
        }
        return tempPassword;
    },

    // Create user with initial verification
    async createUser(userData, publishEvent) {
        const { name, email, whatsapp } = userData;

    

        try {
            // Check if user already exists
            const existingUser = await prisma.user.findFirst({
                where: {
                    OR: [
                        { email },
                        { whatsapp }
                    ]
                }
            });

            if (existingUser) {
                throw new Error('User with this email or whatsapp already exists');
            }

          


            setImmediate(async () => {
                  // Create user
            const user = await prisma.user.create({
                data: {
                    name,
                    email,
                    whatsapp,
                    isActive: false,
                    isVerified: false
                }
            });
                
            const code = this.generateVerificationCode();
            const expiryTime = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

            // Create verification record
            await prisma.varification.create({
                data: {
                    email: user.email,
                    userId: user.id,
                    code: parseInt(code, 10), // Ensure code is stored as an integer
                    time: expiryTime,
                    isUsed: false
                }
            });

            // Trigger email verification event
            await publishToQueue('user_tasks', {
                type: 'email_verification',
                email: user.email,
                name: user.name,
                code,
                userId: user.id
            });

        // Log action
        await this.createLog(user.id, 'USER_REGISTRATION', 'User registered and verification email sent');
        });

            return { success: true, message: 'User registered successfully. Please check your email for verification code.', userId: user.id };
        } catch (error) {
            throw new Error(`Registration failed: ${error.message}`);
        }
    },

    // Email verification resend
    async resendVerificationEmail(email) {
        try {
            // Find user by email
            const user = await prisma.user.findUnique({
                where: { email }
            });

            if (!user) {
                throw new Error('User not found');
            }

            // Check if user is already verified
            if (user.isVerified) {
                throw new Error('User is already verified');
            }
      setImmediate(async () => { 
            // Generate new verification code
            const code = this.generateVerificationCode();
            const expiryTime = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

            // Update or create verification record
            await prisma.varification.create({
                data: {
                    email: user.email,
                    code: parseInt(code, 10),
                    time: expiryTime,
                    isUsed: false,
                    userId: user.id // Associate with user
                },

            });

            // Trigger email verification event
            await publishToQueue('user_tasks', {
                type: 'email_verification',
                email: user.email,
                name: user.name,
                code,
                userId: user.id
            });
           });

            return { success: true, message: 'Verification email resent successfully' };
        } catch (error) {
            throw new Error(`Failed to resend verification email: ${error.message}`);
        }
    },

    // Verify email code
    async verifyEmail(email, code) {
        try {
            const verification = await prisma.varification.findFirst({
                where: {
                    email,
                    code: parseInt(code),
                    isUsed: false,
                    time: {
                        gte: new Date()
                    }
                }
            });

            if (!verification) {
                throw new Error('Invalid or expired verification code');
            }
setImmediate(async () => {
    
            // Mark verification as used
            await prisma.varification.update({
                where: { id: verification.id },
                data: { isUsed: true }
            });

            // Update user as verified
           const user= await prisma.user.update({
                where: { email: email },
                data: { isVerified: true }
            });

            // Log action
            await this.createLog(user.id, 'EMAIL_VERIFIED', 'Email verification completed');

});
            return { success: true, message: 'Account verification submitted successfully please check your email for further instructions.' };
        } catch (error) {
            throw new Error(`Verification failed: ${error.message}`);
        }
    },

    // Admin: Send payment link
    async sendPaymentLink(userId) {
        try {
            console.log('userId', userId);
            const user = await prisma.user.findUnique({
                where: { id: userId }
            });

            if (!user || !user.isVerified) {
                throw new Error('User not found or not verified');
            }


            setImmediate(async () => {
                  // Update payment link sent status
            await prisma.user.update({
                where: { id: userId },
                data: { send_payment_link: true }
            });

            // Trigger payment link event
            await publishToQueue('user_tasks', {
                type: 'payment_link',
                email: user.email,
                name: user.name,
                userId: user.id
            });

            // Log action
            await this.createLog(userId, 'PAYMENT_LINK_SENT', 'Payment link sent to user');

            });

            return { success: true, message: 'Payment link and details sent successfully' };
        } catch (error) {
            throw new Error(`Failed to send payment link: ${error.message}`);
        }
    },

    // Admin: Confirm payment and activate account
    async confirmPayment(userId, packageInfo) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId }
            });
            if (user.isActive) {
                throw new Error('User is already active');
            }

            if (!user) {
                throw new Error('User not found');
            }

            if (!user.isVerified) {
                throw new Error('User is not verified');
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
                        password: tempPassword // Store temporary password
                    }
                });
              

                // Trigger Firebase user creation
                await publishToQueue('firebase_tasks', {
                    type: 'register',
                    email: user.email,
                    password: tempPassword,
                    displayName: user.name
                });
          

                await publishToQueue('user_tasks', {
                    type: 'payment_confirmation',
                    email: user.email,
                    name: user.name,
                    userId: user.id,
                    packageInfo: packageInfo,
                    tempPassword: tempPassword,
                });
                console.log('Payment confirmation task published', user.email, user.name, user.id);

                // Log action
                await this.createLog(userId, 'PAYMENT_CONFIRMED', `Payment confirmed and account activated with package: ${packageInfo}`);
            });

            return { success: true, message: 'Payment confirmed and account activated' };
        } catch (error) {
            throw new Error(`Failed to confirm payment: ${error.message}`);
        }
    },

    // Get user by ID
    async getUserById(id) {
        return await prisma.user.findUnique({
            where: { id },
            include: {
                verification: true,
                logs: {
                    orderBy: { createdAt: 'desc' },
                    take: 10
                }
            }
        });
    },

    // Get all users (admin)
    async getAllUsers(page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        
        const [users, total] = await Promise.all([
            prisma.user.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    whatsapp: true,
                    role: true,
                    isActive: true,
                    isVerified: true,
                    paid: true,
                    package: true,
                    send_payment_link: true,
                    createdAt: true
                }
            }),
            prisma.user.count()
        ]);

        return {
            users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    },

    // Update user

    async updateUser(id, updateData,file) {
        try {
            const user = await prisma.user.update({
                where: { id },
                data: updateData
            });

            // Log action
            await this.createLog(id, 'USER_UPDATED', `User data updated: ${JSON.stringify(updateData)}`);

            return user;
        } catch (error) {
            throw new Error(`Failed to update user: ${error.message}`);
        }
    },

    // Delete user
    async deleteUser(id, publishEvent) {
        try {
            const user = await prisma.user.findUnique({ where: { id } });
            
            if (!user) {
                throw new Error('User not found');
            }

            // Delete related records first
            await prisma.varification.deleteMany({ where: { userId: id } });
            await prisma.log.deleteMany({ where: { userId: id } });
            
            // Delete user
            await prisma.user.delete({ where: { id } });

         setImmediate(async () => {
               // Delete from Firebase if uid exists
            if (user.uid) {
                await publishEvent('firebase_tasks', {
                    type: 'deleteUser',
                    uid: user.uid
                });
            }
         });

            return { success: true, message: 'User deleted successfully' };
        } catch (error) {
            throw new Error(`Failed to delete user: ${error.message}`);
        }
    },

    // Create log entry
    async createLog(userId, action, details = null) {
        return await prisma.log.create({
            data: {
                userId,
                action,
                details
            }
        });
    },

    // Get user logs
    async getUserLogs(userId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        
        return await prisma.log.findMany({
            where: { userId },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' }
        });
    },

    // Admin: Get dashboard stats
    async getDashboardStats() {
        const [totalUsers, activeUsers, verifiedUsers, paidUsers] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { isActive: true } }),
            prisma.user.count({ where: { isVerified: true } }),
            prisma.user.count({ where: { paid: true } })
        ]);

        return {
            totalUsers,
            activeUsers,
            verifiedUsers,
            paidUsers,
            pendingVerification: totalUsers - verifiedUsers,
            pendingPayment: verifiedUsers - paidUsers
        };
    },

    // Reset user password
    async resetPassword(email, newPassword) {
        try {
            const user = await prisma.user.findUnique({ where: { email } });

            if (!user) {
                throw new Error('User not found');
            }

            setImmediate(async () => {
                // Update user password
                await prisma.user.update({
                    where: { email },
                    data: { password: newPassword }
                });

                // Trigger Firebase password reset
                const firebaseResult = await publishToQueue('firebase_tasks', {
                    type: 'resetPassword',
                    uid: user.uid,
                    newPassword
                });
                console.log('Firebase password reset result:', firebaseResult);

                await publishToQueue('user_tasks', {
                    type: 'password_reset',
                    name: user.name,
                    email: user.email
                });

                // Log action
                await this.createLog(user.id, 'PASSWORD_RESET', 'User password reset successfully');
            });

            return { success: true, message: 'Password reset successfully' };
        } catch (error) {
            throw new Error(`Failed to reset password: ${error.message}`);
        }
    }


};

export default userService;
     

