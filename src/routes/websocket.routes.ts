import express from 'express';
import { WebSocketController } from '../controllers/websocket.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

// Mock endpoint for realtime credentials (no auth required)
router.get('/mock-credentials', (req, res) => {
  // Return the same data that the authenticated endpoint would
  res.status(200).json({
    url: 'https://wafsevtyqtmjbdtrtrmq.supabase.co',
    anon_key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhZnNldnR5cXRtamJkdHJ0cm1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczNDQ4ODcsImV4cCI6MjA2MjkyMDg4N30.oZKcEwxTrPLi--K5f1MzBqv3GvXLkm20qLVIMIH8txo'
  });
});

// Protected websocket routes
router.use(authMiddleware);

// WebSocket routes
router.get('/credentials', WebSocketController.getRealtimeCredentials);
router.post('/subscribe/chat/:chatId', WebSocketController.subscribeToChatUpdates);

export default router; 