import fs from 'fs';
import { Client } from 'pg';

const sql = fs.readFileSync(new URL('../sql/migrations/2026-01-12-add-familias.sql', import.meta.url), 'utf8');

let DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  // try .env file
  try {
    const envText = fs.readFileSync(new URL('../.env', import.meta.url), 'utf8');
    const m = envText.match(/^DATABASE_URL\s*=\s*"?(.*?)"?\s*$/m);
    if (m) DATABASE_URL = m[1];
  } catch (e) {
    // ignore
  }
}

if (!DATABASE_URL) {
  console.error('DATABASE_URL not set (check .env or environment)');
  process.exit(1);
}

(async () => {
  const client = new Client({ connectionString: DATABASE_URL });
  try {
    console.log('Connecting to DB...');
    await client.connect();
    console.log('Connected — running migration...');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('Migration executed successfully');
  } catch (err) {
    console.error('Migration failed:', err);
    try { await client.query('ROLLBACK'); } catch (_) {}
    process.exit(1);
  } finally {
    await client.end();
  }
})();
