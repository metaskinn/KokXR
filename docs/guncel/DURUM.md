# KökXR durum belgesi

## Şu an (7 Kasım 2026)

1. **Ürün:** Web + WebXR (React, Vite, Three.js). Quest tarayıcıdan açılıyor; Unity kullanılmıyor.
2. **Çalışıyor:** Bursa'dan 10 eser (tarihçe, galeri, kaynak, kredi, 3 soruluk test, temsilî maket ve VR girişi), vazo, kılıç ve çini atölyeleri, Yolculuk akışı.
3. **Test:** `test:e2e` Chromium 1280/360 ve Firefox 1280'de 15/15, `test:hizli` ve tarayıcı testleri geçti. Gerçek Quest'te yalnız Ulu Camii denendi.
4. **Yarım:** Yönetim ekranı yalnız `localStorage`'a kaydediyor; giriş ve görsel yükleme yok. Onay ve öğretmen ekranları mokap.
5. **PWA:** Kuruldu (`public/manifest.webmanifest`, `public/ikonlar/`, `scripts/sw-sablon.js`, `tests/pwa.mjs`); service worker yalnız derlenmiş sürümde kayıt olur, çevrimdışı açılış testli.
5b. **Eksik:** masaüstü paketi, şehir/ilçe/kategori filtresi ve harita, yüksek kontrast, yazı boyutu, sesli anlatım, axe raporu, README.
6. **Doğrulanmadı:** Tarihsel metinler kitapla karşılaştırılmadı; 10 eser `dogrulanmis` işaretli olduğu için bu bir risk. `kokxr.vercel.app` 6 Kasım notuna göre başka ekip üyesinin hesabında, elle yüklenmiş fotoğrafsız eski sürüm; push ile güncellenmeyebilir.
7. **Sıradaki iş:** Sırayla, ayrı dal ve commit: Supabase ile kalıcı kayıt + giriş + görsel yükleme (`yonetim/...`), onay akışı (`yonetim/...`).
8. **Hazır:** `.env` içinde Supabase adresi ve anahtarı var; yeni bağımlılık olarak yalnız Supabase istemcisi onaylı.
9. **Kurallar:** `master`'a birleştirme ve push için sor. Node 24 kullan (`nvm use 24`). Tarih veya kaynak uydurma.
10. **Devamı:** Plan `docs/kokkod_kazanma_plani.md`, dosya haritası `docs/HARITA.md`. Bu belgenin geri kalanını yalnız gerekirse oku.


## Güncel durum

Bu bölüm 6 Kasım gece notudur. O gün `ulu-camii-grafik` dalında olan işler 7 Kasım'da `master`'a girdi.

#### Bu dalda eklenenler
- **VR Eserler sekmesi (`/vr`):** Türkiye haritası → şehir → yapı → `/vr/<eser-id>`. Liste `src/data/vrEserler.ts`; yapı, eser verisinde `maket` veya `restorasyon` varsa kendiliğinden açılır. Sınır çizgisi Natural Earth (kamu malı). Konya ve Hatay'da VR yok, yalnız kitap bağlantısı var.
- **9 yeni Bursa maketi (web ve VR):** Orhan Bey, I. Murat Hüdavendigar, Hamzabey, Timurtaş Paşa, II. Murat (Muradiye), Yeşil Çelebi Mehmed, Yıldırım, Emir Sultan, Umurbey. Her biri `src/components/maket/yapilar/<eser-id>.ts`, `src/data/eserler/<eser-id>.json`, `public/gorseller/<eser-id>/`.
- **Yeni yapı ekleme:** `yapilar/<eser-id>.ts` içinde `export const yapi = (): Maket => ...` yeterlidir, otomatik kaydolur; yardımcı dosyalar alt klasöre konur. Kamera, kaide ve iç ışık `Maket` arayüzünde yapıya özeldir. `m.hali` Ulu Camii'nin paye düzenine bağlıdır, başka yapıda `m.haliSade` kullanın.
- **Ulu Camii iç mekânı:** kodla üretilen halı ve mermer (`maket/ulucamiZemin.ts`), avize haleleri, ışık sütunu, iç yansıma ortamı, gerçek iç gölgeler. Quest ve dokunmatik cihazda `hafifCihaz()` daha hafif malzeme ve yarı boyutlu doku kullanır.
- **Yapılara çıkma:** `IcYurume.zeminler` ve `yurumeCarpisma.ts:zeminAdimi` ile yükseklikli yürüme (web ve VR). Ulu Camii'de minber, kürsü ve mahfile çıkılır.
- **Dokunmatik yürüme kolu:** `EseriEleAl.tsx:YurumeKolu`, iç mekânda ve `pointer: coarse` cihazda görünür.
- **Paneller:** web kartı ve VR kartı küçültüldü; VR kartı web kartının görsel dilinde (`maket/xrPanel.ts`).

