import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function fix() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Set site_name exactly as requested (including Musnad)
        await client.query("UPDATE settings SET value = $1 WHERE key = 'site_name'", ['𐩠𐩵𐩪 هدس – الأقرب للأحدث']);

        // Set site_tagline to the secondary part only
        await client.query("UPDATE settings SET value = $1 WHERE key = 'site_tagline'", ['موقع إخباري متكامل']);

        await client.query('COMMIT');
        console.log('Database branding fixed.');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error(e);
    } finally {
        client.release();
        await pool.end();
    }
}

fix();
