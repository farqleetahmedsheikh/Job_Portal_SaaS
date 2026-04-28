import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { Interview } from './entities/interview.entity';
import { Application } from '../applications/entities/application.entity';
import { Company } from '../companies/entities/company.entity';
import {
  AppStatus,
  InterviewStatus,
  NotifType,
} from '../../common/enums/enums';
import { InterviewPanelist } from './entities/interview-panelist.entity';
import { ScheduleInterviewDto } from './dto/schedule-interview.dto';
import { RescheduleInterviewDto } from './dto/reschedule-interview.dto';
import { CompleteInterviewDto } from './dto/complete-interview.dto';
import { CancelInterviewDto } from './dto/cancel-interview.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { LimitsService } from '../billing/limits.service';

@Injectable()
export class InterviewsService {
  constructor(
    // ✅ Entity classes — not strings
    @InjectRepository(Interview) private readonly ivRepo: Repository<Interview>,
    @InjectRepository(InterviewPanelist)
    private readonly panelistRepo: Repository<InterviewPanelist>,
    @InjectRepository(Application)
    private readonly appRepo: Repository<Application>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    private readonly ds: DataSource,
    private readonly notifications: NotificationsService,
    private readonly limits: LimitsService,
  ) {}

  // ── Employer: Schedule ──────────────────────────────────────────────────────
  async schedule(userId: string, dto: ScheduleInterviewDto) {
    const app = await this.appRepo.findOne({
      where: { id: dto.applicationId },
      relations: ['job', 'job.company', 'applicant'],
    });
    if (!app) throw new NotFoundException('Application not found');
    if (app.job?.company?.ownerId !== userId)
      throw new ForbiddenException('Access denied');
    await this.limits.assertCanScheduleInterview(userId);
    if (
      [AppStatus.REJECTED, AppStatus.HIRED, AppStatus.WITHDRAWN].includes(
        app.status!,
      )
    ) {
      throw new BadRequestException(
        `Cannot schedule interviews for ${app.status} applications`,
      );
    }

    const interview = await this.ds.transaction(async (m) => {
      const iv = m.create(Interview, {
        applicationId: dto.applicationId,
        scheduledById: userId,
        jobId: app.jobId,
        candidateId: app.applicantId,
        companyId: app.job?.companyId,
        scheduledAt: new Date(dto.scheduledAt),
        durationMins: dto.durationMins,
        type: dto.type,
        roundType: dto.roundType, // ← was missing from original
        meetLink: dto.meetLink,
        notes: dto.notes,
        status: InterviewStatus.UPCOMING,
      });
      await m.save(Interview, iv);

      if (dto.panelists?.length) {
        const panelists = dto.panelists.map((p) =>
          m.create(InterviewPanelist, {
            interviewId: iv.id,
            userId: p.userId ?? '',
            name: p.name ?? '',
          }),
        );
        await m.save(InterviewPanelist, panelists);
      }

      // ← use the transaction manager, not the outer ivRepo
      return m.findOne(Interview, {
        where: { id: iv.id },
        relations: [
          'job',
          'job.company',
          'candidate',
          'candidate.applicantProfile',
          'panelists',
          'panelists.user',
        ],
      });
    });

    if (interview && app.applicant?.email) {
      await this.notifications.notify({
        recipientId: app.applicantId,
        recipientEmail: app.applicant.email,
        type: NotifType.IV_SCHEDULED,
        category: 'interview',
        title: 'Interview scheduled',
        body: `Your interview for ${app.job?.title ?? 'the role'} has been scheduled.`,
        refId: interview.id,
        refType: 'interview',
        meta: {
          candidateName: app.applicant.fullName,
          jobTitle: app.job?.title,
          company: app.job?.company?.companyName,
          scheduledAt: dto.scheduledAt,
          durationMins: dto.durationMins,
          format: dto.type,
          meetLink: dto.meetLink,
          notes: dto.notes,
        },
      });
    }

    return interview;
  }

  // ── Employer: Reschedule ────────────────────────────────────────────────────
  async reschedule(ivId: string, userId: string, dto: RescheduleInterviewDto) {
    const iv = await this.ownedOrFail(ivId, userId);
    if (iv.status !== InterviewStatus.UPCOMING)
      throw new BadRequestException(
        'Only upcoming interviews can be rescheduled',
      );

    iv.scheduledAt = new Date(dto.scheduledAt);
    if (dto.durationMins) iv.durationMins = dto.durationMins;
    if (dto.meetLink) iv.meetLink = dto.meetLink;

    const saved = await this.ivRepo.save(iv);
    const loaded = await this.ivRepo.findOne({
      where: { id: ivId },
      relations: ['candidate', 'job', 'job.company'],
    });
    if (loaded?.candidate?.email) {
      await this.notifications.notify({
        recipientId: loaded.candidateId,
        recipientEmail: loaded.candidate.email,
        type: NotifType.IV_RESCHEDULED,
        category: 'interview',
        title: 'Interview rescheduled',
        body: `Your interview for ${loaded.job?.title ?? 'the role'} has moved to ${loaded.scheduledAt.toISOString()}.`,
        refId: loaded.id,
        refType: 'interview',
        meta: {
          candidateName: loaded.candidate.fullName,
          jobTitle: loaded.job?.title,
          company: loaded.job?.company?.companyName,
          scheduledAt: loaded.scheduledAt,
          meetLink: loaded.meetLink,
        },
      });
    }
    return saved;
  }

