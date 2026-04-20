/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/** @format */
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private readonly server!: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  // userId → Set<socketId>
  private readonly userSockets = new Map<string, Set<string>>();

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  handleConnection(client: Socket) {
    try {
      const userId = this.extractUserId(client);
      (client as any).userId = userId;

      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);
      this.logger.log(`Notif connected: ${userId} (${client.id})`);
    } catch {
      client.emit('ws_error', { message: 'Unauthorized' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = (client as any).userId;
    if (userId) {
      this.userSockets.get(userId)?.delete(client.id);
      if (this.userSockets.get(userId)?.size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  // ── Called by NotificationsService after saving to DB ─────────────────────
  emitToUser(userId: string, notification: unknown) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.forEach((id) => {
        this.server.to(id).emit('new_notification', notification);
      });
    }
  }

  private extractUserId(client: Socket): string {
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
