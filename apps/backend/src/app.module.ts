import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as path from 'path';
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
    ConfigModule.forRoot({
      isGlobal: true,
      // Único .env en la raíz del monorepo. Fallback al local si existiera.
      envFilePath: [
        path.resolve(process.cwd(), '../../.env'),
        path.resolve(process.cwd(), '.env'),
      ],
    }),
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
