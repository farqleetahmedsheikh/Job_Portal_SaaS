import { Module } from '@nestjs/common';
import { CacheModule } from '../cache/cache.modules';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  imports: [CacheModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
