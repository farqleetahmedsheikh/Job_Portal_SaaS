import { Module, Global } from '@nestjs/common';
import { CacheService } from './cache.service';

@Global() // available everywhere without importing — like ConfigModule
@Module({
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
