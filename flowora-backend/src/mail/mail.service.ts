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
      from: `"Saas-PM" <${this.config.get<string>('mail.user')}>`,
      to,
      subject: 'Saas-PM - Verify Your Email',
      html: `
        <h2>Welcome to Saas-PM!</h2>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${verifyLink}" style="...">Verify Email</a>
        <p>If you did not create this account, please ignore this email.</p>
      `,
    };

    console.log(`[MailService] Attempting to send email to ${to}`);

    const info = await this.transporter.sendMail(mailOptions);
    console.log(`[MailService] Message sent: ${info.messageId}`);
  }
}