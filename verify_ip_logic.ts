
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function verify() {
  const testIp = '1.2.3.4';
  console.log(`Testing with IP: ${testIp}`);
  
  try {
    // 1. Add IP to blocklist
    await pool.query('INSERT INTO blocked_ips (ip_address, reason) VALUES ($1, $2) ON CONFLICT (ip_address) DO NOTHING', [testIp, 'Test Ban']);
    console.log(`Inserted ${testIp} into blocked_ips`);

    // 2. Simulate a request through the server (we can't easily trigger the real server middleware from here,
    // but we can test the database query that the middleware uses)
    const { rows } = await pool.query('SELECT * FROM blocked_ips WHERE ip_address = $1', [testIp]);
    
    if (rows.length > 0) {
      console.log('SUCCESS: Database correctly identifies the blocked IP.');
    } else {
      console.error('FAILURE: Database did NOT find the blocked IP.');
    }

    // 3. Cleanup
    await pool.query('DELETE FROM blocked_ips WHERE ip_address = $1', [testIp]);
    console.log('Test complete and cleaned up.');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

verify();
