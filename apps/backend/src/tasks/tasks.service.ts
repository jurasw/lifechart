import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task, TaskDocument } from '../schemas/task.schema';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
  ) {}

  async create(userId: string, createTaskDto: CreateTaskDto): Promise<any> {
    const userIdObjectId = new Types.ObjectId(userId);
    
    const existingTask = await this.taskModel.findOne({
      userId: userIdObjectId,
      title: createTaskDto.title.trim(),
    }).exec();

    if (existingTask) {
      throw new Error('Task with this title already exists');
    }

    const task = new this.taskModel({
      ...createTaskDto,
      userId: userIdObjectId,
      title: createTaskDto.title.trim(),
      description: createTaskDto.description || '',
      createdAt: createTaskDto.createdAt || Date.now(),
      completed: createTaskDto.completed || false,
      completedDates: createTaskDto.completedDates || [],
    });
    const saved = await task.save();
    return {
      ...saved.toObject(),
      id: saved._id.toString(),
    };
  }

  async findAll(userId: string): Promise<any[]> {
    const userIdObjectId = new Types.ObjectId(userId);
    const tasks = await this.taskModel.find({ 
      $or: [
        { userId: userIdObjectId },
        { userId: userId }
      ]
    }).sort({ createdAt: -1 }).lean().exec();
    const result = tasks.map((task: any) => ({
      ...task,
      id: task._id.toString(),
    }));
    return result;
  }

  async findOne(userId: string, id: string): Promise<any> {
    const task = await this.taskModel.findById(id).exec();
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    if (task.userId.toString() !== userId) {
      throw new ForbiddenException('You do not have access to this task');
    }
    return {
      ...task.toObject(),
      id: task._id.toString(),
    };
  }

  async update(userId: string, id: string, updateTaskDto: UpdateTaskDto): Promise<any> {
    const task = await this.taskModel.findById(id).exec();
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    if (task.userId.toString() !== userId) {
      throw new ForbiddenException('You do not have access to this task');
    }
    
    if (updateTaskDto.title && updateTaskDto.title.trim() !== task.title) {
      const userIdObjectId = new Types.ObjectId(userId);
      const existingTask = await this.taskModel.findOne({
        userId: userIdObjectId,
        title: updateTaskDto.title.trim(),
        _id: { $ne: id },
      }).exec();

      if (existingTask) {
        throw new Error('Task with this title already exists');
      }
    }
    
    Object.assign(task, updateTaskDto);
    if (updateTaskDto.title) {
      task.title = updateTaskDto.title.trim();
    }
    const saved = await task.save();
    return {
      ...saved.toObject(),
      id: saved._id.toString(),
    };
  }

  async remove(userId: string, id: string): Promise<void> {
    const task = await this.taskModel.findById(id).exec();
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    if (task.userId.toString() !== userId) {
      throw new ForbiddenException('You do not have access to this task');
    }
    await task.deleteOne();
  }

  async toggleComplete(userId: string, id: string): Promise<any> {
    const task = await this.taskModel.findById(id).exec();
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    if (task.userId.toString() !== userId) {
      throw new ForbiddenException('You do not have access to this task');
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    const completedDates = task.completedDates || [];
    const isCompletedToday = completedDates.includes(todayTimestamp);

    if (isCompletedToday) {
      task.completedDates = completedDates.filter((date) => date !== todayTimestamp);
      task.completed = task.completedDates.length > 0;
    } else {
      task.completedDates = [...completedDates, todayTimestamp];
      task.completed = true;
    }

    const saved = await task.save();
    return {
      ...saved.toObject(),
      id: saved._id.toString(),
    };
  }

  async toggleDate(userId: string, id: string, dateTimestamp: number): Promise<any> {
    const task = await this.taskModel.findById(id).exec();
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    if (task.userId.toString() !== userId) {
      throw new ForbiddenException('You do not have access to this task');
    }
    const completedDates = task.completedDates || [];
    const dateIndex = completedDates.indexOf(dateTimestamp);

    if (dateIndex > -1) {
      task.completedDates = completedDates.filter((_, index) => index !== dateIndex);
    } else {
      task.completedDates = [...completedDates, dateTimestamp];
    }

    task.completed = task.completedDates.length > 0;
    const saved = await task.save();
    return {
      ...saved.toObject(),
      id: saved._id.toString(),
    };
  }

  async import(userId: string, tasks: any[]): Promise<{ created: number; skipped: number }> {
    let created = 0;
    let skipped = 0;

    const userIdObjectId = new Types.ObjectId(userId);

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return { created: 0, skipped: 0 };
    }

    for (let i = 0; i < tasks.length; i++) {
      const taskData = tasks[i];
      
      try {
        if (!taskData || typeof taskData !== 'object') {
          throw new Error('Invalid task data: not an object');
        }

        const { id, ...task } = taskData;
        
        if (!task.title || typeof task.title !== 'string' || task.title.trim().length === 0) {
          throw new Error(`Invalid task: missing or empty title`);
        }
        
        const taskToSave: any = {
          title: task.title.trim(),
          description: task.description !== undefined ? (task.description || '') : '',
          isRepetitive: task.isRepetitive !== undefined ? Boolean(task.isRepetitive) : false,
          completed: task.completed !== undefined ? Boolean(task.completed) : false,
          createdAt: task.createdAt !== undefined ? Number(task.createdAt) : Date.now(),
          userId: userIdObjectId,
        };

        if (task.period !== undefined && ['daily', 'weekly', 'monthly', 'yearly'].includes(task.period)) {
          taskToSave.period = task.period;
        }
        if (task.selectedDays !== undefined) {
          const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
          taskToSave.selectedDays = Array.isArray(task.selectedDays) 
            ? task.selectedDays.filter((day: string) => validDays.includes(day))
            : [];
        } else {
          taskToSave.selectedDays = [];
        }
        if (task.tags !== undefined) {
          taskToSave.tags = Array.isArray(task.tags) ? task.tags.filter((tag: any) => typeof tag === 'string') : [];
        } else {
          taskToSave.tags = [];
        }
        if (task.completedDates !== undefined) {
          taskToSave.completedDates = Array.isArray(task.completedDates) 
            ? task.completedDates.filter((date: any) => typeof date === 'number')
            : [];
        } else {
          taskToSave.completedDates = [];
        }
        if (task.hideHistory !== undefined) {
          taskToSave.hideHistory = Boolean(task.hideHistory);
        }

        const taskModel = new this.taskModel(taskToSave);
        const saved = await taskModel.save();
        created++;
      } catch (error: any) {
        skipped++;
      }
    }

    const finalCount = await this.taskModel.countDocuments({ userId: userIdObjectId }).exec();
    
    return { created, skipped };
  }

  async clearAll(): Promise<{ deleted: number }> {
    const result = await this.taskModel.deleteMany({}).exec();
    const deleted = result.deletedCount || 0;
    return { deleted };
  }
}

