import { BadRequestException } from '@nestjs/common';
import { JobStatus } from '../../common/enums/enums';
import { assertJobStatusTransition } from './job-status.transitions';

describe('job status transitions', () => {
  it('allows configured job moves', () => {
    expect(() =>
      assertJobStatusTransition(JobStatus.DRAFT, JobStatus.ACTIVE),
    ).not.toThrow();
    expect(() =>
      assertJobStatusTransition(JobStatus.PAUSED, JobStatus.CLOSED),
    ).not.toThrow();
  });

  it('blocks terminal job moves', () => {
    expect(() =>
      assertJobStatusTransition(JobStatus.CLOSED, JobStatus.ACTIVE),
    ).toThrow(BadRequestException);
    expect(() =>
      assertJobStatusTransition(JobStatus.EXPIRED, JobStatus.ACTIVE),
    ).toThrow(BadRequestException);
  });
});
