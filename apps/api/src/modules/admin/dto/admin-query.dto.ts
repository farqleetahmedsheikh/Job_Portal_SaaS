import {
  IsBooleanString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ComplaintStatus,
  ComplaintType,
  SystemLogLevel,
  UserRole,
  VerificationStatus,
} from '../../../common/enums/enums';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class QueryAdminUsersDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsBooleanString()
  active?: string;

  @IsOptional()
  @IsBooleanString()
  banned?: string;
}

export class QueryAdminCompaniesDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(VerificationStatus)
  verificationStatus?: VerificationStatus;
}

export class QueryComplaintsDto extends PaginationDto {
  @IsOptional()
  @IsEnum(ComplaintStatus)
  status?: ComplaintStatus;

  @IsOptional()
  @IsEnum(ComplaintType)
  type?: ComplaintType;
}

export class QueryLogsDto extends PaginationDto {
  @IsOptional()
  @IsEnum(SystemLogLevel)
  level?: SystemLogLevel;

  @IsOptional()
  @IsString()
  route?: string;
}

export class QueryTransactionsDto extends PaginationDto {
  @IsOptional()
  @IsIn(['recent', 'amount'])
  sort?: 'recent' | 'amount';
}
