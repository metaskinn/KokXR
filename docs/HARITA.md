# KökXR haritası

Ajanlar için okuma haritası. Önce `docs/DURUM.md`'nin başındaki "Şu an" özetini oku, sonra yalnız işinin satırına git.

## Klasör ağacı

```text
kokxr/
├── AGENTS.md, CLAUDE.md      Proje kuralları (her oturumda yüklenir)
├── index.html, vite.config.ts, tsconfig*.json, package.json   Giriş ve derleme ayarları
├── src/
│   ├── App.tsx               Rotalar ve üst gezinme
│   ├── index.css             Ortak stiller
│   ├── pages/                Sayfalar (ana sayfa, eser, atölyeler, yönetim, onay, VR...)
│   ├── components/
│   │   ├── maket/            3B maket ve VR (xr*.ts: VR; yapilar/: yapı modelleri)
│   │   ├── kilic/, cini/     Atölye bileşenleri
│   │   ├── restorasyon/      Muradiye panosu bulmacası (VR dahil)
│   │   ├── gezinti/          Sanal gezinti yardımcıları
│   │   └── *.tsx             Galeri, Test, ZamanKatmani, KaynakSatiri, FotoKredi...
│   ├── data/
│   │   ├── eserler/*.json    Eser içeriği (tek kaynak)
│   │   ├── index.ts          Eserleri yükleme, localStorage üst katmanı
│   │   ├── dogrulama.ts      Eser ve form doğrulaması
│   │   ├── vrEserler.ts      VR sekmesi: şehirler, yapılar, yayınlar
│   │   └── kilic.ts, cini.ts, turkiyeHaritasi.ts, acikYayin.ts
│   └── types/eser.ts         Eser veri tipleri
├── public/                   gorseller/, modeller/, derinlik/, restorasyon/
├── assets/                   kilic/, vazo/: model kaynakları (scripts/*_uret.py yazar)
├── scripts/                  Test çalıştırıcı, açık yayın, model ve video üretimi
├── tests/                    Saf testler, tarayıcı testleri, xr-sim/ (simüle Quest)
├── docs/                     Etkin belgeler (aşağıda)
└── _arsiv/                   Eski planlar ve raporlar; birleştirilmiş belgelerin özgün hâlleri
```

Üretilen ve git'e girmeyenler: `dist/`, `test-sonuclari/`, `node_modules/`, `.env`.

## Kökteki diğer dosyalar

| Yol | Ne için |
|---|---|
| `public/manifest.webmanifest`, `public/ikonlar/` | PWA bildirimi ve simgeler |
| `scripts/sw-sablon.js` | Service worker şablonu; build sırasında `dist/sw.js` olur |
| `.nvmrc` | Node 24 sürümü; `nvm use` okur |
| `.gitignore` | Git'e girmeyen yollar |
| `.env` | Supabase adresi ve anahtarı; git'e girmez, sohbete yapıştırılmaz |
| `.claude/` | `settings.json` takım ayarı, `settings.local.json` kişisel ayar, `worktrees/` geçici çalışma kopyaları (git dışı, 1,1 GB) |
| `.vscode/` | Kişisel editör ayarı; git'e girmez |
| `package-lock.json` | Bağımlılık sürümleri; elle değiştirilmez |
| `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` | Tip denetimi ayarları |
| `vite.config.ts` | Derleme ayarı |
| `node_modules/`, `dist/` | Üretilen klasörler; `npm install` ve `npm run build` |

## Belgeler

| Dosya | Ne için |
|---|---|
| `docs/DURUM.md` | Şu anki durum, plan, kurulum, mimari, Quest ve tarihçe |
| `docs/kokkod_kazanma_plani.md` | Final planı ve öncelikler |
| `docs/gorev_dagilimi.md` | 24 saatlik görev dağılımı ve dört rol |
| `docs/sartname.md` | Şartname metni; bölüm 5 puanlama |
| `docs/eski dosyalar/` | Resmî şartname PDF'i, ön eleme sunumu, Geliştirme Raporu 1, eski Unity planı |
| `docs/sunum-vaatleri.md` | Jüriye verilen vaatler |
| `docs/ui-tasarim.md` | Arayüz kuralları |
| `docs/kilic-atolyesi.md`, `cini-atolyesi.md`, `vazo-modeli.md` | Atölye ayrıntıları |
| `docs/token-tasarrufu.md` | Token kurallarının gerekçesi ve ayarları |

