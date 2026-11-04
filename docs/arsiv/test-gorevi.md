# Test Görevi 2 — Uçtan uca son test (Antigravity)

**Atanan:** Antigravity (`agy`)
**Önce oku:** `AGENTS.md`, `docs/plan.md`, `docs/durum.md`, önceki rapor `docs/test-raporu.md`

Uygulama http://localhost:4173 adresinde çalışıyor (üretim build'i). Sunucuyu başlatma/durdurma.

## Kurallar

- **Kod dosyalarını değiştirme.** Yalnızca `docs/test-raporu-2.md` yaz; ekran görüntüleri `docs/test-ekranlari/son-test/` altına.
- Paket kurma, git komutu çalıştırma.
- Gerçek tarayıcıda test et; tarayıcıda yapılmamış bir kontrolü "geçti" diye yazma.
- 3B/WebGL bölümleri yazılımsal GPU ile yavaş olabilir; yüklenmesini bekle.

## Senaryo (1280 px masaüstü ve 360 px telefon)

1. **Önceki hatalar:** `docs/test-raporu.md`'deki 4 hata düzeldi mi? (klavyeyle test, keşif kartı görünürlüğü, odak, favicon)
2. **Eseri eline al (Ulu Camii):** "maketini eline al" → maket yükleniyor; sürükleyerek çevirme, tekerlekle yakınlaştırma;
   "Parçala" çatıyı kaldırıyor ve içerideki payeler görünüyor, "Birleştir" geri indiriyor; "Kendi kendine dönsün",
   "Görünümü sıfırla"; maket alanına odaklanıp ok tuşları ve +/− çalışıyor; "temsili maket" etiketi ve kaynaklı bilgi listesi görünüyor.
3. **360° tur (Ulu Camii):** "360° turu başlat" → 360TR oynatıcısı açılıyor, sürükleyerek bakılabiliyor, sahne değişiyor;
   altında kaynak bağlantısı ve "açılmıyorsa yeni sekmede aç" bağlantısı var.
4. **Sanal gezinti (iki eser):** başlat → durak bağlantılarıyla en az 4 durak gez; derinlik/parallax hareketi; durak listesi;
   "temsilidir, 360° değildir" etiketi görünür.
5. **Restorasyon görevi (Muradiye):** "Panoyu parçala ve onar" → parça seç, yuvaya koy, döndür; ipucu aç/kapat;
   paneli tamamla → "Pano onarıldı" ve kaynaklı bilgi; "Baştan başla". Klavyeyle de en az bir parçayı yerleştir ve döndür (R).
6. **Yönetim:** üst çubuktan "Yönetim" → Ulu Camii özetini değiştir → ana sayfada görünür → varsayılana döndür;
   yeni bir test eseri ekle (temsili) → ana sayfada ve kendi sayfasında görünür → sil. Kaynak olmadan "Kaynaklı bilgi" seçilemiyor.
7. **Genel:** galeri, test, rozetler (test rozeti + restorasyon rozeti), bulunamayan sayfa, yatay taşma yok, konsolda
   uygulamaya ait hata yok (360TR iframe'inin kendi hataları hariç; bunları ayrıca not et), sayfalar arası geçişte bozulma yok.
8. **Demo akışı:** Jüriye 3 dakikalık bir gösterim yapılacağını düşün: ana sayfa → Ulu Camii (maket parçala, 360° tur) →
   Muradiye (gezinti, restorasyon) → yönetim. Akışta takılan, yavaş kalan veya kafa karıştıran yerleri yaz.

## Rapor biçimi (`docs/test-raporu-2.md`)

```markdown
# Test Raporu 2 — <tarih saat>
Tarayıcı: … (sürüm, GPU/WebGL durumu)

| # | Adım | Masaüstü | Telefon | Not |
|---|------|----------|---------|-----|

## Hatalar (önem sırasıyla)
1. **[Kritik/Orta/Düşük]** Ne oldu — nasıl tekrarlanır — beklenen — ilgili dosya (biliyorsan)

## Demo akışı notları
## Tasarım önerileri (en fazla 5)
```
