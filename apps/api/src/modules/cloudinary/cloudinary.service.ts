/** @format */
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import * as streamifier from 'streamifier';

// ─── Upload result ────────────────────────────────────────────────────────────

export interface CloudinaryUploadResult {
  url: string; // https, transformed delivery URL
  publicId: string; // cloudinary public_id — store this to delete later
  bytes: number;
  format: string;
  width?: number;
  height?: number;
}

// ─── Per-resource folder + transformation config ──────────────────────────────

const UPLOAD_PRESETS: Record<
  'avatar' | 'companyLogo' | 'resume' | 'jobImage',
  {
    folder: string;
    allowedFormats: string[];
    maxBytes: number;
    transformation?: object;
    resourceType: 'image' | 'raw' | 'auto';
  }
> = {
  avatar: {
    folder: 'HiringFly/avatars',
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
    maxBytes: 3 * 1024 * 1024, // 3 MB
    resourceType: 'image',
    transformation: {
      width: 400,
      height: 400,
      crop: 'fill',
      gravity: 'face',
      quality: 'auto',
      fetch_format: 'auto',
    },
  },
  companyLogo: {
    folder: 'HiringFly/company-logos',
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'svg'],
    maxBytes: 3 * 1024 * 1024, // 3 MB
    resourceType: 'image',
    transformation: {
      width: 400,
      height: 400,
      crop: 'pad',
      background: 'white',
      quality: 'auto',
      fetch_format: 'auto',
    },
  },
  resume: {
    folder: 'HiringFly/resumes',
    allowedFormats: ['pdf'],
    maxBytes: 5 * 1024 * 1024, // 5 MB
    resourceType: 'raw', // raw = non-image binary
  },
  jobImage: {
    folder: 'HiringFly/job-images',
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
    maxBytes: 4 * 1024 * 1024, // 4 MB
    resourceType: 'image',
    transformation: {
      width: 1200,
      height: 630,
      crop: 'fill',
      quality: 'auto',
      fetch_format: 'auto',
    },
  },
};

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  // ── Core upload ─────────────────────────────────────────────────────────────

  private upload(
    buffer: Buffer,
    preset: keyof typeof UPLOAD_PRESETS,
    options?: { publicId?: string },
  ): Promise<CloudinaryUploadResult> {
    const cfg = UPLOAD_PRESETS[preset];

    if (buffer.length > cfg.maxBytes) {
      throw new BadRequestException(
        `File too large. Max size is ${cfg.maxBytes / (1024 * 1024)} MB.`,
      );
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: cfg.folder,
          resource_type: cfg.resourceType,
          allowed_formats: cfg.allowedFormats,
          transformation: cfg.transformation,
          public_id: options?.publicId,
          overwrite: !!options?.publicId,
          use_filename: false,
          unique_filename: true,
        },
        (error, result) => {
          if (error || !result) {
            this.logger.error('Cloudinary upload failed', error);
            return reject(
              new BadRequestException(error?.message ?? 'Upload failed'),
            );
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            bytes: result.bytes,
            format: result.format,
            width: result.width,
            height: result.height,
          });
        },
      );

      streamifier.createReadStream(buffer).pipe(uploadStream);
    });
  }

  // ── Delete ──────────────────────────────────────────────────────────────────

  async delete(
    publicId: string,
    resourceType: 'image' | 'raw' = 'image',
  ): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });
    } catch (err) {
      // log but don't throw — a failed delete shouldn't break the caller
      this.logger.warn(`Failed to delete Cloudinary asset ${publicId}`, err);
    }
  }

  // ── Named upload methods ────────────────────────────────────────────────────

  uploadAvatar(buffer: Buffer, existingPublicId?: string) {
    return this.upload(buffer, 'avatar', { publicId: existingPublicId });
  }

  uploadCompanyLogo(buffer: Buffer, existingPublicId?: string) {
    return this.upload(buffer, 'companyLogo', { publicId: existingPublicId });
  }

  uploadResume(buffer: Buffer) {
    return this.upload(buffer, 'resume'); // always new public_id per upload
  }

  uploadJobImage(buffer: Buffer, existingPublicId?: string) {
    return this.upload(buffer, 'jobImage', { publicId: existingPublicId });
  }
}
