import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VerificationDoc } from './entities/verification-doc.entity';
import { Subscription } from './entities/subscription.entity';
import { Company } from '../companies/entities/company.entity';
import { VerificationStatus } from '../../common/enums/enums';

@Injectable()
export class VerificationService {
  constructor(
    @InjectRepository(VerificationDoc)
    private readonly docRepo: Repository<VerificationDoc>,
    @InjectRepository(Subscription)
    private readonly subRepo: Repository<Subscription>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
  ) {}

  // ── Employer submits verification request ─────────────────────────────────
  async submitVerification(
    userId: string,
    dto: {
      businessRegNumber: string;
      websiteUrl?: string;
      officialEmail: string;
      docUrl?: string;
    },
  ): Promise<VerificationDoc> {
    const existing = await this.docRepo.findOne({
      where: { userId, status: VerificationStatus.PENDING },
    });
    if (existing) {
      throw new BadRequestException(
        'You already have a pending verification request.',
      );
    }

    // Must have active verification subscription
    const sub = await this.subRepo.findOne({ where: { userId } });
    const hasVerification =
      sub?.verificationStatus === VerificationStatus.VERIFIED ||
      sub?.verificationStatus === VerificationStatus.PENDING;

    const doc = this.docRepo.create({
      userId,
      ...dto,
      status: VerificationStatus.PENDING,
    });

    // Update subscription verification status
    await this.subRepo.update(
      { userId },
      {
        verificationStatus: hasVerification
          ? VerificationStatus.VERIFIED
          : VerificationStatus.PENDING,
      },
    );

    await this.companyRepo.update(
      { ownerId: userId },
      {
        verificationStatus: VerificationStatus.PENDING,
        verificationRejectionReason: null,
      },
    );

    return this.docRepo.save(doc);
  }

  // ── Admin: approve verification ───────────────────────────────────────────
  async approve(docId: string): Promise<void> {
    const doc = await this.docRepo.findOne({ where: { id: docId } });
    if (!doc) throw new NotFoundException('Verification doc not found');

    const now = new Date();
    const expiresAt = this.addMonths(now, 1);

    await this.docRepo.update(docId, {
      status: VerificationStatus.VERIFIED,
      reviewedAt: now,
      expiresAt,
    });

    await this.subRepo.update(
      { userId: doc.userId },
      {
        verificationStatus: VerificationStatus.VERIFIED,
        verifiedAt: now,
      },
    );

    await this.companyRepo.update(
      { ownerId: doc.userId },
      {
        isVerified: true,
        verificationStatus: VerificationStatus.VERIFIED,
        verificationStartedAt: now,
        verificationExpiresAt: expiresAt,
        verificationRejectionReason: null,
      },
    );
  }

  // ── Admin: reject verification ────────────────────────────────────────────
  async reject(docId: string, reviewerNotes: string): Promise<void> {
    const doc = await this.docRepo.findOne({ where: { id: docId } });
    if (!doc) throw new NotFoundException('Verification doc not found');

    await this.docRepo.update(docId, {
      status: VerificationStatus.REJECTED,
      reviewerNotes,
      rejectionReason: reviewerNotes,
      reviewedAt: new Date(),
    });

    await this.subRepo.update(
      { userId: doc.userId },
      { verificationStatus: VerificationStatus.REJECTED },
    );

    await this.companyRepo.update(
      { ownerId: doc.userId },
      {
        isVerified: false,
        verificationStatus: VerificationStatus.REJECTED,
        verificationRejectionReason: reviewerNotes,
      },
    );
  }

  // ── Lapse when verification subscription cancelled ────────────────────────
  async lapse(userId: string): Promise<void> {
    await this.subRepo.update(
      { userId },
      { verificationStatus: VerificationStatus.LAPSED, verifiedAt: undefined },
    );

    await this.companyRepo.update(
      { ownerId: userId },
      { isVerified: false, verificationStatus: VerificationStatus.EXPIRED },
    );
  }

  async expireVerificationTrials(now = new Date()): Promise<number> {
    const result = await this.companyRepo
      .createQueryBuilder()
      .update(Company)
      .set({
        isVerified: false,
        verificationStatus: VerificationStatus.EXPIRED,
      })
      .where('is_verified = true')
      .andWhere('verification_expires_at IS NOT NULL')
      .andWhere('verification_expires_at <= :now', { now })
      .execute();

    return result.affected ?? 0;
  }

  async getStatus(userId: string) {
    const sub = await this.subRepo.findOne({ where: { userId } });
    const doc = await this.docRepo.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return {
      status:
        doc?.status ?? sub?.verificationStatus ?? VerificationStatus.UNVERIFIED,
      verifiedAt: sub?.verifiedAt,
      latestDoc: doc,
      documents: doc ? [doc] : [],
    };
  }

  private addMonths(date: Date, months: number): Date {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
  }
}
