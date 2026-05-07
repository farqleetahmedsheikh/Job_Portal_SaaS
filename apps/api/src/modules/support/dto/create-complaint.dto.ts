import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ComplaintType } from '../../../common/enums/enums';

export class CreateComplaintDto {
  @IsEnum(ComplaintType)
  type!: ComplaintType;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  subject?: string;

  @IsString()
  @MinLength(10)
  @MaxLength(4000)
  message!: string;

  @IsOptional()
  @IsUUID()
  relatedJobId?: string;

  @IsOptional()
  @IsUUID()
  relatedCompanyId?: string;

  @IsOptional()
  @IsUUID()
  relatedUserId?: string;
}

export class ReportTargetDto {
  @IsOptional()
  @IsString()
  @MaxLength(180)
  subject?: string;

  @IsString()
  @MinLength(10)
  @MaxLength(4000)
  message!: string;

  @IsOptional()
  @IsUUID()
  relatedJobId?: string;

  @IsOptional()
  @IsUUID()
  relatedCompanyId?: string;

  @IsOptional()
  @IsUUID()
  relatedUserId?: string;
}

export class QueryMyComplaintsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}
