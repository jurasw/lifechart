import { IsArray } from 'class-validator';

export class ImportTasksDto {
  @IsArray()
  tasks: any[];
}

