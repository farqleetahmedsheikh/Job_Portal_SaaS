import { IsString, IsOptional, IsUUID } from 'class-validator';

// Panelist can be a registered user OR a free-text external name
export class PanelistDto {
  @IsOptional() @IsUUID() userId?: string;
  @IsOptional() @IsString() name?: string;
}
