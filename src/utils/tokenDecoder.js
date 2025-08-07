// JWT Token Decoder Utility for Developers

/**
 * This utility helps developers understand how to extract userId and role from JWT tokens
 * for Socket.IO authentication
 */

import jwt from 'jsonwebtoken';

export const TokenDecoder = {
  /**
   * Decode and validate JWT token to extract user information
   * @param {string} token - JWT token from client
   * @param {string} secretKey - Your JWT secret key
   * @returns {object} - { userId, role, email, ... }
   */
  decodeToken(token, secretKey) {
    try {
      const decoded = jwt.verify(token, secretKey);
      
      // Extract common fields (adjust based on your JWT payload structure)
      return {
        userId: decoded.userId || decoded.id || decoded.sub,
        role: decoded.role || 'USER',
        email: decoded.email,
        name: decoded.name,
        iat: decoded.iat,
        exp: decoded.exp
      };
    } catch (error) {
      throw new Error(`Invalid token: ${error.message}`);
    }
  },

  /**
   * Check if token is expired
   * @param {string} token - JWT token
   * @returns {boolean} - true if expired
   */
  isTokenExpired(token) {
    try {
      const decoded = jwt.decode(token);
      if (!decoded || !decoded.exp) return true;
      
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  },

  /**
   * Get user info without verification (for debugging)
   * @param {string} token - JWT token
   * @returns {object} - Decoded payload
   */
  debugToken(token) {
    try {
      return jwt.decode(token);
    } catch (error) {
      return null;
    }
  }
};

// Example usage for developers:

/*
// In your Socket.IO authentication handler:

socket.on('authenticate', async (data) => {
  const { token } = data;
  
  try {
    // Method 1: Use the utility
    const userInfo = TokenDecoder.decodeToken(token, process.env.JWT_SECRET);
    const { userId, role } = userInfo;
    
    // Method 2: Direct JWT verification (if you prefer)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId || decoded.id;
    const role = decoded.role || 'USER';
    
    // Continue with authentication...
    socket.join(`user_${userId}`);
    socket.userId = userId;
    socket.userRole = role;
    
  } catch (error) {
    socket.emit('error', { message: 'Authentication failed' });
  }
});

*/

// Common JWT payload structures developers might encounter:

/*
// Structure 1: Standard
{
  "userId": "user123",
  "role": "USER",
  "email": "user@example.com",
  "iat": 1640995200,
  "exp": 1641081600
}

// Structure 2: Using 'id' instead of 'userId'
{
  "id": "user123",
  "role": "ADMIN",
  "email": "admin@example.com",
  "iat": 1640995200,
  "exp": 1641081600
}

// Structure 3: Using 'sub' (subject) for user ID
{
  "sub": "user123",
  "role": "USER",
  "email": "user@example.com",
  "iat": 1640995200,
  "exp": 1641081600
}

// Structure 4: Nested user object
{
  "user": {
    "id": "user123",
    "role": "USER",
    "email": "user@example.com"
  },
  "iat": 1640995200,
  "exp": 1641081600
}
*/

export default TokenDecoder;
