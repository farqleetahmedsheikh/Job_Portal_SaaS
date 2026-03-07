import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /** Find user by email */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { email },
    });
  }

  /** Find user by ID */
  async findById(id: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id },
      select: [
        'id',
        'email',
        'role',
        'fullName',
        'phoneNumber',
        'profilePicture',
        'bio',
        'profileCompleted',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /** Create a new user */
  async create(user: Partial<User>): Promise<User> {
    const newUser = this.userRepo.create(user); // use create() for entity instantiation
    return this.userRepo.save(newUser);
  }

  /** Update user fields (for complete profile or password reset) */
  async update(userId: string, updates: Partial<User>): Promise<User> {
    await this.userRepo.update(userId, updates);
    return this.findById(userId); // return updated user
  }

  /** Mark profile as completed */
  async markProfileCompleted(userId: string): Promise<void> {
    await this.userRepo.update(userId, { profileCompleted: true });
  }
}
