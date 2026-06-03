import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { query } from '../db/postgres';

export const getCourses = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    const userRes = await query('SELECT target_language FROM users WHERE id = $1', [userId]);
    const targetLang = userRes.rows[0]?.target_language || '';

    const result = await query(`
      SELECT c.*,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(DISTINCT r.id)::int as review_count,
        (SELECT COUNT(*)::int FROM enrollments WHERE user_id = $1 AND course_id = c.id) as is_enrolled
      FROM courses c
      LEFT JOIN reviews r ON r.course_id = c.id
      GROUP BY c.id
      ORDER BY (c.language = $2) DESC, c.id DESC
    `, [userId, targetLang]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getEnrolledCourses = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    const result = await query(`
      SELECT c.*,
        COUNT(l.id)::int as total_lessons,
        SUM(CASE WHEN up.completed = true THEN 1 ELSE 0 END)::int as completed_lessons,
        COALESCE(AVG(r.rating), 0) as avg_rating
      FROM enrollments e
      JOIN courses c ON c.id = e.course_id
      LEFT JOIN lessons l ON l.course_id = c.id
      LEFT JOIN user_progress up ON up.lesson_id = l.id AND up.user_id = e.user_id
      LEFT JOIN reviews r ON r.course_id = c.id
      WHERE e.user_id = $1
      GROUP BY c.id
    `, [userId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const enrollCourse = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { courseId } = req.params;
  try {
    await query('INSERT INTO enrollments (user_id, course_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userId, courseId]);
    await query('UPDATE courses SET enrolled_count = enrolled_count + 1 WHERE id = $1', [courseId]);

    // Notification
    const courseRes = await query('SELECT title FROM courses WHERE id = $1', [courseId]);
    const course = courseRes.rows[0];
    if (course) {
      await query(
        'INSERT INTO notifications (user_id, type, title, message) VALUES ($1, $2, $3, $4)',
        [userId, 'enroll', 'Enrolled!', `You joined "${course.title}". Good luck! 🎉`]
      );
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCourseProgress = async (req: AuthRequest, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user?.id;
  try {
    const result = await query(`
      SELECT COUNT(l.id)::int as total,
        SUM(CASE WHEN up.completed = true THEN 1 ELSE 0 END)::int as completed
      FROM lessons l
      LEFT JOIN user_progress up ON l.id = up.lesson_id AND up.user_id = $1
      WHERE l.course_id = $2
    `, [userId, courseId]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCourseDetails = async (req: AuthRequest, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user?.id;
  try {
    const courseRes = await query(`
      SELECT c.*, 
        (SELECT COUNT(*)::int FROM enrollments WHERE user_id = $1 AND course_id = c.id) as is_enrolled 
      FROM courses c WHERE c.id = $2
    `, [userId, courseId]);

    if (courseRes.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const course = courseRes.rows[0];
    // Convert count to boolean
    course.is_enrolled = course.is_enrolled > 0;

    const lessonsRes = await query(`
      SELECT l.*, up.completed, up.notes, up.accessed_at,
        (SELECT COUNT(*)::int FROM bookmarks WHERE lesson_id = l.id AND user_id = $1) as is_bookmarked
      FROM lessons l
      LEFT JOIN user_progress up ON l.id = up.lesson_id AND up.user_id = $2
      WHERE l.course_id = $3
      ORDER BY l.order_index ASC
    `, [userId, userId, courseId]);

    res.json({ course, lessons: lessonsRes.rows });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getLesson = async (req: AuthRequest, res: Response) => {
  const { lessonId } = req.params;
  const userId = req.user?.id;
  try {
    const lessonRes = await query('SELECT * FROM lessons WHERE id = $1', [lessonId]);
    const lesson = lessonRes.rows[0];
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

    const quizRes = await query('SELECT id, question, options, explanation FROM quizzes WHERE lesson_id = $1', [lessonId]);
    const quiz = quizRes.rows[0];
    if (quiz) quiz.options = JSON.parse(quiz.options);

    const progressRes = await query('SELECT completed, notes FROM user_progress WHERE user_id = $1 AND lesson_id = $2', [userId, lessonId]);
    const progress = progressRes.rows[0];

    // Update accessed_at
    await query(`
      INSERT INTO user_progress (user_id, lesson_id, accessed_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, lesson_id) DO UPDATE SET accessed_at = CURRENT_TIMESTAMP
    `, [userId, lessonId]);

    res.json({ ...lesson, quiz, completed: progress?.completed ? 1 : 0, notes: progress?.notes || '' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const submitQuiz = async (req: AuthRequest, res: Response) => {
  const { lessonId } = req.params;
  const { answer } = req.body;
  const userId = req.user?.id;

  try {
    const quizRes = await query('SELECT * FROM quizzes WHERE lesson_id = $1', [lessonId]);
    const quiz = quizRes.rows[0];
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    const isCorrect = quiz.correct_answer === answer;
    const score = isCorrect ? 100 : 0;

    // Record attempt
    await query(
      'INSERT INTO quiz_attempts (user_id, lesson_id, answer, correct) VALUES ($1, $2, $3, $4)',
      [userId, lessonId, answer, isCorrect ? 1 : 0]
    );

    if (isCorrect) {
      await query(`
        INSERT INTO user_progress (user_id, lesson_id, completed, quiz_score)
        VALUES ($1, $2, true, $3)
        ON CONFLICT(user_id, lesson_id) DO UPDATE SET completed = true, quiz_score = $4
      `, [userId, lessonId, score, score]);
    }

    res.json({ correct: isCorrect, score, explanation: quiz.explanation });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const completeLesson = async (req: AuthRequest, res: Response) => {
  const { lessonId } = req.params;
  const userId = req.user?.id;

  try {
    await query(`
      INSERT INTO user_progress (user_id, lesson_id, completed)
      VALUES ($1, $2, true)
      ON CONFLICT(user_id, lesson_id) DO UPDATE SET completed = true
    `, [userId, lessonId]);

    // Check if entire course is done → add cert notification
    const lessonRes = await query('SELECT course_id FROM lessons WHERE id = $1', [lessonId]);
    const lesson = lessonRes.rows[0];
    if (!lesson) return res.json({ success: true });

    const progressRes = await query(`
      SELECT COUNT(l.id)::int as total, SUM(CASE WHEN up.completed = true THEN 1 ELSE 0 END)::int as completed
      FROM lessons l
      LEFT JOIN user_progress up ON l.id = up.lesson_id AND up.user_id = $1
      WHERE l.course_id = $2
    `, [userId, lesson.course_id]);
    const progress = progressRes.rows[0];

    if (progress.total > 0 && progress.total === progress.completed) {
      const courseRes = await query('SELECT title FROM courses WHERE id = $1', [lesson.course_id]);
      const course = courseRes.rows[0];
      if (course) {
        await query(
          'INSERT INTO notifications (user_id, type, title, message) VALUES ($1, $2, $3, $4)',
          [userId, 'certificate', '🎓 Course Complete!', `You completed "${course.title}" — your certificate is ready!`]
        );
      }
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const saveNotes = async (req: AuthRequest, res: Response) => {
  const { lessonId } = req.params;
  const userId = req.user?.id;
  const { notes } = req.body;
  try {
    await query(`
      INSERT INTO user_progress (user_id, lesson_id, notes)
      VALUES ($1, $2, $3)
      ON CONFLICT(user_id, lesson_id) DO UPDATE SET notes = $4
    `, [userId, lessonId, notes, notes]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const toggleBookmark = async (req: AuthRequest, res: Response) => {
  const { lessonId } = req.params;
  const userId = req.user?.id;
  try {
    const existingRes = await query('SELECT 1 FROM bookmarks WHERE user_id = $1 AND lesson_id = $2', [userId, lessonId]);
    const existing = existingRes.rows[0];
    if (existing) {
      await query('DELETE FROM bookmarks WHERE user_id = $1 AND lesson_id = $2', [userId, lessonId]);
      res.json({ bookmarked: false });
    } else {
      await query('INSERT INTO bookmarks (user_id, lesson_id) VALUES ($1, $2)', [userId, lessonId]);
      res.json({ bookmarked: true });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCertificate = async (req: AuthRequest, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user?.id;

  try {
    const progressRes = await query(`
      SELECT COUNT(l.id)::int as total, SUM(CASE WHEN up.completed = true THEN 1 ELSE 0 END)::int as completed
      FROM lessons l
      LEFT JOIN user_progress up ON l.id = up.lesson_id AND up.user_id = $1
      WHERE l.course_id = $2
    `, [userId, courseId]);
    const progress = progressRes.rows[0];

    if (progress.total > 0 && progress.total === progress.completed) {
      let certRes = await query('SELECT * FROM certificates WHERE user_id = $1 AND course_id = $2', [userId, courseId]);
      let cert = certRes.rows[0];

      if (!cert) {
        const certCode = `CERT-${userId}-${courseId}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        await query('INSERT INTO certificates (user_id, course_id, certificate_code) VALUES ($1, $2, $3)', [userId, courseId, certCode]);
        certRes = await query('SELECT * FROM certificates WHERE user_id = $1 AND course_id = $2', [userId, courseId]);
        cert = certRes.rows[0];
      }

      const userRes = await query('SELECT username FROM users WHERE id = $1', [userId]);
      const courseRes = await query('SELECT title FROM courses WHERE id = $1', [courseId]);

      res.json({
        eligible: true,
        certificate: { ...cert, userName: userRes.rows[0]?.username, courseName: courseRes.rows[0]?.title }
      });
    } else {
      res.json({ eligible: false, message: 'Course not yet completed' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getReviews = async (req: AuthRequest, res: Response) => {
  const { courseId } = req.params;
  try {
    const result = await query(`
      SELECT r.*, u.username
      FROM reviews r JOIN users u ON u.id = r.user_id
      WHERE r.course_id = $1
      ORDER BY r.created_at DESC
    `, [courseId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const submitReview = async (req: AuthRequest, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user?.id;
  const { rating, body } = req.body;
  if (!rating) return res.status(400).json({ error: 'Rating is required' });
  try {
    await query(`
      INSERT INTO reviews (user_id, course_id, rating, body) VALUES ($1, $2, $3, $4)
      ON CONFLICT(user_id, course_id) DO UPDATE SET rating = $5, body = $6
    `, [userId, courseId, rating, body, rating, body]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const globalSearch = async (req: AuthRequest, res: Response) => {
  const q = `%${req.query.q || ''}%`;
  try {
    const coursesRes = await query(
      "SELECT id, title, category, 'course' as type FROM courses WHERE title ILIKE $1 OR description ILIKE $2 LIMIT 5",
      [q, q]
    );
    const lessonsRes = await query(
      "SELECT l.id, l.title, c.title as course_title, 'lesson' as type FROM lessons l JOIN courses c ON c.id = l.course_id WHERE l.title ILIKE $1 LIMIT 5",
      [q]
    );
    res.json({ courses: coursesRes.rows, lessons: lessonsRes.rows });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
