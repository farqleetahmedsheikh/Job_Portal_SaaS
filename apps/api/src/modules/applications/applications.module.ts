import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationHistory } from './entities/application-history.entity';
import { Application } from './entities/application.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ApplicationHistory, Application])],
  exports: [TypeOrmModule],
})
export class ApplicationsModule {}
