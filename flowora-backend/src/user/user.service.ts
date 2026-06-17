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

  async registerOrganizer(dto: RegisterOrganization) {
    const email = dto.email.toLowerCase().trim();
    const slug = dto.slug.toLowerCase().trim();

    const existingUser = await this.userModel.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const existingOrg = await this.orgModel.findOne({ where: { slug } });
    if (existingOrg) {
      throw new ConflictException('Organization slug is already taken');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const emailHash = crypto.createHash('md5').update(email).digest('hex');
    const profilePicture = `https://www.gravatar.com/avatar/${emailHash}?d=robohash`;

    return await this.userModel.sequelize!.transaction(async (t) => {
      const org = await this.orgModel.create(
        {
          name: dto.organizatioName,
          slug,
          industry: dto.industry,
          size: dto.teamSize,
          website: dto.website,
          description: dto.description,
        },
        { transaction: t },
      );

      // Create User as ADMIN of that org
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
        { transaction: t },
      );

      // Create OrganizationMember mapping
      await this.memberModel.create(
        {
          org_id: org.id,
          user_id: user.id,
          role: OrgMemberRole.ADMIN,
          status: OrgMemberStatus.ACTIVE,
        },
        { transaction: t },
      );

      // 4. Dispatch verification email job
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
