import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  try {
    const res = await pool.query('SELECT username, email, full_name, created_at FROM system_users ORDER BY created_at DESC LIMIT 5');
    console.log('Recent Users:');
    console.log(JSON.stringify(res.rows, null, 2));

    const audit = await pool.query("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 5");
    console.log('\nRecent Audit Logs:');
    console.log(JSON.stringify(audit.rows, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

check();
