# Campus German CRM

Next.js tabanlı lead pipeline (Kanban), NextAuth, PostgreSQL (Prisma), webhook ile dış kaynaklardan lead alımı.

## Gereksinimler

- Node.js 20+
- PostgreSQL 14+

## Kurulum (geliştirme)

```bash
cp .env.example .env
# .env içinde DATABASE_URL, NEXTAUTH_SECRET, JWT_SECRET doldurun

npm ci
npm run db:migrate
npm run db:seed
npm run dev
```

## Üretim

```bash
npm run build
npm run db:migrate
npm run start
# veya: node server.mjs — PORT .env
```

## Make.com / webhook

Lead göndermek için: **`POST /api/webhooks/leads`** — ayrıntılar **`docs/MAKE_COM.md`**, örnek JSON gövdeler **`scripts/make-payload-*.json`**.

## Ortam değişkenleri

Özet: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `JWT_SECRET`, `WEBHOOK_SECRET` (webhook için), `INITIAL_ADMIN_*` (seed). Tam liste: `.env.example`.
