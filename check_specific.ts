import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  try {
    const res = await pool.query("SELECT * FROM system_users WHERE username = 'admin20' OR id = 137");
    console.log('Specific Users (admin20 or 137):');
    console.log(JSON.stringify(res.rows, null, 2));

    const audit = await pool.query("SELECT * FROM audit_logs WHERE details LIKE '%admin20%' OR details LIKE '%137%' ORDER BY created_at DESC");
    console.log('\nSpecific Audit Logs:');
    console.log(JSON.stringify(audit.rows, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

check();
