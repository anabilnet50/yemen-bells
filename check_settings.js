import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function check() {
    const client = await pool.connect();
    try {
        const { rows } = await client.query("SELECT * FROM settings");
        console.log('Current Settings:', rows);
    } finally {
        client.release();
        await pool.end();
    }
}

check();
