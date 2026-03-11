import db, { initDb } from './db.ts';

async function run() {
  await initDb();
  const { rows } = await db.query("SELECT DISTINCT action FROM audit_logs");
  console.log("Distinct actions:");
  rows.forEach(r => console.log(`'${r.action}'`));
  process.exit(0);
}

run();
