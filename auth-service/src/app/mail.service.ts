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

    return this.buildEmailShell({
      subtitle: 'Secure account recovery',
      imageUrl: this.getAssetUrl('/assets/images/auth/forgot-password.png'),
      imageAlt: 'Forgot password',
      title: 'Reset your password',
      content: `
        <p style="margin:0 0 12px;color:#42526e;font-size:15px;line-height:1.75;text-align:center;">
          Hi <strong>${safeName}</strong>, we received a request to reset your
          PreSkool ERP password.
        </p>

        <p style="margin:0;color:#42526e;font-size:15px;line-height:1.75;text-align:center;">
          Click the button below to create a new password. This link expires in
          <strong>30 minutes</strong>.
        </p>

        <div style="text-align:center;margin:24px 0 18px;">
          <a
            href="${safeResetUrl}"
            style="
              display:inline-block;
              background:#3d5ee1;
              color:#ffffff;
              text-decoration:none;
              font-size:15px;
              font-weight:800;
              padding:14px 34px;
              border-radius:12px;
              min-width:180px;
              box-sizing:border-box;
            "
          >
            Reset Password
          </a>
        </div>

        <p style="margin:0 0 18px;color:#8190ad;font-size:13px;line-height:1.7;text-align:center;">
          If you did not request this, you can safely ignore this email.
        </p>

        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td
              style="
                background:#f8fafd;
                border:1px solid #d9e2f2;
                border-radius:14px;
                padding:14px 16px;
              "
            >
              <p style="margin:0 0 8px;color:#5f6f91;font-size:13px;font-weight:800;line-height:1.5;">
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
            </td>
          </tr>
        </table>
      `,
      footer: '© 2026 PreSkool ERP. Automated security email.',
    });
  }

  private buildTwoStepVerificationTemplate(name: string, otp: string): string {
    const safeName = this.escapeHtml(name || 'User');
    const safeOtp = this.escapeHtml(otp);

    return this.buildEmailShell({
      subtitle: 'Account protection',
      imageUrl: this.getAssetUrl(
        '/assets/images/auth/two-step-verification.png',
      ),
      imageAlt: 'Two-step verification',
      title: 'Verify your identity',
      content: `
        <p style="margin:0 0 18px;color:#42526e;font-size:15px;line-height:1.75;text-align:center;">
          Hi <strong>${safeName}</strong>, use the following verification code
          to complete your PreSkool ERP sign in.
        </p>

        <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 18px;">
          <tr>
            <td
              align="center"
              style="
                background:#eef3ff;
                border:1px solid #d9e2f2;
                border-radius:16px;
                padding:18px 26px;
                min-width:240px;
              "
            >
              <div
                style="
                  color:#60708f;
                  font-size:12px;
                  font-weight:800;
                  text-transform:uppercase;
                  letter-spacing:1.2px;
                  margin-bottom:8px;
                "
              >
                Verification Code
              </div>

              <div
                style="
                  color:#3d5ee1;
                  font-size:34px;
                  font-weight:900;
                  letter-spacing:8px;
                  line-height:1.15;
                "
              >
                ${safeOtp}
              </div>
            </td>
          </tr>
        </table>

        <p style="margin:0;color:#42526e;font-size:14px;line-height:1.75;text-align:center;">
          This code expires in <strong>10 minutes</strong>. Do not share it
          with anyone.
        </p>
      `,
      footer: '© 2026 PreSkool ERP. Automated login security email.',
    });
  }

  private buildEmailShell(params: {
    subtitle: string;
    imageUrl: string;
    imageAlt: string;
    title: string;
    content: string;
    footer: string;
  }): string {
    const logoUrl = this.getAssetUrl('/assets/logos/preskool-logo.png');
    const safeLogoUrl = this.escapeHtml(logoUrl);
    const safeImageUrl = this.escapeHtml(params.imageUrl);
    const safeImageAlt = this.escapeHtml(params.imageAlt);

    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>PreSkool ERP</title>
        </head>

        <body style="margin:0;padding:0;background:#edf2fc;font-family:Arial,Helvetica,sans-serif;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#edf2fc;margin:0;padding:24px 10px;">
            <tr>
              <td align="center">
                <table
                  role="presentation"
                  cellpadding="0"
                  cellspacing="0"
                  width="100%"
                  style="
                    max-width:480px;
                    background:#ffffff;
                    border:1px solid #d9e2f2;
                    border-radius:20px;
                    overflow:hidden;
                  "
                >
                  <tr>
                    <td style="padding:20px 26px 6px;">
                      <table role="presentation" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="vertical-align:middle;">
                            <img
                              src="${safeLogoUrl}"
                              alt="PreSkool ERP"
                              width="40"
                              height="40"
                              style="display:block;width:40px;height:40px;object-fit:contain;border:0;margin:0;"
                            />
                          </td>

                          <td style="padding-left:5px;vertical-align:middle;">
                            <div style="font-size:22px;font-weight:900;line-height:1.05;color:#10224d;">
                              PreSkool ERP
                            </div>

                            <div style="font-size:13px;font-weight:700;color:#60708f;padding-top:3px;line-height:1.25;">
                              ${params.subtitle}
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td align="center" style="padding:10px 26px 4px;">
                      <img
                        src="${safeImageUrl}"
                        alt="${safeImageAlt}"
                        width="300"
                        style="
                          display:block;
                          width:100%;
                          max-width:300px;
                          height:auto;
                          border:0;
                          outline:none;
                          text-decoration:none;
                          margin:0 auto;
                        "
                      />
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:12px 28px 24px;">
                      <h1
                        style="
                          margin:0 0 14px;
                          color:#3d5ee1;
                          font-size:29px;
                          line-height:1.2;
                          font-weight:900;
                          text-align:center;
                        "
                      >
                        ${params.title}
                      </h1>

                      ${params.content}
                    </td>
                  </tr>

                  <tr>
                    <td
                      style="
                        padding:14px 20px;
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
      .replace(/</g, '&amp;lt;')
      .replace(/>/g, '&amp;gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
