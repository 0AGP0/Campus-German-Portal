# CRM Yeniden Kurgulama Planı

## Yapılan Temizlik (Silinenler)

### Veritabanı (Prisma)
- **Kaldırılan modeller:** `CrmTab`, `CrmSection`, `CrmField`, `StudentCrmData`
- **Student modelinden kaldırılan:** `crmData` ilişkisi

### API route'lar (silindi)
- `/api/crm-builder` – Admin builder verisi
- `/api/crm-fields` – Alan listesi / CRUD
- `/api/crm-fields/[id]` – Alan detay / PATCH / DELETE
- `/api/crm-fields/[id]/students-with-data` – Alanında veri olan öğrenciler
- `/api/crm-tabs` – Sekme CRUD
- `/api/crm-tabs/[id]` – Sekme PATCH / DELETE
- `/api/crm-sections` – Konteyner CRUD
- `/api/crm-sections/[id]` – Konteyner PATCH / DELETE

### Sayfalar
- **Admin:** `dashboard/admin/crm-fields/page.tsx` (CRM Sayfa Oluşturucu) – tamamen kaldırıldı
- **Öğrenci:** `dashboard/student/profile/page.tsx` – sadece basit profil placeholder kaldı (CRM formu yok)

### Bileşenler (components/crm/)
- `SortableSectionItem.tsx`
- `SortableFieldItem.tsx`
- `PaletteFieldItem.tsx`
- `SectionDropZone.tsx`

### Güncellenen dosyalar
- **Admin ana sayfa:** CRM kartı kaldırıldı, ikinci kart “Öğrenci atamaları”na çevrildi
- **Sidebar (dashboard-shell):** “CRM Alanları” menü linki kaldırıldı
- **student-profile API:** Sadece `student` döndürüyor, `crmData` yok
- **students/[id] API:** `crmData` include ve PATCH ile `data` güncellemesi kaldırıldı
- **Danışman öğrenci detay:** “CRM Bilgileri” kartı ve ilgili state/fonksiyonlar kaldırıldı
- **seed.ts:** CRM ve StudentCrmData ile ilgili seed adımları kaldırıldı

---

## Veritabanını Güncelleme (Sizin Yapacaklarınız)

Eski CRM tablolarını veritabanından kaldırmak için:

```bash
cd portal
npx prisma db push
```

Bu komut şemayı veritabanına uyumlu hale getirir; `CrmTab`, `CrmSection`, `CrmField`, `StudentCrmData` tabloları silinir (Prisma şemada artık olmadığı için).

**Not:** Mevcut veritabanında bu tablolarda veri varsa, `db push` bu tabloları kaldırırken veriler silinir. Yedek almak isterseniz önce pg_dump veya benzeri ile yedekleyin.

---

## Yeni CRM Nasıl Kurgulanabilir?

### 1. Veritabanı taslağı

Yeni CRM için tekrar **yapılandırma** + **öğrenci verisi** ayrımı mantıklı:

| Model        | Açıklama |
|-------------|----------|
| **CrmTab**  | Sekmeler (örn. Kişisel Bilgiler, Program Bilgileri). `label`, `order`. |
| **CrmSection** | Her sekme içindeki konteynerlar. `tabId`, `title`, `order`, `width` (25/50/100). |
| **CrmField** | Her konteyner içindeki alanlar. `key`, `label`, `type`, `required`, `options`, `sectionId`, `order`. İsteğe bağlı: `hidden` (gizli alan, veri korunur). |
| **StudentCrmData** | Öğrenci başına tek kayıt. `studentId`, `data` (JSON string). |

Öğrenci verisi yine `StudentCrmData.data` içinde key–value (CRM alan key’leri) saklanabilir.

### 2. Admin tarafı (CRM Sayfa Oluşturucu)

- **Tek sayfa:** Örn. `/dashboard/admin/crm-fields` (veya `/dashboard/admin/crm`).
- **Sol/orta:** Sekmeler listesi; seçilen sekmede konteynerlar **tek sütunda** (alt alta), sıra drag ile değişir.
- **Sağ panel:**
  - Alan paleti (Metin, E-posta, Sayı, Tarih, Seçenek listesi) → sadece konteyner içine sürükleyip bırakma ile ekleme.
  - Seçilen öğe (sekme / konteyner / alan) için özellikler: isim, genişlik (sadece konteyner), zorunluluk, seçenekler (select için) vb.
- **Genişlik:** Sadece sağ panelden (slider/input) değiştirilir; konteyner kartında slider olmaz. Değişince anında veya kısa gecikmeyle API’ye yazılır (tek “Sayfayı kaydet” de kullanılabilir).
- **Silme / gizleme:** Bir alan silinirken “bu alanda veri var” kontrolü; varsa “gizle” (veri kalsın), yoksa gerçek silme. Altta “Gizli alanlar” listesi ve “Göster” ile geri getirme.

API’ler: `GET/POST/PATCH/DELETE` için `/api/crm-tabs`, `/api/crm-sections`, `/api/crm-fields` ve admin builder için tek bir `GET /api/crm-builder` (tabs + sections + visible fields + hidden fields) yeterli.

### 3. Öğrenci tarafı (Profil / CRM formu)

- **Kaynak:** Form yapısı `GET /api/crm-fields` ile alınır (sadece `hidden: false` alanlar, section + tab bilgisi ile).
- **Görünüm:** Admin’deki gibi sekmeler, her sekmede konteynerlar; konteyner genişliği (`width`) ile yan yana veya tam genişlik yerleşim.
- **Kayıt:** Öğrenci kendi verisini `PATCH /api/student-profile` ile `{ data: { fieldKey: value, ... } }` gönderir; backend `StudentCrmData` upsert eder.

### 4. Danışman tarafı

- Öğrenci detay sayfasında CRM alanları sadece **okuma** (ve gerekirse admin izinli düzenleme) olarak tekrar eklenebilir.
- Veri yine `GET /api/students/[id]` ile `crmData` (veya ayrı endpoint) üzerinden gelir.

### 5. Uygulama sırası önerisi

1. Prisma şemaya `CrmTab`, `CrmSection`, `CrmField`, `StudentCrmData` ve `Student.crmData` ilişkisini tekrar ekleyip `npx prisma db push` (veya migrate) ile tabloları oluşturmak.
2. Seed’de (isteğe bağlı) örnek bir sekme + konteyner + birkaç alan eklemek.
3. `/api/crm-builder`, `/api/crm-tabs`, `/api/crm-sections`, `/api/crm-fields` (ve [id]) API’lerini yeniden yazmak.
4. Admin CRM sayfasını sade bir builder olarak (sürükle-bırak, sağ panel, genişlik sadece panelde) yeniden kurmak.
5. `student-profile` API’de `crmData` okuyup yazacak şekilde ve öğrenci profil sayfasında formu tekrar eklemek.
6. Danışman öğrenci detay sayfasında CRM bilgilerini (sadece okuma veya sınırlı düzenleme) tekrar göstermek.

Bu plan, mevcut temizlenmiş kodla uyumludur; istersen bir adımı seçip o adımdan kodla devam edebiliriz.
