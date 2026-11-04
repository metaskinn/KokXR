# Vaat mokabı planı

**Amaç:** `docs/sunum-vaatleri.md`'deki her vaadi finalde tıklanarak gösterilebilir hâle getirmek. Var olan özellikler gerçek hâliyle kullanılır, eksikler etiketli mokapla tamamlanır.

**Öncelik (kullanıcı kararı):** Önce sunumda gösterilecek mokap; backend sonraya kalır. Takımı öne çıkaran özellik VR'dır, en çok emek ona gider. Ana sahne: Quest'te maketi tut, incele, içeri gir, vazoyu onar.

**Branch:** `vaat-mokap` (`ulu-camii-quest` üzerinden). `master`'a birleştirme kullanıcıya sorulur.

**Süre tahmini (ölçüm değildir):** Sırayla 9–13 saat, paralel ajanlarla 5–9 saat. Cuma günkü cihaz denemesi ve düzeltmeler için ayrıca 1–2 saat.

## Değişmez kurallar

- Mokap ekranlarında görünür etiket: `Demo · örnek veri`. Maketlerdeki `Temsilî maket` etiketi kalır.
- Tarih, kaynak, kişi, kurum veya onay uydurulmaz. Örnek içerik gerçek kayıt gibi yazılmaz; kaynaklı bilgi yalnız mevcut `kaynakId` ile gösterilir.
- Yeni bağımlılık eklenmez. Mevcut özelliklerin testleri bozulmaz.
- Ajanlar yalnız kendi dosyalarını değiştirir. `App.tsx`, ortak bileşenler ve `/demo` yalnız entegrasyon adımında değişir.

## Vaat eşlemesi

| Vaat | Finalde gösterilecek | Tür |
|---|---|---|
| Eseri çevir, parçala | Mevcut maket | Gerçek |
| 10 kat büyüt | Masaüstü ve VR sınırları 10 kata çıkar | Gerçek |
| Tut | Vazoda mevcut; VR'da kumandayla maketi tutma | Gerçek, cihazda doğrulanacak |
| Alt yüzdeki yazı | Temsilî vazonun altında örnek yazı | Mokap |
| Zaman katmanı | Slider; kaynaklı bilgi varsa onu, yoksa `Örnek senaryo` gösterir | Mokap |
| Restorasyon görevi | Çini bulmacası ve vazo atölyesi | Gerçek |
| Doğrulanmış bilgi | Mevcut kaynaklı kartlar + yönetimde örnek onay akışı | Gerçek + mokap |
| Öğretmen paneli | Test sonuçları + etiketli örnek sınıf verisi | Mokap |
| KökMobil, Dokunulabilir Müze | Senaryo tanıtım ekranı | Vizyon |
| Dijital Miras Kütüphanesi | Eser, model ve dönem listesi | Mokap |
| Tarama, dijital ikiz | Akışı anlatan ekran, `Tarama verisi yok` notuyla | Vizyon |
| Web | Mevcut uygulama | Gerçek |
| VR | Mevcut WebXR | Gerçek, cuma denenecek |
| AR | `immersive-ar` ile maket; desteklemeyen cihazda düğme çıkmaz | Gerçek, cihazda doğrulanacak |
| Tek senaryo demo | `/demo`: eseri incele → geçmişini gör → görevi tamamla | Gerçek + mokap |

## Fazlar

### Faz 0: Hazırlık (30–60 dk, ana oturum)

1. Simüle VR raporunu işle, inceleme düzeltmeleriyle birlikte testleri çalıştır.
2. Bugünkü işleri commit et, `vaat-mokap` branch'ini aç.
3. Ortak `DemoEtiketi` bileşenini ve boş rota iskeletini ekle.

### Faz 1: Paralel ajanlar (2,5–4,5 saat)

| Ajan | İş | Dosyalar | Süre |
|---|---|---|---|
| V1 (öncelikli) | 10 kat, VR'da kumandayla maketi tutma, VR menüsünde zaman katmanı | `src/components/maket/xr*`, `maketSahnesi.ts` | 2–3 sa |
| V2 (öncelikli) | VR'da vazo onarımı: parçayı tut, yerine oturt; vazonun altında örnek yazı | Yeni `src/components/maket/vazoXr.ts`, `vazoSahnesi.ts`, `VazoAtolyesi.tsx` | 2–3 sa |
| A | Masaüstü zaman katmanı | Yeni `src/components/ZamanKatmani.tsx` | 1–1,5 sa |
| B | Öğretmen paneli, vizyon ekranları, sonra kütüphane ve onay akışı | Yeni `src/pages/` dosyaları | 1,5–3 sa |

Her ajan kendi işini test eder. V1 ve V2, simüle Quest betiğiyle doğrular. Zaman katmanının verisini A çıkarır, V1 aynı veriyi kullanır. AR, bu dört iş bittikten sonra başlar.

### Faz 2: Entegrasyon (1 saat, ana oturum)

Rotalar, menü bağlantıları ve `/demo` akışı.

### Faz 3: Doğrulama ve teslim (1–2 saat)

1. `npm run build` ve tüm testler; 1280 ve 360 px ekran görüntüleri.
2. Bağımsız inceleme: etiket eksiği, uydurma içerik, kırık akış.
3. Yedek demo videosu, `dist/` ve `DEVAM.md` güncellemesi.

### Faz 4: Cuma, gerçek cihaz (1–2 saat, kullanıcıyla)

Quest 3 ve USB: VR, tutma, vazo onarımı, FPS, etiket okunurluğu. Çalışmayan özellik demodan çıkarılır, vizyon olarak anlatılır.

Cuma için ayrıca: gerçek cihazda VR'ın yedek videosu çekilir, canlı demo aksarsa o gösterilir.

## Kes listesi

Süre yetmezse şu sırayla çıkar: AR → onay akışı → kütüphane → VR menüsünde zaman katmanı. VR'da tutma ve vazo onarımı en son kesilir.
