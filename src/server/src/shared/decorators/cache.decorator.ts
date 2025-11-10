import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY_METADATA = 'cache_key';
export const CACHE_TTL_METADATA = 'cache_ttl';

/**
 * Decorator to specify a custom cache key prefix for the endpoint
 * @param key - The cache key prefix (will be combined with query params)
 * @example @CacheKey('buildings:all')
 */
export const CacheKey = (key: string) =>
  SetMetadata(CACHE_KEY_METADATA, key);

/**
 * Decorator to specify a custom TTL (time-to-live) for the cached response
 * @param ttl - The TTL in milliseconds
 * @example @CacheTTL(600000) // 10 minutes
 */
export const CacheTTL = (ttl: number) =>
  SetMetadata(CACHE_TTL_METADATA, ttl);
