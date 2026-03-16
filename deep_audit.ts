import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function deepAudit() {
  const client = await pool.connect();
  try {
    console.log('--- WRITERS ---');
    const writers = await client.query('SELECT id, name FROM writers');
    console.table(writers.rows);

    console.log('--- ARTICLES WITH NULL AUTHOR BUT HAVE WRITER_ID ---');
    const articlesWithWriter = await client.query(`
      SELECT w.name as writer_name, COUNT(*) 
      FROM articles a
      JOIN writers w ON a.writer_id = w.id
      WHERE a.author IS NULL
      GROUP BY w.name
    `);
    console.table(articlesWithWriter.rows);

    console.log('--- AUDIT LOGS FOR ARTICLE CREATION ---');
    // Looking for 'CREATE' or similar in logs for articles
    const logs = await client.query(`
      SELECT u.full_name, COUNT(*) 
      FROM audit_logs l
      JOIN system_users u ON l.user_id = u.id
      WHERE l.action LIKE '%article%' AND l.action LIKE '%create%'
      GROUP BY u.full_name
    `);
    console.table(logs.rows);

    console.log('--- SAMPLE OF ARTICLES ATTRIBUTED TO ABDULLAH ---');
    const sample = await client.query(`
      SELECT id, title, created_at, author, writer_id 
      FROM articles 
      WHERE author_user_id = 36 
      LIMIT 10
    `);
    console.table(sample.rows);

  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    await pool.end();
  }
}

deepAudit();
