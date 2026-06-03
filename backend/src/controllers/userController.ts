import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { query } from '../db/postgres';

// GET /api/users/stats
export const getUserStats = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    const progressRes = await query(`
      SELECT
        COUNT(l.id)::int as total,
        SUM(CASE WHEN up.completed = true THEN 1 ELSE 0 END)::int as completed
      FROM enrollments e
      JOIN lessons l ON l.course_id = e.course_id
      LEFT JOIN user_progress up ON up.lesson_id = l.id AND up.user_id = e.user_id
      WHERE e.user_id = $1
    `, [userId]);
    const progress = progressRes.rows[0];

    const overallPercent = progress.total > 0
      ? Math.round((progress.completed / progress.total) * 100)
      : 0;

    const userRes = await query('SELECT streak, last_active FROM users WHERE id = $1', [userId]);
    const user = userRes.rows[0];

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    let streak = user.streak || 0;

    const lastActiveStr = user.last_active ? new Date(user.last_active).toISOString().split('T')[0] : null;

    if (lastActiveStr === yesterday) {
      streak += 1;
      await query('UPDATE users SET streak = $1, last_active = $2 WHERE id = $3', [streak, today, userId]);
    } else if (lastActiveStr !== today) {
      streak = 1;
      await query('UPDATE users SET streak = $1, last_active = $2 WHERE id = $3', [streak, today, userId]);
    }

    const weeklyCompletedRes = await query(`
      SELECT COUNT(*)::int as count
      FROM user_progress
      WHERE user_id = $1 AND completed = true
        AND accessed_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'
    `, [userId]);
    
    const weeklyXp = (weeklyCompletedRes.rows[0].count || 0) * 10;

    const enrolledCountRes = await query(
      'SELECT COUNT(*)::int as count FROM enrollments WHERE user_id = $1', [userId]
    );

    res.json({ overallPercent, streak, weeklyXp, enrolledCourses: enrolledCountRes.rows[0].count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/users/activity
export const getUserActivity = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    const rowsRes = await query(`
      SELECT
        CASE
          WHEN accessed_at >= CURRENT_TIMESTAMP - INTERVAL '10 days' THEN '1'
          WHEN accessed_at >= CURRENT_TIMESTAMP - INTERVAL '20 days' THEN '2'
          ELSE '3'
        END as bucket,
        COUNT(*)::int as count
      FROM user_progress
      WHERE user_id = $1 AND completed = true
        AND accessed_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
      GROUP BY bucket
    `, [userId]);

    const buckets: Record<string, number> = { '1': 0, '2': 0, '3': 0 };
    rowsRes.rows.forEach((r: any) => { buckets[r.bucket] = r.count; });

    res.json([
      { label: '1-10d ago', value: buckets['1'] },
      { label: '11-20d ago', value: buckets['2'] },
      { label: '21-30d ago', value: buckets['3'] },
    ]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/users/notifications
export const getNotifications = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    const notificationsRes = await query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30',
      [userId]
    );
    res.json(notificationsRes.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /api/users/notifications/:id/read
export const markNotificationRead = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { id } = req.params;
  try {
    await query('UPDATE notifications SET read = 1 WHERE id = $1 AND user_id = $2', [id, userId]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /api/users/notifications/read-all
export const markAllNotificationsRead = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    await query('UPDATE notifications SET read = 1 WHERE user_id = $1', [userId]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/users/tasks
export const getTasks = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    const tasksRes = await query(
      'SELECT * FROM tasks WHERE user_id = $1 ORDER BY due_date ASC, created_at DESC',
      [userId]
    );
    res.json(tasksRes.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/users/tasks
export const createTask = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { title, due_date } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  try {
    const result = await query(
      'INSERT INTO tasks (user_id, title, due_date) VALUES ($1, $2, $3) RETURNING id',
      [userId, title, due_date || null]
    );
    const taskRes = await query('SELECT * FROM tasks WHERE id = $1', [result.rows[0].id]);
    res.status(201).json(taskRes.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /api/users/tasks/:id
export const updateTask = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { id } = req.params;
  const { title, due_date, completed } = req.body;
  try {
    await query(
      'UPDATE tasks SET title = COALESCE($1, title), due_date = COALESCE($2, due_date), completed = COALESCE($3, completed) WHERE id = $4 AND user_id = $5',
      [title, due_date, completed !== undefined ? (completed ? 1 : 0) : null, id, userId]
    );
    const taskRes = await query('SELECT * FROM tasks WHERE id = $1', [id]);
    res.json(taskRes.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /api/users/tasks/:id
export const deleteTask = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { id } = req.params;
  try {
    await query('DELETE FROM tasks WHERE id = $1 AND user_id = $2', [id, userId]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/users/mentors
export const getMentors = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    const mentorsRes = await query(`
      SELECT u.id, u.username, u.bio, u.avatar_url,
        (SELECT COUNT(*)::int FROM follows WHERE mentor_id = u.id) as follower_count,
        (SELECT COUNT(*)::int FROM follows WHERE mentor_id = u.id AND follower_id = $1) as is_following
      FROM users u
      WHERE u.role = 'mentor'
    `, [userId]);
    res.json(mentorsRes.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/users/mentors/:id/follow
export const followMentor = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { id } = req.params;
  try {
    await query('INSERT INTO follows (follower_id, mentor_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userId, id]);

    const followerRes = await query('SELECT username FROM users WHERE id = $1', [userId]);
    const follower = followerRes.rows[0];
    if (follower) {
      await query(
        'INSERT INTO notifications (user_id, type, title, message) VALUES ($1, $2, $3, $4)',
        [id, 'follow', 'New Follower', `${follower.username} started following you!`]
      );
    }

    res.json({ success: true, following: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /api/users/mentors/:id/follow
export const unfollowMentor = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { id } = req.params;
  try {
    await query('DELETE FROM follows WHERE follower_id = $1 AND mentor_id = $2', [userId, id]);
    res.json({ success: true, following: false });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/users/inbox
export const getInbox = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    const messagesRes = await query(`
      SELECT m.*, u.username as from_username
      FROM messages m
      JOIN users u ON u.id = m.from_user_id
      WHERE m.to_user_id = $1
      ORDER BY m.created_at DESC
    `, [userId]);
    res.json(messagesRes.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
