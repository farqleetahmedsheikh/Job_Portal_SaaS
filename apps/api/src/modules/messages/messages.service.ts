/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { Conversation } from './entities/conversation.entity';
import { ConversationParticipant } from './entities/conversation-participant.entity';
import { Message } from './entities/message.entity';
import { CreateConversationDto } from './dto/conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class MessagingService {
  constructor(
    // ✅ Entity classes — not strings
    @InjectRepository(Conversation)
    private readonly convRepo: Repository<Conversation>,
    @InjectRepository(ConversationParticipant)
    private readonly partRepo: Repository<ConversationParticipant>,
    @InjectRepository(Message) private readonly msgRepo: Repository<Message>,
    private readonly ds: DataSource,
  ) {}

  // ── Start or retrieve existing conversation ────────────────────────────────
  async findOrCreate(userId: string, dto: CreateConversationDto) {
    const existing = await this.ds.query(
      `SELECT c.id FROM conversations c
       JOIN conversation_participants p1 ON p1.conversation_id = c.id AND p1.user_id = $1
       JOIN conversation_participants p2 ON p2.conversation_id = c.id AND p2.user_id = $2
       WHERE ($3::uuid IS NULL OR c.job_id = $3)
       LIMIT 1`,
      [userId, dto.recipientId, dto.jobId ?? null],
    );

    if (existing.length) {
      await this.sendMessage(existing[0].id, userId, {
        text: dto.firstMessage,
      });
      return this.findOne(existing[0].id, userId);
    }

    return this.ds.transaction(async (m) => {
      // ✅ m.create(EntityClass, data) — two args
      const conv = m.create(Conversation, { jobId: dto.jobId ?? null });
      await m.save(Conversation, conv);

      await m.save(ConversationParticipant, [
        m.create(ConversationParticipant, { conversationId: conv.id, userId }),
        m.create(ConversationParticipant, {
          conversationId: conv.id,
          userId: dto.recipientId,
        }),
      ]);

      await m.save(
        Message,
        m.create(Message, {
          conversationId: conv.id,
          senderId: userId,
          text: dto.firstMessage,
        }),
      );

      return this.findOne(conv.id, userId);
    });
  }

  // ── Inbox ───────────────────────────────────────────────────────────────────
  async getInbox(userId: string) {
    return this.ds.query(
      `SELECT
         c.id, c.job_id, c.updated_at,
         other_user.id         AS other_user_id,
         other_user.full_name  AS other_user_name,
         other_user.avatar_url AS other_user_avatar,
         other_user.role       AS other_user_role,
         last_msg.text         AS last_message,
         last_msg.created_at   AS last_message_at,
         last_msg.sender_id    AS last_message_sender_id,
         j.title               AS job_title,
         COUNT(unread.id)::int AS unread_count
       FROM conversations c
       JOIN conversation_participants me
            ON me.conversation_id = c.id AND me.user_id = $1
       JOIN conversation_participants other_part
            ON other_part.conversation_id = c.id AND other_part.user_id <> $1
       JOIN users other_user ON other_user.id = other_part.user_id
       LEFT JOIN LATERAL (
         SELECT text, created_at, sender_id FROM messages
         WHERE conversation_id = c.id AND is_deleted = FALSE
         ORDER BY created_at DESC LIMIT 1
       ) last_msg ON TRUE
       LEFT JOIN jobs j ON j.id = c.job_id
       LEFT JOIN messages unread
            ON  unread.conversation_id = c.id
            AND unread.sender_id <> $1
            AND unread.is_deleted = FALSE
            AND unread.created_at > COALESCE(me.last_read_at, '1970-01-01')
       GROUP BY c.id, other_user.id, last_msg.text, last_msg.created_at, last_msg.sender_id, j.title
       ORDER BY c.updated_at DESC`,
      [userId],
    );
  }

  // ── Messages in a conversation ──────────────────────────────────────────────
  async getMessages(convId: string, userId: string) {
    await this.participantOrFail(convId, userId);

    const messages = await this.msgRepo.find({
      where: { conversationId: convId, isDeleted: false },
      relations: ['sender'],
      order: { createdAt: 'ASC' },
    });

    // Mark as read
    await this.partRepo.update(
      { conversationId: convId, userId },
      { lastReadAt: new Date() },
    );

    return messages;
  }

  // ── Send ────────────────────────────────────────────────────────────────────
  async sendMessage(convId: string, userId: string, dto: SendMessageDto) {
    await this.participantOrFail(convId, userId);

    return this.msgRepo.save(
      this.msgRepo.create({
        conversationId: convId,
        senderId: userId,
        text: dto.text,
      }),
    );
  }

  // ── Soft-delete own message ─────────────────────────────────────────────────
  async deleteMessage(msgId: string, userId: string) {
    const msg = await this.msgRepo.findOneBy({ id: msgId });
    if (!msg) throw new NotFoundException('Message not found');
    if (msg.senderId !== userId)
      throw new ForbiddenException("Cannot delete others' messages");
    await this.msgRepo.update(msgId, { isDeleted: true });
  }

  // ── Unread count ────────────────────────────────────────────────────────────
  async getUnreadCount(userId: string): Promise<number> {
    const result = await this.ds.query(
      `SELECT COUNT(m.id)::int AS count
       FROM messages m
       JOIN conversation_participants cp
            ON cp.conversation_id = m.conversation_id AND cp.user_id = $1
       WHERE m.sender_id <> $1
         AND m.is_deleted = FALSE
         AND m.created_at > COALESCE(cp.last_read_at, '1970-01-01')`,
      [userId],
    );
    return result[0]?.count ?? 0;
  }

  // ── Private ─────────────────────────────────────────────────────────────────
  private async findOne(convId: string, userId: string) {
    await this.participantOrFail(convId, userId);
    return this.convRepo.findOne({
      where: { id: convId },
      relations: ['participants', 'participants.user', 'job'],
    });
  }

  private async participantOrFail(convId: string, userId: string) {
    const part = await this.partRepo.findOneBy({
      conversationId: convId,
      userId,
    });
    if (!part)
      throw new ForbiddenException('Not a participant in this conversation');
    return part;
  }
}
