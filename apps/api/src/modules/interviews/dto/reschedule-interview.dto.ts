import {
  IsString,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class RescheduleInterviewDto {
  @IsDateString()
  scheduledAt!: string;

  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(480)
  durationMins?: number;

  @IsOptional()
  @IsString()
  meetLink?: string;
}
