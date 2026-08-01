import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';

export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  role?: 'SUPERADMIN' | 'ANALYST';
}

interface MockUser {
  id: string;
  email: string;
  name: string;
  role: 'SUPERADMIN' | 'ANALYST';
  active: boolean;
  createdAt: string;
}

@Injectable()
export class UsersService {
  private users: MockUser[] = [
    {
      id: 'mock-superadmin-id',
      email: 'admin@predicta.pe',
      name: 'Super Admin',
      role: 'SUPERADMIN',
      active: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'mock-analyst-001',
      email: 'analista@predicta.pe',
      name: 'Analista INDECI',
      role: 'ANALYST',
      active: true,
      createdAt: new Date().toISOString(),
    },
  ];

  async findAll() {
    return this.users.map(({ id, email, name, role, active, createdAt }) => ({
      id, email, name, role, active, createdAt,
    }));
  }

  async create(dto: CreateUserDto) {
    const existing = this.users.find((u) => u.email === dto.email.toLowerCase());
    if (existing) throw new ConflictException(`El usuario "${dto.email}" ya existe`);

    const user: MockUser = {
      id: `mock-${Date.now()}`,
      email: dto.email.toLowerCase(),
      name: dto.name,
      role: dto.role ?? 'ANALYST',
      active: true,
      createdAt: new Date().toISOString(),
    };
    this.users.push(user);
    const { id, email, name, role, active, createdAt } = user;
    return { id, email, name, role, active, createdAt };
  }

  async deactivate(id: string) {
    const user = this.users.find((u) => u.id === id);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (user.role === 'SUPERADMIN') throw new ConflictException('No se puede eliminar al superadmin');
    user.active = false;
    const { id: uid, email, name, role, active } = user;
    return { id: uid, email, name, role, active };
  }

  async resetPassword(id: string, _password: string) {
    const user = this.users.find((u) => u.id === id);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    const { id: uid, email, name, role } = user;
    return { id: uid, email, name, role };
  }
}
