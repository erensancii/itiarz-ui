# src/ — itiarz-ui kod haritası

Bu klasör, projeye yeni katılan birinin "bu nerede?" sorusunu klasör adından cevaplayabilmesi için düzenlendi.

```
src/
  app/        Yalnızca routing. page.tsx / layout.tsx / route.ts / loading / error / not-found.
              Sayfa dosyaları incedir: servisten veriyi alır, özelliğin bileşenine verir.
  features/   Her iş alanı kendi klasöründe:
    cases/  team/  audit/  platform/  tenant-selection/
      model.ts                  Tipler ve saf iş kuralları (etiketler, geçişler, biçimlendirme). Testlenir.
      api/<ad>.server.ts        Sunucuda OKUMA (sayfalar çağırır). İlk satır: import "server-only";
      api/<ad>.client.ts        Tarayıcıdan DEĞİŞİKLİK (hook). Yalnızca /api/proxy/... çağırır.
      components/               O alana ait arayüz + DataTable kolon tanımları.
  shared/     Birden fazla özelliğin kullandığı her şey:
    components/   DataTable, AppShell, PageHeader, ProblemAlert, ConfirmDialog, EmptyState,
                  FormAutoCompleteDropdown, Notifications (useNotify), CenteredPage, Brand
    api/          backend.server.ts (requireMe, apiGet), apiClient.ts (useApiAction), problem.ts (Türkçe hata metinleri)
    auth/         model.ts (Me, can, roller), me.ts (loadMe — sunucu), guards.ts (requirePermission), PermissionGate
    theme/        MUI teması (açık/koyu, Türkçe locale), ThemeRegistry
    paging.ts · format.ts · validation.ts · members.ts
  server/     BFF güvenlik çekirdeği: config, session (Redis), oidc, auth-flow, csrf, rate-limit, backend (token yenileme)
```

## Kurallar

`test/architecture.test.ts` bu kuralları her `npm test`'te denetler.

1. **Bağımlılık yönü tek:** `app` → `features` → `shared` → `server`. Bir özellik başka bir özelliği import etmez; ortak ihtiyaç `shared/` altına taşınır. `server/` hiçbir şeyi (shared dahil) import etmez.
2. **Dosya adı ortamı söyler:** `*.server.ts` dosyaları `import "server-only";` ile başlar ve tarayıcı koduna giremez. `"use client"` dosyaları ve `*.client.ts` dosyaları `@/server/*` veya `*.server` import etmez.
3. **Sayfa dosyaları incedir;** iş mantığı `model.ts` veya bileşende yaşar.
4. **Takma adlar:** `@/app/*`, `@/features/*`, `@/shared/*`, `@/server/*`. `../` ile import yok.
5. **Token tarayıcıya gitmez:** istemci bileşenlerine yalnızca gösterim verisi geçer. Tarayıcı backend'e hiç gitmez, yalnızca `/api/proxy/*` üzerinden BFF'e gider.

Diğer kurallar:
- Seçim alanları `Select` değil `FormAutoCompleteDropdown`.
- Bütün listeler `DataTable` ile gösterilir.
- Hatalar `ProblemAlert` ile gösterilir; metinler `shared/api/problem.ts` içindedir.
- Yetki kontrolü `requirePermission` / `requirePlatformAdmin` ile yapılır (yalnızca arayüz içindir, asıl kontrol backend'dedir).

## Veri akışı

```
Okuma:      page.tsx (sunucu) → features/x/api/x.server.ts → shared/api/backend.server.ts → server/backend.ts → itiarz-api
Değişiklik: bileşen ("use client") → features/x/api/x.client.ts → useApiAction → /api/proxy/... → BFF → itiarz-api
            başarıdan sonra router.refresh() ile sunucu verisi yenilenir; kısa bildirim useNotify() ile.
```

## Yeni bir özellik nasıl eklenir

Örnek: "Raporlar" ekranı.

1. `features/reports/model.ts`: backend DTO tipleri ve saf yardımcılar (etiketler, biçimlendirme).
2. `features/reports/api/reports.server.ts`: `import "server-only";` ve `apiGet` ile okuma fonksiyonları.
3. Değişiklik gerekiyorsa `features/reports/api/reports.client.ts`: `useApiAction` üzerine bir `useReportActions()` hook'u.
4. `features/reports/components/`: `reportsColumns.tsx` (kolon tanımları) ve `ReportsTable.tsx` (`DataTable` kullanır), formlar ve diyaloglar.
5. `app/(app)/reports/layout.tsx` içinde `await requirePermission("report:read")`; `app/(app)/reports/page.tsx` servisi çağırıp bileşeni render eder.
6. `shared/components/AppShell/navItems.ts`: menü öğesi ve izni.
7. Testler `test/features/reports/` altına: model ve kolon testleri; gerekiyorsa bileşen testi (`// @vitest-environment jsdom`, `renderUi`).
