import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  /**
   * Clear all cache entries matching a glob pattern
   * For Redis, this uses SCAN and DEL for pattern matching
   */
  async clearPattern(pattern: string): Promise<void> {
    try {
      // Get all keys from cache
      const allKeys = await this.cacheManager.store.getKeys?.();

      if (Array.isArray(allKeys)) {
        const regex = this.patternToRegex(pattern);
        const keysToDelete = allKeys.filter((key) => regex.test(key));

        for (const key of keysToDelete) {
          await this.cacheManager.del(key);
        }
      }
    } catch (error) {
      console.warn('[CacheService] Failed to clear cache pattern:', error);
      // Don't throw - cache invalidation failures shouldn't break the application
    }
  }

  /**
   * Clear all schedule-related caches
   */
  async clearScheduleCache(): Promise<void> {
    await this.clearPattern('schedule:.*');
  }

  /**
   * Clear all room-related caches
   */
  async clearRoomCache(): Promise<void> {
    await Promise.all([
      this.clearPattern('room:.*'),
      this.clearPattern('rooms:.*'),
      this.clearScheduleCache(), // Clearing schedule since it depends on room data
    ]);
  }

  /**
   * Clear all building-related caches
   */
  async clearBuildingCache(): Promise<void> {
    await Promise.all([
      this.clearPattern('building:.*'),
      this.clearPattern('buildings:.*'),
      this.clearRoomCache(), // Clearing rooms since they depend on buildings
    ]);
  }

  /**
   * Clear specific cache entry by key
   */
  async clearKey(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
    } catch (error) {
      console.warn('[CacheService] Failed to clear cache key:', error);
    }
  }

  /**
   * Convert glob pattern to regex for cache key matching
   * e.g., 'schedule:*' -> /^schedule:.*/
   */
  private patternToRegex(pattern: string): RegExp {
    const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    const regex = escaped.replace(/\\\*/g, '.*');
    return new RegExp(`^${regex}$`);
  }
}
