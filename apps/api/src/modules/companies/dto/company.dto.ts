import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { CountryCode, SupportedTimezone } from '../../../common/enums/enums';

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

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsEnum(CountryCode)
  country?: CountryCode;

  @IsOptional()
  @IsEnum(SupportedTimezone)
  timezone?: SupportedTimezone;

  @IsString()
  industry!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
