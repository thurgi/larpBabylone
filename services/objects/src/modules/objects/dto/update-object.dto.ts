import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class UpdateObjectDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
