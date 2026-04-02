import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { AppSource } from '../../../common/enums/enums';

export class CreateApplicationDto {
  @IsUUID()
  jobId!: string;

  @IsOptional()
  @IsUUID()
  resumeId!: string;

  @IsOptional()
  @IsString()
  coverLetter?: string;

  @IsOptional()
  @IsEnum(AppSource)
  source?: AppSource;
}
