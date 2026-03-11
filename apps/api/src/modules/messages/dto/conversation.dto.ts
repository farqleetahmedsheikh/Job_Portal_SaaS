import {
  IsString,
  IsUUID,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateConversationDto {
  @IsUUID()
  recipientId!: string; // the other party

  @IsOptional()
  @IsUUID()
  jobId?: string; // context — which job this is about

  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  firstMessage!: string; // send first message atomically with conversation creation
}
