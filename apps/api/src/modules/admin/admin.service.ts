import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Brackets, In, IsNull, Repository, SelectQueryBuilder } from 'typeorm';
import {
  BillingEventType,
  ComplaintStatus,
  ComplaintType,
  ContractUsagePaymentStatus,
  SubscriptionPlan,
  SubscriptionStatus,
  SystemLogLevel,
  VerificationStatus,
} from '../../common/enums/enums';
import { UserRole } from '../../common/enums/user-role.enum';
import { PLAN_PRICES } from '../../config/plan-limits.config';
import { Application } from '../applications/entities/application.entity';
import { BillingEvent } from '../billing/entities/billing-event.entity';
import { Subscription } from '../billing/entities/subscription.entity';
import { VerificationDoc } from '../billing/entities/verification-doc.entity';
import { Company } from '../companies/entities/company.entity';
import { ContractUsage } from '../contracts/entities/contract-usage.entity';
import { Job } from '../jobs/entities/job.entity';
import { User } from '../users/entities/user.entity';
import {
  CreateAdminUserDto,
  RejectCompanyDto,
  SuggestSupportReplyDto,
  UpdateAdminUserDto,
  UpdateComplaintDto,
} from './dto/admin-actions.dto';
import {
  QueryAdminCompaniesDto,
  QueryAdminUsersDto,
  QueryActivitiesDto,
  QueryComplaintsDto,
  QueryLogsDto,
  QueryTransactionsDto,
} from './dto/admin-query.dto';
import { AdminActivity } from './entities/admin-activity.entity';
import { Complaint } from './entities/complaint.entity';
import { SystemLog } from './entities/system-log.entity';

