import { Router } from 'express';
import {
  getUserStats, getUserActivity,
  getNotifications, markNotificationRead, markAllNotificationsRead,
  getTasks, createTask, updateTask, deleteTask,
  getMentors, followMentor, unfollowMentor,
  getInbox
} from '../controllers/userController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();
router.use(authenticateToken);

router.get('/stats', getUserStats);
router.get('/activity', getUserActivity);

router.get('/notifications', getNotifications);
router.put('/notifications/read-all', markAllNotificationsRead);
router.put('/notifications/:id/read', markNotificationRead);

router.get('/tasks', getTasks);
router.post('/tasks', createTask);
router.put('/tasks/:id', updateTask);
router.delete('/tasks/:id', deleteTask);

router.get('/mentors', getMentors);
router.post('/mentors/:id/follow', followMentor);
router.delete('/mentors/:id/follow', unfollowMentor);

router.get('/inbox', getInbox);

export default router;
