import { Request, Response, NextFunction } from 'express';
import { AuthModel } from '../models/auth.model';

// Extend the Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        isAdmin?: boolean;
      };
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Get token from authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized - Missing or invalid token format' });
      return;
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const { userId } = AuthModel.verifyToken(token);
    
    // Set user in request
    req.user = { id: userId };
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized - Invalid token' });
  }
};

// Admin authorization middleware
export const adminMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // First verify the user is authenticated
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    // This is a simple admin check for demonstration
    // In a real app, you would check against admin status in the database
    req.user.isAdmin = true; // Demo only - in real app, get from DB
    
    next();
  } catch (error) {
    res.status(403).json({ error: 'Forbidden - Admin access required' });
  }
}; 