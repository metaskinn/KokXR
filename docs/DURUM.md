# KökXR durum belgesi

## Şu an (7 Kasım 2026)

1. **Ürün:** Web + WebXR (React, Vite, Three.js). Quest tarayıcıdan açılıyor; Unity kullanılmıyor.
2. **Çalışıyor:** Bursa'dan 10 eser (tarihçe, galeri, kaynak, kredi, 3 soruluk test, temsilî maket ve VR girişi), vazo, kılıç ve çini atölyeleri, Yolculuk akışı.
3. **Test:** `test:e2e` üç yapılandırmada 15/15, `test:hizli` ve tarayıcı testleri geçti. Gerçek Quest'te yalnız Ulu Camii denendi.
4. **Yarım:** Yönetim ekranı yalnız `localStorage`'a kaydediyor; giriş ve görsel yükleme yok. Onay ve öğretmen ekranları mokap.
5. **Eksik:** PWA veya masaüstü paketi, şehir/ilçe/kategori filtresi ve harita, yüksek kontrast, yazı boyutu, sesli anlatım, axe raporu, README.
6. **Doğrulanmadı:** Tarihsel metinler kitapla karşılaştırılmadı; 10 eser `dogrulanmis` işaretli olduğu için bu bir risk. Canlı sitenin güncel olduğunu yayın sonrası kontrol et.
7. **Sıradaki iş:** Sırayla, ayrı dal ve commit: PWA (`arayuz/...`), Supabase ile kalıcı kayıt + giriş + görsel yükleme (`yonetim/...`), onay akışı (`yonetim/...`).
8. **Hazır:** `.env` içinde Supabase adresi ve anahtarı var; yeni bağımlılık olarak yalnız Supabase istemcisi onaylı.
9. **Kurallar:** `master`'a birleştirme ve push için sor. Node 24 kullan (`nvm use 24`). Tarih veya kaynak uydurma.
10. **Devamı:** Plan `docs/kokkod_kazanma_plani.md`, roller `docs/gorev_dagilimi.md`, dosya haritası `docs/HARITA.md`. Bu belgenin geri kalanını yalnız gerekirse oku.


## Güncel durum

### Güncel durum (6 Kasım 2026) (PLAN)

Çalışma dalı `ulu-camii-grafik`; ayrıntı `DEVAM.md` 0. bölümde. Bu dosyanın altındaki "Yeni bilgisayarda başla" bölümü 4 Kasım tarihlidir.

- [x] VR Eserler sekmesi: harita, şehir, yapı seçimi (`/vr`)
- [x] Bursa'da 10 yapıya web maketi ve VR girişi (masaüstü testi geçti)
- [x] Ulu Camii: gerçekçi halı ve mermer, ışık, minber, kürsü ve mahfile çıkma
- [x] Dokunmatik ekranda yürüme kolu
- [ ] Gerçek Quest denemesi: yeni 9 yapı, kart okunabilirliği, kare hızı
- [ ] `ulu-camii-grafik` dalını `master`'a birleştirme kararı
- [ ] `kokxr.vercel.app` güncellemesi (hesap erişimi gerekiyor)
- [ ] Sponsor fotoğraf izninin yazılı teyidi
- [ ] Tarihsel metinlerin kitapla karşılaştırılması

### 0. En güncel durum (6 Kasım 2026, gece) (DEVAM)

Çalışma dalı **`ulu-camii-grafik`** (`master` üzerine). Aşağıdaki işler `master`'a birleştirilmedi; `kokxr.vercel.app` da bunları içermiyor.

```bash
git fetch origin && git switch ulu-camii-grafik
npm ci
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort   # http://127.0.0.1:5173/vr
```
Node 22+ gerekir (`.nvmrc` 24 ister). Okul makinesindeki sistem Node'u v12'dir, projeyi çalıştırmaz.

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

---

## Plan, kurallar ve kararlar

### Hedef (PLAN)

**Hedef:** 7–8 Kasım finalinde tek akışta canlı demo. Önce sunumda gösterilecek mokap; backend sonra.

**Öne çıkaran özellik:** VR. Ana sahne: Quest 3'te maketi tut, incele, içeri gir, vazoyu onar.

**Branch:** `vaat-mokap`. `master`'a birleştirmeden önce kullanıcıya sor.

### Değişmez kurallar (PLAN)

- Mokap ekranında görünür etiket: `Demo · örnek veri` (`src/components/DemoEtiketi.tsx`). Maketlerde `Temsilî maket` etiketi kalır.
- Tarih, kaynak, kişi, kurum veya onay uydurulmaz. Kaynaklı bilgi mevcut `kaynakId` ile gösterilir.
- Yeni bağımlılık yok. Mevcut testler bozulmaz.
- Paralel ajanlar kendi çalışma kopyasında ve kendi dosyalarında çalışır. Rotaları ve birleştirmeyi ana oturum yapar.

### Ürün yapısı (PLAN)

`/yolculuk` tek giriş noktasıdır: **Eline al → Zamanda yürü → Onar → Sına.** Ana sayfanın ana çağrısı buraya gider.

| Kullanıcı | Nereden girer |
|---|---|
| Öğrenci, jüri | Yolculuk; serbest keşif için Keşfet ve atölyeler |
| Öğretmen | Üst menü: Öğretmen paneli |
| Yönetici | Üst menü: Yönetim |
| Vizyon, kütüphane, onay akışı | Alt menü |

Erişilebilirlik ölçütleri: adımlar kilitsiz, geri tuşu çalışır, adım değişince odak başlığa geçer, durum yalnız renkle anlatılmaz, hedefler en az 44 px, 320 px'te yatay taşma yok.

### Yapılacaklar (PLAN)

#### 1. Temel

- [x] Quest kod incelemesi ve 4 bulgunun düzeltilmesi
- [x] Tek kumanda düzeltmesi
- [x] Belge düzeni, `CLAUDE.md`, hızlı test komutları, Node 24
- [x] `/yolculuk` iskeleti, ana sayfa ve menü bağlantısı, `tests/yolculuk.mjs`
- [x] `maket-ic` ve `maket-xr-dugme` VR düzeltmeleriyle geçti
- [x] Simüle VR denemesi: 78 denetimden 76'sı geçti

#### 2. VR (öncelikli)

Doğrulama: simüle Quest betiği, sonra gerçek cihaz.

