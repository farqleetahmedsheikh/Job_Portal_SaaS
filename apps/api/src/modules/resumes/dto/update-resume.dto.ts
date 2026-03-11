import { IsString, IsOptional } from 'class-validator';

export class UpdateResumeDto {
  @IsOptional()
  @IsString()
  name?: string;
}
