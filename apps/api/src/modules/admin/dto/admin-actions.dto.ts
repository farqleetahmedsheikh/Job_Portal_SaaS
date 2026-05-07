import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ComplaintStatus } from '../../../common/enums/enums';
import { UserRole } from '../../../common/enums/user-role.enum';
import { normalizeUserRole } from '../../../common/utils/role.util';

export class CreateAdminUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName!: string;

  @IsEnum(UserRole)
  @Transform(
    ({ value }: { value: unknown }) => normalizeUserRole(value) ?? value,
  )
  role!: UserRole.ADMIN | UserRole.SUPERVISOR | UserRole.SUPER_ADMIN;
}

export class UpdateAdminUserDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(UserRole)
  @Transform(
    ({ value }: { value: unknown }) => normalizeUserRole(value) ?? value,
  )
  role?: UserRole;
}

export class RejectCompanyDto {
  @IsOptional()
  @IsString()
  @MaxLength(1200)
  reason?: string;
}

export class UpdateComplaintDto {
  @IsOptional()
  @IsEnum(ComplaintStatus)
  status?: ComplaintStatus;

  @IsOptional()
  @IsUUID()
  assignedTo?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  adminNote?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  response?: string;
}

export class SuggestSupportReplyDto {
  @IsUUID()
  complaintId!: string;

  @IsOptional()
  @IsIn(['professional', 'friendly', 'firm'])
  tone?: 'professional' | 'friendly' | 'firm';

  @IsOptional()
  @IsString()
  @MaxLength(1600)
  notes?: string;
}
