import { IsString, IsEnum, IsNotEmpty } from 'class-validator';

export enum DateType {
  DUE_DATE = 'due_date',
  START_DATE = 'start_date',
}

export class UpdateTaskDateDto {
  @IsString()
  @IsNotEmpty()
  date: string;

  @IsEnum(DateType)
  @IsNotEmpty()
  type: DateType;
}
