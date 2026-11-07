# KökXR plan ve durum

Tek plan dosyası. İşe buradan başla, iş bitince işaretle. Ayrıntı gerekince: `DEVIR-QUEST.md` (VR), `docs/sunum-vaatleri.md`, `docs/sartname.md`.

## Güncel durum (7 Kasım 2026)

Çalışma dalı `ulucami-gercekci`; önceki durum `DEVAM.md` 0. bölümde. Bu dosyanın altındaki "Yeni bilgisayarda başla" bölümü 4 Kasım tarihlidir.

- [x] VR Eserler sekmesi: harita, şehir, yapı seçimi (`/vr`)
- [x] Bursa'da 10 yapıya web maketi ve VR girişi (masaüstü testi geçti)
- [x] Ulu Camii: gerçekçi halı ve mermer, ışık, minber, kürsü ve mahfile çıkma
- [x] Dokunmatik ekranda yürüme kolu
- [x] Ulu Camii: fotoğraf referanslı köşk, avizeler, halı/ışık ve çakışmayan duvar levhaları (mutlak konum ve ölçüler temsilî)
- [x] Durak geçişini kesince güvenli hedefte yürüme, dairesel kaide sınırları, eyvan bakışları ve sahne kaynaklarının temizlenmesi
- [x] Kılıç VR: su haznesine nişan zorunluluğu ve el başına süreli darbe hedefi; saf hesap ve oturum testleri geçti
- [x] Ulu Camii'nin mahfil/kürsü kaynak sayfaları ve kütüphane olayı kitapla karşılaştırıldı; Kâbe kartındaki çelişkili yön ifadesi çıkarıldı
- [ ] Gerçek Quest denemesi: yeni 9 yapı, kart okunabilirliği, kare hızı
- [ ] `ulucami-gercekci` dalını `master`'a birleştirme kararı
- [ ] `kokxr.vercel.app` güncellemesi (hesap erişimi gerekiyor)
- [ ] Sponsor fotoğraf izninin yazılı teyidi
- [ ] Tarihsel metinlerin kitapla karşılaştırılması

## Yeni bilgisayarda başla

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

### Kaldığı yer

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
- Simülasyon ajanı son raporunu veremeden durduruldu; sonuçlar `son-sonuc.json` dosyasından okundu.

## Hedef

**Hedef:** 7–8 Kasım finalinde tek akışta canlı demo. Önce sunumda gösterilecek mokap; backend sonra.

**Öne çıkaran özellik:** VR. Ana sahne: Quest 3'te maketi tut, incele, içeri gir, vazoyu onar.

**Branch:** `vaat-mokap`. `master`'a birleştirmeden önce kullanıcıya sor.

## Değişmez kurallar

- Mokap ekranında görünür etiket: `Demo · örnek veri` (`src/components/DemoEtiketi.tsx`). Maketlerde `Temsilî maket` etiketi kalır.
- Tarih, kaynak, kişi, kurum veya onay uydurulmaz. Kaynaklı bilgi mevcut `kaynakId` ile gösterilir.
- Yeni bağımlılık yok. Mevcut testler bozulmaz.
- Paralel ajanlar kendi çalışma kopyasında ve kendi dosyalarında çalışır. Rotaları ve birleştirmeyi ana oturum yapar.

## Ürün yapısı

`/yolculuk` tek giriş noktasıdır: **Eline al → Zamanda yürü → Onar → Sına.** Ana sayfanın ana çağrısı buraya gider.

| Kullanıcı | Nereden girer |
|---|---|
| Öğrenci, jüri | Yolculuk; serbest keşif için Keşfet ve atölyeler |
| Öğretmen | Üst menü: Öğretmen paneli |
| Yönetici | Üst menü: Yönetim |
| Vizyon, kütüphane, onay akışı | Alt menü |

Erişilebilirlik ölçütleri: adımlar kilitsiz, geri tuşu çalışır, adım değişince odak başlığa geçer, durum yalnız renkle anlatılmaz, hedefler en az 44 px, 320 px'te yatay taşma yok.

