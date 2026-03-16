import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  console.log('Starting simplified audit...');
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT a.id, a.title, a.author_user_id, u.full_name as author_name, a.last_editor_user_id FROM articles a LEFT JOIN system_users u ON a.author_user_id = u.id ORDER BY a.id DESC LIMIT 10');
    fs.writeFileSync('audit_out.json', JSON.stringify(res.rows, null, 2));
    console.log('Done.');
  } catch (e) {
    fs.writeFileSync('audit_err.txt', e.toString());
  } finally {
    client.release();
    await pool.end();
  }
}

run();
