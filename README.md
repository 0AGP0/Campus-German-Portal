# Campus German CRM Portal

Campus German (campusgerman.com) için iç portal / CRM. Admin, Danışman ve Öğrenci panelleri.

## Gereksinimler

- Node.js 20+
- PostgreSQL (yerel veya VPS)

## Kurulum

1. Bağımlılıklar zaten yüklü. Eksikse:
   ```bash
   cd portal && npm install
   ```

2. Ortam değişkenleri:
   ```bash
   cp .env.example .env
   ```
   `.env` içinde `DATABASE_URL` değerini kendi PostgreSQL adresinize göre düzenleyin:
   ```
   DATABASE_URL="postgresql://KULLANICI:SIFRE@localhost:5432/campus_german_portal"
   ```

3. Veritabanı ve ilk kullanıcı:
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```
   Varsayılan admin: `admin@campusgerman.com` / `Admin123!`  
   (İsterseniz `.env` ile `SEED_ADMIN_EMAIL` ve `SEED_ADMIN_PASSWORD` tanımlayın.)

4. Geliştirme sunucusu:
   ```bash
   npm run dev
   ```
   Tarayıcıda: http://localhost:3000 → Giriş yap → Admin ile giriş.

## Proje yapısı

- `src/app` – Next.js App Router (/, /login, /dashboard/...)
- `src/components` – UI bileşenleri (shadcn) ve `dashboard-shell` (sidebar + rol menüsü)
- `src/lib` – auth, db (Prisma)
- `prisma` – şema, migration, seed
- Rol bazlı erişim: `/dashboard/admin`, `/dashboard/consultant`, `/dashboard/student` ilgili layout’larda kontrol ediliyor.

## UI aşaması – Google Stitch promptları

Sayfa tasarımları için kullanacağınız Stitch promptları `docs/STITCH_PROMPTS.md` dosyasında. Her sayfa için prompt’u Stitch’e yapıştırıp çıktıyı projeye uyarlayacağız.

## Komutlar

| Komut | Açıklama |
|-------|----------|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Production build |
| `npm run start` | Production sunucu |
| `npm run db:generate` | Prisma client üretir |
| `npm run db:push` | Şemayı DB’ye uygular (migration dosyası oluşturmaz) |
| `npm run db:migrate` | Migration oluşturur ve uygular |
| `npm run db:seed` | İlk admin + örnek CRM alanlarını ekler |
