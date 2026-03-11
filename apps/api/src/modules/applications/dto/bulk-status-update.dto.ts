import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { AppStatus } from '../../../common/enums/enums';

export class BulkStatusUpdateDto {
  @IsUUID(undefined, { each: true })
  applicationIds?: string[];

  @IsEnum(AppStatus)
  status?: AppStatus;

  @IsOptional()
  @IsString()
  note?: string;
}
