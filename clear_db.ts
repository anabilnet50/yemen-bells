import db, { initDb } from './db.ts';

async function resetDatabase() {
    console.log('--- Starting Database Factory Reset ---');
    const client = await db.connect();
    try {
        const tables = [
            'audit_logs',
            'comments',
            'articles',
            'categories',
            'writers',
            'ads',
            'settings',
            'subscribers',
            'poll_comments',
            'system_users',
            'media_storage'
        ];

        console.log('Clearing tables...');
        for (const table of tables) {
            try {
                console.log(`Checking table: ${table}`);
                const tableCheck = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          );
        `, [table]);

                if (tableCheck.rows[0].exists) {
                    console.log(`Truncating table: ${table}...`);
                    // Use CASCADE to handle dependencies. 
                    // Not all tables have sequences, so we handle RESTART IDENTITY carefully if needed, 
                    // but TRUNCATE CASCADE is usually enough to clear data.
                    await client.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
                } else {
                    console.log(`Table ${table} does not exist, skipping.`);
                }
            } catch (e) {
                console.error(`Error clearing table ${table}:`, e);
            }
        }

        console.log('--- Database Cleared ---');
        console.log('--- Re-initializing Default Data ---');
        await initDb();
        console.log('--- Factory Reset Complete ---');

    } catch (err) {
        console.error('CRITICAL FAILURE during reset:', err);
        process.exit(1);
    } finally {
        client.release();
        process.exit(0);
    }
}

resetDatabase();
