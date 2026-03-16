import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkSchemaAndData() {
  const client = await pool.connect();
  try {
    console.log('--- TABLE SCHEMA FOR articles ---');
    const schema = await client.query(`
      SELECT column_name, column_default, is_nullable, data_type
      FROM information_schema.columns
      WHERE table_name = 'articles' AND column_name = 'author_user_id'
    `);
    console.table(schema.rows);

    console.log('--- RECENT ARTICLES WITH WRONG ATTRIBUTION ---');
    // Find articles created by Salah (from logs) but attributed to Abdullah (in table)
    const mismatch = await client.query(`
      SELECT a.id, a.title, l.user_id as logged_user_id, a.author_user_id as table_user_id
      FROM articles a
      JOIN audit_logs l ON l.details LIKE '%' || a.id || '%'
      WHERE l.action = 'إضافة خبر' AND l.user_id != a.author_user_id
    `);
    console.table(mismatch.rows);

  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    await pool.end();
  }
}

checkSchemaAndData();