- [ ] Kart açıkken menüye ulaşma ve baş dönükken durak yönü (`wip/vr-tutma`, doğrulanıp birleştirilecek)
- [ ] Masaüstünde ve VR'da 10 kat büyütme
- [ ] VR'da kumandayla maketi tutma
- [ ] VR'da vazo onarımı: parçayı tut, yerine oturt (yarım: `wip/vr-vazo`)
- [ ] Vazonun altında örnek yazı (yarım: `wip/vr-vazo`)
- [ ] VR menüsünde zaman katmanı
- [ ] Yolculuktan VR'a giriş iki tıktan fazla sürmesin

#### 3. Sunum ekranları

- [x] Zaman katmanı, kaynaklı dönem verisiyle; yolculuk 2. adımında. Yapının eski görünümünü canlandırmaz, sunumda da böyle anlatılır. Kaynaklar envanter PDF'iyle karşılaştırılmadı.
- [x] Öğretmen paneli: `/ogretmen`. Yalnız kazanılan rozetler gerçek, sınıf verisi örnek.
- [x] Vizyon ekranı: `/vizyon`. Vaatler `Hedef:`, gerçek durum `Bugün:` olarak yazılı.
- [x] Kütüphane `/kutuphane`, onay akışı `/onay`
- [ ] AR: yalnız bu listenin geri kalanı bitince

#### 4. Doğrulama ve teslim

- [ ] Tüm testler: `npm run test:hizli`, `npm run test:tarayici`, `node scripts/test-tarayici.mjs yolculuk`, `npm run test:e2e`
- [ ] `tests/ui.mjs` odak denetimi bir kez kaldı, yeniden çalıştırınca geçti; aralıklı sorun mu izle
- [ ] Bağımsız inceleme: etiket eksiği, uydurma içerik, kırık akış, erişilebilirlik
- [ ] 1280 ve 360 px ekran görüntüleriyle son bakış
- [ ] Yedek demo videosu (masaüstü), `dist/` kopyaları, `DEVAM.md` güncellemesi

#### 5. Cuma 6 Kasım: gerçek cihaz (kullanıcıyla)

Hazırlık: Quest 3, veri kablosu, geliştirici modu önceden açık, denemenin yapılacağı bilgisayarda `adb`.

`adb devices` çıktısında `no permissions` görünürse USB izni gerekir (`sudo` ister, kullanıcı çalıştırır):

```bash
echo 'SUBSYSTEM=="usb", ATTR{idVendor}=="2833", MODE="0666"' | sudo tee /etc/udev/rules.d/51-quest.rules
sudo udevadm control --reload-rules && sudo udevadm trigger
```

- [ ] `adb reverse tcp:4173 tcp:4173`, Quest Browser'da `http://localhost:4173/yolculuk`
- [ ] VR'a giriş, FPS ölçümü (hedef 72); altındaysa `DEVIR-QUEST.md`'deki düşürme sırası
- [ ] `docs/superpowers/plans/2026-11-04-ulu-camii-quest.md` Görev 6 kontrol listesi
- [ ] Tutma, vazo onarımı, etiket okunurluğu, tek kumanda, konfor
- [ ] Gerçek cihazda VR yedek videosu
- [ ] Yedek olarak 360° turu Quest Browser'da dene
- [ ] Çalışmayan özelliği demodan çıkar, vizyon olarak anlat

#### 6. Final 7–8 Kasım

- [ ] `DEVAM.md`'deki final günü kontrol listesi
- [ ] Sunumda çalışan özellik ile vizyon ayrımı
- [ ] VR'ın hangi sorunu çözdüğü net anlatılıyor (şartname 5.2.2)

### Kes listesi (PLAN)

Süre yetmezse şu sırayla çıkar: AR → onay akışı → kütüphane → VR menüsünde zaman katmanı. VR'da tutma ve vazo onarımı en son kesilir.

### Vaat durumu (PLAN)

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

### Süre tahmini (PLAN)

Kalan kod işi paralel ajanlarla 5–9 saat, cihaz denemesi 1–2 saat. Tahmindir, ölçüm değildir.

### Açık kararlar (PLAN)

- Tarama verisi veya gerçek küratör onayı varsa ürüne eklenir; yoksa vizyon olarak kalır.
- Sonraki push'lar: kullanıcı izniyle.
- Herkese açık yayın yok; fotoğraf izni netleşmedi. Takım başka cihazdan görecekse şifre korumalı yayın kullanıcıya sorulur.
- Zaman katmanı tarihleri (Ulu Camii 4, Muradiye 6) envanter PDF'iyle karşılaştırılmalı.

### 6. Kalan işler (öncelik sırasıyla) (DEVAM)

**4 Kasım akşamı kod dondurma — sonrasında yalnız demoyu bozan hata düzeltilir.**

1. **Arayüz yenilemesi tamamlandı** — kullanıcının son isteğine göre açık, sade ve modern tasarım uygulandı.
   Önceki koyu-altın tema önerisinin yerini bu tasarım aldı. Ayrıntılar: `docs/ui-tasarim.md`.
2. **PWA** — telefona/masaüstüne kurulabilir uygulama (manifest + service worker; fotoğraflar önbelleğe). Şartnamedeki
   "mobil veya masaüstü uygulaması" maddesini güçlendirir. 360° tur yine internet ister.
