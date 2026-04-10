// notifications.controller.ts
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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import * as currentUserDecorator from '../../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  // GET /api/notifications?unread=true
  @Get()
  findAll(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
    @Query('unread') unread?: string,
  ) {
    return this.svc.findAll(user.sub, unread === 'true');
  }

  // GET /api/notifications/unread-count
  @Get('unread-count')
  unreadCount(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
  ) {
    return this.svc.getUnreadCount(user.sub);
  }

  // PATCH /api/notifications/read-all
  @Patch('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  markAllRead(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
  ) {
    return this.svc.markAllRead(user.sub);
  }

  // PATCH /api/notifications/:id/read
  @Patch(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  markRead(
    @Param('id', ParseUUIDPipe) id: string,
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
  ) {
    return this.svc.markRead(id, user.sub);
  }

  // DELETE /api/notifications/:id
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
  ) {
    return this.svc.remove(id, user.sub);
  }
}
