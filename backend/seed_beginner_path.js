const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://postgres:Blackraven-11@@localhost:5432/mydeb_db',
});

async function run() {
  try {
    console.log('Seeding beginner path data...');

    // 1. Create the Path
    const pathRes = await pool.query(`
      INSERT INTO learning_paths (title, description, thumbnail_url) 
      VALUES ($1, $2, $3) RETURNING id
    `, [
      'Zero to Hero: Web Developer', 
      'Start from absolute scratch. Learn how computers think with Algorithms, then build stunning websites with HTML, CSS, and interactive JavaScript!',
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80'
    ]);
    const pathId = pathRes.rows[0].id;

    // Helper to create course
    const createCourse = async (title, desc, lang, diff, img) => {
      const res = await pool.query(`
        INSERT INTO courses (title, description, language, category, difficulty, thumbnail_url, author) 
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
      `, [title, desc, lang, 'Web Development', diff, img, 'Admin']);
      return res.rows[0].id;
    };

    // Helper to create lesson
    const createLesson = async (cId, title, content, type, order) => {
      const res = await pool.query(`
        INSERT INTO lessons (course_id, title, content, type, order_index) 
        VALUES ($1, $2, $3, $4, $5) RETURNING id
      `, [cId, title, content, type, order]);
      return res.rows[0].id;
    };

    // Helper to create quiz
    const createQuiz = async (lId, question, options, answer, exp) => {
      await pool.query(`
        INSERT INTO quizzes (lesson_id, question, options, correct_answer, explanation) 
        VALUES ($1, $2, $3, $4, $5)
      `, [lId, question, JSON.stringify(options), answer, exp]);
    };

    // --- Course 1: Algorithms ---
    const algoId = await createCourse(
      'Programming Logic & Algorithms', 
      'Learn how to think like a programmer. Understand flowcharts, variables, and loops.',
      'general', 'Beginner', 
      'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&q=80'
    );
    await createLesson(algoId, 'What is an Algorithm?', 'An algorithm is just a step-by-step recipe to solve a problem.', 'text', 1);
    const algoL2 = await createLesson(algoId, 'Understanding Loops', 'Loops let you repeat actions without writing the same code over and over.', 'video', 2);
    await createQuiz(algoL2, 'What is the main purpose of a loop?', ['Make code run faster', 'Repeat instructions', 'Store data', 'Draw graphics'], 'Repeat instructions', 'Loops repeat blocks of code.');

    // --- Course 2: HTML ---
    const htmlId = await createCourse(
      'HTML5 Basics', 
      'Build the skeleton of your websites using HyperText Markup Language.',
      'html', 'Beginner', 
      'https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=800&q=80'
    );
    await createLesson(htmlId, 'Introduction to Tags', 'Tags like <h1> and <p> give structure to your text.', 'text', 1);
    const htmlL2 = await createLesson(htmlId, 'Building Forms', 'Learn how to create input fields and buttons for users to submit data.', 'video', 2);
    await createQuiz(htmlL2, 'Which tag is used for an input field?', ['<text>', '<input>', '<formfield>', '<box>'], '<input>', 'The input tag is used for user data entry.');

    // --- Course 3: CSS ---
    const cssId = await createCourse(
      'CSS3 Styling & Layouts', 
      'Make your websites look beautiful with colors, fonts, and Flexbox layouts.',
      'css', 'Beginner', 
      'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=800&q=80'
    );
    await createLesson(cssId, 'Selectors & Colors', 'Select HTML elements and change their color properties.', 'text', 1);
    await createLesson(cssId, 'Mastering Flexbox', 'Flexbox is a 1D layout model that makes responsive design easy.', 'video', 2);

    // --- Course 4: JavaScript ---
    const jsId = await createCourse(
      'JavaScript for Web', 
      'Add interactivity and logic to your static pages with JavaScript.',
      'javascript', 'Intermediate', 
      'https://images.unsplash.com/photo-1627398246690-bd97a22eb8f3?w=800&q=80'
    );
    await createLesson(jsId, 'DOM Manipulation', 'Learn how to select elements from the page and change them dynamically.', 'text', 1);
    const jsL2 = await createLesson(jsId, 'Event Listeners', 'React to user clicks and keystrokes.', 'video', 2);
    await createQuiz(jsL2, 'Which method attaches an event handler?', ['onEvent()', 'listen()', 'addEventListener()', 'attach()'], 'addEventListener()', 'addEventListener is the standard method.');

    // 2. Link Courses to Path
    console.log('Linking courses to path...');
    const linkQuery = 'INSERT INTO learning_path_courses (path_id, course_id, order_index) VALUES ($1, $2, $3)';
    await pool.query(linkQuery, [pathId, algoId, 1]);
    await pool.query(linkQuery, [pathId, htmlId, 2]);
    await pool.query(linkQuery, [pathId, cssId, 3]);
    await pool.query(linkQuery, [pathId, jsId, 4]);

    console.log('✅ Successfully seeded beginner path!');
  } catch (e) {
    console.error('Error seeding data:', e);
  } finally {
    pool.end();
  }
}

run();
