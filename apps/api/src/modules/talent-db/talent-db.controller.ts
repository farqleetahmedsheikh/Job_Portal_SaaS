import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { JwtPayload } from '../auth/auth.service';
import { QueryTalentDbDto } from './dto/query-talent-db.dto';
import { SaveCandidateDto } from './dto/save-candidate.dto';
import { TalentDbService } from './talent-db.service';

@Controller('talent-db')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.EMPLOYER)
export class TalentDbController {
  constructor(private readonly service: TalentDbService) {}

  @Get()
  search(@CurrentUser() user: JwtPayload, @Query() query: QueryTalentDbDto) {
    return this.service.search(user.sub, query);
  }

  @Get('saved')
  saved(@CurrentUser() user: JwtPayload, @Query() query: QueryTalentDbDto) {
    return this.service.saved(user.sub, query);
  }

  @Get(':id')
  detail(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.detail(user.sub, id);
  }

  @Post('save')
  save(@CurrentUser() user: JwtPayload, @Body() dto: SaveCandidateDto) {
    return this.service.save(user.sub, dto.candidateId);
  }

  @Delete('save/:candidateId')
  unsave(
    @CurrentUser() user: JwtPayload,
    @Param('candidateId') candidateId: string,
  ) {
    return this.service.unsave(user.sub, candidateId);
  }
}
