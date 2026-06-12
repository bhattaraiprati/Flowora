import { ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { JwtService } from '@nestjs/jwt';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../models/user.model';
import { UserRole, UserStatus } from '../common/enums';
import { VerifyEmailJobData } from '../queue/verify-email.processor';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User) private userModel: typeof User,
    private jwtService: JwtService,
    @InjectQueue('verify-email-processing') private emailQueue: Queue,
  ) {}

  async signup(name: string, email: string, password: string) {
    const existing = await this.userModel.findOne({ where: { email } });
    if (existing) throw new ConflictException('User already exists');

    const userCount = await this.userModel.count();
    const role = userCount === 0 ? UserRole.ADMIN : UserRole.USER;

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const emailHash = crypto.createHash('md5').update(email.toLowerCase().trim()).digest('hex');
    const profilePicture = `https://www.gravatar.com/avatar/${emailHash}?d=robohash`;

    const user = await this.userModel.create({
      name, email,
      password: hashedPassword,
      role,
      profile_picture: profilePicture,
      is_verified: false,
      verification_token: verificationToken,
      status: UserStatus.INACTIVE,
    } as any);

    await this.emailQueue.add('send-verification-email', {
      userId: user.id,
      email,
      verificationToken,
    } as VerifyEmailJobData, {
      jobId: `verify-${email}`,
    });

    return { message: 'User registered successfully. Please check your email to verify your account.' };
  }

  async login(email: string, password: string) {
    const user = await this.userModel.findOne({ where: { email } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.is_verified) throw new ForbiddenException('Please verify your email before logging in.');

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new UnauthorizedException('Invalid credentials');

    const token = this.jwtService.sign({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    return { token, message: 'Login successful' };
  }

  async verifyEmail(token: string) {
    const user = await this.userModel.findOne({ where: { verification_token: token } });
    if (!user) throw new NotFoundException('Invalid verification token');

    await user.update({
      is_verified: true,
      verification_token: null,
      status: UserStatus.ACTIVE,
    });

    return { redirect: 'http://localhost:5173/' };
  }
}