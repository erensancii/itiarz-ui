# itiarz-ui

**itiarz** chargeback itiraz operasyonu SaaS'ının web arayüzü (npm paketi `itiarz-web`). Marka bilinçli olarak "itiarz" yazılır.

- **Teknoloji:** Next.js 16 (App Router), React 19, TypeScript, MUI 9, MUI X DataGrid (Community), Vitest.
- **Backend:** [`itiarz-api`](https://github.com/erensancii/itiarz-api) (Spring Boot).
- **Kimlik:** Keycloak 26 (realm `itiarz`).

Bu uygulama aynı zamanda bir **BFF**'tir (Backend for Frontend):
- Keycloak girişini (Authorization Code + PKCE) sunucu tarafında yürütür.
- Token'ları Redis'te tutar. Tarayıcıya yalnızca `HttpOnly` `itiarz_sid` çerezi gider.
- Tarayıcıdan gelen bütün API çağrılarını `/api/proxy/*` üzerinden backend'e iletir; bu sırada Origin kontrolü yapar.

## Kod yapısı

Klasör haritası, kurallar ve "yeni özellik nasıl eklenir" adımları için: **[`src/README.md`](src/README.md)**.

Kısaca:
- `src/app`: routing.
- `src/features/<alan>`: model, servis (`*.server.ts` okuma, `*.client.ts` değişiklik) ve bileşenler.
- `src/shared`: ortak bileşenler (DataTable, AppShell, FormAutoCompleteDropdown…), API ve yetki yardımcıları, tema.
- `src/server`: BFF güvenlik çekirdeği.

## Ekranlar

| URL | İçerik | Gerekli yetki |
|---|---|---|
| `/` | Yönlendirme (giriş / şirket seçimi / itirazlar) | — |
| `/select-tenant` | Şirket seçimi | oturum |
| `/cases`, `/cases/new`, `/cases/[id]` | İtiraz listesi, yeni itiraz, detay (kanıt, durum geçişleri, atama, geçmiş) | `case:read` (yeni: `case:write`) |
| `/team` | Ekip, davet, rol değiştirme, üyeliği kaldırma | `member:read` (değişiklik: `member:manage`) |
| `/audit?page=&size=` | Audit kaydı (sunucu taraflı sayfalı) | `audit:read` |
| `/platform/tenants` | Şirket oluşturma, askıya alma, yöneticiyi yeniden davet etme | platform yöneticisi |

## Ortam değişkenleri

| Değişken | Örnek (yalnızca geliştirme) | Açıklama |
|---|---|---|
| `API_INTERNAL_URL` | `http://api:8080` | Backend adresi (container ağı) |
| `KC_PUBLIC_URL` | `http://localhost:8081` | Tarayıcının gördüğü Keycloak adresi (issuer). **Build sırasında** da kullanılır (CSP `form-action`). |
| `KC_INTERNAL_URL` | `http://keycloak:8080` | Token/JWKS için iç Keycloak adresi |
| `KC_REALM` | `itiarz` | Realm |
| `KC_WEB_CLIENT_SECRET` | `web_secret_dev_only_change_me` | `itiarz-web` client secret'ı |
| `SESSION_SECRET` | en az 32 karakter | Çerez şifreleme anahtarı |
| `REDIS_URL` | `redis://redis:6379` | Oturum deposu |
| `APP_URL` | `http://localhost:3000` | Uygulamanın dış adresi (CSRF Origin kontrolü, redirect URI) |
| `COOKIE_SECURE` | `false` | Prod'da `true`. HSTS **build sırasında** belirlenir. |
| `TRUST_PROXY` | `false` | Yalnızca `X-Forwarded-For` başlığını ezen güvenilir bir reverse proxy arkasında `true` yapın (giriş rate limit'i). |

## Çalıştırma

Tam yığın (backend, Keycloak, Postgres, Redis, Mailpit ve bu arayüz) itiarz ana projesindeki `docker-compose.yml` ile kalkar:

```bash
cp .env.example .env
docker compose up --build -d     # web: http://localhost:3000
```

Yalnızca arayüz:
```bash
npm install
npm run dev        # http://localhost:3000 (çalışan backend/Keycloak/Redis ve ortam değişkenleri gerekir)
npm test           # Vitest: birim, bileşen ve mimari kural testleri
npm run build      # üretim derlemesi
```

Demo kullanıcılar (geliştirme şifresi `Itiarz.dev.2026!`): `analist@acme.local`, `onay@acme.local`, `admin@acme.local`, `izleyici@acme.local`, `admin@beta.local`, `danisman@itiarz.local`, `platform@itiarz.local`.

## Notlar

- **CSP:** Next.js App Router satır içi bootstrap betiği nedeniyle `script-src 'unsafe-inline'` içerir. Nonce tabanlı CSP sonraki adımda ele alınacak. MUI'nin emotion stilleri `style-src 'unsafe-inline'` ile uyumludur.
- **Platform yöneticisi** hesapları hiçbir zaman şirket bağlamı almaz. itiarz ekibinden biri bir müşteri şirketinde çalışacaksa ayrı bir hesap kullanmalıdır.
- **Tablolar** ücretsiz DataGrid sürümünü kullanır: aynı anda tek filtre uygulanır ve sayfa başına en fazla 100 satır gösterilir.
