/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { Resume } from './entities/resume.entity';
import { ResumeStatus } from '../../common/enums/enums';
import { UpdateResumeDto } from './dto/update-resume.dto';
import { CreateResumeDto } from './dto/create-resume.dto';

const MAX_RESUMES = 5;

@Injectable()
export class ResumesService {
  constructor(
    @InjectRepository(Resume) private resumeRepo: Repository<Resume>,
    private ds: DataSource,
  ) {}

  // ── Upload (create record after file lands in storage) ─────────────────────
  async create(userId: string, dto: CreateResumeDto) {
    const count = await this.resumeRepo.count({ where: { userId } as any });
    if (count >= MAX_RESUMES)
      throw new BadRequestException(`Maximum ${MAX_RESUMES} resumes allowed`);

    // First ever resume → set as default automatically
    const isFirst = count === 0;

    const resume = this.resumeRepo.create({
      ...dto,
      userId,
      isDefault: isFirst,
      status: ResumeStatus.READY,
    });

    return this.resumeRepo.save(resume);
  }

  // ── List all resumes for user (with usage count per resume) ───────────────
  async findAll(userId: string) {
    // Attach how many applications used each resume
    return this.ds.query(
      `SELECT r.*,
              COUNT(a.id)::int AS usage_count
       FROM   resumes r
       LEFT   JOIN applications a ON a.resume_id = r.id
       WHERE  r.user_id = $1
         AND  r.deleted_at IS NULL
       GROUP  BY r.id
       ORDER  BY r.is_default DESC, r.created_at DESC`,
      [userId],
    );
  }

  // ── Rename ─────────────────────────────────────────────────────────────────
  async update(resumeId: string, userId: string, dto: UpdateResumeDto) {
    const resume = await this.ownedOrFail(resumeId, userId);
    Object.assign(resume, dto);
    return this.resumeRepo.save(resume as any);
  }

  // ── Set as default ─────────────────────────────────────────────────────────
  async setDefault(resumeId: string, userId: string) {
    await this.ownedOrFail(resumeId, userId);

    // DB trigger also handles this, but we do it here for immediate consistency
    return this.ds.transaction(async (m) => {
      await m.update<Resume>(
        'Resume',
        { userId } as any,
        { isDefault: false } as any,
      );
      await m.update<Resume>(
        'Resume',
        { id: resumeId } as any,
        { isDefault: true } as any,
      );
    });
  }

  // ── Soft delete ────────────────────────────────────────────────────────────
  async remove(resumeId: string, userId: string) {
    const resume = await this.ownedOrFail(resumeId, userId);

    // Prevent deleting the only resume
    const total = await this.resumeRepo.count({
      where: { userId, deletedAt: null } as any,
    });
    if (total <= 1)
      throw new BadRequestException('Cannot delete your only resume');

    // If deleting default, promote the most recent other one
    if ((resume as any).isDefault) {
      const next = await this.resumeRepo.findOne({
        where: { userId, id: resumeId } as any, // id != resumeId handled below
        order: { createdAt: 'DESC' } as any,
      });
      if (next)
        await this.resumeRepo.update((next as any).id, {
          isDefault: true,
        } as any);
    }

    await this.resumeRepo.softDelete(resumeId);
  }

  // ── Generate presigned upload URL (wired to your storage provider) ─────────
  getUploadUrl(userId: string, fileName: string, mimeType: string) {
    // TODO: swap in your actual S3/R2/Cloudflare client
    // const url = await s3.getSignedUrlPromise("putObject", { Bucket, Key, ContentType });
    const key = `resumes/${userId}/${Date.now()}-${fileName}`;
    return {
      uploadUrl: `https://your-bucket.s3.amazonaws.com/${key}`, // replace
      fileUrl: key,
    };
  }

  // ── Private ─────────────────────────────────────────────────────────────────
  private async ownedOrFail(resumeId: string, userId: string) {
    const resume = await this.resumeRepo.findOneBy({ id: resumeId } as any);
    if (!resume) throw new NotFoundException('Resume not found');
    if ((resume as any).userId !== userId)
      throw new ForbiddenException('Access denied');
    return resume;
  }
}
