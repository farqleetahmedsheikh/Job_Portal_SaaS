import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ExperienceEntryDto } from './experience.dto';
export class UpdateExperiencesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperienceEntryDto)
  experiences!: ExperienceEntryDto[];
}
