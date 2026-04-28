import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  EmailTemplateType,
  SubscriptionPlan,
  TemplateKind,
} from '../../common/enums/enums';
import { Company } from '../companies/entities/company.entity';
import { LimitsService } from '../billing/limits.service';
import { ContractTemplate } from './entities/contract-template.entity';
import { EmailTemplate } from './entities/email-template.entity';
import { CreateContractTemplateDto } from './dto/create-contract-template.dto';
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(ContractTemplate)
    private readonly contractRepo: Repository<ContractTemplate>,
    @InjectRepository(EmailTemplate)
    private readonly emailRepo: Repository<EmailTemplate>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    private readonly limits: LimitsService,
  ) {}

  async listContracts(userId: string) {
    const company = await this.companyOrFail(userId);
    const limits = await this.limits.getLimits(userId);
    const custom = await this.contractRepo.find({
      where: { companyId: company.id },
      order: { createdAt: 'DESC' },
    });

    return {
      canUseBasicTemplates: limits.hasContractTemplates,
      canCustomize: limits.hasAdvancedContractTemplates || limits.hasAutomation,
      canUseAdvancedTemplates: limits.hasAdvancedContractTemplates,
      defaults: this.defaultContracts(limits.hasAdvancedContractTemplates),
      custom,
    };
  }

  async upsertContract(userId: string, dto: CreateContractTemplateDto) {
    const company = await this.companyOrFail(userId);
    await this.limits.requireFeature(
      userId,
      dto.isAdvanced ? 'hasAdvancedContractTemplates' : 'hasAutomation',
      dto.isAdvanced ? SubscriptionPlan.SCALE : SubscriptionPlan.GROWTH,
    );

    return this.contractRepo.save(
      this.contractRepo.create({
        companyId: company.id,
        createdBy: userId,
        title: dto.title,
        type: dto.type,
        body: dto.body,
        isAdvanced: dto.isAdvanced ?? false,
      }),
    );
  }

  async listEmailTemplates(userId: string) {
    const company = await this.companyOrFail(userId);
    const limits = await this.limits.getLimits(userId);
    const custom = await this.emailRepo.find({
      where: { companyId: company.id },
      order: { type: 'ASC' },
    });

    return {
      canCustomize: limits.hasCustomEmailTemplates,
      defaults: this.defaultEmailTemplates(),
      custom,
    };
  }

  async upsertEmailTemplate(userId: string, dto: CreateEmailTemplateDto) {
    const company = await this.companyOrFail(userId);
    await this.limits.requireFeature(
      userId,
      'hasCustomEmailTemplates',
      SubscriptionPlan.GROWTH,
    );

    const existing = await this.emailRepo.findOne({
      where: { companyId: company.id, type: dto.type },
    });

    return this.emailRepo.save(
      this.emailRepo.create({
        id: existing?.id,
        companyId: company.id,
        createdBy: existing?.createdBy ?? userId,
        type: dto.type,
        subject: dto.subject,
        body: dto.body,
      }),
    );
  }

  private async companyOrFail(userId: string): Promise<Company> {
    const company = await this.companyRepo.findOne({
      where: { ownerId: userId },
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  private defaultContracts(includeAdvanced: boolean) {
    const basic = [
      {
        id: 'default-basic-contract',
        title: 'Basic Employment Contract',
        type: TemplateKind.CONTRACT,
        body: 'A concise employment agreement covering role, compensation, start date, confidentiality, and termination basics.',
        isDefault: true,
        isAdvanced: false,
      },
      {
        id: 'default-offer-letter',
        title: 'Standard Offer Letter',
        type: TemplateKind.OFFER_LETTER,
        body: 'A professional offer letter with compensation, reporting line, start date, and acceptance instructions.',
        isDefault: true,
        isAdvanced: false,
      },
    ];

    if (!includeAdvanced) return basic;
    return [
      ...basic,
      {
        id: 'default-advanced-contract',
        title: 'Advanced Employment Contract',
        type: TemplateKind.CONTRACT,
        body: 'Advanced template with probation, IP ownership, confidentiality, benefits, restrictive covenants, and jurisdiction clauses.',
        isDefault: true,
        isAdvanced: true,
      },
    ];
  }

  private defaultEmailTemplates() {
    return [
      EmailTemplateType.INTERVIEW_SCHEDULED,
      EmailTemplateType.INTERVIEW_RESCHEDULED,
      EmailTemplateType.INTERVIEW_CANCELLED,
      EmailTemplateType.REJECTION,
      EmailTemplateType.OFFER,
      EmailTemplateType.APPLICATION_STATUS,
    ].map((type) => ({
      id: `default-${type}`,
      type,
      subject: this.defaultSubject(type),
      body: 'Hi {{candidateName}},\n\nWe have an update regarding {{jobTitle}} at {{companyName}}.\n\nBest,\n{{companyName}} Hiring Team',
      isDefault: true,
    }));
  }

  private defaultSubject(type: EmailTemplateType): string {
    return {
      [EmailTemplateType.INTERVIEW_SCHEDULED]:
        'Interview scheduled for {{jobTitle}}',
      [EmailTemplateType.INTERVIEW_RESCHEDULED]:
        'Interview rescheduled for {{jobTitle}}',
      [EmailTemplateType.INTERVIEW_CANCELLED]:
        'Interview cancelled for {{jobTitle}}',
      [EmailTemplateType.REJECTION]: 'Update on your {{jobTitle}} application',
      [EmailTemplateType.OFFER]: 'Offer for {{jobTitle}}',
      [EmailTemplateType.APPLICATION_STATUS]:
        'Application update for {{jobTitle}}',
    }[type];
  }
}
