const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({});

async function updateDb() {
    try {
        await pool.query("UPDATE categories SET slug = 'society', name = 'مجتمع' WHERE slug = 'tourism'");
        console.log('Successfully updated DB');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

updateDb();
