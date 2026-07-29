import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AppConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async get(key: string, defaultValue: string): Promise<string> {
    const cfg = await this.prisma.appConfig.findUnique({ where: { key } });
    return cfg?.value ?? defaultValue;
  }

  async set(key: string, value: string, description?: string): Promise<void> {
    await this.prisma.appConfig.upsert({
      where: { key },
      update: { value, ...(description !== undefined ? { description } : {}) },
      create: { key, value, description: description ?? null },
    });
  }

  async delete(key: string): Promise<void> {
    await this.prisma.appConfig.deleteMany({ where: { key } });
  }

  async listAll(): Promise<{ key: string; value: string; description: string | null }[]> {
    return this.prisma.appConfig.findMany({ orderBy: { key: 'asc' } });
  }
}
