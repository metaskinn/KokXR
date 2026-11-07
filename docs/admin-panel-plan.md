# Yönetim paneli planı (uçtan uca, temiz)

Durum: onaylandı, aşama 1 bekliyor · 2026-11-07

## Neden

Şartname 5.1.1: "İçerik ekleme ve mevcut içerikleri düzenleme imkânı bulunmalıdır",
"Sistem yeni vakıf eserlerinin eklenmesine uygun şekilde kurgulanmalıdır", "Temel
kullanıcı akışları final sırasında uçtan uca gösterilebilmelidir." 5.1.3: kaynak
gösterimi, doğrulanmamış içerik kesin bilgi gibi sunulmaz.

## Bugünkü durum

- `/admin`, `/admin/new`, `/admin/artifact/:id` var. Üst menü bağlantısı 2026-11-07'de kaldırıldı.
- Kayıt yalnız tarayıcıda: `localStorage` üst katmanı (`src/infrastructure/contentRepository.ts`).
  Başka cihaz veya tarayıcı değişikliği görmez. Kalıcılık için JSON indirip repoya eklemek gerekir.
- Giriş koruması yok; adresi bilen herkes düzenler (yalnız kendi tarayıcısında).
- Görsel yüklenmez; yalnız http/https URL. Lisans alanı zorunlu değil.
- `AdminPage.tsx` dışa aktarma yardımcılarını da taşıyor; `ArtifactForm.tsx` 142 satırlık tek bileşen.
- Onaylar `window.confirm`; taslak/yayın ayrımı yok.

## Hedef akış (demoda gösterilecek)

1. `/admin` → giriş (parola).
2. Panel: eser listesi, arama, şehir ve durum süzgeci.
3. "Yeni eser" → adım adım form (Bilgiler → Kaynaklar → Görseller → Bilgi noktaları → Test → Önizleme).
4. Görsel dosyası yükle; kredi ve lisans alanı zorunlu.
5. Taslak kaydet → önizle → Yayınla.
6. Eserler sayfasında yeni eser görünür; başka tarayıcıda da görünür.
7. Düzenle, yayından kaldır, sil, varsayılana döndür.

## Mimari

Önce yerelde çalışır, sonra Vercel'e taşınır. Vercel fonksiyonlarında disk salt okunur
(yalnız geçici `/tmp`), bu yüzden kayıt yeri baştan değiştirilebilir kurulur.

```
src/domain/            Artifact, doğrulama (istemci ve sunucu ortak)
src/features/admin/    arayüz: AdminLayout, LoginPage, ArtifactListPage, ArtifactEditor/*, ConfirmDialog
src/infrastructure/
  contentStore.ts      istemci portu: list / get / save / remove / publish / uploadImage
  localStore.ts        bugünkü localStorage üst katmanı (sunucusuz yedek)
  apiStore.ts          /api/* istemcisi
server/
  handlers.ts          Web standardı (Request → Response) API işleyicileri, tek kaynak
  storage.ts           sunucu portu: readAll / write / remove / putImage
  fileStorage.ts       yerel: data/artifacts/*.json, data/uploads/
  blobStorage.ts       Vercel: Vercel Blob (eser JSON'ları + görseller)
  local-server.mjs     node:http; dist'i sunar, /api'yi handlers'a bağlar
api/[...path].ts       Vercel fonksiyonu; aynı handlers + blobStorage
```

- İşleyiciler bir kez yazılır; yerel sunucu, Vite dev eklentisi (`configureServer`) ve Vercel fonksiyonu aynı kodu çağırır.
- Depo seçimi ortam değişkeniyle: `BLOB_READ_WRITE_TOKEN` varsa Blob, yoksa dosya.
- İlk okumada depo boşsa `src/content/artifacts/*.json` ile tohumlanır; repo içeriği değişmez.
- Uygulama açılışta `GET /api/health` dener: yanıt varsa `apiStore`, yoksa `localStore` + görünür "yerel demo" notu.
- Eserler sayfası aynı porttan okur; yalnız `status: 'published'` gösterilir.
- Yerel sunucu yalnız Node yerleşik modülleri kullanır. Vercel Blob için `@vercel/blob` gerekir (bkz. Kararlar).

### Veri modeli eki (`src/domain/artifact.ts`)

