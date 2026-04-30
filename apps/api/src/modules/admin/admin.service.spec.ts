import { ForbiddenException } from '@nestjs/common';
import {
  ComplaintStatus,
  ComplaintType,
  UserRole,
} from '../../common/enums/enums';
import { AdminService } from './admin.service';

function repo(overrides: Record<string, unknown> = {}) {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    save: jest.fn((value: unknown): Promise<unknown> => Promise.resolve(value)),
    create: jest.fn((value: unknown): unknown => value),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
    ...overrides,
  };
}

describe('AdminService', () => {
  const users = repo();
  const companies = repo();
  const jobs = repo();
  const applications = repo();
  const subscriptions = repo();
  const billingEvents = repo();
  const verificationDocs = repo();
  const contractUsages = repo();
  const complaints = repo();
  const systemLogs = repo();
  const activities = repo({
    save: jest.fn((value: unknown): Promise<unknown> => Promise.resolve(value)),
    create: jest.fn((value: unknown): unknown => value),
  });

  function service() {
    return new AdminService(
      users as never,
      companies as never,
      jobs as never,
      applications as never,
      subscriptions as never,
      billingEvents as never,
      verificationDocs as never,
      contractUsages as never,
      complaints as never,
      systemLogs as never,
      activities as never,
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('blocks non-super admins from changing user roles', async () => {
    users.findOne.mockResolvedValue({
      id: 'user-1',
      role: UserRole.EMPLOYER,
      isActive: true,
    });

    await expect(
      service().updateUser('admin-1', UserRole.ADMIN, 'user-1', {
        role: UserRole.SUPERVISOR,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('generates AI support suggestions without changing complaint state', async () => {
    const complaint = {
      id: 'complaint-1',
      type: ComplaintType.BILLING,
      status: ComplaintStatus.OPEN,
      message: 'I need help with a refund',
      assignedTo: 'supervisor-1',
      user: { fullName: 'Aisha Khan' },
    };
    complaints.findOne.mockResolvedValue(complaint);

    const result = await service().suggestSupportReply(
      'supervisor-1',
      UserRole.SUPERVISOR,
      { complaintId: 'complaint-1', tone: 'professional' },
    );

    expect(result.suggestion).toContain('Thank you for contacting HiringFly');
    expect(result.riskLevel).toBe('medium');
    expect(complaints.save).not.toHaveBeenCalled();
    expect(activities.save).toHaveBeenCalled();
  });
});
