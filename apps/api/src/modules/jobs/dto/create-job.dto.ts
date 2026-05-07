/** @format */

import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsDateString,
  IsArray,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';
import {
  JobType,
  LocationType,
  ExperienceLevel,
  JobStatus,
  SalaryCurrency,
  CountryCode,
  CurrencyCode,
  SupportedTimezone,
} from '../../../common/enums/enums';

// ─── Create ──────────────────────────────────────────────────────────────────
export class CreateJobDto {
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  department?: string;

  @IsEnum(JobType)
  type!: JobType;

  @IsEnum(LocationType)
  locationType!: LocationType;

  @IsString()
  @MaxLength(150)
  location!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsEnum(CountryCode)
  country?: CountryCode;

  @IsOptional()
  @IsEnum(CurrencyCode)
  currency?: CurrencyCode;

  @IsOptional()
  @IsEnum(SupportedTimezone)
  timezone?: SupportedTimezone;

  @IsOptional()
  @IsEnum(ExperienceLevel)
  experienceLevel!: ExperienceLevel;

  @IsOptional()
  @IsNumber()
  @Min(0)
  salaryMin!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  salaryMax!: number;

  @IsOptional()
  @IsEnum(SalaryCurrency)
  salaryCurrency!: SalaryCurrency;

  @IsOptional()
  @IsBoolean()
  salaryIsPublic?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  openings!: number;

  @IsOptional()
  @IsDateString()
  deadline!: string;

  @IsString()
  @MinLength(50)
  description!: string;

  @IsOptional()
  @IsString()
  responsibilities?: string;

  @IsOptional()
  @IsString()
  requirements?: string;

  @IsOptional()
  @IsString()
  niceToHave?: string;

  @IsOptional()
  @IsString()
  benefits?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus; // 'draft' | 'active' — defaults to 'draft'
}
