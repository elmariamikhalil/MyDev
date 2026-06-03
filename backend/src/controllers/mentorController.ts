import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { query } from '../db/postgres';

// GET /api/mentor/stats
export const getMentorStats = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    // Total Followers
    const followersRes = await query('SELECT COUNT(*)::int as count FROM follows WHERE following_id = $1', [userId]);
    const followers = followersRes.rows[0].count;

    // Total Courses Created
    const username = req.user?.username;
    const coursesRes = await query('SELECT id FROM courses WHERE author = $1', [username]);
    const courseIds = coursesRes.rows.map(r => r.id);
    const totalCourses = courseIds.length;

    // Total Active Students (enrollments in their courses)
    let totalStudents = 0;
    if (courseIds.length > 0) {
      const placeholders = courseIds.map((_, i) => `$${i + 1}`).join(',');
      const studentsRes = await query(
        `SELECT COUNT(DISTINCT user_id)::int as count FROM enrollments WHERE course_id IN (${placeholders})`,
        courseIds
      );
      totalStudents = studentsRes.rows[0].count;
    }

    res.json({ followers, totalStudents, totalCourses });
  } catch (error) {
    console.error('Mentor stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/mentor/courses
export const getMentorCourses = async (req: AuthRequest, res: Response) => {
  const username = req.user?.username;
  try {
    const result = await query(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) as total_lessons,
        (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as total_students
      FROM courses c
      WHERE author = $1
      ORDER BY c.created_at DESC
    `, [username]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Mentor courses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
