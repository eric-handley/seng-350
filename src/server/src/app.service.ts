import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Client } from 'pg';

@Injectable()
export class AppService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

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

  // *******************************************************************************
  // NOTE: This is just a Redis test endpoint. Don't worry about using Redis caching 
  // until we have our API endpoints set up. Leaving here for future reference
  async getCachedData(key: string): Promise<any> {
    const cached = await this.cacheManager.get(key);
    if (cached) {
      return { cached: true, data: cached };
    }

    const data = { timestamp: new Date(), random: Math.random() };
    await this.cacheManager.set(key, data, 60000); // 60 seconds
    return { cached: false, data };
  }
}