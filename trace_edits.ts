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
    // 1. Audit logs for specific recently edited articles
    const { rows: logs } = await client.query(`
      SELECT l.user_id, u.full_name, l.action, l.details, l.created_at 
      FROM audit_logs l 
      JOIN system_users u ON l.user_id = u.id 
      WHERE l.details LIKE '%117%' OR l.details LIKE '%118%' 
      ORDER BY l.created_at DESC
    `);
    fs.writeFileSync('audit_logs_trace.json', JSON.stringify(logs, null, 2));

    // 2. Current state of these articles
    const { rows: articles } = await client.query(`
      SELECT id, title, author_user_id, last_editor_user_id 
      FROM articles 
      WHERE id IN (117, 118)
    `);
    fs.writeFileSync('article_trace.json', JSON.stringify(articles, null, 2));

    console.log('Trace complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

run();
