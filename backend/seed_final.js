const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: 'postgres://postgres:Blackraven-11@@localhost:5432/mydeb_db',
});

async function run() {
  try {
    console.log('--- Starting Final Seed Script ---');

    // 1. Convert all existing mentors to students
    console.log('1. Removing existing mentors...');
    await pool.query(`UPDATE users SET role = 'student' WHERE role = 'mentor'`);

    // 2. Create the new exclusive mentor "Khalil Elmariami"
    console.log('2. Creating mentor Khalil Elmariami...');
    const hashedPw = bcrypt.hashSync('mentor123', 10);
    let mentorId;
    const existing = await pool.query(`SELECT id FROM users WHERE username = 'Khalil Elmariami'`);
    if (existing.rows.length > 0) {
      mentorId = existing.rows[0].id;
      await pool.query(`UPDATE users SET role = 'mentor' WHERE id = $1`, [mentorId]);
      console.log('Mentor already existed, updated role.');
    } else {
      const res = await pool.query(
        `INSERT INTO users (username, password, email, bio, role) VALUES ($1, $2, $3, $4, $5) RETURNING id`, 
        ['Khalil Elmariami', hashedPw, 'khalil@coursue.com', 'Expert Software Engineer & Architect', 'mentor']
      );
      mentorId = res.rows[0].id;
      console.log('Mentor created successfully.');
    }

    // 3. Re-assign all existing courses to Khalil Elmariami
    console.log('3. Re-assigning all courses to Khalil Elmariami...');
    await pool.query(`UPDATE courses SET author = 'Khalil Elmariami'`);

    // 4. Seed Beginner Path
    console.log('4. Seeding Beginner Path...');
    
    // Check if path already exists to avoid duplicates
    const pathCheck = await pool.query(`SELECT id FROM learning_paths WHERE title = 'Zero to Hero: Web Developer'`);
    if (pathCheck.rows.length > 0) {
      console.log('Beginner path already exists. Skipping creation to avoid duplicates.');
    } else {
      const pathRes = await pool.query(`
        INSERT INTO learning_paths (title, description, thumbnail_url) 
        VALUES ($1, $2, $3) RETURNING id
      `, [
        'Zero to Hero: Web Developer', 
        'Start from absolute scratch. Learn how computers think with Algorithms, then build stunning websites with HTML, CSS, and interactive JavaScript!',
        'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80'
      ]);
      const pathId = pathRes.rows[0].id;

      const createCourse = async (title, desc, lang, diff, img) => {
        const res = await pool.query(`
          INSERT INTO courses (title, description, language, category, difficulty, thumbnail_url, author) 
          VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
        `, [title, desc, lang, 'Web Development', diff, img, 'Khalil Elmariami']);
        return res.rows[0].id;
      };

      const createLesson = async (cId, title, content, type, order) => {
        const res = await pool.query(`
          INSERT INTO lessons (course_id, title, content, type, order_index) 
          VALUES ($1, $2, $3, $4, $5) RETURNING id
        `, [cId, title, content, type, order]);
        return res.rows[0].id;
      };

      const algoId = await createCourse(
        'Programming Logic & Algorithms', 
        'Learn how to think like a programmer. Understand flowcharts, variables, and loops.',
        'general', 'Beginner', 
        'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&q=80'
      );
      await createLesson(algoId, 'What is an Algorithm?', 'An algorithm is just a step-by-step recipe to solve a problem.', 'text', 1);
      await createLesson(algoId, 'Understanding Loops', 'Loops let you repeat actions without writing the same code over and over.', 'video', 2);

      const htmlId = await createCourse(
        'HTML5 Basics', 
        'Build the skeleton of your websites using HyperText Markup Language.',
        'html', 'Beginner', 
        'https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=800&q=80'
      );
      await createLesson(htmlId, 'Introduction to Tags', 'Tags like <h1> and <p> give structure to your text.', 'text', 1);

      const cssId = await createCourse(
        'CSS3 Styling & Layouts', 
        'Make your websites look beautiful with colors, fonts, and Flexbox layouts.',
        'css', 'Beginner', 
        'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=800&q=80'
      );
      await createLesson(cssId, 'Selectors & Colors', 'Select HTML elements and change their color properties.', 'text', 1);

      const jsId = await createCourse(
        'JavaScript for Web', 
        'Add interactivity and logic to your static pages with JavaScript.',
        'javascript', 'Intermediate', 
        'https://images.unsplash.com/photo-1627398246690-bd97a22eb8f3?w=800&q=80'
      );
      await createLesson(jsId, 'DOM Manipulation', 'Learn how to select elements from the page and change them dynamically.', 'text', 1);

      const linkQuery = 'INSERT INTO learning_path_courses (path_id, course_id, order_index) VALUES ($1, $2, $3)';
      await pool.query(linkQuery, [pathId, algoId, 1]);
      await pool.query(linkQuery, [pathId, htmlId, 2]);
      await pool.query(linkQuery, [pathId, cssId, 3]);
      await pool.query(linkQuery, [pathId, jsId, 4]);
      
      console.log('Beginner Path seeded successfully!');
    }

    console.log('--- Final Seed Script Complete ---');
  } catch (e) {
    console.error('Error during seeding:', e);
  } finally {
    pool.end();
  }
}

run();
