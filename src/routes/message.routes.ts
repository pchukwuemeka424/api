import express from 'express';
import { MessageController } from '../controllers/message.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

// Protected message routes
router.use(authMiddleware);

// Message routes
router.get('/:chatId', MessageController.getMessages);
router.post('/', MessageController.createMessage);
router.patch('/:chatId/read', MessageController.markAsRead);

export default router; 