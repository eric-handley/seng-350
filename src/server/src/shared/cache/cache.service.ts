import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  // Store cache key patterns to track which keys need invalidation
  private readonly scheduleCacheKeys = new Set<string>();
  private readonly roomCacheKeys = new Set<string>();
  private readonly buildingCacheKeys = new Set<string>();

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  /**
   * Register a schedule cache key for tracking
   */
  registerScheduleCacheKey(key: string): void {
    this.scheduleCacheKeys.add(key);
  }

  /**
   * Register a room cache key for tracking
   */
  registerRoomCacheKey(key: string): void {
    this.roomCacheKeys.add(key);
  }

  /**
   * Register a building cache key for tracking
   */
  registerBuildingCacheKey(key: string): void {
    this.buildingCacheKeys.add(key);
  }

  /**
   * Clear all schedule-related caches
   */
  async clearScheduleCache(): Promise<void> {
    try {
      for (const key of this.scheduleCacheKeys) {
        await this.cacheManager.del(key);
      }
      this.scheduleCacheKeys.clear();
    } catch (error) {
      console.warn('[CacheService] Failed to clear schedule cache:', error);
    }
  }

  /**
   * Clear all room-related caches
   */
  async clearRoomCache(): Promise<void> {
    try {
      for (const key of this.roomCacheKeys) {
        await this.cacheManager.del(key);
      }
      this.roomCacheKeys.clear();
      await this.clearScheduleCache();
    } catch (error) {
      console.warn('[CacheService] Failed to clear room cache:', error);
    }
  }

  /**
   * Clear all building-related caches
   */
  async clearBuildingCache(): Promise<void> {
    try {
      for (const key of this.buildingCacheKeys) {
        await this.cacheManager.del(key);
      }
      this.buildingCacheKeys.clear();
      await this.clearRoomCache();
    } catch (error) {
      console.warn('[CacheService] Failed to clear building cache:', error);
    }
  }

  /**
   * Clear specific cache entry by key
   */
  async clearKey(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.scheduleCacheKeys.delete(key);
      this.roomCacheKeys.delete(key);
      this.buildingCacheKeys.delete(key);
    } catch (error) {
      console.warn('[CacheService] Failed to clear cache key:', error);
    }
  }
}
