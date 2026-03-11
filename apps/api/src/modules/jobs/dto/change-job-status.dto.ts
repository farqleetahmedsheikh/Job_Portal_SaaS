import { IsEnum } from 'class-validator';
import { JobStatus } from 'src/common/enums/enums';

// ─── Status change (employer actions: pause / activate / close) ───────────────
export class ChangeJobStatusDto {
  @IsEnum(JobStatus)
  status!: JobStatus;
}
