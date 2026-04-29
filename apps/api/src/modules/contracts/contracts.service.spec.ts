import { ForbiddenException } from '@nestjs/common';
import { JobType, SubscriptionPlan } from '../../common/enums/enums';
import { ContractsService } from './contracts.service';

describe('ContractsService', () => {
  const templateRepo = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn(),
    create: jest.fn((value: unknown): unknown => value),
    save: jest.fn((value: unknown): Promise<unknown> => Promise.resolve(value)),
  };
  const usageRepo = {
    create: jest.fn((value: unknown): unknown => value),
    save: jest.fn(
      (value: unknown): Promise<unknown> =>
        Promise.resolve({
          id: 'usage-1',
          ...(value as Record<string, unknown>),
        }),
    ),
  };
  const applicationRepo = {
    findOne: jest.fn(),
  };
  const companyRepo = {
    findOne: jest.fn().mockResolvedValue({
      id: 'company-1',
      companyName: 'Acme',
      ownerId: 'employer-1',
    }),
  };
  const limits = {
    getActivePlan: jest.fn(),
    requireFeature: jest.fn(),
  };
  const mail = {
    sendContract: jest.fn(),
  };
  const notifications = {
    notify: jest.fn(),
  };

  function service() {
    return new ContractsService(
      templateRepo as never,
      usageRepo as never,
      applicationRepo as never,
      companyRepo as never,
      limits as never,
      mail as never,
      notifications as never,
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
    limits.getActivePlan.mockResolvedValue(SubscriptionPlan.FREE);
    applicationRepo.findOne.mockResolvedValue({
      id: 'app-1',
      applicantId: 'candidate-1',
      applicant: {
        id: 'candidate-1',
        fullName: 'Aisha Khan',
        email: 'aisha@example.com',
      },
      job: {
        title: 'Frontend Engineer',
        company: {
          id: 'company-1',
          ownerId: 'employer-1',
          companyName: 'Acme',
        },
      },
    });
  });

  it('requires pay-per-use confirmation before free plan sends', async () => {
    await expect(
      service().sendContract('employer-1', {
        applicationId: 'app-1',
        title: 'Offer Letter',
        content: '<p>This is a professional offer letter draft.</p>',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('records PKR 500 usage and sends when pay-per-use is confirmed', async () => {
    const result = await service().sendContract('employer-1', {
      applicationId: 'app-1',
      title: 'Offer Letter',
      content:
        '<p>This is a professional offer letter draft for the selected candidate.</p>',
      confirmOneTimePayment: true,
    });

    expect(result.amount).toBe(500);
    expect(mail.sendContract).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'aisha@example.com',
        company: 'Acme',
      }),
    );
    expect(notifications.notify).toHaveBeenCalled();
  });

  it('generates generic AI contract text without script content', () => {
    const result = service().generateContract({
      jobTitle: '<script>alert(1)</script>Engineer',
      companyName: 'Acme',
      candidateName: 'Aisha Khan',
      salary: 'PKR 200,000',
      jobType: JobType.FULL_TIME,
      location: 'Lahore',
      startDate: '2026-05-15',
      additionalNotes: 'Probation applies.',
    });

    expect(result.content).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(result.disclaimer).toContain('not legal advice');
  });
});