  // ── Employer: Complete + feedback ───────────────────────────────────────────
  async complete(ivId: string, userId: string, dto: CompleteInterviewDto) {
    const iv = await this.ownedOrFail(ivId, userId);
    iv.status = InterviewStatus.COMPLETED;
    iv.feedback = dto.feedback ?? iv.feedback;
    iv.rating = dto.rating ?? iv.rating;
    return this.ivRepo.save(iv);
  }

  // ── Employer: Cancel ────────────────────────────────────────────────────────
  async cancel(ivId: string, userId: string, dto: CancelInterviewDto) {
    const iv = await this.ownedOrFail(ivId, userId);
    if (iv.status === InterviewStatus.COMPLETED)
      throw new BadRequestException('Cannot cancel a completed interview');

    iv.status = InterviewStatus.CANCELLED;
    iv.cancelledAt = new Date();
    iv.cancelledReason = dto.reason ?? null;
    const saved = await this.ivRepo.save(iv);
    const loaded = await this.ivRepo.findOne({
      where: { id: ivId },
      relations: ['candidate', 'job', 'job.company'],
    });
    if (loaded?.candidate?.email) {
      await this.notifications.notify({
        recipientId: loaded.candidateId,
        recipientEmail: loaded.candidate.email,
        type: NotifType.IV_CANCELLED,
        category: 'interview',
        title: 'Interview cancelled',
        body: `Your interview for ${loaded.job?.title ?? 'the role'} was cancelled.`,
        refId: loaded.id,
        refType: 'interview',
        meta: {
          candidateName: loaded.candidate.fullName,
          jobTitle: loaded.job?.title,
          company: loaded.job?.company?.companyName,
          reason: dto.reason,
        },
      });
    }
    return saved;
  }

  // ── Employer: All interviews for company ────────────────────────────────────
  async findForEmployer(userId: string, status?: InterviewStatus) {
    const company = await this.companyRepo.findOneBy({ ownerId: userId });
    if (!company) return [];

    const qb = this.ivRepo
      .createQueryBuilder('iv')
      .innerJoinAndSelect('iv.candidate', 'u')
      .leftJoinAndSelect('u.applicantProfile', 'ap')
      .innerJoinAndSelect('iv.job', 'j')
      .leftJoinAndSelect('iv.panelists', 'p')
      .where('iv.company_id = :cid', { cid: company.id });

    if (status) qb.andWhere('iv.status = :status', { status });

    return qb.orderBy('iv.scheduled_at', 'ASC').getMany();
  }

  // ── Applicant: My interviews ─────────────────────────────────────────────────
  async findForApplicant(userId: string, status?: InterviewStatus) {
    const qb = this.ivRepo
      .createQueryBuilder('iv')
      .innerJoinAndSelect('iv.job', 'j')
      .innerJoinAndSelect('j.company', 'c')
      .leftJoinAndSelect('iv.panelists', 'p')
      .where('iv.candidate_id = :uid', { uid: userId });

    if (status) qb.andWhere('iv.status = :status', { status });

    return qb.orderBy('iv.scheduled_at', 'ASC').getMany();
  }

  // ── Shared: Single ───────────────────────────────────────────────────────────
  async findOne(ivId: string) {
    const iv = await this.ivRepo.findOne({
      where: { id: ivId },
      relations: [
        'job',
        'job.company',
        'candidate',
        'candidate.applicantProfile',
        'panelists',
        'panelists.user',
      ],
    });
    console.log('Finding interview with ID:', ivId); // Debug log to verify incoming ID
    console.log('Found interview:', iv); // Debug log to verify found interview
    if (!iv) throw new NotFoundException('Interview not found');
    return iv;
  }

  // ── Private ──────────────────────────────────────────────────────────────────
  private async ownedOrFail(ivId: string, userId: string): Promise<Interview> {
    const iv = await this.ivRepo.findOne({
      where: { id: ivId },
      relations: ['job', 'job.company'],
    });
    if (!iv) throw new NotFoundException('Interview not found');
    if (iv.job?.company?.ownerId !== userId)
      throw new ForbiddenException('Access denied');
    return iv;
  }
}
