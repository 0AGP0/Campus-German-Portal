# Campus German CRM Portal – Yapılanlar ve Eksikler

## 🌐 Domain

Portal production adresi: **https://portal.campusgerman.com**

- `.env` ve `.env.example` içinde `NEXT_PUBLIC_APP_URL="https://portal.campusgerman.com"` tanımlı; e-posta linkleri, redirect’ler vb. bu adresi kullanabilir.
- Yerel geliştirmede `NEXT_PUBLIC_APP_URL=http://localhost:3000` yapılabilir.
- Domain’i sunucuya yönlendirmek için: DNS’te `portal.campusgerman.com` → sunucu IP’si (A kaydı); sunucuda Nginx/Caddy ile reverse proxy (örn. `proxy_pass http://127.0.0.1:3000`) ve SSL (Let’s Encrypt) kullanın.

---

## ✅ Yapılanlar (bu turda)

### Admin – Öğrenci atamaları ve kullanıcı düzenleme
- **Öğrenci atamaları sayfası:** Admin menüde "Öğrenci atamaları" ile tüm öğrenciler listelenir; her satırda danışman dropdown’ı ve "Kaydet" ile atama/değişiklik yapılır. Sayfalama ve arama vardır.
- **Kullanıcı düzenleme:** Kullanıcılar sayfasında "Düzenle" ile ad, rol ve (öğrenciyse) danışman ataması güncellenir (`PATCH /api/users/[id]`).
- **API:** `PATCH /api/users/[id]` (name, role, consultantId), `PATCH /api/students/[id]` (admin için consultantId).

### Admin – CRM alanları kapsamlı yönetim
- **Sayfalama:** CRM alanları listesi `?page=1&limit=10` ile sayfalanır; önceki/sonraki butonları vardır.
- **Seçenekler (options):** Yeni alan ve düzenlemede "select" tipi için seçenekler metin alanı (virgül veya satır ile ayrılmış) eklenir; tabloda Seçenekler sütunu gösterilir.
- **GET /api/crm-fields:** Sayfa/limit yoksa tüm alanlar dizi olarak döner (öğrenci/danışman profil için); sayfa/limit varsa sadece admin paginated liste alır.

### Danışman – CRM düzenleme ve listeler
- **Öğrenci detayda CRM düzenleme:** "CRM Bilgileri" bölümünde "Düzenle" ile tüm CRM alanları formda açılır; danışman veriyi güncelleyip "Kaydet" ile `PATCH /api/students/[id]` (data) gönderir.
- **Öğrenci listesi:** Arama (ad/e-posta), aşama filtresi ve sayfalama eklendi; API yanıtı `{ items, total, page, limit }` formatında.

### Liste sayfalarında arama ve sayfalama
- **Kullanıcılar (admin):** Arama kutusu (`?q=`) ve sayfalama; yanıt `{ items, total, page, limit }`.
- **Öğrenci atamaları (admin):** Arama ve sayfalama.
- **Öğrenciler (danışman):** Arama, aşama filtresi ve sayfalama.

### Belgeler API
- `GET /api/documents?studentId=...` – Öğrenciye ait belgeler (yetki: danışman/admin o öğrenciye, öğrenci kendi kaydı).
- `POST /api/documents` – FormData: `studentId`, `file`. Danışman kendi öğrencileri, öğrenci kendi kaydı için.
- `GET /api/documents/[id]` – İndirme (stream).
- `DELETE /api/documents/[id]` – Silme (yükleyen veya danışman/admin).

Dosyalar proje kökünde `uploads/` klasörüne kaydediliyor (`.gitignore`’da).

### Diğer mekanikler
- **Danışman:** "Yeni öğrenci ekle" → modal (e-posta, şifre, ad) → hesap oluşur ve danışmana atanır.
- **Admin:** "Yeni kullanıcı"da rol Öğrenci ise isteğe bağlı "Danışman" seçimi; `consultantId` kaydediliyor.

---

## ⏳ Kalan / İsteğe Bağlı Eksikler

1. **Kullanıcı devre dışı bırakma (Admin)**  
   "Devre dışı bırak" menü öğesi hâlâ devre dışı. İstenirse: `User` modeline `active: boolean` eklenip girişte kontrol.

2. **Şablondan PDF oluşturma**  
   Öğrenci ve danışman taraflarında "Şablondan PDF oluştur" butonu var ama işlev yok. İstenirse: `Template` tablosu + HTML şablonları, placeholder doldurup Puppeteer vb. ile PDF üretip indirme.

3. **"Şifremi unuttum"**  
   Login sayfasında link var, akış (token, e-posta) henüz yok.

4. **Toplu belge yükleme (danışman)**  
   Tek öğrenci yerine birden fazla öğrenciye aynı anda belge atama tanımlı değil.

5. **Raporlama / özet**  
   Admin veya danışman için dashboard istatistikleri (aşama dağılımı, son işlemler vb.) istenirse eklenebilir.

---

Özet: Admin’den danışmanlara öğrenci atama/düzenleme, kullanıcı düzenleme, CRM alanları sayfalı ve kapsamlı yönetim, danışman tarafında öğrenci CRM verisi düzenleme ve tüm ilgili listelerde arama/sayfalama tamamlandı. Kalan maddeler isteğe bağlı geliştirmeler ve PDF/şifre sıfırlama gibi ek özellikler.
