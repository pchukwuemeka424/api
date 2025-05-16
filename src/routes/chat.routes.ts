import express from 'express';
import { ChatController } from '../controllers/chat.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

// Protected chat routes
router.use(authMiddleware);

// Chat routes
router.get('/', ChatController.getUserChats);
router.post('/', ChatController.createChat);
router.get('/unread-counts', ChatController.getUnreadCounts);
router.get('/:chatId', ChatController.getChatById);

export default router; 