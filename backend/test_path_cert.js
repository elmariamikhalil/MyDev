const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgres://postgres:Blackraven-11@@localhost:5432/mydeb_db',
});

async function run() {
  try {
    const userId = 1; // Assuming admin
    const pathId = 1;

    // Simulate path completion
    const certRes = await pool.query('SELECT * FROM certificates WHERE user_id = $1 AND path_id = $2', [userId, pathId]);
    console.log('SELECT result:', certRes.rows);

    if (certRes.rows.length === 0) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      console.log('Inserting...', code);
      const newCert = await pool.query(
        'INSERT INTO certificates (user_id, path_id, certificate_code) VALUES ($1, $2, $3) RETURNING *',
        [userId, pathId, code]
      );
      console.log('INSERT result:', newCert.rows[0]);
    }
  } catch (e) {
    console.error('ERROR:', e);
  } finally {
    pool.end();
  }
}
run();
