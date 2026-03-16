import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function debug() {
  const client = await pool.connect();
  try {
    console.log('--- SYSTEM USERS ---');
    const users = await client.query('SELECT id, username, full_name, role FROM system_users');
    console.table(users.rows);

    const abdullah = users.rows.find(u => u.full_name === 'عبدالله قاسم' || u.username === 'admin');
    const salah = users.rows.find(u => u.full_name === 'صلاح حيدرة');

    console.log('--- ARTICLE STATS BEFORE ---');
    const stats = await client.query('SELECT author_user_id, COUNT(*) FROM articles GROUP BY author_user_id');
    console.table(stats.rows);

    if (salah) {
       console.log(`Linking articles authored by Salah (text in 'author' column) to his ID: ${salah.id}`);
       // Note: in db.ts, 'author' is a column in 'articles'. 'writer_id' is a foreign key.
       // We'll check 'author' column.
       const upd2 = await client.query('UPDATE articles SET author_user_id = $1 WHERE author = $2', [salah.id, 'صلاح حيدرة']);
       console.log(`Updated ${upd2.rowCount} articles for Salah.`);
    }

    if (abdullah) {
      console.log(`Setting remaining articles with NULL author_user_id to Abdullah (ID: ${abdullah.id})`);
      const upd = await client.query('UPDATE articles SET author_user_id = $1 WHERE author_user_id IS NULL', [abdullah.id]);
      console.log(`Updated ${upd.rowCount} articles to Abdullah.`);
    }

    console.log('--- ARTICLE STATS AFTER ---');
    const statsAfter = await client.query('SELECT author_user_id, COUNT(*) FROM articles GROUP BY author_user_id');
    console.table(statsAfter.rows);

    // Final check for Salah's articles
    const salahCheck = await client.query('SELECT id, title, author_user_id FROM articles WHERE author = $1 LIMIT 5', ['صلاح حيدرة']);
    console.log('Sample of Salahs articles now:');
    console.table(salahCheck.rows);

  } catch (err) {
    console.error('DEBUG ERROR:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

debug();
