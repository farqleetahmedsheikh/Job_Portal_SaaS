/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotifType } from '../../common/enums/enums';

import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private repo: Repository<Notification>,
  ) {}

  // Called internally by other services when events happen
  async create(payload: {
    userId: string;
    type: NotifType;
    title: string;
    body?: string;
    refId?: string;
    refType?: string;
  }) {
    const notif = this.repo.create(payload as any);
    return this.repo.save(notif);
  }

  async findAll(userId: string, onlyUnread?: boolean) {
    const where: any = { userId };
    if (onlyUnread) where.isRead = false;
    return this.repo.find({
      where,
      order: { createdAt: 'DESC' } as any,
      take: 50,
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.repo.count({ where: { userId, isRead: false } as any });
  }

  async markRead(notifId: string, userId: string) {
    const notif = await this.repo.findOneBy({ id: notifId, userId } as any);
    if (!notif) throw new NotFoundException('Notification not found');
    await this.repo.update(notifId, { isRead: true } as any);
  }

  async markAllRead(userId: string) {
    await this.repo.update({ userId } as any, { isRead: true } as any);
  }

  async remove(notifId: string, userId: string) {
    await this.repo.delete({ id: notifId, userId } as any);
  }
}
