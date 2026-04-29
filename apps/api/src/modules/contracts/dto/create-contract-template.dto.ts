import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { TemplateKind } from '../../../common/enums/enums';

export class CreateContractTemplateDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title!: string;

  @IsEnum(TemplateKind)
  type!: TemplateKind;

  @IsString()
  @MinLength(40)
  content!: string;
}
