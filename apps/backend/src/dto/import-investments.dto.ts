import { IsArray } from 'class-validator';

export class ImportInvestmentsDto {
  @IsArray()
  investments: any[];
}

