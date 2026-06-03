"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDb = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const dbPath = path_1.default.resolve(__dirname, '../../database.sqlite');
const db = new better_sqlite3_1.default(dbPath);
db.pragma('journal_mode = WAL');
const initDb = () => {
    db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE,
      password TEXT NOT NULL,
      target_language TEXT NOT NULL,
      avatar_url TEXT,
      bio TEXT,
      role TEXT DEFAULT 'student',
      streak INTEGER DEFAULT 0,
      last_active DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      language TEXT NOT NULL,
      thumbnail_url TEXT,
      author TEXT,
      category TEXT,
      difficulty TEXT,
      enrolled_count INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      type TEXT CHECK(type IN ('text', 'video')) DEFAULT 'text',
      video_url TEXT,
      order_index INTEGER NOT NULL,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS quizzes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id INTEGER NOT NULL,
      question TEXT NOT NULL,
      options TEXT NOT NULL, -- JSON string of options
      correct_answer TEXT NOT NULL,
      explanation TEXT,
      FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_progress (
      user_id INTEGER NOT NULL,
      lesson_id INTEGER NOT NULL,
      completed BOOLEAN DEFAULT 0,
      quiz_score INTEGER,
      accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      PRIMARY KEY (user_id, lesson_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS enrollments (
      user_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, course_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      read BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_user_id INTEGER NOT NULL,
      to_user_id INTEGER NOT NULL,
      body TEXT NOT NULL,
      read BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS follows (
      follower_id INTEGER NOT NULL,
      mentor_id INTEGER NOT NULL,
      followed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (follower_id, mentor_id),
      FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      rating INTEGER CHECK(rating BETWEEN 1 AND 5),
      body TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      user_id INTEGER NOT NULL,
      lesson_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, lesson_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      due_date DATE,
      completed BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      quiz_id INTEGER NOT NULL,
      answer TEXT,
      correct BOOLEAN,
      attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      issue_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      certificate_code TEXT UNIQUE NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );
  `);
    // Seed initial data if courses are empty
    const courseCount = db.prepare('SELECT COUNT(*) as count FROM courses').get();
    if (courseCount.count === 0) {
        const insertCourse = db.prepare('INSERT INTO courses (title, description, language, author, category, difficulty) VALUES (?, ?, ?, ?, ?, ?)');
        // JS Course
        const jsCourseId = insertCourse.run('JavaScript Mastery', 'Learn JavaScript from scratch to advanced concepts.', 'javascript', 'Sarah Drasner', 'Front End', 'Beginner').lastInsertRowid;
        // Python Course
        const pythonCourseId = insertCourse.run('Python Essentials', 'Master Python programming for data science and web development.', 'python', 'Guido van Rossum', 'Data Science', 'Intermediate').lastInsertRowid;
        const insertLesson = db.prepare('INSERT INTO lessons (course_id, title, content, type, order_index) VALUES (?, ?, ?, ?, ?)');
        // JS Lessons
        insertLesson.run(jsCourseId, 'Introduction to JavaScript', 'JavaScript is a versatile, high-level, interpreted programming language.', 'text', 1);
        insertLesson.run(jsCourseId, 'JS in the Browser', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'video', 2);
        const quizLessonId = insertLesson.run(jsCourseId, 'Variables and Types', 'JavaScript variables can be declared using let, const, or var.', 'text', 3).lastInsertRowid;
        const insertQuiz = db.prepare('INSERT INTO quizzes (lesson_id, question, options, correct_answer, explanation) VALUES (?, ?, ?, ?, ?)');
        insertQuiz.run(quizLessonId, 'Which keyword is used for a constant variable?', JSON.stringify(['let', 'var', 'const', 'type']), 'const', 'The const keyword creates a read-only reference to a value.');
        // Python Lessons
        insertLesson.run(pythonCourseId, 'Python 101', 'Python is a high-level, general-purpose programming language.', 'text', 1);
        const pyQuizId = insertLesson.run(pythonCourseId, 'Data Structures', 'Python has several built-in data structures like lists, tuples, sets, and dictionaries.', 'text', 2).lastInsertRowid;
        insertQuiz.run(pyQuizId, 'Which of these is a Python dictionary?', JSON.stringify(['[1, 2]', '(1, 2)', '{ "a": 1 }', '{1, 2}']), '{ "a": 1 }', 'Dictionaries are key-value pairs enclosed in curly braces.');
        // Seed a mentor
        db.prepare('INSERT INTO users (username, password, target_language, role, bio) VALUES (?, ?, ?, ?, ?)').run('SarahD', 'hashed_pass', 'javascript', 'mentor', 'Expert in front-end development and animations.');
    }
    console.log('Database initialized and seeded.');
};
exports.initDb = initDb;
exports.default = db;
//# sourceMappingURL=index.js.map