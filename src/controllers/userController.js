import userService from '../services/userService.js';
import AppError from '../utils/error.js';

const userController = {
    // Register new user
    async registerUser(req, res,next) {
        try {
            const { name, email, whatsapp, fcm_token } = req.body;

            if (!name || !email || !whatsapp ) {
                return res.status(400).json({
                    success: false,
                    message: 'Name, email, and whatsapp are required'
                });
            }

            const result = await userService.createUser({ name, email, whatsapp, fcm_token });

            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    },

    // Verify email with code
    async verifyEmail(req, res,next) {
        try {
            const { email, code } = req.body;

            if (!email || !code) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and verification code are required'
                });
            }

            const result = await userService.verifyEmail(email, code);
            
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },

    // Admin: Send payment link
    async sendPaymentLink(req, res,next) {
        try {
            const { userId } = req.params;
            console.log('userId', userId);

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: 'User ID is required'
                });
            }

            const result = await userService.sendPaymentLink(userId);
            
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },

    // Admin: Confirm payment
    async confirmPayment(req, res,next) {
        try {
            const { userId } = req.params;
            const { packageInfo } = req.body;

            if (!userId || !packageInfo) {
                return res.status(400).json({
                    success: false,
                    message: 'User ID and package information are required'
                });
            }

            const result = await userService.confirmPayment(userId, packageInfo);
            
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },

    // Get user by ID
    async getUserById(req, res,next) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'User ID is required'
                });
            }

            const user = await userService.getUserById(id);
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.status(200).json({
                success: true,
                data: user
            });
        } catch (error) {
            next(error);
        }
    },

    // Get all users (admin)
    async getAllUsers(req, res,next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            const result = await userService.getAllUsers(page, limit);
            
            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    },

    // Get user by UID
    async getUserUid(req, res,next) {
        try {
            console.log('getUserByUid called');
            console.log('req.user:', req.user);
            
            const uid = req.user?.uid;
            console.log('Extracted UID:', uid);

            if (!uid) {
                return res.status(400).json({
                    success: false,
                    message: 'User UID is required'
                });
            }

            const user = await userService.getUserByUid(uid);
            
            res.status(200).json({
                success: true,
                data: user
            });
        } catch (error) {
            next(error);
        }
    },

    // Update user
    async updateUser(req, res,next) {
        try {
            const { id } = req.params;
            const updateData = req.body;
         

            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'User ID is required'
                });
            }

            console.log('Update Data:',  req.files);

            const user = await userService.updateUser(id, updateData, req.files);
            
            res.status(200).json({
                success: true,
                message: 'User updated successfully',
                data: user
            });
        } catch (error) {
            next(error);
        }
    },

    // Delete user
    async deleteUser(req, res,next) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'User ID is required'
                });
            }

            const result = await userService.deleteUser(id);
            
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },


//router.put('/reset-password', userController.resetPassword);
    // Reset user password
    async resetPassword(req, res,next) {
        try {
            const { email, newPassword } = req.body;

            if (!email || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and new password are required'
                });
            }

            const result = await userService.resetPassword(email, newPassword);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },

    // Resend verification email
    async resendVerificationEmail(req, res,next) {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is required'
                });
            }

            const result = await userService.resendVerificationEmail(email);
            
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },

    // Admin: Get dashboard stats
    async getDashboardStats(req, res,next) {
        try {
            const result = await userService.getDashboardStats();
            
            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    },

    // User login
    async loginUser(req, res,next) {
        try {
            const { email, password, rememberMe } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and password are required'
                });
            }

            const result = await userService.loginUser(email, password, rememberMe);
            
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },

    async adminWhatsAppNumber(req, res,next) {
        try {
            const result = await userService.adminWhatsAppNumber();
            
            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

};

export default userController;