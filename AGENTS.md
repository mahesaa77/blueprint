# AGENTS.md

## Repo status

This repo currently contains **no code and no commits**. It is a design-only repo: the single
tracked artifact is `Blueprint_Arsitektur_Website_Toko_Pakaian.docx` (the architecture blueprint
for a clothing-store platform, in Indonesian).

Treat the `.docx` as the source of truth for scope. Do not invent features, endpoints, or tables
that contradict it — if a task needs something not covered, say so instead of guessing.

## Commands

pnpm 12 diinstal global via `npm i -g pnpm --prefix "$env:APPDATA\npm"`. Corepack gagal
(EPERM di `C:\Program Files\nodejs`), jadi PATH perlu ditambah manual dulu:

```powershell
$env:Path += ";$env:APPDATA\npm"
```

```powershell
pnpm install
pnpm build          # contracts -> api -> web, berurutan
pnpm typecheck      # contracts harus lebih dulu
pnpm test
pnpm --filter @toko/api test
pnpm dev            # api :3000, web :3001 (parallel)
```

Urutan `build` dan `typecheck` itu wajib: `@toko/api` memakai `@toko/contracts` lewat
`paths` ke `src/`, tapi runtime NestJS me-*require* `dist/`, jadi contracts harus dibangun
lebih dulu.

## Gotchas yang sudah teratasi

- **Jest tidak bisa baca `jest.config.ts`** tanpa `ts-node`. Pakai `apps/api/jest.config.js`
  (CommonJS) + `moduleNameMapper` untuk strip ekstensi `.js` dari import relatif, karena
  ts-jest berjalan di CommonJS sementara source memakai import ESM.
- **`rootDir` harus hanya ada di `tsconfig.build.json`**, bukan di `tsconfig.json` — kalau
  tidak, `include: test/**/*` di luar rootDir akan menggagalkan build.
- E2E wajib bernama `*.e2e.spec.ts` agar cocok dengan `testRegex` di jest config.

## Struktur

`apps/api` (NestJS modular monolith), `apps/web` (Next.js 15, route group
`(customer)`/`(kasir)`/`(admin)`), `packages/contracts` (Zod schema sebagai sumber OpenAPI).
Satu `prisma/schema.prisma` disengaja: FK lintas modul tidak bisa dihindari dalam monolith.

Port/interface untuk integrasi eksternal dipilih lewat env var
(`PAYMENT_DRIVER`, `SEARCH_DRIVER`, `OBJECT_STORAGE_DRIVER`, `MESSAGE_DRIVER`) dengan default
fake/inmemory supaya lokal tidak butuh kredensial. Contohnya di `apps/api/.env.example`.

Rencana fase ada di `PLAN.md`.

## Reading the blueprint (non-obvious)

The `.docx` is a zip; there is no plain-text or markdown version.

```powershell
$d = "$env:TEMP\bp"; Remove-Item -Recurse -Force $d -EA SilentlyContinue
New-Item -ItemType Directory $d | Out-Null
Copy-Item .\Blueprint_Arsitektur_Website_Toko_Pakaian.docx $d\b.zip
Expand-Archive $d\b.zip -DestinationPath $d\x
[xml]$w = Get-Content $d\x\word\document.xml
($w.document.body.InnerText) -replace '\s+',' ' | Out-File $d\txt.txt -Encoding utf8
```

Gotchas:
- `InnerText` flattens everything to one line — grep for section titles instead of reading linearly.
- Punctuation comes out mangled (`—`, `→`, `≤`, smart quotes appear as `â€”`, `��`). This is a
  console-encoding artifact only; don't "fix" content based on it.
- Sections 7, 8, 9, 10, 11 (ERD, UML, sequence/activity/deployment diagrams) are **images only**.
  They cannot be read as text and must be viewed visually or re-derived from the prose.

## Fixed constraints from the spec

Verify against the doc before deviating; these are architectural commitments, not suggestions.

- **Modular monolith, not microservices.** 5 bounded contexts: Katalog (M1), POS (M2),
  Reservasi/DP (M3), Inventori (M4), Akuntansi (M5). Modules may be split into services later,
  so keep boundaries clean — but do not introduce service orchestration now.
- **Stack is pre-decided:** NestJS + Prisma + PostgreSQL 16, Redis 7, RabbitMQ + BullMQ,
  JWT/OAuth2 + RBAC, Docker Compose, GitHub Actions. Frontend: Next.js 15, TypeScript,
  TanStack Query + Zustand, Tailwind + shadcn/ui, Workbox, Dexie.js.
- **REST under `/api/v1/`** with OpenAPI 3.0; GraphQL only as a BFF for the admin dashboard.
- **Cashier POS is offline-first** — transactions persist locally and sync via
  `POST /api/v1/transaksi/batch-sync`. Stock conflict resolution is an explicit spec requirement.
- **Accounting is single-source, double-entry, automatic.** Every sale / DP / return must generate
  a journal entry programmatically. No parallel manual entry paths.
- **Stock must never go negative** — enforce optimistic locking at the DB level, not app-level checks.
- **Financial audit trail is immutable** and must record who / when / what.
- Accounting output must satisfy SAK EMKM / PSAK; HPP via FIFO or average from inventory data.
- Integrations are Indonesia-specific: Midtrans/Xendit payments (never store card data),
  WhatsApp gateway for reminders, WebUSB/WebBluetooth thermal receipt printing.

## Conventions

- Spec and any resulting docs are written in **Indonesian**. Match that language for user-facing
  copy, module docs, and commit messages unless told otherwise.
- Roadmap is phased (Fase 1 Katalog/Auth/infrastructure as the quick win). Don't build ahead of the
  current phase without an explicit request.
- Blocker for Fase 1 per the doc's own closing note: the Chart of Accounts still needs validation by
  a real accountant/tax consultant before accounting work is considered done.
