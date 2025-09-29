import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import createKeyv from '@keyv/redis';

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        // Use in-memory cache during tests to avoid open Redis handles
        if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) {
          return {
            ttl: 300000,
          };
        }

        const redisUrl = `redis://${process.env.REDIS_HOST ?? 'redis'}:${process.env.REDIS_PORT ?? '6379'}`;
        return {
          stores: [new createKeyv(redisUrl)],
          ttl: 300000, // 5 minutes in milliseconds (cache-manager v7+ uses milliseconds)
        };
      },
    }),
  ],
  exports: [CacheModule],
})
export class RedisCacheModule {}
