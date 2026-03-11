/* eslint-disable @typescript-eslint/no-unsafe-call */
/** @format */
// src/modules/jobs/dto/index.ts

import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  JobType,
  LocationType,
  ExperienceLevel,
} from '../../../common/enums/enums';
// ─── Browse / search query ────────────────────────────────────────────────────
export class QueryJobsDto {
  @IsOptional()
  @IsString()
  q?: string; // keyword search in title + skills

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsEnum(LocationType)
  locationType?: LocationType;

  @IsOptional()
  @IsEnum(JobType)
  type?: JobType;

  @IsOptional()
  @IsEnum(ExperienceLevel)
  experienceLevel?: ExperienceLevel;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  salaryMin?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  sort?: 'newest' | 'salary' | 'relevance';
}
