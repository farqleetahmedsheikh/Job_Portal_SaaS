import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
// import { UseGuards } from '@nestjs/common';
// import { WsJwtGuard } from '../../common/guards/ws-jwt.guard';

interface RoomParticipant {
  socketId: string;
  userId: string;
  name: string;
}

@WebSocketGateway({
  namespace: '/interview',
  cors: { origin: '*', credentials: true },
})
export class InterviewGateway implements OnGatewayDisconnect {
  @WebSocketServer() server: Server | undefined;

  // interviewId → participants
  private rooms = new Map<string, RoomParticipant[]>();
  // socketId → interviewId (for cleanup on disconnect)
  private socketRoom = new Map<string, string>();

  @SubscribeMessage('interview:join')
  handleJoin(
    @MessageBody() data: { interviewId: string; userId: string; name: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { interviewId, userId, name } = data;

    void client.join(interviewId);
    this.socketRoom.set(client.id, interviewId);

    const room = this.rooms.get(interviewId) ?? [];

    // Remove stale entry for same userId if re-joining
    const filtered = room.filter((p) => p.userId !== userId);
    filtered.push({ socketId: client.id, userId, name });
    this.rooms.set(interviewId, filtered);

    // Tell this client who's already here
    client.emit('interview:participants', { participants: filtered });

    // Tell others this person joined
    client.to(interviewId).emit('interview:user-joined', { userId, name });
  }

  @SubscribeMessage('interview:offer')
  handleOffer(
    @MessageBody()
    data: { interviewId: string; offer: RTCSessionDescriptionInit },
    @ConnectedSocket() client: Socket,
  ) {
    const room = this.rooms.get(data.interviewId) ?? [];
    const sender = room.find((p) => p.socketId === client.id);
    client.to(data.interviewId).emit('interview:offer', {
      offer: data.offer,
      userId: sender?.userId,
      name: sender?.name,
    });
  }

  @SubscribeMessage('interview:answer')
  handleAnswer(
    @MessageBody()
    data: { interviewId: string; answer: RTCSessionDescriptionInit },
    @ConnectedSocket() client: Socket,
  ) {
    client
      .to(data.interviewId)
      .emit('interview:answer', { answer: data.answer });
  }

  @SubscribeMessage('interview:ice-candidate')
  handleIceCandidate(
    @MessageBody()
    data: { interviewId: string; candidate: RTCIceCandidateInit },
    @ConnectedSocket() client: Socket,
  ) {
    client
      .to(data.interviewId)
      .emit('interview:ice-candidate', { candidate: data.candidate });
  }

  @SubscribeMessage('interview:leave')
  handleLeave(
    @MessageBody() data: { interviewId: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.removeFromRoom(client);
    client
      .to(data.interviewId)
      .emit('interview:user-left', { socketId: client.id });
    void client.leave(data.interviewId);
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
