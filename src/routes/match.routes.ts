import express from 'express';
import { MatchController } from '../controllers/match.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

// Protected match routes
router.use(authMiddleware);

// Likes
router.post('/like', MatchController.createLike);
router.delete('/like/:likeeId', MatchController.removeLike);
router.get('/likes', MatchController.getLikes);

// Matches
router.get('/matches', MatchController.getMatches);
router.get('/check/:otherUserId', MatchController.checkMatch);

export default router; 