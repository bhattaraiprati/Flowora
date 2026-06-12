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
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const baseUrl = this.config.get<string>('app.apiUrl');
    const verifyLink = `${baseUrl}/api/auth/verify-email?token=${token}`;

    await this.transporter.sendMail({
      from: this.config.get<string>('mail.user'),
      to,
      subject: 'Saas-PM - Verify Your Email',
      html: `
        <h2>Welcome to Saas-PM!</h2>
        <p>Please verify your email by clicking below:</p>
        <a href="${verifyLink}" style="display:inline-block;padding:10px 20px;background-color:#007bff;color:#fff;text-decoration:none;border-radius:5px;">
          Verify Email
        </a>
        <p>If you did not create this account, please ignore this email.</p>
      `,
    });
  }
}