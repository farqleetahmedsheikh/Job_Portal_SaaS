import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateAutomationSettingsDto {
  @IsOptional()
  @IsBoolean()
  autoApplicationConfirmation?: boolean;

  @IsOptional()
  @IsBoolean()
  autoShortlistMessage?: boolean;

  @IsOptional()
  @IsBoolean()
  autoRejectionMessage?: boolean;

  @IsOptional()
  @IsBoolean()
  autoInterviewReminders?: boolean;

  @IsOptional()
  @IsBoolean()
  autoFollowUpAfterNoResponse?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(14)
  followUpDelayDays?: number;
}
