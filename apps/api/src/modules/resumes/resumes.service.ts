/** @format */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resume } from './entities/resume.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { ResumeStatus } from '../../common/enums/enums';

const MAX_RESUMES_PER_USER = 5;

@Injectable()
export class ResumesService {
  private readonly logger = new Logger(ResumesService.name);

  constructor(
    @InjectRepository(Resume)
    private readonly resumeRepo: Repository<Resume>,
    private readonly cloudinary: CloudinaryService,
  ) {}

  // ── List ───────────────────────────────────────────────────────────────────

  findAll(userId: string): Promise<Resume[]> {
    return this.resumeRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  // ── Upload ─────────────────────────────────────────────────────────────────

  async upload(userId: string, file: Express.Multer.File): Promise<Resume> {
    // Enforce per-user limit (soft-deleted rows excluded automatically)
    const count = await this.resumeRepo.count({ where: { userId } });
    if (count >= MAX_RESUMES_PER_USER) {
      throw new BadRequestException(
        `You can only have ${MAX_RESUMES_PER_USER} resumes. Delete one to upload a new version.`,
      );
    }

    const isFirst = count === 0;

    // 1. Persist a "processing" row immediately — frontend shows processing state
    const resume = this.resumeRepo.create({
      userId,
      name: file.originalname,
      fileUrl: '', // filled after Cloudinary responds
      fileSize: file.size,
      mimeType: file.mimetype,
      status: ResumeStatus.PROCESSING,
      isDefault: false,
    });
    await this.resumeRepo.save(resume);

    // 2. Upload to Cloudinary
    try {
      const uploaded = await this.cloudinary.uploadResume(file.buffer);

      resume.fileUrl = uploaded.url;
      resume.publicId = uploaded.publicId; // stored for later deletion
      resume.fileSize = uploaded.bytes; // use Cloudinary's confirmed byte count
      resume.status = ResumeStatus.READY;

      // If first resume, clear any stale default then set this one
      if (isFirst) {
        await this.resumeRepo.update(
          { userId, isDefault: true },
          { isDefault: false },
        );
        resume.isDefault = true;
      }

      return this.resumeRepo.save(resume);
    } catch (err) {
      resume.status = ResumeStatus.ERROR;
      await this.resumeRepo.save(resume);
      this.logger.error(`Resume upload failed for user ${userId}`, err);
      throw new BadRequestException('Resume upload failed. Please try again.');
    }
  }

  // ── Set default ────────────────────────────────────────────────────────────

  async setDefault(userId: string, resumeId: string): Promise<Resume> {
    const resume = await this.resumeRepo.findOne({
      where: { id: resumeId, userId },
    });
    if (!resume) throw new NotFoundException('Resume not found');
    if (resume.status !== ResumeStatus.READY)
      throw new BadRequestException('Only ready resumes can be set as default');

    await this.resumeRepo.update(
      { userId, isDefault: true },
      { isDefault: false },
    );
    resume.isDefault = true;
    return this.resumeRepo.save(resume);
  }

  // ── Delete (soft) ──────────────────────────────────────────────────────────

  async remove(userId: string, resumeId: string): Promise<void> {
    const resume = await this.resumeRepo.findOne({
      where: { id: resumeId, userId },
    });
    if (!resume) throw new NotFoundException('Resume not found');

    // Soft-delete via @DeleteDateColumn — sets deleted_at, hides from all queries
    await this.resumeRepo.softRemove(resume);

    // Best-effort Cloudinary cleanup — fire-and-forget, never blocks response
    if (resume.publicId) {
      this.cloudinary
        .delete(resume.publicId, 'raw')
        .catch((err) =>
          this.logger.warn(
            `Cloudinary cleanup failed for ${resume.publicId}`,
            err,
          ),
        );
    }

    // Promote the next-newest resume to default if we just deleted the default
    if (resume.isDefault) {
      const next = await this.resumeRepo.findOne({
        where: { userId },
        order: { createdAt: 'DESC' },
      });
      if (next) {
        next.isDefault = true;
        await this.resumeRepo.save(next);
      }
    }
  }
}