const ADMIN_ROLES: readonly UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.SUPERVISOR,
] as const;
const NORMAL_USER_ROLES: readonly UserRole[] = [
  UserRole.APPLICANT,
  UserRole.EMPLOYER,
] as const;
const SUPPORT_ASSIGNABLE_ROLES: readonly UserRole[] = [
  UserRole.ADMIN,
  UserRole.SUPERVISOR,
] as const;
const SUPERVISOR_STATUSES: readonly ComplaintStatus[] = [
  ComplaintStatus.IN_PROGRESS,
  ComplaintStatus.RESOLVED,
] as const;

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Company) private readonly companies: Repository<Company>,
    @InjectRepository(Job) private readonly jobs: Repository<Job>,
    @InjectRepository(Application)
    private readonly applications: Repository<Application>,
    @InjectRepository(Subscription)
    private readonly subscriptions: Repository<Subscription>,
    @InjectRepository(BillingEvent)
    private readonly billingEvents: Repository<BillingEvent>,
    @InjectRepository(VerificationDoc)
    private readonly verificationDocs: Repository<VerificationDoc>,
    @InjectRepository(ContractUsage)
    private readonly contractUsages: Repository<ContractUsage>,
    @InjectRepository(Complaint)
    private readonly complaints: Repository<Complaint>,
    @InjectRepository(SystemLog)
    private readonly systemLogs: Repository<SystemLog>,
    @InjectRepository(AdminActivity)
    private readonly activities: Repository<AdminActivity>,
    private readonly config: ConfigService,
  ) {}

  async dashboard(adminId: string, adminRole: UserRole) {
    if (adminRole === UserRole.SUPERVISOR) {
      return this.supportDashboard(adminId);
    }

    const [
      totalUsers,
      totalEmployers,
      totalApplicants,
      totalJobs,
      totalApplications,
      activeSubscriptions,
      pendingVerifications,
      openComplaints,
      recentActivity,
      recentErrors,
      totalRevenue,
    ] = await Promise.all([
      this.users.count(),
      this.users.count({ where: { role: UserRole.EMPLOYER } }),
      this.users.count({ where: { role: UserRole.APPLICANT } }),
      this.jobs.count(),
      this.applications.count(),
      this.subscriptions.count({
        where: { status: SubscriptionStatus.ACTIVE },
      }),
      this.companies.count({
        where: { verificationStatus: VerificationStatus.PENDING },
      }),
      this.complaints.count({ where: { status: ComplaintStatus.OPEN } }),
      this.activities.find({
        order: { createdAt: 'DESC' },
        take: 8,
        relations: ['admin'],
      }),
      this.systemLogs.find({
        where: { level: SystemLogLevel.ERROR },
        order: { createdAt: 'DESC' },
        take: 6,
      }),
      adminRole === UserRole.SUPER_ADMIN
        ? this.totalRevenue()
        : Promise.resolve(null),
    ]);

    await this.recordActivity(adminId, 'admin.dashboard.viewed');

    return {
      role: adminRole,
      totalUsers,
      totalEmployers,
      totalApplicants,
      totalJobs,
      totalApplications,
      totalRevenue,
      activeSubscriptions,
      pendingVerifications,
      openComplaints,
      recentActivity: recentActivity.map((row) => this.mapActivity(row)),
      recentErrors,
    };
  }

  private async supportDashboard(adminId: string) {
    const [
      openComplaints,
      assignedComplaints,
      unassignedComplaints,
      resolvedComplaints,
      recentComplaints,
      recentActivity,
    ] = await Promise.all([
      this.complaints.count({
        where: [
          { status: ComplaintStatus.OPEN, assignedTo: IsNull() },
          { status: ComplaintStatus.OPEN, assignedTo: adminId },
        ],
      }),
      this.complaints.count({
        where: {
          assignedTo: adminId,
          status: In([ComplaintStatus.OPEN, ComplaintStatus.IN_PROGRESS]),
        },
      }),
      this.complaints.count({
        where: { assignedTo: IsNull(), status: ComplaintStatus.OPEN },
      }),
      this.complaints.count({
        where: { assignedTo: adminId, status: ComplaintStatus.RESOLVED },
      }),
      this.complaints.find({
        where: [{ assignedTo: IsNull() }, { assignedTo: adminId }],
        relations: ['user', 'assignee'],
        order: { createdAt: 'DESC' },
        take: 8,
      }),
      this.activities.find({
        where: { adminId },
        order: { createdAt: 'DESC' },
        take: 8,
        relations: ['admin'],
      }),
    ]);

    await this.recordActivity(adminId, 'admin.support_dashboard.viewed');

    return {
      role: UserRole.SUPERVISOR,
      openComplaints,
      assignedComplaints,
      unassignedComplaints,
      resolvedComplaints,
      recentComplaints: recentComplaints.map((row) => this.mapComplaint(row)),
      recentActivity: recentActivity.map((row) => this.mapActivity(row)),
    };
  }

  async createAdmin(adminId: string, dto: CreateAdminUserDto) {
    if (!ADMIN_ROLES.includes(dto.role)) {
      throw new BadRequestException('Only admin roles can be created here');
    }
    const existing = await this.users.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already exists');

    const bcryptRounds = this.config.get<number>('app.bcryptRounds') ?? 12;
    const passwordHash = await bcrypt.hash(dto.password, bcryptRounds);
    const user = await this.users.save(
      this.users.create({
        email: dto.email,
        fullName: dto.fullName,
        passwordHash,
        role: dto.role,
        isProfileComplete: true,
        isEmailVerified: true,
      }),
    );
    await this.recordActivity(adminId, 'admin.user.created', 'user', user.id, {
      role: dto.role,
    });
    return this.safeUser(user);
  }

  async listAdminUsers(query: QueryAdminUsersDto) {
    if (query.role && !this.isAdminRole(query.role)) {
      throw new BadRequestException(
        'Only admin staff roles can be listed here',
      );
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const qb = this.users
      .createQueryBuilder('user')
      .where('user.role IN (:...roles)', {
        roles: query.role ? [query.role] : [...ADMIN_ROLES],
      });

    this.applyUserFilters(qb, query);

    const [rows, total] = await qb
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: rows.map((user) => this.safeUser(user)),
      meta: { page, limit, total },
    };
  }

  async listUsers(query: QueryAdminUsersDto, adminRole: UserRole) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const qb = this.users.createQueryBuilder('user');

    if (adminRole === UserRole.ADMIN) {
      if (query.role && !NORMAL_USER_ROLES.includes(query.role)) {
        throw new ForbiddenException('Admins cannot access admin-team users');
      }
      qb.andWhere('user.role IN (:...roles)', {
        roles: [...NORMAL_USER_ROLES],
      });
    }

    this.applyUserFilters(qb, query);
    if (query.role) qb.andWhere('user.role = :role', { role: query.role });

    const [rows, total] = await qb
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: rows.map((user) => this.safeUser(user)),
      meta: { page, limit, total },
    };
  }

  async updateUser(
    adminId: string,
    adminRole: UserRole,
    userId: string,
    dto: UpdateAdminUserDto,
  ) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const originalRole = user.role;
    const originalActive = user.isActive;

    if (userId === adminId && dto.isActive === false) {
      throw new ForbiddenException('You cannot deactivate your own account');
    }
    if (userId === adminId && dto.role) {
      throw new ForbiddenException('You cannot change your own admin role');
    }
    if (dto.role && adminRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only super admins can change roles');
    }
    if (dto.role && !Object.values(UserRole).includes(dto.role)) {
      throw new BadRequestException('Invalid role');
    }
    if (adminRole === UserRole.ADMIN && this.isAdminRole(user.role)) {
      throw new ForbiddenException('Admins cannot manage admin-team users');
    }

    if (dto.isActive !== undefined) user.isActive = dto.isActive;
    if (dto.role) user.role = dto.role;
    const saved = await this.users.save(user);

    const activityWrites: Promise<void>[] = [];
    if (dto.role && dto.role !== originalRole) {
      activityWrites.push(
        this.recordActivity(
          adminId,
          'admin.user.role_changed',
          'user',
          userId,
          {
            from: originalRole,
            to: dto.role,
          },
        ),
      );
    }
    if (dto.isActive !== undefined && dto.isActive !== originalActive) {
      activityWrites.push(
        this.recordActivity(
          adminId,
          dto.isActive ? 'admin.user.unbanned' : 'admin.user.banned',
          'user',
          userId,
          { role: saved.role },
        ),
      );
    }
    if (!activityWrites.length) {
      activityWrites.push(
        this.recordActivity(adminId, 'admin.user.updated', 'user', userId),
      );
    }
    await Promise.all(activityWrites);

    return this.safeUser(saved);
  }

  async listCompanies(query: QueryAdminCompaniesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const qb = this.companies
      .createQueryBuilder('company')
      .leftJoinAndSelect('company.owner', 'owner')
      .loadRelationCountAndMap('company.activeJobs', 'company.jobs', 'job');
    if (query.search) {
      qb.andWhere('company.companyName ILIKE :search', {
        search: `%${query.search}%`,
      });
    }
    if (query.verificationStatus) {
      qb.andWhere('company.verificationStatus = :status', {
        status: query.verificationStatus,
      });
    }
    const [rows, total] = await qb
      .orderBy('company.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return {
      data: rows.map((company) => ({
        id: company.id,
        companyName: company.companyName,
        owner: company.owner
          ? {
              id: company.owner.id,
              name: company.owner.fullName,
              email: company.owner.email,
            }
          : null,
        verificationStatus: company.verificationStatus,
        isVerified: company.isVerified,
        activeJobs:
          (company as Company & { activeJobs?: number }).activeJobs ?? 0,
        complaints: null,
        createdAt: company.createdAt,
      })),
      meta: { page, limit, total },
    };
  }

  async verifyCompany(adminId: string, companyId: string) {
    const company = await this.companyOrFail(companyId);
    company.isVerified = true;
    company.verificationStatus = VerificationStatus.VERIFIED;
    company.verificationStartedAt = company.verificationStartedAt ?? new Date();
    company.verificationExpiresAt =
      company.verificationExpiresAt ??
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await this.companies.save(company);
    await this.verificationDocs.update(
      { userId: company.ownerId, status: VerificationStatus.PENDING },
      {
        status: VerificationStatus.VERIFIED,
        reviewedAt: new Date(),
        reviewedById: adminId,
      },
    );
    await this.recordActivity(
      adminId,
      'admin.company.verified',
      'company',
      companyId,
    );
    return company;
  }

  async rejectCompany(
    adminId: string,
    companyId: string,
    dto: RejectCompanyDto,
  ) {
    const company = await this.companyOrFail(companyId);
    company.isVerified = false;
    company.verificationStatus = VerificationStatus.REJECTED;
    company.verificationRejectionReason =
      dto.reason ?? 'Rejected by admin review';
    await this.companies.save(company);
    await this.verificationDocs.update(
      { userId: company.ownerId, status: VerificationStatus.PENDING },
      {
        status: VerificationStatus.REJECTED,
        rejectionReason: company.verificationRejectionReason,
        reviewedAt: new Date(),
        reviewedById: adminId,
      },
    );
    await this.recordActivity(
      adminId,
      'admin.company.rejected',
      'company',
      companyId,
      {
        reason: dto.reason,
      },
    );
    return company;
  }

  async listComplaints(
    query: QueryComplaintsDto,
    adminId: string,
    adminRole: UserRole,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const qb = this.complaints
      .createQueryBuilder('complaint')
      .leftJoinAndSelect('complaint.user', 'user')
      .leftJoinAndSelect('complaint.assignee', 'assignee');
    if (query.status) {
      qb.andWhere('complaint.status = :status', { status: query.status });
    }
    if (query.type) qb.andWhere('complaint.type = :type', { type: query.type });
    if (adminRole === UserRole.SUPERVISOR) {
      qb.andWhere(
        '(complaint.assignedTo IS NULL OR complaint.assignedTo = :adminId)',
        { adminId },
      );
    }
    const [rows, total] = await qb
      .orderBy('complaint.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return {
      data: rows.map((complaint) => this.mapComplaint(complaint)),
      meta: { page, limit, total },
    };
  }

  async listComplaintAssignees() {
    const rows = await this.users.find({
      where: {
        role: In([...SUPPORT_ASSIGNABLE_ROLES]),
        isActive: true,
      },
      order: { fullName: 'ASC' },
    });

    return { data: rows.map((user) => this.safeUser(user)) };
  }

  async updateComplaint(
    adminId: string,
    adminRole: UserRole,
    id: string,
    dto: UpdateComplaintDto,
  ) {
    const complaint = await this.complaintForAdmin(id, adminId, adminRole);
    const originalStatus = complaint.status;
    const originalAssignedTo = complaint.assignedTo;
    const originalAdminNote = complaint.adminNote;
    const originalResponse = complaint.response;

    if (adminRole === UserRole.SUPERVISOR) {
      this.assertSupervisorComplaintUpdate(complaint, adminId, dto);
    }

    if (dto.status) complaint.status = dto.status;
    if (dto.assignedTo !== undefined) {
      complaint.assignedTo =
        adminRole === UserRole.SUPERVISOR
          ? adminId
          : await this.resolveComplaintAssignee(dto.assignedTo);
    }
    if (dto.adminNote !== undefined) complaint.adminNote = dto.adminNote;
    if (dto.response !== undefined) complaint.response = dto.response;
    const saved = await this.complaints.save(complaint);

    const activityWrites: Promise<void>[] = [];
    if (
      dto.assignedTo !== undefined &&
      originalAssignedTo !== saved.assignedTo
    ) {
      activityWrites.push(
        this.recordActivity(
          adminId,
          'admin.complaint.assigned',
          'complaint',
          id,
          { from: originalAssignedTo, to: saved.assignedTo },
        ),
      );
    }
    if (dto.status && originalStatus !== saved.status) {
      activityWrites.push(
        this.recordActivity(
          adminId,
          'admin.complaint.status_changed',
          'complaint',
          id,
          { from: originalStatus, to: saved.status },
        ),
      );
      if (
        saved.status === ComplaintStatus.RESOLVED &&
        (saved.relatedJobId || saved.relatedCompanyId || saved.relatedUserId)
      ) {
        activityWrites.push(
          this.recordActivity(
            adminId,
            'admin.report.resolved',
            'complaint',
            id,
          ),
        );
      }
    }
    if (dto.adminNote !== undefined && originalAdminNote !== saved.adminNote) {
      activityWrites.push(
        this.recordActivity(
          adminId,
          'admin.complaint.note_saved',
          'complaint',
          id,
          { hasInternalNote: Boolean(saved.adminNote) },
        ),
      );
    }
    if (dto.response !== undefined && originalResponse !== saved.response) {
      activityWrites.push(
        this.recordActivity(
          adminId,
          'admin.complaint.response_saved',
          'complaint',
          id,
          { hasResponse: Boolean(saved.response) },
        ),
      );
    }
    if (!activityWrites.length) {
      activityWrites.push(
        this.recordActivity(
          adminId,
          'admin.complaint.updated',
          'complaint',
          id,
        ),
      );
    }
    await Promise.all(activityWrites);

    return this.mapComplaint(saved);
  }

  async transactions(query: QueryTransactionsDto, adminId: string) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [billing, contract] = await Promise.all([
      this.billingEvents.find({
        relations: ['user'],
        order: { createdAt: query.sort === 'amount' ? 'ASC' : 'DESC' },
        take: limit,
      }),
      this.contractUsages.find({
        order: { usedAt: 'DESC' },
        take: limit,
      }),
    ]);
    await this.recordActivity(adminId, 'admin.transactions.viewed');
    const rows = [
      ...billing.map((event) => ({
        id: event.id,
        source: 'billing',
        company: null,
        plan: typeof event.meta?.plan === 'string' ? event.meta.plan : null,
        amount: Number(event.amount),
        currency: event.currency,
        status: 'paid',
        type: event.type,
        date: event.createdAt,
        user: event.user ? this.safeUser(event.user) : null,
      })),
      ...contract.map((usage) => ({
        id: usage.id,
        source: 'contracts',
        company: usage.companyId,
        plan: null,
        amount: usage.amount,
        currency: 'PKR',
        status: usage.paymentStatus,
        type: 'contract_template_usage',
        date: usage.usedAt,
        user: null,
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);

    return { data: rows, meta: { page, limit, total: rows.length } };
  }

  async listSubscriptions(query: QueryTransactionsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [rows, total] = await this.subscriptions.findAndCount({
      relations: ['user'],
      order: { updatedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      data: rows.map((sub) => ({
        id: sub.id,
        plan: sub.plan,
        status: sub.status,
        billingInterval: sub.billingInterval,
        currency: sub.currency,
        trialEndAt: sub.trialEndAt,
        currentPeriodEnd: sub.currentPeriodEnd,
        user: sub.user ? this.safeUser(sub.user) : null,
      })),
      meta: { page, limit, total },
    };
  }

  async logs(query: QueryLogsDto, adminId: string) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const qb = this.systemLogs.createQueryBuilder('log');
    if (query.level) qb.andWhere('log.level = :level', { level: query.level });
    if (query.route)
      qb.andWhere('log.route ILIKE :route', { route: `%${query.route}%` });
    const [rows, total] = await qb
      .orderBy('log.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    await this.recordActivity(adminId, 'admin.logs.viewed');
    return { data: rows, meta: { page, limit, total } };
  }

  async listActivities(query: QueryActivitiesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const qb = this.activities
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.admin', 'admin');

    if (query.action) {
      qb.andWhere('activity.action ILIKE :action', {
        action: `%${query.action}%`,
      });
    }

    const [rows, total] = await qb
      .orderBy('activity.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: rows.map((row) => this.mapActivity(row)),
      meta: { page, limit, total },
    };
  }

  async suggestSupportReply(
    adminId: string,
    adminRole: UserRole,
    dto: SuggestSupportReplyDto,
  ) {
    const complaint = await this.complaintForAdmin(
      dto.complaintId,
      adminId,
      adminRole,
    );
    const tone = dto.tone ?? 'professional';
    const riskLevel = this.complaintRisk(complaint);
    const summary = `${complaint.type} complaint from ${complaint.user?.fullName ?? 'a user'}: ${complaint.message.slice(0, 220)}`;
    const recommendedAction =
      riskLevel === 'high'
        ? 'Escalate to a senior admin before responding.'
        : complaint.type === ComplaintType.BILLING
          ? 'Check safe billing metadata and confirm next steps without exposing internal payment details.'
          : 'Acknowledge the issue, request any missing details, and set a clear follow-up expectation.';
    const suggestion = this.supportReply(tone, complaint, dto.notes);
    await this.recordActivity(
      adminId,
      'admin.ai_support.suggested_reply',
      'complaint',
      complaint.id,
      { tone, riskLevel },
    );
    return { suggestion, summary, recommendedAction, riskLevel };
  }

  async revenueInsights(adminId: string) {
    const [
      totalRevenue,
      activeSubscriptions,
      trialUsers,
      churnedSubscriptions,
      contractTemplateRevenue,
      planDistribution,
      revenueByMonth,
      topCompaniesBySpend,
    ] = await Promise.all([
      this.totalRevenue(),
      this.subscriptions.count({
        where: { status: SubscriptionStatus.ACTIVE },
      }),
      this.subscriptions.count({
        where: { status: SubscriptionStatus.TRIALING },
      }),
      this.subscriptions.count({
        where: { status: SubscriptionStatus.CANCELLED },
      }),
      this.contractRevenue(),
      this.planDistribution(),
      this.revenueByMonth(),
      this.topCompaniesBySpend(),
    ]);
    const monthlyRecurringRevenue = await this.monthlyRecurringRevenue();
    const failedPayments = null;
    const verificationRevenue = null;
    const upgradeRate = null;

    const insights = [
      trialUsers > 0
        ? {
            type: 'opportunity',
            title: `${trialUsers} trial users may convert soon`,
            description:
              'Follow up with companies nearing the end of their trial.',
            actionLabel: 'View subscriptions',
            actionHref: '/admin/transactions',
          }
        : {
            type: 'info',
            title: 'Trial pipeline is quiet',
            description: 'No active trials are currently recorded.',
          },
      contractTemplateRevenue > 0
        ? {
            type: 'opportunity',
            title: `Contract templates generated PKR ${contractTemplateRevenue}`,
            description:
              'One-time template usage is creating additional revenue.',
            actionLabel: 'View transactions',
            actionHref: '/admin/transactions',
          }
        : {
            type: 'info',
            title: 'No contract template revenue yet',
            description:
              'Pay-per-use template purchases will appear here once used.',
          },
    ];

    await this.recordActivity(adminId, 'admin.revenue_insights.viewed');
    return {
      totalRevenue,
      monthlyRecurringRevenue,
      activeSubscriptions,
      trialUsers,
      churnedSubscriptions,
      planDistribution,
      upgradeRate,
      oneTimePaymentsRevenue: contractTemplateRevenue,
      verificationRevenue,
      contractTemplateRevenue,
      failedPayments,
      revenueByMonth,
      topCompaniesBySpend,
      insights,
    };
  }

  private async totalRevenue(): Promise<number> {
    const [billing, contracts] = await Promise.all([
      this.billingEvents
        .createQueryBuilder('event')
        .select('COALESCE(SUM(event.amount), 0)', 'total')
        .where('event.type IN (:...types)', {
          types: [
            BillingEventType.SUBSCRIPTION_CHARGE,
            BillingEventType.ADDON_CHARGE,
          ],
        })
        .getRawOne<{ total: string }>(),
      this.contractUsages
        .createQueryBuilder('usage')
        .select('COALESCE(SUM(usage.amount), 0)', 'total')
        .where('usage.payment_status = :status', {
          status: ContractUsagePaymentStatus.PAID,
        })
        .getRawOne<{ total: string }>(),
    ]);
    return Number(billing?.total ?? 0) + Number(contracts?.total ?? 0);
  }

  private async contractRevenue(): Promise<number> {
    const row = await this.contractUsages
      .createQueryBuilder('usage')
      .select('COALESCE(SUM(usage.amount), 0)', 'total')
      .where('usage.payment_status = :status', {
        status: ContractUsagePaymentStatus.PAID,
      })
      .getRawOne<{ total: string }>();
    return Number(row?.total ?? 0);
  }

  private async monthlyRecurringRevenue(): Promise<number> {
    const rows = await this.subscriptions.find({
      where: { status: SubscriptionStatus.ACTIVE },
    });
    return rows.reduce((sum, sub) => sum + (PLAN_PRICES[sub.plan] ?? 0), 0);
  }

  private async planDistribution() {
    const rows = await this.subscriptions
      .createQueryBuilder('sub')
      .select('sub.plan', 'plan')
      .addSelect('COUNT(*)', 'count')
      .groupBy('sub.plan')
      .getRawMany<{ plan: SubscriptionPlan; count: string }>();
    return Object.values(SubscriptionPlan).map((plan) => ({
      plan,
      count: Number(rows.find((row) => row.plan === plan)?.count ?? 0),
    }));
  }

  private async revenueByMonth() {
    const rows = await this.billingEvents
      .createQueryBuilder('event')
      .select(
        "TO_CHAR(DATE_TRUNC('month', event.created_at), 'YYYY-MM')",
        'month',
      )
      .addSelect('COALESCE(SUM(event.amount), 0)', 'revenue')
      .groupBy("DATE_TRUNC('month', event.created_at)")
      .orderBy("DATE_TRUNC('month', event.created_at)", 'ASC')
      .limit(12)
      .getRawMany<{ month: string; revenue: string }>();
    return rows.map((row) => ({
      month: row.month,
      revenue: Number(row.revenue),
    }));
  }

  private async topCompaniesBySpend() {
    const rows = await this.billingEvents
      .createQueryBuilder('event')
      .innerJoin(Company, 'company', 'company.owner_id = event.user_id')
      .leftJoin(Subscription, 'sub', 'sub.user_id = event.user_id')
      .select('company.id', 'companyId')
      .addSelect('company.company_name', 'companyName')
      .addSelect('sub.plan', 'plan')
      .addSelect('COALESCE(SUM(event.amount), 0)', 'totalSpend')
      .addSelect('MAX(event.created_at)', 'lastPaymentDate')
      .groupBy('company.id')
      .addGroupBy('sub.plan')
      .orderBy('COALESCE(SUM(event.amount), 0)', 'DESC')
      .limit(8)
      .getRawMany<{
        companyId: string;
        companyName: string;
        plan: SubscriptionPlan | null;
        totalSpend: string;
        lastPaymentDate: Date;
      }>();
    return rows.map((row) => ({
      companyId: row.companyId,
      companyName: row.companyName,
      plan: row.plan,
      totalSpend: Number(row.totalSpend),
      lastPaymentDate: row.lastPaymentDate,
    }));
  }

  private applyUserFilters(
    qb: SelectQueryBuilder<User>,
    query: QueryAdminUsersDto,
  ): void {
    if (query.search) {
      qb.andWhere(
        new Brackets((where) => {
          where
            .where('user.fullName ILIKE :search', {
              search: `%${query.search}%`,
            })
            .orWhere('user.email ILIKE :search', {
              search: `%${query.search}%`,
            });
        }),
      );
    }
    if (query.active !== undefined) {
      qb.andWhere('user.isActive = :active', {
        active: query.active === 'true',
      });
    }
    if (query.banned !== undefined) {
      qb.andWhere('user.isActive = :bannedActive', {
        bannedActive: query.banned !== 'true',
      });
    }
  }

  private isAdminRole(role: UserRole): boolean {
    return ADMIN_ROLES.includes(role);
  }

  private async companyOrFail(companyId: string): Promise<Company> {
    const company = await this.companies.findOne({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  private async resolveComplaintAssignee(
    assignedTo: string | null,
  ): Promise<string | null> {
    if (assignedTo === null) return null;

    const assignee = await this.users.findOne({
      where: { id: assignedTo, isActive: true },
    });
    if (!assignee) {
      throw new BadRequestException('Assignee not found');
    }
    if (!SUPPORT_ASSIGNABLE_ROLES.includes(assignee.role)) {
      throw new BadRequestException(
        'Complaints can only be assigned to admins or supervisors',
      );
    }
    return assignee.id;
  }

  private async complaintForAdmin(
    id: string,
    adminId: string,
    adminRole: UserRole,
  ): Promise<Complaint> {
    const complaint = await this.complaints.findOne({
      where: { id },
      relations: ['user', 'assignee'],
    });
    if (!complaint) throw new NotFoundException('Complaint not found');
    if (
      adminRole === UserRole.SUPERVISOR &&
      complaint.assignedTo &&
      complaint.assignedTo !== adminId
    ) {
      throw new ForbiddenException('Complaint is assigned to another admin');
    }
    return complaint;
  }

  private assertSupervisorComplaintUpdate(
    complaint: Complaint,
    adminId: string,
    dto: UpdateComplaintDto,
  ): void {
    if (dto.assignedTo !== undefined && dto.assignedTo !== adminId) {
      throw new ForbiddenException(
        'Supervisors can only assign unassigned complaints to themselves',
      );
    }
    if (dto.status && !SUPERVISOR_STATUSES.includes(dto.status)) {
      throw new BadRequestException(
        'Supervisors can only mark complaints in progress or resolved',
      );
    }

    const willAssignToSelf =
      complaint.assignedTo === null && dto.assignedTo === adminId;
    const canEdit = complaint.assignedTo === adminId || willAssignToSelf;
    const hasMutation =
      dto.status !== undefined ||
      dto.adminNote !== undefined ||
      dto.response !== undefined;

    if (hasMutation && !canEdit) {
      throw new ForbiddenException(
        'Assign the complaint to yourself before updating it',
      );
    }
  }

  private complaintRisk(complaint: Complaint): 'low' | 'medium' | 'high' {
    const text = complaint.message.toLowerCase();
    if (
      text.includes('security') ||
      text.includes('legal') ||
      text.includes('breach')
    ) {
      return 'high';
    }
    if (complaint.type === ComplaintType.BILLING || text.includes('refund'))
      return 'medium';
    return 'low';
  }

  private supportReply(
    tone: 'professional' | 'friendly' | 'firm',
    complaint: Complaint,
    notes?: string,
  ): string {
    const greeting = tone === 'friendly' ? 'Hi there,' : 'Hello,';
    const close =
      tone === 'firm'
        ? 'We will follow the documented process and keep you updated.'
        : 'We will keep you updated as we review this.';
    return `${greeting}

Thank you for contacting HiringFly. We have reviewed your ${complaint.type} request and understand the issue you reported: "${complaint.message.slice(0, 260)}".

${notes ? `Context noted by our team: ${notes}\n\n` : ''}Our next step is to verify the relevant account details and follow up with a clear resolution path. ${close}

Best,
HiringFly Support`;
  }

  private async recordActivity(
    adminId: string,
    action: string,
    targetType?: string,
    targetId?: string,
    meta?: Record<string, unknown>,
  ): Promise<void> {
    await this.activities.save(
      this.activities.create({
        adminId,
        action,
        targetType: targetType ?? null,
        targetId: targetId ?? null,
        meta: meta ?? null,
      }),
    );
  }

  private mapActivity(row: AdminActivity) {
    return {
      id: row.id,
      action: row.action,
      targetType: row.targetType,
      targetId: row.targetId,
      createdAt: row.createdAt,
      admin: row.admin
        ? { id: row.admin.id, name: row.admin.fullName, email: row.admin.email }
        : null,
    };
  }

  private mapComplaint(complaint: Complaint) {
    return {
      id: complaint.id,
      type: complaint.type,
      subject: complaint.subject,
      message: complaint.message,
      status: complaint.status,
      assignedTo: complaint.assignedTo,
      adminNote: complaint.adminNote,
      response: complaint.response,
      relatedJobId: complaint.relatedJobId,
      relatedCompanyId: complaint.relatedCompanyId,
      relatedUserId: complaint.relatedUserId,
      createdAt: complaint.createdAt,
      updatedAt: complaint.updatedAt,
      user: complaint.user
        ? {
            id: complaint.user.id,
            name: complaint.user.fullName,
            email: complaint.user.email,
            role: complaint.user.role,
          }
        : null,
      assignee: complaint.assignee
        ? {
            id: complaint.assignee.id,
            name: complaint.assignee.fullName,
            email: complaint.assignee.email,
            role: complaint.assignee.role,
          }
        : null,
    };
  }

  private safeUser(user: User) {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      isProfileComplete: user.isProfileComplete,
      createdAt: user.createdAt,
      lastActiveAt: user.lastActiveAt,
    };
  }
}
