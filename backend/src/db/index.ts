import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(__dirname, '../../database.sqlite');
const db: Database.Database = new Database(dbPath);

db.pragma('journal_mode = WAL');

export const initDb = () => {
  // ── Core tables ─────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT UNIQUE,
      target_language TEXT NOT NULL DEFAULT 'javascript',
      avatar_url TEXT,
      bio TEXT,
      role TEXT NOT NULL DEFAULT 'student',
      streak INTEGER NOT NULL DEFAULT 0,
      last_active DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      language TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'General',
      difficulty TEXT NOT NULL DEFAULT 'Beginner',
      thumbnail_url TEXT,
      author TEXT,
      enrolled_count INTEGER NOT NULL DEFAULT 0
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
      options TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      explanation TEXT,
      FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_progress (
      user_id INTEGER NOT NULL,
      lesson_id INTEGER NOT NULL,
      completed BOOLEAN DEFAULT 0,
      quiz_score INTEGER,
      notes TEXT,
      accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, lesson_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
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
      type TEXT NOT NULL DEFAULT 'info',
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      due_date TEXT,
      completed INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      body TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, course_id),
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

    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      lesson_id INTEGER NOT NULL,
      answer TEXT NOT NULL,
      correct INTEGER NOT NULL DEFAULT 0,
      attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_user_id INTEGER NOT NULL,
      to_user_id INTEGER NOT NULL,
      body TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // ── Column migration helpers (ADD IF NOT EXISTS workaround for SQLite) ──
  const addColumnIfMissing = (table: string, column: string, definition: string) => {
    try {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    } catch (_) { /* column already exists */ }
  };

  addColumnIfMissing('users', 'email', 'TEXT UNIQUE');
  addColumnIfMissing('users', 'avatar_url', 'TEXT');
  addColumnIfMissing('users', 'bio', 'TEXT');
  addColumnIfMissing('users', 'role', "TEXT NOT NULL DEFAULT 'student'");
  addColumnIfMissing('users', 'streak', 'INTEGER NOT NULL DEFAULT 0');
  addColumnIfMissing('users', 'last_active', 'DATE');
  addColumnIfMissing('courses', 'category', "TEXT NOT NULL DEFAULT 'General'");
  addColumnIfMissing('courses', 'difficulty', "TEXT NOT NULL DEFAULT 'Beginner'");
  addColumnIfMissing('courses', 'thumbnail_url', 'TEXT');
  addColumnIfMissing('courses', 'author', 'TEXT');
  addColumnIfMissing('courses', 'enrolled_count', 'INTEGER NOT NULL DEFAULT 0');
  addColumnIfMissing('quizzes', 'explanation', 'TEXT');
  addColumnIfMissing('user_progress', 'notes', 'TEXT');
  addColumnIfMissing('user_progress', 'accessed_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP');

  // ── Seed data ────────────────────────────────────
  const courseCount = db.prepare('SELECT COUNT(*) as count FROM courses').get() as { count: number };
  if (courseCount.count === 0) {
    const insertCourse = db.prepare(
      'INSERT INTO courses (title, description, language, category, difficulty, thumbnail_url, author) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );

    const jsCourseId = insertCourse.run(
      'JavaScript Mastery',
      'Learn JavaScript from scratch to advanced concepts including ES6+, async/await, and modern patterns.',
      'javascript', 'Front End', 'Beginner', '/thumb1.png', 'Leonardo Samsul'
    ).lastInsertRowid;

    const pythonCourseId = insertCourse.run(
      'Python Essentials',
      'Master Python programming for data science and web development.',
      'python', 'Backend', 'Beginner', '/thumb2.png', 'Padhang Satrio'
    ).lastInsertRowid;

    insertCourse.run(
      'UI/UX Design Fundamentals',
      'Learn the principles of great user interface and experience design.',
      'design', 'UI/UX Design', 'Beginner', '/thumb3.png', 'Bayu Salto'
    );

    const insertLesson = db.prepare(
      'INSERT INTO lessons (course_id, title, content, type, order_index) VALUES (?, ?, ?, ?, ?)'
    );

    insertLesson.run(jsCourseId, 'Introduction to JavaScript',
      'JavaScript is a versatile, high-level, interpreted programming language. It is a core technology of the World Wide Web alongside HTML and CSS.\n\nIn this lesson, we cover the history of JavaScript, how it runs in the browser, and why it became the dominant language of the web.\n\nJavaScript was created by Brendan Eich in 1995 in just 10 days. Despite its rushed creation, it has evolved into one of the most widely used programming languages in the world.',
      'text', 1);

    insertLesson.run(jsCourseId, 'JS in the Browser',
      'https://www.youtube.com/embed/W6NZfCO5SIk',
      'video', 2);

    const quizLessonId = insertLesson.run(jsCourseId, 'Variables and Types',
      'JavaScript variables can be declared using let, const, or var.\n\nlet and const were introduced in ES6 and are block-scoped, whereas var is function-scoped. Using const is recommended for values that will not change, and let for values that may change.\n\nJavaScript has dynamic typing, meaning a variable can hold any type of value and the type can change at runtime.',
      'text', 3).lastInsertRowid;

    const insertQuiz = db.prepare(
      'INSERT INTO quizzes (lesson_id, question, options, correct_answer, explanation) VALUES (?, ?, ?, ?, ?)'
    );
    insertQuiz.run(quizLessonId,
      'Which keyword is used for a constant variable?',
      JSON.stringify(['let', 'var', 'const', 'type']),
      'const',
      'const declares a variable that cannot be reassigned after its initial value is set. It is block-scoped like let.'
    );

    insertLesson.run(pythonCourseId, 'Python 101',
      'Python is a high-level, general-purpose programming language. Its design philosophy emphasizes code readability with the use of significant indentation.\n\nPython is dynamically typed and garbage-collected. It supports multiple programming paradigms, including structured, object-oriented and functional programming.',
      'text', 1);

    const pyQuizId = insertLesson.run(pythonCourseId, 'Data Structures',
      'Python has several built-in data structures:\n\nLists: ordered, mutable sequences — [1, 2, 3]\nTuples: ordered, immutable sequences — (1, 2, 3)\nSets: unordered collections of unique items — {1, 2, 3}\nDictionaries: key-value pairs — {"name": "Alice", "age": 30}',
      'text', 2).lastInsertRowid;

    insertQuiz.run(pyQuizId,
      'Which of these is a Python dictionary?',
      JSON.stringify(['[1, 2]', '(1, 2)', '{ "a": 1 }', '{1, 2}']),
      '{ "a": 1 }',
      'Dictionaries in Python use curly braces with key-value pairs separated by colons. Lists use square brackets, tuples use parentheses, and sets use curly braces without key-value pairs.'
    );

    // Seed mentors
    const bcrypt = require('bcryptjs');
    const hashedPw = bcrypt.hashSync('mentor123', 10);

    const insertMentor = db.prepare(
      "INSERT OR IGNORE INTO users (username, password, target_language, bio, role) VALUES (?, ?, ?, ?, 'mentor')"
    );
    insertMentor.run('Padhang Satrio', hashedPw, 'design',
      'Senior UI/UX Designer with 8 years of experience at top tech companies.');
    insertMentor.run('Bayu Salto', hashedPw, 'design',
      'Creative director and branding specialist helping companies define their visual identity.');
    insertMentor.run('Leonardo Samsul', hashedPw, 'javascript',
      'Full-stack JavaScript developer and open-source contributor.');
  }

  console.log('✅ Database initialized and seeded.');
};

export default db;
