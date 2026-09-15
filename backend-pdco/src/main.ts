/**
 * Ponto de entrada da API do PDCO (NestJS). Só roda local — gera o snapshot
 * estático consumido pelo deploy (ver frontend-pdco/scripts/gerar-snapshot.ts).
 *
 * Executar: npm run start:dev
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { settings } from './config';
import { HttpExceptionFilter } from './http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new HttpExceptionFilter());

  app.enableCors({
    origin: settings.corsOrigins,
    methods: '*',
    allowedHeaders: '*',
  });

  await app.listen(settings.port);
  // eslint-disable-next-line no-console
  console.log(`PDCO (NestJS) rodando em http://localhost:${settings.port}`);
}

bootstrap();
