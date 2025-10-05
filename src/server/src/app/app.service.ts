import { Injectable, Inject } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

@Injectable()
export class AppService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectDataSource() private dataSource: DataSource
  ) {}

  getHello(): string {
    return "NestJS API is running!";
  }

  async getHealthCheck() {
    try {
      // Check if the database connection is established
      if (!this.dataSource.isInitialized) {
        return {
          ok: false,
          error: "Database connection not initialized",
          message: "Database connection not initialized",
        };
      }

      // Test the connection with a simple query
      const result = await this.dataSource.query("SELECT NOW() as now");

      return {
        ok: true,
        now: result[0].now,
        message: "Database connection successful",
      };
    } catch (err: unknown) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        message: "Database connection failed",
      };
    }
  }

  // *******************************************************************************
  // NOTE: This is just a Redis test endpoint. Don't worry about using Redis caching
  // until we have our API endpoints set up. Leaving here for future reference
  async getCachedData(
    key: string
  ): Promise<{ cached: boolean; data: unknown }> {
    const cached = await this.cacheManager.get(key);
    if (cached) {
      return { cached: true, data: cached };
    }

    const data = { timestamp: new Date(), random: Math.random() };
    await this.cacheManager.set(key, data, 60000); // 60 seconds
    return { cached: false, data };
  }
}
