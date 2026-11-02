# Görev 2 — Eser sayfası: galeri, bilgi paneli, bilgi noktaları, test ve rozet

**Atanan:** Codex CLI
**Önce oku:** `AGENTS.md`, `docs/plan.md`, `src/types/eser.ts`, `src/data/eserler/*.json`

## Kurallar

- `src/data/` ve `public/gorseller/` klasörlerine **dokunma**. Veriyi ve görselleri Claude yönetiyor; şu an `gorseller` dizileri ve bilgi noktalarının `gorsel` alanı boş olabilir, sonradan dolacak. Kod bu durumu düzgün karşılamalı.
- Arayüzde görünen tarihsel metinlerin tamamı JSON'dan gelir. Koda tarihsel bilgi yazma.
- `src/App.tsx` büyüdüğü için bileşenleri `src/components/` ve `src/pages/` altına böl.
- Yeni bağımlılık ekleme.

## Yapılacaklar

1. **Eser sayfası** (`/eser/:id`), sırasıyla:
   - Başlık, konum (şehir · ilçe), dönem, vakıf
   - Doğrulama etiketi: `dogrulanmis` → "Kaynaklı bilgi", `temsili` → "Temsili içerik"
   - Galeri, bilgi noktaları, tarihçe, test, kaynaklar bölümleri
2. **Galeri:** `gorseller` dizisindeki fotoğraflar. Büyük görsel + küçük resim şeridi; tıklayınca tam ekran görüntüleme
   (Esc ile kapanır, ok tuşlarıyla geçiş, odak tuzağı). Her görselde `alt` metni, altında `aciklama` varsa gösterilir.
   Dizi boşsa "Fotoğraflar hazırlanıyor." yaz.
3. **Bilgi noktaları:**
   - `gorsel` alanı dolu olan noktalar, o görselin üzerinde `x`/`y` yüzde konumunda numaralı düğme olarak gösterilir.
     Düğmeye tıklayınca (veya Enter) yanında/altında başlık, metin ve kaynak açılır.
   - `gorsel` alanı boş olan noktalar, görselin altında numaralı bir liste (akordeon) olarak gösterilir.
   - Bölüm başlığı: "Keşif noktaları".
4. **Kaynak gösterimi:** Her bilgi noktasının ve test açıklamasının altında
   "Kaynak: {kaynak.metin}, s. {kaynak.sayfa}" satırı. `kaynakId`'ye göre `kaynaklar` dizisinden bulunur.
   Sayfanın sonunda "Kaynaklar" bölümünde tüm kaynaklar listelenir.
5. **Test** ("Bilgini sına"):
   - Sorular tek tek gösterilir. Seçenekler radyo düğmesi/düğme; seçince doğru/yanlış bildirimi
     (yalnızca renk değil, metin ve simge de) + `aciklama` + kaynak.
   - Sonunda "3 sorudan X doğru". Tekrar dene düğmesi.
   - 3/3 yapılınca o eserin **rozeti** kazanılır ve `localStorage`'a kaydedilir (`kokxr-rozetler` anahtarı, eser id dizisi).
     `localStorage` erişimi try/catch içinde olmalı.
6. **Ana sayfa:** Rozeti kazanılan eserin kartında "Rozet kazanıldı" etiketi. Kartlarda `kapakGorsel` doluysa görsel gösterilir.
7. **Erişilebilirlik:** Tüm etkileşimler klavyeyle yapılabilir, görünür odak, test sonucu `aria-live` ile duyurulur,
   kontrast en az WCAG AA, en az 16 px yazı. 360 px genişlikte yatay kaydırma olmamalı.

## Yapılmayacaklar

Yönetim ekranı, PWA, dil seçimi, sesli anlatım, harita, 3D/VR. Bunlar sonraki görevler.

## Bitti sayılması için

- `npm run build` hatasız
- Tarayıcıda iki eser için: tarihçe, keşif noktaları (liste hâlinde), test ve kaynaklar görünüyor; 3/3 yapınca rozet ana sayfada görünüyor
- `.git` salt okunur olabilir; commit atamazsan sorun değil, Claude commit'leyecek
- Bu dosyanın sonuna "Sonuç" bölümü ekle