- `status: 'draft' | 'published'` (eksikse `published`, mevcut JSON'lar bozulmaz)
- `updatedAt: string` (sunucu yazar)
- `Image.license` zorunlu, `Image.credit` zorunlu (yüklenen görsellerde)

### Giriş

- Parola `ADMIN_PASSWORD` ortam değişkeninden (yerelde `.env`, Vercel'de proje ortam değişkeni); `crypto.timingSafeEqual` ile karşılaştırma.
- Oturum: `SESSION_SECRET` ile HMAC imzalı, süreli, HttpOnly, SameSite=Strict, Vercel'de Secure çerez. Sunucuda oturum tablosu tutulmaz (fonksiyonlar durumsuz).
- Yazan tüm `/api` uçları oturum ister; okuma uçları açık.
- Dürüst sınır: hackathon düzeyi. Çok kullanıcı, rol, hız sınırı yok; belgede böyle yazılır.

### Görsel yükleme

- `POST /api/uploads`: yalnız jpeg/png/webp, adı sunucu üretir. Vercel fonksiyon gövde sınırı 4,5 MB olduğundan üst sınır 4 MB.
- Yerelde `data/uploads/` (`.gitignore`'a eklenir); Vercel'de Blob.
- Lisansı veya kredisi boş görsel kaydedilmez. `build:acik` (herkese açık) yapı yüklenen görselleri de dışarıda bırakır.

## Aşamalar

Her aşama sonunda `npm run test:hizli`; arayüz değiştiyse `npm run test:tarayici`.

| # | İş | Dosyalar | Test |
|---|---|---|---|
| 1 | Temizlik: `downloadJson`, `DemoNote` ayrı dosyaya; `window.confirm` yerine erişilebilir `ConfirmDialog` | `features/admin/*` | e2e 6, 6b güncelle |
| 2 | `ContentStore` portu; `localStore` mevcut davranışı taşır; App doğrudan repoyu değil portu kullanır | `infrastructure/*`, `app/App.tsx` | saf test: overlay birleştirme |
| 3 | Form bölme: adım bileşenleri, adım başlığına odak, kaydedilmemiş değişiklik uyarısı | `features/admin/ArtifactEditor/*` | e2e: adımlar arası, hata odağı |
| 4 | Liste: arama, şehir/durum süzgeci, boş durum | `ArtifactListPage.tsx` | e2e |
| 5 | Taslak/yayın alanı ve eserler sayfası süzgeci | `domain/artifact.ts`, `verification.ts`, artifacts listesi | saf test + e2e |
| 6 | Sunucu: `handlers`, `fileStorage`, yerel sunucu, Vite eklentisi, `apiStore`, health ile seçim | `server/`, `apiStore.ts`, `vite.config.ts` | Node test: API uçları |
| 7 | Giriş: login sayfası, oturum, korumalı rota | `LoginPage.tsx`, `server/` | e2e: girişsiz yazma 401 |
| 8 | Görsel yükleme + lisans/kredi zorunluluğu | `server/`, Görseller adımı | e2e: yükle → eserde görün |
| 9 | Önizleme: formdaki taslağı eser sayfası bileşeniyle göster | `ArtifactEditor/Preview.tsx` | e2e |
| 10 | Vercel: `blobStorage`, `api/[...path].ts`, `vercel.json` (SPA yönlendirme), ortam değişkenleri | `server/`, `api/`, `vercel.json` | önizleme dağıtımında e2e |
| 11 | Belgeler: `HANDOFF.md` mimari, `PLAN.md` durum, demo betiği | docs, `scripts/demo_video.mjs` | — |

1–5 sunucusuz da değer verir; 6–9 yerelde uçtan uca; 10 Vercel. Vercel'e geçmeden önce izinsiz fotoğrafların yayın yapısından çıktığı doğrulanır (repo private kuralı).

## Kapsam dışı

- Şehir/ilçe için ayrı tablo ve sihirbaz (şehir bugün serbest metin; gerekirse sonra).
- 3D model, VR, 360° tur düzenleme (verisi olmayanı varmış gibi göstermeme kuralı).
- Kullanıcı katkısı onay akışı (2026-11-07'de kaldırıldı).

## Kararlar (2026-11-07)

1. Sunucu yapılacak.
2. Önce yerel, sonra Vercel.
3. Taslak/yayın ayrımı olacak.
4. Yüklenen fotoğraflar repoya girmez; izin netleşmeden herkese açık yayınlanmaz.
5. `@vercel/blob` bağımlılığı onaylandı; aşama 10'da eklenir.

## Açık

- Vercel'de herkese açık yapı mı (`build:acik`, fotoğrafsız) yoksa korumalı önizleme mi kullanılacak.
