import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, MoreThan, Repository } from 'typeorm';
import {
  AppStatus,
  AutomationLogStatus,
  InterviewReminderType,
  InterviewStatus,
  MessageType,
  NotifType,
  SubscriptionPlan,
} from '../../common/enums/enums';
import { PLAN_LIMITS } from '../../config/plan-limits.config';
import { Application } from '../applications/entities/application.entity';
import { LimitsService } from '../billing/limits.service';
import { Company } from '../companies/entities/company.entity';
import { Interview } from '../interviews/entities/interview.entity';
import { MailService } from '../mail/mail.service';
import { MessagingService } from '../messages/messages.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UpdateAutomationSettingsDto } from './dto/update-automation-settings.dto';
import { QueryAutomationLogsDto } from './dto/query-automation-logs.dto';
import { AutomationLog } from './entities/automation-log.entity';
import { AutomationSetting } from './entities/automation-setting.entity';
import { InterviewReminderLog } from './entities/interview-reminder-log.entity';

const TERMINAL_STATUSES = new Set<AppStatus>([
  AppStatus.REJECTED,
  AppStatus.HIRED,
  AppStatus.WITHDRAWN,
]);

@Injectable()
export class AutomationService {
  constructor(
    @InjectRepository(AutomationSetting)
    private readonly settingsRepo: Repository<AutomationSetting>,
    @InjectRepository(AutomationLog)
    private readonly logRepo: Repository<AutomationLog>,
    @InjectRepository(InterviewReminderLog)
    private readonly reminderRepo: Repository<InterviewReminderLog>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    @InjectRepository(Application)
    private readonly appRepo: Repository<Application>,
    @InjectRepository(Interview)
    private readonly interviewRepo: Repository<Interview>,
    private readonly limits: LimitsService,
    private readonly notifications: NotificationsService,
    private readonly mail: MailService,
    private readonly messaging: MessagingService,
  ) {}

  async getSettings(userId: string) {
    const company = await this.companyOrFail(userId);
    const plan = await this.limits.getActivePlan(userId);
    const settings = await this.settingsForCompany(company.id);
    return {
      ...this.effectiveSettingsForPlan(settings, plan),
      plan,
      capabilities: this.capabilitiesFor(plan),
    };
  }

  async updateSettings(userId: string, dto: UpdateAutomationSettingsDto) {
    const company = await this.companyOrFail(userId);
    const plan = await this.limits.getActivePlan(userId);
    this.assertCanUpdateSettings(plan, dto);
    const settings = await this.settingsForCompany(company.id);
    Object.assign(settings, dto);
    const saved = await this.settingsRepo.save(settings);
    return {
      ...this.effectiveSettingsForPlan(saved, plan),
      plan,
      capabilities: this.capabilitiesFor(plan),
    };
  }

