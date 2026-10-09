# Rencana Implementasi — Website Toko Pakaian

Diturunkan dari `Blueprint_Arsitektur_Website_Toko_Pakaian.docx`, yang menjadi sumber
kebenaran untuk scope. Blueprint ditulis dalam bahasa Indonesia; dokumen dan kode mengikuti
bahasa yang sama.

> **Batasan sumber:** bagian 7-12 blueprint (ERD, use case, class, sequence, activity, dan
> deployment diagram) hanya berisi gambar dan tidak bisa dibaca sebagai teks. Struktur tabel dan
> daftar akun COA di bawah ini adalah usulan sementara, bukan hasil transkripsi blueprint, dan
> wajib diverifikasi ulang secara visual sebelum migrasi Prisma pertama.

---

## 1. Keputusan yang sudah diambil

| Topik | Keputusan | Alasan |
|---|---|---|
| Bentuk repo | pnpm monorepo: `apps/api`, `apps/web`, `packages/*` | Blueprint menyebut satu codebase untuk tiga PWA; kontrak OpenAPI harus dibagi dua arah |
| Arsitektur | Modular monolith, 5 bounded context: Katalog, POS, Reservasi, Inventori, Akuntansi | Kunci dari blueprint; microservices ditunda sampai volume transaksi tumbuh |
| Test | Jest (unit + integrasi) + Playwright (E2E), testcontainers untuk infra | Blueprint hanya menyebut "build, test, deploy" di CI, tanpa memilih runner |
| Payment gateway | Midtrans, sandbox; lokal memakai fake adapter | Blueprint menyebut Midtrans atau Xendit; Midtrans dipilih |
| Vendor lain | Belum diputuskan - port/interface + fake adapter | Keycloak/Auth0, Elasticsearch/Meilisearch, WhatsApp gateway masih terbuka |
| Task runner | Script root pnpm; Turboreop opsional | Tidak diperlukan di fase awal |

### Konvensi

- Commit message berbahasa Indonesia, bentuk umum: `<tipe>(<modul>): <deskripsi>`.
- Chart of Accounts memakai dummy seed dan harus ditandai eksplisit sebagai placeholder yang
  belum divalidasi akuntan.
- Pengerjaan mengikuti roadmap blueprint (Fase 1-5); jangan mendahului fase berjalan tanpa
  permintaan eksplisit.

---

## 2. Struktur folder

```
apps/
  api/                          NestJS modular monolith
    prisma/
      schema.prisma            satu file, di-partisi per modul
      seed/                    dummy COA + data contoh
    test/                      test setup, container helpers
    src/
      main.ts  app.module.ts
      platform/                config, prisma, auth guard, rbac decorator,
                               audit trail, messaging/rabbitmq, jobs/bullmq,
                               storage/minio, search, logger, health
      modules/
        katalog/  penjualan/  reservasi/  inventori/  akuntansi/
          domain/              entity, value object, port repository
          application/         use-case, DTO
          infrastructure/      implementasi Prisma, mapper, consumer event
          presentation/        controller, guard per permission
  web/                          Next.js 15, satu app tiga role
    src/app/
      (customer)/              katalog, scan, detail produk, keranjang
      (kasir)/                 POS, shift, offline sync
      (admin)/                 dashboard, konfigurasi, laporan
packages/
  contracts/                   sumber Zod/DTO -> OpenAPI 3.0 -> client generated
  ui/                          komponen shadcn + komponen POS/PWA bersama
  config/                      tsconfig, eslint, prettier, docker compose
```

Satu `schema.prisma` dipilih karena foreign key lintas modul (Penjualan ke Inventori, Penjualan ke
Akuntansi) tidak bisa dihindari dalam monolith. Batas bounded context ditegakkan lewat struktur
modul dan aturan di `platform/`, bukan lewat pemisahan database.

### Kontrak integrasi (port + adapter)

Setiap layanan eksternal didefinisikan sebagai interface di `platform/`, dengan implementasi
dipilih lewat environment variable:

```
PAYMENT_DRIVER=fake | midtrans      # default lokal: fake
SEARCH_DRIVER=memory | meilisearch | elasticsearch
OBJECT_STORAGE_DRIVER=minio
MESSAGE_DRIVER=inmemory | rabbitmq
```

- Default lokal memakai driver in-memory atau fake supaya `docker compose up` dan test tidak
  butuh kredensial pihak ketiga.
- Adapter Midtrans asli ditulis pada Fase 2 dengan bentuk kontrak yang sama; hanya kelas
  implementasinya yang diganti, tidak ada perubahan pada use-case.

---

## 3. Urutan fase

### Fase 0 - Validasi (belum ada kode)

- Dummy COA untuk seluruh akun (Aset, Liabilitas, Ekuitas, Pendapatan, Beban) mengacu SAK EMKM
  dan PSAK, diisi lewat seed serta diberi penanda `isPlaceholder` yang tampil di UI admin dan
  komentar tegas di file seed. Wajib diganti hasil validasi akuntan sebelum go-live.
