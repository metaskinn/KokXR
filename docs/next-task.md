# Görev 1 — Proje iskeleti, ana sayfa ve eser seçimi

**Atanan:** Codex CLI
**Önce oku:** `AGENTS.md`, `docs/plan.md`

## Yapılacaklar

1. Klasörün köküne React + TypeScript + Vite projesi kur (`npm create vite@latest . -- --template react-ts`).
   Mevcut `AGENTS.md`, `docs/`, `.gitignore` dosyalarını silme veya değiştirme.
2. `react-router-dom` ekle. Rotalar:
   - `/` → Ana sayfa
   - `/eser/:id` → Eser sayfası (şimdilik yalnızca başlık, özet ve "Yakında: galeri, bilgi paneli, test" metni)
   - `*` → "Sayfa bulunamadı"
3. `src/types/eser.ts` içine `docs/plan.md`'deki veri modelini birebir yaz.
4. `src/data/eserler/ulu-camii.json` ve `src/data/eserler/muradiye-kulliyesi.json` oluştur.
   Yalnızca şu alanları doldur, diğerlerini boş dizi/boş metin bırak:
   - `id`, `ad`, `sehir: "Bursa"`, `ilce: "Osmangazi"`
   - `ozet: "İçerik hazırlanıyor."`, `dogrulama: "temsili"`
   **Tarihsel bilgi yazma.** İçeriği Claude ekleyecek.
5. `src/data/index.ts`: klasördeki tüm eser JSON'larını `import.meta.glob` ile yükleyip `Eser[]` döndüren bir fonksiyon.
   Yeni JSON eklenince kod değişmeden listede görünmeli.
6. Ana sayfa:
   - Başlık "KökXR", slogan "Dokunamadığın tarihe dokun."
   - Kısa açıklama: "Bursa'daki vakıf eserlerini keşfet."
   - Eser kartları (ad, ilçe, özet); karta tıklayınca `/eser/:id`
7. Tasarım: sade, duyarlı (telefon 360 px ve masaüstü), en az 16 px metin, yeterli kontrast,
   kartlar klavyeyle (Tab + Enter) açılabilmeli. CSS kütüphanesi ekleme; düz CSS yeterli.
8. Arayüzdeki tüm metinler Türkçe.

## Yapılmayacaklar

Galeri, test, yönetim ekranı, PWA, 3D/VR, backend. `proje bilgileri/` klasörüne dokunma,
oradan dosya kopyalama.

## Bitti sayılması için

- `npm run build` hatasız
- `npm run dev` ile ana sayfada iki eser kartı görünüyor, tıklayınca eser sayfası açılıyor
- Olmayan bir adres "Sayfa bulunamadı" gösteriyor
- Commit: `İskelet: ana sayfa ve eser seçimi`
- Bu dosyanın altına kısa bir "Sonuç" bölümü ekle (ne yapıldı, sorun var mı)

## Sonuç

- React + TypeScript + Vite iskeleti doğrudan proje kökünde kuruldu. Mevcut dosyaları korumak için yapılandırma dosyaları elle oluşturuldu; geçici proje klasörü kullanılmadı.
- Türkçe ana sayfa, iki eser kartı, eser sayfası taslağı ve bulunamayan sayfa rotası tamamlandı. Veri modeli ve JSON dosyalarını otomatik yükleyen `import.meta.glob` fonksiyonu eklendi; tarihsel içerik eklenmedi.
- `npm run build` hatasız geçti. `npm run dev` üzerinde Chromium ile 360 px ve 1280 px görünüm, iki eser kartı ve sayfaları, doğrudan eser adresleri, Tab + Enter, görünür odak ve bulunamayan adresler doğrulandı. Yatay taşma veya tarayıcı hatası görülmedi.
- `AGENTS.md`, `.gitignore`, `docs/plan.md`, `_eski/`, `kaynaklar/` ve `proje bilgileri/` değiştirilmedi. npm önbelleğinin yazma kısıtı `/tmp` altında önbellek kullanılarak aşıldı; uygulamada bilinen sorun yok.
- Commit denendi ancak ortamın `.git` dizini salt okunur olduğu için `.git/index.lock` oluşturulamadı. Değişiklikler çalışma klasöründe hazır; `İskelet: ana sayfa ve eser seçimi` commit'i bu ortamda oluşturulamadı.
