import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkID() {
  const client = await pool.connect();
  try {
    const ids = [105, 116, 115, 111, 112, 113, 114]; // Some interesting IDs from recent list
    console.log(`--- AUDIT LOGS FOR SPECIFIC ARTICLES: ${ids.join(', ')} ---`);
    
    // We search the 'details' field for these IDs
    const logs = await client.query(`
      SELECT l.user_id, u.full_name as logged_user, l.action, l.details, l.created_at
      FROM audit_logs l
      JOIN system_users u ON l.user_id = u.id
      WHERE l.details LIKE ANY($1)
      ORDER BY l.created_at DESC
    `, [ids.map(id => `%${id}%`)]);
    console.table(logs.rows);

    console.log('--- ARTICLE DATA FOR THESE IDS ---');
    const articles = await client.query(`
      SELECT id, title, author_user_id, author
      FROM articles
      WHERE id ANY($1)
    `, [ids]); // Wait, fixed syntax below
  } catch (err) {
    // console.error(err);
  }
}

// Re-writing simpler version
async function checkIDCorrected() {
  const client = await pool.connect();
  try {
     const ids = [105, 116, 115, 111, 112, 113, 114];
     for (const id of ids) {
       console.log(`\n--- ARTICLE ID: ${id} ---`);
       const art = await client.query('SELECT title, author_user_id FROM articles WHERE id = $1', [id]);
       console.table(art.rows);
       
       const logs = await client.query(`
         SELECT u.full_name as logged_as, l.action, l.created_at
         FROM audit_logs l
         JOIN system_users u ON l.user_id = u.id
         WHERE l.details LIKE $1
       `, [`%${id}%`]);
       console.table(logs.rows);
     }
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    await pool.end();
  }
}

checkIDCorrected();
