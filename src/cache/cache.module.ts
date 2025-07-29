import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    CacheModule.register({
      ttl: 3600 * 1000, // 1 hour in milliseconds
      max: 10000, // maximum number of items in cache
      isGlobal: true,
    }),
  ],
  exports: [CacheModule],
})
export class AppCacheModule {}
