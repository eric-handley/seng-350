import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Reflector } from '@nestjs/core';
import {
  CACHE_KEY_METADATA,
  CACHE_TTL_METADATA,
} from '../decorators/cache.decorator';

@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Only cache GET requests
    if (request.method !== 'GET') {
      return next.handle();
    }

    // Generate cache key
    const cacheKey = this.generateCacheKey(context, request);

    // Check if response is cached
    try {
      const cachedResponse = await this.cacheManager.get(cacheKey);
      if (cachedResponse) {
        response.setHeader('X-Cache', 'HIT');
        return of(cachedResponse);
      }
    } catch (error) {
      // If cache lookup fails, continue without caching
      console.warn('[HttpCacheInterceptor] Cache lookup failed:', error);
    }

    response.setHeader('X-Cache', 'MISS');

    // Get TTL from metadata or use default
    const defaultTtl = 300000; // 5 minutes
    const ttl =
      this.reflector.get<number>(CACHE_TTL_METADATA, context.getHandler()) ??
      defaultTtl;

    return next.handle().pipe(
      tap(async (data) => {
        try {
          await this.cacheManager.set(cacheKey, data, ttl);
        } catch (error) {
          // If cache set fails, just continue - don't break the response
          console.warn('[HttpCacheInterceptor] Failed to cache response:', error);
        }
      }),
    );
  }

  private generateCacheKey(context: ExecutionContext, request: Request): string {
    const handler = context.getHandler();

    // Check if a custom cache key is specified via decorator
    const customPrefix = this.reflector.get<string>(
      CACHE_KEY_METADATA,
      handler,
    );

    // Use custom prefix if provided, otherwise derive from route
    let prefix = customPrefix || this.extractRoutePrefix(request.route?.path || request.url);

    // Include path parameters (e.g., building short_name, room_id)
    if (request.params && Object.keys(request.params).length > 0) {
      const paramValues = Object.values(request.params).join(':');
      prefix = `${prefix}:${paramValues}`;
    }

    // Include query parameters in cache key for differentiation
    const queryString = new URLSearchParams(
      request.query as Record<string, string>,
    ).toString();

    if (queryString) {
      return `${prefix}:${queryString}`;
    }

    return prefix;
  }

  private extractRoutePrefix(path: string): string {
    // Extract a clean prefix from the route path
    // e.g., /api/schedule -> schedule, /api/buildings/:id -> buildings
    const cleanPath = path.replace(/^\/api/, '').split('/').filter(Boolean)[0];
    return cleanPath || 'default';
  }
}
