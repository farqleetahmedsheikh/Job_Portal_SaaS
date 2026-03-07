// auth/auth.controller.ts
import { Controller, Post, Body, Param, Patch } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import {
  CompleteApplicantProfileDto,
  CompleteEmployerProfileDto,
} from './dto/complete-profile.dto';

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /** Register a new user */
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /** Login */
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /** Forgot password: send OTP to email */
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.sendForgotPasswordOtp(dto.email);
  }

  /** Verify OTP sent for password reset */
  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.email, dto.otp);
  }

  /** Reset password after OTP verification */
  @Patch('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.email, dto.otp, dto.newPassword);
  }

  /** Complete profile after registration */
  @Post('applicant-profile/:userId')
  completeApplicantProfile(
    @Param('userId') userId: string,
    @Body() dto: CompleteApplicantProfileDto,
  ) {
    return this.authService.completeApplicantProfile(userId, dto);
  }

  @Post('employer-profile/:userId')
  completeEmployerProfile(
    @Param('userId') userId: string,
    @Body() dto: CompleteEmployerProfileDto,
  ) {
    return this.authService.completeEmployerProfile(userId, dto);
  }
}
