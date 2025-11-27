import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { ImportTasksDto } from '../dto/import-tasks.dto';
import { Request } from 'express';

@Controller('tasks')
@UseGuards(AuthGuard('jwt'))
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@Req() req: Request, @Body() createTaskDto: CreateTaskDto) {
    const userId = (req.user as any).userId;
    return this.tasksService.create(userId, createTaskDto);
  }

  @Get()
  findAll(@Req() req: Request) {
    const userId = (req.user as any).userId;
    return this.tasksService.findAll(userId);
  }

  @Post('import')
  async import(@Req() req: Request, @Body() importDto: ImportTasksDto) {
    const userId = (req.user as any).userId;
    return this.tasksService.import(userId, importDto.tasks || []);
  }

  @Delete('clear-all')
  async clearAll(@Req() req: Request) {
    return this.tasksService.clearAll();
  }

  @Get(':id')
  findOne(@Req() req: Request, @Param('id') id: string) {
    const userId = (req.user as any).userId;
    return this.tasksService.findOne(userId, id);
  }

  @Patch(':id')
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    const userId = (req.user as any).userId;
    return this.tasksService.update(userId, id, updateTaskDto);
  }

  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    const userId = (req.user as any).userId;
    return this.tasksService.remove(userId, id);
  }

  @Post(':id/toggle-complete')
  toggleComplete(@Req() req: Request, @Param('id') id: string) {
    const userId = (req.user as any).userId;
    return this.tasksService.toggleComplete(userId, id);
  }

  @Post(':id/toggle-date')
  toggleDate(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { date: number },
  ) {
    const userId = (req.user as any).userId;
    return this.tasksService.toggleDate(userId, id, body.date);
  }
}
