
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  try {
    const logs = await pool.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 20');
    console.log('AUDIT_LOGS_START');
    console.log(JSON.stringify(logs.rows, null, 2));
    console.log('AUDIT_LOGS_END');
    
    const blocked = await pool.query('SELECT * FROM blocked_ips');
    console.log('BLOCKED_IPS_START');
    console.log(JSON.stringify(blocked.rows, null, 2));
    console.log('BLOCKED_IPS_END');
    
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
