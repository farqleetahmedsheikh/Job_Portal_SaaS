import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';

import { Application } from './entities/application.entity';
import { Job } from '../jobs/entities/job.entity';
import { ApplicationStatusHistory } from './entities/application-status-history.entity';
import { CreateApplicationDto } from './dto/create-application.dto';
import { AppStatus, JobStatus, NotifType } from 'src/common/enums/enums';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { BulkStatusUpdateDto } from './dto/bulk-status-update.dto';
import { UpdateEmployerNotesDto } from './dto/update-employer-notes.dto';
import { NotificationsService } from '../notifications/notifications.service';
import {
  assertApplicationStatusTransition,
  TERMINAL_APPLICATION_STATUSES,
} from './application-status.transitions';
import { LimitsService } from '../billing/limits.service'; // ← new

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private readonly appRepo: Repository<Application>,
    @InjectRepository(ApplicationStatusHistory)
    private readonly historyRepo: Repository<ApplicationStatusHistory>,
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
    private readonly ds: DataSource,
    private readonly limitsService: LimitsService, // ← new
    private readonly notifications: NotificationsService,
  ) {}

  // ── Applicant: Apply ────────────────────────────────────────────────────────
  async apply(applicantId: string, dto: CreateApplicationDto) {
    const job = await this.jobRepo.findOneBy({ id: dto.jobId });
    if (!job) throw new NotFoundException('Job not found');

    // ── Status / expiry guards ─────────────────────────────────────────────
    if (job.status !== JobStatus.ACTIVE) {
      throw new BadRequestException(
        `This job is no longer accepting applications (status: ${job.status})`,
      );
    }

    const now = new Date();
    // const today = new Date(now.toISOString().split('T')[0]);

    if (job.deadline) {
      const deadline = new Date(job.deadline);
      deadline.setHours(23, 59, 59, 999);
      if (now > deadline) {
        throw new BadRequestException(
          'The application deadline for this job has passed',
        );
      }
    }

    if (job.expiresAt && now > new Date(job.expiresAt)) {
      throw new BadRequestException('This job listing has expired');
    }

    // ── Billing / rate-limit guards ────────────────────────────────────────
    await this.limitsService.checkAndIncrementApplyLimit(applicantId); // ← new: 20/day cap
    await this.limitsService.checkJobAcceptsApplications(dto.jobId); // ← new: applicant cap
    // ──────────────────────────────────────────────────────────────────────

    const existing = await this.appRepo.findOneBy({
      jobId: dto.jobId,
      applicantId,
    });
    if (existing) throw new ConflictException('Already applied to this job');

    return this.ds.transaction(async (m) => {
      const app = m.create(Application, {
        ...dto,
        applicantId,
        status: AppStatus.NEW,
      });
      await m.save(Application, app);

      await m.save(
        ApplicationStatusHistory,
        m.create(ApplicationStatusHistory, {
          applicationId: app.id,
          changedById: applicantId,
          fromStatus: null,
          toStatus: AppStatus.NEW,
        }),
      );

      // ← new: increment job counter — auto-closes job if cap hit
      await this.limitsService.incrementApplicantCount(dto.jobId);

      return app;
    });
  }

  // ── Applicant: My applications ──────────────────────────────────────────────
  async getMyApplications(applicantId: string) {
    return this.appRepo.find({
      where: { applicantId },
      relations: ['job', 'job.company', 'resume'],
      order: { appliedAt: 'DESC' },
    });
  }

  // ── Applicant: Withdraw ─────────────────────────────────────────────────────
  async withdraw(appId: string, applicantId: string) {
    const app = await this.appOrFail(appId);
    if (app.applicantId !== applicantId) throw new ForbiddenException();
    assertApplicationStatusTransition(app.status!, AppStatus.WITHDRAWN);

    return this.ds.transaction(async (m) => {
      const fromStatus = app.status;
      app.status = AppStatus.WITHDRAWN;
      await m.save(Application, app);
      await m.save(
        ApplicationStatusHistory,
        m.create(ApplicationStatusHistory, {
          applicationId: appId,
          changedById: applicantId,
          fromStatus,
          toStatus: AppStatus.WITHDRAWN,
          note: 'Withdrawn by applicant',
        }),
      );
      return app;
    });
  }

  // ── Employer: Move through pipeline ─────────────────────────────────────────
  async changeStatus(
    appId: string,
    userId: string,
    dto: UpdateApplicationStatusDto,
  ) {
    const app = await this.verifyEmployerOwnsApp(appId, userId); // ✅ was appOrFail
    assertApplicationStatusTransition(app.status!, dto.status);

    const changedApps = await this.ds.transaction(async (m) => {
      const fromStatus = app.status;
      app.status = dto.status;
      await m.save(Application, app);
      await m.save(
        ApplicationStatusHistory,
        m.create(ApplicationStatusHistory, {
          applicationId: appId,
          changedById: userId,
          fromStatus,
          toStatus: dto.status,
          note: dto.note,
        }),
      );
      const changed = [{ app, toStatus: dto.status }];

      if (dto.status === AppStatus.HIRED) {
        const otherApps = await m.find(Application, {
          where: { jobId: app.jobId },
          relations: ['applicant', 'job', 'job.company'],
        });

        for (const other of otherApps) {
          if (
            other.id === app.id ||
            TERMINAL_APPLICATION_STATUSES.has(other.status!)
          ) {
            continue;
          }

          const otherFromStatus = other.status;
          other.status = AppStatus.REJECTED;
          await m.save(Application, other);
          await m.save(
            ApplicationStatusHistory,
            m.create(ApplicationStatusHistory, {
              applicationId: other.id,
              changedById: userId,
              fromStatus: otherFromStatus,
              toStatus: AppStatus.REJECTED,
              note:
                dto.note ??
                'Automatically rejected because another candidate was hired',
            }),
          );
          changed.push({ app: other, toStatus: AppStatus.REJECTED });
        }
      }

      return changed;
    });

    for (const changed of changedApps) {
      await this.notifyApplicationStatus(
        changed.app,
        changed.toStatus,
        dto.note,
      );
    }

    return changedApps[0].app;
  }

  // ── Employer: Applications for one job ─────────────────────────────────────
  async findByJob(
    jobId: string,
    employerId: string, // ← new param
    opts: { sort?: 'recent' | 'match' } = {},
  ) {
    // Enforce viewable limit for this employer's plan
    const viewLimit =
      await this.limitsService.getViewableApplicantLimit(employerId); // ← new

    const qb = this.appRepo
      .createQueryBuilder('app')
      .leftJoinAndSelect('app.applicant', 'u')
      .leftJoinAndSelect('u.applicantProfile', 'p')
      .leftJoinAndSelect('app.job', 'job')
      .leftJoinAndSelect('app.resume', 'resume')
      .where('app.jobId = :jobId', { jobId });

    if (opts.sort === 'match') qb.orderBy('app.matchScore', 'DESC');
    else qb.orderBy('app.appliedAt', 'DESC');

    qb.take(viewLimit); // ← new

    return qb.getMany();
  }

  // ── Employer: All applications across all jobs ──────────────────────────────
  async findAllByEmployer(
    employerId: string,
    opts: { sort?: 'recent' | 'match' } = {},
  ) {
    const viewLimit =
      await this.limitsService.getViewableApplicantLimit(employerId); // ← new

    const qb = this.appRepo
      .createQueryBuilder('app')
      .leftJoinAndSelect('app.applicant', 'u')
      .leftJoinAndSelect('u.applicantProfile', 'p')
      .leftJoinAndSelect('app.job', 'job')
      .leftJoinAndSelect('app.resume', 'resume')
      .where('job.postedById = :employerId', { employerId });

    if (opts.sort === 'match') qb.orderBy('app.matchScore', 'DESC');
    else qb.orderBy('app.appliedAt', 'DESC');

    qb.take(viewLimit); // ← new

    return qb.getMany();
  }

  // ── Employer: Bulk status update ────────────────────────────────────────────
  async bulkChangeStatus(userId: string, dto: BulkStatusUpdateDto) {
    if (!dto.applicationIds?.length) return;

    const apps = await this.appRepo.findBy({ id: In(dto.applicationIds) });

    return this.ds.transaction(async (m) => {
      for (const app of apps) {
        const owned = await this.verifyEmployerOwnsApp(app.id, userId);
        assertApplicationStatusTransition(owned.status!, dto.status);
        const fromStatus = app.status;
        app.status = dto.status;
        await m.save(Application, app);

        await m.save(
          ApplicationStatusHistory,
          m.create(ApplicationStatusHistory, {
            applicationId: app.id,
            changedById: userId,
            fromStatus,
            toStatus: dto.status,
            note: dto.note,
          }),
        );
      }
    });
  }

  // ── Employer: Toggle star ───────────────────────────────────────────────────
  async toggleStar(appId: string, employerId: string) {
    // ✅ add employerId param
    const app = await this.verifyEmployerOwnsApp(appId, employerId);
    app.isStarred = !app.isStarred;
    return this.appRepo.save(app);
  }

  // ── Employer: Internal notes ────────────────────────────────────────────────
  async updateNotes(
    appId: string,
    employerId: string,
    dto: UpdateEmployerNotesDto,
  ) {
    // ✅
    const app = await this.verifyEmployerOwnsApp(appId, employerId);
    app.employerNotes = dto.notes;
    return this.appRepo.save(app);
  }

  // ── Employer: Mark viewed ───────────────────────────────────────────────────
  async markViewed(appId: string) {
    await this.appRepo.update(appId, { viewedByEmployerAt: new Date() });
  }

  // ── Shared: Full detail ─────────────────────────────────────────────────────
  async findOne(appId: string) {
    const app = await this.appRepo.findOne({
      where: { id: appId },
      relations: [
        'job',
        'job.company',
        'applicant',
        'applicant.applicantProfile',
        'resume',
        'statusHistory',
        'statusHistory.changedBy',
      ],
    });
    if (!app) throw new NotFoundException('Application not found');
    return app;
  }

  async hasApplied(applicantId: string, jobId: string): Promise<boolean> {
    const row = await this.appRepo.findOneBy({ applicantId, jobId });
    return !!row;
  }

  // ── Private ─────────────────────────────────────────────────────────────────
  private async appOrFail(appId: string): Promise<Application> {
    const app = await this.appRepo.findOneBy({ id: appId });
    if (!app) throw new NotFoundException('Application not found');
    return app;
  }

  private async verifyEmployerOwnsApp(
    appId: string,
    employerId: string,
  ): Promise<Application> {
    const app = await this.appRepo.findOne({
      where: { id: appId },
      relations: ['job', 'job.company'],
    });
    if (!app) throw new NotFoundException('Application not found');
    if (app.job?.company?.ownerId !== employerId) {
      throw new ForbiddenException(
        'You do not have access to this application',
      );
    }
    return app;
  }

  private async notifyApplicationStatus(
    app: Application,
    status: AppStatus,
    note?: string,
  ) {
    const loaded =
      app.applicant && app.job?.company
        ? app
        : await this.appRepo.findOne({
            where: { id: app.id },
            relations: ['applicant', 'job', 'job.company'],
          });

    if (!loaded?.applicant?.email) return;

    const isRejected = status === AppStatus.REJECTED;
    await this.notifications.notify({
      recipientId: loaded.applicantId,
      recipientEmail: loaded.applicant.email,
      type:
        status === AppStatus.OFFERED ? NotifType.OFFER : NotifType.APP_STATUS,
      category: 'application',
      title: isRejected ? 'Application update' : 'Application status updated',
      body: isRejected
        ? `The hiring team has moved forward with another candidate for ${loaded.job?.title ?? 'this role'}.`
        : `Your application for ${loaded.job?.title ?? 'this role'} is now ${status}.`,
      refId: loaded.id,
      refType: 'application',
      meta: {
        candidateName: loaded.applicant.fullName,
        jobTitle: loaded.job?.title,
        company: loaded.job?.company?.companyName,
        status,
        reason: note,
      },
    });
  }
}
