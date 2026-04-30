import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ContractUsagePaymentStatus,
  MessageType,
  NotifType,
  SubscriptionPlan,
  TemplateKind,
} from '../../common/enums/enums';
import { PLAN_LIMITS } from '../../config/plan-limits.config';
import { LimitsService } from '../billing/limits.service';
import { Application } from '../applications/entities/application.entity';
import { Company } from '../companies/entities/company.entity';
import { ContractTemplate } from '../templates/entities/contract-template.entity';
import { MailService } from '../mail/mail.service';
import { MessagingService } from '../messages/messages.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AiGenerateContractDto } from './dto/ai-generate-contract.dto';
import { CreateContractTemplateDto } from './dto/create-contract-template.dto';
import { SendContractDto } from './dto/send-contract.dto';
import { UseTemplateOnceDto } from './dto/use-template-once.dto';
import { ContractUsage } from './entities/contract-usage.entity';

const PAY_PER_USE_AMOUNT = 500;

@Injectable()
export class ContractsService {
  constructor(
    @InjectRepository(ContractTemplate)
    private readonly templateRepo: Repository<ContractTemplate>,
    @InjectRepository(ContractUsage)
    private readonly usageRepo: Repository<ContractUsage>,
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    private readonly limits: LimitsService,
    private readonly mail: MailService,
    private readonly messaging: MessagingService,
    private readonly notifications: NotificationsService,
  ) {}

  async listTemplates(userId: string) {
    const company = await this.companyOrFail(userId);
    const plan = await this.limits.getActivePlan(userId);
    const limits = PLAN_LIMITS[plan];
    const custom = await this.templateRepo.find({
      where: { companyId: company.id },
      order: { createdAt: 'DESC' },
    });

    return {
      plan,
      payPerUseAmount: PAY_PER_USE_AMOUNT,
      capabilities: {
        canUseBasicTemplates: true,
        canCustomize:
          plan === SubscriptionPlan.GROWTH || plan === SubscriptionPlan.SCALE,
        canSaveReusableTemplates:
          limits.hasContractTemplates && limits.hasAutomation,
        canUseOfferLetters: limits.hasOfferLetters,
        requiresPayPerUse:
          plan !== SubscriptionPlan.GROWTH && plan !== SubscriptionPlan.SCALE,
      },
      defaults: this.defaultTemplates(),
      premium: this.premiumTemplates(limits.hasAdvancedContractTemplates),
      custom: custom.map((template) => this.normalizeTemplate(template)),
    };
  }

  async createTemplate(userId: string, dto: CreateContractTemplateDto) {
    const company = await this.companyOrFail(userId);
    await this.limits.requireFeature(
      userId,
      'hasContractTemplates',
      SubscriptionPlan.GROWTH,
    );
    await this.limits.requireFeature(
      userId,
      'hasAutomation',
      SubscriptionPlan.GROWTH,
    );

    const clean = this.sanitizeContent(dto.content);
    return this.normalizeTemplate(
      await this.templateRepo.save(
        this.templateRepo.create({
          title: dto.title,
          type: dto.type,
          body: clean,
          companyId: company.id,
          createdBy: userId,
          isDefault: false,
          isPremium: false,
          isAdvanced: false,
        }),
      ),
    );
  }

  async useTemplateOnce(userId: string, dto: UseTemplateOnceDto) {
    const { app, company } = await this.ownedApplicationOrFail(
      userId,
      dto.applicationId,
    );
    const template = await this.resolveTemplate(dto.templateId);
    const content = this.sanitizeContent(dto.content ?? template.content);

    const usage = await this.usageRepo.save(
      this.usageRepo.create({
        companyId: company.id,
        candidateId: app.applicantId,
        applicationId: app.id,
        templateId: dto.templateId,
        sentById: userId,
        title: template.title,
        content,
        amount: PAY_PER_USE_AMOUNT,
        paymentStatus: ContractUsagePaymentStatus.PAID,
      }),
    );

    return {
      usageId: usage.id,
      paymentStatus: usage.paymentStatus,
      amount: usage.amount,
      message: 'One-time template usage unlocked for this candidate.',
    };
  }

