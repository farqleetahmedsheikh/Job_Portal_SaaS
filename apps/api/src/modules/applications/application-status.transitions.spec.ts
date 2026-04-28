import { BadRequestException } from '@nestjs/common';
import { AppStatus } from '../../common/enums/enums';
import { assertApplicationStatusTransition } from './application-status.transitions';

describe('application status transitions', () => {
  it('allows valid pipeline moves', () => {
    expect(() =>
      assertApplicationStatusTransition(AppStatus.NEW, AppStatus.REVIEWING),
    ).not.toThrow();
    expect(() =>
      assertApplicationStatusTransition(AppStatus.OFFERED, AppStatus.HIRED),
    ).not.toThrow();
  });

  it('rejects unsafe jumps and terminal moves', () => {
    expect(() =>
      assertApplicationStatusTransition(AppStatus.NEW, AppStatus.HIRED),
    ).toThrow(BadRequestException);
    expect(() =>
      assertApplicationStatusTransition(
        AppStatus.REJECTED,
        AppStatus.REVIEWING,
      ),
    ).toThrow(BadRequestException);
  });
});
