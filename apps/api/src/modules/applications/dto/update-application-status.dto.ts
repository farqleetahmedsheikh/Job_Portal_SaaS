import { IsString, IsEnum, IsOptional } from 'class-validator';
import { AppStatus } from '../../../common/enums/enums';

export class UpdateApplicationStatusDto {
  @IsEnum(AppStatus)
  status!: AppStatus;

  @IsOptional()
  @IsString()
  note?: string; // written to application_status_history
}
