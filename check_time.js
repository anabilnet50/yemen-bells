import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  try {
    const res = await pool.query("SELECT id, title, created_at, (EXTRACT(EPOCH FROM NOW() - created_at)/3600) as hours_diff FROM articles WHERE category_id = 3 ORDER BY created_at DESC LIMIT 3");
    console.log(res.rows);
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
check();
