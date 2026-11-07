# Erişilebilirlik raporu (7 Kasım 2026)

**Kapsam notu:** axe ve Lighthouse bu oturumda çalıştırılamadı (indirme izni verilmedi, yeni bağımlılık yasak). Yerine bağımlılıksız `tests/erisilebilirlik.mjs` denetimi yazıldı ve çalıştırıldı. Bu bir axe/Lighthouse raporunun yerini tutmaz; jüriye "axe ile ölçtük" denmemeli. Axe istenirse: `npx @axe-core/cli http://127.0.0.1:4173` (geçici, bağımlılık eklemeden).

## Ne denetlenir
`node scripts/test-tarayici.mjs erisilebilirlik` — 10 rota (`/`, `/harita`, `/yolculuk`, `/eser/ulu-camii`, `/eser/koza-han`, `/yonetim`, `/yonetim/yeni`, `/onay`, `/ogretmen`, `/vr`) × 3 mod (normal, yüksek kontrast, %150 yazı):
- `html lang`, her görselde `alt`, adı olan düğme/bağlantı, etiketli form alanı
- Başlık seviyesi atlamaması
- Metin kontrastı (WCAG 1.4.3: 4,5:1; büyük metin 3:1). Gradyan/görsel zeminli bölümler atlanır ve elle bakılır.
- Klavyeyle Tab sonrası odak göstergesi, %150 yazıda yatay taşma yok

## Sonuç
Son çalıştırma: **temiz**. Denetimin bulduğu gerçek hata: ana sayfadaki kılıç tanıtım kartı, CSS yükleme sırası yüzünden açık zeminde açık yazıyla görünüyordu (kontrast 1,07:1). `src/pages/kilic.css` seçicileri güçlendirilerek koyu zemin geri getirildi.

## Çalışan erişilebilirlik özellikleri
Atlama bağlantısı ("Ana içeriğe geç"), klavyeyle gezinme, 44 px hedefler (`tests/ui.mjs`), yazı boyutu A−/A+ (%100–150), yüksek kontrast düğmesi, tarihçe için "Sesli dinle" (tarayıcı sesi, Türkçe), alt metinler (görselli eserlerde zorunlu form alanı), `prefers-reduced-motion` desteği.

## Bilinen sınırlar
- Ekran okuyucu (VoiceOver/NVDA) ile elle tam tur yapılmadı.
- Renk körlüğü simülasyonu yapılmadı; palet yeşil/bronz, durum rozetleri metin de taşır.
- Sesli dinle, tarayıcıda Türkçe ses yoksa varsayılan sesle okur (cihaza bağlı).
- 3B/VR sahneleri ekran okuyucuya kapalı (canvas); metin karşılığı eser sayfalarında vardır.
- Altyazılı video yok (video içerik yok).
