# KökXR

Bursa, Konya ve Hatay'daki vakıf eserlerini kaynaklarıyla keşfetmek için web uygulaması. KÖK&KOD Hackathonu prototipi.

- **Eserler** (`/artifacts`): 706 eser; şehir, ilçe ve tür filtresi, arama. Eser sayfasında fotoğraf galerisi, tarihçe, kaynak ve sayfa bilgisi, üç soruluk test.
- **Maketler** (`/places`): Kodla üretilmiş **temsilî** 3B maketler; Ulu Camii'de iç mekân gezisi ve sesli anlatım. Maketler tarama veya belgelenmiş rekonstrüksiyon değildir.
- **Atölyeler** (`/workshops`): Vazo ve kılıç etkileşimleri.
- **Yönetim** (`/admin`): Girişli panel. Genel bakış (sayılar, şehir/tür dağılımı, veri kalitesi, son 14 gün, bekleyenler), Eserler, Onay kuyruğu, Medya (bucket), Envanter, İşlem kaydı. Editör ekler ve düzenler, küratör onaylar, reddeder, siler; yalnız onaylanan içerik yayımlanır.
- WebXR destekleyen cihazlarda (Meta Quest) maket ve atölyeler VR'da açılabilir.

## Kurulum ve çalıştırma

Node.js 24+ gerekir (`.nvmrc`).

```bash
npm install
cp .env.example .env.local   # Neon bağlantısı ve şifreler (değerleri doldur)
npm run db:setup     # tabloları kurar, 706 eseri doğrulayıp yükler (var olanlara dokunmaz), envanteri yeniler
node scripts/storage-check.mjs           # yayındaki eserlerin her görseli bucket'ta mı (çevrimiçi kontrol)
npm run dev          # geliştirme sunucusu + /api (aynı sunucu kodu)
npm run build        # dist/ içine üretim derlemesi
npm run preview      # derlemeyi yerelde sun (port 4173)
npm run build:acik   # fotoğrafsız açık sürüm (izni belirsiz görseller dışarıda kalır)
```

## Testler

```bash
npm run test:hizli     # tip denetimi + saf mantık testleri (saniyeler)
npm run test:tarayici  # build + preview + tarayıcı testleri; sunucuyu kendisi kapatır
npm run test:e2e       # uçtan uca (Chromium 1280/360, Firefox 1280); önce ayrı terminalde: npm run preview
```

İlk tarayıcı testinden önce: `npx playwright install chromium firefox`.

## Mimari

