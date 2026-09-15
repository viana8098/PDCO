import { Module } from '@nestjs/common';
import { HealthController } from './controllers/health.controller';
import { PdcoController } from './controllers/pdco.controller';
import { PLANO_REPOSITORY } from './repositories/types';
import { SqlRepository } from './repositories/sql-repository';
import { PdcoService } from './services/pdco.service';

@Module({
  controllers: [PdcoController, HealthController],
  providers: [{ provide: PLANO_REPOSITORY, useClass: SqlRepository }, PdcoService],
})
export class AppModule {}
