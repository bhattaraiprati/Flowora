import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export interface RedisInvitationData {
  id: string;
  email: string;
  role: string;
  scope: string;
  organization_id: string;
  project_id?: string | null;
  invited_by: string;
  created_at: string;
  expires_at: string;
}

@Injectable()
export class RedisInvitationService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private readonly INVITATION_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.client = new Redis({
      host: this.configService.get<string>('redis.host'),
      port: this.configService.get<number>('redis.port'),
      password: this.configService.get<string>('redis.password'),
    });
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.disconnect();
    }
  }

  private getKey(token: string): string {
    return `invitation:token:${token}`;
  }

  async storeInvitation(token: string, data: RedisInvitationData): Promise<void> {
    const key = this.getKey(token);
    await this.client.setex(key, this.INVITATION_TTL, JSON.stringify(data));
  }

  async getInvitation(token: string): Promise<RedisInvitationData | null> {
    const key = this.getKey(token);
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async deleteInvitation(token: string): Promise<void> {
    const key = this.getKey(token);
    await this.client.del(key);
  }

  async exists(token: string): Promise<boolean> {
    const key = this.getKey(token);
    const result = await this.client.exists(key);
    return result === 1;
  }
}