  async getLogs(userId: string, query: QueryAutomationLogsDto) {
    const company = await this.companyOrFail(userId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const qb = this.logRepo
      .createQueryBuilder('log')
      .where('log.company_id = :companyId', { companyId: company.id });
    if (query.trigger) {
      qb.andWhere('log.trigger = :trigger', { trigger: query.trigger });
    }
    if (query.action)
      qb.andWhere('log.action = :action', { action: query.action });
    if (query.status)
      qb.andWhere('log.status = :status', { status: query.status });

    const [data, total] = await qb
      .orderBy('log.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, meta: { page, limit, total } };
  }

  async handleApplicationCreated(applicationId: string): Promise<void> {
    const app = await this.loadApplication(applicationId);
    if (!app?.job?.company || !app.applicant) return;
    const plan = await this.limits.getActivePlan(app.job.company.ownerId);
    const settings = await this.settingsForCompany(app.job.company.id);
    const effective = this.effectiveSettingsForPlan(settings, plan);
    if (!effective.autoApplicationConfirmation) {
      await this.logSkipped(
        app,
        'application.created',
        'application_confirmation',
      );
      return;
    }
    await this.runApplicationAction(
      app,
      'application.created',
      'application_confirmation',
      `Your application for ${app.job.title ?? 'this role'} has been received by ${app.job.company.companyName}. You'll be notified when the company updates your status.`,
      async () => {
        await this.notifyCandidate(
          app,
          'Application received',
          `Your application for ${app.job?.title ?? 'this role'} has been received.`,
        );
        await this.mail.sendApplicationConfirmation({
          to: app.applicant!.email,
          candidateName: app.applicant!.fullName,
          jobTitle: app.job!.title ?? 'this role',
          company: app.job!.company!.companyName,
        });
      },
      MessageType.SYSTEM,
      { applicationId: app.id, status: app.status },
    );
  }

  async handleApplicationStatusChanged(
    applicationId: string,
    status: AppStatus,
  ): Promise<void> {
    const app = await this.loadApplication(applicationId);
    if (!app?.job?.company || !app.applicant) return;
    const message = this.applicationStatusMessage(app, status);
    if (!message) return;

    await this.runApplicationAction(
      app,
      'application.status_changed',
      `status_update_${status}`,
      message,
      undefined,
      MessageType.STATUS_UPDATE,
      { applicationId: app.id, status },
    );
  }

  async handleInterviewScheduled(interviewId: string): Promise<void> {
    const interview = await this.loadInterview(interviewId);
    if (!interview?.company || !interview.candidate) return;
    const plan = await this.limits.getActivePlan(interview.company.ownerId);
    const settings = await this.settingsForCompany(interview.companyId);
    const effective = this.effectiveSettingsForPlan(settings, plan);
    await this.runInterviewAction(
      interview,
      'interview.scheduled',
      'candidate_interview_message',
      `Your interview for ${interview.job?.title ?? 'the role'} has been scheduled. Check your interview details for the time and meeting link.`,
      MessageType.INTERVIEW_UPDATE,
    );
    if (!effective.autoInterviewReminders) {
      await this.logInterview(
        interview,
        'interview.scheduled',
        'reminders',
        AutomationLogStatus.SKIPPED,
        'Interview reminders disabled.',
      );
    }
  }

  async handleInterviewRescheduled(interviewId: string): Promise<void> {
    const interview = await this.loadInterview(interviewId);
    if (!interview?.company || !interview.candidate) return;
    await this.runInterviewAction(
      interview,
      'interview.rescheduled',
      'candidate_interview_message',
      `Your interview for ${interview.job?.title ?? 'the role'} has been rescheduled.`,
      MessageType.INTERVIEW_UPDATE,
    );
  }

  async handleInterviewCancelled(interviewId: string): Promise<void> {
    const interview = await this.loadInterview(interviewId);
    if (!interview?.company || !interview.candidate) return;
    await this.runInterviewAction(
      interview,
      'interview.cancelled',
      'candidate_interview_message',
      `Your interview for ${interview.job?.title ?? 'the role'} was cancelled.`,
      MessageType.INTERVIEW_UPDATE,
    );
  }

  async handleJobClosed(
    jobId: string,
    applicationIds: string[],
  ): Promise<void> {
    for (const applicationId of applicationIds) {
      const app = await this.loadApplication(applicationId);
      if (!app?.job?.company) continue;
      await this.runApplicationAction(
        app,
        'job.closed',
        'job_closed_candidate_message',
        `The job ${app.job.title ?? 'you applied for'} has closed, so your application is no longer active.`,
        undefined,
        MessageType.STATUS_UPDATE,
        { applicationId: app.id, status: app.status, jobId: app.jobId },
      );
    }
  }

  async processInterviewReminders(): Promise<void> {
    const now = new Date();
    const upcoming = await this.interviewRepo.find({
      where: {
        status: InterviewStatus.UPCOMING,
        scheduledAt: MoreThan(now),
      },
      relations: ['candidate', 'job', 'company'],
      take: 100,
      order: { scheduledAt: 'ASC' },
    });

    for (const interview of upcoming) {
      const minutesUntil =
        (interview.scheduledAt.getTime() - now.getTime()) / 60_000;
      if (minutesUntil <= 60) {
        await this.sendInterviewReminder(
          interview,
          InterviewReminderType.ONE_HOUR,
        );
      } else if (minutesUntil <= 24 * 60) {
        await this.sendInterviewReminder(
          interview,
          InterviewReminderType.TWENTY_FOUR_HOURS,
        );
      }
    }
  }

  async processFollowUps(): Promise<void> {
    const settings = await this.settingsRepo.find({
      where: { autoFollowUpAfterNoResponse: true },
      take: 100,
    });
    for (const setting of settings) {
      const company = await this.companyRepo.findOne({
        where: { id: setting.companyId },
      });
      if (!company) continue;
      const plan = await this.limits.getActivePlan(company.ownerId);
      if (plan === SubscriptionPlan.FREE) continue;
      const effective = this.effectiveSettingsForPlan(setting, plan);
      if (!effective.autoFollowUpAfterNoResponse) continue;
      const cutoff = new Date(
        Date.now() - effective.followUpDelayDays * 24 * 60 * 60 * 1000,
      );
      const apps = await this.appRepo.find({
        where: { job: { companyId: company.id } },
        relations: ['applicant', 'job', 'job.company'],
        take: 50,
      });
      for (const app of apps) {
        if (!app.updatedAt || app.updatedAt > cutoff) continue;
        if (TERMINAL_STATUSES.has(app.status!)) continue;
        const action = `employer_follow_up_${app.status}`;
        if (
          await this.hasSuccessfulLog({
            applicationId: app.id,
            trigger: 'follow_up.no_response',
            action,
          })
        ) {
          continue;
        }
        try {
          await this.notifications.notify({
            recipientId: company.ownerId,
            type: NotifType.SYSTEM,
            category: 'application',
            title: 'Candidate waiting for response',
            body: `${app.applicant?.fullName ?? 'A candidate'} has been waiting ${effective.followUpDelayDays} days for ${app.job?.title ?? 'this role'}.`,
            refId: app.id,
            refType: 'application',
          });
          await this.logApplication(
            app,
            'follow_up.no_response',
            action,
            AutomationLogStatus.SUCCESS,
            'Employer follow-up notification sent.',
          );
        } catch (err) {
          await this.logApplication(
            app,
            'follow_up.no_response',
            action,
            AutomationLogStatus.FAILED,
            'Employer follow-up failed.',
            err,
          );
        }
      }
    }
  }

  private async sendInterviewReminder(
    interview: Interview,
    reminderType: InterviewReminderType,
  ): Promise<void> {
    const existing = await this.reminderRepo.findOne({
      where: { interviewId: interview.id, reminderType },
    });
    if (existing?.status === AutomationLogStatus.SUCCESS) return;
    const company =
      interview.company ??
      (await this.companyRepo.findOne({ where: { id: interview.companyId } }));
    const plan = company
      ? await this.limits.getActivePlan(company.ownerId)
      : SubscriptionPlan.FREE;
    const settings = await this.settingsForCompany(interview.companyId);
    const effective = this.effectiveSettingsForPlan(settings, plan);
    if (!effective.autoInterviewReminders) {
      await this.logInterview(
        interview,
        'interview.reminder_due',
        reminderType,
        AutomationLogStatus.SKIPPED,
        'Interview reminders disabled.',
      );
      return;
    }
    if (!PLAN_LIMITS[plan].hasInterviewReminders) {
      await this.logInterview(
        interview,
        'interview.reminder_due',
        reminderType,
        AutomationLogStatus.SKIPPED,
        'Interview reminders require a paid plan.',
      );
      return;
    }

    try {
      await this.notifyInterviewCandidate(
        interview,
        reminderType === InterviewReminderType.ONE_HOUR
          ? 'Interview starts in 1 hour'
          : 'Interview reminder',
        reminderType === InterviewReminderType.ONE_HOUR
          ? `Your interview for ${interview.job?.title ?? 'the role'} starts in about 1 hour.`
          : `Your interview for ${interview.job?.title ?? 'the role'} is coming up in about 24 hours.`,
      );
      if (interview.candidate?.email) {
        await this.mail.sendInterviewReminder({
          to: interview.candidate.email,
          candidateName: interview.candidate.fullName,
          jobTitle: interview.job?.title ?? 'the role',
          company: interview.company?.companyName ?? 'the company',
          scheduledAt: interview.scheduledAt,
          meetLink: interview.meetLink ?? undefined,
          reminderType,
        });
      }
      await this.reminderRepo.save(
        this.reminderRepo.create({
          id: existing?.id,
          interviewId: interview.id,
          reminderType,
          status: AutomationLogStatus.SUCCESS,
          error: null,
        }),
      );
      await this.logInterview(
        interview,
        'interview.reminder_due',
        reminderType,
        AutomationLogStatus.SUCCESS,
        'Interview reminder sent.',
      );
    } catch (err) {
      await this.reminderRepo.save(
        this.reminderRepo.create({
          id: existing?.id,
          interviewId: interview.id,
          reminderType,
          status: AutomationLogStatus.FAILED,
          error: err instanceof Error ? err.message : `${err}`,
        }),
      );
      await this.logInterview(
        interview,
        'interview.reminder_due',
        reminderType,
        AutomationLogStatus.FAILED,
        'Interview reminder failed.',
        err,
      );
    }
  }

  private async runApplicationAction(
    app: Application,
    trigger: string,
    action: string,
    message: string,
    extra?: () => Promise<void>,
    messageType = MessageType.STATUS_UPDATE,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    if (
      await this.hasSuccessfulLog({
        applicationId: app.id,
        trigger,
        action,
      })
    ) {
      await this.logApplication(
        app,
        trigger,
        action,
        AutomationLogStatus.SKIPPED,
        'Automation already completed.',
      );
      return;
    }
    try {
      await this.messageCandidate(app, message, messageType, metadata);
      await extra?.();
      await this.logApplication(
        app,
        trigger,
        action,
        AutomationLogStatus.SUCCESS,
        message,
      );
    } catch (err) {
      await this.logApplication(
        app,
        trigger,
        action,
        AutomationLogStatus.FAILED,
        message,
        err,
      );
    }
  }

  private async runInterviewAction(
    interview: Interview,
    trigger: string,
    action: string,
    message: string,
    messageType = MessageType.INTERVIEW_UPDATE,
  ): Promise<void> {
    if (
      await this.hasSuccessfulLog({
        interviewId: interview.id,
        trigger,
        action,
      })
    ) {
      return;
    }
    try {
      await this.messageInterviewCandidate(interview, message, messageType);
      await this.logInterview(
        interview,
        trigger,
        action,
        AutomationLogStatus.SUCCESS,
        message,
      );
    } catch (err) {
      await this.logInterview(
        interview,
        trigger,
        action,
        AutomationLogStatus.FAILED,
        message,
        err,
      );
    }
  }

  private async settingsForCompany(
    companyId: string,
  ): Promise<AutomationSetting> {
    const existing = await this.settingsRepo.findOne({ where: { companyId } });
    if (existing) return existing;
    return this.settingsRepo.save(this.settingsRepo.create({ companyId }));
  }

  private async companyOrFail(userId: string): Promise<Company> {
    const company = await this.companyRepo.findOne({
      where: { ownerId: userId },
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  private capabilitiesFor(plan: SubscriptionPlan) {
    const limits = PLAN_LIMITS[plan];
    return {
      canUseBasicAutomation: true,
      canControlAutomation: plan !== SubscriptionPlan.FREE,
      canUseStatusMessageAutomation: plan !== SubscriptionPlan.FREE,
      canUseInterviewReminders: limits.hasInterviewReminders,
      canUseFollowUps: plan !== SubscriptionPlan.FREE,
      canControlFollowUpDelay:
        plan === SubscriptionPlan.GROWTH || plan === SubscriptionPlan.SCALE,
      canCustomizeCandidateMessages: limits.hasAutomation,
      canUseAdvancedRules: limits.hasAdvancedContractTemplates,
    };
  }

  private effectiveSettingsForPlan(
    settings: AutomationSetting,
    plan: SubscriptionPlan,
  ): AutomationSetting {
    if (plan !== SubscriptionPlan.FREE) {
      if (
        plan === SubscriptionPlan.STARTER &&
        settings.autoFollowUpAfterNoResponse &&
        settings.followUpDelayDays > 7
      ) {
        return {
          ...settings,
          followUpDelayDays: 3,
        };
      }
      return settings;
    }

    return {
      ...settings,
      autoApplicationConfirmation: true,
      autoShortlistMessage: false,
      autoRejectionMessage: false,
      autoInterviewReminders: false,
      autoFollowUpAfterNoResponse: false,
      followUpDelayDays: 3,
    };
  }

  private assertCanUpdateSettings(
    plan: SubscriptionPlan,
    dto: UpdateAutomationSettingsDto,
  ): void {
    const hasAnyChange = Object.values(dto).some(
      (value) => value !== undefined,
    );
    if (hasAnyChange && plan === SubscriptionPlan.FREE) {
      throw new ForbiddenException({
        code: 'UPGRADE_REQUIRED',
        feature: 'automation_control',
        requiredPlan: SubscriptionPlan.STARTER,
        message: 'Upgrade to Starter to control automation settings.',
      });
    }

    if (
      dto.followUpDelayDays !== undefined &&
      plan !== SubscriptionPlan.GROWTH &&
      plan !== SubscriptionPlan.SCALE
    ) {
      throw new ForbiddenException({
        code: 'UPGRADE_REQUIRED',
        feature: 'automation_follow_up_delay',
        requiredPlan: SubscriptionPlan.GROWTH,
        message: 'Upgrade to Growth to customize follow-up timing.',
      });
    }
  }

  private async loadApplication(applicationId: string) {
    return this.appRepo.findOne({
      where: { id: applicationId },
      relations: ['applicant', 'job', 'job.company'],
    });
  }

  private async loadInterview(interviewId: string) {
    return this.interviewRepo.findOne({
      where: { id: interviewId },
      relations: ['candidate', 'job', 'company'],
    });
  }

  private applicationStatusMessage(
    app: Application,
    status: AppStatus,
  ): string | null {
    const jobTitle = app.job?.title ?? 'this role';
    const companyName = app.job?.company?.companyName ?? 'the company';

    switch (status) {
      case AppStatus.REVIEWING:
        return `Your application for ${jobTitle} at ${companyName} is now under review.`;
      case AppStatus.SHORTLISTED:
        return `Good news. You have been shortlisted for ${jobTitle} at ${companyName}.`;
      case AppStatus.INTERVIEW:
        return `Your application for ${jobTitle} has moved to the interview stage.`;
      case AppStatus.OFFERED:
        return `${companyName} has moved your application for ${jobTitle} to the offer stage.`;
      case AppStatus.HIRED:
        return `Congratulations. ${companyName} has marked you as hired for ${jobTitle}.`;
      case AppStatus.REJECTED:
        return `Thank you for applying to ${jobTitle} at ${companyName}. The team has moved forward with another candidate.`;
      case AppStatus.WITHDRAWN:
        return `Your application for ${jobTitle} has been withdrawn.`;
      default:
        return `Your application for ${jobTitle} at ${companyName} was updated to ${status}.`;
    }
  }

  private async messageCandidate(
    app: Application,
    message: string,
    messageType = MessageType.STATUS_UPDATE,
    metadata?: Record<string, unknown>,
  ) {
    if (!app.job?.company?.ownerId || !app.applicantId) return;
    await this.messaging.findOrCreate(
      app.job.company.ownerId,
      {
        recipientId: app.applicantId,
        jobId: app.jobId,
        firstMessage: message,
      },
      undefined,
      {
        system: true,
        messageType,
        metadata: {
          applicationId: app.id,
          jobId: app.jobId,
          status: app.status,
          ...metadata,
        },
      },
    );
  }

  private async messageInterviewCandidate(
    interview: Interview,
    message: string,
    messageType = MessageType.INTERVIEW_UPDATE,
  ) {
    if (!interview.company?.ownerId || !interview.candidateId) return;
    await this.messaging.findOrCreate(
      interview.company.ownerId,
      {
        recipientId: interview.candidateId,
        jobId: interview.jobId,
        firstMessage: message,
      },
      undefined,
      {
        system: true,
        messageType,
        metadata: {
          interviewId: interview.id,
          jobId: interview.jobId,
          scheduledAt: interview.scheduledAt,
          status: interview.status,
        },
      },
    );
  }

  private async notifyCandidate(
    app: Application,
    title: string,
    body: string,
  ): Promise<void> {
    await this.notifications.notify({
      recipientId: app.applicantId,
      type: NotifType.APP_STATUS,
      category: 'application',
      title,
      body,
      refId: app.id,
      refType: 'application',
      meta: {
        candidateName: app.applicant?.fullName,
        jobTitle: app.job?.title,
        company: app.job?.company?.companyName,
        status: app.status,
      },
    });
  }

  private async notifyInterviewCandidate(
    interview: Interview,
    title: string,
    body: string,
  ): Promise<void> {
    await this.notifications.notify({
      recipientId: interview.candidateId,
      type: NotifType.IV_REMINDER,
      category: 'interview',
      title,
      body,
      refId: interview.id,
      refType: 'interview',
    });
  }

  private async hasSuccessfulLog(where: {
    applicationId?: string;
    interviewId?: string;
    trigger: string;
    action: string;
  }): Promise<boolean> {
    const logWhere: FindOptionsWhere<AutomationLog> = {
      trigger: where.trigger,
      action: where.action,
      status: AutomationLogStatus.SUCCESS,
    };
    if (where.applicationId) logWhere.applicationId = where.applicationId;
    if (where.interviewId) logWhere.interviewId = where.interviewId;
    const count = await this.logRepo.count({
      where: logWhere,
    });
    return count > 0;
  }

  private async logSkipped(app: Application, trigger: string, action: string) {
    await this.logApplication(
      app,
      trigger,
      action,
      AutomationLogStatus.SKIPPED,
      'Automation disabled in company settings.',
    );
  }

  private async logApplication(
    app: Application,
    trigger: string,
    action: string,
    status: AutomationLogStatus,
    message: string,
    error?: unknown,
  ) {
    const companyId = app.job?.companyId ?? app.job?.company?.id;
    if (!companyId) return;
    await this.logRepo.save(
      this.logRepo.create({
        companyId,
        applicationId: app.id,
        candidateId: app.applicantId,
        jobId: app.jobId,
        interviewId: null,
        trigger,
        action,
        status,
        message,
        error: this.formatError(error),
      }),
    );
  }

  private async logInterview(
    interview: Interview,
    trigger: string,
    action: string,
    status: AutomationLogStatus,
    message: string,
    error?: unknown,
  ) {
    await this.logRepo.save(
      this.logRepo.create({
        companyId: interview.companyId,
        applicationId: interview.applicationId,
        candidateId: interview.candidateId,
        jobId: interview.jobId,
        interviewId: interview.id,
        trigger,
        action,
        status,
        message,
        error: this.formatError(error),
      }),
    );
  }

  private formatError(error?: unknown): string | null {
    if (!error) return null;
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    if (typeof error === 'number' || typeof error === 'boolean') {
      return String(error);
    }
    return JSON.stringify(error) ?? 'Unknown automation error';
  }
}
