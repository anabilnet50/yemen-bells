const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query("SELECT title, created_at FROM articles WHERE category_id = (SELECT id FROM categories WHERE slug='general') ORDER BY created_at DESC LIMIT 3")
  .then(res => {
     res.rows.forEach(r => {
        const d = new Date(r.created_at);
        const diff = (Date.now() - d.getTime()) / 3600000;
        console.log(`Title: ${r.title}, Age: ${diff.toFixed(2)} hours`);
     });
     pool.end();
  }).catch(console.error);
