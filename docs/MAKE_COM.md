# Make.com → Campus German CRM (lead webhook)

## Endpoint

| | |
|---|---|
| **URL** | `https://<CRM_ALAN_ADINIZ>/api/webhooks/leads` |
| **Method** | `POST` |
| **Body** | JSON |

Örnek üretim: `https://portal.campusgerman.com/api/webhooks/leads`

## Kimlik doğrulama

Sunucu `.env` içindeki `WEBHOOK_SECRET` ile **aynı** değer gönderilmeli.

**Önerilen header** (Authorization bazen proxy/modülde bozulur):

| Header adı | Değer |
|--------------|--------|
| `Content-Type` | `application/json` |
| `x-webhook-secret` | *(`.env` `WEBHOOK_SECRET` ile birebir aynı, `Bearer` yok)* |

**Alternatif:**

| Header adı | Değer |
|--------------|--------|
| `Authorization` | `Bearer <WEBHOOK_SECRET>` |

Secret’ta `+` gibi özel karakterler Make tarafında bozulabiliyorsa sunucuda `openssl rand -hex 32` ile yalnızca hex kullanın.

## Make.com modülü (HTTP → Make a request)

1. **Authentication type:** **No authentication** / **None** (Bearer’ı kendin header ile veriyorsun).
2. **Method:** POST  
3. **Headers:** yukarıdaki tablo.  
4. **Body content type:** JSON  
5. **Body:** Aşağıdaki şemaya uygun JSON; alanları önceki modülden **map** et.

## JSON şeması

```json
{
  "formType": "booking | contact | quote",
  "formData": {
    "alanAdi": "string değerler"
  },
  "source": "isteğe bağlı — kartta kaynak metni",
  "stage": "isteğe bağlı — varsayılan: yeni",
  "id": "isteğe bağlı — yoksa sunucu üretir"
}
```

- `formData` içindeki anahtarlar **camelCase** olmalı (örn. `firstName`, `email`).  
- Sayı gönderilirse API stringe çevirir.  
- Örnek gövdeler: `scripts/make-payload-contact.json`, `make-payload-booking.json`, `make-payload-quote.json`

## Test (sunucu veya yerel)

```bash
curl -sS -X POST "http://127.0.0.1:3000/api/webhooks/leads" \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: WEBHOOK_SECRET_BURAYA" \
  -d @scripts/make-payload-contact.json
```

*(Diğer tipler için `make-payload-booking.json` veya `make-payload-quote.json` kullanın.)*

**GET** (sadece ayakta mı): `GET .../api/webhooks/leads` → kısa JSON mesajı.

## Sorun giderme

| Sorun | Çözüm |
|--------|--------|
| 401 Webhook doğrulanamadı | Secret sunucu `.env` ile Make’de **aynı** mı; `x-webhook-secret` dene; `pm2 restart` |
| 400 formType / formData | `formType` tam olarak `booking`, `contact` veya `quote`; `formData` bir nesne |
| 409 Bu ID zaten kayıtlı | Aynı `id` ile tekrar gönderim; `id` kaldır veya yeni UUID |
| Kart gecikmeli görünür | CRM ~25 sn’de bir arka plan yenilemesi yapar veya sekmeyi değiştir |

## Senaryo önerisi

1. Tetikleyici: Webhooks, Google Sheets, form aracı vb.  
2. **HTTP → Make a request** ile yukarıdaki endpoint’e POST.  
3. İsteğe bağlı: hata durumunda **error handler** ile bildirim.
