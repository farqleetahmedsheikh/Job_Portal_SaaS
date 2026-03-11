import { IsString, IsOptional } from 'class-validator';
export class EducationDto {
  @IsString() school!: string;
  @IsString() degree!: string;
  @IsString() field!: string;
  @IsString() startYear!: string;
  @IsOptional() @IsString() endYear?: string;
  @IsOptional() @IsString() grade?: string;
  @IsOptional() @IsString() description?: string;
}
