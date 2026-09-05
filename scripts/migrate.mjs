import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import pg from 'pg';
const { Client } = pg;
if (!process.env.DATABASE_ADMIN_URL || !process.env.DATABASE_URL) throw new Error('Load .env.azure.local before running migrations.');
const client = new Client({ connectionString: process.env.DATABASE_ADMIN_URL, ssl: { rejectUnauthorized: true }, connectionTimeoutMillis: 15000 });
await client.connect();
try {
  await client.query("select pg_advisory_lock(74201926)");
  await client.query('create table if not exists public.kaki_migrations(name text primary key, checksum text not null, applied_at timestamptz default now())');
  for (const name of (await readdir('db/migrations')).filter(n => n.endsWith('.sql')).sort()) {
    const sql = await readFile(`db/migrations/${name}`, 'utf8');
    const checksum = createHash('sha256').update(sql).digest('hex');
    const existing = await client.query('select checksum from public.kaki_migrations where name=$1', [name]);
    if (existing.rows.length) {
      if (existing.rows[0].checksum !== checksum) throw new Error(`Applied migration changed: ${name}`);
      continue;
    }
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('insert into public.kaki_migrations(name,checksum) values($1,$2)', [name, checksum]);
      await client.query('COMMIT');
      console.log(`Applied ${name}`);
    } catch (error) { await client.query('ROLLBACK'); throw error; }
  }
  const password = decodeURIComponent(new URL(process.env.DATABASE_URL).password);
  // format(%L) quotes the password on the server; never concatenate an unquoted secret.
  const command = await client.query("select format('alter role kaki_app login password %L', $1::text) as sql", [password]);
  await client.query(command.rows[0].sql);
  console.log('Runtime role configured. No administrator connection is needed by the app.');
} finally { await client.end(); }
