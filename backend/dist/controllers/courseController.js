"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCertificate = exports.completeLesson = exports.submitQuiz = exports.getLesson = exports.followMentor = exports.getMentors = exports.search = exports.enrollInCourse = exports.getCourseProgress = exports.getCourseDetails = exports.getCourses = void 0;
const db_1 = __importDefault(require("../db"));
const getCourses = (req, res) => {
    var _a;
    try {
        const user = db_1.default.prepare('SELECT target_language FROM users WHERE id = ?').get((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        const courses = db_1.default.prepare('SELECT * FROM courses WHERE language = ?').all(user.target_language);
        res.json(courses);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getCourses = getCourses;
const getCourseDetails = (req, res) => {
    var _a;
    const { courseId } = req.params;
    try {
        const course = db_1.default.prepare('SELECT * FROM courses WHERE id = ?').get(courseId);
        const lessons = db_1.default.prepare(`
      SELECT l.*, up.completed 
      FROM lessons l
      LEFT JOIN user_progress up ON l.id = up.lesson_id AND up.user_id = ?
      WHERE l.course_id = ?
      ORDER BY l.order_index ASC
    `).all((_a = req.user) === null || _a === void 0 ? void 0 : _a.id, courseId);
        res.json(Object.assign(Object.assign({}, course), { lessons }));
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getCourseDetails = getCourseDetails;
const getCourseProgress = (req, res) => {
    var _a;
    const { courseId } = req.params;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    try {
        const progress = db_1.default.prepare(`
      SELECT COUNT(l.id) as total, SUM(CASE WHEN up.completed = 1 THEN 1 ELSE 0 END) as completed
      FROM lessons l
      LEFT JOIN user_progress up ON l.id = up.lesson_id AND up.user_id = ?
      WHERE l.course_id = ?
    `).get(userId, courseId);
        res.json(progress);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getCourseProgress = getCourseProgress;
const enrollInCourse = (req, res) => {
    var _a;
    const { courseId } = req.params;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    try {
        db_1.default.prepare('INSERT OR IGNORE INTO enrollments (user_id, course_id) VALUES (?, ?)').run(userId, courseId);
        db_1.default.prepare('UPDATE courses SET enrolled_count = enrolled_count + 1 WHERE id = ?').run(courseId);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.enrollInCourse = enrollInCourse;
const search = (req, res) => {
    const { q } = req.query;
    try {
        const courses = db_1.default.prepare('SELECT id, title, thumbnail_url, "course" as type FROM courses WHERE title LIKE ?').all(`%${q}%`);
        const lessons = db_1.default.prepare('SELECT id, title, course_id, "lesson" as type FROM lessons WHERE title LIKE ?').all(`%${q}%`);
        res.json([...courses, ...lessons]);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.search = search;
const getMentors = (req, res) => {
    try {
        const mentors = db_1.default.prepare('SELECT id, username, avatar_url, bio, role FROM users WHERE role = "mentor"').all();
        res.json(mentors);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getMentors = getMentors;
const followMentor = (req, res) => {
    var _a;
    const { mentorId } = req.params;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    try {
        db_1.default.prepare('INSERT OR IGNORE INTO follows (follower_id, mentor_id) VALUES (?, ?)').run(userId, mentorId);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.followMentor = followMentor;
const getLesson = (req, res) => {
    const { lessonId } = req.params;
    try {
        const lesson = db_1.default.prepare('SELECT * FROM lessons WHERE id = ?').get(lessonId);
        const quiz = db_1.default.prepare('SELECT id, question, options FROM quizzes WHERE lesson_id = ?').get(lessonId);
        if (quiz) {
            quiz.options = JSON.parse(quiz.options);
        }
        res.json(Object.assign(Object.assign({}, lesson), { quiz }));
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getLesson = getLesson;
const submitQuiz = (req, res) => {
    var _a;
    const { lessonId } = req.params;
    const { answer } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    try {
        const quiz = db_1.default.prepare('SELECT * FROM quizzes WHERE lesson_id = ?').get(lessonId);
        if (!quiz)
            return res.status(404).json({ error: 'Quiz not found' });
        const isCorrect = quiz.correct_answer === answer;
        const score = isCorrect ? 100 : 0;
        const upsertStmt = db_1.default.prepare(`
      INSERT INTO user_progress (user_id, lesson_id, completed, quiz_score)
      VALUES (?, ?, 1, ?)
      ON CONFLICT(user_id, lesson_id) DO UPDATE SET
      completed = 1,
      quiz_score = ?
    `);
        upsertStmt.run(userId, lessonId, score, score);
        res.json({ correct: isCorrect, score });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.submitQuiz = submitQuiz;
const completeLesson = (req, res) => {
    var _a;
    const { lessonId } = req.params;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    try {
        const upsertStmt = db_1.default.prepare(`
      INSERT INTO user_progress (user_id, lesson_id, completed)
      VALUES (?, ?, 1)
      ON CONFLICT(user_id, lesson_id) DO UPDATE SET completed = 1
    `);
        upsertStmt.run(userId, lessonId);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.completeLesson = completeLesson;
const getCertificate = (req, res) => {
    var _a;
    const { courseId } = req.params;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    try {
        // Check if all lessons in course are completed
        const progress = db_1.default.prepare(`
      SELECT COUNT(l.id) as total, SUM(CASE WHEN up.completed = 1 THEN 1 ELSE 0 END) as completed
      FROM lessons l
      LEFT JOIN user_progress up ON l.id = up.lesson_id AND up.user_id = ?
      WHERE l.course_id = ?
    `).get(userId, courseId);
        if (progress.total > 0 && progress.total === progress.completed) {
            // Check if certificate already exists
            let cert = db_1.default.prepare('SELECT * FROM certificates WHERE user_id = ? AND course_id = ?').get(userId, courseId);
            if (!cert) {
                const certCode = `CERT-${userId}-${courseId}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
                const insertStmt = db_1.default.prepare('INSERT INTO certificates (user_id, course_id, certificate_code) VALUES (?, ?, ?)');
                insertStmt.run(userId, courseId, certCode);
                cert = db_1.default.prepare('SELECT * FROM certificates WHERE user_id = ? AND course_id = ?').get(userId, courseId);
            }
            const user = db_1.default.prepare('SELECT username FROM users WHERE id = ?').get(userId);
            const course = db_1.default.prepare('SELECT title FROM courses WHERE id = ?').get(courseId);
            res.json({
                eligible: true,
                certificate: Object.assign(Object.assign({}, cert), { userName: user.username, courseName: course.title })
            });
        }
        else {
            res.json({ eligible: false, message: 'Course not yet completed' });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getCertificate = getCertificate;
//# sourceMappingURL=courseController.js.map