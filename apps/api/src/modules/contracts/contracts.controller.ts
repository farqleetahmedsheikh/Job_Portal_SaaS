import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../../common/guards/role.guard';
import { UserRole } from '../../common/enums/enums';
import * as currentUserDecorator from '../../common/decorators/current-user.decorator';
import { AiGenerateContractDto } from './dto/ai-generate-contract.dto';
import { CreateContractTemplateDto } from './dto/create-contract-template.dto';
import { SendContractDto } from './dto/send-contract.dto';
import { UseTemplateOnceDto } from './dto/use-template-once.dto';
import { ContractsService } from './contracts.service';

@Controller('contracts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.EMPLOYER)
export class ContractsController {
  constructor(private readonly contracts: ContractsService) {}

  @Get('templates')
  listTemplates(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
  ) {
    return this.contracts.listTemplates(user.sub);
  }

  @Post('templates')
  createTemplate(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
    @Body() dto: CreateContractTemplateDto,
  ) {
    return this.contracts.createTemplate(user.sub, dto);
  }

  @Post('use-template-once')
  useTemplateOnce(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
    @Body() dto: UseTemplateOnceDto,
  ) {
    return this.contracts.useTemplateOnce(user.sub, dto);
  }

  @Post('ai-generate')
  generate(@Body() dto: AiGenerateContractDto) {
    return this.contracts.generateContract(dto);
  }

  @Post('send')
  send(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
    @Body() dto: SendContractDto,
  ) {
    return this.contracts.sendContract(user.sub, dto);
  }
}
