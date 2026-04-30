import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserRole } from '../../common/enums/enums';
import { OnboardingService } from './onboarding.service';

function repo(overrides: Record<string, unknown> = {}) {
  return {
    findOne: jest.fn(),
    save: jest.fn((value: unknown): Promise<unknown> => Promise.resolve(value)),
    ...overrides,
  };
}

describe('OnboardingService', () => {
  const userRepo = repo();

  function service() {
    return new OnboardingService(userRepo as never);
  }

  beforeEach(() => {
    jest.clearAllMocks();
    userRepo.save.mockImplementation((value: unknown) =>
      Promise.resolve(value),
    );
  });

  it('returns first-run onboarding status for applicants', async () => {
    userRepo.findOne.mockResolvedValue({
      id: 'user-1',
      role: UserRole.APPLICANT,
      hasCompletedOnboarding: false,
      onboardingCompletedAt: null,
      onboardingRole: null,
    });

    const result = await service().getStatus('user-1', UserRole.APPLICANT);

    expect(result).toEqual({
      hasCompletedOnboarding: false,
      onboardingCompletedAt: null,
      onboardingRole: UserRole.APPLICANT,
      role: UserRole.APPLICANT,
    });
  });

  it('marks onboarding complete with role and timestamp', async () => {
    userRepo.findOne.mockResolvedValue({
      id: 'user-1',
      role: UserRole.EMPLOYER,
      hasCompletedOnboarding: false,
      onboardingCompletedAt: null,
      onboardingRole: null,
    });

    const result = await service().complete('user-1', UserRole.EMPLOYER, {});

    expect(userRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        hasCompletedOnboarding: true,
        onboardingRole: UserRole.EMPLOYER,
      }),
    );
    expect(result.hasCompletedOnboarding).toBe(true);
    expect(result.onboardingCompletedAt).toBeInstanceOf(Date);
  });

  it('rejects onboarding completion for non-applicant and non-employer roles', async () => {
    await expect(
      service().complete('admin-1', UserRole.ADMIN, {}),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws when user is missing', async () => {
    userRepo.findOne.mockResolvedValue(null);

    await expect(
      service().getStatus('missing', UserRole.APPLICANT),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
