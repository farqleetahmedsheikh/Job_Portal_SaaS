import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ComplaintStatus, ComplaintType } from '../../common/enums/enums';
import { UserRole } from '../../common/enums/user-role.enum';
import { AdminActivity } from '../admin/entities/admin-activity.entity';
import { Complaint } from '../admin/entities/complaint.entity';
import {
  CreateComplaintDto,
  QueryMyComplaintsDto,
  ReportTargetDto,
} from './dto/create-complaint.dto';

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(Complaint)
    private readonly complaints: Repository<Complaint>,
    @InjectRepository(AdminActivity)
    private readonly activities: Repository<AdminActivity>,
  ) {}

  async createComplaint(
    userId: string,
    role: UserRole,
    dto: CreateComplaintDto,
  ) {
    this.assertSupportUser(role);

    const complaint = await this.complaints.save(
      this.complaints.create({
        userId,
        type: dto.type,
        subject: dto.subject ?? null,
        message: dto.message,
        status: ComplaintStatus.OPEN,
        assignedTo: null,
        relatedJobId: dto.relatedJobId ?? null,
        relatedCompanyId: dto.relatedCompanyId ?? null,
        relatedUserId: dto.relatedUserId ?? null,
      }),
    );

    return this.mapPublicComplaint(complaint);
  }

  async reportJob(userId: string, role: UserRole, dto: ReportTargetDto) {
    this.assertSupportUser(role);
    return this.createReport(userId, ComplaintType.GENERAL, {
      ...dto,
      subject: dto.subject ?? 'Reported job',
    });
  }

  async reportCompany(userId: string, role: UserRole, dto: ReportTargetDto) {
    this.assertSupportUser(role);
    return this.createReport(userId, ComplaintType.EMPLOYER, {
      ...dto,
      subject: dto.subject ?? 'Reported company',
    });
  }

  async reportUser(userId: string, role: UserRole, dto: ReportTargetDto) {
    this.assertSupportUser(role);
    return this.createReport(userId, ComplaintType.CANDIDATE, {
      ...dto,
      subject: dto.subject ?? 'Reported user',
    });
  }

  async listMyComplaints(
    userId: string,
    role: UserRole,
    query: QueryMyComplaintsDto,
  ) {
    this.assertSupportUser(role);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const [rows, total] = await this.complaints.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: rows.map((row) => this.mapPublicComplaint(row)),
      meta: { page, limit, total },
    };
  }

  async getMyComplaint(userId: string, role: UserRole, id: string) {
    this.assertSupportUser(role);

    const complaint = await this.complaints.findOne({ where: { id, userId } });
    if (!complaint) throw new NotFoundException('Complaint not found');
    return this.mapPublicComplaint(complaint);
  }

  private assertSupportUser(role: UserRole): void {
    if (![UserRole.APPLICANT, UserRole.EMPLOYER].includes(role)) {
      throw new ForbiddenException(
        'Support tickets are available to applicant and employer accounts',
      );
    }
  }

  private mapPublicComplaint(complaint: Complaint) {
    return {
      id: complaint.id,
      type: complaint.type,
      subject: complaint.subject,
      message: complaint.message,
      status: complaint.status,
      response: complaint.response,
      relatedJobId: complaint.relatedJobId,
      relatedCompanyId: complaint.relatedCompanyId,
      relatedUserId: complaint.relatedUserId,
      createdAt: complaint.createdAt,
      updatedAt: complaint.updatedAt,
    };
  }

  private async createReport(
    userId: string,
    type: ComplaintType,
    dto: ReportTargetDto,
  ) {
    const complaint = await this.complaints.save(
      this.complaints.create({
        userId,
        type,
        subject: dto.subject ?? null,
        message: dto.message,
        status: ComplaintStatus.OPEN,
        assignedTo: null,
        relatedJobId: dto.relatedJobId ?? null,
        relatedCompanyId: dto.relatedCompanyId ?? null,
        relatedUserId: dto.relatedUserId ?? null,
      }),
    );

    const targetType = dto.relatedJobId
      ? 'job'
      : dto.relatedCompanyId
        ? 'company'
        : dto.relatedUserId
          ? 'user'
          : 'complaint';
    const targetId =
      dto.relatedJobId ??
      dto.relatedCompanyId ??
      dto.relatedUserId ??
      complaint.id;

    await this.activities.save(
      this.activities.create({
        adminId: userId,
        action: `support.${targetType}.reported`,
        targetType,
        targetId,
        meta: { complaintId: complaint.id, type: complaint.type },
      }),
    );

    return this.mapPublicComplaint(complaint);
  }
}
