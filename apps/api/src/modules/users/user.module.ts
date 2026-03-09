import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller'; // ← add
import { ApplicantProfilesModule } from '../applicants/applicants.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), ApplicantProfilesModule], // ← add ApplicantProfile
  controllers: [UsersController], // ← add
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
