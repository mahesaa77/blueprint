/**
 * @toko/contracts
 *
 * Sumber kebenaran untuk bentuk request/response API. Zod schema di sini
 * dipakai NestJS (validasi + Swagger/OpenAPI 3.0) dan Next.js (typing client),
 * sehingga tidak perlu menulis DTO dua kali.
 *
 * Kontrak domain per modul (produk, transaksi, reservasi, stok, jurnal)
 * akan ditambahkan mengikuti urutan fase di PLAN.md.
 */
export * from './envelope.js';
export * from './role.js';
