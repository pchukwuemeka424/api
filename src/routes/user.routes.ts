import express from 'express';
import { UserController } from '../controllers/user.controller';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

// Protected user routes
router.use(authMiddleware);

// Current user
router.get('/me', UserController.getCurrentUser);
router.put('/me', UserController.updateProfile);

// Other users
router.get('/nearby', UserController.getNearbyUsers);
router.get('/:id', UserController.getUserProfile);

// Admin routes
router.get('/', adminMiddleware, UserController.getAllUsers);

export default router; 