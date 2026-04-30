import { IsIn, IsOptional } from 'class-validator';

export class CompleteOnboardingDto {
  @IsOptional()
  @IsIn(['applicant', 'employer'])
  onboardingRole?: 'applicant' | 'employer';
}
