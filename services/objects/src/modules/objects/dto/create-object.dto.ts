import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreateObjectDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @IsString()
  @MaxLength(2000)
  description!: string;
}
