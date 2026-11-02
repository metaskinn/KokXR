# Görev 3 — Derinlikli sanal gezinti

**Atanan:** Codex CLI
**Önce oku:** `AGENTS.md`, `docs/plan.md`, `src/types/eser.ts`, `src/data/eserler/*.json` (yeni `tur` alanı)

## Amaç

Kullanıcı eserin içinde "yürüyebilsin": fotoğraflardan oluşan duraklar arasında yön düğmeleriyle gezinsin;
her durakta fotoğraf, yapay zekâyla üretilmiş derinlik haritası sayesinde fare/dokunma/telefon eğimiyle
hafif 3B (2.5B parallax) hareket etsin.

**Dürüstlük kuralı:** Bu 360° çekim veya 3B tarama değildir. `tur.aciklama` metni gezinti ekranında
her zaman görünür olmalı. "360°", "VR", "3B model" gibi ifadeler kullanma.

## Veri (hazır, değiştirme)

Her eser JSON'unda:

```ts
interface Baglanti { hedef: string; etiket: string }        // hedef = durak id
interface Durak {
  id: string; baslik: string;
  gorsel: string;      // /gorseller/<eser>/<ad>.jpg
  derinlik: string;    // /derinlik/<eser>/<ad>.png  (gri tonlama: beyaz = yakın, siyah = uzak; ~800 px)
  metin: string; kaynakId?: string;
  baglantilar: Baglanti[];
}
interface Tur { aciklama: string; baslangic: string; duraklar: Durak[] }
// Eser'e eklenen alan:  tur?: Tur
```

Bu tipleri `src/types/eser.ts` dosyasına ekle (`tur` isteğe bağlı olsun; turu olmayan eser de çalışmalı).

## Yapılacaklar

1. **Bağımlılık:** `three` ekle (ve `@types/three` geliştirme bağımlılığı). Başka bağımlılık ekleme.
   Three.js **dinamik import** ile yalnızca gezinti açıldığında yüklensin; ana paket büyümesin.
2. **`src/components/SanalGezinti.tsx`** (+ gerekirse `src/components/gezinti/` altında yardımcılar):
   - WebGL sahnesi: fotoğrafın en-boy oranında, yüksek alt bölümlü bir düzlem (`PlaneGeometry`, ~200×200;
     mobilde ~120×120). Vertex shader'da derinlik dokusuna göre z ekseninde öteleme
     (`z = (derinlik - 0.5) * guc`). Fragment shader fotoğrafı çizer. Kenarlarda bozulma görünmesin
     (kamerayı biraz yakın tut, kenarları kırp).
   - **Hareket:** fare konumu / dokunarak sürükleme / `deviceorientation` (izin gerekiyorsa iOS için düğmeyle iste)
     kamerayı hafifçe döndürür ve kaydırır (parallax). Etkileşim yokken çok yavaş, kendiliğinden salınım.
     Hareketler yumuşatılmış (lerp) olmalı.
   - **Duraklar arası geçiş:** bir bağlantıya tıklayınca kamera ~600 ms ileri "yürür" (dolly) ve yeni durağa
     yumuşak geçiş (crossfade) yapılır. Bağlı durakların görselleri önceden yüklenir.
   - **Arayüz katmanı (HTML, canvas'ın üstünde):**
     - Durak başlığı, `metin`, `kaynakId` varsa mevcut `KaynakSatiri` bileşeniyle kaynak satırı
     - Her `baglanti` için büyük, yön oklu düğme (`etiket` metniyle)
     - Durak listesi / mini harita: tüm duraklar, şu anki vurgulu, ziyaret edilenler işaretli; tıklayınca o durağa git
     - `tur.aciklama` etiketi her zaman görünür
     - "Tam ekran" düğmesi (Fullscreen API; desteklenmiyorsa gizle)
   - **Yedek mod:** WebGL yoksa, bağlam kaybolursa veya `prefers-reduced-motion: reduce` ise düz fotoğraf gösterilir;
     gezinti (düğmeler, liste, metin) aynen çalışır. Yedek modda da `alt` metni olsun (durak başlığından türet).
   - Bileşen kaldırılınca renderer, doku ve geometrileri `dispose` et; olay dinleyicilerini temizle.
3. **Eser sayfası:** `tur` varsa galeri bölümünden **önce** "Sanal gezinti" bölümü. Başlangıçta canvas yüklenmeden
   önce başlangıç durağının fotoğrafı ve "Gezintiye başla" düğmesi göster (Three.js ancak tıklanınca yüklensin).
4. **Ana sayfa:** `tur` olan eser kartında küçük "Sanal gezinti" etiketi.
5. **Erişilebilirlik:** Tüm gezinti klavyeyle yapılabilir (Tab ile düğmeler; ← → tuşlarıyla görüşü hafifçe kaydırmak isteğe bağlı),
   durak değişince yeni başlık `aria-live="polite"` ile duyurulur, odak görünür, düğmeler en az 44 px.
   Canvas `aria-hidden`, bilgi HTML katmanında.
6. Mevcut galeri, keşif noktaları, test ve rozet davranışını bozma.

## Yapılmayacaklar

`src/data/`, `public/gorseller/`, `public/derinlik/`, `_eski/`, `kaynaklar/`, `proje bilgileri/` klasörlerine dokunma.
Yeni içerik veya tarihsel metin yazma. Yönetim ekranı, PWA bu görevde yok.

## Bitti sayılması için

- `npm run build` hatasız; ana JS paketi Three.js içermiyor (ayrı chunk)
- Tarayıcıda (1280 px ve 360 px) iki eserde gezintiye başla → tüm duraklar arasında bağlantılarla gezilebiliyor,
  parallax hareketi görülüyor, geçiş animasyonu çalışıyor, yedek mod (reduced-motion) çalışıyor, konsolda hata yok
- Ekran görüntülerini incele: kenarlarda yırtılma/esneme göze batmamalı; batıyorsa `guc` değerini düşür
- `.git` salt okunur olabilir; commit'i Claude atar
- Bu dosyanın sonuna "Sonuç" bölümü ekle

## Ek: Antigravity test raporundaki hatalar (`docs/test-raporu.md`) — bu görevde düzelt

1. **[Kritik] Test klavyeyle çözülemiyor:** Radyo düğmesinde ok tuşu seçimi anında kilitliyor. Seçim serbest olsun,
   cevap ayrı bir "Cevabı kontrol et" düğmesiyle onaylanınca kilitlensin.
2. **[Orta] Fotoğraftaki numaraya tıklayınca bilgi görünmüyor:** Bilgi kartını büyük fotoğrafın hemen altında göster
   (liste aşağıda kalabilir); ya da açıldıktan sonra (effect içinde) kaydır.
3. **[Orta] Odak:** İlk yüklemede `<main>`'e odaklanma; yalnızca rota değişiminde. `main:focus, h2:focus { outline: none }`
   kuralını kaldır, programatik odakta görünür bir odak stili olsun.
4. **[Düşük] favicon 404:** `public/favicon.svg` (basit, metinsiz bir kubbe/kemer simgesi) ekle ve `index.html`'e bağla.
5. Tasarım: Keşif listesindeki tekrarlanan `<h3>` başlığını kaldır; yanlış cevap kutusu farklı (kiremit tonu) kenarlıkla gösterilsin;
   telefonda tam ekran galerideki önceki/sonraki düğmeleri aynı satırda olsun.
