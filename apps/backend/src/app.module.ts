import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AppConfigModule } from './app-config/app-config.module';
import { AuthModule } from './auth/auth.module';
import { EmergenciasModule } from './emergencias/emergencias.module';
import { PrediccionesModule } from './predicciones/predicciones.module';
import { UsersModule } from './users/users.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { RiesgoModule } from './riesgo/riesgo.module';
import { EscenariosModule } from './escenarios/escenarios.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AppConfigModule,
    AuthModule,
    UsersModule,
    AnalyticsModule,
    EmergenciasModule,
    PrediccionesModule,
    RiesgoModule,
    EscenariosModule,
  ],
})
export class AppModule {}
