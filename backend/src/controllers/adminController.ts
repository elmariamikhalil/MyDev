import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { query } from '../db/postgres';

export const requireAdmin = async (req: AuthRequest, res: Response, next: Function) => {
  if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });
  const result = await query('SELECT role FROM users WHERE id = $1', [req.user.id]);
  if (result.rows[0]?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admins only' });
  }
  next();
};

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const usersCount = await query('SELECT COUNT(*)::int as count FROM users');
    const coursesCount = await query('SELECT COUNT(*)::int as count FROM courses');
    const enrollmentsCount = await query('SELECT COUNT(*)::int as count FROM enrollments');
    const mentorsCount = await query("SELECT COUNT(*)::int as count FROM users WHERE role = 'mentor'");

    res.json({
      totalUsers: usersCount.rows[0].count,
      totalCourses: coursesCount.rows[0].count,
      totalEnrollments: enrollmentsCount.rows[0].count,
      totalMentors: mentorsCount.rows[0].count,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await query('SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC');
    res.json(users.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateUserRole = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;
  if (!['student', 'mentor', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  try {
    await query('UPDATE users SET role = $1 WHERE id = $2', [role, id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAllCourses = async (req: AuthRequest, res: Response) => {
  try {
    const courses = await query('SELECT * FROM courses ORDER BY id DESC');
    res.json(courses.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createCourse = async (req: AuthRequest, res: Response) => {
  const { title, description, language, category, difficulty, thumbnail_url, author } = req.body;
  try {
    const result = await query(
      'INSERT INTO courses (title, description, language, category, difficulty, thumbnail_url, author) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [title || null, description || null, language || null, category || 'General', difficulty || 'Beginner', thumbnail_url || null, author || 'Admin']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateCourse = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, description, language, category, difficulty, thumbnail_url, author } = req.body;
  try {
    const result = await query(
      'UPDATE courses SET title = $1, description = $2, language = $3, category = $4, difficulty = $5, thumbnail_url = $6, author = $7 WHERE id = $8 RETURNING *',
      [title || null, description || null, language || null, category || 'General', difficulty || 'Beginner', thumbnail_url || null, author || 'Admin', id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteCourse = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM courses WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Lessons Management
export const getAdminCourseLessons = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const lessons = await query('SELECT * FROM lessons WHERE course_id = $1 ORDER BY order_index ASC', [id]);
    res.json(lessons.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createLesson = async (req: AuthRequest, res: Response) => {
  const { course_id, title, content, type, video_url, order_index } = req.body;
  try {
    const result = await query(
      'INSERT INTO lessons (course_id, title, content, type, video_url, order_index) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [course_id, title || null, content || null, type || 'video', video_url || null, order_index || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateLesson = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, content, type, video_url, order_index } = req.body;
  try {
    const result = await query(
      'UPDATE lessons SET title = $1, content = $2, type = $3, video_url = $4, order_index = $5 WHERE id = $6 RETURNING *',
      [title || null, content || null, type || 'video', video_url || null, order_index || 0, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteLesson = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM lessons WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createPath = async (req: AuthRequest, res: Response) => {
  const { title, description, thumbnail_url } = req.body;
  try {
    const result = await query(
      'INSERT INTO learning_paths (title, description, thumbnail_url) VALUES ($1, $2, $3) RETURNING *',
      [title, description, thumbnail_url || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updatePath = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, description, thumbnail_url } = req.body;
  try {
    const result = await query(
      'UPDATE learning_paths SET title = $1, description = $2, thumbnail_url = $3 WHERE id = $4 RETURNING *',
      [title, description, thumbnail_url || null, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deletePath = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM learning_paths WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAdminPathCourses = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const result = await query(`
      SELECT c.id, c.title, c.thumbnail_url, lpc.order_index 
      FROM learning_path_courses lpc
      JOIN courses c ON c.id = lpc.course_id
      WHERE lpc.path_id = $1
      ORDER BY lpc.order_index ASC
    `, [id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const addCourseToPath = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { course_id } = req.body;
  try {
    // Get max order index
    const maxRes = await query('SELECT MAX(order_index) as max_order FROM learning_path_courses WHERE path_id = $1', [id]);
    const nextOrder = (maxRes.rows[0].max_order || 0) + 1;

    await query(
      'INSERT INTO learning_path_courses (path_id, course_id, order_index) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [id, course_id, nextOrder]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const removeCourseFromPath = async (req: AuthRequest, res: Response) => {
  const { id, courseId } = req.params;
  try {
    await query('DELETE FROM learning_path_courses WHERE path_id = $1 AND course_id = $2', [id, courseId]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
