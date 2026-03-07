import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}

  getPort(): number {
    const port = this.configService.get<number>('PORT');
    return port !== undefined ? port : 4000;
  }

  getCorsOrigin(): string {
    const origin = this.configService.get<string>('CORS_ORIGIN');
    return origin !== undefined ? origin : '*';
  }
}
