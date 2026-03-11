import { IsArray, ValidateNested } from 'class-validator';
import { EducationDto } from './education.dto';
import { Type } from 'class-transformer';

export class UpdateEducationsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationDto)
  educations!: EducationDto[];
}
