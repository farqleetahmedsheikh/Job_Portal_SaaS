import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { CreateCompanyDto } from './dto/company.dto';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly repo: Repository<Company>,
    private readonly usersService: UsersService,
  ) {}

  async createCompany(ownerId: string, dto: CreateCompanyDto) {
    const company = await this.repo.save({
      ...dto,
      owner: { id: ownerId },
    });

    await this.usersService.markProfileCompleted(ownerId);

    return company;
  }

  findByOwner(userId: string) {
    return this.repo.findOne({
      where: { owner: { id: userId } },
    });
  }
}
