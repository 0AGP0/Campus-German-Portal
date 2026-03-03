# CRM Sayfa Oluşturucu – Elementor Tarzı Yapı

## Hedef
- **Boş kanvas**: Sadece konteynerlar ve içlerinde input alanları; sağda sadece alan tipleri listesi.
- **Rahat düzenleme**: Konteyner veya alanı tıklayınca sağ panelde ayarları açılsın; modal yerine tek yerden düzenleme.

## Layout
1. **Sol/orta (Canvas)**
   - Üstte sekmeler (hafif).
   - Altında sadece **konteynerlar** (kutular). Her konteyner: belirgin border, başlık, genişlik kaydırıcı, içinde alanlar.
   - Konteynera tıklayınca **seçili** olsun (çerçeve vurgusu). Boş alana tıklayınca seçim kalkar.
   - "Konteyner ekle" tek tıkla (veya hızlı modal) yeni boş konteyner eklensin.

2. **Sağ panel (Elementor sidebar)**
   - **Üst:** "Alan tipleri" – Metin, E-posta, Sayı, Tarih, Seçenek. Sürükleyip konteynera bırak veya "Buraya ekle" ile ekle.
   - **Alt (bağlamsal):**
     - **Konteyner seçiliyse:** Başlık, Genişlik %. Burada düzenle, anında yansısın.
     - **Alan seçiliyse:** Label, Key, Tip, Zorunlu, Seçenekler (select için). Burada düzenle.
     - **Hiçbiri seçili değilse:** "Konteyner veya alan seçin" mesajı.

## Konteynerlar
- Görsel: Açık arka plan, border, padding; tıklanınca `ring-2 ring-primary` ile seçim.
- Başlık: Konteyner üstünde; isteğe bağlı inline düzenlenebilir (çift tık veya küçük kalem).
- Genişlik: Konteyner başlığında kaydırıcı (25/50/75/100) – mevcut gibi.
- Sıra: Sürükleyerek konteynerların sırası değişsin.
- İçinde: Sadece input alanları; sağdaki listeden sürükle-bırak veya "Alan ekle" ile eklenir.

## Alanlar
- Sadece sağdaki tiplerden: Metin, E-posta, Sayı, Tarih, Seçenek listesi.
- Konteyner içinde sıralanabilir (sürükle).
- Alan satırına tıklayınca sağ panelde o alanın ayarları açılsın; modal yerine panelden düzenlensin.

## Uygulama adımları
1. State: `selectedSectionId`, `selectedFieldId`. Canvas’ta konteyner/alan tıklanınca set; boş alan tıklanınca clear.
2. Sağ paneli iki bölüm yap: üstte palet, altta seçime göre "Konteyner ayarları" veya "Alan ayarları" formu.
3. Konteyner kartına tıklanınca seçim + sağda konteyner formu; alan satırına tıklanınca alan formu.
4. Konteyner/alan formunda değişiklik yapınca API ile kaydet (PATCH); gerekiyorsa debounce.
