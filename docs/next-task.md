# Görev 4 — Yönetim ekranı (içerik ekleme ve düzenleme)

**Atanan:** Codex CLI
**Önce oku:** `AGENTS.md`, `docs/plan.md`, `src/types/eser.ts`, `src/data/index.ts`, `src/App.tsx`

Şartname 5.1.1: "İçerik ekleme ve mevcut içerikleri düzenleme imkânı bulunmalıdır. Sistem yeni vakıf eserlerinin
eklenmesine uygun şekilde kurgulanmalıdır."

## Mimari

- Varsayılan içerik `src/data/eserler/*.json` (değişmez). Yönetim ekranındaki değişiklikler `localStorage`'da
  (`kokxr-icerik` anahtarı) **üst katman** olarak saklanır: eser id'sine göre tam eser nesnesi.
  Uygulama açılışta JSON + üst katmanı birleştirir (üst katman kazanır). Yeni eserler yalnızca üst katmanda yaşar.
- `localStorage` erişimi try/catch içinde; bozuk veri gelirse yok sayılır ve uyarı gösterilir.
- Veriyi okuyan tek yer `src/data/index.ts` olsun; uygulama genelinde bir React context veya App state üzerinden dağıt,
  yönetimde yapılan değişiklik sayfa yenilemeden ana sayfaya ve eser sayfasına yansısın.

## Ekran: `/yonetim`

Üst çubukta "Yönetim" bağlantısı. Giriş/şifre yok; sayfanın üstünde "Demo yönetim ekranı: değişiklikler yalnızca bu
tarayıcıda saklanır" notu.

1. **Eser listesi:** tüm eserler (ad, ilçe, doğrulama durumu, "değiştirildi"/"yeni" etiketi). Düzenle, varsayılana döndür
   (yalnız JSON'da olanlar), sil (yalnız yeni eklenenler, onay ister).
2. **Eser formu** (`/yonetim/eser/:id` ve `/yonetim/yeni`):
   - Metin alanları: ad, şehir, ilçe, dönem, vakıf, özet, tarihçe; `id` yeni eserde addan otomatik (Türkçe karakterleri
     ASCII'ye çevirerek, tekilliği kontrol ederek) üretilir, sonra değişmez.
   - **Kaynaklar:** ekle/düzenle/sil (metin, sayfa).
   - **Test soruları:** tam 3 soru; her biri soru, 4 seçenek, doğru seçenek, açıklama, kaynak (kaynaklar listesinden seçim).
   - **Bilgi noktaları:** başlık, metin, kaynak; görsel seçimi ve x/y (0–100) sayı alanları.
   - **Görseller:** mevcut görsellerin alt metni ve açıklaması düzenlenebilir; yeni görsel URL ile eklenebilir
     (dosya yükleme yok). Kapak görseli seçimi.
   - `tur` ve `tur360` alanları formda gösterilmez, olduğu gibi korunur.
3. **Doğrulama kuralı (5.1.3):** "Kaynaklı bilgi" seçilebilmesi için en az bir kaynak, her test sorusu ve bilgi noktası
   için geçerli kaynak gerekli. Aksi halde kayıt "Temsili içerik" olarak kalır ve form bunu açıklar.
   Yeni eser varsayılan olarak "temsili".
4. **Form doğrulama:** zorunlu alanlar, hatalar alanın yanında metinle ve `aria-describedby` ile; kaydet düğmesi
   hata özetini gösterir ve ilk hatalı alana odaklanır.
5. **Dışa/içe aktar:** "JSON olarak indir" (tek eser, `src/data/eserler/` formatında — kalıcı yapmak için dosya repoya
   eklenebilir) ve "Tüm üst katmanı indir / yükle / sıfırla".

## Kurallar

- `src/data/eserler/`, `public/`, `_eski/`, `kaynaklar/`, `proje bilgileri/` klasörlerine dokunma.
- **`src/pages/EserSayfasi.tsx` ve `src/components/Restorasyon*` dosyalarına dokunma** — Claude aynı anda bunlar
  üzerinde çalışıyor. Eser sayfasının veriyi prop olarak alması zaten yeterli.
- Yeni bağımlılık ekleme. Arayüz Türkçe, klavyeyle kullanılabilir, 360 px'te taşmasız.

## Bitti sayılması için

- `npm run build` hatasız
- Tarayıcıda: Ulu Camii özetini değiştir → ana sayfada ve eser sayfasında yeni metin; varsayılana döndür → eski metin;
  yeni eser ekle (temsili) → ana sayfada görünür, sayfası açılır, testi çalışır; JSON indir; yenilemeden sonra
  değişiklikler duruyor; bozuk `localStorage` verisinde uygulama çökmez
- `.git` salt okunur olabilir; commit'i Claude atar. Bu dosyanın sonuna "Sonuç" bölümü ekle.
