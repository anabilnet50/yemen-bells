import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  try {
    const audit = await pool.query("SELECT * FROM audit_logs WHERE details LIKE '%فشل%' OR details LIKE '%error%' OR action LIKE '%بريد%' OR details LIKE '%email%' ORDER BY created_at DESC");
    console.log('Search Results in Audit Logs:');
    console.log(JSON.stringify(audit.rows, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

check();
