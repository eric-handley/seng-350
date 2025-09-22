import { Injectable } from '@nestjs/common';
import { Client } from 'pg';

@Injectable()
export class AppService {
  getHello(): string {
    return 'NestJS API is running!';
  }

  async getHealthCheck() {
    try {
      const client = new Client({
        host: process.env.PGHOST || 'db',
        port: Number(process.env.PGPORT || 5432),
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD || 'postgres',
        database: process.env.PGDATABASE || 'postgres',
      });
      
      await client.connect();
      const result = await client.query('SELECT NOW() as now');
      await client.end();
      
      return { 
        ok: true, 
        now: result.rows[0].now,
        message: 'Database connection successful'
      };
    } catch (err: any) {
      return { 
        ok: false, 
        error: err?.message || String(err),
        message: 'Database connection failed'
      };
    }
  }
}