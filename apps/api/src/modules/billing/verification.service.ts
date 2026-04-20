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

    return this.docRepo.save(doc);
  }

  // ── Admin: approve verification ───────────────────────────────────────────
  async approve(docId: string): Promise<void> {
    const doc = await this.docRepo.findOne({ where: { id: docId } });
    if (!doc) throw new NotFoundException('Verification doc not found');

    const now = new Date();

    await this.docRepo.update(docId, {
      status: VerificationStatus.VERIFIED,
      reviewedAt: now,
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
      reviewedAt: new Date(),
    });

    await this.subRepo.update(
      { userId: doc.userId },
      { verificationStatus: VerificationStatus.REJECTED },
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
      { isVerified: false, verificationStatus: VerificationStatus.LAPSED },
    );
  }

  async getStatus(userId: string) {
    const sub = await this.subRepo.findOne({ where: { userId } });
    const doc = await this.docRepo.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return {
      status: sub?.verificationStatus ?? VerificationStatus.UNVERIFIED,
      verifiedAt: sub?.verifiedAt,
      latestDoc: doc,
    };
  }
}
