import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(email: string, password: string) {
    const adminEmail = this.config.get<string>('ADMIN_EMAIL') ?? 'admin@predicta.pe';
    const adminPassword = this.config.get<string>('ADMIN_PASSWORD') ?? 'admin123';
    const adminName = this.config.get<string>('ADMIN_NAME') ?? 'Super Admin';

    if (
      email.toLowerCase() !== adminEmail.toLowerCase() ||
      password !== adminPassword
    ) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const payload = {
      sub: 'mock-superadmin-id',
      email: adminEmail,
      role: 'SUPERADMIN',
      name: adminName,
    };

    return {
      access_token: this.jwt.sign(payload),
      user: { id: payload.sub, name: adminName, email: adminEmail, role: 'SUPERADMIN' },
    };
  }

  // No-op: sin DB no hay seed necesario
  async seedSuperadmin() {}
}
