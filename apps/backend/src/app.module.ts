import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { EmergenciasModule } from './emergencias/emergencias.module';
import { PrediccionesModule } from './predicciones/predicciones.module';
import { UsersModule } from './users/users.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    AnalyticsModule,
    EmergenciasModule,
    PrediccionesModule,
  ],
})
export class AppModule {}
