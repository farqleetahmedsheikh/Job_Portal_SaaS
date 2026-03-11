/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/** @format */
// src/modules/jobs/jobs.service.ts

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

// ── Entity classes — NOT strings ─────────────────────────────────────────────
import { Job } from './entities/job.entity';
import { Company } from '../companies/entities/company.entity';
import { Application } from '../applications/entities/application.entity';
import { JobStatus } from '../../common/enums/enums';
import { JobSkill } from './entities/job-skill.entity';
import { SavedJob } from './entities/saved-job.entity';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { QueryJobsDto } from './dto/query-job.dto';
import { ChangeJobStatusDto } from './dto/change-job-status.dto';

@Injectable()
export class JobsService {
  constructor(
    // ✅ Entity class passed to @InjectRepository — never a string
    @InjectRepository(Job) private readonly jobRepo: Repository<Job>,
    @InjectRepository(JobSkill)
    private readonly skillRepo: Repository<JobSkill>,
    @InjectRepository(SavedJob)
    private readonly savedJobRepo: Repository<SavedJob>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    private readonly dataSource: DataSource,
  ) {}

  // ── Employer: Create ────────────────────────────────────────────────────────
  async create(userId: string, dto: CreateJobDto): Promise<Job> {
    const company = await this.companyRepo.findOne({
      where: { ownerId: userId },
    });
    if (!company)
      throw new ForbiddenException('No company profile found for this account');

    return this.dataSource.transaction(async (manager) => {
      // ✅ manager.create(EntityClass, data) — NOT manager.create<T>("string", data)
      const job = manager.create(Job, {
        ...dto,
        companyId: company.id,
        postedById: userId,
        publishedAt: dto.status === JobStatus.ACTIVE ? new Date() : null,
      });
      // ✅ manager.save(EntityClass, entity) — two-arg form avoids type inference issues
      await manager.save(Job, job);

      if (dto.skills?.length) {
        // ✅ Build the flat array first, then save — NOT save(array.map(...))
        const skillEntities: JobSkill[] = dto.skills.map((s) =>
          manager.create(JobSkill, { jobId: job.id, skill: s.toLowerCase() }),
        );
        await manager.save(JobSkill, skillEntities);
      }

      return job;
    });
  }

  // ── Employer: Update ────────────────────────────────────────────────────────
  async update(jobId: string, userId: string, dto: UpdateJobDto): Promise<Job> {
    const job = await this.findOwnedOrFail(jobId, userId);

    Object.assign(job, dto);
    const saved = await this.jobRepo.save(job);

    if (dto.skills !== undefined) {
      await this.skillRepo.delete({ jobId });
      if (dto.skills.length) {
        const skillEntities: JobSkill[] = dto.skills.map((s) =>
          this.skillRepo.create({ jobId, skill: s.toLowerCase() }),
        );
        await this.skillRepo.save(skillEntities);
      }
      saved.skills = dto.skills;
    }

    return saved;
  }

  // ── Employer: Change status ─────────────────────────────────────────────────
  async changeStatus(
    jobId: string,
    userId: string,
    dto: ChangeJobStatusDto,
  ): Promise<Job> {
    const job = await this.findOwnedOrFail(jobId, userId);

    if (job.status === JobStatus.EXPIRED)
      throw new BadRequestException('Expired jobs cannot be reactivated');

    job.status = dto.status;
    if (dto.status === JobStatus.ACTIVE && !job.publishedAt) {
      job.publishedAt = new Date();
    }

    return this.jobRepo.save(job);
  }

  // ── Employer: Duplicate as draft ────────────────────────────────────────────
  async duplicate(jobId: string, userId: string): Promise<Job> {
    const job = await this.findOwnedOrFail(jobId, userId);

    // Strip identity + auto-managed fields before copying
    const {
      id: _id,
      createdAt: _ca,
      updatedAt: _ua,
      publishedAt: _pa,
      expiresAt: _ea,
      viewsCount: _vc,
      applicantsCount: _ac,
      company: _company, // loaded relation — don't copy
      jobSkills: _js, // loaded relation — don't copy
      ...rest
    } = job as any;

    const copy = this.jobRepo.create({
      ...rest,
      title: `${job.title} (copy)`,
      status: JobStatus.DRAFT,
      publishedAt: null,
    } as Job);

    return this.jobRepo.save(copy);
  }

  // ── Employer: Soft delete ───────────────────────────────────────────────────
  async remove(jobId: string, userId: string): Promise<void> {
    await this.findOwnedOrFail(jobId, userId);
    await this.jobRepo.softDelete(jobId);
  }

