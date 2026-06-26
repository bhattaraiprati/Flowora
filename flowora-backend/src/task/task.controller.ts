import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RequestUser } from '../auth/strategies/jwt.strategy';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { UpdateTaskDateDto } from './dto/update-task-date.dto';

interface RequestWithUser extends Request {
  user: RequestUser;
}

@Controller('api/tasks')
@UseGuards(JwtAuthGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post('project/:projectId')
  async createTask(
    @Req() req: RequestWithUser,
    @Param('projectId') projectId: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.taskService.createTask(req.user.id, projectId, dto);
  }

  @Get('project/:projectId')
  async getProjectTasks(
    @Req() req: RequestWithUser,
    @Param('projectId') projectId: string,
    @Query() filters: any,
  ) {
    return this.taskService.getProjectTasks(req.user.id, projectId, filters);
  }

  @Get(':taskId')
  async getTask(@Req() req: RequestWithUser, @Param('taskId') taskId: string) {
    return this.taskService.getTaskById(req.user.id, taskId);
  }

  @Get('my/organization/:organizationId')
  async getMyTasks(
      @Req() req: RequestWithUser,
      @Param('organizationId') organizationId: string,
      @Query() filters: any,
  ) {
      return this.taskService.getMyTasks(req.user.id, organizationId, filters);
  }

  @Patch(':taskId')
  async updateTask(
    @Req() req: RequestWithUser,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.taskService.updateTask(req.user.id, taskId, dto);
  }

  @Patch(':taskId/status')
  async updateTaskStatus(
    @Req() req: RequestWithUser,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskStatusDto,
  ) {
    return this.taskService.updateTaskStatus(req.user.id, taskId, dto);
  }

  @Patch(':taskId/date')
  async updateTaskDate(
    @Req() req: RequestWithUser,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDateDto,
  ) {
    return this.taskService.updateTaskDate(req.user.id, taskId, dto);
  }

  @Delete(':taskId')
  async deleteTask(@Req() req: RequestWithUser, @Param('taskId') taskId: string) {
    await this.taskService.deleteTask(req.user.id, taskId);
    return { message: 'Task deleted successfully' };
  }
}