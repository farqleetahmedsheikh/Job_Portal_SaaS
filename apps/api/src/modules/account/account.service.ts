import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Complaint } from '../admin/entities/complaint.entity';
import { Application } from '../applications/entities/application.entity';
import { Company } from '../companies/entities/company.entity';
import { Job } from '../jobs/entities/job.entity';
import { User } from '../users/entities/user.entity';
import { UpdateAccountPrivacyDto } from './dto/account-privacy.dto';

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Company)
    private readonly companies: Repository<Company>,
    @InjectRepository(Application)
    private readonly applications: Repository<Application>,
    @InjectRepository(Job)
    private readonly jobs: Repository<Job>,
    @InjectRepository(Complaint)
    private readonly complaints: Repository<Complaint>,
  ) {}

  async getPrivacy(userId: string) {
    const user = await this.findUser(userId);
    return this.mapPrivacy(user);
  }

  async updatePrivacy(userId: string, dto: UpdateAccountPrivacyDto) {
    const user = await this.findUser(userId);
    if (dto.country !== undefined) user.country = dto.country;
    if (dto.timezone !== undefined) user.timezone = dto.timezone;
    if (dto.marketingConsent !== undefined) {
      user.marketingConsent = dto.marketingConsent;
    }
    const saved = await this.users.save(user);
    return this.mapPrivacy(saved);
  }

  async requestExport(userId: string) {
    const user = await this.findUser(userId);
    user.dataExportRequestedAt = new Date();
    await this.users.save(user);

    const [company, applications, jobs, complaints] = await Promise.all([
      this.companies.findOne({ where: { ownerId: userId } }),
      this.applications.find({
        where: { applicantId: userId },
        relations: ['job'],
        order: { appliedAt: 'DESC' },
      }),
      this.jobs.find({
        where: { postedById: userId },
        order: { createdAt: 'DESC' },
      }),
      this.complaints.find({
        where: { userId },
        order: { createdAt: 'DESC' },
      }),
    ]);

    return {
      requestedAt: user.dataExportRequestedAt,
      export: {
        profile: this.mapProfile(user),
        company: company ? this.mapCompany(company) : null,
        applications: applications.map((application) => ({
          id: application.id,
          jobId: application.jobId,
          jobTitle: application.job?.title ?? null,
          status: application.status,
          appliedAt: application.appliedAt,
        })),
        jobs: jobs.map((job) => ({
          id: job.id,
          title: job.title,
          status: job.status,
          country: job.country,
          city: job.city,
          currency: job.currency,
          createdAt: job.createdAt,
        })),
        complaints: complaints.map((complaint) => ({
          id: complaint.id,
          type: complaint.type,
          subject: complaint.subject,
          message: complaint.message,
          status: complaint.status,
          response: complaint.response,
          createdAt: complaint.createdAt,
          updatedAt: complaint.updatedAt,
        })),
      },
    };
  }

  async requestDeletion(userId: string) {
    const user = await this.findUser(userId);
    user.deletionRequestedAt = user.deletionRequestedAt ?? new Date();
    const saved = await this.users.save(user);
    return {
      status: 'requested',
      deletionRequestedAt: saved.deletionRequestedAt,
    };
  }

  async getDeletionStatus(userId: string) {
    const user = await this.findUser(userId);
    return {
      status: user.deletionRequestedAt ? 'requested' : 'not_requested',
      deletionRequestedAt: user.deletionRequestedAt ?? null,
    };
  }

  private async findUser(userId: string): Promise<User> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private mapPrivacy(user: User) {
    return {
      id: user.id,
      email: user.email,
      country: user.country,
      timezone: user.timezone,
      marketingConsent: user.marketingConsent,
      termsAcceptedAt: user.termsAcceptedAt ?? null,
      privacyAcceptedAt: user.privacyAcceptedAt ?? null,
      dataExportRequestedAt: user.dataExportRequestedAt ?? null,
      deletionRequestedAt: user.deletionRequestedAt ?? null,
    };
  }

  private mapProfile(user: User) {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      country: user.country,
      timezone: user.timezone,
      marketingConsent: user.marketingConsent,
      termsAcceptedAt: user.termsAcceptedAt ?? null,
      privacyAcceptedAt: user.privacyAcceptedAt ?? null,
      createdAt: user.createdAt,
    };
  }

  private mapCompany(company: Company) {
    return {
      id: company.id,
      companyName: company.companyName,
      industry: company.industry,
      location: company.location,
      country: company.country,
      city: company.city,
      timezone: company.timezone,
      websiteUrl: company.websiteUrl,
      isVerified: company.isVerified,
    };
  }
}
