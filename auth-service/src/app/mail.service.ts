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
      this.getAssetUrl('/assets/images/auth/forgot-password.png'),
    );

    return this.buildEmailShell({
      subtitle: 'Secure account recovery',
      heroImageUrl,
      heroAlt: 'Forgot password',
      title: 'Reset your password',
      body: `
        <p style="margin:0 0 10px;color:#44516a;font-size:15px;line-height:1.7;text-align:center;">
          Hi <strong>${safeName}</strong>, we received a request to reset your
          PreSkool ERP password.
        </p>

        <p style="margin:0;color:#44516a;font-size:15px;line-height:1.7;text-align:center;">
          Click the button below to create a new password. This link expires in
          <strong>30 minutes</strong>.
        </p>

        <div style="text-align:center;margin:24px 0 14px;">
          <a
            href="${safeResetUrl}"
            style="
              display:inline-block;
              min-width:172px;
              background:#3d5ee1;
              color:#ffffff;
              text-decoration:none;
              font-size:15px;
              font-weight:800;
              padding:13px 24px;
              border-radius:11px;
            "
          >
            Reset Password
          </a>
        </div>

        <p style="margin:0 0 16px;color:#8a97b3;font-size:14px;line-height:1.7;text-align:center;">
          If you did not request this, you can safely ignore this email.
        </p>

        <div
          style="
            border:1px solid #d9e2f2;
            border-radius:13px;
            background:#f8fafd;
            padding:13px 15px;
          "
        >
          <p style="margin:0 0 8px;color:#60708f;font-size:13px;font-weight:800;">
            Button not working? Copy this link:
          </p>
          <p style="margin:0;word-break:break-word;">
            <a
              href="${safeResetUrl}"
              style="color:#2563eb;font-size:12px;line-height:1.7;text-decoration:underline;"
            >
              ${safeResetUrl}
            </a>
          </p>
        </div>
      `,
      footer: '© 2026 PreSkool ERP. Automated security email.',
      logoUrl,
    });
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

    return this.buildEmailShell({
      subtitle: 'Account protection',
      heroImageUrl,
      heroAlt: 'Two-step verification',
      title: 'Verify your identity',
      body: `
        <p style="margin:0 0 14px;color:#44516a;font-size:15px;line-height:1.7;text-align:center;">
          Hi <strong>${safeName}</strong>, use the following verification code
          to complete your PreSkool ERP sign in.
        </p>

        <div
          style="
            margin:20px auto 18px;
            max-width:250px;
            background:#eef3ff;
            border:1px solid #d9e2f2;
            border-radius:15px;
            text-align:center;
            padding:17px 14px;
          "
        >
          <div
            style="
              color:#60708f;
              font-size:12px;
              font-weight:800;
              text-transform:uppercase;
              letter-spacing:0.08em;
              margin-bottom:9px;
            "
          >
            Verification Code
          </div>

          <div
            style="
              color:#3d5ee1;
              font-size:32px;
              font-weight:900;
              letter-spacing:8px;
              line-height:1.2;
            "
          >
            ${safeOtp}
          </div>
        </div>

        <p style="margin:0;color:#44516a;font-size:14px;line-height:1.8;text-align:center;">
          This code expires in <strong>10 minutes</strong>. Do not share it
          with anyone.
        </p>
      `,
      footer: '© 2026 PreSkool ERP. Automated login security email.',
      logoUrl,
    });
  }

  private buildEmailShell(params: {
    subtitle: string;
    heroImageUrl: string;
    heroAlt: string;
    title: string;
    body: string;
    footer: string;
    logoUrl: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>PreSkool ERP</title>
        </head>

        <body style="margin:0;padding:0;background:#edf2fc;font-family:Arial,Helvetica,sans-serif;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#edf2fc;margin:0;padding:22px 10px;">
            <tr>
              <td align="center">
                <table
                  role="presentation"
                  cellpadding="0"
                  cellspacing="0"
                  width="100%"
                  style="
                    max-width:430px;
                    background:#ffffff;
                    border:1px solid #d9e2f2;
                    border-radius:19px;
                    overflow:hidden;
                  "
                >
                  <tr>
                    <td style="padding:18px 22px 8px;">
                      <table role="presentation" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="vertical-align:middle;">
                            <img
                              src="${params.logoUrl}"
                              alt="PreSkool ERP"
                              width="36"
                              height="36"
                              style="display:block;width:36px;height:36px;object-fit:contain;"
                            />
                          </td>

                          <td style="padding-left:6px;vertical-align:middle;">
                            <div style="font-size:20px;font-weight:900;line-height:1.05;color:#10224d;">
                              PreSkool ERP
                            </div>
                            <div style="font-size:13px;font-weight:700;color:#60708f;padding-top:2px;">
                              ${params.subtitle}
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:4px 22px 0;">
                      <div
                        style="
                          height:132px;
                          background:#eef3fb;
                          border-radius:16px;
                          text-align:center;
                          overflow:hidden;
                        "
                      >
                        <img
                          src="${params.heroImageUrl}"
                          alt="${params.heroAlt}"
                          width="210"
                          style="
                            display:block;
                            max-width:210px;
                            width:82%;
                            height:auto;
                            margin:13px auto 0;
                            border:0;
                          "
                        />
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:20px 24px 10px;text-align:center;">
                      <h1
                        style="
                          margin:0 0 14px;
                          color:#3d5ee1;
                          font-size:27px;
                          line-height:1.2;
                          font-weight:900;
                        "
                      >
                        ${params.title}
                      </h1>

                      ${params.body}
                    </td>
                  </tr>

                  <tr>
                    <td
                      style="
                        padding:14px 18px;
                        border-top:1px solid #dfe7f2;
                        text-align:center;
                        background:#f9fbff;
                      "
                    >
                      <p style="margin:0;color:#7584a2;font-size:12px;line-height:1.6;">
                        ${params.footer}
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
