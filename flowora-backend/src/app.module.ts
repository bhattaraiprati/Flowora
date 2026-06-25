import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { MailModule } from './mail/mail.module';
import { DatabaseModule } from './database/database.module';
import { QueueModule } from './queue/queue.module';
import { OrganizationModule } from './organization/organization.module';
import { ProjectModule } from './project/project.module';
import { TaskModule } from './task/task.module';
import { InvitationModule } from './invitation/invitation.module';
import { MemberModule } from './member/member.module';
import { ChatModule } from './chat/chat.module';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import jwtConfig from './config/jwt.config';
import appConfig from './config/app.config';
import mailConfig from './config/mail.config';

@Module({
   imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [databaseConfig, redisConfig, jwtConfig, appConfig, mailConfig],
    }),
    AuthModule,
    UserModule,
    MailModule,
    DatabaseModule,
    QueueModule,
    OrganizationModule,
    ProjectModule,
    TaskModule,
    InvitationModule,
    MemberModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
