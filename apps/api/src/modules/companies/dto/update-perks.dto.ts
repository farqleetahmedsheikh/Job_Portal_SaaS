import { IsString, IsArray } from 'class-validator';
export class UpdatePerksDto {
  @IsArray()
  @IsString({ each: true })
  perks?: string[];
}
