import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private client!: Redis;

  constructor(private readonly config: ConfigService) {}

  // ── Lifecycle ─────────────────────────────────────────
  onModuleInit() {
    this.client = new Redis({
      host: this.config.get<string>('redis.host') ?? 'localhost',
      port: this.config.get<number>('redis.port') ?? 6379,
      password: this.config.get<string>('redis.password') || undefined,
      retryStrategy: (times) => Math.min(times * 100, 3000), // exponential backoff
      lazyConnect: false,
    });

    this.client.on('connect', () => this.logger.log('Redis connected'));
    this.client.on('error', (err: Error) =>
      this.logger.error('Redis error', err.message),
    );
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  // ── Get ────────────────────────────────────────────────
  get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  // ── Set with TTL (seconds) ─────────────────────────────
  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.client.set(key, value, 'EX', ttlSeconds);
  }

  // ── Delete ─────────────────────────────────────────────
  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  // ── Check existence ────────────────────────────────────
  async exists(key: string): Promise<boolean> {
    const count = await this.client.exists(key);
    return count > 0;
  }

  // ── TTL remaining (seconds) ────────────────────────────
  ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }
}
