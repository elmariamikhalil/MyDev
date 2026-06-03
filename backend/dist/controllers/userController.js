"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTask = exports.getTasks = exports.getInbox = exports.markNotificationRead = exports.getNotifications = exports.getUserActivity = exports.getUserStats = void 0;
const db_1 = __importDefault(require("../db"));
const getUserStats = (req, res) => {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    try {
        const totalLessons = db_1.default.prepare('SELECT COUNT(*) as count FROM lessons').get();
        const completedLessons = db_1.default.prepare('SELECT COUNT(*) as count FROM user_progress WHERE user_id = ? AND completed = 1').get(userId);
        const user = db_1.default.prepare('SELECT streak FROM users WHERE id = ?').get(userId);
        const overallPercent = totalLessons.count > 0 ? Math.round((completedLessons.count / totalLessons.count) * 100) : 0;
        res.json({
            overallPercent,
            weeklyXp: completedLessons.count * 10, // Simple XP logic
            streak: user.streak || 0
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getUserStats = getUserStats;
const getUserActivity = (req, res) => {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    try {
        // Return last 30 days activity (mocking some data for now but structure is correct)
        const activity = db_1.default.prepare(`
      SELECT date(accessed_at) as date, COUNT(*) as count
      FROM user_progress
      WHERE user_id = ? AND completed = 1
      GROUP BY date(accessed_at)
      ORDER BY date DESC
      LIMIT 30
    `).all(userId);
        res.json(activity);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getUserActivity = getUserActivity;
const getNotifications = (req, res) => {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    try {
        const notifications = db_1.default.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC').all(userId);
        res.json(notifications);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getNotifications = getNotifications;
const markNotificationRead = (req, res) => {
    var _a;
    const { id } = req.params;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    try {
        db_1.default.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?').run(id, userId);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.markNotificationRead = markNotificationRead;
const getInbox = (req, res) => {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    try {
        const messages = db_1.default.prepare(`
      SELECT m.*, u.username as from_username
      FROM messages m
      JOIN users u ON m.from_user_id = u.id
      WHERE m.to_user_id = ?
      ORDER BY m.created_at DESC
    `).all(userId);
        res.json(messages);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getInbox = getInbox;
const getTasks = (req, res) => {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    try {
        const tasks = db_1.default.prepare('SELECT * FROM tasks WHERE user_id = ? ORDER BY due_date ASC').all(userId);
        res.json(tasks);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getTasks = getTasks;
const createTask = (req, res) => {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const { title, dueDate } = req.body;
    try {
        const result = db_1.default.prepare('INSERT INTO tasks (user_id, title, due_date) VALUES (?, ?, ?)').run(userId, title, dueDate);
        res.status(201).json({ id: result.lastInsertRowid, title, dueDate, completed: false });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.createTask = createTask;
//# sourceMappingURL=userController.js.map