- Aturan fiskal: zona waktu WIB, periode tutup buku bulanan, perlakuan pajak dan PPN.
- Skema DP default: persen atau nominal, berlaku global atau per kategori.
- Gate Fase 2: kredensial Midtrans sandbox tersedia.

### Fase 1 - Fondasi (6-8 minggu)

Docker Compose untuk PostgreSQL 16, Redis 7, RabbitMQ, MinIO, dan mesin pencari; CI GitHub
Actions; autentikasi dan RBAC untuk lima role (Pelanggan, Kasir, Gudang, Admin, Akuntan);
skeleton kelima modul; ERD diwujudkan sebagai migrasi Prisma; seed dummy COA.

Disusul Katalog (M1): model Produk, SKU, dan varian; generate barcode per varian; landing page
produk SSR; pemindaian ZXing; pencarian produk.

**Exit:** pelanggan memindai barcode di rak dan melihat stok real-time.

### Fase 2 - Transaksi inti (8-10 minggu)

POS (M2): keranjang, diskon dan pajak, split payment, manajemen shift kasir, retur dan tukar
barang. Ini fase terberat karena offline-first, sehingga menuntut idempotency key per
transaksi, `POST /api/v1/transaksi/batch-sync`, resolusi konflik stok, serta cetak struk thermal
via WebUSB/WebBluetooth dengan fallback PDF.

Payment gateway memakai `PAYMENT_DRIVER=fake` selama pengembangan; verifikasi webhook diuji
melalui mock di Jest, bukan panggilan sandbox nyata. Integrasi Midtrans sandbox dilakukan
sebagai langkah tersendiri sebelum exit fase.

**Exit:** kasir tetap beroperasi 8 jam tanpa internet, lalu sinkron tanpa stok minus.
**Gate:** Midtrans sandbox terverifikasi dan adapter fake diganti adapter Midtrans.

### Fase 3 - Reservasi dan Inventori (6-8 minggu)

Reservasi (M3): booking produk atau sesi fitting, hold stok 24-48 jam, konfigurasi skema DP oleh
admin, auto-release lewat BullMQ saat pelunasan terlambat, reminder WhatsApp (stub dulu).

Inventori (M4): dua level inventori, yaitu produk jadi per SKU dan varian serta bahan baku untuk
tailoring; BOM; stok opname dengan pencatatan selisih; transfer antar outlet; kartu stok.

Event `stock.deducted` dan `journal.created` dipublikasikan ke RabbitMQ dan dikonsumsi Inventori
serta Akuntansi agar tetap sinkron tanpa tight coupling.

**Exit:** reservasi dengan DP berjalan end-to-end; produksi mengurangi bahan baku sesuai BOM.

### Fase 4 - Keuangan (6 minggu)

Akuntansi (M5): jurnal double-entry otomatis dari setiap penjualan, DP, dan retur tanpa input
manual ganda; COA; HPP FIFO atau rata-rata dari data Inventori; laporan laba rugi, neraca, arus
kas, buku besar; rekonsiliasi kas kasir harian; export PDF dan Excel; dashboard analitik.

**Exit:** neraca balance untuk data sampel, dengan dummy COA masih terisi.

### Fase 5 - Hardening (4 minggu)

Load testing, security audit, backup otomatis plus point-in-time recovery, UAT, migrasi data
dari sistem lama, pelatihan staf.

---

## 4. Urutan penulisan

1. Keputusan vendor dan COA (Fase 0).
2. `packages/contracts` - skema Zod sebagai sumber OpenAPI 3.0.
3. Skema Prisma, migrasi pertama, dan seed dummy COA.
4. `platform/` - config, auth, RBAC, audit trail, messaging, health.
5. Modul Katalog (M1).
6. Modul POS (M2), termasuk batch sync dan adapter payment.

Kontrak dan skema mendahului modul karena POS, Reservasi, dan Inventori semuanya bergantung
padanya. Mengubahnya setelah transaksi tersimpan berarti migrasi data di lingkungan produksi.

---

## 5. Risiko dan hal yang belum diputuskan

- **COA belum divalidasi.** Dummy seed hanya membuat alur berjalan; laporan keuangan tidak boleh
  dipakai untuk keputusan pajak sebelum ditinjau akuntan.
- **Vendor belum lengkap.** Autentikasi (Keycloak atau Auth0), mesin pencari (Meilisearch atau
  Elasticsearch), dan WhatsApp gateway belum dipilih. Semuanya berjalan di atas port + fake
  adapter.
- **Gambar blueprint tidak terverifikasi.** ERD dan diagram harus dibaca ulang secara visual
  sebelum migrasi Prisma pertama agar tidak menyimpang dari desain asli.
- **Offline POS adalah risiko teknis tertinggi.** Resolusi konflik stok dan idempotensi sinkronisasi
  butuh desain matang sebelum implementasi, bukan saat pengerjaannya.
