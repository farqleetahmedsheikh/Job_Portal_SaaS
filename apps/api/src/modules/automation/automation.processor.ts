import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AutomationService } from './automation.service';

@Injectable()
export class AutomationProcessor {
  private readonly logger = new Logger(AutomationProcessor.name);

  constructor(private readonly automation: AutomationService) {}

  @Cron('*/10 * * * *')
  async processInterviewReminders() {
    try {
      await this.automation.processInterviewReminders();
    } catch (err) {
      this.logger.error(
        'Interview reminder automation failed',
        err instanceof Error ? err.stack : `${err}`,
      );
    }
  }

  @Cron('0 * * * *')
  async processFollowUps() {
    try {
      await this.automation.processFollowUps();
    } catch (err) {
      this.logger.error(
        'Follow-up automation failed',
        err instanceof Error ? err.stack : `${err}`,
      );
    }
  }
}
