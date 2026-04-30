/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Not, Repository } from 'typeorm';

import { MessageType, NotifType, UserRole } from '../../common/enums/enums';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateConversationDto } from './dto/conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ConversationParticipant } from './entities/conversation-participant.entity';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';

interface ConversationContext {
  applicationId: string | null;
  jobId: string | null;
  companyId: string | null;
  employerId: string;
  applicantId: string;
}

interface InboxQuery {
  search?: string;
  filter?: string;
}

interface MessageOptions {
  system?: boolean;
  messageType?: MessageType;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class MessagingService {
  constructor(
    @InjectRepository(Conversation)
    private readonly convRepo: Repository<Conversation>,
    @InjectRepository(ConversationParticipant)
    private readonly partRepo: Repository<ConversationParticipant>,
    @InjectRepository(Message)
    private readonly msgRepo: Repository<Message>,
    private readonly ds: DataSource,
    private readonly notifications: NotificationsService,
  ) {}

  async findOrCreate(
    userId: string,
    dto: CreateConversationDto,
    role?: string,
    options: MessageOptions = {},
  ) {
    const context = await this.resolveConversationContext(
      userId,
      dto.recipientId,
      role,
      dto.jobId,
    );

    const existing = await this.ds.query(
      `SELECT c.id
       FROM conversations c
       JOIN conversation_participants p1
         ON p1.conversation_id = c.id AND p1.user_id = $1
       JOIN conversation_participants p2
         ON p2.conversation_id = c.id AND p2.user_id = $2
       WHERE (
         ($3::uuid IS NOT NULL AND c.application_id = $3)
         OR ($4::uuid IS NOT NULL AND c.job_id = $4)
         OR ($3::uuid IS NULL AND $4::uuid IS NULL AND c.job_id IS NULL)
       )
       ORDER BY COALESCE(c.last_message_at, c.updated_at, c.created_at) DESC
       LIMIT 1`,
      [userId, dto.recipientId, context.applicationId, context.jobId],
    );

    if (existing.length) {
      await this.createInitialMessageIfPresent(
        existing[0].id,
        userId,
        dto.firstMessage,
        options,
      );
      return this.findOne(existing[0].id, userId);
    }

    const convId = await this.ds.transaction(async (m) => {
      const conv = m.create(Conversation, {
        jobId: context.jobId,
        companyId: context.companyId,
        applicationId: context.applicationId,
        employerId: context.employerId,
        applicantId: context.applicantId,
        lastMessageAt: null,
      });
      await m.save(Conversation, conv);

      await m.save(ConversationParticipant, [
        m.create(ConversationParticipant, { conversationId: conv.id, userId }),
        m.create(ConversationParticipant, {
          conversationId: conv.id,
          userId: dto.recipientId,
        }),
      ]);

      const text = this.normalizeBody(dto.firstMessage);
      if (text) {
        const saved = await m.save(
          Message,
          m.create(Message, {
            conversationId: conv.id,
            senderId: options.system ? null : userId,
            type: options.system
              ? (options.messageType ?? MessageType.SYSTEM)
              : MessageType.USER,
            text,
            metadata: options.metadata ?? null,
          }),
        );
        await m.update(Conversation, conv.id, {
          lastMessageAt: saved.createdAt,
        });
      }

      return conv.id;
    });

    return this.findOne(convId, userId);
  }

  async getInbox(userId: string, role?: string, query: InboxQuery = {}) {
    const showArchived = query.filter === 'archived';
    const archiveCondition = this.archiveCondition(role, showArchived);

    const rows = await this.ds.query(
      `SELECT
         c.id,
         c.job_id,
         c.company_id,
         c.application_id,
         c.employer_id,
         c.applicant_id,
         c.updated_at,
         c.last_message_at,
         c.archived_by_employer,
         c.archived_by_applicant,
         other_user.id         AS other_user_id,
         other_user.full_name  AS other_user_name,
         other_user.avatar_url AS other_user_avatar,
         other_user.role       AS other_user_role,
         last_msg.text         AS last_message,
         last_msg.type         AS last_message_type,
         last_msg.metadata     AS last_message_metadata,
         last_msg.created_at   AS last_message_at,
         last_msg.sender_id    AS last_message_sender_id,
         j.title               AS job_title,
         co.company_name       AS company_name,
         co.logo_url           AS company_logo_url,
         app.status            AS application_status,
         COUNT(unread.id)::int AS unread_count
       FROM conversations c
       JOIN conversation_participants me
            ON me.conversation_id = c.id AND me.user_id = $1
       JOIN conversation_participants other_part
            ON other_part.conversation_id = c.id AND other_part.user_id <> $1
       JOIN users other_user ON other_user.id = other_part.user_id
       LEFT JOIN LATERAL (
         SELECT text, type, metadata, created_at, sender_id
         FROM messages
         WHERE conversation_id = c.id AND is_deleted = FALSE
         ORDER BY created_at DESC LIMIT 1
       ) last_msg ON TRUE
       LEFT JOIN jobs j ON j.id = c.job_id
       LEFT JOIN companies co ON co.id = COALESCE(c.company_id, j.company_id)
       LEFT JOIN applications app ON app.id = c.application_id
       LEFT JOIN messages unread
            ON  unread.conversation_id = c.id
            AND (unread.sender_id IS NULL OR unread.sender_id <> $1)
            AND unread.is_deleted = FALSE
            AND unread.created_at > COALESCE(me.last_read_at, '1970-01-01')
       WHERE ${archiveCondition}
       GROUP BY
         c.id,
         other_user.id,
         last_msg.text,
         last_msg.type,
         last_msg.metadata,
         last_msg.created_at,
         last_msg.sender_id,
         j.title,
         co.company_name,
         co.logo_url,
         app.status
       ORDER BY COALESCE(c.last_message_at, last_msg.created_at, c.updated_at) DESC`,
      [userId],
    );

    return this.filterInboxRows(rows, query);
  }

  async markRead(convId: string, userId: string): Promise<void> {
    await this.participantOrFail(convId, userId);
    await this.partRepo.update(
      { conversationId: convId, userId },
      { lastReadAt: new Date() },
    );
  }

  async getMessages(convId: string, userId: string) {
    await this.participantOrFail(convId, userId);

    const messages = await this.msgRepo.find({
      where: { conversationId: convId, isDeleted: false },
      relations: ['sender'],
      order: { createdAt: 'ASC' },
    });

    await this.markRead(convId, userId);
    return messages;
  }

  async sendMessage(convId: string, userId: string, dto: SendMessageDto) {
    await this.participantOrFail(convId, userId);

    const text = this.normalizeBody(dto.text);
    if (!text) throw new BadRequestException('Message cannot be empty');

    const saved = await this.msgRepo.save(
      this.msgRepo.create({
        conversationId: convId,
        senderId: userId,
        type: MessageType.USER,
        text,
        metadata: null,
      }),
    );

    await this.convRepo.update(convId, { lastMessageAt: saved.createdAt });

    await this.notifyMessageRecipient(convId, userId, saved).catch(() => {
      /* notification failure should not block chat */
    });

    return (
      (await this.msgRepo.findOne({
        where: { id: saved.id },
        relations: ['sender'],
      })) ?? saved
    );
  }

  async archiveConversation(
    convId: string,
    userId: string,
    role?: string,
    archived = true,
  ): Promise<void> {
    await this.participantOrFail(convId, userId);

    if (role === UserRole.EMPLOYER) {
      await this.convRepo.update(convId, { archivedByEmployer: archived });
      return;
    }

    if (role === UserRole.APPLICANT) {
      await this.convRepo.update(convId, { archivedByApplicant: archived });
      return;
    }

    throw new ForbiddenException(
      'Only applicants and employers can archive conversations',
    );
  }

  async deleteMessage(msgId: string, userId: string) {
    const msg = await this.msgRepo.findOneBy({ id: msgId });
    if (!msg) throw new NotFoundException('Message not found');
    if (msg.senderId !== userId) {
      throw new ForbiddenException("Cannot delete others' messages");
    }
    await this.msgRepo.update(msgId, { isDeleted: true });
  }

  async getUnreadCount(userId: string): Promise<number> {
    const result = await this.ds.query(
      `SELECT COUNT(m.id)::int AS count
       FROM messages m
       JOIN conversation_participants cp
            ON cp.conversation_id = m.conversation_id AND cp.user_id = $1
       WHERE (m.sender_id IS NULL OR m.sender_id <> $1)
         AND m.is_deleted = FALSE
         AND m.created_at > COALESCE(cp.last_read_at, '1970-01-01')`,
      [userId],
    );
    return result[0]?.count ?? 0;
  }

  private async createInitialMessageIfPresent(
    convId: string,
    userId: string,
    rawText?: string,
    options: MessageOptions = {},
  ) {
    const text = this.normalizeBody(rawText);
    if (!text) return;

    if (!options.system) {
      await this.sendMessage(convId, userId, { text });
      return;
    }

    const saved = await this.msgRepo.save(
      this.msgRepo.create({
        conversationId: convId,
        senderId: null,
        type: options.messageType ?? MessageType.SYSTEM,
        text,
        metadata: options.metadata ?? null,
      }),
    );
    await this.convRepo.update(convId, { lastMessageAt: saved.createdAt });
  }

  private async resolveConversationContext(
    userId: string,
    recipientId: string,
    role?: string,
    jobId?: string,
  ): Promise<ConversationContext> {
    const isEmployerRole = role === 'employer';
    const isApplicantRole = role === 'applicant';

    if (!role || isEmployerRole) {
      const rows = await this.ds.query(
        `SELECT
           app.id AS application_id,
           app.job_id AS job_id,
           app.applicant_id AS applicant_id,
           j.company_id AS company_id,
           co.owner_id AS employer_id
         FROM applications app
         JOIN jobs j ON j.id = app.job_id
         JOIN companies co ON co.id = j.company_id
         WHERE co.owner_id = $1
           AND app.applicant_id = $2
           AND ($3::uuid IS NULL OR app.job_id = $3)
         ORDER BY app.applied_at DESC
         LIMIT 1`,
        [userId, recipientId, jobId ?? null],
      );
      if (rows.length) return this.contextFromRow(rows[0]);
    }

    if (isApplicantRole) {
      const rows = await this.ds.query(
        `SELECT
           app.id AS application_id,
           app.job_id AS job_id,
           app.applicant_id AS applicant_id,
           j.company_id AS company_id,
           co.owner_id AS employer_id
         FROM applications app
         JOIN jobs j ON j.id = app.job_id
         JOIN companies co ON co.id = j.company_id
         WHERE app.applicant_id = $1
           AND co.owner_id = $2
           AND ($3::uuid IS NULL OR app.job_id = $3)
         ORDER BY app.applied_at DESC
         LIMIT 1`,
        [userId, recipientId, jobId ?? null],
      );
      if (rows.length) return this.contextFromRow(rows[0]);
    }

    throw new ForbiddenException(
      'Messages can only start from an existing application, interview, or hiring relationship.',
    );
  }

  private contextFromRow(
    row: Record<string, string | null>,
  ): ConversationContext {
    if (!row.employer_id || !row.applicant_id) {
      throw new ForbiddenException('Conversation context is incomplete.');
    }

    return {
      applicationId: row.application_id ?? null,
      jobId: row.job_id ?? null,
      companyId: row.company_id ?? null,
      employerId: row.employer_id,
      applicantId: row.applicant_id,
    };
  }

  private filterInboxRows(
    rows: Array<Record<string, unknown>>,
    query: InboxQuery,
  ) {
    const search = query.search?.trim().toLowerCase();
    const filter = query.filter;

    return rows.filter((row) => {
      if (filter === 'unread' && Number(row.unread_count ?? 0) < 1) {
        return false;
      }
      if (
        filter === 'applicants' &&
        row.other_user_role !== UserRole.APPLICANT
      ) {
        return false;
      }
      if (filter === 'employers' && row.other_user_role !== UserRole.EMPLOYER) {
        return false;
      }
      if (!search) return true;

      return [
        this.asText(row.other_user_name),
        this.asText(row.company_name),
        this.asText(row.job_title),
        this.asText(row.last_message),
      ].some((value) => `${value ?? ''}`.toLowerCase().includes(search));
    });
  }

  private archiveCondition(role?: string, showArchived = false): string {
    if (role === UserRole.EMPLOYER) {
      return showArchived
        ? 'c.archived_by_employer = TRUE'
        : 'c.archived_by_employer = FALSE';
    }

    if (role === UserRole.APPLICANT) {
      return showArchived
        ? 'c.archived_by_applicant = TRUE'
        : 'c.archived_by_applicant = FALSE';
    }

    return 'TRUE';
  }

  private async notifyMessageRecipient(
    convId: string,
    senderId: string,
    message: Message,
  ): Promise<void> {
    const recipient = await this.partRepo.findOne({
      where: { conversationId: convId, userId: Not(senderId) },
      relations: ['user'],
    });
    if (!recipient?.user) return;

    const sender = await this.ds.query(
      `SELECT full_name FROM users WHERE id = $1 LIMIT 1`,
      [senderId],
    );
    const senderName = sender[0]?.full_name ?? 'HiringFly';

    await this.notifications.notify({
      recipientId: recipient.userId,
      recipientEmail: recipient.user.email,
      type: NotifType.MESSAGE,
      category: 'message',
      title: `New message from ${senderName}`,
      body: this.previewText(message.text),
      refId: message.id,
      refType: 'message',
      meta: { conversationId: convId },
    });
  }

  private normalizeBody(value?: string | null): string {
    return (value ?? '')
      .split(String.fromCharCode(0))
      .join('')
      .trim()
      .slice(0, 4000);
  }

  private asText(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }

  private previewText(value: string): string {
    return value.length > 140 ? `${value.slice(0, 137)}...` : value;
  }

  private async findOne(convId: string, userId: string) {
    await this.participantOrFail(convId, userId);
    return this.convRepo.findOne({
      where: { id: convId },
      relations: [
        'participants',
        'participants.user',
        'job',
        'company',
        'application',
      ],
    });
  }

  private async participantOrFail(convId: string, userId: string) {
    const part = await this.partRepo.findOneBy({
      conversationId: convId,
      userId,
    });
    if (!part) {
      throw new ForbiddenException('Not a participant in this conversation');
    }
    return part;
  }
}
