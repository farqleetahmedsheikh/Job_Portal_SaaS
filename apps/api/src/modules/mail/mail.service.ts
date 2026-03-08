/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Mail;
  private readonly fromAddress: string;

  constructor(private readonly config: ConfigService) {
    this.fromAddress =
      this.config.get<string>('mail.from') ?? 'noreply@hiresphere.com';

    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('mail.host'),
      port: this.config.get<number>('mail.port') ?? 587,
      secure: (this.config.get<number>('mail.port') ?? 587) === 465,
      auth: {
        user: this.config.get<string>('mail.user'),
        pass: this.config.get<string>('mail.password'),
      },
    });
  }

  // ── Send OTP ───────────────────────────────────────────
  async sendOtp(to: string, otp: string): Promise<void> {
    await this.send({
      to,
      subject: 'Your HireSphere verification code',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
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
        </div>
      `,
    });
  }

  // ── Send welcome email ─────────────────────────────────
  async sendWelcome(to: string, fullName: string): Promise<void> {
    await this.send({
      to,
      subject: 'Welcome to HireSphere!',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2>Welcome, ${fullName}!</h2>
          <p>Your account has been created successfully.
             Start exploring jobs and building your profile.</p>
        </div>
      `,
    });
  }

  // ── Private send ──────────────────────────────────────
  private async send(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
    } catch (err) {
      this.logger.error(
        `Failed to send email to ${options.to}: ${options.subject}`,
        err instanceof Error ? err.stack : err,
      );
      throw new InternalServerErrorException('Failed to send email');
    }
  }
}