#### Testler
`tests/maket-yapi.mjs <eser-id>` (sahne, parçalama, duraklar, eser sayfası), `tests/maket-tirmanma.mjs`, `tests/maket-dokunmatik.mjs`, `tests/vr-eserler.mjs`. Hepsi `TEST_URL` ile çalışır.
Son tur: `maket-yapi` 10 yapıda, `vr-eserler` ve `maket-xr-dugme` geçti (yürüme kolundan hemen önceki kodla). `maket-dokunmatik` ve `maket-tirmanma` yalnız Ulu Camii'de çalıştı.

#### Doğrulanmayanlar
- **Yeni 9 yapı Quest'te ve VR simülasyonunda denenmedi;** VR birleştirme oyunu bu yapılarda hiç çalışmadı. `tests/xr-sim/` ile simülasyon yapılabilir.
- Üçgen sayısı ve kare hızı gerçek cihazda ölçülmedi. Yürüme kolu gerçek telefonda denenmedi.
- Tarihsel metinlerin sayfa numaraları ajanlar tarafından yazıldı, elle kitapla karşılaştırılmadı.
- Yıldırım ve Umurbey'in son düzeltmeleri testten geçti ama görüntüleri tek tek incelenmedi.

#### Yayın
- **Geçici adres:** `vercel deploy --temporary` ile girişsiz yayın alınıyor; 60 dakikada kapanır, hesaba alınmazsa silinir.
- **Tam sürüm:** `npm run build`, ardından `dist/vercel.json` (SPA yönlendirmesi) elle eklenir. Kullanıcı arşiv fotoğraflarının bu yayında yer almasına izin verdi; sponsor izni hâlâ açık konudur.
- **`kokxr.vercel.app`:** başka bir ekip üyesinin hesabında, elle yüklenmiş açık sürüm (fotoğrafsız). Güncellemek için o hesaba erişim gerekir.
- `~/.npm` ev kotasını doldurabiliyor: `npm_config_cache` değişkenini geçici klasöre verin.

## Plan, kurallar ve kararlar

**Öne çıkaran özellik:** VR. Ana sahne: Quest 3'te maketi tut, incele, içeri gir, vazoyu onar.

### Kurallar

- Mokap ekranında görünür etiket: `Demo · örnek veri` (`src/components/DemoEtiketi.tsx`). Maketlerde `Temsilî maket` etiketi kalır.
- Tarih, kaynak, kişi, kurum veya onay uydurulmaz. Kaynaklı bilgi mevcut `kaynakId` ile gösterilir.
- Yeni bağımlılık için sor; Supabase istemcisi onaylı (7 Kasım). Mevcut testler bozulmaz.
- Paralel ajanlar kendi çalışma kopyasında ve kendi dosyalarında çalışır. Rotaları ve birleştirmeyi ana oturum yapar.

### Ürün yapısı

`/yolculuk` tek giriş noktasıdır: **Eline al → Zamanda yürü → Onar → Sına.** Ana sayfanın ana çağrısı buraya gider.

| Kullanıcı | Nereden girer |
|---|---|
| Öğrenci, jüri | Yolculuk; serbest keşif için Keşfet ve atölyeler |
| Öğretmen | Üst menü: Öğretmen paneli |
| Yönetici | Üst menü: Yönetim |
| Vizyon, kütüphane, onay akışı | Alt menü |