## Yapılacaklar

### 1. Temel

- [x] Quest kod incelemesi ve 4 bulgunun düzeltilmesi
- [x] Tek kumanda düzeltmesi
- [x] Belge düzeni, `CLAUDE.md`, hızlı test komutları, Node 24
- [x] `/yolculuk` iskeleti, ana sayfa ve menü bağlantısı, `tests/yolculuk.mjs`
- [x] `maket-ic` ve `maket-xr-dugme` VR düzeltmeleriyle geçti
- [x] Simüle VR denemesi: 78 denetimden 76'sı geçti

### 2. VR (öncelikli)

Doğrulama: simüle Quest betiği, sonra gerçek cihaz.

- [ ] Kart açıkken menüye ulaşma ve baş dönükken durak yönü (`wip/vr-tutma`, doğrulanıp birleştirilecek)
- [ ] Masaüstünde ve VR'da 10 kat büyütme
- [ ] VR'da kumandayla maketi tutma
- [ ] VR'da vazo onarımı: parçayı tut, yerine oturt (yarım: `wip/vr-vazo`)
- [ ] Vazonun altında örnek yazı (yarım: `wip/vr-vazo`)
- [ ] VR menüsünde zaman katmanı
- [ ] Yolculuktan VR'a giriş iki tıktan fazla sürmesin

### 3. Sunum ekranları

- [x] Zaman katmanı, kaynaklı dönem verisiyle; yolculuk 2. adımında. Yapının eski görünümünü canlandırmaz, sunumda da böyle anlatılır. Kaynaklar envanter PDF'iyle karşılaştırılmadı.
- [x] Öğretmen paneli: `/ogretmen`. Yalnız kazanılan rozetler gerçek, sınıf verisi örnek.
- [x] Vizyon ekranı: `/vizyon`. Vaatler `Hedef:`, gerçek durum `Bugün:` olarak yazılı.
- [x] Kütüphane `/kutuphane`, onay akışı `/onay`
- [ ] AR: yalnız bu listenin geri kalanı bitince

### 4. Doğrulama ve teslim

- [ ] Tüm testler: `npm run test:hizli`, `npm run test:tarayici`, `node scripts/test-tarayici.mjs yolculuk`, `npm run test:e2e`
- [ ] `tests/ui.mjs` odak denetimi bir kez kaldı, yeniden çalıştırınca geçti; aralıklı sorun mu izle
- [ ] Bağımsız inceleme: etiket eksiği, uydurma içerik, kırık akış, erişilebilirlik
- [ ] 1280 ve 360 px ekran görüntüleriyle son bakış
- [ ] Yedek demo videosu (masaüstü), `dist/` kopyaları, `DEVAM.md` güncellemesi

### 5. Cuma 6 Kasım: gerçek cihaz (kullanıcıyla)

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

### 6. Final 7–8 Kasım

- [ ] `DEVAM.md`'deki final günü kontrol listesi
- [ ] Sunumda çalışan özellik ile vizyon ayrımı
- [ ] VR'ın hangi sorunu çözdüğü net anlatılıyor (şartname 5.2.2)

## Kes listesi

Süre yetmezse şu sırayla çıkar: AR → onay akışı → kütüphane → VR menüsünde zaman katmanı. VR'da tutma ve vazo onarımı en son kesilir.

## Vaat durumu

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

## Süre tahmini

Kalan kod işi paralel ajanlarla 5–9 saat, cihaz denemesi 1–2 saat. Tahmindir, ölçüm değildir.

## Açık kararlar

- Tarama verisi veya gerçek küratör onayı varsa ürüne eklenir; yoksa vizyon olarak kalır.
- Sonraki push'lar: kullanıcı izniyle.
- Herkese açık yayın yok; fotoğraf izni netleşmedi. Takım başka cihazdan görecekse şifre korumalı yayın kullanıcıya sorulur.
- Zaman katmanı tarihleri (Ulu Camii 4, Muradiye 6) envanter PDF'iyle karşılaştırılmalı.
