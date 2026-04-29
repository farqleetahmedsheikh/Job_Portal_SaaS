import { ForbiddenException } from '@nestjs/common';
import { SubscriptionPlan, UserRole } from '../../common/enums/enums';
import { TalentDbService } from './talent-db.service';

function createQueryBuilderMock(result: unknown[] = [], total = 0) {
  return {
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([result, total]),
  };
}

describe('TalentDbService', () => {
  const companyRepo = {
    findOne: jest.fn().mockResolvedValue({ id: 'company-1' }),
  };
  const resumeRepo = {
    find: jest.fn().mockResolvedValue([]),
  };
  const savedRepo = {
    create: jest.fn((value: unknown): unknown => value),
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
      insert: jest.fn().mockReturnThis(),
      into: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      orIgnore: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({}),
    })),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
    findAndCount: jest.fn().mockResolvedValue([[], 0]),
  };
  const applicationRepo = {
    createQueryBuilder: jest.fn(() => ({
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
    })),
  };
  const limits = {
    getActivePlan: jest.fn(),
    requireFeature: jest.fn(),
  };

  function service(profileRepo: unknown) {
    return new TalentDbService(
      profileRepo as never,
      resumeRepo as never,
      companyRepo as never,
      applicationRepo as never,
      savedRepo as never,
      limits as never,
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
    companyRepo.findOne.mockResolvedValue({ id: 'company-1' });
    resumeRepo.find.mockResolvedValue([]);
  });

  it('limits free plan searches to preview access', async () => {
    limits.getActivePlan.mockResolvedValue(SubscriptionPlan.FREE);
    const qb = createQueryBuilderMock(
      [
        {
          userId: 'candidate-1',
          skills: ['React'],
          isPublic: true,
          openToWork: true,
          isOpenToWork: false,
          experiences: [],
          educations: [],
          user: {
            id: 'candidate-1',
            fullName: 'Aisha Khan',
            email: 'aisha@example.com',
            role: UserRole.APPLICANT,
            createdAt: new Date(),
          },
        },
      ],
      1,
    );
    const profileRepo = { createQueryBuilder: jest.fn(() => qb) };

    const result = await service(profileRepo).search('employer-1', {
      page: 1,
      limit: 20,
    });

    expect(qb.take).toHaveBeenCalledWith(10);
    expect(result.meta.locked).toBe(true);
    expect(result.meta.requiredPlan).toBe(SubscriptionPlan.GROWTH);
    expect(result.data[0].isLocked).toBe(true);
    expect(result.data[0].email).toBeNull();
  });

  it('blocks candidate details on lower plans unless candidate applied to company', async () => {
    limits.getActivePlan.mockResolvedValue(SubscriptionPlan.STARTER);
    const profileRepo = {
      findOne: jest.fn().mockResolvedValue({
        userId: 'candidate-1',
        isPublic: true,
        skills: [],
        experiences: [],
        educations: [],
        user: {
          id: 'candidate-1',
          fullName: 'Aisha Khan',
          email: 'aisha@example.com',
          role: UserRole.APPLICANT,
          createdAt: new Date(),
        },
      }),
    };

    await expect(
      service(profileRepo).detail('employer-1', 'candidate-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
