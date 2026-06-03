const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://postgres:Blackraven-11@@localhost:5432/mydeb_db',
});

async function run() {
  try {
    const sql = fs.readFileSync('setup.sql', 'utf8');
    console.log('Running setup.sql...');
    await pool.query(sql);
    console.log('Successfully initialized Postgres schema.');

    // Seed data
    const res = await pool.query('SELECT COUNT(*) FROM courses');
    if (parseInt(res.rows[0].count) === 0) {
      console.log('Seeding initial data...');
      
      const insertCourse = `
        INSERT INTO courses (title, description, language, category, difficulty, thumbnail_url, author) 
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
      `;
      
      const jsId = (await pool.query(insertCourse, [
        'JavaScript Mastery', 'Learn JavaScript from scratch', 'javascript', 'Front End', 'Beginner', '/thumb1.png', 'Leonardo Samsul'
      ])).rows[0].id;
      
      const pyId = (await pool.query(insertCourse, [
        'Python Essentials', 'Master Python programming', 'python', 'Backend', 'Beginner', '/thumb2.png', 'Padhang Satrio'
      ])).rows[0].id;
      
      await pool.query(insertCourse, [
        'UI/UX Design Fundamentals', 'Learn UI/UX', 'design', 'UI/UX Design', 'Beginner', '/thumb3.png', 'Bayu Salto'
      ]);

      const insertLesson = `
        INSERT INTO lessons (course_id, title, content, type, order_index) 
        VALUES ($1, $2, $3, $4, $5) RETURNING id
      `;

      await pool.query(insertLesson, [jsId, 'Introduction to JavaScript', 'Welcome to JS!', 'text', 1]);
      const quizId = (await pool.query(insertLesson, [jsId, 'Variables and Types', 'Let, const, var', 'text', 2])).rows[0].id;
      
      await pool.query(`INSERT INTO quizzes (lesson_id, question, options, correct_answer, explanation) VALUES ($1, $2, $3, $4, $5)`, [
        quizId, 'Which keyword for constant?', JSON.stringify(['let', 'var', 'const', 'type']), 'const', 'const is immutable'
      ]);

      // Seed admin and mentor
      const bcrypt = require('bcryptjs');
      const hashedPw = bcrypt.hashSync('mentor123', 10);
      const hashedAdmin = bcrypt.hashSync('admin123', 10);

      await pool.query(`INSERT INTO users (username, password, email, role) VALUES ($1, $2, $3, $4)`, ['admin', hashedAdmin, 'admin@coursue.com', 'admin']);
      await pool.query(`INSERT INTO users (username, password, bio, role) VALUES ($1, $2, $3, $4)`, ['Padhang Satrio', hashedPw, 'Senior Designer', 'mentor']);
      await pool.query(`INSERT INTO users (username, password, bio, role) VALUES ($1, $2, $3, $4)`, ['Bayu Salto', hashedPw, 'Creative Director', 'mentor']);
      await pool.query(`INSERT INTO users (username, password, bio, role) VALUES ($1, $2, $3, $4)`, ['Leonardo Samsul', hashedPw, 'JS Dev', 'mentor']);
      
      console.log('Seeded successfully. You can login as admin/admin123');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    pool.end();
  }
}

run();
