/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application } from '../applications/entities/application.entity';
import { LimitsService } from '../billing/limits.service';
import { ConfigService } from '@nestjs/config/dist/config.service';

@Injectable()
export class AiMatcherService {
  private readonly logger = new Logger(AiMatcherService.name);
  private readonly geminiUrl: string; // ✅ not inline process.env

  constructor(
    @InjectRepository(Application)
    private readonly appRepo: Repository<Application>,
    private readonly limits: LimitsService,
    private readonly config: ConfigService, // ✅ inject
  ) {
    const key = this.config.get<string>('GEMINI_API_KEY');
    if (!key) {
      this.logger.warn('GEMINI_API_KEY not set — AI matching disabled');
    }
    this.geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${key ?? ''}`;
  }

  // ── Score a single applicant against a job ──────────────────────────────
  async scoreApplication(
    applicationId: string,
    employerId: string,
  ): Promise<number> {
    await this.limits.requireAiMatcher(employerId, 'basic');

    const app = await this.appRepo.findOne({
      where: { id: applicationId },
      relations: ['job', 'applicant', 'applicant.applicantProfile'],
    });
    if (!app) throw new Error('Application not found');

    const profile = app.applicant?.applicantProfile;
    const job = app.job;

    const prompt = `You are a recruitment AI. Score this candidate's fit for the job on a scale of 0-100.

JOB:
Title: ${job?.title}
Required skills: ${job?.skills?.join(', ')}
Experience level: ${job?.experienceLevel}
Description: ${job?.description?.slice(0, 500)}

CANDIDATE:
Current title: ${profile?.jobTitle ?? 'N/A'}
Skills: ${profile?.skills?.join(', ') ?? 'N/A'}
Experience years: ${profile?.experienceYears ?? 'N/A'}
Summary: ${profile?.summary?.slice(0, 300) ?? 'N/A'}
Cover letter: ${app.coverLetter?.slice(0, 300) ?? 'N/A'}

Return ONLY a JSON object like: {"score": 75, "reason": "Strong skill match but lacks senior experience"}`;

    try {
      const res = await fetch(this.geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 150 },
        }),
      });

      const data = (await res.json()) as any;
      const text: string =
        data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{"score":50}';
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean) as { score: number };
      const score = Math.min(100, Math.max(0, parsed.score));

      // Persist score
      await this.appRepo.update(applicationId, { matchScore: score });
      return score;
    } catch (err) {
      this.logger.error('Gemini scoring failed', err);
      return 50; // neutral fallback
    }
  }

  // ── Score all applicants for a job ──────────────────────────────────────
  async scoreAllForJob(jobId: string, employerId: string): Promise<void> {
    await this.limits.requireAiMatcher(employerId, 'basic');

    const apps = await this.appRepo.find({
      where: { jobId },
      select: ['id'],
    });

    // Process in batches of 5 to avoid rate limits
    for (let i = 0; i < apps.length; i += 5) {
      const batch = apps.slice(i, i + 5);
      await Promise.allSettled(
        batch.map((a) => this.scoreApplication(a.id, employerId)),
      );
    }
  }
}
