import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import * as currentUserDecorator from '../../common/decorators/current-user.decorator';
import { SendMessageDto } from './dto/send-message.dto';
import { CreateConversationDto } from './dto/conversation.dto';
import { MessagingService } from './messages.service';

@Controller('messaging')
@UseGuards(JwtAuthGuard)
export class MessagingController {
  constructor(private readonly svc: MessagingService) {}

  // GET /api/messaging/inbox
  @Get('inbox')
  inbox(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
  ) {
    return this.svc.getInbox(user.sub);
  }

  // GET /api/messaging/unread-count
  @Get('unread-count')
  unreadCount(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
  ) {
    return this.svc.getUnreadCount(user.sub);
  }

  // POST /api/messaging/conversations
  @Post('conversations')
  start(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
    @Body() dto: CreateConversationDto,
  ) {
    return this.svc.findOrCreate(user.sub, dto);
  }

  // GET /api/messaging/conversations/:id/messages
  @Get('conversations/:id/messages')
  getMessages(
    @Param('id', ParseUUIDPipe) id: string,
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
  ) {
    return this.svc.getMessages(id, user.sub);
  }

  // POST /api/messaging/conversations/:id/messages
  @Post('conversations/:id/messages')
  sendMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
    @Body() dto: SendMessageDto,
  ) {
    return this.svc.sendMessage(id, user.sub, dto);
  }

  // DELETE /api/messaging/messages/:id
  @Delete('messages/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
  ) {
    return this.svc.deleteMessage(id, user.sub);
  }
}
