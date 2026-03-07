// dto/reset-password.dto.ts
import { IsEmail, IsString, Length } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(4, 6)
  otp!: string;

  @IsString()
  @Length(6, 32)
  newPassword!: string;
}
