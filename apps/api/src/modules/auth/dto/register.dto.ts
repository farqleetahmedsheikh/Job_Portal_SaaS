// auth/dto/register.dto.ts
import {
  IsEmail,
  IsEmpty,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '../../../common/enums/user-role.enum';
import { normalizeUserRole } from '../../../common/utils/role.util';
import { CountryCode, SupportedTimezone } from '../../../common/enums/enums';

const toBoolean = (value: unknown): unknown => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
};

export class RegisterDto {
  @IsEmail()
  email!: string;

  @MinLength(8)
  password!: string;

  @IsEnum(UserRole)
  @Transform(
    ({ value }: { value: unknown }) => normalizeUserRole(value) ?? value,
  )
  role!: UserRole;

  @IsNotEmpty()
  fullName!: string;

  @IsEmpty()
  @IsOptional()
  phoneNumber?: string;

  @IsOptional()
  @IsEnum(CountryCode)
  country?: CountryCode;

  @IsOptional()
  @IsEnum(SupportedTimezone)
  timezone?: SupportedTimezone;

  @Transform(({ value }: { value: unknown }) => toBoolean(value))
  @IsBoolean()
  termsAccepted!: boolean;

  @Transform(({ value }: { value: unknown }) => toBoolean(value))
  @IsBoolean()
  privacyAccepted!: boolean;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => toBoolean(value))
  @IsBoolean()
  marketingConsent?: boolean;
}
