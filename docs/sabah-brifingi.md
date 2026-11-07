# Sabah brifingi

Durum: `master` yerel olarak güncel, **push edilmedi**. Ayrıntı: `docs/FINAL_PLANI.md` (günlük ve "Sabah sorulacaklar").

## Bitenler
- 14 Bursa eseri (4'ü kitap IDML'inden yeni; fotoğrafsız), yapı türü alanı ve süzgeçler.
- Harita (Leaflet/OSM) ve 3 rota; koordinat yok, eser işareti yok.
- Topluluk katkısı ve moderasyon, onay akışı, Supabase hazırlığı (tablolar kurulu değil).
- PWA (çevrimdışı), Android APK iskeleti (derlenmedi), yerel demo komutu.
- Erişilebilirlik denetimi (10 rota × 3 mod), lisans belgesi, doğrulama raporu (yalnız sayılar), sunum taslağı, 30 soruluk jüri belgesi, tembel yükleme (ana paket 563 → 518 kB).
- Master'da test sonuçları: hızlı test, maket/vazo XR düğmesi, maket-ic, pwa, galeri, ui, yolculuk, yönetim, harita, erişilebilirlik, hata avı (42 rota) ve uçtan uca (Chromium 1280/360, Firefox 1280) geçti.

## Bitmeyenler
- `tests/kilic.mjs` 1280'de başarısız (aşağıdaki not).
- G4 APK derlenmedi (JDK 21 yok). G7 Konya/Hatay verisi yok (PDF elle indirilmeli).
- Yeni eserlerde fotoğraf yok; harita koordinatı yok; axe/Lighthouse çalıştırılmadı; Quest'te gerçek cihaz denemesi yapılmadı; FPS ölçülmedi.

## 09:00'dan önce 5 adım
1. **Supabase:** `docs/supabase-kurulum.md` adımlarını uygula, ardından girişi, onayı ve görsel yüklemeyi gerçek sunucuda dene.
2. **Push kararı:** `master` yerelde; push edilsin mi? `kokxr.vercel.app` başka ekip üyesinin hesabında ve elle yüklenmiş, fotoğrafsız sürüm; push onu güncellemeyebilir. Vercel projesini `master`'a bağlamak gerekir.
3. **Telefonda dene:** sitedeki PWA'yı kur, uçak modunda aç. APK istenirse `brew install --cask temurin@21` sonra `docs/apk.md`.
4. **Quest'i şarj et** ve VR akışlarını (Ulu Camii, Muradiye, maket, vazo) gerçek cihazda dene.
5. **İzinler:** çini fotoğrafı, 360TR gömme, arşiv fotoğrafı kullanım izni (`docs/lisanslar.md`); sunumdan önce öğren.

## İlk 2 saatlik görev (herkes için, `docs/gorev_dagilimi.md`)
- **Kişi 1 – Veri:** Konya veya Hatay PDF'ini indir, 1 eser hazırla (`scripts/idml_cikar.py` değil, PDF için elle); yeni 4 eser için küçültülmüş fotoğraf ve `kredi` alanı ekle.
- **Kişi 2 – Yönetim:** Supabase kurulumundan sonra giriş, ekle, onayla akışını canlıda dene; anonim katkı için karar al (`FINAL_PLANI.md`).
- **Kişi 3 – Arayüz:** doğrulanmış koordinatla harita işaretlerini aç, axe/Lighthouse çalıştır, telefonda PWA/APK dene.
- **Kişi 4 – Sunum:** `docs/sunum-taslagi.md` ve `docs/juri-soru-cevap.md` ile 1 tam prova, Quest denemesi, `docs/demo-senaryosu.md` yedek planı.
