import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request, Response } from 'express';
import { Repository } from 'typeorm';
import { SystemLogLevel } from '../../../common/enums/enums';
import { SystemLog } from '../entities/system-log.entity';

@Catch()
@Injectable()
export class SystemLogExceptionFilter implements ExceptionFilter {
  constructor(
    @InjectRepository(SystemLog)
    private readonly logs: Repository<SystemLog>,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const isHttp = exception instanceof HttpException;
    const status = isHttp
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const payload = isHttp ? exception.getResponse() : null;
    const message =
      typeof payload === 'object' && payload && 'message' in payload
        ? this.stringifyMessage((payload as { message: unknown }).message)
        : exception instanceof Error
          ? exception.message
          : 'Internal server error';

    void this.logs
      .save(
        this.logs.create({
          level: status >= 500 ? SystemLogLevel.ERROR : SystemLogLevel.WARNING,
          message,
          route: request.originalUrl ?? request.url ?? null,
          method: request.method ?? null,
          stackTrace:
            exception instanceof Error ? (exception.stack ?? null) : null,
        }),
      )
      .catch(() => undefined);

    response.status(status).json({
      statusCode: status,
      message,
      path: request.originalUrl ?? request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private stringifyMessage(message: unknown): string {
    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string') return message;
    return 'Request failed';
  }
}
