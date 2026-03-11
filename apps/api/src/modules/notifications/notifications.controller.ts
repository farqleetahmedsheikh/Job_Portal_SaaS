import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import * as authService from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  // GET /api/notifications?unread=true
  @Get()
  findAll(
    @CurrentUser() user: authService.JwtPayload,
    @Query('unread') unread?: string,
  ) {
    return this.svc.findAll(user.sub, unread === 'true');
  }

  // GET /api/notifications/unread-count
  @Get('unread-count')
  unreadCount(@CurrentUser() user: authService.JwtPayload) {
    return this.svc.getUnreadCount(user.sub);
  }

  // PATCH /api/notifications/:id/read
  @Patch(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  markRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: authService.JwtPayload,
  ) {
    return this.svc.markRead(id, user.sub);
  }

  // PATCH /api/notifications/read-all
  @Patch('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  markAllRead(@CurrentUser() user: authService.JwtPayload) {
    return this.svc.markAllRead(user.sub);
  }

  // DELETE /api/notifications/:id
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: authService.JwtPayload,
  ) {
    return this.svc.remove(id, user.sub);
  }
}
