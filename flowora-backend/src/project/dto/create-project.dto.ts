import { IsString, IsNotEmpty, IsEnum, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';
import { ProjectVisibility } from '../../models/project.model';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Project title must be at least 3 characters long' })
  @MaxLength(100, { message: 'Project title cannot exceed 100 characters' })
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Description cannot exceed 500 characters' })
  description?: string | null;

  @IsEnum(ProjectVisibility, { message: 'Invalid visibility option' })
  visibility: ProjectVisibility;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Color must be a valid hex code (e.g., #6366f1)' })
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;
}
