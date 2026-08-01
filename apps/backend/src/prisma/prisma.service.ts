import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// PrismaService está presente para compatibilidad futura con DB.
// En modo mock (sin DATABASE_URL) la conexión falla silenciosamente.
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    if (!process.env['DATABASE_URL']) {
      this.logger.warn('DATABASE_URL no configurada — modo mock activo, sin base de datos');
      return;
    }
    try {
      await this.$connect();
    } catch (err) {
      this.logger.warn(`No se pudo conectar a la base de datos: ${(err as Error).message}`);
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
    } catch {
      // silencioso
    }
  }
}
