import { Module } from '@nestjs/common';
import { HealthModule } from './platform/health/health.module.js';

/**
 * Root module. Kelima bounded context (katalog, penjualan, reservasi,
 * inventori, akuntansi) akan didaftarkan di sini satu per satu mengikuti
 * urutan fase di PLAN.md - bukan sekaligus, supaya batas modul tetap terlihat.
 */
@Module({
  imports: [HealthModule],
})
export class AppModule {}
