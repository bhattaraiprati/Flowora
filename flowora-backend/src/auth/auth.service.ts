import { ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../models/user.model';
import { Organization } from '../models/organization.model';
import { UserRole, UserStatus, OrganizationStatus } from '../common/enums';
import { VerifyEmailJobData } from '../queue/verify-email.processor';

interface JwtPayload {
  sub: string; // Standard JWT claim for subject (user ID)
  email: string;
  name: string;
  role: UserRole;
  organizationId: string | null;
  iat?: number; // Issued at (automatically added by JWT)
  exp?: number; // Expiration (automatically added by JWT)
}

interface AuthTokenResponse {
  token: string;
  expiresIn: string;
  expiresAt: number; // Unix timestamp
}

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User) private readonly userModel: typeof User,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectQueue('verify-email-processing') private readonly emailQueue: Queue,
  ) {}

  /**
   * Generate JWT access token with proper payload structure
   */
  private generateAccessToken(user: User, organizationId: string): AuthTokenResponse {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: organizationId || null,
    };

    const expiresIn = this.configService.get<string>('jwt.expiresIn', '5h');
    const token = this.jwtService.sign(payload);

    // Calculate expiration timestamp for frontend
    const expiresAt = Math.floor(Date.now() / 1000) + this.parseExpirationToSeconds(expiresIn);

    return {
      token,
      expiresIn,
      expiresAt,
    };
  }

  /**
   * Convert expiration string (e.g., '5h', '30m', '7d') to seconds
   */
  private parseExpirationToSeconds(expiration: string): number {
    const unit = expiration.slice(-1);
    const value = parseInt(expiration.slice(0, -1), 10);

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 18000; // Default 5 hours
    }
  }

  /**
   * Generate Gravatar URL from email
   */
  private generateGravatarUrl(email: string): string {
    const emailHash = crypto
      .createHash('md5')
      .update(email.toLowerCase().trim())
      .digest('hex');
    return `https://www.gravatar.com/avatar/${emailHash}?d=robohash`;
  }

  async signup(name: string, email: string, password: string): Promise<{ message: string }> {
    const normalizedEmail = email.toLowerCase().trim();

    // Check for existing user
    const existing = await this.userModel.findOne({ where: { email: normalizedEmail } });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    // Determine role (first user becomes SUPER_ADMIN)
    const userCount = await this.userModel.count();
    const role = userCount === 0 ? UserRole.SUPER_ADMIN : UserRole.USER;

    // Hash password with secure rounds
    const hashedPassword = await bcrypt.hash(password, 12);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const profilePicture = this.generateGravatarUrl(normalizedEmail);

    // Create user
    const user = await this.userModel.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role,
      profile_picture: profilePicture,
      is_verified: false,
      verification_token: verificationToken,
      status: UserStatus.INACTIVE,
    });

    // Queue verification email
    await this.emailQueue.add('send-verification-email', {
      userId: user.id,
      email: normalizedEmail,
      verificationToken,
    } as VerifyEmailJobData);

    return {
      message: 'User registered successfully. Please check your email to verify your account.',
    };
  }

  async login(email: string, password: string): Promise<{
    user: {
      id: string;
      name: string;
      email: string;
      role: UserRole;
      organizationId: string | null;
    };
    token: string;
    expiresIn: string;
    expiresAt: number;
    message: string;
  }> {
    const normalizedEmail = email.toLowerCase().trim();

    // Fetch user with organizations
    const user = await this.userModel.findOne({
      where: { email: normalizedEmail },
      include: [{ model: Organization, through: { attributes: [] } }],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check email verification
    if (!user.is_verified) {
      throw new ForbiddenException('Please verify your email before logging in.');
    }

    // Check user status
    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('Your account is not active. Please contact support.');
    }

    // Validate organization status
    if (user.organizations && user.organizations.length > 0) {
      const org = user.organizations[0];
      if (org.status !== OrganizationStatus.ACTIVE) {
        const statusMessages = {
          [OrganizationStatus.PENDING_APPROVAL]: 'Your organization is pending approval by the super admin.',
          [OrganizationStatus.REJECTED]: 'Your organization registration has been rejected.',
          [OrganizationStatus.SUSPENDED]: 'Your organization has been suspended.',
        };
        throw new ForbiddenException(statusMessages[org.status] || 'Your organization is not active.');
      }
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const organizationId = user.organizations?.[0]?.id;
    const tokenData = this.generateAccessToken(user, organizationId);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId,
      },
      token: tokenData.token,
      expiresIn: tokenData.expiresIn,
      expiresAt: tokenData.expiresAt,
      message: 'Login successful',
    };
  }

  async verifyEmail(token: string): Promise<{ redirect: string; message: string }> {
    if (!token) {
      throw new NotFoundException('Verification token is required');
    }

    const user = await this.userModel.findOne({
      where: { verification_token: token },
    });

    if (!user) {
      throw new NotFoundException('Invalid or expired verification token');
    }

    if (user.is_verified) {
      throw new ConflictException('Email is already verified');
    }

    // Update user status
    await user.update({
      is_verified: true,
      verification_token: null,
      status: UserStatus.ACTIVE,
    });

    const redirectUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');

    return {
      redirect: `${redirectUrl}/login`,
      message: 'Email verified successfully. You can now log in.',
    };
  }
}