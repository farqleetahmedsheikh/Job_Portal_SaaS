import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend;
  private readonly fromAddress: string;

  constructor(private readonly config: ConfigService) {
    this.fromAddress =
      this.config.get<string>('mail.from') ??
      'HiringFly <noreply@hiringfly.com>';
    this.resend = new Resend(this.config.get<string>('ApiKey'));
  }

  // ── Auth ───────────────────────────────────────────────────────────────────

  async sendOtp(to: string, otp: string): Promise<void> {
    await this.send({
      to,
      subject: 'Your HiringFly verification code',
      html: this.base(`
        <h2>Your verification code</h2>
        <p>Use the code below to reset your password.
           It expires in <strong>5 minutes</strong>.</p>
        <div style="font-size:36px;font-weight:bold;
                    letter-spacing:8px;padding:16px 0;color:#4f46e5">
          ${otp}
        </div>
        <p style="color:#888;font-size:13px">
          If you didn't request this, you can safely ignore this email.
        </p>
      `),
    });
  }

  async sendWelcome(to: string, fullName: string): Promise<void> {
    await this.send({
      to,
      subject: 'Welcome to HiringFly!',
      html: this.base(`
        <h2>Welcome, ${fullName}!</h2>
        <p>Your account has been created successfully.
           Start exploring jobs and building your profile.</p>
      `),
    });
  }

  // ── Interviews ─────────────────────────────────────────────────────────────

  async sendInterviewScheduled(opts: {
    to: string;
    candidateName: string;
    jobTitle: string;
    company: string;
    scheduledAt: Date;
    durationMins: number;
    format: string;
    meetLink?: string;
    notes?: string;
  }): Promise<void> {
    const { date, time } = this.formatDateTime(opts.scheduledAt);
    await this.send({
      to: opts.to,
      subject: `Interview scheduled — ${opts.jobTitle} at ${opts.company}`,
      html: this.base(`
        <h2>Interview scheduled 🎉</h2>
        <p>Hi ${opts.candidateName}, your interview has been confirmed.</p>
        ${this.metaCard([
          ['Role', `${opts.jobTitle} at ${opts.company}`],
          ['Date', date],
          ['Time', time],
          ['Duration', `${opts.durationMins} minutes`],
          ['Format', opts.format],
          ...(opts.meetLink
            ? [
                ['Link', `<a href="${opts.meetLink}">${opts.meetLink}</a>`] as [
                  string,
                  string,
                ],
              ]
            : []),
        ])}
        ${opts.notes ? `<p><strong>Notes from interviewer:</strong> ${opts.notes}</p>` : ''}
        ${opts.meetLink ? this.btn('Join Meeting', opts.meetLink) : ''}
      `),
    });
  }

  async sendInterviewRescheduled(opts: {
    to: string;
    candidateName: string;
    jobTitle: string;
    company: string;
    scheduledAt: Date;
    meetLink?: string;
  }): Promise<void> {
    const { date, time } = this.formatDateTime(opts.scheduledAt);
    await this.send({
      to: opts.to,
      subject: `Interview rescheduled — ${opts.jobTitle} at ${opts.company}`,
      html: this.base(`
        <h2>Interview rescheduled</h2>
        <p>Hi ${opts.candidateName}, your interview has been moved to a new time.</p>
        ${this.metaCard([
          ['Role', `${opts.jobTitle} at ${opts.company}`],
          ['New date', date],
          ['New time', time],
          ...(opts.meetLink
            ? [
                ['Link', `<a href="${opts.meetLink}">${opts.meetLink}</a>`] as [
                  string,
                  string,
                ],
              ]
            : []),
        ])}
        ${opts.meetLink ? this.btn('Join Meeting', opts.meetLink) : ''}
      `),
    });
  }

  async sendInterviewCancelled(opts: {
    to: string;
    candidateName: string;
    jobTitle: string;
    company: string;
    reason?: string;
  }): Promise<void> {
    await this.send({
      to: opts.to,
      subject: `Interview cancelled — ${opts.jobTitle} at ${opts.company}`,
      html: this.base(`
        <h2>Interview cancelled</h2>
        <p>Hi ${opts.candidateName}, your interview for
           <strong>${opts.jobTitle}</strong> at
           <strong>${opts.company}</strong> has been cancelled.</p>
        ${opts.reason ? this.metaCard([['Reason', opts.reason]]) : ''}
        <p>Log in to HiringFly to check your application status.</p>
      `),
    });
  }

  async sendInterviewReminder(opts: {
    to: string;
    candidateName: string;
    jobTitle: string;
    company: string;
    scheduledAt: Date;
    meetLink?: string;
    reminderType: string;
  }): Promise<void> {
    const { date, time } = this.formatDateTime(opts.scheduledAt);
    const isOneHour = opts.reminderType === 'one_hour';
    await this.send({
      to: opts.to,
      subject: `${isOneHour ? 'Interview starts soon' : 'Interview reminder'} - ${opts.jobTitle} at ${opts.company}`,
      html: this.base(`
        <h2>${isOneHour ? 'Your interview starts in about 1 hour' : 'Your interview is coming up'}</h2>
        <p>Hi ${opts.candidateName}, this is a reminder for your upcoming interview.</p>
        ${this.metaCard([
          ['Role', `${opts.jobTitle} at ${opts.company}`],
          ['Date', date],
          ['Time', time],
          ...(opts.meetLink
            ? [
                ['Link', `<a href="${opts.meetLink}">${opts.meetLink}</a>`] as [
                  string,
                  string,
                ],
              ]
            : []),
        ])}
        ${opts.meetLink ? this.btn('Join Meeting', opts.meetLink) : ''}
      `),
    });
  }

  // ── Applications ───────────────────────────────────────────────────────────

  async sendApplicationReceived(opts: {
    to: string;
    employerName: string;
    jobTitle: string;
    candidateName: string;
  }): Promise<void> {
    await this.send({
      to: opts.to,
      subject: `New application — ${opts.jobTitle}`,
      html: this.base(`
        <h2>New application received</h2>
        <p>Hi ${opts.employerName}, a new application has been submitted.</p>
        ${this.metaCard([
          ['Role', opts.jobTitle],
          ['Applicant', opts.candidateName],
        ])}
        ${this.btn('View Application', 'https://hiringfly.com/employer/applications')}
      `),
    });
  }

  async sendApplicationConfirmation(opts: {
    to: string;
    candidateName: string;
    jobTitle: string;
    company: string;
  }): Promise<void> {
    await this.send({
      to: opts.to,
      subject: `Application received - ${opts.jobTitle} at ${opts.company}`,
      html: this.base(`
        <h2>Application received</h2>
        <p>Hi ${opts.candidateName}, your application for
          <strong>${opts.jobTitle}</strong> at <strong>${opts.company}</strong>
          has been received.</p>
        <p>You will be notified when the hiring team updates your status.</p>
        ${this.btn('Track Application', 'https://hiringfly.com/applicant/applications')}
      `),
    });
  }

  async sendApplicationStatus(opts: {
    to: string;
    candidateName: string;
    jobTitle: string;
    company: string;
    status: string;
  }): Promise<void> {
    await this.send({
      to: opts.to,
      subject: `Application update — ${opts.jobTitle} at ${opts.company}`,
      html: this.base(`
        <h2>Application status updated</h2>
        <p>Hi ${opts.candidateName}, your application status has changed.</p>
        ${this.metaCard([
          ['Role', `${opts.jobTitle} at ${opts.company}`],
          ['Status', opts.status],
        ])}
        ${this.btn('View Application', 'https://hiringfly.com/applicant/applications')}
      `),
    });
  }

  // ── Offer ──────────────────────────────────────────────────────────────────

  async sendApplicationRejected(opts: {
    to: string;
    candidateName: string;
    jobTitle: string;
    company: string;
    reason?: string;
  }): Promise<void> {
    await this.send({
      to: opts.to,
      subject: `Application update - ${opts.jobTitle} at ${opts.company}`,
      html: this.base(`
        <h2>Application update</h2>
        <p>Hi ${opts.candidateName}, thank you for your interest in
           <strong>${opts.jobTitle}</strong> at <strong>${opts.company}</strong>.</p>
        <p>The hiring team has decided to move forward with another candidate for this role.</p>
        ${
          opts.reason
            ? this.metaCard([['Note from the hiring team', opts.reason]])
            : ''
        }
        <p>We appreciate the time you invested and encourage you to apply again when another fit opens up.</p>
        ${this.btn('Browse Jobs', 'https://hiringfly.com/applicant/browse-jobs')}
      `),
    });
  }

  async sendOffer(opts: {
    to: string;
    candidateName: string;
    jobTitle: string;
    company: string;
  }): Promise<void> {
    await this.send({
      to: opts.to,
      subject: `You have an offer — ${opts.jobTitle} at ${opts.company}`,
      html: this.base(`
        <h2>Congratulations, ${opts.candidateName}! 🎉</h2>
        <p>You have received a job offer from <strong>${opts.company}</strong>
           for the role of <strong>${opts.jobTitle}</strong>.</p>
        ${this.btn('View Offer', 'https://hiringfly.com/applicant/applications')}
      `),
    });
  }

  // ── Core send ──────────────────────────────────────────────────────────────

  async sendContract(opts: {
    to: string;
    candidateName: string;
    jobTitle: string;
    company: string;
    title: string;
    content: string;
  }): Promise<void> {
    await this.send({
      to: opts.to,
      subject: `${opts.title} - ${opts.jobTitle} at ${opts.company}`,
      html: this.base(`
        <h2>${opts.title}</h2>
        <p>Hi ${opts.candidateName}, ${opts.company} has sent you a contract or offer document for <strong>${opts.jobTitle}</strong>.</p>
        <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin:20px 0">
          ${opts.content}
        </div>
        <p style="color:#666;font-size:13px">Please review this document carefully. If you have legal questions, consult a qualified professional before signing.</p>
        ${this.btn('View Application', 'https://hiringfly.com/applicant/applications')}
      `),
    });
  }

  private async send(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    const { error } = await this.resend.emails.send({
      from: this.fromAddress,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      this.logger.error(
        `Failed to send email to ${options.to}: ${options.subject}`,
        error.message,
      );
      throw new InternalServerErrorException('Failed to send email');
    }
  }

  // ── Template helpers ───────────────────────────────────────────────────────

  private base(content: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"/></head>
      <body style="font-family:-apple-system,sans-serif;background:#f5f5f5;margin:0;padding:32px 16px">
        <div style="background:#fff;border-radius:12px;padding:32px;max-width:520px;margin:0 auto">
          <div style="font-size:20px;font-weight:600;color:#111;margin-bottom:24px">HiringFly</div>
          ${content}
          <div style="text-align:center;font-size:12px;color:#aaa;margin-top:24px">
            HiringFly · You're receiving this because you have an active account.
          </div>
        </div>
      </body>
      </html>`;
  }

  private metaCard(rows: [string, string][]): string {
    const inner = rows
      .map(
        ([label, value]) => `
          <div style="display:flex;gap:8px;font-size:13px;color:#444;margin-bottom:6px">
            <span style="font-weight:500;min-width:90px;color:#111">${label}</span>
            <span>${value}</span>
          </div>`,
      )
      .join('');
    return `<div style="background:#f9f9f9;border-radius:8px;padding:16px;margin:20px 0">${inner}</div>`;
  }

  private btn(label: string, href: string): string {
    return `<a href="${href}"
               style="display:inline-block;background:#111;color:#fff;text-decoration:none;
                      padding:12px 24px;border-radius:8px;font-size:14px;font-weight:500;margin-top:8px">
              ${label}
            </a>`;
  }

  private formatDateTime(date: Date): { date: string; time: string } {
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  }
}
