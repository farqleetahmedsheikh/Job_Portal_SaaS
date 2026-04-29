import { IsUUID } from 'class-validator';

export class SaveCandidateDto {
  @IsUUID()
  candidateId!: string;
}
