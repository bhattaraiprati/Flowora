import { IsString, IsOptional, IsEnum, IsDateString, IsNumber, IsArray } from 'class-validator';
import { TaskStatus, TaskPriority } from '../../common/enums';

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @IsString()
  @IsOptional()
  assigned_to?: string;

  @IsDateString()
  @IsOptional()
  due_date?: string;

  @IsDateString()
  @IsOptional()
  start_date?: string;

  @IsNumber()
  @IsOptional()
  estimated_hours?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
