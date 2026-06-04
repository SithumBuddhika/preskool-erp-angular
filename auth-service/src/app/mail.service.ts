import { existsSync } from 'fs';
import { join } from 'path';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

type MailAttachment = {
  filename: string;
  path: string;
  cid: string;
};

type BrandAssets = {
  attachments: MailAttachment[];
  hasLogo: boolean;
  hasResetImage: boolean;
  hasTwoStepImage: boolean;
};

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
    const assets = this.getBrandAssets({
      includeResetImage: true,
      includeTwoStepImage: false,
    });

    await this.transporter.sendMail({
      from: this.mailFrom,
      to,
      subject: 'Reset your PreSkool ERP password',
      attachments: assets.attachments,
      html: `
        <!doctype html>
        <html>
          <body style="margin:0; padding:0; background:#edf3ff; font-family:Arial, Helvetica, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#edf3ff; padding:20px 12px;">
              <tr>
                <td align="center">
                  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:455px; background:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #dbe6f6; box-shadow:0 12px 30px rgba(15,23,42,0.10);">

                    <tr>
                      <td style="padding:16px 24px 12px; background:#ffffff;">
                        <table cellpadding="0" cellspacing="0" align="center">
                          <tr>
                            <td style="vertical-align:middle;">
                              ${this.logoHtml(assets.hasLogo)}
                            </td>

                            <td style="vertical-align:middle; padding-left:5px;">
                              <div style="color:#07173a; font-size:23px; line-height:1; font-weight:900; letter-spacing:-0.6px;">
                                PreSkool ERP
                              </div>
                              <div style="margin-top:3px; color:#64748b; font-size:11px; line-height:1.2; font-weight:700;">
                                Secure account recovery
                              </div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <tr>
                      <td style="padding:0 24px;">
                        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f8ff; border-radius:14px;">
                          <tr>
                            <td align="center" style="padding:14px 14px;">
                              ${this.resetImageHtml(assets.hasResetImage)}
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <tr>
                      <td style="padding:18px 34px 6px; text-align:center;">
                        <h1 style="margin:0; color:#3d5ee1; font-size:24px; line-height:1.2; font-weight:900; letter-spacing:-0.4px;">
                          Reset your password
                        </h1>

                        <p style="margin:11px 0 0; color:#334155; font-size:13px; line-height:1.55;">
                          Hi <strong>${this.escapeHtml(fullName)}</strong>, we received a request to reset your PreSkool ERP password.
                        </p>

                        <p style="margin:7px 0 0; color:#475569; font-size:12.5px; line-height:1.55;">
                          Click the button below to create a new password. This link expires in <strong>30 minutes</strong>.
                        </p>

                        <a href="${resetLink}"
                          style="display:inline-block; margin:15px 0 10px; background:#3d5ee1; color:#ffffff; padding:11px 28px; border-radius:8px; text-decoration:none; font-size:13px; font-weight:900; box-shadow:0 9px 18px rgba(61,94,225,0.20);">
                          Reset Password
                        </a>

                        <p style="margin:0; color:#94a3b8; font-size:11px; line-height:1.45;">
                          If you did not request this, you can safely ignore this email.
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td style="padding:12px 26px 18px;">
                        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:10px 12px;">
                          <div style="color:#64748b; font-size:10.5px; line-height:1.45; font-weight:800;">
                            Button not working? Copy this link:
                          </div>

                          <div style="margin-top:4px; color:#3d5ee1; font-size:10.5px; line-height:1.45; word-break:break-all;">
                            ${resetLink}
                          </div>
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <td style="background:#f8fafc; border-top:1px solid #e5ebf5; padding:10px 18px; text-align:center;">
                        <div style="color:#64748b; font-size:10.5px; line-height:1.4;">
                          © 2026 PreSkool ERP. Automated security email.
                        </div>
                      </td>
                    </tr>

                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });
  }

  async sendLoginOtpEmail(
    to: string,
    fullName: string,
    otp: string,
  ): Promise<void> {
    const assets = this.getBrandAssets({
      includeResetImage: false,
      includeTwoStepImage: true,
    });

    await this.transporter.sendMail({
      from: this.mailFrom,
      to,
      subject: 'Your PreSkool ERP verification code',
      attachments: assets.attachments,
      html: `
        <!doctype html>
        <html>
          <body style="margin:0; padding:0; background:#edf3ff; font-family:Arial, Helvetica, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#edf3ff; padding:20px 12px;">
              <tr>
                <td align="center">
                  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:455px; background:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #dbe6f6; box-shadow:0 12px 30px rgba(15,23,42,0.10);">

                    <tr>
                      <td style="padding:16px 24px 12px; background:#ffffff;">
                        <table cellpadding="0" cellspacing="0" align="center">
                          <tr>
                            <td style="vertical-align:middle;">
                              ${this.logoHtml(assets.hasLogo)}
                            </td>

                            <td style="vertical-align:middle; padding-left:5px;">
                              <div style="color:#07173a; font-size:23px; line-height:1; font-weight:900; letter-spacing:-0.6px;">
                                PreSkool ERP
                              </div>
                              <div style="margin-top:3px; color:#64748b; font-size:11px; line-height:1.2; font-weight:700;">
                                Secure login verification
                              </div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <tr>
                      <td style="padding:0 24px;">
                        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f8ff; border-radius:14px;">
                          <tr>
                            <td align="center" style="padding:14px 14px;">
                              ${this.twoStepImageHtml(assets.hasTwoStepImage)}
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <tr>
                      <td style="padding:18px 34px 22px; text-align:center;">
                        <h1 style="margin:0; color:#3d5ee1; font-size:24px; line-height:1.2; font-weight:900; letter-spacing:-0.4px;">
                          Verify your login
                        </h1>

                        <p style="margin:11px 0 0; color:#334155; font-size:13px; line-height:1.55;">
                          Hi <strong>${this.escapeHtml(fullName)}</strong>, use this code to complete your PreSkool ERP login.
                        </p>

                        <div style="margin:15px auto 10px; max-width:235px; background:#eef4ff; border:1px solid #d7e3ff; color:#3d5ee1; border-radius:13px; padding:14px 18px; font-size:32px; line-height:1; letter-spacing:8px; font-weight:900;">
                          ${otp}
                        </div>

                        <p style="margin:0; color:#64748b; font-size:11.5px; line-height:1.45;">
                          This code expires in <strong>10 minutes</strong>.
                        </p>

                        <p style="margin:8px 0 0; color:#f04438; font-size:11.5px; line-height:1.45;">
                          If you did not try to login, reset your password immediately.
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td style="background:#f8fafc; border-top:1px solid #e5ebf5; padding:10px 18px; text-align:center;">
                        <div style="color:#64748b; font-size:10.5px; line-height:1.4;">
                          © 2026 PreSkool ERP. Automated security email.
                        </div>
                      </td>
                    </tr>

                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });
  }

  private getBrandAssets(options: {
    includeResetImage: boolean;
    includeTwoStepImage: boolean;
  }): BrandAssets {
    const attachments: MailAttachment[] = [];

    const logoPath = join(
      process.cwd(),
      'apps',
      'web',
      'public',
      'assets',
      'logos',
      'preskool-logo.png',
    );

    const resetImagePath = join(
      process.cwd(),
      'apps',
      'web',
      'public',
      'assets',
      'images',
      'auth',
      'reset-password.png',
    );

    const twoStepImagePath = join(
      process.cwd(),
      'apps',
      'web',
      'public',
      'assets',
      'images',
      'auth',
      'two-step-verification.png',
    );

    const hasLogo = existsSync(logoPath);
    const hasResetImage =
      options.includeResetImage && existsSync(resetImagePath);
    const hasTwoStepImage =
      options.includeTwoStepImage && existsSync(twoStepImagePath);

    if (hasLogo) {
      attachments.push({
        filename: 'preskool-logo.png',
        path: logoPath,
        cid: 'preskool-logo',
      });
    }

    if (hasResetImage) {
      attachments.push({
        filename: 'reset-password.png',
        path: resetImagePath,
        cid: 'reset-password-image',
      });
    }

    if (hasTwoStepImage) {
      attachments.push({
        filename: 'two-step-verification.png',
        path: twoStepImagePath,
        cid: 'two-step-verification-image',
      });
    }

    return {
      attachments,
      hasLogo,
      hasResetImage,
      hasTwoStepImage,
    };
  }

  private logoHtml(hasLogo: boolean): string {
    if (!hasLogo) {
      return `
        <div style="width:42px; height:42px; border-radius:12px; background:#eef4ff; color:#3d5ee1; display:inline-block; line-height:42px; text-align:center; font-size:20px; font-weight:900;">
          P
        </div>
      `;
    }

    return `
      <img
        src="cid:preskool-logo"
        alt="PreSkool"
        width="60"
        height="60"
        style="display:block; border:0; outline:none; text-decoration:none; object-fit:contain;"
      />
    `;
  }

  private resetImageHtml(hasResetImage: boolean): string {
    if (!hasResetImage) {
      return `
        <div style="color:#3d5ee1; font-size:42px; line-height:1;">
          🔐
        </div>
      `;
    }

    return `
      <img
        src="cid:reset-password-image"
        alt="Reset password"
        width="150"
        style="width:100%; max-width:150px; height:auto; display:block; margin:0 auto; border:0; outline:none; text-decoration:none;"
      />
    `;
  }

  private twoStepImageHtml(hasTwoStepImage: boolean): string {
    if (!hasTwoStepImage) {
      return `
        <div style="color:#3d5ee1; font-size:42px; line-height:1;">
          🔑
        </div>
      `;
    }

    return `
      <img
        src="cid:two-step-verification-image"
        alt="Two step verification"
        width="150"
        style="width:100%; max-width:150px; height:auto; display:block; margin:0 auto; border:0; outline:none; text-decoration:none;"
      />
    `;
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
