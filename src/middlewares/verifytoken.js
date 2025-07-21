import jwt from 'jsonwebtoken';
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const verifyToken = async (req, res, next) => {

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'invalid credentials' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.SECRET_CODE);
    const user = await prisma.user.findUnique({ where: { email: decoded.email } });
console.log("Decoded token:", decoded);
    if (!user) {
      return res.status(401).json({ message: 'invalid credentials for the user' });
    }

 req.user = {
  userId: user.id,
        
      uid: decoded.uid,
        email: decoded.email,
        role: decoded.role,
        rememberMe: decoded.rememberMe
    };

    next();
  } catch (error) {
    console.error("Token verification error:", error.message);
    if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'unauthorized token expired' });
    }
    return res.status(401).json({ message: 'unauthorized invalid token' });
  }
};


export default verifyToken;