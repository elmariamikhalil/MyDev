import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { 
  requireAdmin, 
  getDashboardStats, 
  getAllUsers, 
  updateUserRole, 
  getAllCourses, 
  createCourse, 
  updateCourse,
  deleteCourse,
  getAdminCourseLessons,
  createLesson,
  updateLesson,
  deleteLesson,
  createPath,
  updatePath,
  deletePath,
  getAdminPathCourses,
  addCourseToPath,
  removeCourseFromPath
} from '../controllers/adminController';

const router = express.Router();

router.use(authenticateToken, requireAdmin);

// Dashboard
router.get('/stats', getDashboardStats);

// Users
router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);

// Courses
router.get('/courses', getAllCourses);
router.post('/courses', createCourse);
router.put('/courses/:id', updateCourse);
router.delete('/courses/:id', deleteCourse);

// Lessons
router.get('/courses/:id/lessons', getAdminCourseLessons);
router.post('/lessons', createLesson);
router.put('/lessons/:id', updateLesson);
router.delete('/lessons/:id', deleteLesson);

// Paths
router.get('/paths', (req, res) => res.redirect('/api/paths')); // Just fallback if requested
router.post('/paths', createPath);
router.put('/paths/:id', updatePath);
router.delete('/paths/:id', deletePath);

// Path Courses
router.get('/paths/:id/courses', getAdminPathCourses);
router.post('/paths/:id/courses', addCourseToPath);
router.delete('/paths/:id/courses/:courseId', removeCourseFromPath);

export default router;
