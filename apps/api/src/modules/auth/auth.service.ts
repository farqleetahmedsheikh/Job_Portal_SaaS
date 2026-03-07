// auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { randomInt } from 'crypto';
import {
  CompleteApplicantProfileDto,
  CompleteEmployerProfileDto,
} from './dto/complete-profile.dto';

export interface JwtPayload {
  sub: string;
  userId: string;
  role: UserRole;
}

interface OtpRecord {
  otp: string;
  expiresAt: number;
}

@Injectable()
export class AuthService {
  private otpStore: Map<string, OtpRecord> = new Map();

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(
    dto: RegisterDto,
  ): Promise<{ accessToken: string; role: UserRole; userId: string }> {
    const existing: User | null = await this.usersService.findByEmail(
      dto.email,
    );

    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash: string = await bcrypt.hash(dto.password, 12);

    const user: User = await this.usersService.create({
      email: dto.email,
      passwordHash,
      role: dto.role,
      fullName: dto.fullName,
    });

    const { accessToken } = this.signToken(user.id, user.role);
    return { accessToken, role: user.role, userId: user.id };
  }

  async login(dto: LoginDto): Promise<{ accessToken: string; user: User }> {
    const user: User | null = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid: boolean = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const { accessToken } = this.signToken(user.id, user.role);
    return { accessToken, user };
  }

  private signToken(userId: string, role: UserRole): { accessToken: string } {
    const payload: JwtPayload = {
      sub: userId,
      userId,
      role,
    };

    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }
  /** FORGOT PASSWORD - send OTP */
  async sendForgotPasswordOtp(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');

    const otp = String(randomInt(100000, 999999)); // 6-digit OTP
    const expiresAt = Date.now() + 5 * 60 * 1000; // expires in 5 mins

    this.otpStore.set(email, { otp, expiresAt });

    // TODO: send OTP via email service
    console.log(`OTP for ${email}: ${otp}`);

    return { message: 'OTP sent to your email' };
  }

  /** VERIFY OTP */
  verifyOtp(email: string, otp: string) {
    const record = this.otpStore.get(email);
    if (!record) throw new BadRequestException('No OTP requested');

    if (Date.now() > record.expiresAt) {
      this.otpStore.delete(email);
      throw new BadRequestException('OTP expired');
    }

    if (record.otp !== otp) throw new BadRequestException('Invalid OTP');

    // OTP verified, delete it
    this.otpStore.delete(email);

    return { message: 'OTP verified successfully' };
  }

  /** RESET PASSWORD */
  async resetPassword(email: string, otp: string, newPassword: string) {
    this.verifyOtp(email, otp);

    const user = await this.usersService.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.usersService.update(user.id, { passwordHash });

    return { message: 'Password reset successfully' };
  }

  /** COMPLETE PROFILE */
  async completeApplicantProfile(
    userId: string,
    dto: CompleteApplicantProfileDto,
  ) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    // Update the user profile
    user['jobTitle'] = dto.jobTitle;
    user['experienceYears'] = dto.experienceYears;
    user['skills'] = dto.skills;
    await this.usersService.markProfileCompleted(userId);

    return { message: 'Applicant profile completed successfully' };
  }

  async completeEmployerProfile(
    userId: string,
    dto: CompleteEmployerProfileDto,
  ) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    // Update employer profile
    user['companyName'] = dto.companyName;
    user['location'] = dto.location;
    user['industry'] = dto.industry;
    await this.usersService.markProfileCompleted(userId);

    return { message: 'Employer profile completed successfully' };
  }
}
