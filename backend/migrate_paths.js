const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://postgres:Blackraven-11@@localhost:5432/mydeb_db',
});

async function run() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS learning_paths (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        thumbnail_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS learning_path_courses (
        path_id INTEGER NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
        course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        order_index INTEGER NOT NULL,
        PRIMARY KEY (path_id, course_id)
      );

      -- Add path_id to certificates and make course_id nullable for backward compatibility
      ALTER TABLE certificates ADD COLUMN IF NOT EXISTS path_id INTEGER REFERENCES learning_paths(id) ON DELETE CASCADE;
      ALTER TABLE certificates ALTER COLUMN course_id DROP NOT NULL;
    `);
    
    // Seed an initial learning path
    const res = await pool.query('SELECT COUNT(*) FROM learning_paths');
    if (parseInt(res.rows[0].count) === 0) {
      const pathRes = await pool.query(`
        INSERT INTO learning_paths (title, description, thumbnail_url) 
        VALUES ($1, $2, $3) RETURNING id
      `, ['Frontend Developer Masterclass', 'Go from zero to hero in frontend development by mastering JavaScript and React.', 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1000&auto=format&fit=crop']);
      
      const pathId = pathRes.rows[0].id;

      // Find JS and React courses
      const jsCourse = await pool.query("SELECT id FROM courses WHERE title ILIKE '%JavaScript%' LIMIT 1");
      const reactCourse = await pool.query("SELECT id FROM courses WHERE title ILIKE '%React%' LIMIT 1");

      if (jsCourse.rows[0]) {
        await pool.query('INSERT INTO learning_path_courses (path_id, course_id, order_index) VALUES ($1, $2, $3)', [pathId, jsCourse.rows[0].id, 1]);
      }
      if (reactCourse.rows[0]) {
        await pool.query('INSERT INTO learning_path_courses (path_id, course_id, order_index) VALUES ($1, $2, $3)', [pathId, reactCourse.rows[0].id, 2]);
      }
    }
    
    console.log('Successfully migrated database for Learning Paths.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    pool.end();
  }
}

run();
