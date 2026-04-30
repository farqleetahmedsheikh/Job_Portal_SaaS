import { ForbiddenException } from '@nestjs/common';
import {
  AppStatus,
  AutomationLogStatus,
  InterviewStatus,
  MessageType,
  SubscriptionPlan,
} from '../../common/enums/enums';
import { AutomationService } from './automation.service';

function repo(overrides: Record<string, unknown> = {}) {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    create: jest.fn((value: unknown): unknown => value),
    save: jest.fn((value: unknown): Promise<unknown> => Promise.resolve(value)),
    createQueryBuilder: jest.fn(),
    ...overrides,
  };
}

describe('AutomationService', () => {
  const settingsRepo = repo();
  const logRepo = repo({ count: jest.fn().mockResolvedValue(0) });
  const reminderRepo = repo();
  const companyRepo = repo();
  const appRepo = repo();
  const interviewRepo = repo();
  const limits = {
    getActivePlan: jest.fn(),
  };
  const notifications = {
    notify: jest.fn(),
  };
  const mail = {
    sendApplicationConfirmation: jest.fn(),
    sendInterviewReminder: jest.fn(),
  };
  const messaging = {
    findOrCreate: jest.fn(),
  };

  function service() {
    return new AutomationService(
      settingsRepo as never,
      logRepo as never,
      reminderRepo as never,
      companyRepo as never,
      appRepo as never,
      interviewRepo as never,
      limits as never,
      notifications as never,
      mail as never,
      messaging as never,
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
    settingsRepo.create.mockImplementation((value: unknown) => value);
    settingsRepo.save.mockImplementation((value: unknown) =>
      Promise.resolve({ id: 'settings-1', ...value }),
    );
    logRepo.create.mockImplementation((value: unknown) => value);
    logRepo.save.mockResolvedValue({});
    logRepo.count.mockResolvedValue(0);
    limits.getActivePlan.mockResolvedValue(SubscriptionPlan.FREE);
  });

  it('creates default settings for a company', async () => {
    companyRepo.findOne.mockResolvedValue({
      id: 'company-1',
      ownerId: 'user-1',
    });
    settingsRepo.findOne.mockResolvedValue(null);

    const result = await service().getSettings('user-1');

    expect(settingsRepo.save).toHaveBeenCalledWith({ companyId: 'company-1' });
    expect(result.plan).toBe(SubscriptionPlan.FREE);
    expect(result.capabilities.canUseBasicAutomation).toBe(true);
    expect(result.capabilities.canControlAutomation).toBe(false);
  });

  it('forces free automation settings to basic non-configurable defaults', async () => {
    companyRepo.findOne.mockResolvedValue({
      id: 'company-1',
      ownerId: 'user-1',
    });
    settingsRepo.findOne.mockResolvedValue({
      id: 'settings-1',
      companyId: 'company-1',
      autoApplicationConfirmation: false,
      autoShortlistMessage: true,
      autoRejectionMessage: true,
      autoInterviewReminders: true,
      autoFollowUpAfterNoResponse: true,
      followUpDelayDays: 10,
    });

    const result = await service().getSettings('user-1');

    expect(result.autoApplicationConfirmation).toBe(true);
    expect(result.autoShortlistMessage).toBe(false);
    expect(result.autoRejectionMessage).toBe(false);
    expect(result.autoInterviewReminders).toBe(false);
    expect(result.autoFollowUpAfterNoResponse).toBe(false);
    expect(result.followUpDelayDays).toBe(3);
  });

  it('plan-gates free users from changing any automation setting', async () => {
    companyRepo.findOne.mockResolvedValue({
      id: 'company-1',
      ownerId: 'user-1',
    });
    limits.getActivePlan.mockResolvedValue(SubscriptionPlan.FREE);

    try {
      await service().updateSettings('user-1', {
        autoApplicationConfirmation: true,
      });
      throw new Error('Expected updateSettings to reject');
    } catch (err) {
      expect(err).toBeInstanceOf(ForbiddenException);
      expect((err as ForbiddenException).getResponse()).toMatchObject({
        code: 'UPGRADE_REQUIRED',
        feature: 'automation_control',
        requiredPlan: SubscriptionPlan.STARTER,
      });
    }
  });

  it('sends application confirmation automation once', async () => {
    settingsRepo.findOne.mockResolvedValue({
      companyId: 'company-1',
      autoApplicationConfirmation: true,
    });
    appRepo.findOne.mockResolvedValue({
      id: 'app-1',
      applicantId: 'candidate-1',
      jobId: 'job-1',
      status: AppStatus.NEW,
      applicant: {
        id: 'candidate-1',
        email: 'candidate@example.com',
        fullName: 'Aisha Khan',
      },
      job: {
        id: 'job-1',
        companyId: 'company-1',
        title: 'Frontend Engineer',
        company: {
          id: 'company-1',
          ownerId: 'employer-1',
          companyName: 'HiringFly',
        },
      },
    });

    await service().handleApplicationCreated('app-1');

    expect(messaging.findOrCreate).toHaveBeenCalled();
    const firstMessageCall = messaging.findOrCreate.mock.calls[0] as [
      string,
      { recipientId: string; jobId: string; firstMessage: string },
    ];
    expect(firstMessageCall[0]).toBe('employer-1');
    expect(firstMessageCall[1].recipientId).toBe('candidate-1');
    expect(firstMessageCall[1].jobId).toBe('job-1');
    expect(firstMessageCall[1].firstMessage).toContain('Frontend Engineer');
    expect(notifications.notify).toHaveBeenCalled();
    expect(mail.sendApplicationConfirmation).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'candidate@example.com' }),
    );
    expect(logRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: AutomationLogStatus.SUCCESS }),
    );
  });

  it('adds basic status system updates on free plans', async () => {
    settingsRepo.findOne.mockResolvedValue({
      companyId: 'company-1',
      autoShortlistMessage: true,
      autoRejectionMessage: true,
    });
    appRepo.findOne.mockResolvedValue({
      id: 'app-1',
      applicantId: 'candidate-1',
      jobId: 'job-1',
      applicant: {
        id: 'candidate-1',
        email: 'candidate@example.com',
        fullName: 'Aisha Khan',
      },
      job: {
        id: 'job-1',
        companyId: 'company-1',
        title: 'Frontend Engineer',
        company: {
          id: 'company-1',
          ownerId: 'employer-1',
          companyName: 'HiringFly',
        },
      },
    });
    limits.getActivePlan.mockResolvedValue(SubscriptionPlan.FREE);

    await service().handleApplicationStatusChanged(
      'app-1',
      AppStatus.SHORTLISTED,
    );

    expect(messaging.findOrCreate).toHaveBeenCalled();
    const call = messaging.findOrCreate.mock.calls[0] as unknown as [
      string,
      { recipientId: string; jobId: string; firstMessage: string },
      undefined,
      { system: boolean; messageType: MessageType },
    ];
    expect(call[0]).toBe('employer-1');
    expect(call[1].recipientId).toBe('candidate-1');
    expect(call[1].jobId).toBe('job-1');
    expect(call[1].firstMessage).toContain('shortlisted');
    expect(call[3]).toMatchObject({
      system: true,
      messageType: MessageType.STATUS_UPDATE,
    });
    expect(logRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: AutomationLogStatus.SUCCESS }),
    );
  });

  it('does not send duplicate interview reminders', async () => {
    reminderRepo.findOne.mockResolvedValue({
      id: 'reminder-1',
      status: AutomationLogStatus.SUCCESS,
    });
    interviewRepo.find.mockResolvedValue([
      {
        id: 'interview-1',
        companyId: 'company-1',
        scheduledAt: new Date(Date.now() + 30 * 60 * 1000),
        status: InterviewStatus.UPCOMING,
      },
    ]);

    await service().processInterviewReminders();

    expect(mail.sendInterviewReminder).not.toHaveBeenCalled();
    expect(logRepo.save).not.toHaveBeenCalled();
  });

  it('does not spam follow-up nudges after a successful log exists', async () => {
    settingsRepo.find.mockResolvedValue([
      {
        companyId: 'company-1',
        autoFollowUpAfterNoResponse: true,
        followUpDelayDays: 3,
      },
    ]);
    companyRepo.findOne.mockResolvedValue({
      id: 'company-1',
      ownerId: 'employer-1',
    });
    limits.getActivePlan.mockResolvedValue(SubscriptionPlan.STARTER);
    appRepo.find.mockResolvedValue([
      {
        id: 'app-1',
        jobId: 'job-1',
        applicantId: 'candidate-1',
        status: AppStatus.REVIEWING,
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        applicant: { fullName: 'Aisha Khan' },
        job: { title: 'Frontend Engineer', companyId: 'company-1' },
      },
    ]);
    logRepo.count.mockResolvedValue(1);

    await service().processFollowUps();

    expect(notifications.notify).not.toHaveBeenCalled();
  });
});
