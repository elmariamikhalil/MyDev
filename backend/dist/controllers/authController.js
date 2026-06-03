"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.getProfile = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../db"));
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const register = (req, res) => {
    const { username, password, targetLanguage } = req.body;
    if (!username || !password || !targetLanguage) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    try {
        const hashedPassword = bcryptjs_1.default.hashSync(password, 10);
        const stmt = db_1.default.prepare('INSERT INTO users (username, password, target_language) VALUES (?, ?, ?)');
        const result = stmt.run(username, hashedPassword, targetLanguage);
        const token = jsonwebtoken_1.default.sign({ id: result.lastInsertRowid, username }, JWT_SECRET, { expiresIn: '24h' });
        res.status(201).json({ token, user: { id: result.lastInsertRowid, username, targetLanguage } });
    }
    catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(400).json({ error: 'Username already exists' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.register = register;
const login = (req, res) => {
    const { username, password, rememberMe } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    try {
        const user = db_1.default.prepare('SELECT * FROM users WHERE username = ?').get(username);
        if (!user || !bcryptjs_1.default.compareSync(password, user.password)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const expiresIn = rememberMe ? '30d' : '24h';
        const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn });
        res.json({ token, user: { id: user.id, username: user.username, targetLanguage: user.target_language, avatarUrl: user.avatar_url } });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.login = login;
const getProfile = (req, res) => {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    try {
        const user = db_1.default.prepare('SELECT id, username, email, target_language, avatar_url, bio, role, streak, created_at FROM users WHERE id = ?').get(userId);
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getProfile = getProfile;
const updateProfile = (req, res) => {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const { username, email, bio, password } = req.body;
    try {
        let query = 'UPDATE users SET username = ?, email = ?, bio = ?';
        const params = [username, email, bio];
        if (password) {
            const hashedPassword = bcryptjs_1.default.hashSync(password, 10);
            query += ', password = ?';
            params.push(hashedPassword);
        }
        query += ' WHERE id = ?';
        params.push(userId);
        db_1.default.prepare(query).run(...params);
        res.json({ success: true });
    }
    catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.updateProfile = updateProfile;
//# sourceMappingURL=authController.js.map