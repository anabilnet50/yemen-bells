import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const client = await pool.connect();
  try {
    console.log('Starting restoration of Salah Haidera (ID: 153) attribution...');
    
    // We look for articles where Abdullah (36) is the author BUT they were actually published by Salah (153)
    // We know from logs that Salah published several articles recently.
    // Let's first identify them via audit logs for 'إضافة خبر' where user_id was 153
    
    const { rows: logs } = await client.query(`
      SELECT details FROM audit_logs 
      WHERE user_id = 153 AND action = 'إضافة خبر'
    `);
    
    console.log(`Found ${logs.length} articles originally added by Salah.`);
    
    let count = 0;
    for (const log of logs) {
        // Extract ID from details like "تم إضافة الخبر: Title (رقم: 123)" or similar
        // Actually logAction in server.ts for adding is `تم إضافة الخبر: ${title}`. It doesn't include ID in details for POST.
        // Wait, I need a better way.
    }

    // Let's use the trace I did earlier. My audit_results.json showed ID 115 was Salah.
    // Let's check articles that Abdullah "stole" via edits.
    // Actually, any article that has a log of Salah adding it should be his.
    
    // Recovery via audit_logs for POST articles
    const recoverQuery = `
      UPDATE articles a
      SET author_user_id = 153
      FROM audit_logs l
      WHERE l.user_id = 153 
      AND l.action = 'إضافة خبر'
      AND l.details LIKE '%' || a.title || '%'
      AND a.author_user_id = 36;
    `;
    
    const res = await client.query(recoverQuery);
    console.log(`Restored ${res.rowCount} articles to Salah Haidera via title matching in logs.`);

    // Manual backup for specific known IDs if logic fails
    // ID 115 was already Salah in my last audit, but let's be sure.
    
    await client.query("UPDATE articles SET author_user_id = 153 WHERE author_user_id = 153 OR id = 115");
    
    console.log('Restoration complete.');
  } catch (err) {
    console.error('Error during repair:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
