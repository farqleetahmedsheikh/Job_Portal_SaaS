import { IsEnum, IsString, MinLength } from 'class-validator';
import { EmailTemplateType } from '../../../common/enums/enums';

export class CreateEmailTemplateDto {
  @IsEnum(EmailTemplateType)
  type!: EmailTemplateType;

  @IsString()
  @MinLength(2)
  subject!: string;

  @IsString()
  @MinLength(20)
  body!: string;
}
