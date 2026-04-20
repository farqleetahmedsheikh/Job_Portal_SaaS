/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

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
import { LimitsService } from '../billing/limits.service'; // ← new
import { ApplicantProfile } from '../applicants/entities/applicant-profile.entity';
import { AnalyticsTier } from '../../common/enums/enums';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job) private readonly jobRepo: Repository<Job>,
    @InjectRepository(JobSkill)
    private readonly skillRepo: Repository<JobSkill>,
    @InjectRepository(SavedJob)
    private readonly savedJobRepo: Repository<SavedJob>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    private readonly dataSource: DataSource,
    private readonly limitsService: LimitsService, // ← new
    @InjectRepository(ApplicantProfile)
    private readonly profileRepo: Repository<ApplicantProfile>,
  ) {}

  // ── Employer: Create ────────────────────────────────────────────────────────
  async create(userId: string, dto: CreateJobDto): Promise<Job> {
    const company = await this.companyRepo.findOne({
      where: { ownerId: userId },
    });
    if (!company)
      throw new ForbiddenException('No company profile found for this account');

    // ── Billing checks ────────────────────────────────────────────────────────
    await this.limitsService.consumeJobPostSlot(userId);
    const applicantCap = await this.limitsService.getApplicantCap(userId);
    // ─────────────────────────────────────────────────────────────────────────

    return this.dataSource.transaction(async (manager) => {
      const job = manager.create(Job, {
        ...dto,
        companyId: company.id,
        postedById: userId,
        publishedAt: dto.status === JobStatus.ACTIVE ? new Date() : null,
        applicantCap, // ← new
        applicantCount: 0, // ← new
      });
      await manager.save(Job, job);

      if (dto.skills?.length) {
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

    // Duplicating counts as a new post — check slot availability
    await this.limitsService.consumeJobPostSlot(userId); // ← new
    const applicantCap = await this.limitsService.getApplicantCap(userId); // ← new

    const {
      id: _id,
      createdAt: _ca,
      updatedAt: _ua,
      publishedAt: _pa,
      expiresAt: _ea,
      viewsCount: _vc,
      applicantsCount: _ac,
      company: _company,
      jobSkills: _js,
      ...rest
    } = job as any;

    const copy = this.jobRepo.create({
      ...rest,
      title: `${job.title} (copy)`,
      status: JobStatus.DRAFT,
      publishedAt: null,
      deadline: null,
      expiresAt: null,
      applicantCap, // ← new: fresh cap from current plan
      applicantCount: 0, // ← new: reset counter
      capReachedAt: null, // ← new
      isFeatured: false, // ← new: don't copy featured status
      featuredUntil: null, // ← new
    } as Job);

    return this.jobRepo.save(copy);
  }

  // ── Employer: Soft delete ───────────────────────────────────────────────────
  async remove(jobId: string, userId: string): Promise<void> {
    await this.findOwnedOrFail(jobId, userId);
    await this.jobRepo.softDelete(jobId);
  }

  // ── Public: Browse with filters ─────────────────────────────────────────────
  async findAll(query: QueryJobsDto, userId?: string) {
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
      matched = false,
    } = query;

    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Fetch applicant skills if matched feed requested
    let applicantSkills: string[] = [];
    if (matched && userId) {
      const profile = await this.profileRepo.findOne({
        where: { userId },
        select: ['skills'],
      });
      applicantSkills = profile?.skills ?? [];
    }

    const qb = this.jobRepo
      .createQueryBuilder('j')
      .innerJoinAndSelect('j.company', 'c')
      .where('j.status = :status', { status: JobStatus.ACTIVE })
      .andWhere('j.deleted_at IS NULL')
      .andWhere('(j.deadline IS NULL OR j.deadline >= :today)', { today })
      .andWhere('(j.expires_at IS NULL OR j.expires_at > :now)', { now });

    if (q)
      qb.andWhere('(j.title ILIKE :q OR j.description ILIKE :q)', {
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

    // ── Skill match scoring ─────────────────────────────────────────────────
    if (applicantSkills.length > 0) {
      // Add a computed match_score: count of overlapping skills
      qb.addSelect(
        `(SELECT COUNT(*) FROM unnest(j.skills) s WHERE s = ANY(:applicantSkills))`,
        'match_score',
      ).setParameter('applicantSkills', applicantSkills);

      qb.addOrderBy(
        `(SELECT COUNT(*) FROM unnest(j.skills) s WHERE s = ANY(:applicantSkills))`,
        'DESC',
      );
    }

    // Featured always floats to top within same match tier
    qb.addOrderBy('j.isFeatured', 'DESC');

    if (sort === 'salary') qb.addOrderBy('j.salaryMax', 'DESC', 'NULLS LAST');
    else if (sort === 'relevance') qb.addOrderBy('j.applicantsCount', 'ASC');
    else qb.addOrderBy('j.publishedAt', 'DESC');

    const [items, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
  // ── Public: Single job ──────────────────────────────────────────────────────
  async findOne(jobId: string, viewerId?: string): Promise<Job> {
    const job = await this.jobRepo.findOne({
      where: { id: jobId },
      relations: ['company', 'company.perks'],
    });
    if (!job) throw new NotFoundException('Job not found');

    // ✅ Only increment if viewer is not the job owner
    if (!viewerId || job.postedById !== viewerId) {
      await this.jobRepo.increment({ id: jobId }, 'viewsCount', 1);
    }
    return job;
  }

  async getApplicants(jobId: string, userId: string) {
    const job = await this.findOwnedOrFail(jobId, userId); // ✅ no view increment

    const viewLimit =
      await this.limitsService.getViewableApplicantLimit(userId);

    const applicants = await this.dataSource
      .getRepository(Application)
      .createQueryBuilder('a')
      .innerJoinAndSelect('a.applicant', 'u')
      .leftJoinAndSelect('u.applicantProfile', 'ap')
      .leftJoinAndSelect('a.resume', 'r')
      .leftJoinAndSelect('a.statusHistory', 'sh')
      .where('a.jobId = :jobId', { jobId })
      .orderBy('a.appliedAt', 'DESC')
      .take(viewLimit)
      .getMany();

    // ✅ Return job info alongside applicants — frontend needs no second call
    return {
      job: {
        id: job.id,
        title: job.title,
        status: job.status,
        location: job.location,
        type: job.type,
        applicantCount: job.applicantCount,
        applicantCap: job.applicantCap,
      },
      applicants,
      total: applicants.length,
      viewLimit,
    };
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

  // ── Applicant: Save a job ───────────────────────────────────────────────────
  async saveJob(userId: string, jobId: string): Promise<SavedJob> {
    const job = await this.jobRepo.findOne({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');

    const existing = await this.savedJobRepo.findOne({
      where: { userId, jobId },
    });
    if (existing) return existing;

    return this.savedJobRepo.save(this.savedJobRepo.create({ userId, jobId }));
  }

  async unsaveJob(userId: string, jobId: string): Promise<void> {
    await this.savedJobRepo.delete({ userId, jobId });
  }

  async getSavedJobs(userId: string): Promise<SavedJob[]> {
    return this.savedJobRepo.find({
      where: { userId },
      relations: ['job', 'job.company'],
      order: { savedAt: 'DESC' },
    });
  }

  async isJobSaved(userId: string, jobId: string): Promise<boolean> {
    const count = await this.savedJobRepo.count({ where: { userId, jobId } });
    return count > 0;
  }

  async isSaved(jobId: string, userId: string): Promise<boolean> {
    const row = await this.savedJobRepo.findOneBy({ jobId, userId });
    return !!row;
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
  // ── Employer: Job analytics (gated by plan) ──────────────────────────────
  async getJobAnalytics(jobId: string, userId: string) {
    await this.findOwnedOrFail(jobId, userId);

    const limits = await this.limitsService.getLimits(userId);
    const tier = limits.analytics;

    if (tier === AnalyticsTier.NONE) {
      throw new ForbiddenException(
        'Analytics are not available on your current plan. Upgrade to Starter or above.',
      );
    }

    // Base metrics — available on all paid plans
    const job = await this.jobRepo.findOne({
      where: { id: jobId },
      relations: ['company'],
    });

    const applications = await this.dataSource
      .getRepository(Application)
      .createQueryBuilder('a')
      .select('a.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('a.job_id = :jobId', { jobId })
      .groupBy('a.status')
      .getRawMany();

    const totalApps = applications.reduce((s, r) => s + Number(r.count), 0);
    const statusBreakdown = Object.fromEntries(
      applications.map((r) => [r.status, Number(r.count)]),
    );

    const applyRate = job!.viewsCount
      ? Math.round((totalApps / job!.viewsCount) * 100 * 10) / 10
      : 0;

    const base = {
      jobId,
      title: job!.title,
      status: job!.status,
      viewsCount: job!.viewsCount ?? 0,
      totalApplications: totalApps,
      applyRate, // %
      statusBreakdown,
      tier,
    };

    if (tier === AnalyticsTier.BASIC) return base;

    // ADVANCED + ENTERPRISE — time-to-fill, daily views trend, funnel
    const dailyViews = await this.dataSource
      .query(
        `SELECT DATE(created_at) as date, COUNT(*) as views
     FROM job_views
     WHERE job_id = $1 AND created_at > NOW() - INTERVAL '30 days'
     GROUP BY DATE(created_at)
     ORDER BY date ASC`,
        [jobId],
      )
      .catch(() => []); // graceful if job_views table doesn't exist yet

    const shortlisted = statusBreakdown['shortlisted'] ?? 0;
    const interviewed = statusBreakdown['interview'] ?? 0;
    const offered = statusBreakdown['offered'] ?? 0;

    const advanced = {
      ...base,
      funnel: [
        { stage: 'Views', count: job!.viewsCount ?? 0 },
        { stage: 'Applied', count: totalApps },
        { stage: 'Shortlisted', count: shortlisted },
        { stage: 'Interviewed', count: interviewed },
        { stage: 'Offered', count: offered },
      ],
      dailyViews,
      publishedAt: job!.publishedAt,
    };

    if (tier === AnalyticsTier.ADVANCED) return advanced;

    // ENTERPRISE — market intel, benchmark data
    const avgAppsPerJob = await this.dataSource
      .query(
        `SELECT AVG(cnt) as avg FROM (
       SELECT COUNT(*) as cnt FROM applications a
       JOIN jobs j ON j.id = a.job_id
       WHERE j.type = $1 AND j.experience_level = $2
       GROUP BY a.job_id
     ) sub`,
        [job!.type, job!.experienceLevel],
      )
      .catch(() => [{ avg: null }]);

    return {
      ...advanced,
      benchmark: {
        avgApplicationsForSimilarJobs: Math.round(
          Number(avgAppsPerJob[0]?.avg ?? 0),
        ),
        yourPerformance:
          totalApps > Number(avgAppsPerJob[0]?.avg ?? 0) ? 'above' : 'below',
      },
    };
  }

  // ── Employer: Full job detail view with pipeline summary ─────────────────
  async getEmployerJobDetail(jobId: string, userId: string) {
    const job = await this.findOwnedOrFail(jobId, userId);

    const pipeline = await this.dataSource
      .getRepository(Application)
      .createQueryBuilder('a')
      .select('a.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('a.jobId = :jobId', { jobId })
      .groupBy('a.status')
      .getRawMany();

    const recentApplicants = await this.dataSource
      .getRepository(Application)
      .createQueryBuilder('a')
      .innerJoinAndSelect('a.applicant', 'u')
      .leftJoinAndSelect('u.applicantProfile', 'ap')
      .where('a.jobId = :jobId', { jobId })
      .orderBy('a.appliedAt', 'DESC')
      .take(5)
      .getMany();

    return {
      job,
      pipelineSummary: Object.fromEntries(
        pipeline.map((r) => [r.status, Number(r.count)]),
      ),
      recentApplicants,
    };
  }
}