Erişilebilirlik ölçütleri: adımlar kilitsiz, geri tuşu çalışır, adım değişince odak başlığa geçer, durum yalnız renkle anlatılmaz, hedefler en az 44 px, 320 px'te yatay taşma yok.

### Yapılacaklar

Öncelik `docs/kokkod_kazanma_plani.md`. Aşağıdakiler eski planlardan hâlâ açık kalanlardır.

**VR**

- [ ] Masaüstünde ve VR'da 10 kat büyütme
- [ ] VR menüsünde zaman katmanı
- [ ] Yolculuktan VR'a giriş iki tıktan fazla sürmesin
- [ ] Yeni 9 yapı: gerçek Quest ve VR simülasyonu; VR birleştirme oyunu bu yapılarda hiç çalışmadı

**Gerçek cihaz** (Quest 3, veri kablosu, geliştirici modu, `adb`)

- [ ] `adb reverse tcp:4173 tcp:4173`, Quest Browser'da `http://localhost:4173/yolculuk`
- [ ] VR'a giriş, FPS ölçümü (hedef 72); altındaysa serbest yürümeyi kapatıp masa üstü maket + durak geçişiyle devam et
- [ ] `_arsiv/docs/superpowers/plans/2026-11-04-ulu-camii-quest.md` Görev 6 kontrol listesi
- [ ] Tutma, vazo onarımı, etiket okunurluğu, tek kumanda, konfor
- [ ] Gerçek cihazda VR yedek videosu
- [ ] Yedek olarak 360° turu Quest Browser'da dene
- [ ] Çalışmayan özelliği demodan çıkar, vizyon olarak anlat

**Doğrulama ve teslim**

