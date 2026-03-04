import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CodingTest } from './entities/coding-test.entity';
import { CodingSubmission } from './entities/coding-submission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CodingTest, CodingSubmission])],
  exports: [TypeOrmModule],
})
export class CodingTestsModule {}
