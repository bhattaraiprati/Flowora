import { IsString, IsOptional, IsNotEmpty, IsUUID } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsUUID()
  @IsOptional()
  reply_to?: string;
}