- [ ] Tüm testler: `npm run test:hizli`, `npm run test:tarayici`, `node scripts/test-tarayici.mjs yolculuk`, `npm run test:e2e`
- [ ] `tests/ui.mjs` odak denetimi bir kez kaldı, yeniden çalıştırınca geçti; aralıklı sorun mu izle
- [ ] Bağımsız inceleme: etiket eksiği, uydurma içerik, kırık akış, erişilebilirlik
- [ ] 1280 ve 360 px ekran görüntüleriyle son bakış
- [ ] Yedek demo videosunu arayüz değiştiği için yeniden çek: `node scripts/demo_video.mjs <cikti.webm>` (önce build ve 4173'te preview)
- [ ] Tarihsel metinleri ve zaman katmanı tarihlerini envanter PDF'iyle karşılaştır
- [ ] Yıldırım ve Umurbey maketlerinin son görüntülerine tek tek bak

**Küçük ve isteğe bağlı**

- [ ] Yönetim listesindeki erişilebilir adda fazla boşluk ("Düzenle : …"): `src/pages/Yonetim.tsx` `sr-only` span
- [ ] Çini: ses yok; sürükleme adımlarının klavye karşılığı yok, "Ustaya bırak" ile geçiliyor
- [ ] İsteğe bağlı: Ulu Camii minberi veya şadırvanı için elde çevrilebilir küçük nesne maketi
- [ ] AR: yalnız bu listenin geri kalanı bitince

**Final günü**

- [ ] `npm run build` alınmış `dist/` ve yedek video **iki dizüstünde ve USB'de**
- [ ] Demo Chrome/Firefox'ta, **Brave değil**; 360° tur için internet bağlantısı denendi
- [ ] Demo öncesi tarayıcı `localStorage` temiz (Yönetim → "Tüm üst katmanı sıfırla") ya da hazır demo durumu
- [ ] Sunumda "çalışan prototip" ile "vizyon (VR, zaman katmanı…)" ayrı slaytlarda
- [ ] Her ekip üyesi mimariyi ve veri modelini 1 dakikada anlatabiliyor (şartname 5.1.2)
- [ ] Sunumda çalışan özellik ile vizyon ayrımı
- [ ] VR'ın hangi sorunu çözdüğü net anlatılıyor (şartname 5.2.2)

Önerilen 3 dakikalık demo akışı: `_arsiv/docs/arsiv/test-raporu-2.md` sonunda.

### Kes listesi

Süre yetmezse şu sırayla çıkar: AR → onay akışı → kütüphane → VR menüsünde zaman katmanı. VR'da tutma ve vazo onarımı en son kesilir.

### Vaat durumu

| Vaat | Finalde | Tür |
|---|---|---|
| Çevir, parçala | Mevcut maket | Gerçek |
| 10 kat büyüt | Sınırlar 10 kata çıkar | Gerçek |
| Tut | Vazo; VR'da maket ve vazo | Gerçek, cihazda doğrulanacak |
| Alt yüzdeki yazı | Temsilî vazoda örnek yazı | Mokap |
| Zaman katmanı | Kaynaklı dönem metinleri; dönemsel görsel yok | Gerçek, vaadin bir kısmı |
| Restorasyon görevi | Çini bulmacası, vazo atölyesi | Gerçek |
| Doğrulanmış bilgi | Kaynaklı kartlar + örnek onay akışı | Gerçek + mokap |
| Öğretmen paneli | Cihazdaki sonuçlar + örnek sınıf verisi | Mokap |
| KökMobil, Dokunulabilir Müze | Senaryo ekranı | Vizyon |
| Dijital Miras Kütüphanesi | Eser listesi | Gerçek veri, basit ekran |
| Tarama, 1:1 dijital ikiz | Akış ekranı, `Tarama verisi yok` notuyla | Vizyon |
| VR | WebXR | Gerçek, cuma denenecek |
| AR | `immersive-ar`, süre kalırsa | Cihazda doğrulanacak |
| Tek senaryo demo | `/yolculuk` | Gerçek + mokap |

### Açık kararlar ve konular

- Tarama verisi veya gerçek küratör onayı varsa ürüne eklenir; yoksa vizyon olarak kalır.
- Sonraki push'lar: kullanıcı izniyle.
- Fotoğraf izni: Organizasyon duyurusu "projelerinizde kullanabilirsiniz" diyor; her görselde kredi var (7 Kasım). Ayrı yazılı teyit yok. Repo private kalır.
- Organizasyona sorulacak: PWA "mobil/masaüstü uygulaması" sayılıyor mu; 7 bölgelik veri paketi verilecek mi (`KÖK&KOD` Drive klasörü boş).
- **Envanter kitabının tam adı** — kaynak satırlarında şimdilik "Vakıf Eserleri Envanteri – Bursa" yazıyor.
- **360TR** — resmî embed kodu (ücretsiz hesapla: https://www.360tr.com/tr/hesabim/embed/yeni?tour=359) ve/veya bilgilendirme e-postası.
  Şu an herkese açık `https://www.360tr.com/embed/bursa-ulu-camii` adresi kullanılıyor.

## Kurulum ve çalıştırma

Gereken: **Node.js 24+** (eski bilgisayarda v24.22.1), npm, git.

```bash
npm install                                   # bağımlılıklar
npm run dev                                   # geliştirme: http://localhost:5173
npm run build && npm run preview -- --port 4173   # üretim sürümü: http://localhost:4173
```

### Uçtan uca test

```bash
npx playwright install chromium firefox       # yalnız ilk seferde (~300 MB tarayıcı indirir)
npm run build && npm run preview -- --port 4173   # ayrı bir terminalde açık kalsın
npm run test:e2e                              # Chromium 1280 + 360 px ve Firefox 1280 px, 15'er adım
```
Ekran görüntüleri `test-sonuclari/` klasörüne yazılır (git dışı). Beklenen: her yapılandırmada `15/15`.

**Not:** Brave tarayıcıda 360° tur Shields yüzünden açılmayabilir — demo için Chrome/Firefox kullanın.
- `channel: 'chrome'` kullanan testler (`vazo`, `vazo-xr-dugme`, `ui`, `galeri`, `maket-ic`, `maket-xr-dugme`) Google Chrome ister.

### Simüle Quest (`tests/xr-sim/`)

Gerçek three.js WebXRManager'ı Meta'nın `iwer` paketiyle sürer. `iwer` geçici klasöre kurulur, `package.json`'a girmez.

```bash
export XR_SIM=/gecici/bir/klasor
bash tests/xr-sim/kur.sh
node_modules/.bin/vite preview --outDir "$XR_SIM/dist" --host 127.0.0.1 --port 4174 --strictPort   # ayrı terminalde
node tests/xr-sim/sim.mjs ana
```

- Son sonuç, düzeltmelerden önceki kodda: 78 denetimden 76'sı geçti (`tests/xr-sim/son-sonuc.json`). Kalan 2'si: kart açıkken menüye ulaşılamaması, baş dönükken durak yönü. Düzeltmeleri `wip/vr-tutma`'da.
- Betik depoya taşındı; `kur.sh` çalıştırıldı, ama taşındıktan sonra `sim.mjs` baştan sona çalıştırılmadı.
- FPS, konfor ve gerçek kumanda eşlemesini kanıtlamaz. Yazılımsal çizimde bir tur uzun sürer.

## Mimari ve veri modeli

- **Tüm içerik JSON'da:** `src/data/eserler/<id>.json`. Yeni eser = yeni JSON + `public/gorseller/<id>/` fotoğrafları; **kod değişmez**
  (`src/data/index.ts` klasördeki tüm JSON'ları `import.meta.glob` ile otomatik yükler).
- **Tip tanımları:** `src/types/eser.ts` (`Eser`, `Kaynak`, `Gorsel`, `BilgiNoktasi`, `Soru`, `Tur`, `Tur360`, `RestorasyonGorevi`, `Maket`).
  İsteğe bağlı alanlar: `tur` (gezinti), `tur360`, `restorasyon`, `maket` — olmayan eserde ilgili bölüm görünmez.
- **Yönetim ekranı** değişiklikleri `localStorage` (`kokxr-icerik`) üst katmanında tutulur; JSON varsayılanlarının üstüne yazılır.
  Kalıcı yapmak için: Yönetim → "JSON olarak indir" → dosyayı `src/data/eserler/` içine koy → commit.
- **Rozetler:** `localStorage` → `kokxr-rozetler` (eser id'si = test rozeti, `<id>:restorasyon` = restorasyon rozeti).
- **Three.js** dinamik import ile yalnızca maket/gezinti açılınca yüklenir (ayrı ~568 kB parça).
- **Derinlik haritaları** (`public/derinlik/`) Depth Anything V2 (small) ile çevrimdışı üretildi (`@huggingface/transformers`,
  model `onnx-community/depth-anything-v2-small`). Yeni gezinti durağı eklenirse yeniden üretmek gerekir.

#### İçerik kuralları (AGENTS.md'den — çok önemli)
- **Tarihsel bilgi uydurma.** Her metin `kaynakId` ile envanter PDF'inde sayfa numaralı bir kaynağa bağlı
  ("Vakıf Eserleri Envanteri – Bursa, Osmangazi, "Ulucami"/"II. Murad Külliyesi", s. X").
  Kaynaksız içerik "Kaynaklı bilgi" olarak işaretlenemez (yönetim ekranı da bunu zorunlu kılar).
- **Verisi olmayan 3B/VR/360°'yi varmış gibi gösterme.** Maket ve gezinti ekranda "temsili" etiketlidir; 360° tur 360TR'ye aittir ve kaynak bağlantısı gösterilir.
- **Fotoğraflar:** Her görselde `kredi` alanı bulunur. Repo private kalır.
- Fotoğraf → yapı eşleştirmesi tahminle değil, envanter PDF'inde hangi bölümde kullanıldığına bakılarak yapıldı.

### Çini atölyesi

Kod `src/components/cini/`, metinler `src/data/cini.ts`, kaynaklar ve sınırlar `docs/cini-atolyesi.md`.
Testler: `node tests/cini-mantik.mjs` ve (4173 açıkken) `node tests/cini.mjs`.
Oksit eşleştirmesi ve çamur malzeme adları kaynakla doğrulanamadığı için bilerek oyuna alınmadı; kaynaksız eklemeyin.

## Quest

Teknik notlar 4 Kasım tarihlidir. Dosya durumları ve tek kumanda sorunu sonradan değişti; kumanda düzeltmesi `master`'da.

### Yük ölçümü (`57722ed`, yazılımsal çizim)

| Ölçü | Dış | İç |
|---|---|---|
| Tek göz çizim çağrısı | 63 | 48–57 |
| Tek göz üçgen | ~401 bin | ~394–399 bin |
| Stereo tahmini çağrı / üçgen | ~126 / ~802 bin | ~114 / ~798 bin |

- 61 mesh, 50 malzeme, instancing yok, en büyük tek geometri 135.360 üçgen.
- Gölgeli karede çağrı ve üçgen yaklaşık iki katı (122 / 802 bin), ama gölge haritası durağan, her karede çizilmez.
- 41 doku, en büyüğü 2048×1024, yaklaşık 103 MB (mip dahil). 29'u kodla üretiliyor.
- Masaüstü gölge haritası 4096, Quest'te `hover: none` ise 2048 olmalı; cihazda doğrulanmadı.
- Sahne oluşturma yazılımsal çizimde 4–8 sn; bu Quest süresi değildir.

Yorum: Plandaki kaba bütçenin (stereo ~1 milyon üçgen, ~200 çağrı) içinde ama üçgende sınıra yakın. Asıl riskler dört iç ışık, malzeme sayısı, doku belleği ve açılış süresi. Kare hızı cihazda ölçülmedi.

### Kod okurken bilinmesi gerekenler

- `yurumeAdimi` ölü bölgeyi kendi uygular; çağırmadan önce `oluBolge` uygulama.
- `anlikDonus` sağa itişte `yon: 1` döndürür, pozitif `rotY` sola çevirir. Bu yüzden `aci = -yon * XR_DONUS`; aynı `aci` hem `basCevresindeDon`'a hem `rotY`'ye gider.
- `camera.position` XR'da rig yerelidir, dünya konumu için `getWorldPosition` kullan. Baş pozu ilk render'a kadar güncel değildir, `xr.getCamera()` üzerinden okunur.
- Rig 100× ölçekliyken near 0,05 m yaklaşık 5 sahne birimine denk gelir. Oturum kapanınca near/far'ı Three.js geri almaz, `oturumBitti` alır.
- Karta ışınla isabet yalnız `bilgiKapat()` çağırır; kartı `bilgiDegisti(null)` → `xr.bilgiGoster(null)` zinciri gizler.
- `xr.kare(dt)` render'dan önce çağrılmalı. `temizle` açık oturumda `oturumBitti` çağırmaz.
- Paneller `depthTest=false`, menü 1,34 m, kart 1,30 m uzakta; ışın önce karta çarpar.
- `ciz` ve `goster` dokuyu yeniden yükler, kare döngüsünde çağırma.
- Panel öğeleri için `bilgiPaneli()` gizli, `xrPaneli()` görünür başlar.
- Testler plandan farklı olarak iki dosyadadır: `maket-xr-mantik.mjs`, `maket-xr-metin.mjs`.

### Cihaz gerektiren doğrulamalar

Rig ölçeğinin görsel doğruluğu, `axes[2/3]` ve `buttons[5]` eşlemesi, `local-floor` ile `ZEMIN_Y` uyumu, panel okunurluğu, stereo konfor, 72 FPS.

- VR'da `Temsilî maket · Gerçek bir 3B tarama değildir` etiketi görünür kalmalı.

## Tam metinler

Bu belgeden çıkarılanların özgünleri `_arsiv/` altındadır:

- `_arsiv/PLAN.md`: Eski yapılacaklar, 4 Kasım yeni bilgisayar kurulumu, dal tablosu, USB izni (`adb`) komutları.
- `_arsiv/DEVAM.md`: Proje özeti ve özellik tablosu, repoyu taşıma, üç ajan düzeni ve tuzakları, 5 Kasım notu, video kayıt teknikleri.
- `_arsiv/DEVIR-QUEST.md`: Quest dosya durumları, test geçmişi, kullanıcı kararları, eski sıradaki işler.
- `_arsiv/docs/plan.md`: Web MVP planı, şartname eşlemesi, ilk veri modeli, takvim.
