import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../../common/guards/role.guard';
import * as currentUserDecorator from '../../../common/decorators/current-user.decorator';
import { UserRole } from '../../../common/enums/enums';
import { ResumesService } from '../resume.service';
import { CreateResumeDto } from '../dto/create-resume.dto';
import { UpdateResumeDto } from '../dto/update-resume.dto';

@Controller('resumes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.APPLICANT) // all resume routes are applicant-only
export class ResumesController {
  constructor(private readonly svc: ResumesService) {}

  // GET /api/resumes
  @Get()
  findAll(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
  ) {
    return this.svc.findAll(user.sub);
  }

  // GET /api/resumes/upload-url?fileName=cv.pdf&mimeType=application/pdf
  @Get('upload-url')
  getUploadUrl(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
    @Query('fileName') fileName: string,
    @Query('mimeType') mimeType: string,
  ) {
    return this.svc.getUploadUrl(user.sub, fileName, mimeType);
  }

  // POST /api/resumes  (called after file uploaded to storage)
  @Post()
  create(
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
    @Body() dto: CreateResumeDto,
  ) {
    return this.svc.create(user.sub, dto);
  }

  // PATCH /api/resumes/:id
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
    @Body() dto: UpdateResumeDto,
  ) {
    return this.svc.update(id, user.sub, dto);
  }

  // PATCH /api/resumes/:id/default
  @Patch(':id/default')
  @HttpCode(HttpStatus.NO_CONTENT)
  setDefault(
    @Param('id', ParseUUIDPipe) id: string,
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
  ) {
    return this.svc.setDefault(id, user.sub);
  }

  // DELETE /api/resumes/:id
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @currentUserDecorator.CurrentUser() user: currentUserDecorator.JwtPayload,
  ) {
    return this.svc.remove(id, user.sub);
  }
}
