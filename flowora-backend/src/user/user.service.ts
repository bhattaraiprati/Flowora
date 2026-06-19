import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../models/user.model';
import { Organization } from '../models/organization.model';
import { OrganizationMember } from '../models/organizationMember.model';
import { OrgMemberRole, OrgMemberStatus, UserRole, UserStatus } from '../common/enums';
import { RegisterOrganization } from '../common/interface';
import { VerifyEmailJobData } from '../queue/verify-email.processor';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(Organization) private readonly orgModel: typeof Organization,
    @InjectModel(OrganizationMember) private readonly memberModel: typeof OrganizationMember,
    @InjectQueue('verify-email-processing') private readonly emailQueue: Queue,
  ) {}

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

  async registerOrganizer(dto: RegisterOrganization): Promise<{ message: string }> {
    const email = dto.email.toLowerCase().trim();
    const slug = dto.slug.toLowerCase().trim();

    // 1. Validate uniqueness
    const [existingUser, existingOrg] = await Promise.all([
      this.userModel.findOne({ where: { email } }),
      this.orgModel.findOne({ where: { slug } }),
    ]);

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    if (existingOrg) {
      throw new ConflictException('Organization slug is already taken');
    }

    // 2. Prepare user properties
    const hashedPassword = await bcrypt.hash(dto.password, 12); // Use 12 rounds for better security
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const profilePicture = this.generateGravatarUrl(email);

    // 3. Execute database operations in a transaction
    return await this.userModel.sequelize!.transaction(async (transaction) => {
      // Create Organization
      const organization = await this.orgModel.create(
        {
          name: dto.organizatioName,
          slug,
          industry: dto.industry,
          size: dto.teamSize,
          website: dto.website || null,
          description: dto.description || null,
        },
        { transaction },
      );

      // Create User as ADMIN
      const user = await this.userModel.create(
        {
          name: dto.name,
          email,
          password: hashedPassword,
          role: UserRole.ADMIN,
          profile_picture: profilePicture,
          is_verified: false,
          verification_token: verificationToken,
          status: UserStatus.INACTIVE,
        },
        { transaction },
      );

      // Create OrganizationMember relationship
      await this.memberModel.create(
        {
          org_id: organization.id,
          user_id: user.id,
          role: OrgMemberRole.OWNER,
          status: OrgMemberStatus.ACTIVE,
        },
        { transaction },
      );

      // 4. Queue verification email (outside transaction to avoid rollback issues)
      await this.emailQueue.add('send-verification-email', {
        userId: user.id,
        email,
        verificationToken,
      } as VerifyEmailJobData);

      return {
        message: 'Organization registered successfully. Please check your email to verify your admin account.',
      };
    });
  }
}
