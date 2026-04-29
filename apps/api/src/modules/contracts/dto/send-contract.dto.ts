import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SendContractDto {
  @IsUUID()
  applicationId!: string;

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  title!: string;

  @IsString()
  @MinLength(40)
  content!: string;

  @IsOptional()
  @IsBoolean()
  confirmOneTimePayment?: boolean;
}
