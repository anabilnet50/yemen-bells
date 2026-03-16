import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function audit() {
  const client = await pool.connect();
  try {
    console.log('--- USERS ---');
    const users = await client.query('SELECT id, full_name, username FROM system_users');
    console.table(users.rows);

    console.log('--- DISTINCT AUTHORS IN ARTICLES TABLE ---');
    const authors = await client.query('SELECT author, COUNT(*) as count FROM articles GROUP BY author ORDER BY count DESC');
    console.table(authors.rows);

    console.log('--- ATTRIBUTION BREAKDOWN ---');
    const attribution = await client.query(`
      SELECT 
        u.full_name as publisher_name, 
        a.author as legacy_author_text, 
        COUNT(*) 
      FROM articles a
      LEFT JOIN system_users u ON a.author_user_id = u.id
      GROUP BY u.full_name, a.author
      ORDER BY u.full_name, count DESC
    `);
    console.table(attribution.rows);

  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    await pool.end();
  }
}

audit();
