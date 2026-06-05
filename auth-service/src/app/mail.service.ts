import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly apiKey: string;
  private readonly senderEmail: string;
  private readonly senderName: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('BREVO_API_KEY') || '';
    this.senderEmail =
      this.configService.get<string>('BREVO_SENDER_EMAIL') || '';
    this.senderName =
      this.configService.get<string>('BREVO_SENDER_NAME') || 'PreSkool ERP';

    if (!this.apiKey || !this.senderEmail) {
      throw new InternalServerErrorException(
        'Brevo mail configuration is missing. Please check BREVO_API_KEY and BREVO_SENDER_EMAIL.',
      );
    }
  }

  async sendPasswordResetEmail(
    to: string,
    fullName: string,
    resetLink: string,
  ): Promise<void> {
    await this.sendEmail({
      to,
      name: fullName,
      subject: 'Reset your PreSkool ERP password',
      htmlContent: `
        ${this.emailWrapper(`
          <div style="text-align:center;margin-bottom:22px;">
            <div style="font-size:34px;line-height:1;">🪄</div>
            <h1 style="margin:10px 0 4px;color:#0f172a;font-size:24px;">
              Reset your password
            </h1>
            <p style="margin:0;color:#64748b;font-size:14px;">
              Secure account recovery for PreSkool ERP
            </p>
          </div>

          <p style="margin:0 0 14px;color:#334155;font-size:15px;line-height:1.7;">
            Hi <strong>${this.escapeHtml(fullName)}</strong>,
          </p>

          <p style="margin:0 0 18px;color:#334155;font-size:15px;line-height:1.7;">
            We received a request to reset your PreSkool ERP password.
            Click the button below to create a new password.
          </p>

          <div style="text-align:center;margin:28px 0;">
            <a
              href="${this.escapeAttribute(resetLink)}"
              style="display:inline-block;background:#4f63ff;color:#ffffff;text-decoration:none;
              padding:14px 24px;border-radius:10px;font-weight:700;font-size:14px;"
            >
              Reset Password
            </a>
          </div>

          <p style="margin:0 0 10px;color:#64748b;font-size:13px;line-height:1.6;">
            This link expires in 30 minutes. If you did not request this,
            you can safely ignore this email.
          </p>

          <p style="margin:18px 0 0;color:#94a3b8;font-size:12px;line-height:1.6;">
            Button not working? Copy this link:<br />
            <span style="word-break:break-all;">${this.escapeHtml(resetLink)}</span>
          </p>
        `)}
      `,
    });
  }

  async sendLoginOtpEmail(
    to: string,
    fullName: string,
    otp: string,
  ): Promise<void> {
    await this.sendEmail({
      to,
      name: fullName,
      subject: 'Your PreSkool ERP verification code',
      htmlContent: `
        ${this.emailWrapper(`
          <div style="text-align:center;margin-bottom:22px;">
            <div style="font-size:34px;line-height:1;">🔐</div>
            <h1 style="margin:10px 0 4px;color:#0f172a;font-size:24px;">
              Verify your login
            </h1>
            <p style="margin:0;color:#64748b;font-size:14px;">
              Secure 2-step verification for PreSkool ERP
            </p>
          </div>

          <p style="margin:0 0 14px;color:#334155;font-size:15px;line-height:1.7;">
            Hi <strong>${this.escapeHtml(fullName)}</strong>,
          </p>

          <p style="margin:0 0 18px;color:#334155;font-size:15px;line-height:1.7;">
            Use the verification code below to complete your PreSkool ERP login.
          </p>

          <div style="text-align:center;margin:28px 0;">
            <div style="display:inline-block;background:#eef4ff;color:#4f63ff;
              padding:16px 28px;border-radius:14px;font-size:34px;font-weight:900;
              letter-spacing:8px;">
              ${this.escapeHtml(otp)}
            </div>
          </div>

          <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">
            This code expires in 10 minutes. If you did not try to login,
            please reset your password immediately.
          </p>
        `)}
      `,
    });
  }

  private async sendEmail(params: {
    to: string;
    name: string;
    subject: string;
    htmlContent: string;
  }): Promise<void> {
    try {
      await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: {
            name: this.senderName,
            email: this.senderEmail,
          },
          to: [
            {
              email: params.to,
              name: params.name,
            },
          ],
          subject: params.subject,
          htmlContent: params.htmlContent,
        },
        {
          headers: {
            accept: 'application/json',
            'api-key': this.apiKey,
            'content-type': 'application/json',
          },
          timeout: 15000,
        },
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(
          `Brevo email failed: ${error.response?.status || error.code} ${JSON.stringify(
            error.response?.data || error.message,
          )}`,
        );
      } else {
        this.logger.error(`Brevo email failed: ${String(error)}`);
      }

      throw new InternalServerErrorException(
        'Failed to send email. Please try again later.',
      );
    }
  }

  private emailWrapper(content: string): string {
    return `
      <div style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">
        <div style="max-width:620px;margin:0 auto;padding:34px 18px;">
          <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;
            overflow:hidden;box-shadow:0 18px 45px rgba(15,23,42,0.08);">
            <div style="padding:22px 28px;background:linear-gradient(135deg,#102044,#4f63ff);
              color:#ffffff;">
              <div style="font-size:20px;font-weight:900;">
                🪄 PreSkool ERP
              </div>
              <div style="margin-top:4px;font-size:13px;opacity:0.88;">
                Modern School Management System
              </div>
            </div>

            <div style="padding:30px 28px;">
              ${content}
            </div>

            <div style="padding:18px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;
              color:#94a3b8;font-size:12px;text-align:center;">
              © 2026 PreSkool ERP. Automated security email.
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private escapeHtml(value: string): string {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private escapeAttribute(value: string): string {
    return this.escapeHtml(value);
  }
}
