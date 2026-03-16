import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT a.id, a.title, a.author_user_id, u1.full_name as author_name, a.last_editor_user_id, u2.full_name as editor_name 
      FROM articles a 
      LEFT JOIN system_users u1 ON a.author_user_id = u1.id 
      LEFT JOIN system_users u2 ON a.last_editor_user_id = u2.id 
      ORDER BY a.id DESC LIMIT 20
    `);
    fs.writeFileSync('audit_results.json', JSON.stringify(res.rows, null, 2));
    console.log('Audit complete.');
    process.exit(0);
  } catch (err) {
    fs.writeFileSync('audit_error.txt', err.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
