import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { EmergenciasModule } from './emergencias/emergencias.module';
import { PrediccionesModule } from './predicciones/predicciones.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    EmergenciasModule,
    PrediccionesModule,
  ],
})
export class AppModule {}