- **React 19 + TypeScript + Vite**, yönlendirme `react-router-dom`. 3B ve VR: **Three.js + WebXR**; Three.js yalnız maket açıldığında yüklenir.
- **Veritabanı:** Neon Postgres (`server/schema.sql`): `artifacts` (yayındaki sürüm, bekleyen taslak, durum, ret gerekçesi), `audit_log` (kim, ne zaman, hangi işlem), `inventory` + `inventory_details` (basılı envanter, 340 yapı), `media` (bucket'taki her dosyanın anahtarı, eseri, boyutu, türü).
- **Dosyalar:** Neon Object Storage, **özel** `uploads` bucket'ı (`neon.ts`). Eser fotoğrafları yalnız bucket'ta durur; `public/images/` içinde yalnız kodun doğrudan yüklediği maket dokuları ve `model-still.jpg` kalır. Görseller `images/<eser-id>/<dosya>` anahtarıyla durur; `GET /api/media/<anahtar>` yalnız `media` tablosundaki anahtarlar için 1 saatlik imzalı adrese yönlendirir. Bucket'a henüz taşınmamış dosya için statik kopyaya döner.
- **API:** `server/` (Node, yerleşik modüller + `@neondatabase/serverless` HTTP sürücüsü). Vercel'de tek fonksiyon (`api/handler.ts`, `vercel.json` yönlendirmesi); `npm run dev` sırasında aynı kod Vite ara katmanında çalışır.
- **Ön yüz:** Paketteki JSON kopyası anında gösterilir; `GET /api/artifacts` ve `GET /api/inventory` yanıt verince veritabanındaki içerik onun yerine geçer ve görseller bucket'tan gelir. API yoksa (statik önizleme, çevrimdışı) paketteki kopya ve statik görseller kalır. Açık sürüm (`build:acik`) fotoğrafları hiçbir kaynaktan göstermez.

| API | Erişim |
|---|---|
| `GET /api/artifacts` | Herkes; yalnız yayındaki içerik |
| `GET /api/inventory` | Herkes; basılı envanter |
| `GET /api/media/<anahtar>` | Herkes; imzalı bucket adresine yönlendirme |
| `GET /api/admin/stats`, `GET /api/admin/media?q=&offset=` | Editör, küratör; panel sayıları ve medya listesi |
| `POST /api/admin/uploads` | Editör, küratör; JPEG/PNG/WebP (içerikten tanınır), en fazla 3 MB |
| `POST/DELETE /api/session` | Giriş / çıkış |
| `GET /api/admin/artifacts[/:id]`, `GET /api/admin/audit` | Editör, küratör |
| `PUT /api/admin/artifacts/:id` | Editör, küratör; her kayıt "onay bekliyor" olur |
| `POST /api/admin/artifacts/:id/approve`, `/reject`, `DELETE …/:id` | Yalnız küratör |
| `POST /api/admin/artifacts/:id/discard` | Editör, küratör; bekleyen değişikliği geri alır |

| Katman | Yer |
|---|---|
| Rotalar | `src/app/App.tsx` |
| Özellikler | `src/features/heritage` (eserler), `places` (maketler), `scale-models` (3B/VR), `workshops`, `admin` |
| Veri modeli | `src/domain/artifact.ts`, tür anahtarları `src/domain/artifactTypes.ts` |
| Doğrulama | `src/domain/verification.ts` (form ve sunucuda aynı kurallar) |
| İçerik | `src/infrastructure/contentRepository.ts` (paket kopyası), `src/infrastructure/api.ts` (API istemcisi) |
| Sunucu | `server/handlers.ts` (rotalar, moderasyon), `server/auth.ts` (oturum), `server/db.ts` |

## Veri modeli ve içerik

- Her eser bir JSON dosyası: `src/content/artifacts/<id>.json`. Dosyalar `import.meta.glob` ile otomatik yüklenir; **yeni eser veya yeni şehir için kod değişmez**, `city` ve `district` alanları serbest metindir.
- Temel alanlar: ad, şehir, ilçe, dönem, vâkıf, özet, tarihçe, `sources` (metin + sayfa), `images` (dosya, alt metin, künye, kaynak), `hotspots`, `test`, isteğe bağlı `model`, `tour`, `timeLayer`.
- Her görsel, bilgi noktası ve soru bir `sourceId` ile kaynağa bağlanır. `verification`: `verified` = **kaynaklı bilgi** (kaynak ve sayfa dolu), `illustrative` = temsilî içerik. "Kaynaklı" elle doğrulanmış demek değildir.
- Eser türleri: yerleşik eserler için `src/content/artifact-types.json` (`node scripts/artifact-types.mjs` ile adlardan üretilir); yönetimden eklenen eserde `types` alanı formdan seçilir.
- Basılı envanter: `src/content/inventory.json` (340 yapı), bağlantılar `src/features/heritage/components/inventoryLinks.ts`.
- Yeni eser ekleme adımları: `docs/adding-artifacts.md`.

## Yönetim, güvenlik ve moderasyon

- **Roller:** Şifreler yalnız ortam değişkenlerinden (`ADMIN_PASSWORD` küratör, `EDITOR_PASSWORD` editör) okunur, sabit zamanlı karşılaştırılır; hatalı girişte yanıt geciktirilir.
- **Oturum:** `SESSION_SECRET` ile HMAC imzalı, 8 saatlik, `HttpOnly`, `SameSite=Strict`, HTTPS'te `Secure` çerez. Sunucuda oturum tablosu yok.
- **Moderasyon:** Her ekleme ve düzenleme taslak olarak "onay bekliyor" durumuna girer; yayındaki sürüm onaya kadar değişmez. Küratör onaylar ya da gerekçe yazarak reddeder. Tüm işlemler `audit_log`'a yazılır.
- **Girdi denetimi (sunucuda):** zorunlu alanlar, uzunluk sınırları (`LIMITS`), kayıt sayısı sınırları, tür anahtarları, kaynak bağlantıları, URL biçimi, bilinmeyen alanların atılması, 1 MB gövde sınırı, yazma isteklerinde `application/json` zorunluluğu. Kaynaksız kayıt "Kaynaklı bilgi" olamaz. SQL sorguları parametreli.
- **Görsel yükleme:** Dosya türü uzantıdan değil ilk baytlardan anlaşılır, anahtarı sunucu üretir, yüklenen görselde künye ve kullanım izni zorunludur.
- **Henüz yok:** kullanıcı başına hesap, giriş denemesi sayacı. Sesler ve derinlik haritaları (3 MB) hâlâ statik dosya.

## Lisanslar ve görseller

- Kütüphaneler: React, React Router, Three.js (MIT). Yazı tipleri: Libre Franklin ve Literata (SIL OFL, `public/fonts/OFL-*.txt`).
- Arşiv fotoğraflarının kamuya açık kullanım izni netleşmedi; açık sürüm (`npm run build:acik`) fotoğrafsız derlenir. Repo özel tutulur.

## Dokümanlar

`PLAN.md` (güncel plan ve durum), `HANDOFF.md` (ayrıntılı devir notu), `AGENTS.md` (geliştirme kuralları), `docs/specification.md` (yarışma şartnamesi), eski raporlar `docs/archive/`.
