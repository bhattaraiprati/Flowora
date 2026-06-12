import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MailService } from '../mail/mail.service';

export interface VerifyEmailJobData {
  userId: string;
  email: string;
  verificationToken: string;
}

@Processor('verify-email-processing', { concurrency: 5 })
export class VerifyEmailProcessor extends WorkerHost {
  constructor(private mailService: MailService) {
    super();
  }

  async process(job: Job<VerifyEmailJobData>): Promise<void> {
    const { email, verificationToken } = job.data;
    console.log(`[Job ${job.id}] Sending verification email to: ${email}`);

    
    await job.updateProgress(50);
    await this.mailService.sendVerificationEmail(email, verificationToken);
    await job.updateProgress(100);

    console.log(`[Job ${job.id}] Email sent to: ${email}`);
  }
}