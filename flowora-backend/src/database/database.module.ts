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
        },
        models: [User, Organization, OrganizationMember, Project, ProjectMember, Task, Invitation],
        autoLoadModels: true,
        synchronize: true, // Will auto-create tables based on models
        logging: false,
      }),
    }),
  ],
})
export class DatabaseModule {}