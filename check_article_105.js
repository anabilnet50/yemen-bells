import pkg from 'pg';
const { Client } = pkg;
const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/hads_db'
});

async function checkArticle() {
  try {
    await client.connect();
    const res = await client.query(`
      SELECT articles.id, articles.title, system_users.full_name as publisher_name, editors.full_name as last_editor_name
      FROM articles
      LEFT JOIN system_users ON articles.author_user_id = system_users.id
      LEFT JOIN system_users as editors ON articles.last_editor_user_id = editors.id
      WHERE articles.id = 105
    `);
    console.log('خبر رقم 105:', res.rows[0]);
  } catch (err) {
    console.error('خطأ:', err);
  } finally {
    await client.end();
  }
}

checkArticle();