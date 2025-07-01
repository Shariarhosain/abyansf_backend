import userService from '../services/userService.js';

const userController = {
    // Register new user
    async registerUser(req, res) {
        try {
            const { name, email, whatsapp } = req.body;

            if (!name || !email || !whatsapp) {
                return res.status(400).json({
                    success: false,
                    message: 'Name, email, and whatsapp are required'
                });
            }

            const result = await userService.createUser({ name, email, whatsapp });
            
            res.status(201).json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // Verify email with code
    async verifyEmail(req, res) {
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
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // Admin: Send payment link
    async sendPaymentLink(req, res) {
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
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // Admin: Confirm payment
    async confirmPayment(req, res) {
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
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // Get user by ID
    async getUserById(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'User ID is required'
                });
            }

            const user = await userService.getUserById(parseInt(id));
            
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
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // Get all users (admin)
    async getAllUsers(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            const result = await userService.getAllUsers(page, limit);
            
            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // Update user
    async updateUser(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'User ID is required'
                });
            }

            if (Object.keys(updateData).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Update data is required'
                });
            }

            const user = await userService.updateUser(parseInt(id), updateData);
            
            res.status(200).json({
                success: true,
                message: 'User updated successfully',
                data: user
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // Delete user
    async deleteUser(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'User ID is required'
                });
            }

            const result = await userService.deleteUser(parseInt(id));
            
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },


//router.put('/reset-password', userController.resetPassword);
    // Reset user password
    async resetPassword(req, res) {
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
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // Resend verification email
    async resendVerificationEmail(req, res) {
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
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
};

export default userController;