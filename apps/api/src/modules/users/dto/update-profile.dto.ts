/* eslint-disable @typescript-eslint/no-unsafe-call */
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
} from 'class-validator';
import { Transform } from 'class-transformer';

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
}
