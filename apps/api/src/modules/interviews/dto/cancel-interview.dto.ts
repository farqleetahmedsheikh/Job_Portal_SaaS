import { IsString, IsOptional } from 'class-validator';
export class CancelInterviewDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
