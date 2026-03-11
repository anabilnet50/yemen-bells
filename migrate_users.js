import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  try {
      await pool.query("ALTER TABLE system_users ADD COLUMN IF NOT EXISTS email TEXT");
      await pool.query("ALTER TABLE system_users ADD COLUMN IF NOT EXISTS reset_token TEXT");
      await pool.query("ALTER TABLE system_users ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMPTZ");
      console.log("Migration successful");
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
migrate();
