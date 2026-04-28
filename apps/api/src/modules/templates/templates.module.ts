import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from '../companies/entities/company.entity';
import { ContractTemplate } from './entities/contract-template.entity';
import { EmailTemplate } from './entities/email-template.entity';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company, ContractTemplate, EmailTemplate]),
  ],
  controllers: [TemplatesController],
  providers: [TemplatesService],
  exports: [TemplatesService],
})
export class TemplatesModule {}
