import { BadRequestException } from '@nestjs/common';
import { JobStatus } from '../../common/enums/enums';

export const JOB_STATUS_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  [JobStatus.DRAFT]: [JobStatus.ACTIVE],
  [JobStatus.ACTIVE]: [JobStatus.PAUSED, JobStatus.CLOSED, JobStatus.EXPIRED],
  [JobStatus.PAUSED]: [JobStatus.ACTIVE, JobStatus.CLOSED],
  [JobStatus.CLOSED]: [],
  [JobStatus.EXPIRED]: [],
};

export function assertJobStatusTransition(
  from: JobStatus,
  to: JobStatus,
): void {
  if (from === to) return;

  const allowed = JOB_STATUS_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new BadRequestException(
      `Invalid job status transition: ${from} -> ${to}`,
    );
  }
}
