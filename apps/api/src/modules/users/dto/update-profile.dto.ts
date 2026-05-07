import {
  IsString,
  IsOptional,
  MaxLength,
  IsInt,
  Min,
  Max,
  IsArray,
  IsUrl,
  IsBoolean,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { EducationDto } from 'src/modules/applicants/dto/education.dto';
import { ExperienceDto } from 'src/modules/applicants/dto/experience.dto';
import { CountryCode, SupportedTimezone } from 'src/common/enums/enums';

export class UpdateUserProfileDto {
  // ── User table fields ──────────────────────────────────
  @IsString()
  @IsOptional()
  @MaxLength(100)
  fullName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  bio?: string;

  @IsEnum(CountryCode)
  @IsOptional()
  country?: CountryCode;

  @IsEnum(SupportedTimezone)
  @IsOptional()
  timezone?: SupportedTimezone;

  @IsBoolean()
  @IsOptional()
  marketingConsent?: boolean;

  // ── Applicant profile fields (ignored for employers) ───
  @IsString()
  @IsOptional()
  jobTitle?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(50)
  experienceYears?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];

  @IsString()
  @IsOptional()
  location?: string;

  @IsUrl()
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === '' ? undefined : value,
  )
  linkedinUrl?: string;

  @IsUrl()
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === '' ? undefined : value,
  )
  @IsUrl()
  @IsOptional()
  githubUrl?: string;

  @IsString()
  @IsOptional()
  summary?: any;

  @IsBoolean()
  @IsOptional()
  isOpenToWork?: any;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationDto)
  educations?: EducationDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperienceDto)
  experiences?: ExperienceDto[];
}
