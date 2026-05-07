import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly fromAddress: string;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('mail.host');
    const port = this.config.get<number>('mail.port') ?? 587;
    const user = this.config.get<string>('mail.user');
    const password = this.config.get<string>('mail.password');

    this.fromAddress =
      this.config.get<string>('mail.from') ??
      'HiringFly <noreply@hiringfly.com>';

    this.transporter =
      host && user && password
        ? nodemailer.createTransport({
            host,
            port,
            secure: port === 465,
            auth: { user, pass: password },
          })
        : null;
  }

  async sendOtp(to: string, otp: string): Promise<void> {
    await this.send({
      to,
      subject: 'Your HiringFly password reset code',
      text: `Use this code to reset your HiringFly password: ${otp}. It expires in 5 minutes.`,
      html: this.base(`
        <h2>Password reset code</h2>
        <p>Use the code below to reset your password. It expires in <strong>5 minutes</strong>.</p>
        <div style="font-size:32px;font-weight:700;letter-spacing:6px;padding:16px 0;color:#4f46e5">${otp}</div>
        <p style="color:#666;font-size:13px">If you did not request this, you can ignore this email.</p>
      `),
      devOtp: otp,
    });
  }

  private async send(options: {
    to: string;
    subject: string;
    text: string;
    html: string;
    devOtp?: string;
  }): Promise<void> {
    if (!this.transporter) {
      if (this.config.get<string>('app.env') !== 'production') {
        this.logger.warn(
          `MAIL_* is not configured. Development OTP for ${options.to}: ${options.devOtp ?? '[not provided]'}`,
        );
        return;
      }

      throw new InternalServerErrorException('Email service is not configured');
    }

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
    } catch (err) {
      this.logger.error(
        `Failed to send email to ${options.to}: ${options.subject}`,
        err instanceof Error ? err.stack : String(err),
      );
      throw new InternalServerErrorException('Failed to send email');
    }
  }

  private base(content: string): string {
    return `
      <!doctype html>
      <html>
        <head><meta charset="utf-8" /></head>
        <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f5;margin:0;padding:32px 16px">
          <main style="background:#fff;border-radius:12px;padding:32px;max-width:520px;margin:0 auto">
            <div style="font-size:20px;font-weight:700;color:#111;margin-bottom:24px">HiringFly</div>
            ${content}
          </main>
        </body>
      </html>`;
  }
}
