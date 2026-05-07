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
import { NotificationsGateway } from './notifications.gateway';
// import { MailService } from '../mail/mail.service';

export interface CreateNotifPayload {
  recipientId: string;
  recipientEmail?: string;
  type: NotifType;
  category?: string;
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
    @Inject(forwardRef(() => NotificationsGateway))
    private readonly gateway: NotificationsGateway,
    // private readonly mail: MailService,
  ) {}

  normalize(notification: Notification) {
    const read = !!notification.isRead;
    return {
      id: notification.id,
      type: notification.type,
      category: notification.category ?? this.categoryFor(notification.type),
      title: notification.title,
      body: notification.body,
      refId: notification.refId,
      refType: notification.refType,
      isRead: read,
      read,
      createdAt: notification.createdAt,
    };
  }

  async notify(payload: CreateNotifPayload): Promise<void> {
    if (payload.refId) {
      const existing = await this.repo.findOne({
        where: {
          userId: payload.recipientId,
          type: payload.type,
          title: payload.title,
          body: payload.body,
          refId: payload.refId,
          refType: payload.refType,
        },
      });
      if (existing) return;
    }

    const saved = await this.repo.save(
      this.repo.create({
        userId: payload.recipientId,
        type: payload.type,
        category: payload.category ?? this.categoryFor(payload.type),
        title: payload.title,
        body: payload.body,
        refId: payload.refId,
        refType: payload.refType,
      }),
    );

    this.gateway.emitToUser(payload.recipientId, this.normalize(saved));
    this.sendEmailIfNeeded(payload);
  }

  async findAll(userId: string, unreadOnly: boolean) {
    const rows = await this.repo.find({
      where: { userId, ...(unreadOnly ? { isRead: false } : {}) },
      order: { createdAt: 'DESC' },
    });
    return rows.map((row) => this.normalize(row));
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

  private sendEmailIfNeeded(p: CreateNotifPayload): void {
    if (!p.recipientEmail) return;

    try {
      //   switch (p.type) {
      //     case NotifType.IV_SCHEDULED:
      //       return this.mail.sendInterviewScheduled({
      //         to: p.recipientEmail,
      //         candidateName: p.meta?.candidateName,
      //         jobTitle: p.meta?.jobTitle,
      //         company: p.meta?.company,
      //         scheduledAt: new Date(p.meta?.scheduledAt),
      //         durationMins: p.meta?.durationMins,
      //         format: p.meta?.format,
      //         meetLink: p.meta?.meetLink,
      //         notes: p.meta?.notes,
      //       });
      //     case NotifType.IV_RESCHEDULED:
      //       return this.mail.sendInterviewRescheduled({
      //         to: p.recipientEmail,
      //         candidateName: p.meta?.candidateName,
      //         jobTitle: p.meta?.jobTitle,
      //         company: p.meta?.company,
      //         scheduledAt: new Date(p.meta?.scheduledAt),
      //         meetLink: p.meta?.meetLink,
      //       });
      //     case NotifType.IV_CANCELLED:
      //       return this.mail.sendInterviewCancelled({
      //         to: p.recipientEmail,
      //         candidateName: p.meta?.candidateName,
      //         jobTitle: p.meta?.jobTitle,
      //         company: p.meta?.company,
      //         reason: p.meta?.reason,
      //       });
      //     case NotifType.IV_REMINDER:
      //       return this.mail.sendInterviewReminder({
      //         to: p.recipientEmail,
      //         candidateName: p.meta?.candidateName,
      //         jobTitle: p.meta?.jobTitle,
      //         company: p.meta?.company,
      //         scheduledAt: new Date(p.meta?.scheduledAt),
      //         meetLink: p.meta?.meetLink,
      //         reminderType: p.meta?.reminderType,
      //       });
      //     case NotifType.APP_STATUS:
      //       if (p.meta?.status === 'rejected') {
      //         return this.mail.sendApplicationRejected({
      //           to: p.recipientEmail,
      //           candidateName: p.meta?.candidateName,
      //           jobTitle: p.meta?.jobTitle,
      //           company: p.meta?.company,
      //           reason: p.meta?.reason,
      //         });
      //       }
      //       return this.mail.sendApplicationStatus({
      //         to: p.recipientEmail,
      //         candidateName: p.meta?.candidateName,
      //         jobTitle: p.meta?.jobTitle,
      //         company: p.meta?.company,
      //         status: p.meta?.status,
      //       });
      //     case NotifType.OFFER:
      //       return this.mail.sendOffer({
      //         to: p.recipientEmail,
      //         candidateName: p.meta?.candidateName,
      //         jobTitle: p.meta?.jobTitle,
      //         company: p.meta?.company,
      //       });
      //     default:
      //       return;
      // }
    } catch (err) {
      this.logger.error(
        `Email failed for ${p.type} to ${p.recipientEmail}`,
        err instanceof Error ? err.stack : `${err}`,
      );
    }
  }

  private categoryFor(type: NotifType): string {
    if (type.startsWith('interview_')) return 'interview';
    if (type.startsWith('application_') || type === NotifType.OFFER) {
      return 'application';
    }
    if (type === NotifType.JOB_ALERT) return 'job';
    return 'system';
  }
}
