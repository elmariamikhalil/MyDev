import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { query } from '../db/postgres';

export const getPaths = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(`
      SELECT p.*,
        (SELECT COUNT(*)::int FROM learning_path_courses WHERE path_id = p.id) as total_courses
      FROM learning_paths p
      ORDER BY p.id DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPathDetails = async (req: AuthRequest, res: Response) => {
  const { pathId } = req.params;
  const userId = req.user?.id;
  try {
    const pathRes = await query('SELECT * FROM learning_paths WHERE id = $1', [pathId]);
    if (pathRes.rows.length === 0) return res.status(404).json({ error: 'Path not found' });
    const path = pathRes.rows[0];

    const coursesRes = await query(`
      SELECT c.*, lpc.order_index,
        (SELECT COUNT(*)::int FROM enrollments WHERE user_id = $1 AND course_id = c.id) as is_enrolled
      FROM learning_path_courses lpc
      JOIN courses c ON c.id = lpc.course_id
      WHERE lpc.path_id = $2
      ORDER BY lpc.order_index ASC
    `, [userId, pathId]);

    // Check if path is fully completed by checking if all lessons in all courses are completed
    let pathCompleted = false;
    let certEligible = false;
    let certificate = null;

    if (coursesRes.rows.length > 0) {
      const completionCheck = await query(`
        SELECT 
          (SELECT COUNT(l.id) FROM learning_path_courses lpc 
           JOIN lessons l ON l.course_id = lpc.course_id 
           WHERE lpc.path_id = $1) as total_path_lessons,
           
          (SELECT COUNT(up.lesson_id) FROM learning_path_courses lpc
           JOIN lessons l ON l.course_id = lpc.course_id
           JOIN user_progress up ON up.lesson_id = l.id
           WHERE lpc.path_id = $1 AND up.user_id = $2 AND up.completed = true) as completed_path_lessons
      `, [pathId, userId]);

      const total = parseInt(completionCheck.rows[0].total_path_lessons);
      const completed = parseInt(completionCheck.rows[0].completed_path_lessons);
      
      pathCompleted = total > 0 && total === completed;
      certEligible = pathCompleted;
      
      if (pathCompleted) {
        const certRes = await query('SELECT * FROM certificates WHERE user_id = $1 AND path_id = $2', [userId, pathId]);
        if (certRes.rows.length > 0) {
          certificate = certRes.rows[0];
        } else {
          // Auto generate certificate
          const code = Math.random().toString(36).substring(2, 10).toUpperCase();
          const newCert = await query(
            'INSERT INTO certificates (user_id, path_id, certificate_code) VALUES ($1, $2, $3) RETURNING *',
            [userId, pathId, code]
          );
          certificate = newCert.rows[0];
        }
      }
    }

    res.json({ path, courses: coursesRes.rows, pathCompleted, certEligible, certificate });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const enrollInPath = async (req: AuthRequest, res: Response) => {
  const { pathId } = req.params;
  const userId = req.user?.id;
  try {
    const coursesRes = await query('SELECT course_id FROM learning_path_courses WHERE path_id = $1', [pathId]);
    for (const row of coursesRes.rows) {
      await query('INSERT INTO enrollments (user_id, course_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userId, row.course_id]);
      await query('UPDATE courses SET enrolled_count = enrolled_count + 1 WHERE id = $1', [row.course_id]);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
