import { Request, Response } from 'express';
import { MatchModel } from '../models/match.model';
import Joi from 'joi';

// Validation schema
const likeSchema = Joi.object({
  likeeId: Joi.string().required()
});

export const MatchController = {
  async createLike(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Validate request body
      const { error, value } = likeSchema.validate(req.body);
      if (error) {
        res.status(400).json({ error: error.details[0].message });
        return;
      }

      const { likeeId } = value;
      const result = await MatchModel.createLike(userId, likeeId);

      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async removeLike(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { likeeId } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!likeeId) {
        res.status(400).json({ error: 'Likee ID is required' });
        return;
      }

      await MatchModel.removeLike(userId, likeeId);
      res.status(200).json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getLikes(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const likes = await MatchModel.getLikes(userId);
      res.status(200).json(likes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getMatches(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const matches = await MatchModel.getMatches(userId);
      res.status(200).json(matches);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async checkMatch(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { otherUserId } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!otherUserId) {
        res.status(400).json({ error: 'Other user ID is required' });
        return;
      }

      const isMatch = await MatchModel.isMatch(userId, otherUserId);
      res.status(200).json({ isMatch });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}; 