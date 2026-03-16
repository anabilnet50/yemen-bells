import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkRecent() {
  const client = await pool.connect();
  try {
    console.log('--- RECENT 20 ARTICLES ---');
    const recent = await client.query(`
      SELECT a.id, a.title, a.created_at, u.full_name as publisher, w.name as writer
      FROM articles a
      LEFT JOIN system_users u ON a.author_user_id = u.id
      LEFT JOIN writers w ON a.writer_id = w.id
      ORDER BY a.created_at DESC
      LIMIT 20
    `);
    console.table(recent.rows);

    console.log('--- AGGRESSIVE FIX FOR SALAH ---');
    // Ensure all articles with Salahs writer_id are linked to his system_user_id
    const res = await client.query(`
      UPDATE articles 
      SET author_user_id = 153 
      WHERE writer_id = 2 AND (author_user_id != 153 OR author_user_id IS NULL)
    `);
    console.log(`Updated ${res.rowCount} articles based on writer_id=2.`);

    // Check for any articles where author text is Salah but linked to Abdullah
    const res2 = await client.query(`
      UPDATE articles 
      SET author_user_id = 153 
      WHERE author = 'صلاح حيدرة' AND author_user_id != 153
    `);
    console.log(`Updated ${res2.rowCount} articles based on author text match.`);

  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    await pool.end();
  }
}

checkRecent();
