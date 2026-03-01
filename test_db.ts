import db from './db.ts';

async function testConn() {
    console.log('Testing connection...');
    try {
        const res = await db.query('SELECT NOW()');
        console.log('Connection successful:', res.rows[0]);
    } catch (err) {
        console.error('Connection failed:', err);
    } finally {
        process.exit(0);
    }
}

testConn();
