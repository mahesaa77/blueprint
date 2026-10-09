import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

/**
 * Bootstrap backend modular monolith.
 *
 * Prefix /api/v1 sesuai blueprint bagian 13 (REST versioning via path).
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');

  const port = Number(process.env['PORT'] ?? 3000);
  await app.listen(port);
}

void bootstrap();
