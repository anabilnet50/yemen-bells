import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
    try {
        await pool.query('ALTER TABLE system_users ADD COLUMN IF NOT EXISTS requires_password_change BOOLEAN DEFAULT false');
        console.log('Migration successful: requires_password_change column added.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        pool.end();
    }
}
migrate();
