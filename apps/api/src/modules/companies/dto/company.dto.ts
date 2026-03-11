import { IsOptional, IsString } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  companyName!: string;

  @IsOptional()
  @IsString()
  websiteUrl?: string;

  @IsOptional()
  @IsString()
  employees?: string;

  @IsString()
  location!: string;

  @IsString()
  industry!: string;

  @IsString()
  description?: string;
}
