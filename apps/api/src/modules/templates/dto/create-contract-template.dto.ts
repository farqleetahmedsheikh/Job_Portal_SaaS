import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { TemplateKind } from '../../../common/enums/enums';

export class CreateContractTemplateDto {
  @IsString()
  @MinLength(2)
  title!: string;

  @IsEnum(TemplateKind)
  type!: TemplateKind;

  @IsString()
  @MinLength(20)
  body!: string;

  @IsOptional()
  @IsBoolean()
  isAdvanced?: boolean;
}
