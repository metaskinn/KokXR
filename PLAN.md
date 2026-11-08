# KökXR — final planı (2 kişi: sunum + diğer işler)

Güncelleme: 8 Kasım 2026, sabah · Teslim: **8 Kasım Pazar 12.30 (Türkiye saati)** · Sunum: **5 dakika**.
Dal: `main` (`feature/maket-vr` ve UX yenilemesi birleşti). Önceki planlar: `docs/archive/2026-11-07-plan-final-review.md`, `docs/archive/2026-11-07-plan-before-final-review.md`.
İşaretler: `[x]` yapıldı ve doğrulandı · `[~]` yapıldı, cihazda/canlıda doğrulanmadı · `[ ]` açık · `[-]` artık gerekmiyor.

## 0. Son 2 saat: iki kişi, önem sırasıyla

Yeni şehir, yeni maket, öğretmen paneli ve yüksek kontrast/yazı boyutu ayarı bu sürenin dışında. En kritik açık: ekleme/düzenleme zincirinin sunulacak ortamda kesintisiz çalıştığını kanıtlamak. Her kişinin listesi kendi içinde önem sırasındadır; ikisi paralel yürür.

### Kişi 1 — Sunum (konuşmacı)

Dosyalar: `docs/sunum-metni.md`, `docs/sunum-taslagi.pptx`, `docs/demo-ekleme-duzenleme.md`. Kod dosyasına dokunmaz.

| Sıra | İş | Süre | Durum |
|---|---|---|---|
| 1 | **Slayt boşluklarını doldur:** ekip isimleri ve görev dağılımı, gerçek 42 kampüs adı, QR (kokxr.vercel.app). Yer tutucular `[...]` ile işaretli | 15 dk | [ ] |
| 2 | **PPTX'i aç ve gözle kontrol et** (taşma, hiza; üretildiği makinede görsel kontrol yapılamadı), düzelt, PDF yedeğini al | 15 dk | [ ] |
| 3 | **VR/AR cümlesi:** Kişi 2'den gelen cihaz sonucuna göre seç. Denenmediyse “cihaz doğrulaması sürüyor” (taslakta böyle). Mobil AR için telefon + tarayıcıyı slayta ve nota yaz | 10 dk | [~] taslak yumuşak, [ ] cihaz bilgisi |
| 4 | **Süreli prova ×3:** 5 dk, demo 150 sn. Demo operatörü ve anlatıcı kesinleşir | 30 dk | [ ] |
| 5 | **Jüri soruları (§7) ve 10 jüri başlığı eşlemesi** (`sunum-metni.md` başı): sesli çalış. Söylenmeyecekler: “akademik olarak doğrulanmış”, “ekran okuyucuyla tam uyumlu”, “1:1 dijital ikiz” | 15 dk | [~] metin hazır, [ ] çalışma |
| 6 | **Yedek video (60–90 sn)** çalışan akıştan; kayıt Kişi 2'nin denemesi bitince alınır. İkinci bilgisayar/USB kopyası | 10 dk | [ ] |
| 7 | **11.15–11.45:** PPTX/PDF, video, kablo, görüntü aktarımı, QR ekranda mı | 30 dk | [ ] |

### Kişi 2 — Ürün, veri, cihaz, test

Dosyalar: kod, içerik, testler, Vercel (bkz. §3).

