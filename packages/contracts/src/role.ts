import { z } from 'zod';

/**
 * Role pengguna sesuai blueprint bagian 2 (Aktor Sistem).
 * Setiap endpoint dicek permission per role di API Gateway.
 */
export const roleSchema = z.enum(['PELANGGAN', 'KASIR', 'GUDANG', 'ADMIN', 'AKUNTAN']);
export type Role = z.infer<typeof roleSchema>;
