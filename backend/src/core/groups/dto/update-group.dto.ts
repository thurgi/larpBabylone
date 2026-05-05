import {
  IsString,
  IsOptional,
  IsArray,
  IsUUID,
  ValidateNested,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PermissionsDto } from './create-group.dto';

export class UpdateGroupDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PermissionsDto)
  permissions?: PermissionsDto;

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  userIds?: string[];
}
