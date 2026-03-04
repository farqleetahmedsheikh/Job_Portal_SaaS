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

  findByEmail(email: string) {
    return this.userRepo.findOne({
      where: { email },
    });
  }

  async findById(id: string) {
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
        'createdAt',
      ],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  create(user: Partial<User>) {
    return this.userRepo.save(user);
  }

  async markProfileCompleted(userId: string) {
    await this.userRepo.update(userId, { profileCompleted: true });
  }
}
