import {
  IsArray,
  IsEmail,
  IsNumber,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateApplicantProfileDto {
  @IsEmail()
  location!: string;

  @MinLength(8)
  password!: string;

  @IsNumber()
  experienceYears!: number;

  @IsString()
  linkedinUrl?: string;

  @IsArray()
  @IsString({ each: true })
  skills!: Array<string>;

  @IsString()
  githubUrl?: string;
}
