import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsNumber,
  IsBoolean,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ExperienceLevel } from 'src/common/enums/enums';
import { LocationType } from 'src/common/enums/enums';

// ── Core profile ──────────────────────────────────────────────────────────────
export class UpdateApplicantProfileDto {
  @IsOptional() @IsString() @MaxLength(100) title?: string; // "Senior React Developer"
  @IsOptional() @IsString() @MaxLength(150) location?: string;
  @IsOptional() @IsEnum(LocationType) preferredLocation?: LocationType;
  @IsOptional() @IsEnum(ExperienceLevel) experienceLevel?: ExperienceLevel;
  @IsOptional() @IsNumber() @Min(0) @Max(50) experienceYears?: number;
  @IsOptional() @IsString() @MaxLength(1000) summary?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) skills?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) languages?: string[];
  @IsOptional() @IsBoolean() isOpenToWork?: boolean;
  @IsOptional() @IsBoolean() isPublic?: boolean;
  @IsOptional() @IsString() linkedinUrl?: string;
  @IsOptional() @IsString() githubUrl?: string;
  @IsOptional() @IsString() portfolioUrl?: string;
  @IsOptional() @IsString() twitterUrl?: string;
}
