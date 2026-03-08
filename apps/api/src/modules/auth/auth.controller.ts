/* eslint-disable @typescript-eslint/no-unsafe-call */
// auth/auth.controller.ts
import {
  Controller,
  Post,
  Patch,
  Get,
  Body,
  Param,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  ParseUUIDPipe,
  ForbiddenException,
} from '@nestjs/common';
import express from 'express';
import { Throttle } from '@nestjs/throttler';

import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import {
  CompleteApplicantProfileDto,
  CompleteEmployerProfileDto,
} from './dto/complete-profile.dto';
import type { JwtPayload } from './auth.service';

@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    return this.authService.register(dto, res);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    return this.authService.login(dto, res);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Res({ passthrough: true }) res: express.Response): void {
    this.authService.logout(res);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  me(@CurrentUser() payload: JwtPayload) {
    return this.authService.getMe(payload.sub);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.sendForgotPasswordOtp(dto.email);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.email, dto.otp);
  }

  @Patch('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.email, dto.otp, dto.newPassword);
  }

  @Post('applicant-profile/:userId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  completeApplicantProfile(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: CompleteApplicantProfileDto,
    @CurrentUser() payload: JwtPayload,
  ) {
    // Prevent user A from completing user B's profile
    if (payload.sub !== userId) {
      throw new ForbiddenException('You can only update your own profile');
    }
    return this.authService.completeApplicantProfile(userId, dto);
  }

  @Post('employer-profile/:userId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  completeEmployerProfile(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: CompleteEmployerProfileDto,
    @CurrentUser() payload: JwtPayload,
  ) {
    if (payload.sub !== userId) {
      throw new ForbiddenException('You can only update your own profile');
    }
    return this.authService.completeEmployerProfile(userId, dto);
  }
}
