import { IsString, IsNumber, Min } from 'class-validator';

export class CompleteApplicantProfileDto {
  @IsString()
  jobTitle!: string;

  @IsNumber()
  @Min(0)
  experienceYears!: number;

  @IsString()
  skills!: string[]; // already parsed as array in frontend
}

export class CompleteEmployerProfileDto {
  @IsString()
  companyName!: string;

  @IsString()
  location!: string;

  @IsString()
  industry!: string;
}
