import { NextFunction, Response, Request } from "express";
import jwt from "jsonwebtoken";
import prisma from "../../config/prisma";


export const authMiddleware = (allowedRoles?: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Get token from authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({ error: 'Missing authorization header' });
      return;
    }

    // The header format should be "Bearer TOKEN"
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      res.status(401).json({ error: 'Invalid token format' });
      return;
    }

    try {
      // Get JWT secret from environment variables
      const secretKey = process.env.JWT_SECRET || 'your-default-secret-key';
      
      // Verify the JWT
      const decoded = jwt.verify(token, secretKey) as { userId: string  };
      
      if (!decoded || !decoded.userId) {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          role: true
        }
      });

      if (!user) {
        res.status(401).json({ error: 'User not found' });
        return;
      }

      // If roles are specified, check user's role
      if (allowedRoles && allowedRoles.length > 0) {
        if (!user.role || !allowedRoles.includes(user.role)) {
          res.status(403).json({ error: 'Insufficient permissions' });
          return;
        }
      }

      // Set user in request object
      req.user = user;
      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({ error: 'Invalid or expired token' });
        return;
      }
      
      console.error('Auth middleware error:', error);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
  };
};
