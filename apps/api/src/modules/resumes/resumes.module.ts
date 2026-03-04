import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Resume } from './entities/resume.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Resume])],
  exports: [TypeOrmModule],
})
export class ResumesModule {}