3. **Yedek demo videosu tamamlandı** — `node scripts/demo_video.mjs <cikti.webm>` ile yeniden çekilir (önce `npm run build` ve 4173'te `npm run preview`). Arayüz değişirse finalden önce tekrar çekin; video git dışındadır.
4. Küçük: yönetim listesindeki erişilebilir adda fazla boşluk ("Düzenle : …") — `src/pages/Yonetim.tsx` `sr-only` span.
5. İsteğe bağlı: Muradiye için de maket; Ulu Camii minberi/şadırvanı için "elde çevrilebilir" küçük nesne maketi.

#### Final günü kontrol listesi
- [ ] `npm run build` alınmış `dist/` ve yedek video **iki dizüstünde ve USB'de**
- [ ] Demo Chrome/Firefox'ta, **Brave değil**; 360° tur için internet bağlantısı denendi
- [ ] Demo öncesi tarayıcı `localStorage` temiz (Yönetim → "Tüm üst katmanı sıfırla") ya da hazır demo durumu
- [ ] Sunumda "çalışan prototip" ile "vizyon (VR, zaman katmanı…)" ayrı slaytlarda
- [ ] Her ekip üyesi mimariyi ve veri modelini 1 dakikada anlatabiliyor (şartname 5.1.2)

**Önerilen 3 dakikalık demo akışı:** `docs/arsiv/test-raporu-2.md` sonunda.

---

### 7. Açık konular (kullanıcı/ekip tarafında) (DEVAM)

- **Arşiv fotoğraflarının kullanım izni** — sponsordan (Vakıf Katılım) yazılı teyit.
- **Envanter kitabının tam adı** — kaynak satırlarında şimdilik "Vakıf Eserleri Envanteri – Bursa" yazıyor.
- **360TR** — resmî embed kodu (ücretsiz hesapla: https://www.360tr.com/tr/hesabim/embed/yeni?tour=359) ve/veya bilgilendirme e-postası.
  Şu an herkese açık `https://www.360tr.com/embed/bursa-ulu-camii` adresi kullanılıyor.
- Organizasyona: web tabanlı (PWA) uygulamanın "mobil/masaüstü uygulaması" sayılıp sayılmadığı.

---

## Kurulum ve çalıştırma

### Yeni bilgisayarda başla (PLAN)

> Yazıldı: 4 Kasım 2026, kullanıcı bilgisayar değiştirdiği için çalışma durduruldu. Çalışan ajan ve sunucu yok.
> **Yeni oturumdaki ajana:** `vaat-mokap` branch'inde bu dosyadan devam et, Türkçe konuş. İlk iş aşağıdaki "Kaldığı yer"dir.

Gerekenler: Git, Node 24+ (`.nvmrc`), Google Chrome. Eski bilgisayarda Node ve `adb` kullanıcı klasörüne kurulmuştu, yeni bilgisayara taşınmadı. `adb` yalnız Quest denemesi için gerekir.

```bash
git clone git@github.com:selamisimsek/kokxr.git   # zaten varsa: git fetch
cd kokxr
git switch vaat-mokap
npm ci
npm run test:hizli
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort   # http://127.0.0.1:5173/yolculuk
```

#### Kaldığı yer

| Branch | İçerik | Durum |
|---|---|---|
| `vaat-mokap` | Yolculuk, zaman katmanı, sunum ekranları, simülasyon betiği | Temiz, ana çalışma branch'i |
| `wip/vr-tutma` | `vaat-mokap` + menü-kart düzeltmesi + durak baş yönü düzeltmesi | Her ikisi birleştirilmedi. Yalnız `test:hizli` geçti; menü-kart düzeltmesinin simülasyon sonucu bu oturumda doğrulanmadı |
| `wip/vr-vazo` | `vaat-mokap` + `vazoXr.ts` (536 satır), `VR'da onar` düğmesi, alt yazı başlangıcı | Yarım. Ajan rapor veremeden durdu; hangi akışın bittiği bilinmiyor. Simülasyonda ve `tests/vazo.mjs` ile denenmedi |

Sıra:

1. `wip/vr-tutma`'yı `tests/xr-sim` ile doğrula, `npm run test:tarayici` geçince `vaat-mokap`'a birleştir.
2. Aynı işin kalanını yap: 10 kat büyütme, VR'da maketi tutma, VR menüsünde zaman katmanı.
3. `wip/vr-vazo`'yu oku; önce neyin bittiğini belirle, sonra simülasyonda tamamla ve birleştir.
4. Aşağıdaki "Doğrulama ve teslim", ardından cuma cihaz denemesi.

#### Simüle Quest (`tests/xr-sim/`)

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
- Simülasyon ajanı son raporunu veremeden durduruldu; sonuçlar `son-sonuc.json` dosyasından okundu.

### 1. Proje bir bakışta (DEVAM)

**3 Kasım ek not — kullanıcının düzelttiği kapsam:** İstenen deneyim, aynı vazoyu hem 3B olarak
çevirip incelemek hem de kırık parçalarını birleştirerek restore etmekti. Ulu Camii maketi bu isteğin
yerine geçmez. Bu nedenle `/atolye/vazo` adresine **Vazo atölyesi** eklendi; ana sayfadan ve üst
menüden açılır. Vazo açıkça temsili olarak etiketlidir, tarihî eser iddiası yoktur.
**Son kullanıcı düzeltmesi:** Düğmelerle 90° döndürme/yuva seçme akışı kaldırıldı. Vazo Blender 4.5.3'te
kalınlıklı altı bağımsız seramik parça olarak üretildi. Modelin kendisi veya üzerindeki numara fareyle
tutulup sahnede sürüklenir; doğru yere yakın bırakılınca otomatik hizalanır ve oturur. Dokunma,
yanlış bırakınca geri dönme, ilerleme, yeniden başlatma, Escape ve klavye alternatifi desteklenir.
Kaynak `assets/vazo/vazo.blend`, uygulamadaki model `public/modeller/vazo.glb`, yeniden üretim
betiği `scripts/vazo_uret.py`. Tasarım/etkileşim ve doğrulama ayrıntıları `docs/vazo-modeli.md` içinde.
**Güncel görünüm:** İlk açılışta ayrı kesintisiz gövdeyle izsiz vazo gösterilir. Parçalanıp tamamen
birleştirilince onarım izleri belirir ve inceleme modunda korunur. Genel vazo silueti durur;
seçili parçanın tam konumunu veren halka/yazı ve parçaya özel siluet vurgusu kaldırılmıştır.
Mevcut cami maketi ve çini bulmacası korunmuştur. İlgili kod: `src/pages/VazoAtolyesi.tsx`,
`src/pages/vazo.css`, `src/components/maket/vazoSahnesi.ts`.
Kontrol: `node tests/vazo.mjs` (kurulu Google Chrome, çalışan geliştirme sunucusu;
varsayılan `http://127.0.0.1:5173`, `TEST_URL` ile değiştirilebilir).

**Arayüz yenilemesi:** Kullanıcının sade ve modern arayüz isteği doğrultusunda kırık beyaz,
çam yeşili ve bronz palet; fotoğraf ağırlıklı ana sayfa; aktif menü; eser bölüm bağlantıları;
ortak form, galeri ve atölye stilleri uygulandı. Araştırma kaynakları, renk oranları ve test
komutları `docs/ui-tasarim.md` içinde. `node tests/ui.mjs` dört ekran genişliğini kontrol eder.

**Kılıç atölyesi (`/atolye/kilic`):** Topkapı Env. 1/90 kılıcının temsilî modeliyle külçeden kılıca sekiz aşama, sonra test alanı. Kaynaklar ve temsilî sınırlar `docs/kilic-atolyesi.md`; tarihsel metinler yalnız `src/data/kilic.ts`. Yeniden üretim: `blender -b --python scripts/kilic_doku.py`, sonra `scripts/kilic_uret.py` (dokular git dışı). Hedef hasarı `src/components/kilic/hedefler.ts`, hareket `animasyon.ts`. Test: `TEST_GPU=1 node tests/kilic.mjs`, `node tests/kilic-mantik.mjs`. Video: `node scripts/kilic_video.mjs <dosya.webm>`.

**Ulu Camii maketi (yeniden yapıldı):** `src/components/maket/ulucami*.ts`, kod ile üretilir. Dış: taş cephe, kaburgalı kurşun kubbeler, sekizgen kasnaklar, on bir sıra mukarnaslı taç kapı, iki farklı minare, avlu köşkleri. İç: `İçeri gir` ile klavyeyle yürünür (`W A S D`, ok tuşları, `Shift`; çarpışmalı), yapıya yaklaşınca `maket.icBilgiler` kartı açılır. Levha ve paye yazıları arşiv fotoğraflarının kırpımıdır (`scripts/levha_kirp.py`, Pillow gerekir; çıktı `public/gorseller/ulu-camii/maket/`), hangi yüzde durdukları temsilîdir. Kapı ekseni, mahfil, kürsü, kapalı güney pencereleri Kültür Portalı metnindendir (`kp-ulu`). Görüntü işleme (AO, parlama) yavaş cihazda kendiliğinden kapanır, yüksek kaliteyi zorlamak için `?kalite=yuksek`. Test: `node tests/maket-ic.mjs`.

**Fotoğraf revizyonu:** Palet %90 mevcut + %10 sıcak ton karışımıyla hafif sıcaklaştırıldı.
Galeri eser sayfasında ilk sıraya alındı; fotoğraflar kırpılmadan sığıyor, keşif işaretleri fotoğrafla
hizalı kalıyor. Oklar, küçük resimler, klavye, mobil kaydırma ve %100–300 büyütme/sığdırma eklendi.
Gezinti yönleri fotoğrafın dışına taşındı, bütünü gösteren fotoğraf modu eklendi.
`node tests/galeri.mjs`: iki eserin 10'ar fotoğrafı, masaüstü ve mobilde doğrulandı.

**KökXR** — "Dokunamadığın tarihe dokun." KÖK&KOD Hackathon'u (Vakıf Katılım + 42 Türkiye) için,
Bursa'daki vakıf eserlerini keşfettiren bir **web uygulaması** (React + TypeScript + Vite).

**Eserler:** Bursa Ulu Camii · II. Murad (Muradiye) Külliyesi

| Özellik | Nerede | Durum |
|---|---|---|
| Ana sayfa, eser seçimi, rozetler | `src/pages/AnaSayfa.tsx` | ✅ |
| **Vazo atölyesi** — Blender modeli; fare/dokunmayla sahnede parçaları tut, sürükle, birleştir; WebXR ile Quest'te (simülasyonda sınandı) | `src/pages/VazoAtolyesi.tsx`, `maket/vazoSahnesi.ts`, `maket/vazoXr.ts` | ✅ |
| Galeri + fotoğraf üzerinde keşif noktaları | `src/components/Galeri.tsx` | ✅ |
| Tarihçe, kaynaklar, 3 soruluk test | `src/pages/EserSayfasi.tsx`, `Test.tsx` | ✅ |
| **Eseri eline al** — Ulu Camii temsili 3B maketi (çevir, yakınlaştır, Parçala/Birleştir) | `src/components/EseriEleAl.tsx`, `maket/` | ✅ |
| **360° tur** — 360TR'nin resmî embed oynatıcısı (iframe, yalnız Ulu Camii) | `src/components/Tur360.tsx` | ✅ (internet gerekir) |
| **Derinlikli sanal gezinti** — fotoğraf durakları + yapay zekâ derinlik haritası (2.5B) | `src/components/SanalGezinti.tsx`, `gezinti/` | ✅ |
| **Restorasyon görevi** — Muradiye çini panosu bulmacası | `src/components/Restorasyon.tsx` | ✅ |
| **Yönetim ekranı** — içerik ekle/düzenle, JSON dışa/içe aktar (şartname 5.1.1) | `src/pages/Yonetim.tsx`, `EserFormu.tsx` | ✅ |
| Uçtan uca test (15 adım) | `tests/uctan-uca.mjs` | ✅ 15/15 |

---

### 2. Projeyi yeni bilgisayara taşıma (DEVAM)

Repo GitHub'da (**private**): `git@github.com:selamisimsek/kokxr.git` · dal: `master`

Yeni bilgisayarda:
```bash
git clone git@github.com:selamisimsek/kokxr.git      # SSH anahtarı o bilgisayarda da GitHub'a eklenmeli
# ya da: git clone https://github.com/selamisimsek/kokxr.git   (şifre yerine Personal Access Token)
cd kokxr
```
İki bilgisayar arasında: çalışmaya başlamadan `git pull`, bitirince `git add -A && git commit -m "…" && git push`.
Repo **private kalmalı** (arşiv fotoğraflarının kullanım izni netleşmedi).

#### Taşınmayanlar (git dışında, gerekirse ayrıca kopyala)
| Klasör | Boyut | Gerekli mi? |
|---|---|---|
| `proje bilgileri/` — şartname, envanter PDF'leri, ham fotoğraf arşivi | 7,6 GB | Küçük belgeler (şartname, sunum, mockup PNG) Drive'dan; fotoğraf arşivi paylaşılan "Vakıf Eserleri Envanteri – Bursa Fotoğraf Arşivi" Drive klasöründen. Yalnızca **yeni içerik/fotoğraf** eklenecekse gerekir; uygulamanın fotoğrafları zaten `public/` içinde ve git'te. |
| `_eski/` | küçük | Hayır (eski, boş deneme dosyaları) |
| `node_modules/` | — | Hayır, `npm install` ile kurulur |

---

### 3. Kurulum ve çalıştırma (DEVAM)

Gereken: **Node.js 24+** (eski bilgisayarda v24.22.1), npm, git.

```bash
npm install                                   # bağımlılıklar
npm run dev                                   # geliştirme: http://localhost:5173
npm run build && npm run preview -- --port 4173   # üretim sürümü: http://localhost:4173
```

#### Uçtan uca test
```bash
npx playwright install chromium firefox       # yalnız ilk seferde (~300 MB tarayıcı indirir)
npm run build && npm run preview -- --port 4173   # ayrı bir terminalde açık kalsın
npm run test:e2e                              # Chromium 1280 + 360 px ve Firefox 1280 px, 15'er adım
```
Ekran görüntüleri `test-sonuclari/` klasörüne yazılır (git dışı). Beklenen: her yapılandırmada `15/15`.

**Not:** Brave tarayıcıda 360° tur Shields yüzünden açılmayabilir — demo için Chrome/Firefox kullanın.

---

## Mimari ve veri modeli

### 4. Mimari ve veri modeli (DEVAM)

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
- **Lisansı belirsiz görseli yayımlama.** Arşiv fotoğraflarının kullanım izni sponsordan teyit edilmedi → repo **private** kalmalı.
- Fotoğraf → yapı eşleştirmesi tahminle değil, envanter PDF'inde hangi bölümde kullanıldığına bakılarak yapıldı.

---

### 5. Üç ajanla çalışma düzeni (DEVAM)

| Ajan | Komut | Rol |
|---|---|---|
| Claude Code | `claude` | Lider: plan, içerik/veri, kod incelemesi, **commit** |
| Codex CLI | `codex` | Uygulama kodu (`docs/arsiv/next-task.md`'deki görevi uygular) |
| Antigravity | `agy` | Tarayıcıda test, rapor yazar (`docs/arsiv/test-raporu*.md`) |

Akış: Claude `docs/arsiv/next-task.md` yazar → Codex uygular → Claude inceler + commit → test (Antigravity veya `npm run test:e2e`).
Aynı dosyaya iki ajan aynı anda dokunmaz.

#### Bilinen tuzaklar
- **Codex'i arka planda çalıştırırken** stdin kapatılmalı, yoksa "Reading additional input from stdin…" diye takılır:
  ```bash
  codex exec --sandbox workspace-write -c sandbox_workspace_write.network_access=true -C . "<görev>" < /dev/null
  ```
- Codex sandbox'ı `.git`'i salt okunur yapar → **Codex commit atamaz**, commit'i Claude (veya siz) atar.
- `agy -p` (komut satırı modu) izin soramaz; komut çalıştırması gereken testlerde `--dangerously-skip-permissions` gerekir
  (kullanıcı onayıyla). Bu bilgisayarda `--mode auto` desteklenmiyordu.
- `pkill -f "codex exec"` Claude'un kendi kabuğunu da öldürür; `pgrep -f "codex exe[c] --sandbox"` ile PID bulun.

---

### 8. Önemli dosyalar (DEVAM)

| Dosya | İçerik |
|---|---|
| `AGENTS.md` | Tüm ajanlar için proje kuralları |
| `docs/plan.md` | Web MVP planı, şartname eşlemesi |
| `docs/arsiv/durum.md` | Gün sonu durum notu |
| `docs/arsiv/next-task.md` | Codex'e verilen son görev (Görev 4 — tamamlandı) |
| `docs/arsiv/test-raporu.md`, `docs/arsiv/test-raporu-2.md` | Antigravity raporu ve son uçtan uca test |
| `docs/arsiv/sohbet-ozeti.md` | Projenin başlangıç bağlamı (ekip, eski Unity planı, kaynaklar) |
| `proje bilgileri/KÖK&KOD Hackathon _ Yarışma Şartnamesi_TR.pdf` | Şartname (git dışında) |

### Veri modeli (docs/plan)

```ts
type Dogrulama = "dogrulanmis" | "temsili";

interface Kaynak { id: string; metin: string; sayfa?: string; }

interface Gorsel {
  dosya: string;          // public/gorseller/<eserId>/...
  alt: string;            // ekran okuyucu metni
  aciklama?: string;
  kaynakId: string;       // fotoğraf arşivi kaynağı
}

interface BilgiNoktasi {
  id: string;
  gorsel: string;         // hangi görselin üzerinde
  x: number; y: number;   // yüzde (0–100)
  baslik: string;
  metin: string;
  kaynakId: string;
}

interface Soru {
  soru: string;
  secenekler: string[];
  dogru: number;          // secenekler dizisindeki sıra
  aciklama: string;       // cevaptan sonra gösterilir
  kaynakId: string;
}

interface Eser {
  id: string;             // "ulu-camii", "muradiye-kulliyesi"
  ad: string;
  sehir: string;
  ilce: string;
  donem: string;
  vakif: string;
  ozet: string;
  tarihce: string;
  dogrulama: Dogrulama;
  kapakGorsel: string;
  gorseller: Gorsel[];
  bilgiNoktalari: BilgiNoktasi[];
  test: Soru[];           // tam 3 soru
  kaynaklar: Kaynak[];
}
```

**Kural:** Her metin bir `kaynakId`'ye bağlıdır. Kaynak metinleri yalnızca
`proje bilgileri/` altındaki Vakıf Eserleri Envanteri PDF'lerinden alınır.

### Görseller (docs/plan)

- Arşiv `proje bilgileri/` altında, git dışında kalır.
- Eser başına 8–12 fotoğraf seçilir, 1600 px genişliğe küçültülür,
  `public/gorseller/<eserId>/` altına konur.
- Kullanım izni netleşmeden repo herkese açık yapılmaz, demo herkese açık yayınlanmaz.

## Quest

### (giriş) (DEVIR-QUEST)

#### KökXR — Meta Quest çalışması devir notu

> **Eski not.** Güncel durum ve sıradaki işler `PLAN.md` dosyasındadır; burayı yalnız VR teknik ayrıntıları ve yük ölçümleri için kullan. "Sıradaki işler" ve test durumu bölümleri artık geçerli değil.

> Yazıldı: 4 Kasım 2026 akşamı. Kullanıcı bilgisayar değiştirdiği için çalışma burada durduruldu.
> **Yeni oturumdaki yapay zekâ ajanına:** Önce bu dosyayı, sonra `AGENTS.md`, `DEVAM.md` ve
> `docs/superpowers/plans/2026-11-04-ulu-camii-quest.md` dosyalarını oku. Ardından "Sıradaki işler" bölümünden devam et.
> Kullanıcıyla Türkçe konuş.

### Yeni bilgisayarda başlangıç (DEVIR-QUEST)

Gerekenler: Git, Node.js, npm, Google Chrome. `DEVAM.md` Node 24+ istiyor; aşağıdaki sonuçlar v22.23.3 ile alındı.

```bash
git clone https://github.com/selamisimsek/kokxr.git   # depo private; erişim gerekir
cd kokxr
git switch ulu-camii-quest
npm install
git restore package-lock.json   # npm sürümü lock dosyasını değiştirirse; bağımlılık değişikliği yok
claude "DEVIR-QUEST.md dosyasını oku ve Sıradaki işler bölümünden devam et"
```

Uygulamayı açmak için:

```bash
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
# http://127.0.0.1:5173/eser/ulu-camii
```

Chrome'a **Immersive Web Emulator** eklentisini yeniden kurmak gerekir (eski bilgisayarda kuruluydu).

### Ne yapılıyor (DEVIR-QUEST)

Kullanıcı Ulu Camii'yi Meta Quest'e uyarlamak istedi ve yeni branch açılmasını söyledi. Daha önce projede VR görevi yoktu; VR "yapılmayacak / vizyon" olarak kayıtlıydı (`docs/plan.md:44`). Bu çalışma o kararı bu branch'te bilinçli olarak değiştiriyor.

Deneyim: Quest Browser'da `VR'da aç` → masa üstünde maket (çevir, büyüt, parçala) → `İçeri gir` → gerçek ölçekte yürü → yapıya yaklaşınca kaynaklı bilgi kartı → çık.

Yöntem: Mevcut Three.js sahnesine WebXR. Unity yok, yeni bağımlılık yok. Kullanıcı "daha uygulanabilir bir şey bulursan onu da yap" dedi; şu ana kadar WebXR'dan daha uygulanabilir bir yol bulunmadı.

### Kullanıcı kararları ve açık sorular (DEVIR-QUEST)

Kullanıcının söyledikleri:
- Ulu Camii uyarlansın, yeni branch açılsın.
- Önce plan yapılsın, sonra işi rollere ayrılmış küçük ajanlar aynı anda yapsın; işi tamamen AI yapacak.
- Commit ve push atılabilir.

Kullanıcıdan **henüz cevap gelmeyenler**:
- Elde Quest var mı, hangi model? (Plan Quest 2 veya üstü varsayıyor.)
- Plandaki "Varsayımlar" bölümü açıkça onaylanmadı; kullanıcı "yapsınlar" diyerek devam ettirdi.
- Emülatör denemesinin sonucu. Eklentiyi kurdu, adres verildi, sonuç yazmadan bilgisayar değiştirdi.
- VR gösterimi şartnamede veya jüri beklentisinde zorunlu mu? Şartname (`proje bilgileri/`) bu bilgisayarda yoktu, kontrol edilemedi.
- Bu branch ve `ulu-camii-maket` `master`'a alınacak mı? `master`'a dokunulmadı. `DEVAM.md`'ye göre kod dondurma 4 Kasım akşamı, final 7–8 Kasım.
- Paylaşılan bağlantılarla ne yapılacağı. Açılmadı; bu plan yeni içerik gerektirmiyor:
  - Envanter yayınları: https://www.vakifkatilim.com.tr/tr/hakkimizda/medya-merkezi/yayinlarimiz
  - Fotoğraf arşivi: https://drive.google.com/drive/folders/1U-C6TeECHhlx5C15G_rhgx5f_-iJbXlM

### Git durumu (DEVIR-QUEST)

- Branch: `ulu-camii-quest`, `origin/ulu-camii-maket` (`57722ed`) üzerinde. O commit `master`'da olmayan yeni maketi (iç mekân, yürüme) içerir.
- `9f70588` plan, `90fbd33` saf modüller. Sonraki commit bu not ve yarım kalan bağlama kodudur (**WIP**).
- Yerelde kalan `calisma` branch'i boştur, `master` ile aynıdır ve push edilmedi. Önemi yok.

### Dosyalar ve durumları (DEVIR-QUEST)

| Dosya | İçerik | Durum |
|---|---|---|
| `src/components/maket/yurumeCarpisma.ts` | Saf çarpışma | Tamam, testli |
| `src/components/maket/xrHareket.ts` | Ölü bölge, yürüme, dönüş, rig, kumanda girdisi | Tamam, testli |
| `src/components/maket/xrMetin.ts` | Menü öğeleri, satır kırma, isabet | Tamam, testli |
| `src/components/maket/xrPanel.ts` | Menü ve bilgi kartı (`CanvasTexture`) | Tamam; ekran görüntüsüyle bakıldı |
| `src/components/maket/xrOturum.ts` | Oturum, rig, kumanda, ışın, görünüm geçişi | Yazıldı; yalnız sahte `renderer.xr` ile denendi, o betik repoda değil |
| `src/components/maket/maketSahnesi.ts` | XR bağlantısı, `icDurumu`, `bakisKonumu` | **Doğrulanmadı**, ajan rapor veremeden durduruldu |
| `src/components/EseriEleAl.tsx` | `VR'da aç`, destek denetimi, hata mesajı | **Doğrulanmadı** |
| `src/components/maket/ulucamiIc.ts` | `ZEMIN_Y` eklendi | Tip denetiminden geçti |
| `tests/maket-xr-dugme.mjs` | Sahte `navigator.xr` ile düğme testi | **Sonucu bilinmiyor** |

### Test durumu (eldeki gerçek sonuçlar) (DEVIR-QUEST)

Son hâlde çalıştırılıp geçenler:
- `npx tsc --noEmit -p tsconfig.app.json`: hata yok
- `npx vite build`: başarılı (geçici klasöre)
- `node tests/maket-xr-mantik.mjs`: geçti
- `node tests/maket-xr-metin.mjs`: geçti, en uzun kart 10 satır (sınır 13)

**Sonucu bilinmeyenler:**
- `tests/maket-xr-dugme.mjs` ve değişiklik sonrası `tests/maket-ic.mjs`. Ajan bunları çalıştırıyordu, durduruldu ve rapor gelmedi. Yeniden çalıştırılmalı.
- VR'ın kendisi: emülatörde veya Quest'te çalıştığını henüz kimse doğrulamadı.

VR değişikliklerinden **önceki** kodda (`57722ed`) `tests/maket-ic.mjs` geçti (yaklaşık 7 dakika sürüyor). Yani o testte yeni kırmızı çıkarsa neden büyük ihtimalle bu branch'teki değişikliktir.

### Yük ölçümü (`57722ed`, yazılımsal çizim) (DEVIR-QUEST)

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

### Kod okurken bilinmesi gerekenler (DEVIR-QUEST)

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

### Bilinen sorunlar (DEVIR-QUEST)

1. **Tek kumanda:** İç mekânda aynı çubuk hem yana kaydırıyor hem döndürüyor (`kumandaGirdisi` + `xrOturum`). Düzeltilmedi. Öneri: tek kumandada sağa/sola itiş yalnız dönüş olsun.
2. **Görev 3 kısmı:** Maketi çevirme ve büyütme yazıldı, emülatörde görülmedi.
3. **Doğrulanamayanlar (cihaz gerekir):** rig ölçeğinin görsel doğruluğu, `axes[2/3]` ve `buttons[5]` eşlemesi, `local-floor` ile `ZEMIN_Y` uyumu, panel okunurluğu, stereo konfor, 72 FPS.

### Sıradaki işler (DEVIR-QUEST)

1. **Doğrula:** `npm run build`, `npm run preview -- --port 4173 --strictPort`, ardından `node tests/maket-xr-dugme.mjs` ve `node tests/maket-ic.mjs`. Hata varsa düzelt.
2. **Kullanıcıya sor:** Quest modeli var mı ve emülatörde ne gördü?
3. **Emülatörde kullanıcıyla dene:** VR'a giriş, sağ çubuk, menü, `İçeri gir`, sol çubuk, bilgi kartı, çıkış. Sıra: plan Görev 2 Adım 6, Görev 3 Adım 4, Görev 4 Adım 4, Görev 5 Adım 5.
4. **Tek kumanda sorununu düzelt.**
5. **Gerçek cihaz (plan Görev 6):** Quest'te geliştirici modu, USB, `adb`. `adb reverse tcp:4173 tcp:4173`, sonra Quest Browser'da `http://localhost:4173/eser/ulu-camii`. FPS ölç; 72 altındaysa plandaki düşürme sırası.
6. **Düşük maliyetli yedek:** Mevcut 360TR turunu Quest Browser'da dene (kod gerekmez, internet gerekir, henüz denenmedi). Performans yetmezse serbest yürümeyi kapatıp masa üstü maket + durak geçişiyle devam et.
7. **Bitirirken:** `DEVAM.md`'ye kısa paragraf ekle. `master`'a birleştirmeyi kullanıcıya sormadan yapma.

Kullanıcıya verilen süre tahmini: kalan kod ve birleştirme 20–40 dk, cihaz denemesi ve FPS ayarı 1–2 saat. Tahmindir, ölçüm değildir.

### Kurallar (DEVIR-QUEST)

- `AGENTS.md`: Arayüz Türkçe. Tarihsel bilgi uydurma. Verisi olmayan 3B/VR'ı varmış gibi gösterme. Görev kapsamı dışına çıkma, her aşamada test et.
- VR'da `Temsilî maket · Gerçek bir 3B tarama değildir` etiketi görünür kalmalı.
- Repo private kalmalı; arşiv fotoğraflarının izni netleşmedi, herkese açık yayın yok.
- Yeni bağımlılık ekleme. Commit veya push yalnız kullanıcı izniyle; bu çalışma için izin verildi.

### Eski bilgisayarda kalanlar (DEVIR-QUEST)

Git'e girmedi, gerekmez:
- `.claude/worktrees/agent-a7b935c7767014bf5`: ölçüm ajanının geçici kopyası ve ham kayıtları (`test-sonuclari/g0-*`, `maket-ic-*.png`). Sonuçlar bu dosyaya işlendi. Silmek için depo kökünde: `git worktree remove --force .claude/worktrees/agent-a7b935c7767014bf5 && git branch -D worktree-agent-a7b935c7767014bf5`
- Ajanların geçici deneme betikleri ve panel ekran görüntüleri oturumun geçici klasöründeydi.

## Tarihçe

### (giriş) (DEVAM)

#### KökXR — Başka bilgisayarda devam rehberi

> Son güncelleme: 6 Kasım 2026 · **Final: 7–8 Kasım 2026**
> Bu dosya, projeye yeni bir bilgisayarda (ve yeni bir Claude / Codex / Antigravity oturumunda) kaldığı yerden
> devam etmek için gereken her şeyi içerir. Yeni oturumda yapay zekâ ajanına ilk olarak bu dosyayı okutun.

---

### 0.1. 5 Kasım notu (eski) (DEVAM)

```bash
git fetch origin
git switch cini-atolyesi      # bu not ve çini atölyesi bu dalda; master'da henüz yok
npm install
npm run build && npm run preview -- --port 4173
```
Yeni yapay zekâ oturumuna: "DEVAM.md'yi oku, 0. bölümden devam et" de.

#### Dallar
| Dal | İçinde ne var | Durum |
|---|---|---|
| `master` | Site, kılıç, vazo (masaüstü), Ulu Camii maketi ve VR'ı | GitHub'da, `3286759` |
| `cini-atolyesi` | `master` + çini atölyesi (web ve VR) + bu not | GitHub'da, **master'a girmedi** |
| `vr-panel-gecis` | `wip/vr-tutma` + Ulu Camii VR'da kart/menü düzeni ve karartmalı geçiş | GitHub'da, **master'a girmedi** |
| `wip/vr-vazo` | `vaat-mokap` + vazo VR onarımı (yarım) | GitHub'da, yalnız `test:hizli` geçti |
| `vazo-quest` | Bu dalların birleşimi + bitmiş vazo VR | Yerelde, simülasyonda çalıştı, gerçek Quest'te denenmedi |
| `vaat-mokap` | Zaman katmanı, yolculuk, öğretmen paneli, vizyon ekranları | GitHub'da, master'a girmedi; birleştirmeden önce kullanıcıya sor |

#### Bekleyen kararlar (kullanıcıya sor)
1. `cini-atolyesi`, `vr-panel-gecis`, `vaat-mokap` master'a birleştirilecek mi, hangi sırayla? Birleştirmeden önce çakışmalara ve testlere bak.
2. Sunum (`KokXR_Sunum_v2.pptx`, 3 slayt) güncellenecek mi? Şartname 5.4 başlıkları eksikti.

#### Yapılacaklar
- [ ] **Gerçek Quest denemesi (cuma, kullanıcıyla):** Ulu Camii, vazo ve çini VR'ı şimdiye dek yalnız simülasyonda (IWER) çalıştı. Performans ve kumanda hissi bilinmiyor.
- [ ] Videolar `git` dışında, eski bilgisayarın masaüstünde: `kokxr-vr-simulasyon-3`, `kokxr-vazo-vr-simulasyon`, `kokxr-kilic-atolyesi-2`, `kokxr-cini-atolyesi-web`, `kokxr-cini-vr-simulasyon` (hepsi `.webm`). Kod değişirse yeniden çekilmeli.
- [ ] Çini: ses yok; sürükleme adımlarının klavye karşılığı yok, "Ustaya bırak" ile geçiliyor.

#### Çini atölyesi (`/atolye/cini`)
Kod `src/components/cini/`, metinler `src/data/cini.ts`, kaynaklar ve sınırlar `docs/cini-atolyesi.md`.
Testler: `node tests/cini-mantik.mjs` ve (4173 açıkken) `node tests/cini.mjs`.
Oksit eşleştirmesi ve çamur malzeme adları kaynakla doğrulanamadığı için bilerek oyuna alınmadı; kaynaksız eklemeyin.

#### Video kaydı: Playwright'ın kaydına güvenme
`recordVideo` ve CDP ekran yayını WebGL karesini yarım yakalayabiliyor: tek gözde kaybolan nesneler, dış çatının içeri "patlaması".
Bunlar sahnede değil, kayıttadır. Sabit sahnede çizim tamponu 240/240 aynıyken ekran yayını 200 karede 40 farklı görüntü verdi.
- **VR:** render sonrası `gl.finish()`, sonra `drawImage` ile 2B tuvale al, `toBlob` JPEG, 30 kare/sn dizip Playwright'ın ffmpeg'iyle (`~/.cache/ms-playwright/ffmpeg-*/ffmpeg-linux`) `libvpx-vp9 -deadline good -crf 20` kodla.
- **HTML arayüzlü sayfa:** rAF sonrası `gl.finish()` + CDP ekran yayını JPEG, tarayıcı `--use-angle=vulkan`. gl-egl'de kılıçta tek karelik tam siyah kareler çıktı, Vulkan'da çıkmadı (RTX 3070 Ti; başka bilgisayarda yeniden ölç).
- **Vulkan'da** yeni WebGL bağlamı açılışta bir kez düşüp geri gelebiliyor: `webglcontextlost`'ta hemen hata gösterme, 2B tuval dokularında `willReadFrequently: true` kullan.
- Teslimden önce kare panosuna kendin bak. Simülatör için `tests/xr-sim/` `vaat-mokap` dalındadır; kayıt betikleri geçiciydi ve repoda yok.
- `channel: 'chrome'` kullanan testler (`vazo`, `vazo-xr-dugme`, `ui`, `galeri`, `maket-ic`, `maket-xr-dugme`) Google Chrome ister.
- 4173 doluysa `npm run test:tarayici` başlamaz; `TEST_PORT=4178 npm run test:tarayici` ile boş port ver.

---

### (giriş) (PLAN)

#### KökXR plan ve durum

Tek plan dosyası. İşe buradan başla, iş bitince işaretle. Ayrıntı gerekince: `DEVIR-QUEST.md` (VR), `docs/sunum-vaatleri.md`, `docs/sartname.md`.

### (giriş) (docs/plan)

#### KökXR — Web MVP Planı

> Güncelleme: 2 Kasım 2026 · Final: 7–8 Kasım 2026 · Kod dondurma: 4 Kasım akşamı
> Eski Unity/VR planı (`proje bilgileri/developer.md`, `gelistirme-plani.md`) geçersizdir.

### Ürün (docs/plan)

"Dokunamadığın tarihe dokun." Bursa'daki vakıf eserlerini keşfetmeye yönelik,
telefona ve masaüstüne kurulabilen (PWA) bir web uygulaması.

**Eserler:** Bursa Ulu Camii · II. Murad (Muradiye) Külliyesi

**Teknoloji:** React + TypeScript + Vite. Backend yok; veriler JSON dosyalarında,
yönetim ekranındaki değişiklikler tarayıcıda (localStorage) saklanır ve JSON olarak
dışa aktarılabilir.

### Şartname eşlemesi (5.1.1) (docs/plan)

| Şart | Karşılayan özellik |
|---|---|
| Çalışan mobil/masaüstü uygulama | Duyarlı tasarım + PWA (kurulabilir, çevrimdışı) |
| Birden fazla vakıf eseri | İki eser, eser seçim ekranı |
| Tarihçe, görsel, kaynak | Eser sayfası: galeri, bilgi paneli, kaynak etiketi |
| İçerik ekleme/düzenleme | `/yonetim` ekranı: eser ekle, metin düzenle, JSON dışa/içe aktar |
| Yeni eser eklenebilir mimari | Her eser = `src/data/eserler/<id>.json` + görsel klasörü; kod değişmez |
| Uçtan uca demo | Ana sayfa → eser seç → keşfet → test → rozet |

### Kapsam (docs/plan)

#### MVP (mutlaka)
1. Ana sayfa (slogan, eser kartları)
2. Eser sayfası: fotoğraf galerisi (yakınlaştırma), bilgi paneli, kaynak etiketi
3. Fotoğraf üzerinde bilgi noktaları (külliye yapıları, Ulu Camii detayları)
4. Eser başına 3 soruluk test + tamamlanınca rozet
5. Yönetim ekranı (ekle/düzenle/dışa aktar)
6. Erişilebilirlik: alt metin, klavye ile kullanım, yüksek kontrast, yazı boyutu

#### İstenirse (MVP bittikten sonra)
- TR/EN dil seçimi (kaynak metinler iki dilli)
- Sesli anlatım (Web Speech API, `tr-TR`)
- Harita (OpenStreetMap)

#### Yapılmayacak
3D model, 360°, VR/AR, backend, kullanıcı girişi. Sunumda "vizyon" olarak anlatılır,
uygulamada var gibi gösterilmez.

### Ajanlar ve iş akışı (docs/plan)

| Ajan | Komut | Rol | Dokunduğu yer |
|---|---|---|---|
| Claude Code | `claude` | Lider: plan, veri/içerik, kod incelemesi | `docs/`, `src/data/` |
| Codex CLI | `codex` | Uygulama kodu, build | `src/` (data hariç), yapılandırma |
| Antigravity | `agy` | Tarayıcı testi, tasarım raporu | `docs/arsiv/test-raporu.md` |

1. Claude `docs/arsiv/next-task.md` dosyasına tek bir görev yazar.
2. Codex görevi uygular, `npm run build` ile doğrular, commit atar.
3. Antigravity uygulamayı tarayıcıda test eder, sonucu `docs/arsiv/test-raporu.md`'ye yazar.
4. Claude raporu ve kodu inceler, sıradaki görevi yazar.

Aynı anda iki ajan aynı dosyayı düzenlemez. Her görev sonunda commit.

### Takvim (docs/plan)

| Gün | Hedef |
|---|---|
| 2 Kas | Plan, veri modeli, iskelet (Görev 1), içerik çıkarımı başlar |
| 3 Kas | Eser sayfası, galeri, bilgi paneli, gerçek içerik ve görseller |
| 4 Kas | Bilgi noktaları, test + rozet, yönetim ekranı, PWA · **akşam kod dondurma** |
| 5 Kas | Antigravity testi, hata düzeltme, prova 1 |
| 6 Kas | Prova 2–3, yedek demo videosu, çevrimdışı çalışma kontrolü |
| 7–8 Kas | Final |

### Açık sorular (docs/plan)

- Web tabanlı (PWA) uygulama "mobil veya masaüstü uygulaması" olarak kabul ediliyor mu? → organizasyona sorulacak
- Arşiv fotoğraflarının demoda ve sunumda kullanım izni → sponsor kuruma teyit
