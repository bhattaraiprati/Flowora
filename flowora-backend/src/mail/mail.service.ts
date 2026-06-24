import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.config.get<string>('mail.user'),
        pass: this.config.get<string>('mail.pass'),
      },
    });

    // Test connection on startup (very useful)
    this.verifyTransporter();
  }

  private async verifyTransporter() {
    try {
      await this.transporter.verify();
      console.log('✅ Mail transporter verified successfully');
    } catch (err) {
      console.error('❌ Mail transporter verification failed:', err);
    }
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const baseUrl = this.config.get<string>('app.apiUrl') || 'http://localhost:5000';
    const verifyLink = `${baseUrl}/api/auth/verify-email?token=${token}`;

    const mailOptions = {
      from: `"Flowora" <${this.config.get<string>('mail.user')}>`,
      to,
      subject: 'Flowora - Verify Your Email',
      html: `
        <h2>Welcome to Flowora!</h2>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${verifyLink}" style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">Verify Email</a>
        <p>If you did not create this account, please ignore this email.</p>
      `,
    };

    console.log(`[MailService] Attempting to send email to ${to}`);

    const info = await this.transporter.sendMail(mailOptions);
    console.log(`[MailService] Message sent: ${info.messageId}`);
  }

  async sendInvitationEmail(
    to: string,
    inviterName: string,
    organizationName: string,
    projectName: string | null,
    role: string,
    inviteLink: string,
    scope: 'ORGANIZATION' | 'PROJECT',
  ): Promise<void> {
    const scopeText = scope === 'ORGANIZATION' ? 'organization' : 'project';
    const targetName = scope === 'ORGANIZATION' ? organizationName : projectName || 'the project';

    const mailOptions = {
      from: `"Flowora" <${this.config.get<string>('mail.user')}>`,
      to,
      subject: `You've been invited to join ${targetName} on Flowora`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #ffffff;
              border-radius: 8px;
              padding: 32px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 32px;
            }
            .logo {
              font-size: 32px;
              font-weight: bold;
              color: #6366f1;
              margin-bottom: 8px;
            }
            .title {
              font-size: 24px;
              font-weight: 600;
              color: #1f2937;
              margin-bottom: 16px;
            }
            .content {
              margin-bottom: 32px;
            }
            .info-box {
              background-color: #f3f4f6;
              border-left: 4px solid #6366f1;
              padding: 16px;
              margin: 24px 0;
              border-radius: 4px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
            }
            .info-label {
              font-weight: 600;
              color: #6b7280;
            }
            .info-value {
              color: #1f2937;
              font-weight: 500;
            }
            .button {
              display: inline-block;
              padding: 14px 32px;
              background-color: #6366f1;
              color: white;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              text-align: center;
              margin: 24px 0;
            }
            .button:hover {
              background-color: #4f46e5;
            }
            .footer {
              margin-top: 32px;
              padding-top: 24px;
              border-top: 1px solid #e5e7eb;
              font-size: 14px;
              color: #6b7280;
              text-align: center;
            }
            .link {
              color: #6366f1;
              word-break: break-all;
            }
            .expiry-notice {
              background-color: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 12px;
              margin: 16px 0;
              border-radius: 4px;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🚀 Flowora</div>
              <h1 class="title">You've been invited!</h1>
            </div>

            <div class="content">
              <p>Hi there,</p>
              <p><strong>${inviterName}</strong> has invited you to join <strong>${targetName}</strong> as a <strong>${role}</strong>.</p>

              <div class="info-box">
                <div class="info-row">
                  <span class="info-label">Organization:</span>
                  <span class="info-value">${organizationName}</span>
                </div>
                ${
                  projectName
                    ? `
                <div class="info-row">
                  <span class="info-label">Project:</span>
                  <span class="info-value">${projectName}</span>
                </div>
                `
                    : ''
                }
                <div class="info-row">
                  <span class="info-label">Role:</span>
                  <span class="info-value">${role}</span>
                </div>
              </div>

              <p style="text-align: center;">
                <a href="${inviteLink}" class="button">Accept Invitation</a>
              </p>

              <div class="expiry-notice">
                ⏰ <strong>Important:</strong> This invitation will expire in 7 days. Please accept it before then.
              </div>

              <p style="font-size: 14px; color: #6b7280;">
                Or copy and paste this link in your browser:<br>
                <a href="${inviteLink}" class="link">${inviteLink}</a>
              </p>
            </div>

            <div class="footer">
              <p>If you don't want to accept this invitation, you can ignore this email.</p>
              <p>If you weren't expecting this invitation, please contact the sender.</p>
              <p style="margin-top: 16px;">© 2026 Flowora. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    console.log(`[MailService] Sending invitation email to ${to}`);

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`[MailService] Invitation email sent: ${info.messageId}`);
    } catch (error) {
      console.error(`[MailService] Failed to send invitation email to ${to}:`, error);
      // Don't throw error - invitation still works without email
    }
  }

  async sendInvitationAcceptedEmail(
    to: string,
    acceptedByName: string,
    acceptedByEmail: string,
    organizationName: string,
    projectName: string | null,
    scope: 'ORGANIZATION' | 'PROJECT',
  ): Promise<void> {
    const scopeText = scope === 'ORGANIZATION' ? 'organization' : 'project';
    const targetName = scope === 'ORGANIZATION' ? organizationName : projectName || 'the project';

    const mailOptions = {
      from: `"Flowora" <${this.config.get<string>('mail.user')}>`,
      to,
      subject: `${acceptedByName} accepted your invitation to ${targetName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #ffffff;
              border-radius: 8px;
              padding: 32px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            .success-icon {
              text-align: center;
              font-size: 48px;
              margin-bottom: 16px;
            }
            .title {
              font-size: 24px;
              font-weight: 600;
              color: #1f2937;
              text-align: center;
              margin-bottom: 24px;
            }
            .info-box {
              background-color: #f0fdf4;
              border-left: 4px solid #10b981;
              padding: 16px;
              margin: 24px 0;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success-icon">✅</div>
            <h1 class="title">Invitation Accepted!</h1>

            <p>Good news!</p>
            <p><strong>${acceptedByName}</strong> (${acceptedByEmail}) has accepted your invitation to join <strong>${targetName}</strong>.</p>

            <div class="info-box">
              <p style="margin: 0;">They are now an active member and can start collaborating right away.</p>
            </div>

            <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 32px;">
              © 2026 Flowora. All rights reserved.
            </p>
          </div>
        </body>
        </html>
      `,
    };

    console.log(`[MailService] Sending acceptance notification to ${to}`);

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`[MailService] Acceptance notification sent: ${info.messageId}`);
    } catch (error) {
      console.error(`[MailService] Failed to send acceptance notification to ${to}:`, error);
    }
  }
}