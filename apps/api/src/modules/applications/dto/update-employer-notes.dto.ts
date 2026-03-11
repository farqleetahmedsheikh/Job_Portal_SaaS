import { IsString } from 'class-validator';

export class UpdateEmployerNotesDto {
  @IsString()
  notes?: string;
}
