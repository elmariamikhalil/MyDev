import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { getMentorStats, getMentorCourses } from '../controllers/mentorController';

const router = express.Router();

router.use(authenticateToken);

router.get('/stats', getMentorStats);
router.get('/courses', getMentorCourses);

export default router;
