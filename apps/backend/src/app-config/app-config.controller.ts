import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SuperadminGuard } from '../auth/superadmin.guard';
import { AppConfigService } from './app-config.service';

class UpdateConfigDto {
  @IsString()
  @IsNotEmpty()
  value!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

@Controller('v1/config')
@UseGuards(JwtAuthGuard)
export class AppConfigController {
  constructor(private readonly svc: AppConfigService) {}

  @Get()
  listAll() {
    return this.svc.listAll();
  }

  @Put(':key')
  @UseGuards(SuperadminGuard)
  async update(@Param('key') key: string, @Body() body: UpdateConfigDto) {
    await this.svc.set(key, body.value, body.description);
    return { ok: true };
  }

  @Delete(':key')
  @UseGuards(SuperadminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('key') key: string) {
    await this.svc.delete(key);
  }
}
