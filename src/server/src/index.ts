import http from 'http';
import { Client } from 'pg';

const port = Number(process.env.PORT || 3000);

const server = http.createServer(async (_req, res) => {
  try {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      host: process.env.PGHOST || 'db',
      port: Number(process.env.PGPORT || 5432),
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      database: process.env.PGDATABASE || 'postgres',
    });
    await client.connect();
    const result = await client.query('select now() as now');
    await client.end();
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, now: result.rows[0].now }));
  } catch (err: any) {
    res.writeHead(500, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: err?.message || String(err) }));
  }
});

server.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});