  generateContract(dto: AiGenerateContractDto) {
    const safe = {
      jobTitle: this.escape(dto.jobTitle),
      companyName: this.escape(dto.companyName),
      candidateName: this.escape(dto.candidateName),
      salary: this.escape(dto.salary),
      jobType: this.escape(dto.jobType),
      location: this.escape(dto.location),
      startDate: this.escape(dto.startDate),
      additionalNotes: dto.additionalNotes
        ? this.escape(dto.additionalNotes)
        : 'No additional notes provided.',
    };

    return {
      title: `${safe.jobTitle} Offer Letter`,
      content: `
        <h2>Offer Letter</h2>
        <p>Dear ${safe.candidateName},</p>
        <p>${safe.companyName} is pleased to offer you the position of <strong>${safe.jobTitle}</strong>. This ${safe.jobType} role is expected to begin on <strong>${safe.startDate}</strong> and will be based in <strong>${safe.location}</strong>.</p>
        <h3>Compensation</h3>
        <p>Your proposed compensation is <strong>${safe.salary}</strong>, subject to applicable taxes, company policies, and final employment documentation.</p>
        <h3>Role Expectations</h3>
        <p>You will perform the responsibilities discussed during the hiring process and any related duties reasonably assigned by the company.</p>
        <h3>Confidentiality</h3>
        <p>You agree to protect confidential company, customer, and candidate information during and after your engagement.</p>
        <h3>Additional Notes</h3>
        <p>${safe.additionalNotes}</p>
        <p>This draft is a general business template and should be reviewed by qualified legal counsel before signature.</p>
        <p>Sincerely,<br/>${safe.companyName} Hiring Team</p>
      `.trim(),
      disclaimer:
        'Generated contracts are generic business drafts and are not legal advice.',
    };
  }

  async sendContract(userId: string, dto: SendContractDto) {
    const { app, company } = await this.ownedApplicationOrFail(
      userId,
      dto.applicationId,
    );
    if (!app.applicant?.email) {
      throw new BadRequestException('Candidate email is not available.');
    }

    const plan = await this.limits.getActivePlan(userId);
    const requiresPayPerUse =
      plan !== SubscriptionPlan.GROWTH && plan !== SubscriptionPlan.SCALE;
    if (requiresPayPerUse && !dto.confirmOneTimePayment) {
      throw new ForbiddenException({
        message: 'Pay-per-use payment required to send this contract.',
        code: 'PAY_PER_USE_REQUIRED',
        amount: PAY_PER_USE_AMOUNT,
        currency: 'PKR',
        requiredPlan: SubscriptionPlan.GROWTH,
      });
    }

    const clean = this.sanitizeContent(dto.content);
    const usage = await this.usageRepo.save(
      this.usageRepo.create({
        companyId: company.id,
        candidateId: app.applicantId,
        applicationId: app.id,
        templateId: dto.templateId ?? null,
        sentById: userId,
        title: dto.title,
        content: clean,
        amount: requiresPayPerUse ? PAY_PER_USE_AMOUNT : 0,
        paymentStatus: requiresPayPerUse
          ? ContractUsagePaymentStatus.PAID
          : ContractUsagePaymentStatus.PENDING,
      }),
    );

    await this.mail.sendContract({
      to: app.applicant.email,
      candidateName: app.applicant.fullName,
      jobTitle: app.job?.title ?? 'your role',
      company: company.companyName,
      title: dto.title,
      content: clean,
    });

    await this.notifications.notify({
      recipientId: app.applicantId,
      recipientEmail: app.applicant.email,
      type: NotifType.SYSTEM,
      category: 'application',
      title: 'Contract sent',
      body: `${company.companyName} sent you ${dto.title}.`,
      refId: app.id,
      refType: 'application',
    });

    await this.messaging.findOrCreate(
      company.ownerId,
      {
        recipientId: app.applicantId,
        jobId: app.jobId,
        firstMessage: `${company.companyName} sent ${dto.title}.`,
      },
      undefined,
      {
        system: true,
        messageType: MessageType.OFFER_UPDATE,
        metadata: {
          applicationId: app.id,
          usageId: usage.id,
          title: dto.title,
        },
      },
    );

    return {
      usageId: usage.id,
      paymentStatus: usage.paymentStatus,
      amount: usage.amount,
      sent: true,
    };
  }

