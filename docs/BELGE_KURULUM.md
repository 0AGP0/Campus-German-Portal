# Belge Alanları Kurulumu

Belge alanları (DocTab, DocField) şemaya eklendi. Aşağıdaki adımlar **bir kez** uygulanmalıdır.

## Hata: `Cannot read properties of undefined (reading 'findMany')`

Bu hata, Prisma client'ın `DocTab` / `DocField` modellerini içermediği anlamına gelir. Genelde şema güncellenip `prisma generate` çalıştırılmadığında veya dev sunucusu açıkken generate çalıştırılamadığında (dosya kilitli) oluşur.

## Yapılacaklar

1. **Dev sunucusunu durdurun**  
   Terminalde `npm run dev` (veya `next dev`) çalışıyorsa `Ctrl+C` ile kapatın.

2. **Prisma client'ı güncelleyin**
   ```bash
   cd portal
   npx prisma generate
   ```

3. **Veritabanını güncelleyin** (DocTab, DocField tabloları ve Document.docFieldId için)
   ```bash
   npx prisma db push
   ```

4. **Sunucuyu tekrar başlatın**
   ```bash
   npm run dev
   ```

Bundan sonra Admin → Belge Alanları sayfası ve öğrenci/danışman belge sayfaları normal çalışır.
