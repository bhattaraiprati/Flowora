import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserRole } from '../../common/enums';

export interface JwtPayload {
  sub: string; // User ID
  email: string;
  name: string;
  role: UserRole;
  organizationId: string | null;
  iat?: number;
  exp?: number;
}

export interface RequestUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    const jwtSecret = configService.get<string>('jwt.secret');

    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in configuration');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // Automatically reject expired tokens
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<RequestUser> {
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // This object will be attached to request.user
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      organizationId: payload.organizationId,
    };
  }
}