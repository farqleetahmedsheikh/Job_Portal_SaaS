import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Company } from './entities/company.entity';
import { UpdatePerksDto } from './dto/update-perks.dto';
import { UpdateCompanyDto } from './dto/update-compnay.dto';
import { CreateCompanyDto } from './dto/company.dto';
import { CompanyPerk } from './entities/company-perk.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class CompaniesService {
  private readonly logger = new Logger(CompaniesService.name);

  constructor(
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    @InjectRepository(CompanyPerk)
    private readonly perkRepo: Repository<CompanyPerk>,
    private readonly ds: DataSource,
    private readonly cloudinary: CloudinaryService,
  ) {}

  // ── Find by owner ──────────────────────────────────────────────────────────
  async findByOwner(ownerId: string): Promise<Company[]> {
    return this.companyRepo.find({
      where: { ownerId },
      relations: ['perks'],
    });
  }

  async findById(id: string): Promise<Company> {
    const company = await this.companyRepo.findOne({
      where: { id },
      relations: ['perks'],
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  // ── Create ─────────────────────────────────────────────────────────────────
  async create(ownerId: string, payload: CreateCompanyDto): Promise<Company> {
    const existing = await this.companyRepo.findOne({
      where: { ownerId, companyName: payload.companyName },
    });
    if (existing) {
      throw new ConflictException('You already have a company with this name');
    }

    try {
      const company = this.companyRepo.create({ ...payload, ownerId });
      return await this.companyRepo.save(company);
    } catch (err) {
      this.logger.error(
        `Failed to create company for owner ${ownerId}`,
        err instanceof Error ? err.stack : err,
      );
      throw new InternalServerErrorException('Failed to create company');
    }
  }

  // ── Update ─────────────────────────────────────────────────────────────────
  async update(
    id: string,
    ownerId: string,
    updates: UpdateCompanyDto,
  ): Promise<Company> {
    const company = await this.findById(id);
    // 404 not 403 — don't leak existence to other employers
    if (company.ownerId !== ownerId)
      throw new NotFoundException('Company not found');

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

  // ── Replace perks list (full replace — sort order = array order) ───────────
  async updatePerks(
    id: string,
    ownerId: string,
    dto: UpdatePerksDto,
  ): Promise<CompanyPerk[]> {
    const company = await this.findById(id);
    if (company.ownerId !== ownerId)
      throw new NotFoundException('Company not found');

    return this.ds.transaction(async (m) => {
      await m.delete(CompanyPerk, { companyId: id });
      if (!dto.perks?.length) return [];

      const perks: CompanyPerk[] = dto.perks.map((perk, i) =>
        m.create(CompanyPerk, { companyId: id, perk, sortOrder: i }),
      );
      return m.save(CompanyPerk, perks);
    });
  }

  async updateLogo(
    userId: string,
    companyId: string,
    file: Express.Multer.File,
  ) {
    const company = await this.companyRepo.findOneOrFail({
      where: { id: companyId, ownerId: userId },
    });

    const result = await this.cloudinary.uploadCompanyLogo(
      file.buffer,
      company.logoPublicId ?? undefined,
    );

    company.logoUrl = result.url;
    company.logoPublicId = result.publicId;

    return this.companyRepo.save(company);
  }

  async deleteLogo(userId: string, companyId: string): Promise<void> {
    const company = await this.companyRepo.findOneOrFail({
      where: { id: companyId, ownerId: userId },
    });
    if (!company.logoPublicId) return;

    await this.cloudinary.delete(company.logoPublicId, 'image');

    company.logoUrl = '';
    company.logoPublicId = '';

    await this.companyRepo.save(company);
  }

  // ── Soft delete ────────────────────────────────────────────────────────────
  async delete(id: string, ownerId: string): Promise<void> {
    const company = await this.findById(id);
    if (company.ownerId !== ownerId)
      throw new NotFoundException('Company not found');
    await this.companyRepo.softRemove(company);
  }
}
