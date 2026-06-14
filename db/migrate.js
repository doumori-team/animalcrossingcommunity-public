import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS _schema_updates (
      filename TEXT PRIMARY KEY,
      run_at TIMESTAMP DEFAULT NOW()
    );
  `);

  const { rows } = await client.query(
    'SELECT filename FROM _schema_updates'
  );

  const alreadyRun = new Set(rows.map(r => r.filename));

  const updateDir = path.join(__dirname, 'update');
  const files = fs.readdirSync(updateDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (alreadyRun.has(file)) continue;

    console.log(`Running migration: ${file}`);

    const sql = fs.readFileSync(
      path.join(updateDir, file),
      'utf8'
    );

    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query(
        'INSERT INTO _schema_updates(filename) VALUES ($1)',
        [file]
      );
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }
  }

  await client.end();
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