  // ── Public: Browse with filters ─────────────────────────────────────────────
  async findAll(query: QueryJobsDto) {
    const {
      q,
      location,
      locationType,
      type,
      experienceLevel,
      salaryMin,
      skills,
      companyId,
      page = 1,
      limit = 20,
      sort = 'newest',
    } = query;

    const qb = this.jobRepo
      .createQueryBuilder('j')
      .innerJoinAndSelect('j.company', 'c')
      .where('j.status = :status', { status: JobStatus.ACTIVE })
      .andWhere('j.deleted_at IS NULL');

    if (q)
      qb.andWhere('(j.title ILIKE :q OR j.skills::text ILIKE :q)', {
        q: `%${q}%`,
      });
    if (location)
      qb.andWhere('j.location ILIKE :location', { location: `%${location}%` });
    if (locationType)
      qb.andWhere('j.location_type = :locationType', { locationType });
    if (type) qb.andWhere('j.type = :type', { type });
    if (experienceLevel)
      qb.andWhere('j.experience_level = :experienceLevel', { experienceLevel });
    if (salaryMin) qb.andWhere('j.salary_max >= :salaryMin', { salaryMin });
    if (companyId) qb.andWhere('j.company_id = :companyId', { companyId });
    if (skills?.length) qb.andWhere('j.skills @> :skills', { skills });

    if (sort === 'salary') qb.orderBy('j.salary_max', 'DESC', 'NULLS LAST');
    else if (sort === 'relevance') qb.orderBy('j.applicants_count', 'ASC');
    else qb.orderBy('j.published_at', 'DESC');

    const [items, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ── Public: Single job ──────────────────────────────────────────────────────
  async findOne(jobId: string): Promise<Job> {
    const job = await this.jobRepo.findOne({
      where: { id: jobId },
      relations: ['company', 'company.perks'],
    });
    if (!job) throw new NotFoundException('Job not found');

    // increment without triggering @BeforeUpdate hooks
    await this.jobRepo.increment({ id: jobId }, 'viewsCount', 1);

    return job;
  }

  // ── Employer: Applicant pipeline for one job ────────────────────────────────
  async getApplicants(jobId: string, userId: string) {
    await this.findOwnedOrFail(jobId, userId);

    return this.dataSource
      .getRepository(Application)
      .createQueryBuilder('a')
      .innerJoinAndSelect('a.applicant', 'u')
      .leftJoinAndSelect('u.applicantProfile', 'ap')
      .leftJoinAndSelect('a.resume', 'r')
      .leftJoinAndSelect('a.statusHistory', 'sh')
      .where('a.job_id = :jobId', { jobId })
      .orderBy('a.applied_at', 'DESC')
      .getMany();
  }

  // ── Employer: All jobs for my company ───────────────────────────────────────
  async findMyJobs(userId: string, status?: JobStatus): Promise<Job[]> {
    const company = await this.companyRepo.findOne({
      where: { ownerId: userId },
    });
    if (!company) return [];

    const where: any = { companyId: company.id };
    if (status) where.status = status;

    return this.jobRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  // ── Applicant: Save a job ────────────────────────────────────────────────────
  async saveJob(userId: string, jobId: string): Promise<SavedJob> {
    const job = await this.jobRepo.findOne({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');

    const existing = await this.savedJobRepo.findOne({
      where: { userId, jobId },
    });
    if (existing) return existing;

    return this.savedJobRepo.save(this.savedJobRepo.create({ userId, jobId }));
  }

  // ── Applicant: Unsave ────────────────────────────────────────────────────────
  async unsaveJob(userId: string, jobId: string): Promise<void> {
    await this.savedJobRepo.delete({ userId, jobId });
  }

  // ── Applicant: Get all saved jobs ────────────────────────────────────────────
  async getSavedJobs(userId: string): Promise<SavedJob[]> {
    return this.savedJobRepo.find({
      where: { userId },
      relations: ['job', 'job.company'],
      order: { savedAt: 'DESC' },
    });
  }

  // ── Applicant: Check saved status ────────────────────────────────────────────
  async isJobSaved(userId: string, jobId: string): Promise<boolean> {
    const count = await this.savedJobRepo.count({ where: { userId, jobId } });
    return count > 0;
  }

  // ── Private ──────────────────────────────────────────────────────────────────
  private async findOwnedOrFail(jobId: string, userId: string): Promise<Job> {
    const job = await this.jobRepo.findOne({
      where: { id: jobId },
      relations: ['company'],
    });
    if (!job) throw new NotFoundException('Job not found');
    if (job.company?.ownerId !== userId)
      throw new ForbiddenException('You do not own this job');
    return job;
  }
}
