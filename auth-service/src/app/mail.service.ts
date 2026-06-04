import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly transporter: nodemailer.Transporter;
  private readonly mailFrom: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('MAIL_HOST');
    const port = Number(this.configService.get<string>('MAIL_PORT') || 587);
    const user = this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('MAIL_PASS');

    this.mailFrom =
      this.configService.get<string>('MAIL_FROM') || `"PreSkool ERP" <${user}>`;

    if (!host || !user || !pass) {
      throw new InternalServerErrorException(
        'Mail configuration is missing. Please check MAIL_HOST, MAIL_USER and MAIL_PASS.',
      );
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
  }

  async sendPasswordResetEmail(
    to: string,
    fullName: string,
    resetLink: string,
  ): Promise<void> {
    await this.transporter.sendMail({
      from: this.mailFrom,
      to,
      subject: 'Reset your PreSkool ERP password',
      html: `
        <div style="font-family: Arial, sans-serif; background:#f6f8fb; padding:24px;">
          <div style="max-width:560px; margin:auto; background:#ffffff; border-radius:14px; padding:28px; border:1px solid #edf1f7;">
            <h2 style="margin:0; color:#16213e;">Reset your password</h2>
            <p style="color:#4b587c; line-height:1.6;">
              Hi ${this.escapeHtml(fullName)}, we received a request to reset your PreSkool ERP password.
            </p>
            <p style="color:#4b587c; line-height:1.6;">
              Click the button below to create a new password. This link will expire soon.
            </p>
            <a href="${resetLink}"
              style="display:inline-block; margin:16px 0; background:#3d5ee1; color:#ffffff; padding:12px 18px; border-radius:8px; text-decoration:none; font-weight:700;">
              Reset Password
            </a>
            <p style="color:#64748b; font-size:13px; line-height:1.6;">
              If the button does not work, copy and paste this link into your browser:
              <br />
              <span style="word-break:break-all;">${resetLink}</span>
            </p>
            <p style="color:#e11d48; font-size:13px;">
              If you did not request this, you can ignore this email.
            </p>
          </div>
        </div>
      `,
    });
  }

  async sendLoginOtpEmail(
    to: string,
    fullName: string,
    otp: string,
  ): Promise<void> {
    await this.transporter.sendMail({
      from: this.mailFrom,
      to,
      subject: 'Your PreSkool ERP login verification code',
      html: `
        <div style="font-family: Arial, sans-serif; background:#f6f8fb; padding:24px;">
          <div style="max-width:560px; margin:auto; background:#ffffff; border-radius:14px; padding:28px; border:1px solid #edf1f7;">
            <h2 style="margin:0; color:#16213e;">Login verification</h2>
            <p style="color:#4b587c; line-height:1.6;">
              Hi ${this.escapeHtml(fullName)}, use this OTP to complete your PreSkool ERP login.
            </p>
            <div style="font-size:34px; letter-spacing:8px; font-weight:800; color:#3d5ee1; background:#eef4ff; padding:18px; border-radius:12px; text-align:center;">
              ${otp}
            </div>
            <p style="color:#64748b; font-size:13px; line-height:1.6;">
              This code will expire in 10 minutes.
            </p>
            <p style="color:#e11d48; font-size:13px;">
              If you did not try to login, please change your password immediately.
            </p>
          </div>
        </div>
      `,
    });
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
