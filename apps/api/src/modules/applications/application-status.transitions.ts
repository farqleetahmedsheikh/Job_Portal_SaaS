import { BadRequestException } from '@nestjs/common';
import { AppStatus } from '../../common/enums/enums';

export const TERMINAL_APPLICATION_STATUSES = new Set<AppStatus>([
  AppStatus.HIRED,
  AppStatus.REJECTED,
  AppStatus.WITHDRAWN,
]);

export const APPLICATION_STATUS_TRANSITIONS: Record<AppStatus, AppStatus[]> = {
  [AppStatus.NEW]: [AppStatus.REVIEWING, AppStatus.WITHDRAWN],
  [AppStatus.REVIEWING]: [AppStatus.SHORTLISTED, AppStatus.REJECTED],
  [AppStatus.SHORTLISTED]: [AppStatus.INTERVIEW, AppStatus.REJECTED],
  [AppStatus.INTERVIEW]: [AppStatus.OFFERED, AppStatus.REJECTED],
  [AppStatus.OFFERED]: [AppStatus.HIRED, AppStatus.REJECTED],
  [AppStatus.HIRED]: [],
  [AppStatus.REJECTED]: [],
  [AppStatus.WITHDRAWN]: [],
};

export function assertApplicationStatusTransition(
  from: AppStatus,
  to: AppStatus,
): void {
  if (from === to) return;

  const allowed = APPLICATION_STATUS_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new BadRequestException(
      `Invalid application status transition: ${from} -> ${to}`,
    );
  }
}
