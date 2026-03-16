import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fix() {
  const client = await pool.connect();
  try {
    const salahSystemId = 153;
    const salahWriterId = 2;

    console.log('--- RE-ATTRIBUTING ARTICLES TO SALAH ---');
    
    // 1. Link by writer_id
    const res1 = await client.query('UPDATE articles SET author_user_id = $1 WHERE writer_id = $2', [salahSystemId, salahWriterId]);
    console.log(`Linked ${res1.rowCount} articles by writer_id.`);

    // 2. Link by author text variant (h instead of ta marbuta)
    const res2 = await client.query("UPDATE articles SET author_user_id = $1 WHERE author LIKE '%صلاح حيدره%'", [salahSystemId]);
    console.log(`Linked ${res2.rowCount} articles by author text variant (ه).`);
    
    // 3. Link by just 'صلاح' if it's the only word or part of it? 
    // Careful not to over-match. 
    const res3 = await client.query("UPDATE articles SET author_user_id = $1 WHERE author = 'صلاح'", [salahSystemId]);
     console.log(`Linked ${res3.rowCount} articles with author='صلاح'.`);

    // 4. Check for any other articles that might be his
    const check = await client.query("SELECT id, title, author FROM articles WHERE author_user_id != $1 AND (title LIKE '%صلاح حيدرة%' OR content LIKE '%صلاح حيدرة%')", [salahSystemId]);
    console.log('Articles containing Salahs name but not attributed to him:');
    console.table(check.rows);

    const stats = await client.query(`
      SELECT u.full_name, COUNT(*) 
      FROM articles a 
      JOIN system_users u ON a.author_user_id = u.id 
      GROUP BY u.full_name
    `);
    console.table(stats.rows);

  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    await pool.end();
  }
}

fix();
