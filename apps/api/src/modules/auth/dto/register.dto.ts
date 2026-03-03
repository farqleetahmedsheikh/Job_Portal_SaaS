/* eslint-disable @typescript-eslint/no-unsafe-call */
// auth/dto/register.dto.ts
import { IsEmail, IsEnum, IsNotEmpty, MinLength } from 'class-validator';
import { UserRole } from '../../../common/enums/user-role.enum';

export class RegisterDto {
  @IsEmail()
  email: string;

  @MinLength(8)
  password: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsNotEmpty()
  fullName: string;

  @IsNotEmpty()
  phoneNumber: string;
}
