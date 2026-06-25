import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from '../models/user.model';
import { Organization } from '../models/organization.model';
import { OrganizationMember } from '../models/organizationMember.model';
import { Project } from '../models/project.model';
import { ProjectMember } from '../models/projectMember.model';
import { Task } from '../models/task.model';
import { Invitation } from '../models/invitation.model';
import { Message } from '../models/message.model';
import { MessageReaction } from '../models/messageReaction.model';

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        dialect: 'postgres',
        uri: config.get<string>('database.url'),
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
          keepAlive: true,
          keepAliveInitialDelayMillis: 10000,
        },
        pool: {
          max: 10,
          min: 2,
          acquire: 30000,
          idle: 10000,
          evict: 1000,
        },
        retry: {
          max: 3,
          match: [
            'ECONNRESET',
            'ECONNREFUSED',
            'ETIMEDOUT',
            'EHOSTUNREACH',
            'EAI_AGAIN',
          ],
        },
        models: [User, Organization, OrganizationMember, Project, ProjectMember, Task, Invitation, Message, MessageReaction],
        autoLoadModels: true,
        synchronize: true,
        logging: false,
      }),
    }),
  ],
})
export class DatabaseModule {}