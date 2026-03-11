import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { CompaniesService } from './companies.service';
import { CompanyPerk } from './entities/company-perk.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Company, CompanyPerk])],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}
