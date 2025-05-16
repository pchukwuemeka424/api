import { Request, Response } from 'express';
import { UserModel, UpdateUserDto } from '../models/user.model';
import Joi from 'joi';

// Validation schema
const updateUserSchema = Joi.object({
  name: Joi.string(),
  age: Joi.number().integer().min(18).max(100),
  location: Joi.string(),
  bio: Joi.string().max(500),
  job: Joi.string(),
  image_url: Joi.string().uri(),
  interests: Joi.array().items(Joi.string())
});

export const UserController = {
  async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const user = await UserModel.findById(userId);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.status(200).json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getUserProfile(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await UserModel.findById(id);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.status(200).json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Validate request body
      const { error, value } = updateUserSchema.validate(req.body);
      if (error) {
        res.status(400).json({ error: error.details[0].message });
        return;
      }

      const updateData: UpdateUserDto = value;
      const updatedUser = await UserModel.update(userId, updateData);

      res.status(200).json(updatedUser);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getNearbyUsers(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { location, limit } = req.query;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!location || typeof location !== 'string') {
        res.status(400).json({ error: 'Location is required' });
        return;
      }

      const limitNum = limit ? parseInt(limit as string) : 20;
      const users = await UserModel.findNearby(userId, location, limitNum);

      res.status(200).json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const { limit = '50', offset = '0' } = req.query;
      
      // Verify admin role (would need proper implementation)
      if (!req.user?.isAdmin) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      const users = await UserModel.findAll(
        parseInt(limit as string),
        parseInt(offset as string)
      );

      res.status(200).json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}; 