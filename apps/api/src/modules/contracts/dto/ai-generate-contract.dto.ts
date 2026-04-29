import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { JobType } from '../../../common/enums/enums';

export class AiGenerateContractDto {
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  jobTitle!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(150)
  companyName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(150)
  candidateName!: string;

  @IsString()
  @MaxLength(80)
  salary!: string;

  @IsEnum(JobType)
  jobType!: JobType;

  @IsString()
  @MaxLength(150)
  location!: string;

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  additionalNotes?: string;
}