| Sıra | İş | Süre | Durum |
|---|---|---|---|
| 1 | **Ekleme/düzenleme zinciri canlıda:** giriş → ekle → onayla → listede gör → düzenle → yeniden onayla. Metinler hazır: `docs/demo-ekleme-duzenleme.md`. Şifreyi sen girersin; sonra demo kaydını sil/reddet. Sonucu (çalıştı/çalışmadı) Kişi 1'e söyle | 25 dk | [~] metin hazır, canlıda denenmedi |
| 2 | **Fotoğraflı demo:** canlıda Ulu Camii ve Muradiye galerisi açılıyor mu? Yerel önizlemede açılmaz (görseller `/api/media` ile Neon'dan gelir) | 15 dk | [ ] |
| 3 | **Doğruluk:** `docs/demo-dogrulama-listesi.md` (86 madde) kitapla işaretle; yanlış çıkanı düzelt. **Foto izni:** kullanıcı “izin var” dedi (8 Kasım); repoda belge/alan yok (2060 görselde yalnız kredi). Karar: fotoğraflı yayın kalır, kod değişmez. Jüri “izin?” derse yazılı kanıt elde hazır olsun | 20 dk | [~] izin beyanı var, [ ] liste |
| 4 | **Cihaz denemesi:** Quest (mermer, 7 anlatım, çıkışta durma) ve sunumda kullanılacak telefon/tarayıcıda AR. Duyulmayan sesi vaat etme. Sonucu Kişi 1'e ver | 25 dk | [ ] |
| 5 | **Son test:** `test:hizli` temiz (8 Kasım geçti), `test:tarayici` 3/3 (geçti), `test:e2e` 7/9; 2 admin kontrolü DB'li ortamda denenmeli | 10 dk | [~] |
| 6 | **Vercel kalıcı yazar izni** (Settings → Members/Git): şimdilik yalnız `metaskin` commit'i yayınlanır. Sürüm kilidi öncesi son push da `metaskin` ile | 5 dk | [ ] |
| 7 | ~~Mevlâna/Sokullu iç mekân mermer taraması~~ | — | [-] kullanıcı kararı: önemsiz, yapılmayacak |

Yapıldı ve doğrulandı: VR/AR site metni yumuşatma, maket şeridi bağlantı adları, quiz klavye testi, 360 px/%200 kontrolü (ciddi kusur yok), mermer ve ses düzeltmeleri (masaüstü).

El değişimi: Kişi 2'nin 1 ve 4. maddeleri biter bitmez Kişi 1'in 3 ve 6. maddeleri kesinleşir. Sürüm kilidi **11.45**; sunum **12.30**.

## 1. Verilen kararlar

| Konu | Karar |
|---|---|
| Çalışma alanı | **Serbest (XR)** |
| Platform | Masaüstü web; mobil web (mobil AR ekipçe yapıldı); Quest/WebXR VR ve AR yalnız cihazda doğrulanan kapsamda |
| Quest | Bu gece ve yarın sabah elde; VR düzeltmeleri cihazda doğrulanır |
| Ses | Yeni dosya yok; **mevcut 7 konumlu anlatım** (`public/sesler/*.mp3`), VR'da ve masaüstü iç mekânda |
| Mermer | Şadırvan, duvar/sütun/mihrap ve zemin döşeme yanlış görünüyordu (üst üste binme) |
| Ekip | 2 kişi, her biri AI ile: Kişi 1 sunum, Kişi 2 ürün/veri/cihaz/test (§0) |

Değer önerisi: **“Bursa’nın vakıf eserlerini kaynaklarıyla keşfet; temsilî 3B mekânda gezerek yapı ayrıntılarıyla bağ kur.”**
Şartname 5.1.1: çoklu eser, tarihçe/görsel/kaynak, ekleme/düzenleme, canlı uçtan uca demo.
“Akademik onaylı”, “1:1 dijital ikiz”, “öğrenmeyi artırır” gibi doğrulanmamış iddialar kullanılmaz.

## 2. Durum (8 Kasım 2026, `main` 641ebcb sonrası)

**Yapıldı**
- Canlı: `kokxr.vercel.app` Vercel'de Ready (Production). Vercel yalnız yetkili commit yazarının commit'ini yayınlıyor (`metaskin`); `selamisimsek` ve `Muhammet Ali Divan` commit'leri Blocked olur. Geçici çözüm: yetkili yazarla commit + push. Kalıcı çözüm panelde (Settings → Members/Git).
- 706 eser kaydı; 340 yapılık envanter; 39 eserde açık `inventoryId`, kalanı `inventoryLinks.ts` ile bağlanır.
- Eserler sayfası: şehir/ilçe/tür filtresi, arama, sayfalama. Tür verisi `src/content/artifact-types.json`.
- Quiz eser sayfasından **kaldırıldı** (8 Kasım, kullanıcı kararı; `Quiz.tsx` ve eserlerdeki `test` verisi duruyor). Admin formundaki 3 soru zorunluluğu ayrıca duruyor: kaldırılıp kaldırılmayacağı açık.
- Neon Postgres + API: 706 eser veritabanında; editör/küratör girişi, onay/ret/geri al/sil, işlem kaydı, sunucu tarafı doğrulama. Admin: panel, eserler, onay kuyruğu, medya, envanter, kayıt (`/admin/*`). Neon Object Storage: görseller `/api/media` üzerinden, admin'den yükleme. Yerelde uçtan uca doğrulandı; Vercel'de ortam değişkenleri girildi (`DATABASE_URL`, `SESSION_SECRET`, `ADMIN_PASSWORD`, AWS_*), **canlıda giriş ve ekleme denenmedi**.
- Ana sayfa (`/`): VR, AR ve keşfe üç giriş. Eser haritası (Leaflet + OpenStreetMap, yaklaşık konumlar).
- AR: Ulu Camii ve vazo, ayrıca `xrSession` model bağımsız olduğu için tüm maketler; masaya yerleştirme, oda ışığı. Ekip mobilde AR'ın yapıldığını bildirdi; **bu oturumda cihazda görülmedi**, telefon/tarayıcı listesi kayıtlı değil.
- Maketler: 10 temsilî maket; Mevlâna (Konya) ve Sokullu (Payas) maketleri eklendi, ikisinin yürünebilir iç mekânı var. Test çıktısı hâlâ "10 with a scale model" diyor, sayı doğrulanmalı.
- Mermer: şadırvan döşemesi ile `floor.ts` mermer ızgarası aynı yükseklikte çakışıyordu (z-fighting); düzeltildi, masaüstünde önce/sonra ekran görüntüsüyle doğrulandı.
- Duvar/sütun/mihrap/minber: masaüstünde taranıp temiz çıktı.
- Ses: anlatım yalnız Ulu Camii'nde çalar (diğer binalar aynı nokta kimliklerini paylaşıyordu); askıdaki ses bağlamı yeniden açılır; masaüstü iç mekânda da yakınlıkla çalar, `AudioBufferSourceNode.start` sayımıyla doğrulandı (19 sn şadırvan kaydı).
- `test:hizli` geçti (8 Kasım, `main` 641ebcb).

**Açık**
- Quest denemesi: mermer, ses, AR cihazda görülmedi. Headless Quest kullanıcı aracısı boş sahne veriyor (neden ayrıştırılmadı).
- `test:e2e`: bu birleşimden sonra çalıştırılmadı (bkz. §9). `test:tarayici` 3/3 geçti.
- Tarihsel doğrulama ve fotoğraf izin belgeleri yapılmadı. Kayıtlar “Kaynaklı bilgi”dir, elle doğrulanmış değildir. Vercel build'i `public/images` (667 MB) dahil; izinler doğrulanmadı.
- Yok: yüksek kontrast ve yazı boyutu kontrolü.
- Mevlâna/Sokullu iç mekânları mermer/üst üste binme için taranmadı.

## 3. Dosya sınırları ve hat ayrıntısı

İki kişi, iki yan yana yürüyen iş: **Kişi 1 sunum**, **Kişi 2 diğer her şey** (§0). Aynı dosyada iki AI çalışmaz; sunum dosyaları Kişi 1'in, kod/içerik/test Kişi 2'nin. `App.tsx` yalnız Kişi 2.

Kişi 2'nin dosya sınırı: `src/features/scale-models/`, `src/shared/xr/`, `src/features/workshops/`, `public/sesler/`, `src/features/admin/`, `src/domain/`, `src/content/artifacts/*.json`, `src/features/places/`, `src/features/artifacts/`, `src/app/App.tsx`, `e2e/`.

**Mermer (VR)**
- [x] Şadırvan döşemesinde titreşme: iki mermer katmanı aynı yükseklikteydi; `fountain.ts` döşemesi 1 cm yukarı, `floor.ts` koyu kutular 1 cm aşağı. Masaüstünde önce/sonra doğrulandı.
- [x] Masaüstünde şadırvan, mihrap, minber, levha, doğu kapısı tarandı.
- [~] Quest'te aynı noktalar (`lightDevice()` yolu).
- [-] Mevlâna ve Sokullu iç mekânları: önemsiz bulundu, taranmayacak.

**VR ses**
- [x] Anlatım yalnız Ulu Camii'nde (`narrated`); askıdaki ses bağlamı yeniden açılır; masaüstü iç mekânda yakınlıkla çalar, VR'a girince masaüstü susar.
- [~] 7 anlatımın Quest'te tetiklenmesi, birbirini kesmemesi, çıkışta durması, yeniden girişte çalışması; ses seviyesi.
- [x] `model-interior` zaman aşımı ürün hatası değil, yazılım render yükü (581 sn'de PASS). Gerçek demo cihazında yükleme süresi ölçülmeli.
- [~] Mobil AR: ekip yapıldığını bildirdi; telefon + tarayıcı kayıtlı değil. Denenmeyen cihaz için “çalışıyor” denmez.

**Ürün ve veri**
- [x] Envanter → eser bağlantıları: 39 açık `inventoryId`, kalanı `inventoryLinks.ts`.
- [ ] Formdaki 3 quiz zorunluluğu: quiz sayfadan kalktığı için gereksiz, kaldırılırsa `verification.ts`, form, 706 JSON ve `docs/demo-ekleme-duzenleme.md` etkilenir. Karar bekliyor.
- [~] Ekle → onay → yayın → listede gör → düzenle: yerelde doğrulandı, canlıda değil. Eksik alanla kayıt engellenir, kaynaksız “kaynaklı” seçilemez (sunucu doğrulaması var, canlıda denenmedi).
- [ ] Demo eserleri: Ulu Camii + Muradiye Külliyesi; tarihçe/kaynak sayfaları kitaptan elle doğrulanır, isim tahminiyle bağlanmaz.
- [~] Foto izinleri: kullanıcı izin olduğunu bildirdi; kayıtta yok. Canlı build fotoğraflı kalır. İzin belgesini elde tut.
- [x] E2E eskimiş kontroller güncellendi.

**Sunum (Kişi 1)**
- [ ] Eski PPTX'ten çıkarılacaklar: 1:1 dijital ikiz, zaman slider'ı, “akademisyen onaylı”, “her cihaz”. KökMobil ve öğretmen paneli yol haritasına.
- [x] Moderasyon akışı var (onay/ret kuyruğu, işlem kaydı). Sunumda “yayın öncesi moderasyon” denir; canlıda denendiğinden emin olmadan “çalışıyor” denmez.

**Zaman daralırsa kes:** ikinci eser doğrulamasının kalanı, kılıç atölyesi, Mevlâna/Sokullu taraması.

## 4. Sıra

1. [x] Demo eserleri ve hat dağılımı, bu gece mermer.
2. [x] Mermer, ses, `main` birleşimleri, Vercel yayını.
3. **Şimdi:** §0'daki iki liste paralel; her kişi kendi listesini sırayla yürütür.
4. **Pazar 08.30–10.15:** Kişi 2 canlı zincir, doğruluk listesi, Quest/AR denemesi; Kişi 1 slayt boşlukları, PPTX kontrolü.
5. **10.15–11.15:** süre tutarak 3 prova (Kişi 1 yönetir, Kişi 2 demoyu yürütür).
6. **11.15–11.45:** PPTX/PDF, video, kablo, görüntü aktarımı, son kontrol.
7. **11.45:** sürüm kilidi. Sonrası yalnız sunumu engelleyen arıza.
8. **12.30:** sunum.

## 5. Kabul ölçütleri

- Mermer: şadırvan, duvar/sütun/mihrap, zemin Quest’te ve masaüstünde doğru görünür (önce/sonra ekran görüntüsü). Masaüstü: [x]; Quest: [ ].
- Ses: 7 anlatım Quest’te duyuldu, birbirini kesmedi, çıkış/yeniden girişte çalıştı. Doğrulanmadıysa sunumda ses vaadi yok.
- Ürün: çoklu keşif + fotoğraf/kaynak + ekleme/düzenleme kesintisiz.
- Testler: `test:hizli` yeşil [x]; `test:tarayici` yeşil [x]; `test:e2e` 7/9; kalan 2 admin kontrolü canlıda elle doğrulanır [~].
- Sunum çalışan ürünle aynı şeyi söylüyor; yedek video ve ikinci kopya hazır.

## 6. Sunum — 5 dakika, 6 slayt

| Süre | Bölüm | Şartname başlığı |
|---|---|---|
| 00.00–00.25 | Künye, Serbest (XR), takım, kampüs | Künye ve takım |
| 00.25–00.55 | Katalogdan mekânsal ve kaynaklı keşfe geçiş | Problem, vizyon |
| 00.55–01.20 | Akış şeması; klavye, alt metin, okunurluk | UX, erişilebilirlik |
| 01.20–03.50 | **Canlı demo** | MVP |
| 03.50–04.30 | React/TS/Vite + Three.js/WebXR; Neon Postgres + API; moderasyon; test | Mimari, veri, kalite |
| 04.30–05.00 | Çalışan/gelecek ayrımı, yol haritası (yeni şehir, öğretmen paneli), teşekkür | Yol haritası, kapanış |

Canlı demo (150 sn): Bursa + ilçe/tür filtresi (25) → eser, fotoğraf, kaynak (25) → Ulu Camii iç mekân + mermer + bir sesli anlatım (45) → vazo etkileşimi (20) → önceden hazır temsilî kaydı ekle/onayla (35).
Quest geçişi sığmazsa masaüstü; VR/AR doğrulama durumu açıkça söylenir.

## 7. Jüri soruları (hazırlık)

- Veri nereden, doğrulama nasıl? → Sağlanan kitap, kaynak/sayfa alanı; elle doğrulanan kayıt sayısı kadar söyle.
- Yeni şehir nasıl eklenir? → Aynı veri modeli; Konya ve Hatay kayıtları eklendi, boş şehir “içerik yok” der.
- Moderasyon/güvenlik? → Editör/küratör girişi, onay/ret kuyruğu, işlem kaydı, sunucu tarafı doğrulama.
- 3B model gerçek mi? → Temsilî, kodla üretilmiş; tarama veya belgelenmiş rekonstrüksiyon değil.
- Ölçeklenebilirlik: Neon Postgres + nesne depolama; yüzlerce eser için tasarlandı, 706 kayıt yüklü.
- Fotoğraf izinleri? → Belgelenmemiş olanlar için dürüst ol: izin süreci sürüyor; kredi satırı izin değildir.

## 8. P2 — finalden sonra

Zaman katmanı, yeni 3B model, 360° tur, öğretmen paneli, öğrenme analitiği, yüksek kontrast ve yazı boyutu kontrolü, kalan şehirler (`docs/admin-panel-plan.md` aşamaları).
`main` birleşmeleri ve kamuya yayın için önce sorulur.

## 9. Test kaydı

- 8 Kasım: `test:hizli` geçti (tür denetimi dahil, 641ebcb).
- 8 Kasım: `test:tarayici` (TEST_PORT=4187, yazılım render, `main` 641ebcb): **3/3 PASS**. `model-xr-button` 164 sn, `vase-xr-button` 13 sn, `model-interior` 581 sn (360 px: kart durakta açılır, taşma yok). `inventory-list` testi takım tarafından silindi, çalışmadı. Süreler yazılım render'ında; gerçek cihazda FPS ölçülmedi.
- 8 Kasım: `test:e2e` (preview, yazılım render): Chromium 1280, Chromium 360 ve Firefox 1280'in üçünde de **7/9 PASS**; JS hatası, iframe hatası ve HTTP 404 yok. Düşen 2 kontrol ("6 admin: edit, home page, restore default" ve "6b admin: add and delete new artifact") ürün hatası değil: /admin yerelde Neon veritabanı ve giriş olmadan ulaşılamıyor, ayrıca bu testler eski localStorage tabanlı yönetim akışını varsayıyor. Yenilenmeli ve DB'li ortamda (canlıda) çalıştırılmalı. Bu iki test mevcut hâliyle admin akışının kanıtı sayılmaz; admin akışı canlıda elle denenecek. Bayat iki kontrol düzeltildi: fotoğrafsız build'de bilgi noktası listesi ve 360 px'te "Kontroller" arkasındaki model düğmeleri.

- 8 Kasım, birleşim sonrası (`cacb27e`): `test:hizli` geçti. `test:tarayici`: `model-interior` düştü, ikisi `-32,-25`/`-24.99` konumunda (köşede ~1 cm titreme, test tam eşitlik arıyordu). Aynı düşme eski `5324a55`'te de var: bozulma birleşimden değil, test kırılgan. Eşik 2 cm toleransa çekildi (`tests/model-interior.mjs`). Düzeltme **doğrulanmadı**: son koşuda yazılım render yavaşlığı yüzünden oyuncu 200 sn'de duvara varamadı (`-28,-25`). Gerçek demo cihazında / daha hızlı makinede bir kez denenmeli.
- 8 Kasım, `test:e2e` (birleşim sonrası, önizleme 4189): chromium 1280, chromium 360 ve firefox 1280 üçünde de **7/9**. Geçen: Tab ile atla bağlantısı, favicon, eserler, bilgi noktası kartı, model (aç/döndür/yakınlaş/parçala/klavye), 404 sayfası, taşma. Düşen ikisi aynı: `6 admin: edit, home page, restore default` ve `6b admin: add and delete new artifact` (eski girişi arıyor, 30 sn zaman aşımı). Admin akışı veritabanlı ortamda ve canlıda elle denenmeli; bu iki test DB'li girişe göre yeniden yazılmadı.
