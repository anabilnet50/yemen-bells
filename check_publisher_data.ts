
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  const client = await pool.connect();
  try {
    console.log('--- Article 105 ---');
    const article105 = await client.query(`
      SELECT a.id, a.title, a.author_user_id, u.full_name as publisher, e.full_name as last_editor
      FROM articles a 
      LEFT JOIN system_users u ON a.author_user_id = u.id 
      LEFT JOIN system_users e ON a.last_editor_user_id = e.id
      WHERE a.id = 105
    `);
    if (article105.rows.length > 0) {
      const r = article105.rows[0];
      console.log(`ID: ${r.id} | Publisher: ${r.publisher || 'NULL'} | Last Editor: ${r.last_editor || 'NULL'} | Title: ${r.title}`);
    } else {
      console.log('Article 105 not found');
    }

    console.log('\n--- System Users ---');
    const users = await client.query('SELECT id, username, full_name FROM system_users');
    users.rows.forEach(u => console.log(`ID: ${u.id} | UN: ${u.username} | Name: ${u.full_name}`));

    const nullCount = await client.query('SELECT count(*) FROM articles WHERE author_user_id IS NULL');
    console.log(`\nTotal articles with NULL publisher: ${nullCount.rows[0].count}`);
  } catch (e) {
    console.error(e);
  } finally {
    client.release();
    await pool.end();
  }
}
check();
