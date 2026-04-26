import { IsString, IsOptional, IsArray, IsUUID, MinLength, MaxLength } from 'class-validator';

export class CreateDocumentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  groupIds?: string[];
}
