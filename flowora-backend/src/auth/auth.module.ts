import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from '../models/user.model';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [
    QueueModule,
    SequelizeModule.forFeature([User]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const expiresIn = config.getOrThrow<string>('jwt.expiresIn');

        return {
          secret: config.getOrThrow<string>('jwt.secret'),
          signOptions: {
            expiresIn: expiresIn as any, // Quick & reliable
            // expiresIn: expiresIn as Parameters<typeof jwt.sign>[2]['expiresIn'], // Most precise
          },
        };
      },
    }),
    QueueModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
