import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateVersionDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;
}
