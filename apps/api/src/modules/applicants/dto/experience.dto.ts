import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';
export class ExperienceDto {
  @IsString() company!: string;
  @IsString() title!: string;
  @IsString() startDate!: string; // "2022-03"
  @IsOptional() @IsString() endDate?: string;
  @IsOptional() @IsBoolean() isCurrent?: boolean;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) skills?: string[];
}
