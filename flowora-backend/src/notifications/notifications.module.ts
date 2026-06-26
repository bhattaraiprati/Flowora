import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { SequelizeModule } from '@nestjs/sequelize';
import { Project } from '../models/project.model';
import { Task } from '../models/task.model';
import { ProjectMember } from '../models/projectMember.model';
import { Notification } from '../models/notification.model';
import { User } from '../models/user.model';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports:[
    SequelizeModule.forFeature([
      Project,
      Task,
      ProjectMember,
      Notification,
      User,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret') || 'default-secret-change-me',
        signOptions: {expiresIn: '5h'}
      })
    })
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway],
  exports: [NotificationsService, NotificationsGateway]
})
export class NotificationsModule {}
