import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  IsNumber,
  IsEnum,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { ExperienceLevel } from 'src/common/enums/enums';

export class CompleteApplicantProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  jobTitle?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  experienceYears?: number;

  @IsOptional()
  @IsEnum(ExperienceLevel)
  experienceLevel?: ExperienceLevel;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(150)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  summary?: string;

  @IsOptional()
  @IsBoolean()
  isOpenToWork?: boolean;

  @IsOptional()
  @IsString()
  linkedinUrl?: string;

  @IsOptional()
  @IsString()
  githubUrl?: string;

  @IsOptional()
  @IsString()
  portfolioUrl?: string;
}

export class CompleteEmployerProfileDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  companyName!: string;

  @IsString()
  @MaxLength(150)
  location!: string;

  @IsString()
  @MaxLength(100)
  industry!: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  about?: string;
}
