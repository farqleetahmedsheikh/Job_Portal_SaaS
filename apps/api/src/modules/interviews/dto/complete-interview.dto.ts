import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
export class CompleteInterviewDto {
  @IsOptional()
  @IsString()
  feedback?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;
}
