/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  IsString,
  IsInt,
  IsOptional,
  IsArray,
  ArrayMinSize,
  Min,
  Max,
  IsUrl,
  IsNotEmpty,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CompleteApplicantProfileDto {
  @IsString()
  @IsNotEmpty()
  jobTitle!: string;

  @IsInt()
  @Min(0)
  @Max(50)
  experienceYears!: number;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  skills!: string[]; // ← array, not string — frontend sends array

  @IsString()
  @IsOptional()
  @Transform(
    ({ value }) => (value === '' || value === null ? undefined : value), // ← empty string → undefined
  )
  location?: string;

  @IsUrl()
  @IsOptional()
  @Transform(({ value }) =>
    value === '' || value === null ? undefined : value,
  )
  linkedinUrl?: string;

  @IsUrl()
  @IsOptional()
  @Transform(({ value }) =>
    value === '' || value === null ? undefined : value,
  )
  githubUrl?: string;
}

export class CompleteEmployerProfileDto {
  @IsString()
  @IsNotEmpty()
  companyName!: string;

  @IsString()
  @IsNotEmpty()
  location!: string;

  @IsString()
  @IsNotEmpty()
  industry!: string;

  @IsUrl()
  @IsOptional()
  @Transform(({ value }) =>
    value === '' || value === null ? undefined : value,
  )
  website?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) =>
    value === '' || value === null ? undefined : value,
  )
  description?: string;
}
