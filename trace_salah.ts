import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function trace() {
  const client = await pool.connect();
  try {
    const salahSystemId = 153; // From previous audit

    console.log('--- RECENT AUDIT LOGS FOR SALAH ---');
    const logs = await client.query(`
      SELECT action, details, created_at 
      FROM audit_logs 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 20
    `, [salahSystemId]);
    console.table(logs.rows);

    console.log('--- ARTICLES CREATED BY SALAH (FROM LOGS) ---');
    // Attempting to extract article IDs from log details if possible
    // "تم إضافة الخبر: [title]" or similar
    const creationLogs = await client.query(`
      SELECT details, created_at 
      FROM audit_logs 
      WHERE user_id = $1 AND action = 'إضافة خبر'
      ORDER BY created_at DESC
    `, [salahSystemId]);
    console.table(creationLogs.rows);

    console.log('--- ARTICLES CURRENTLY LINKED TO SALAH ---');
    const linked = await client.query(`
      SELECT id, title, author_user_id, writer_id 
      FROM articles 
      WHERE author_user_id = $1
    `, [salahSystemId]);
    console.table(linked.rows);

  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    await pool.end();
  }
}

trace();
