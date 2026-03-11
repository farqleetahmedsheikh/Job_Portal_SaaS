import { IsString, IsOptional } from 'class-validator';

export class CreateResumeDto {
  @IsString()
  name!: string; // display name e.g. "Senior Dev Resume 2025"

  @IsString()
  fileUrl!: string; // S3/R2 key returned by upload presigned URL

  @IsOptional()
  @IsString()
  mimeType?: string;

  fileSize!: number; // bytes
}
