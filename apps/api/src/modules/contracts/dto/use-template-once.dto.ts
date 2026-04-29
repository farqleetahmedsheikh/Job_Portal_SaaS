import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class UseTemplateOnceDto {
  @IsUUID()
  applicationId!: string;

  @IsString()
  templateId!: string;

  @IsOptional()
  @IsString()
  @MinLength(40)
  content?: string;
}
