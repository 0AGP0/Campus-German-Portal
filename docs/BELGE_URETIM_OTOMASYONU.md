# Belge Üretim Otomasyonu Planı

## Amaç
Öğrenci verileri (CRM + profil) ve şablonlara göre otomatik PDF/Word belge üretmek (kabul mektubu, davetiye, özet rapor vb.).

## Mevcut Yapı
- **Template** modeli: `name`, `description`, `htmlPath`, `placeholders` (string), `active`
- Şablonlar sunucuda dosya olarak (örn. `templates/kabul-mektubu.html`) tutulabilir; `placeholders` virgülle ayrılmış alan adları (örn. `student_name, university_name, date`).

## Önerilen Akış

### 1. Placeholder eşlemesi
- Her placeholder için veri kaynağı tanımlanır:
  - **Öğrenci sabitleri:** `student.name`, `student.email`, `student.stage`
  - **CRM alanları:** `crm.phone`, `crm.birth_date` (CrmField.key → StudentCrmData.data[key])
  - **Sabitler:** `date` (bugün), `year`, `company_name` (env veya ayarlardan)
- Template modeline `placeholderMapping` (JSON) eklenebilir: `{ "student_name": "student.name", "uni": "crm.university" }` veya varsayılan: placeholder adı = CRM key veya student field.

### 2. Üretim endpoint’i
- **POST /api/generate-document**
  - Body: `{ studentId: string, templateId: string }` veya query.
  - Yetki: Danışman (kendi öğrencisi), Admin (tümü), isteğe bağlı Öğrenci (sadece kendi).
  - Akış:
    1. Öğrenci + CRM verisini al.
    2. Şablonu oku (htmlPath veya DB’de HTML string).
    3. Placeholder’ları değerlerle değiştir (örn. `{{student_name}}` → öğrenci adı).
    4. HTML’i PDF’e çevir (aşağıdaki kütüphaneler).
    5. Yanıt: PDF dosyası (attachment) veya geçici URL.

### 3. HTML → PDF kütüphaneleri (Node.js)
- **Puppeteer:** Headless Chrome ile HTML’i PDF’e dönüştürür. Kaliteli çıktı, sunucuda Chrome gerekir.
- **@react-pdf/renderer:** React bileşenleriyle PDF (HTML değil, kendi DSL’i).
- **pdf-lib:** Mevcut PDF’e metin ekleme; tam sayfa HTML’den üretim için daha sınırlı.
- **Öneri:** Şablonlar HTML ise Puppeteer; “şablon yönetimi” admin panelde basit HTML editör veya yükleme ile yapılabilir.

### 4. Admin tarafı
- **Şablon yönetimi:** Mevcut Template CRUD’a ek ekran:
  - Placeholder listesi (şablondan parse veya manuel).
  - Her placeholder için “veri kaynağı” seçimi (student / crm.key / sabit).
- **Test üretimi:** Bir öğrenci seçip “Bu şablonla üret” butonu → indir veya önizleme.

### 5. Danışman / öğrenci tarafı
- Öğrenci detay veya belgeler sayfasında “Şablondan belge oluştur” butonu.
  - Şablon seçimi (dropdown).
  - “Oluştur” → PDF indirilir veya “Belgelerim”e eklenir (opsiyonel).

### 6. Güvenlik ve depolama
- Üretilen dosyalar geçici (temp) tutulup yanıtta stream edilebilir; kalıcı saklamak isterseniz `Document` tablosuna “generated” tipi ile eklenebilir.
- Şablon HTML’inde XSS riski: Sadece güvenilir admin içeriği; kullanıcı verisi placeholder’lara escape edilerek yazılmalı (örn. `&lt;`, `&gt;`).

## Uygulama sırası önerisi
1. Template için placeholder eşleme alanı ve varsayılan mantığı (student + crm) yazmak.
2. POST /api/generate-document taslağı: Öğrenci + CRM verisini al, şablon HTML’i placeholder’larla doldur, yanıtta “HTML” veya “PDF” döndür (PDF için Puppeteer kurulumu ayrı adım).
3. Puppeteer (veya alternatif) ile HTML → PDF’i ekleyip endpoint’i tamamlamak.
4. Admin şablon ekranına “Test üret” ve danışman/öğrenci sayfasına “Şablondan oluştur” butonlarını eklemek.

Bu plan, mevcut Template ve CRM yapınızla uyumludur; adım adım eklenebilir.
