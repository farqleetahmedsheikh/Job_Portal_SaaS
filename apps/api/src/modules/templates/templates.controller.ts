import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../../common/guards/role.guard';
import { UserRole } from '../../common/enums/enums';
import * as currentUserDecorator from '../../common/decorators/current-user.decorator';
import { TemplatesService } from './templates.service';
import { CreateContractTemplateDto } from './dto/create-contract-template.dto';
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';

@Controller('templates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.EMPLOYER)
export class TemplatesController {
  constructor(private readonly templates: TemplatesService) {}

  @Get('contracts')
  listContracts(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
  ) {
    return this.templates.listContracts(user.sub);
  }

  @Post('contracts')
  upsertContract(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
    @Body() dto: CreateContractTemplateDto,
  ) {
    return this.templates.upsertContract(user.sub, dto);
  }

  @Get('emails')
  listEmails(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
  ) {
    return this.templates.listEmailTemplates(user.sub);
  }

  @Post('emails')
  upsertEmail(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
    @Body() dto: CreateEmailTemplateDto,
  ) {
    return this.templates.upsertEmailTemplate(user.sub, dto);
  }
}
