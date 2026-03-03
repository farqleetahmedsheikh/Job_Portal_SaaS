/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';

export interface JwtPayload {
  sub: string;
  userId: string;
  role: UserRole;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<{ accessToken: string }> {
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

    return this.signToken(user.id, user.role);
  }

  async login(dto: LoginDto): Promise<{ accessToken: string }> {
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

    return this.signToken(user.id, user.role);
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
}
