# KökXR plan ve durum

Tek plan dosyası. İşe buradan başla, iş bitince işaretle. Ayrıntı gerekince: `DEVIR-QUEST.md` (VR), `docs/sunum-vaatleri.md`, `docs/sartname.md`.

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
- [ ] Simüle VR raporunu işle

### 2. VR (öncelikli)

Simüle VR raporu gelince başlar. Doğrulama: simüle Quest betiği, sonra gerçek cihaz.

- [ ] Masaüstünde ve VR'da 10 kat büyütme
- [ ] VR'da kumandayla maketi tutma
- [ ] VR'da vazo onarımı: parçayı tut, yerine oturt
- [ ] Vazonun altında örnek yazı (`Demo` etiketli)
- [ ] VR menüsünde zaman katmanı
- [ ] Yolculuktan VR'a giriş iki tıktan fazla sürmesin

### 3. Sunum ekranları

- [x] Zaman katmanı, kaynaklı dönem verisiyle; yolculuk 2. adımında. Yapının eski görünümünü canlandırmaz, sunumda da böyle anlatılır. Kaynaklar envanter PDF'iyle karşılaştırılmadı.
- [ ] Öğretmen paneli (ajan çalışıyor) → menüye bağla
- [ ] Vizyon ekranı: KökMobil, Dokunulabilir Müze, Kütüphane, tarama akışı (ajan çalışıyor)
- [ ] Kütüphane ve onay akışı (ajan çalışıyor; süre yetmezse kesilir)
- [ ] AR: yalnız bu listenin geri kalanı bitince

### 4. Doğrulama ve teslim

- [ ] Tüm testler: `npm run test:hizli`, `npm run test:tarayici`, `node scripts/test-tarayici.mjs yolculuk`, `npm run test:e2e`
- [ ] Bağımsız inceleme: etiket eksiği, uydurma içerik, kırık akış, erişilebilirlik
- [ ] 1280 ve 360 px ekran görüntüleriyle son bakış
- [ ] Yedek demo videosu (masaüstü), `dist/` kopyaları, `DEVAM.md` güncellemesi

### 5. Cuma 6 Kasım: gerçek cihaz (kullanıcıyla)

Hazırlık: Quest 3, veri kablosu, geliştirici modu önceden açık, bilgisayarda `adb`.

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
