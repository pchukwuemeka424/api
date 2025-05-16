import { Request, Response } from 'express';
import { AuthModel, SignupDto, LoginDto } from '../models/auth.model';
import Joi from 'joi';
import jwt from 'jsonwebtoken';

// Validation schemas
const signupSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().required(),
  age: Joi.number().integer().min(18).max(100),
  location: Joi.string()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export const AuthController = {
  async signup(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const { error, value } = signupSchema.validate(req.body);
      if (error) {
        res.status(400).json({ error: error.details[0].message });
        return;
      }

      // Create user
      const userData: SignupDto = value;
      const result = await AuthModel.signup(userData);

      res.status(201).json(result);
    } catch (error: any) {
      console.error("Signup error:", error);
      res.status(400).json({ error: error.message });
    }
  },
  
  // Debug signup endpoint that doesn't use Supabase
  async debugSignup(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const { error, value } = signupSchema.validate(req.body);
      if (error) {
        res.status(400).json({ error: error.details[0].message });
        return;
      }

      // Log the request body
      console.log('Debug signup request body:', value);
      
      // Generate a mock user ID
      const userId = `user-${Date.now()}`;
      
      // Generate a token
      const jwtSecret = process.env.JWT_SECRET || 'default_jwt_secret';
      const token = jwt.sign(
        { userId }, 
        jwtSecret, 
        { expiresIn: '7d' }
      );
      
      // Create a mock user object
      const user = {
        id: userId,
        email: value.email,
        name: value.name,
        age: value.age || 25,
        location: value.location || 'Default City',
        created_at: new Date().toISOString(),
        is_online: true
      };
      
      // Return the mock user and token
      res.status(201).json({
        token,
        user
      });
    } catch (error: any) {
      console.error("Debug signup error:", error);
      res.status(400).json({ error: error.message, stack: error.stack });
    }
  },

  async login(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const { error, value } = loginSchema.validate(req.body);
      if (error) {
        res.status(400).json({ error: error.details[0].message });
        return;
      }

      // Login user
      const credentials: LoginDto = value;
      const result = await AuthModel.login(credentials);

      res.status(200).json(result);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  },

  async logout(req: Request, res: Response): Promise<void> {
    try {
      // Get user ID from authenticated request
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      await AuthModel.logout(userId);
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}; 