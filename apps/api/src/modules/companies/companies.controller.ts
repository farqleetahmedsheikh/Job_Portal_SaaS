/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { UserRole } from 'src/common/enums/user-role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/company.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.EMPLOYER)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly service: CompaniesService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateCompanyDto) {
    return this.service.createCompany(req.user.userId, dto);
  }

  @Get('me')
  getMyCompany(@Req() req: any) {
    return this.service.findByOwner(req.user.userId);
  }
}
