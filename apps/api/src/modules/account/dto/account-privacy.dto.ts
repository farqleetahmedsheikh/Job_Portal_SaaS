import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { CountryCode, SupportedTimezone } from '../../../common/enums/enums';

export class UpdateAccountPrivacyDto {
  @IsOptional()
  @IsEnum(CountryCode)
  country?: CountryCode;

  @IsOptional()
  @IsEnum(SupportedTimezone)
  timezone?: SupportedTimezone;

  @IsOptional()
  @IsBoolean()
  marketingConsent?: boolean;
}
