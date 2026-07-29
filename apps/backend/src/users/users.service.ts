import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  role?: 'SUPERADMIN' | 'ANALYST';
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (existing) throw new ConflictException(`El usuario "${dto.email}" ya existe`);

    const hash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        password: hash,
        name: dto.name,
        role: dto.role ?? 'ANALYST',
      },
      select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
    });
    return user;
  }

  async deactivate(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (user.role === 'SUPERADMIN') throw new ConflictException('No se puede eliminar al superadmin');

    return this.prisma.user.update({
      where: { id },
      data: { active: false },
      select: { id: true, email: true, name: true, role: true, active: true },
    });
  }

  async resetPassword(id: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const hash = await bcrypt.hash(password, 12);
    return this.prisma.user.update({
      where: { id },
      data: { password: hash },
      select: { id: true, email: true, name: true, role: true },
    });
  }
}
