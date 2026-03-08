import { IsString, IsNumber, Min, IsNotEmpty } from 'class-validator';

export class CompleteApplicantProfileDto {
  @IsString()
  @IsNotEmpty()
  jobTitle!: string;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  experienceYears!: number;

  @IsString()
  @IsNotEmpty()
  skills!: string[]; // already parsed as array in frontend
  location!: null;
  linkedinUrl!: null;
  githubUrl!: null;
}

export class CompleteEmployerProfileDto {
  @IsString()
  @IsNotEmpty()
  companyName!: string;

  @IsString()
  @IsNotEmpty()
  location!: string;

  @IsString()
  @IsNotEmpty()
  industry!: string;
  website!: null;
  description!: null;
}
