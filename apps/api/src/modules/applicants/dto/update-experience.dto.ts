import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ExperienceDto } from './experience.dto';
export class UpdateExperiencesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperienceDto)
  experiences!: ExperienceDto[];
}
