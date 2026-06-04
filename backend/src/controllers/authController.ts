import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db/postgres';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

export const register = async (req: Request, res: Response) => {
  const { username, password, targetLanguage } = req.body;

  if (!username || !password || !targetLanguage) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = await query(
      'INSERT INTO users (username, password, target_language) VALUES ($1, $2, $3) RETURNING id',
      [username, hashedPassword, targetLanguage]
    );
    
    const newId = result.rows[0].id;
    const token = jwt.sign({ id: newId, username }, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({ token, user: { id: newId, username, targetLanguage } });
  } catch (error: any) {
    if (error.code === '23505') { // Postgres unique violation
      return res.status(400).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { username, password, rememberMe } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const expiresIn = rememberMe ? '30d' : '24h';
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn });

    res.json({ token, user: { id: user.id, username: user.username, targetLanguage: user.target_language, avatarUrl: user.avatar_url, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProfile = async (req: any, res: Response) => {
  const userId = req.user?.id;
  try {
    const result = await query('SELECT id, username, email, target_language, avatar_url, bio, role, streak, created_at FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProfile = async (req: any, res: Response) => {
  const userId = req.user?.id;
  const { username, email, bio, password, avatar_url } = req.body;

  try {
    let sql = 'UPDATE users SET username = $1, email = $2, bio = $3';
    const params: any[] = [username, email, bio];
    let index = 4;

    if (avatar_url !== undefined) {
      sql += `, avatar_url = $${index++}`;
      params.push(avatar_url);
    }

    if (password) {
      const hashedPassword = bcrypt.hashSync(password, 10);
      sql += `, password = $${index++}`;
      params.push(hashedPassword);
    }

    sql += ` WHERE id = $${index}`;
    params.push(userId);

    await query(sql, params);
    res.json({ success: true });
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};
