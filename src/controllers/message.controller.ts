import { Request, Response } from 'express';
import { MessageModel, CreateMessageDto } from '../models/chat.model';
import Joi from 'joi';

// Validation schemas
const createMessageSchema = Joi.object({
  chat_id: Joi.string().required(),
  text: Joi.string().required(),
  image_url: Joi.string().uri()
});

export const MessageController = {
  async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { chatId } = req.params;
      const { limit = '50', offset = '0' } = req.query;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!chatId) {
        res.status(400).json({ error: 'Chat ID is required' });
        return;
      }

      const messages = await MessageModel.findByChatId(
        chatId,
        userId,
        parseInt(limit as string),
        parseInt(offset as string)
      );

      res.status(200).json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async createMessage(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Validate request body
      const { error, value } = createMessageSchema.validate(req.body);
      if (error) {
        res.status(400).json({ error: error.details[0].message });
        return;
      }

      const messageData: CreateMessageDto = {
        ...value,
        sender_id: userId
      };

      const message = await MessageModel.create(messageData);
      res.status(201).json(message);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async markAsRead(req: Request, res: Response): Promise<void> {
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

      await MessageModel.markAsRead(chatId, userId);
      res.status(200).json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}; 