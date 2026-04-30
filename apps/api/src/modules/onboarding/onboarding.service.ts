import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../../common/enums/enums';
import { User } from '../users/entities/user.entity';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';

export interface OnboardingStatusResponse {
  hasCompletedOnboarding: boolean;
  onboardingCompletedAt: Date | null;
  onboardingRole: UserRole.APPLICANT | UserRole.EMPLOYER | null;
  role: string;
}

const ONBOARDING_ROLES = new Set<string>([
  UserRole.APPLICANT,
  UserRole.EMPLOYER,
]);

@Injectable()
export class OnboardingService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async getStatus(
    userId: string,
    role: string,
  ): Promise<OnboardingStatusResponse> {
    const user = await this.users.findOne({
      where: { id: userId },
      select: [
        'id',
        'role',
        'hasCompletedOnboarding',
        'onboardingCompletedAt',
        'onboardingRole',
      ],
    });

    if (!user) throw new NotFoundException('User not found');

    return this.toStatus(user, role);
  }

  async complete(
    userId: string,
    role: string,
    dto: CompleteOnboardingDto,
  ): Promise<OnboardingStatusResponse> {
    const onboardingRole = dto.onboardingRole ?? role;

    if (!ONBOARDING_ROLES.has(onboardingRole)) {
      throw new BadRequestException(
        'Onboarding is only available for applicant and employer accounts',
      );
    }

    const user = await this.users.findOne({
      where: { id: userId },
      select: [
        'id',
        'role',
        'hasCompletedOnboarding',
        'onboardingCompletedAt',
        'onboardingRole',
      ],
    });

    if (!user) throw new NotFoundException('User not found');

    user.hasCompletedOnboarding = true;
    user.onboardingCompletedAt = new Date();
    user.onboardingRole = onboardingRole as
      | UserRole.APPLICANT
      | UserRole.EMPLOYER;

    const saved = await this.users.save(user);
    return this.toStatus(saved, role);
  }

  private toStatus(user: User, role: string): OnboardingStatusResponse {
    const onboardingRole =
      user.onboardingRole && ONBOARDING_ROLES.has(user.onboardingRole)
        ? (user.onboardingRole as UserRole.APPLICANT | UserRole.EMPLOYER)
        : ONBOARDING_ROLES.has(role)
          ? (role as UserRole.APPLICANT | UserRole.EMPLOYER)
          : null;

    return {
      hasCompletedOnboarding: user.hasCompletedOnboarding ?? false,
      onboardingCompletedAt: user.onboardingCompletedAt ?? null,
      onboardingRole,
      role,
    };
  }
}
