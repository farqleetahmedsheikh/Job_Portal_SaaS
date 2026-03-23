/** @format */
import {
  Controller, Get, Post, Patch, Delete,
  Param, UseGuards, Req, UseInterceptors,
  UploadedFile, ParseFilePipe, MaxFileSizeValidator,
  FileTypeValidator, HttpCode, HttpStatus,
} from '@nestjs/common';
import { FileInterceptor }  from '@nestjs/platform-express';
import { memoryStorage }    from 'multer';
import { JwtAuthGuard }     from '../auth/guards/jwt-auth.guard';
import { ResumesService }   from './resumes.service';

@UseGuards(JwtAuthGuard)
@Controller('resumes')
export class ResumesController {
  constructor(private readonly resumesService: ResumesService) {}

  // GET /resumes
  @Get()
  findAll(@Req() req: any) {
    return this.resumesService.findAll(req.user.sub);
  }

  // POST /resumes/upload  ← static route before :id
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  upload(
    @Req() req: any,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),       // 5 MB
          new FileTypeValidator({ fileType: 'application/pdf' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.resumesService.upload(req.user.sub, file);
  }

  // PATCH /resumes/:id/default  ← static sub-route before bare :id
  @Patch(':id/default')
  setDefault(@Req() req: any, @Param('id') id: string) {
    return this.resumesService.setDefault(req.user.sub, id);
  }

  // DELETE /resumes/:id
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Req() req: any, @Param('id') id: string) {
    return this.resumesService.remove(req.user.sub, id);
  }
}