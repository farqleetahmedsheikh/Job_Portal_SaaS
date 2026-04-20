import {
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotifType } from '../../common/enums/enums';
import { NotificationsGateway } from './notifications.gateway'; // ✅ new

export interface CreateNotifPayload {
  recipientId: string;
  recipientEmail: string;
  type: NotifType;
  title: string;
  body: string;
  refId?: string;
  refType?: string;
  meta?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
    // ✅ forwardRef avoids circular dependency
    @Inject(forwardRef(() => NotificationsGateway))
    private readonly gateway: NotificationsGateway,
  ) {}

  async notify(payload: CreateNotifPayload): Promise<void> {
    const saved = await this.repo.save(
      this.repo.create({
        userId: payload.recipientId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        refId: payload.refId,
        refType: payload.refType,
      }),
    );

    // ✅ Push real-time to the user if they're connected
    this.gateway.emitToUser(payload.recipientId, {
      id: saved.id,
      type: saved.type,
      title: saved.title,
      body: saved.body,
      refId: saved.refId,
      refType: saved.refType,
      read: false,
      createdAt: saved.createdAt,
    });
  }

  // rest of methods unchanged...
  findAll(userId: string, unreadOnly: boolean): Promise<Notification[]> {
    return this.repo.find({
      where: { userId, ...(unreadOnly ? { isRead: false } : {}) },
      order: { createdAt: 'DESC' },
    });
  }

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.repo.count({ where: { userId, isRead: false } });
    return { count };
  }

  async markRead(id: string, userId: string): Promise<void> {
    const notif = await this.repo.findOne({ where: { id, userId } });
    if (!notif) throw new NotFoundException('Notification not found');
    await this.repo.update(id, { isRead: true });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.repo.update({ userId, isRead: false }, { isRead: true });
  }

  async remove(id: string, userId: string): Promise<void> {
    const notif = await this.repo.findOne({ where: { id, userId } });
    if (!notif) throw new NotFoundException('Notification not found');
    await this.repo.delete(id);
  }

  // ── Email routing ──────────────────────────────────────────────────────────

  // private async sendEmailIfNeeded(p: CreateNotifPayload): Promise<void> {
  //   try {
  //     switch (p.type) {
  //       case NotifType.IV_SCHEDULED:
  //         return this.mail.sendInterviewScheduled({
  //           to: p.recipientEmail,
  //           candidateName: p.meta?.candidateName,
  //           jobTitle: p.meta?.jobTitle,
  //           company: p.meta?.company,
  //           scheduledAt: new Date(p.meta?.scheduledAt),
  //           durationMins: p.meta?.durationMins,
  //           format: p.meta?.format,
  //           meetLink: p.meta?.meetLink,
  //           notes: p.meta?.notes,
  //         });

  //       case NotifType.IV_RESCHEDULED:
  //         return this.mail.sendInterviewRescheduled({
  //           to: p.recipientEmail,
  //           candidateName: p.meta?.candidateName,
  //           jobTitle: p.meta?.jobTitle,
  //           company: p.meta?.company,
  //           scheduledAt: new Date(p.meta?.scheduledAt),
  //           meetLink: p.meta?.meetLink,
  //         });

  //       case NotifType.IV_CANCELLED:
  //         return this.mail.sendInterviewCancelled({
  //           to: p.recipientEmail,
  //           candidateName: p.meta?.candidateName,
  //           jobTitle: p.meta?.jobTitle,
  //           company: p.meta?.company,
  //           reason: p.meta?.reason,
  //         });

  //       case NotifType.APP_RECEIVED:
  //         return this.mail.sendApplicationReceived({
  //           to: p.recipientEmail,
  //           employerName: p.meta?.employerName,
  //           jobTitle: p.meta?.jobTitle,
  //           candidateName: p.meta?.candidateName,
  //         });

  //       case NotifType.APP_STATUS:
  //         return this.mail.sendApplicationStatus({
  //           to: p.recipientEmail,
  //           candidateName: p.meta?.candidateName,
  //           jobTitle: p.meta?.jobTitle,
  //           company: p.meta?.company,
  //           status: p.meta?.status,
  //         });

  //       case NotifType.OFFER:
  //         return this.mail.sendOffer({
  //           to: p.recipientEmail,
  //           candidateName: p.meta?.candidateName,
  //           jobTitle: p.meta?.jobTitle,
  //           company: p.meta?.company,
  //         });

  //       default:
  //         return;
  //     }
  //   } catch (err) {
  //     this.logger.error(
  //       `Email failed for ${p.type} → ${p.recipientEmail}`,
  //       err instanceof Error ? err.stack : err,
  //     );
  //   }
  // }
}
