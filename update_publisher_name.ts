
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function updateData() {
  const client = await pool.connect();
  try {
    console.log('Updating user and articles...');
    
    // 1. Update admin user full name
    await client.query("UPDATE system_users SET full_name = 'عبدالله قاسم' WHERE username = 'admin' OR full_name = 'صلاح حيدرة'");
    
    // 2. Get the ID of the admin user (or any user named Abdullah Qasem)
    const userRes = await client.query("SELECT id FROM system_users WHERE full_name = 'عبدالله قاسم' LIMIT 1");
    if (userRes.rows.length > 0) {
      const userId = userRes.rows[0].id;
      console.log(`Found user ID: ${userId}`);
      
      // 3. Update all articles to be published by this user
      const res = await client.query("UPDATE articles SET author_user_id = $1", [userId]);
      console.log(`Updated ${res.rowCount} articles.`);
    } else {
      console.error('Could not find user عبدالله قاسم');
    }

  } catch (e) {
    console.error(e);
  } finally {
    client.release();
    await pool.end();
  }
}
updateData();
