import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';
import { AccountService } from './account.service';
import { UpdateAccountPrivacyDto } from './dto/account-privacy.dto';

@Controller('account')
@UseGuards(JwtAuthGuard)
export class AccountController {
  constructor(private readonly account: AccountService) {}

  @Get('privacy')
  getPrivacy(@CurrentUser() user: JwtPayload) {
    return this.account.getPrivacy(user.sub);
  }

  @Patch('privacy')
  updatePrivacy(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateAccountPrivacyDto,
  ) {
    return this.account.updatePrivacy(user.sub, dto);
  }

  @Post('export-request')
  @HttpCode(HttpStatus.OK)
  requestExport(@CurrentUser() user: JwtPayload) {
    return this.account.requestExport(user.sub);
  }

  @Post('delete-request')
  @HttpCode(HttpStatus.OK)
  requestDeletion(@CurrentUser() user: JwtPayload) {
    return this.account.requestDeletion(user.sub);
  }

  @Get('delete-request/status')
  deletionStatus(@CurrentUser() user: JwtPayload) {
    return this.account.getDeletionStatus(user.sub);
  }
}
