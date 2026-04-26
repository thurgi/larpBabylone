import { IsString, IsOptional } from 'class-validator';

export class CreateVersionDto {
  @IsOptional()
  @IsString()
  content?: string;
}
