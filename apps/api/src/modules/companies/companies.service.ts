import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './entities/company.entity';

interface CreateCompanyPayload {
  companyName: string;
  location: string;
  industry: string;
  website?: string | null;
  description?: string | null;
  logoUrl?: string | null;
}

@Injectable()
export class CompaniesService {
  private readonly logger = new Logger(CompaniesService.name);

  constructor(
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
  ) {}

  // ── Find by owner ──────────────────────────────────────
  async findByOwner(ownerId: string): Promise<Company[]> {
    return this.companyRepo.find({ where: { ownerId } });
  }

  async findById(id: string): Promise<Company> {
    const company = await this.companyRepo.findOne({ where: { id } });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  // ── Create ─────────────────────────────────────────────
  async create(
    ownerId: string,
    payload: CreateCompanyPayload,
  ): Promise<Company> {
    // One company name per owner — matches the unique index
    const existing = await this.companyRepo.findOne({
      where: {
        ownerId: ownerId,
        companyName: payload.companyName,
      },
    });

    if (existing) {
      throw new ConflictException('You already have a company with this name');
    }

    try {
      const company = this.companyRepo.create(payload);
      return await this.companyRepo.save(company);
    } catch (err) {
      this.logger.error(
        `Failed to create company for owner ${ownerId}`,
        err instanceof Error ? err.stack : err,
      );
      throw new InternalServerErrorException('Failed to create company');
    }
  }

  // ── Update ─────────────────────────────────────────────
  async update(
    id: string,
    ownerId: string,
    updates: Partial<CreateCompanyPayload>,
  ): Promise<Company> {
    const company = await this.findById(id);

    // Ensure the caller owns this company
    if (company.ownerId !== ownerId) {
      throw new NotFoundException('Company not found'); // 404 not 403 — don't leak existence
    }

    Object.assign(company, updates);

    try {
      return await this.companyRepo.save(company);
    } catch (err) {
      this.logger.error(
        `Failed to update company ${id}`,
        err instanceof Error ? err.stack : err,
      );
      throw new InternalServerErrorException('Failed to update company');
    }
  }

  // ── Soft delete ────────────────────────────────────────
  async delete(id: string, ownerId: string): Promise<void> {
    const company = await this.findById(id);
    if (company.ownerId !== ownerId)
      throw new NotFoundException('Company not found');
    await this.companyRepo.softRemove(company);
  }
}
