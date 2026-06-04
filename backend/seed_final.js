const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:Blackraven-11@@localhost:5432/mydeb_db',
});

async function run() {
  try {
    console.log('--- Starting Deep Content Seed Script ---');

    // 0. Ensure tables exist
    console.log('0. Ensuring paths tables exist...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS paths (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        thumbnail_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS path_courses (
        path_id INTEGER NOT NULL REFERENCES paths(id) ON DELETE CASCADE,
        course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        order_index INTEGER NOT NULL,
        PRIMARY KEY (path_id, course_id)
      );

      ALTER TABLE certificates ALTER COLUMN course_id DROP NOT NULL;
      ALTER TABLE certificates ADD COLUMN IF NOT EXISTS path_id INTEGER REFERENCES paths(id) ON DELETE CASCADE;
    `);

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
    console.log('3. Re-assign all courses to Khalil Elmariami...');
    await pool.query(`UPDATE courses SET author = 'Khalil Elmariami'`);

    // Delete existing paths to start fresh with new content
    await pool.query(`DELETE FROM paths WHERE title = 'Zero to Hero: Web Developer'`);

    // 4. Seed Beginner Path
    console.log('4. Seeding Beginner Path...');
    
    const pathRes = await pool.query(`
      INSERT INTO paths (title, description, thumbnail_url) 
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

    // COURSE 1: ALGORITHMS
    const algoId = await createCourse(
      'Programming Logic & Algorithms', 
      'Master the core foundation of computer science. Learn how to break down complex problems into simple, repeatable steps before writing a single line of code.',
      'general', 'Beginner', 
      'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&q=80'
    );
    await createLesson(algoId, '1. What is an Algorithm?', 
`# Introduction to Algorithms

An **algorithm** is simply a step-by-step recipe to solve a specific problem. Just like baking a cake requires following instructions in a specific order, writing software requires giving the computer instructions in a specific order.

## Real World Example
Think about making a cup of coffee:
1. Boil water.
2. Put coffee grounds in a filter.
3. Pour boiling water over the grounds.
4. Wait for it to drip.
5. Serve in a cup.

If you skip a step, or do them out of order (like pouring water before boiling it), the result is ruined. Computers are the same way—they do exactly what you tell them, in the exact order you tell them!`, 'text', 1);

    await createLesson(algoId, '2. Variables and Data', 
`# Variables: The Brain's Memory

To solve problems, algorithms need to remember things. We store these "things" in **variables**. Think of a variable as a labeled box where you can keep a piece of information.

## Types of Data
1. **Numbers**: \`age = 25\`
2. **Text (Strings)**: \`name = "Alice"\`
3. **Booleans (True/False)**: \`is_raining = True\`

When your algorithm needs to check if it should bring an umbrella, it looks inside the \`is_raining\` box!`, 'text', 2);

    await createLesson(algoId, '3. Conditional Logic (If/Else)', 
`# Making Decisions

Algorithms aren't just straight lines; they can branch based on conditions using **If/Else** logic.

\`\`\`javascript
if (is_raining) {
  print("Take an umbrella!");
} else {
  print("Wear sunglasses!");
}
\`\`\`

This is the foundation of all application logic. Every button you click on a website uses an \`if\` statement to decide what to do next!`, 'text', 3);

    // COURSE 2: HTML
    const htmlId = await createCourse(
      'HTML5 Masterclass', 
      'Learn to build the skeleton of the web. Understand semantics, forms, and SEO best practices.',
      'html', 'Beginner', 
      'https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=800&q=80'
    );
    await createLesson(htmlId, '1. Structure of a Web Page', 
`# The HTML Boilerplate

Every website in the world uses HTML. HTML uses **tags** to define the structure of the document.

\`\`\`html
<!DOCTYPE html>
<html>
<head>
  <title>My First Website</title>
</head>
<body>
  <h1>Hello, World!</h1>
  <p>Welcome to my page.</p>
</body>
</html>
\`\`\`

- \`<!DOCTYPE html>\` tells the browser we are using HTML5.
- The \`<head>\` contains metadata (like the title on the browser tab).
- The \`<body>\` contains the visible content of the page.`, 'text', 1);

    await createLesson(htmlId, '2. Links and Images', 
`# Connecting the Web

The internet is a web of connected pages. We connect them using the anchor tag \`<a>\`.

\`\`\`html
<a href="https://google.com">Click here to go to Google</a>
\`\`\`

To show images, we use the \`<img>\` tag. Notice it doesn't have a closing tag!

\`\`\`html
<img src="avatar.jpg" alt="My Profile Picture" />
\`\`\`
Always include the \`alt\` text for visually impaired users and SEO!`, 'text', 2);

    // COURSE 3: CSS
    const cssId = await createCourse(
      'CSS3 Styling & Layouts', 
      'Turn ugly HTML skeletons into beautiful, responsive, and modern masterpieces.',
      'css', 'Intermediate', 
      'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=800&q=80'
    );
    await createLesson(cssId, '1. The Box Model', 
`# Everything is a Box!

In CSS, every HTML element is treated as a rectangular box. Understanding the Box Model is the key to mastering CSS layouts.

1. **Content**: The actual text or image.
2. **Padding**: Transparent space *inside* the border, around the content.
3. **Border**: The visible line around the padding.
4. **Margin**: Transparent space *outside* the border, pushing other elements away.

\`\`\`css
.card {
  padding: 20px;
  border: 1px solid black;
  margin: 15px;
}
\`\`\``, 'text', 1);

    await createLesson(cssId, '2. Flexbox Layouts', 
`# Flexbox: Aligning Elements

Before Flexbox, centering elements vertically was a nightmare. Flexbox makes 1-dimensional layouts a breeze.

\`\`\`css
.container {
  display: flex;
  justify-content: center; /* Aligns horizontally */
  align-items: center; /* Aligns vertically */
  height: 100vh;
}
\`\`\`

Just by adding those 3 lines, any items inside \`.container\` will perfectly center on the screen!`, 'text', 2);

    // COURSE 4: JS
    const jsId = await createCourse(
      'Modern JavaScript (ES6+)', 
      'Bring your websites to life! Fetch data, handle events, and create dynamic user interfaces.',
      'javascript', 'Intermediate', 
      'https://images.unsplash.com/photo-1627398246690-bd97a22eb8f3?w=800&q=80'
    );
    await createLesson(jsId, '1. Variables and Functions', 
`# ES6 Basics

In modern JavaScript, we use \`let\` and \`const\` instead of the old \`var\`.

\`\`\`javascript
const name = "Khalil"; // Cannot be changed
let age = 25; // Can be updated later
age = 26; 
\`\`\`

### Arrow Functions
Arrow functions are a shorter, cleaner way to write functions:

\`\`\`javascript
const greet = (userName) => {
  return \`Hello, \${userName}!\`;
};

console.log(greet("Khalil"));
\`\`\``, 'text', 1);

    await createLesson(jsId, '2. Array Methods', 
`# Map, Filter, and Reduce

Modern JavaScript provides incredibly powerful tools to manipulate arrays without writing messy \`for\` loops.

### Map
Transform every item in an array:
\`\`\`javascript
const numbers = [1, 2, 3];
const doubled = numbers.map(num => num * 2);
// [2, 4, 6]
\`\`\`

### Filter
Keep only items that match a condition:
\`\`\`javascript
const ages = [12, 18, 25, 8];
const adults = ages.filter(age => age >= 18);
// [18, 25]
\`\`\``, 'text', 2);

    const linkQuery = 'INSERT INTO path_courses (path_id, course_id, order_index) VALUES ($1, $2, $3)';
    await pool.query(linkQuery, [pathId, algoId, 1]);
    await pool.query(linkQuery, [pathId, htmlId, 2]);
    await pool.query(linkQuery, [pathId, cssId, 3]);
    await pool.query(linkQuery, [pathId, jsId, 4]);
    
    console.log('Beginner Path with rich content seeded successfully!');
    console.log('--- Final Seed Script Complete ---');
  } catch (e) {
    console.error('Error during seeding:', e);
  } finally {
    pool.end();
  }
}

run();