  private async companyOrFail(userId: string): Promise<Company> {
    const company = await this.companyRepo.findOne({
      where: { ownerId: userId },
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  private async ownedApplicationOrFail(userId: string, applicationId: string) {
    const app = await this.applicationRepo.findOne({
      where: { id: applicationId },
      relations: ['applicant', 'job', 'job.company'],
    });
    if (!app) throw new NotFoundException('Application not found');
    const company = app.job?.company;
    if (!company || company.ownerId !== userId) {
      throw new ForbiddenException('You do not have access to this candidate.');
    }
    return { app, company };
  }

  private async resolveTemplate(templateId: string) {
    const defaultTemplate = [
      ...this.defaultTemplates(),
      ...this.premiumTemplates(true),
    ].find((template) => template.id === templateId);
    if (defaultTemplate) return defaultTemplate;

    const custom = await this.templateRepo.findOne({
      where: { id: templateId },
    });
    if (!custom) throw new NotFoundException('Template not found');
    return this.normalizeTemplate(custom);
  }

  private normalizeTemplate(template: ContractTemplate) {
    return {
      id: template.id,
      title: template.title,
      type: template.type,
      content: template.body,
      body: template.body,
      isDefault: template.isDefault,
      isPremium: template.isPremium || template.isAdvanced,
      isAdvanced: template.isAdvanced,
    };
  }

  private defaultTemplates() {
    return [
      {
        id: 'basic-offer-letter',
        title: 'Basic Offer Letter',
        type: TemplateKind.OFFER_LETTER,
        content:
          '<h2>Offer Letter</h2><p>Dear {{candidateName}},</p><p>We are pleased to offer you the role of {{jobTitle}} at {{companyName}}. This offer includes the compensation, start date, and reporting details discussed during the hiring process.</p><p>Please review and confirm your acceptance.</p>',
        body: '<h2>Offer Letter</h2><p>Dear {{candidateName}},</p><p>We are pleased to offer you the role of {{jobTitle}} at {{companyName}}. This offer includes the compensation, start date, and reporting details discussed during the hiring process.</p><p>Please review and confirm your acceptance.</p>',
        isDefault: true,
        isPremium: false,
        description:
          'A concise starter offer for straightforward hiring decisions.',
      },
      {
        id: 'simple-employment-contract',
        title: 'Simple Employment Contract',
        type: TemplateKind.CONTRACT,
        content:
          '<h2>Employment Contract</h2><p>This agreement outlines the basic employment terms between {{companyName}} and {{candidateName}} for the {{jobTitle}} position, including responsibilities, compensation, confidentiality, and termination basics.</p>',
        body: '<h2>Employment Contract</h2><p>This agreement outlines the basic employment terms between {{companyName}} and {{candidateName}} for the {{jobTitle}} position, including responsibilities, compensation, confidentiality, and termination basics.</p>',
        isDefault: true,
        isPremium: false,
        description: 'A basic employment agreement for small teams.',
      },
      {
        id: 'internship-offer-letter',
        title: 'Internship Offer Letter',
        type: TemplateKind.OFFER_LETTER,
        content:
          '<h2>Internship Offer</h2><p>Dear {{candidateName}},</p><p>{{companyName}} is pleased to offer you an internship opportunity as {{jobTitle}}. This letter summarizes the internship period, stipend if applicable, learning goals, and expected conduct.</p>',
        body: '<h2>Internship Offer</h2><p>Dear {{candidateName}},</p><p>{{companyName}} is pleased to offer you an internship opportunity as {{jobTitle}}. This letter summarizes the internship period, stipend if applicable, learning goals, and expected conduct.</p>',
        isDefault: true,
        isPremium: false,
        description: 'A lightweight template for internship offers.',
      },
    ];
  }

  private premiumTemplates(includeAdvanced: boolean) {
    return [
      {
        id: 'premium-executive-offer',
        title: 'Executive Offer Package',
        type: TemplateKind.OFFER_LETTER,
        content:
          '<h2>Executive Offer Package</h2><p>Premium template with compensation, equity, benefits, confidentiality, and acceptance terms.</p>',
        body: '<h2>Executive Offer Package</h2><p>Premium template with compensation, equity, benefits, confidentiality, and acceptance terms.</p>',
        isDefault: true,
        isPremium: true,
        isAdvanced: includeAdvanced,
        description:
          'For senior hiring workflows that need stronger structure.',
      },
    ];
  }

  private sanitizeContent(value: string): string {
    return value
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/\son\w+="[^"]*"/gi, '')
      .replace(/\son\w+='[^']*'/gi, '')
      .replace(/javascript:/gi, '');
  }

  private escape(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
