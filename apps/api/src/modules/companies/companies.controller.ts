/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserRole } from 'src/common/enums/enums';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UpdatePerksDto } from './dto/update-perks.dto';
import { UpdateCompanyDto } from './dto/update-compnay.dto';
import { CreateCompanyDto } from './dto/company.dto';
import { CompaniesService } from './companies.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.EMPLOYER)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly service: CompaniesService) {}

  // POST /api/companies
  @Post()
  create(@Req() req: any, @Body() dto: CreateCompanyDto) {
    return this.service.create(req.user.userId, dto);
  }

  // GET /api/companies/me
  @Get('me')
  getMyCompany(@Req() req: any) {
    return this.service.findByOwner(req.user.userId);
  }

  // PATCH /api/companies/:id
  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.service.update(id, req.user.sub, dto);
  }
  // GET /api/companies/:id  — any authenticated user (public profile)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  // PATCH /api/companies/:id/perks
  @Patch(':id/perks')
  updatePerks(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdatePerksDto,
  ) {
    return this.service.updatePerks(id, req.user.userId, dto);
  }

  // DELETE /api/companies/:id
  @Delete(':id')
  delete(@Req() req: any, @Param('id') id: string) {
    return this.service.delete(id, req.user.userId);
  }

  // PATCH /companies/:id/logo
  @Patch(':id/logo')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  uploadLogo(
    @Req() req: any,
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 3 * 1024 * 1024 }),
          new FileTypeValidator({
            fileType: /image\/(jpeg|png|webp|svg\+xml)/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.service.updateLogo(req.user.sub, id, file);
  }

  // DELETE /companies/:id/logo
  @Delete(':id/logo')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteLogo(@Req() req: any, @Param('id') id: string) {
    return this.service.deleteLogo(req.user.sub, id);
  }
}
