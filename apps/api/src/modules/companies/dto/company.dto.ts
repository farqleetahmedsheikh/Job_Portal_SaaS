/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsOptional, IsString } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  companyName: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  employees?: string;

  @IsString()
  location: string;

  @IsString()
  industry: string;
}
