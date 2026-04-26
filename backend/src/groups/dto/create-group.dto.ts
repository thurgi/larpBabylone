import {
  IsString,
  IsOptional,
  IsArray,
  IsUUID,
  IsBoolean,
  ValidateNested,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CrudPermissionsDto {
  @IsOptional()
  @IsBoolean()
  create?: boolean;

  @IsOptional()
  @IsBoolean()
  read?: boolean;

  @IsOptional()
  @IsBoolean()
  update?: boolean;

  @IsOptional()
  @IsBoolean()
  delete?: boolean;
}

export class PermissionsDto {
  @ValidateNested()
  @Type(() => CrudPermissionsDto)
  documents!: CrudPermissionsDto;

  @ValidateNested()
  @Type(() => CrudPermissionsDto)
  versions!: CrudPermissionsDto;

  @IsOptional()
  @IsBoolean()
  publicRead?: boolean;

  @IsOptional()
  @IsBoolean()
  admin?: boolean;
}

export class CreateGroupDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ValidateNested()
  @Type(() => PermissionsDto)
  permissions!: PermissionsDto;

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  userIds?: string[];
}
