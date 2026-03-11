/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsDateString,
  IsArray,
  IsInt,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InterviewType } from '../../../common/enums/enums';
import { PanelistDto } from './panel-list.dto';

export class ScheduleInterviewDto {
  @IsUUID()
  applicationId?: string;

  @IsDateString()
  scheduledAt!: string;

  @IsInt()
  @Min(15)
  @Max(480)
  durationMins!: number;

  @IsEnum(InterviewType)
  type!: InterviewType;

  @IsOptional()
  @IsString()
  meetLink?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PanelistDto)
  panelists?: PanelistDto[];
}
