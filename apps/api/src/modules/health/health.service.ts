import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly cache: CacheService,
  ) {}

  async check() {
    const [database, redis] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);
    const ok = database.status === 'ok' && redis.status === 'ok';
    return {
      status: ok ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services: { database, redis },
    };
  }

  private async checkDatabase() {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'ok' };
    } catch {
      return { status: 'down' };
    }
  }

  private async checkRedis() {
    try {
      const response = await this.cache.ping();
      return { status: response === 'PONG' ? 'ok' : 'down' };
    } catch {
      return { status: 'down' };
    }
  }
}
