import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type BrevoRecipient = {
  email: string;
  name?: string;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  private readonly brevoApiKey: string;
  private readonly senderEmail: string;
  private readonly senderName: string;
  private readonly frontendUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.brevoApiKey = this.configService.get<string>('BREVO_API_KEY') || '';
    this.senderEmail =
      this.configService.get<string>('BREVO_SENDER_EMAIL') || '';
    this.senderName =
      this.configService.get<string>('BREVO_SENDER_NAME') || 'PreSkool ERP';
    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4200';

    if (!this.brevoApiKey || !this.senderEmail) {
      throw new InternalServerErrorException(
        'Brevo mail configuration is missing. Please check BREVO_API_KEY and BREVO_SENDER_EMAIL.',
      );
    }
  }

  async sendPasswordResetEmail(
    email: string,
    name: string,
    resetUrl: string,
  ): Promise<void> {
    await this.sendBrevoEmail({
      to: [{ email, name }],
      subject: 'Reset your PreSkool ERP password',
      htmlContent: this.buildPasswordResetTemplate(name, resetUrl),
    });
  }

  async sendResetPasswordEmail(
    email: string,
    name: string,
    resetUrl: string,
  ): Promise<void> {
    await this.sendPasswordResetEmail(email, name, resetUrl);
  }

  async sendForgotPasswordEmail(
    email: string,
    name: string,
    resetUrl: string,
  ): Promise<void> {
    await this.sendPasswordResetEmail(email, name, resetUrl);
  }

  async sendLoginOtpEmail(
    email: string,
    name: string,
    otp: string,
  ): Promise<void> {
    await this.sendBrevoEmail({
      to: [{ email, name }],
      subject: 'Your PreSkool ERP verification code',
      htmlContent: this.buildTwoStepVerificationTemplate(name, otp),
    });
  }

  async sendTwoFactorOtpEmail(
    email: string,
    name: string,
    otp: string,
  ): Promise<void> {
    await this.sendLoginOtpEmail(email, name, otp);
  }

  async sendOtpEmail(email: string, name: string, otp: string): Promise<void> {
    await this.sendLoginOtpEmail(email, name, otp);
  }

  private async sendBrevoEmail(params: {
    to: BrevoRecipient[];
    subject: string;
    htmlContent: string;
  }): Promise<void> {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': this.brevoApiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: this.senderName,
          email: this.senderEmail,
        },
        to: params.to,
        subject: params.subject,
        htmlContent: params.htmlContent,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`Brevo email failed: ${response.status} ${errorText}`);

      throw new InternalServerErrorException(
        'Failed to send email. Please try again later.',
      );
    }
  }

  private buildPasswordResetTemplate(name: string, resetUrl: string): string {
    const safeName = this.escapeHtml(name || 'User');
    const safeResetUrl = this.escapeHtml(resetUrl);

    const logoUrl = this.escapeHtml(
      this.getAssetUrl('/assets/logos/preskool-logo.png'),
    );
    const heroImageUrl = this.escapeHtml(
      this.getAssetUrl('/assets/images/auth/forget-password.png'),
    );

    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Reset your PreSkool ERP password</title>
        </head>
        <body style="margin:0;padding:0;background:#edf2fc;font-family:Arial,Helvetica,sans-serif;">
          <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
            Reset your PreSkool ERP password.
          </div>

          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#edf2fc;margin:0;padding:32px 12px;">
            <tr>
              <td align="center">
                <table
                  role="presentation"
                  cellpadding="0"
                  cellspacing="0"
                  width="100%"
                  style="
                    max-width:500px;
                    background:#ffffff;
                    border:1px solid #d9e2f2;
                    border-radius:22px;
                    overflow:hidden;
                  "
                >
                  <tr>
                    <td style="padding:20px 24px 10px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="left" style="vertical-align:middle;">
                            <table role="presentation" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="vertical-align:middle;">
                                  <img
                                    src="${logoUrl}"
                                    alt="PreSkool ERP"
                                    width="28"
                                    height="28"
                                    style="display:block;width:28px;height:28px;object-fit:contain;"
                                  />
                                </td>
                                <td style="padding-left:10px;vertical-align:middle;">
                                  <div style="font-size:18px;font-weight:800;line-height:1.1;color:#10224d;">
                                    PreSkool ERP
                                  </div>
                                  <div style="font-size:13px;font-weight:600;color:#60708f;padding-top:2px;">
                                    Secure account recovery
                                  </div>
                                </td>
                              </tr>
                            </table>
                          </td>

                          <td align="right" style="vertical-align:middle;">
                            <span
                              style="
                                display:inline-block;
                                background:#eef2ff;
                                color:#3b5bdb;
                                font-size:13px;
                                font-weight:700;
                                padding:10px 16px;
                                border-radius:999px;
                              "
                            >
                              Password Reset
                            </span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:6px 24px 0;">
                      <div
                        style="
                          background:#eef3fb;
                          border-radius:18px;
                          padding:26px 20px;
                          text-align:center;
                        "
                      >
                        <img
                          src="${heroImageUrl}"
                          alt="Forgot password"
                          width="220"
                          style="max-width:220px;width:100%;height:auto;display:block;margin:0 auto;"
                        />
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:22px 28px 12px;text-align:center;">
                      <h1
                        style="
                          margin:0 0 14px;
                          color:#3d5ee1;
                          font-size:28px;
                          line-height:1.2;
                          font-weight:800;
                        "
                      >
                        Reset your password
                      </h1>

                      <p style="margin:0 0 10px;color:#44516a;font-size:16px;line-height:1.75;">
                        Hi <strong>${safeName}</strong>, we received a request to reset your
                        PreSkool ERP password.
                      </p>

                      <p style="margin:0;color:#44516a;font-size:16px;line-height:1.75;">
                        Click the button below to create a new password. This link expires in
                        <strong>30 minutes</strong>.
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td align="center" style="padding:8px 28px 8px;">
                      <a
                        href="${safeResetUrl}"
                        style="
                          display:inline-block;
                          min-width:190px;
                          background:#3d5ee1;
                          color:#ffffff;
                          text-decoration:none;
                          font-size:16px;
                          font-weight:800;
                          padding:14px 26px;
                          border-radius:12px;
                        "
                      >
                        Reset Password
                      </a>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:0 28px 18px;text-align:center;">
                      <p style="margin:0;color:#8a97b3;font-size:15px;line-height:1.8;">
                        If you did not request this, you can safely ignore this email.
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:0 24px 22px;">
                      <div
                        style="
                          border:1px solid #d9e2f2;
                          border-radius:14px;
                          background:#f8fafd;
                          padding:14px 16px;
                        "
                      >
                        <p style="margin:0 0 10px;color:#60708f;font-size:15px;font-weight:700;">
                          Button not working? Copy this link:
                        </p>
                        <p style="margin:0;word-break:break-word;">
                          <a
                            href="${safeResetUrl}"
                            style="color:#2563eb;font-size:13px;line-height:1.8;text-decoration:underline;"
                          >
                            ${safeResetUrl}
                          </a>
                        </p>
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td
                      style="
                        padding:16px 20px;
                        border-top:1px solid #dfe7f2;
                        text-align:center;
                        background:#f9fbff;
                      "
                    >
                      <p style="margin:0;color:#7584a2;font-size:13px;line-height:1.6;">
                        © 2026 PreSkool ERP. Automated security email.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  private buildTwoStepVerificationTemplate(name: string, otp: string): string {
    const safeName = this.escapeHtml(name || 'User');
    const safeOtp = this.escapeHtml(otp);

    const logoUrl = this.escapeHtml(
      this.getAssetUrl('/assets/logos/preskool-logo.png'),
    );
    const heroImageUrl = this.escapeHtml(
      this.getAssetUrl('/assets/images/auth/two-step-verification.png'),
    );

    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>PreSkool ERP verification code</title>
        </head>
        <body style="margin:0;padding:0;background:#edf2fc;font-family:Arial,Helvetica,sans-serif;">
          <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
            Your PreSkool ERP two-step verification code.
          </div>

          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#edf2fc;margin:0;padding:32px 12px;">
            <tr>
              <td align="center">
                <table
                  role="presentation"
                  cellpadding="0"
                  cellspacing="0"
                  width="100%"
                  style="
                    max-width:500px;
                    background:#ffffff;
                    border:1px solid #d9e2f2;
                    border-radius:22px;
                    overflow:hidden;
                  "
                >
                  <tr>
                    <td style="padding:20px 24px 10px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="left" style="vertical-align:middle;">
                            <table role="presentation" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="vertical-align:middle;">
                                  <img
                                    src="${logoUrl}"
                                    alt="PreSkool ERP"
                                    width="28"
                                    height="28"
                                    style="display:block;width:28px;height:28px;object-fit:contain;"
                                  />
                                </td>
                                <td style="padding-left:10px;vertical-align:middle;">
                                  <div style="font-size:18px;font-weight:800;line-height:1.1;color:#10224d;">
                                    PreSkool ERP
                                  </div>
                                  <div style="font-size:13px;font-weight:600;color:#60708f;padding-top:2px;">
                                    Account protection
                                  </div>
                                </td>
                              </tr>
                            </table>
                          </td>

                          <td align="right" style="vertical-align:middle;">
                            <span
                              style="
                                display:inline-block;
                                background:#eef2ff;
                                color:#3b5bdb;
                                font-size:13px;
                                font-weight:700;
                                padding:10px 16px;
                                border-radius:999px;
                              "
                            >
                              2-Step Verification
                            </span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:6px 24px 0;">
                      <div
                        style="
                          background:#eef3fb;
                          border-radius:18px;
                          padding:26px 20px;
                          text-align:center;
                        "
                      >
                        <img
                          src="${heroImageUrl}"
                          alt="Two-step verification"
                          width="220"
                          style="max-width:220px;width:100%;height:auto;display:block;margin:0 auto;"
                        />
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:22px 28px 8px;text-align:center;">
                      <h1
                        style="
                          margin:0 0 14px;
                          color:#3d5ee1;
                          font-size:28px;
                          line-height:1.2;
                          font-weight:800;
                        "
                      >
                        Verify your identity
                      </h1>

                      <p style="margin:0 0 10px;color:#44516a;font-size:16px;line-height:1.75;">
                        Hi <strong>${safeName}</strong>, use the following verification code
                        to complete your PreSkool ERP sign in.
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:4px 28px 8px;">
                      <div
                        style="
                          margin:0 auto;
                          max-width:280px;
                          background:#f3f6ff;
                          border:1px solid #d9e2f2;
                          border-radius:16px;
                          text-align:center;
                          padding:18px 14px;
                        "
                      >
                        <div
                          style="
                            color:#60708f;
                            font-size:13px;
                            font-weight:700;
                            text-transform:uppercase;
                            letter-spacing:0.08em;
                            margin-bottom:10px;
                          "
                        >
                          Verification Code
                        </div>
                        <div
                          style="
                            color:#10224d;
                            font-size:34px;
                            font-weight:800;
                            letter-spacing:8px;
                            line-height:1.2;
                          "
                        >
                          ${safeOtp}
                        </div>
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:8px 28px 16px;text-align:center;">
                      <p style="margin:0;color:#44516a;font-size:15px;line-height:1.8;">
                        This code expires in <strong>10 minutes</strong>. Do not share it
                        with anyone.
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td
                      style="
                        padding:16px 20px;
                        border-top:1px solid #dfe7f2;
                        text-align:center;
                        background:#f9fbff;
                      "
                    >
                      <p style="margin:0;color:#7584a2;font-size:13px;line-height:1.6;">
                        © 2026 PreSkool ERP. Automated login security email.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  private getAssetUrl(path: string): string {
    const baseUrl = (this.frontendUrl || '').replace(/\/+$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
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
