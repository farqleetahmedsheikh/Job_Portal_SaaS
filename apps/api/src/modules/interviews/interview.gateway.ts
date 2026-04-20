// interviews/interview.gateway.ts — full replacement header

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

interface AuthSocket extends Socket {
  userId: string;
  userName: string;
}

@WebSocketGateway({
  namespace: '/interview',
  cors: {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000', // ✅ not wildcard
    credentials: true,
  },
})
export class InterviewGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(InterviewGateway.name);
  private rooms = new Map<
    string,
    { socketId: string; userId: string; name: string }[]
  >();
  private socketRoom = new Map<string, string>();

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ✅ Authenticate on connect — reject unauthenticated sockets immediately
  handleConnection(client: Socket) {
    try {
      const userId = this.extractUserId(client);
      (client as AuthSocket).userId = userId;
      this.logger.log(`Interview WS connected: ${userId}`);
    } catch {
      client.emit('ws_error', { message: 'Unauthorized' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const interviewId = this.socketRoom.get(client.id);
    if (interviewId) {
      this.removeFromRoom(client);
      client
        .to(interviewId)
        .emit('interview:user-left', { socketId: client.id });
    }
  }

  @SubscribeMessage('interview:join')
  handleJoin(
    @MessageBody() data: { interviewId: string; userId: string; name: string },
    @ConnectedSocket() client: AuthSocket,
  ) {
    const { interviewId, name } = data;
    const userId = client.userId; // ✅ use authenticated userId, not client-supplied

    void client.join(interviewId);
    this.socketRoom.set(client.id, interviewId);

    const room = this.rooms.get(interviewId) ?? [];
    const filtered = room.filter((p) => p.userId !== userId);
    filtered.push({ socketId: client.id, userId, name });
    this.rooms.set(interviewId, filtered);

    client.emit('interview:participants', { participants: filtered });
    client.to(interviewId).emit('interview:user-joined', { userId, name });
  }

  // ... rest of handlers unchanged, just replace client.userId for sender identity

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

  private removeFromRoom(client: Socket) {
    const interviewId = this.socketRoom.get(client.id);
    if (!interviewId) return;
    const room = this.rooms.get(interviewId) ?? [];
    this.rooms.set(
      interviewId,
      room.filter((p) => p.socketId !== client.id),
    );
    this.socketRoom.delete(client.id);
  }
}
