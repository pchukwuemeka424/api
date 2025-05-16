import { Request, Response } from 'express';
import { ChatModel } from '../models/chat.model';
import Joi from 'joi';

// Validation schemas
const createChatSchema = Joi.object({
  userIds: Joi.array().items(Joi.string()).min(1).required()
});

export const ChatController = {
  async getUserChats(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const chats = await ChatModel.getUserChats(userId);
      res.status(200).json(chats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getChatById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { chatId } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!chatId) {
        res.status(400).json({ error: 'Chat ID is required' });
        return;
      }

      const chat = await ChatModel.findById(chatId, userId);

      if (!chat) {
        res.status(404).json({ error: 'Chat not found or access denied' });
        return;
      }

      res.status(200).json(chat);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async createChat(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Validate request body
      const { error, value } = createChatSchema.validate(req.body);
      if (error) {
        res.status(400).json({ error: error.details[0].message });
        return;
      }

      // Ensure current user is included in the participants
      let { userIds } = value;
      if (!userIds.includes(userId)) {
        userIds = [userId, ...userIds];
      }

      const chat = await ChatModel.createChat(userIds);

      if (!chat) {
        res.status(400).json({ error: 'Failed to create chat' });
        return;
      }

      res.status(201).json(chat);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getUnreadCounts(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const unreadCounts = await ChatModel.getUnreadCounts(userId);
      res.status(200).json(unreadCounts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}; 