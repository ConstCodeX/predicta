import {
  Controller, Get, Post, Patch, Body, Param, UseGuards,
} from '@nestjs/common';
import { IsEmail, IsString, IsOptional, IsIn, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SuperadminGuard } from '../auth/superadmin.guard';
import { UsersService } from './users.service';

class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsIn(['SUPERADMIN', 'ANALYST'])
  role?: 'SUPERADMIN' | 'ANALYST';
}

class ResetPasswordDto {
  @IsString()
  @MinLength(6)
  password: string;
}

@Controller('v1/users')
@UseGuards(JwtAuthGuard, SuperadminGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  findAll() {
    return this.users.findAll();
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.users.deactivate(id);
  }

  @Patch(':id/password')
  resetPassword(@Param('id') id: string, @Body() dto: ResetPasswordDto) {
    return this.users.resetPassword(id, dto.password);
  }
}
