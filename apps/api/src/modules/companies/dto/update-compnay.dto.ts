import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  MinLength,
} from 'class-validator';
import {
  CompanySize,
  CountryCode,
  SupportedTimezone,
} from '../../../common/enums/enums';

export class UpdateCompanyDto {
  @IsOptional() @IsString() @MinLength(2) companyName?: string;
  @IsOptional() @IsString() tagline?: string;
  @IsOptional() @IsString() about?: string;
  @IsOptional() @IsString() culture?: string;
  @IsOptional() @IsString() industry?: string;
  @IsOptional() @IsEnum(CompanySize) size?: CompanySize;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsEnum(CountryCode) country?: CountryCode;
  @IsOptional() @IsEnum(SupportedTimezone) timezone?: SupportedTimezone;
  @IsOptional() @IsInt() @Min(1800) @Max(2100) foundedYear?: number;
  @IsOptional() @IsString() websiteUrl?: string;
  @IsOptional() @IsString() logoUrl?: string;
  @IsOptional() @IsString() coverUrl?: string;
  @IsOptional() @IsString() linkedinUrl?: string;
  @IsOptional() @IsString() twitterUrl?: string;
  @IsOptional() @IsString() instagramUrl?: string;
}
