import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TaskDocument = Task & Document;

export type TaskPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

@Schema({ timestamps: true })
export class Task {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ required: true, default: false })
  isRepetitive: boolean;

  @Prop({ enum: ['daily', 'weekly', 'monthly', 'yearly'] })
  period?: TaskPeriod;

  @Prop({ type: [String], enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] })
  selectedDays?: DayOfWeek[];

  @Prop({ type: [String], default: [] })
  tags?: string[];

  @Prop({ required: true, default: false })
  completed: boolean;

  @Prop({ required: true })
  createdAt: number;

  @Prop({ type: [Number], default: [] })
  completedDates?: number[];

  @Prop({ default: false })
  hideHistory?: boolean;
}

export const TaskSchema = SchemaFactory.createForClass(Task);

TaskSchema.index({ userId: 1, title: 1 }, { unique: true });