## Yeni eser nasıl eklenir

1. `src/data/eserler/<id>.json` dosyasını mevcut bir eserden örnekleyerek oluştur. Tip: `src/types/eser.ts`. Bileşen kodu değişmez; dosya otomatik yüklenir.
2. Fotoğrafları `public/gorseller/<id>/` altına koy. Her görselde `alt`, `kaynakId` ve `kredi` dolu olsun, kredi metni `kaynaklar` listesinde de yer alsın.
3. Bilinmeyen alanı uydurma. Her bilgi kartı ve test sorusu için `kaynakId` ver.
4. VR sekmesinde görünmesi için `src/data/vrEserler.ts` dosyasına yapı olarak ekle. Maket isteniyorsa `src/components/maket/yapilar/` ve `maketSahnesi.ts` de değişir.
5. `npm run test:hizli` çalıştır.

Yönetim ekranı (`/yonetim/yeni`) şu an yalnız tarayıcıya kaydeder. Kalıcı olması için "JSON olarak indir" ile dosyayı `src/data/eserler/` altına koy.

## Testler nasıl çalışır

Önce `nvm use 24`. Süreye değil koşula bağlı bekle.

| Komut | Kapsam | Not |
|---|---|---|
| `npm run test:hizli` | Tip denetimi, saf mantık testleri, görsel kredi denetimi | Her küçük değişiklikte |
| `npm run test:tarayici` | Derleme + `maket-xr-dugme`, `vazo-xr-dugme`, `maket-ic` | Arayüz veya sahne değişince; yaklaşık 10 dakika |
| `node scripts/test-tarayici.mjs <test>` | Tek tarayıcı testi, örn. `galeri` | Önce `npm run build` |
| `npm run test:e2e` | Chromium 1280 ve 360, Firefox 1280 | Ayrı terminalde `npm run preview` (port 4173) açık olmalı |
| `tests/xr-sim/` | Simüle Quest | Kullanımı `docs/DURUM.md`, "Simüle Quest" başlığında |
| `node tests/<ad>.mjs` | `package.json`'a bağlı olmayan testler: `cini`, `kilic`, `vr-eserler`, `yolculuk`, `maket-yapi <eser-id>` vb. | Çoğu `TEST_URL` ve 4173'te preview ister |

## Hangi iş hangi dosyalarda

| Rol (`gorev_dagilimi.md`) | Dosyalar | Henüz yok |
|---|---|---|
| **Kişi 1: Veri ve içerik** | `src/data/eserler/`, `public/gorseller/`, `src/types/eser.ts` (şema ortak), `scripts/levha_kirp.py` | Görsel küçültme betiği, eser kategorisi ve koordinat alanları |
| **Kişi 2: Yönetim ve onay** | `src/pages/Yonetim.tsx`, `EserFormu.tsx`, `OnayAkisi.tsx`, `src/data/index.ts`, `src/data/dogrulama.ts` | Supabase katmanı, giriş, görsel yükleme, gerçek onay akışı |
| **Kişi 3: Keşif, erişilebilirlik, paket** | `src/pages/AnaSayfa.tsx`, `EserSayfasi.tsx`, `src/components/Galeri.tsx`, `Test.tsx`, `ZamanKatmani.tsx`, `SanalGezinti.tsx`, `KaynakSatiri.tsx`, `FotoKredi.tsx`, `src/index.css`, `index.html`, `vite.config.ts` | Filtre, harita, PWA, kontrast, yazı boyutu, sesli anlatım, axe raporu |
| **Kişi 4: VR, demo, sunum** | `src/components/maket/`, `src/pages/VrEserler.tsx`, `src/data/vrEserler.ts`, `turkiyeHaritasi.ts`, atölye sayfaları (`VazoAtolyesi`, `KilicAtolyesi`, `CiniAtolyesi`), `src/components/kilic/`, `cini/`, `tests/xr-sim/`, `docs/eski dosyalar/KokXR_Sunum_v2.pptx` | README, demo senaryosu |

Ortak dosya: `src/App.tsx` ve şema (`src/types/eser.ts`). Değiştirmeden önce ilgili kişiye söyle.
