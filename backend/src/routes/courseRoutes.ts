import { Router } from 'express';
import {
  getCourses, getEnrolledCourses, enrollCourse, getCourseProgress,
  getCourseDetails, getLesson, submitQuiz, completeLesson,
  saveNotes, toggleBookmark, getCertificate,
  getReviews, submitReview, globalSearch
} from '../controllers/courseController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();
router.use(authenticateToken);

router.get('/search', globalSearch);
router.get('/', getCourses);
router.get('/enrolled', getEnrolledCourses);
router.post('/:courseId/enroll', enrollCourse);
router.get('/:courseId/progress', getCourseProgress);
router.get('/:courseId', getCourseDetails);
router.get('/lesson/:lessonId', getLesson);
router.post('/lesson/:lessonId/complete', completeLesson);
router.post('/lesson/:lessonId/quiz', submitQuiz);
router.put('/lesson/:lessonId/notes', saveNotes);
router.post('/lesson/:lessonId/bookmark', toggleBookmark);
router.get('/:courseId/certificate', getCertificate);
router.get('/:courseId/reviews', getReviews);
router.post('/:courseId/reviews', submitReview);

export default router;
