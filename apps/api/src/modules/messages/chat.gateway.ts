/** @format */

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MessagingService } from './messages.service';
import { Logger } from '@nestjs/common';

// ── Event name constants (shared with frontend) ────────────────────────────
export const WS_EVENTS = {
  // client → server
  JOIN: 'join_conversation',
  LEAVE: 'leave_conversation',
  SEND: 'send_message',
  TYPING: 'typing',
  STOP_TYPING: 'stop_typing',
  MARK_READ: 'mark_read',

  // server → client
  NEW_MESSAGE: 'new_message',
  TYPING_IND: 'typing_indicator',
  MESSAGE_DEL: 'message_deleted',
  ERROR: 'ws_error',
} as const;

interface AuthSocket extends Socket {
  userId: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private readonly server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  // userId → Set<socketId>  — one user can have multiple tabs open
  private readonly userSockets = new Map<string, Set<string>>();

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly messaging: MessagingService,
  ) {}

  // ── Connection ─────────────────────────────────────────────────────────────
  handleConnection(client: Socket) {
    try {
      const userId = this.extractUserId(client);
      (client as AuthSocket).userId = userId;

      // Track socket
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      this.logger.log(`Connected: ${userId} (${client.id})`);
    } catch {
      client.emit(WS_EVENTS.ERROR, { message: 'Unauthorized' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = (client as AuthSocket).userId;
    if (userId) {
      this.userSockets.get(userId)?.delete(client.id);
      if (this.userSockets.get(userId)?.size === 0) {
        this.userSockets.delete(userId);
      }
    }
    this.logger.log(`Disconnected: ${userId} (${client.id})`);
  }

  // ── Join conversation room ─────────────────────────────────────────────────
  @SubscribeMessage(WS_EVENTS.JOIN)
  async handleJoin(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    const { conversationId } = data;
    try {
      // Verify participant — throws ForbiddenException if not
      await this.messaging.getMessages(conversationId, client.userId);
      await client.join(conversationId);
      this.logger.debug(`${client.userId} joined room ${conversationId}`);
    } catch {
      client.emit(WS_EVENTS.ERROR, {
        message: 'Cannot join this conversation',
      });
    }
  }

  // ── Leave conversation room ────────────────────────────────────────────────
  @SubscribeMessage(WS_EVENTS.LEAVE)
  handleLeave(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    void client.leave(data.conversationId);
  }

  // ── Send message ───────────────────────────────────────────────────────────
  @SubscribeMessage(WS_EVENTS.SEND)
  async handleSend(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { conversationId: string; text: string },
  ) {
    const { conversationId, text } = data;
    if (!text?.trim()) return;

    try {
      const message = await this.messaging.sendMessage(
        conversationId,
        client.userId,
        { text: text.trim() },
      );

      // Broadcast to everyone in the room (including sender's other tabs)
      this.server.to(conversationId).emit(WS_EVENTS.NEW_MESSAGE, message);
    } catch (err) {
      client.emit(WS_EVENTS.ERROR, {
        message: err instanceof Error ? err.message : 'Failed to send',
      });
    }
  }

  // ── Typing indicators ──────────────────────────────────────────────────────
  @SubscribeMessage(WS_EVENTS.TYPING)
  handleTyping(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    // Broadcast to everyone EXCEPT the sender
    client.to(data.conversationId).emit(WS_EVENTS.TYPING_IND, {
      userId: client.userId,
      isTyping: true,
    });
  }

  @SubscribeMessage(WS_EVENTS.STOP_TYPING)
  handleStopTyping(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.to(data.conversationId).emit(WS_EVENTS.TYPING_IND, {
      userId: client.userId,
      isTyping: false,
    });
  }

  // ── Mark read ──────────────────────────────────────────────────────────────
  @SubscribeMessage(WS_EVENTS.MARK_READ)
  async handleMarkRead(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    try {
      await this.messaging.markRead(data.conversationId, client.userId);
    } catch {
      /* swallow */
    }
  }

  // ── Server-side emitter (called from REST controller after HTTP send) ──────
  emitToUser(userId: string, event: string, payload: unknown) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.forEach((id) => {
        this.server.to(id).emit(event, payload);
      });
    }
  }

  // ── Auth helper ────────────────────────────────────────────────────────────
  private extractUserId(client: Socket): string {
    // Try cookie first (browser), then Authorization header (mobile/postman)
    const cookie = client.handshake.headers.cookie ?? '';
    const tokenFromCookie = cookie
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('token='))
      ?.split('=')[1];

    const tokenFromHeader = (
      client.handshake.auth?.token as string | undefined
    )?.replace('Bearer ', '');

    const token = tokenFromCookie ?? tokenFromHeader;
    if (!token) throw new WsException('No token');

    const payload = this.jwt.verify<{ sub: string }>(token, {
      secret: this.config.get<string>('JWT_SECRET'),
    });
    return payload.sub;
  }
}
