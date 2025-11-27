import { IsString, IsBoolean, IsOptional, IsEnum, IsArray, IsNumber } from 'class-validator';

export type TaskPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isRepetitive?: boolean;

  @IsEnum(['daily', 'weekly', 'monthly', 'yearly'])
  @IsOptional()
  period?: TaskPeriod;

  @IsArray()
  @IsEnum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'], { each: true })
  @IsOptional()
  selectedDays?: DayOfWeek[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsBoolean()
  @IsOptional()
  completed?: boolean;

  @IsNumber()
  @IsOptional()
  createdAt?: number;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  completedDates?: number[];

  @IsBoolean()
  @IsOptional()
  hideHistory?: boolean;
}

export class ImportTaskDto {
  title: string;
  description?: string;
  isRepetitive?: boolean;
  period?: TaskPeriod;
  selectedDays?: DayOfWeek[];
  tags?: string[];
  completed?: boolean;
  createdAt?: number;
  completedDates?: number[];
  hideHistory?: boolean;
}

