import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
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
    @Query('search') search?: string,
    @Query('filter') filter?: string,
  ) {
    return this.svc.getInbox(user.sub, user.role, { search, filter });
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
    return this.svc.findOrCreate(user.sub, dto, user.role);
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

  // PATCH /api/messaging/conversations/:id/read
  @Patch('conversations/:id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  markRead(
    @Param('id', ParseUUIDPipe) id: string,
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
  ) {
    return this.svc.markRead(id, user.sub);
  }

  // PATCH /api/messaging/conversations/:id/archive
  @Patch('conversations/:id/archive')
  @HttpCode(HttpStatus.NO_CONTENT)
  archive(
    @Param('id', ParseUUIDPipe) id: string,
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
    @Body('archived') archived?: boolean,
  ) {
    return this.svc.archiveConversation(
      id,
      user.sub,
      user.role,
      archived ?? true,
    );
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
