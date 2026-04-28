import {
  Injectable as Injectable3,
  NestInterceptor,
  ExecutionContext as Ctx4,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { instanceToPlain } from 'class-transformer';

@Injectable3()
export class SerializeInterceptor implements NestInterceptor {
  intercept(_ctx: Ctx4, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => instanceToPlain(data)));
  }
}
