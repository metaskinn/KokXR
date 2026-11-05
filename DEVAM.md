# KökXR — Başka bilgisayarda devam rehberi

> Son güncelleme: 5 Kasım 2026 · **Final: 7–8 Kasım 2026**
> Bu dosya, projeye yeni bir bilgisayarda (ve yeni bir Claude / Codex / Antigravity oturumunda) kaldığı yerden
> devam etmek için gereken her şeyi içerir. Yeni oturumda yapay zekâ ajanına ilk olarak bu dosyayı okutun.

---

## 0. Buradan devam et (5 Kasım 2026)

```bash
git fetch origin
git switch cini-atolyesi      # bu not ve çini atölyesi bu dalda; master'da henüz yok
npm install
npm run build && npm run preview -- --port 4173
```
Yeni yapay zekâ oturumuna: "DEVAM.md'yi oku, 0. bölümden devam et" de.

### Dallar
| Dal | İçinde ne var | Durum |
|---|---|---|
| `master` | Site, kılıç, vazo (masaüstü), Ulu Camii maketi ve VR'ı | GitHub'da, `3286759` |
| `cini-atolyesi` | `master` + çini atölyesi (web ve VR) + bu not | GitHub'da, **master'a girmedi** |
| `vr-panel-gecis` | `wip/vr-tutma` + Ulu Camii VR'da kart/menü düzeni ve karartmalı geçiş | GitHub'da, **master'a girmedi** |
| `wip/vr-vazo` | `vaat-mokap` + vazo VR onarımı (yarım) | GitHub'da, simülasyonda çalıştı |
| `vaat-mokap` | Zaman katmanı, yolculuk, öğretmen paneli, vizyon ekranları | GitHub'da, master'a girmedi; birleştirmeden önce kullanıcıya sor |

### Bekleyen kararlar (kullanıcıya sor)
1. `cini-atolyesi`, `vr-panel-gecis`, `vaat-mokap` master'a birleştirilecek mi, hangi sırayla? Birleştirmeden önce çakışmalara ve testlere bak.
2. Vazo VR: panel "altındaki örnek yazıyı oku" diyor ama vazonun altında yazı yok (`ALT_YAZI` sabiti sahneye hiç eklenmemiş). Yazı mı eklenecek, yönerge mi kalkacak? Öneri: yönergeyi kaldırmak.
3. Sunum (`KokXR_Sunum_v2.pptx`, 3 slayt) güncellenecek mi? Şartname 5.4 başlıkları eksikti.

### Yapılacaklar
- [ ] **Gerçek Quest denemesi (cuma, kullanıcıyla):** Ulu Camii, vazo ve çini VR'ı şimdiye dek yalnız simülasyonda (IWER) çalıştı. Performans ve kumanda hissi bilinmiyor.
- [ ] Videolar `git` dışında, eski bilgisayarın masaüstünde: `kokxr-vr-simulasyon-3`, `kokxr-vazo-vr-simulasyon`, `kokxr-kilic-atolyesi-2`, `kokxr-cini-atolyesi-web`, `kokxr-cini-vr-simulasyon` (hepsi `.webm`). Kod değişirse yeniden çekilmeli.
- [ ] Çini: ses yok; sürükleme adımlarının klavye karşılığı yok, "Ustaya bırak" ile geçiliyor.

### Çini atölyesi (`/atolye/cini`)
Kod `src/components/cini/`, metinler `src/data/cini.ts`, kaynaklar ve sınırlar `docs/cini-atolyesi.md`.
Testler: `node tests/cini-mantik.mjs` ve (4173 açıkken) `node tests/cini.mjs`.
Oksit eşleştirmesi ve çamur malzeme adları kaynakla doğrulanamadığı için bilerek oyuna alınmadı; kaynaksız eklemeyin.

### Video kaydı: Playwright'ın kaydına güvenme
`recordVideo` ve CDP ekran yayını WebGL karesini yarım yakalayabiliyor: tek gözde kaybolan nesneler, dış çatının içeri "patlaması".
Bunlar sahnede değil, kayıttadır. Sabit sahnede çizim tamponu 240/240 aynıyken ekran yayını 200 karede 40 farklı görüntü verdi.
- **VR:** render sonrası `gl.finish()`, sonra `drawImage` ile 2B tuvale al, `toBlob` JPEG, 30 kare/sn dizip Playwright'ın ffmpeg'iyle (`~/.cache/ms-playwright/ffmpeg-*/ffmpeg-linux`) `libvpx-vp9 -deadline good -crf 20` kodla.
- **HTML arayüzlü sayfa:** rAF sonrası `gl.finish()` + CDP ekran yayını JPEG, tarayıcı `--use-angle=vulkan`. gl-egl'de kılıçta tek karelik tam siyah kareler çıktı, Vulkan'da çıkmadı (RTX 3070 Ti; başka bilgisayarda yeniden ölç).
- **Vulkan'da** yeni WebGL bağlamı açılışta bir kez düşüp geri gelebiliyor: `webglcontextlost`'ta hemen hata gösterme, 2B tuval dokularında `willReadFrequently: true` kullan.
- Teslimden önce kare panosuna kendin bak. Simülatör için `tests/xr-sim/` `vaat-mokap` dalındadır; kayıt betikleri geçiciydi ve repoda yok.
- `channel: 'chrome'` kullanan testler (`vazo`, `ui`, `galeri`, `maket-ic`, `maket-xr-dugme`) Google Chrome ister.

---

## 1. Proje bir bakışta

**3 Kasım ek not — kullanıcının düzelttiği kapsam:** İstenen deneyim, aynı vazoyu hem 3B olarak
çevirip incelemek hem de kırık parçalarını birleştirerek restore etmekti. Ulu Camii maketi bu isteğin
yerine geçmez. Bu nedenle `/atolye/vazo` adresine **Vazo atölyesi** eklendi; ana sayfadan ve üst
menüden açılır. Vazo açıkça temsili olarak etiketlidir, tarihî eser iddiası yoktur.
**Son kullanıcı düzeltmesi:** Düğmelerle 90° döndürme/yuva seçme akışı kaldırıldı. Vazo Blender 4.5.3'te
kalınlıklı altı bağımsız seramik parça olarak üretildi. Modelin kendisi veya üzerindeki numara fareyle
tutulup sahnede sürüklenir; doğru yere yakın bırakılınca otomatik hizalanır ve oturur. Dokunma,
yanlış bırakınca geri dönme, ilerleme, yeniden başlatma, Escape ve klavye alternatifi desteklenir.
Kaynak `assets/vazo/vazo.blend`, uygulamadaki model `public/modeller/vazo.glb`, yeniden üretim
betiği `scripts/vazo_uret.py`. Tasarım/etkileşim ve doğrulama ayrıntıları `docs/vazo-modeli.md` içinde.
**Güncel görünüm:** İlk açılışta ayrı kesintisiz gövdeyle izsiz vazo gösterilir. Parçalanıp tamamen
birleştirilince onarım izleri belirir ve inceleme modunda korunur. Genel vazo silueti durur;
seçili parçanın tam konumunu veren halka/yazı ve parçaya özel siluet vurgusu kaldırılmıştır.
Mevcut cami maketi ve çini bulmacası korunmuştur. İlgili kod: `src/pages/VazoAtolyesi.tsx`,
`src/pages/vazo.css`, `src/components/maket/vazoSahnesi.ts`.
Kontrol: `node tests/vazo.mjs` (kurulu Google Chrome, çalışan geliştirme sunucusu;
varsayılan `http://127.0.0.1:5173`, `TEST_URL` ile değiştirilebilir).

**Arayüz yenilemesi:** Kullanıcının sade ve modern arayüz isteği doğrultusunda kırık beyaz,
çam yeşili ve bronz palet; fotoğraf ağırlıklı ana sayfa; aktif menü; eser bölüm bağlantıları;
ortak form, galeri ve atölye stilleri uygulandı. Araştırma kaynakları, renk oranları ve test
komutları `docs/ui-tasarim.md` içinde. `node tests/ui.mjs` dört ekran genişliğini kontrol eder.

**Kılıç atölyesi (`/atolye/kilic`):** Topkapı Env. 1/90 kılıcının temsilî modeliyle külçeden kılıca sekiz aşama, sonra test alanı. Kaynaklar ve temsilî sınırlar `docs/kilic-atolyesi.md`; tarihsel metinler yalnız `src/data/kilic.ts`. Yeniden üretim: `blender -b --python scripts/kilic_doku.py`, sonra `scripts/kilic_uret.py` (dokular git dışı). Hedef hasarı `src/components/kilic/hedefler.ts`, hareket `animasyon.ts`. Test: `TEST_GPU=1 node tests/kilic.mjs`, `node tests/kilic-mantik.mjs`. Video: `node scripts/kilic_video.mjs <dosya.webm>`.

**Ulu Camii maketi (yeniden yapıldı):** `src/components/maket/ulucami*.ts`, kod ile üretilir. Dış: taş cephe, kaburgalı kurşun kubbeler, sekizgen kasnaklar, on bir sıra mukarnaslı taç kapı, iki farklı minare, avlu köşkleri. İç: `İçeri gir` ile klavyeyle yürünür (`W A S D`, ok tuşları, `Shift`; çarpışmalı), yapıya yaklaşınca `maket.icBilgiler` kartı açılır. Levha ve paye yazıları arşiv fotoğraflarının kırpımıdır (`scripts/levha_kirp.py`, Pillow gerekir; çıktı `public/gorseller/ulu-camii/maket/`), hangi yüzde durdukları temsilîdir. Kapı ekseni, mahfil, kürsü, kapalı güney pencereleri Kültür Portalı metnindendir (`kp-ulu`). Görüntü işleme (AO, parlama) yavaş cihazda kendiliğinden kapanır, yüksek kaliteyi zorlamak için `?kalite=yuksek`. Test: `node tests/maket-ic.mjs`.

**Fotoğraf revizyonu:** Palet %90 mevcut + %10 sıcak ton karışımıyla hafif sıcaklaştırıldı.
Galeri eser sayfasında ilk sıraya alındı; fotoğraflar kırpılmadan sığıyor, keşif işaretleri fotoğrafla
hizalı kalıyor. Oklar, küçük resimler, klavye, mobil kaydırma ve %100–300 büyütme/sığdırma eklendi.
Gezinti yönleri fotoğrafın dışına taşındı, bütünü gösteren fotoğraf modu eklendi.
`node tests/galeri.mjs`: iki eserin 10'ar fotoğrafı, masaüstü ve mobilde doğrulandı.

**KökXR** — "Dokunamadığın tarihe dokun." KÖK&KOD Hackathon'u (Vakıf Katılım + 42 Türkiye) için,
Bursa'daki vakıf eserlerini keşfettiren bir **web uygulaması** (React + TypeScript + Vite).

**Eserler:** Bursa Ulu Camii · II. Murad (Muradiye) Külliyesi

| Özellik | Nerede | Durum |
|---|---|---|
| Ana sayfa, eser seçimi, rozetler | `src/pages/AnaSayfa.tsx` | ✅ |
| **Vazo atölyesi** — Blender modeli; fare/dokunmayla sahnede parçaları tut, sürükle, birleştir | `src/pages/VazoAtolyesi.tsx`, `maket/vazoSahnesi.ts` | ✅ |
| Galeri + fotoğraf üzerinde keşif noktaları | `src/components/Galeri.tsx` | ✅ |
| Tarihçe, kaynaklar, 3 soruluk test | `src/pages/EserSayfasi.tsx`, `Test.tsx` | ✅ |
| **Eseri eline al** — Ulu Camii temsili 3B maketi (çevir, yakınlaştır, Parçala/Birleştir) | `src/components/EseriEleAl.tsx`, `maket/` | ✅ |
| **360° tur** — 360TR'nin resmî embed oynatıcısı (iframe, yalnız Ulu Camii) | `src/components/Tur360.tsx` | ✅ (internet gerekir) |
| **Derinlikli sanal gezinti** — fotoğraf durakları + yapay zekâ derinlik haritası (2.5B) | `src/components/SanalGezinti.tsx`, `gezinti/` | ✅ |
| **Restorasyon görevi** — Muradiye çini panosu bulmacası | `src/components/Restorasyon.tsx` | ✅ |
| **Yönetim ekranı** — içerik ekle/düzenle, JSON dışa/içe aktar (şartname 5.1.1) | `src/pages/Yonetim.tsx`, `EserFormu.tsx` | ✅ |
| Uçtan uca test (15 adım) | `tests/uctan-uca.mjs` | ✅ 15/15 |

---

## 2. Projeyi yeni bilgisayara taşıma

Repo GitHub'da (**private**): `git@github.com:selamisimsek/kokxr.git` · dal: `master`

Yeni bilgisayarda:
```bash
git clone git@github.com:selamisimsek/kokxr.git      # SSH anahtarı o bilgisayarda da GitHub'a eklenmeli
# ya da: git clone https://github.com/selamisimsek/kokxr.git   (şifre yerine Personal Access Token)
cd kokxr
```
İki bilgisayar arasında: çalışmaya başlamadan `git pull`, bitirince `git add -A && git commit -m "…" && git push`.
Repo **private kalmalı** (arşiv fotoğraflarının kullanım izni netleşmedi).

### Taşınmayanlar (git dışında, gerekirse ayrıca kopyala)
| Klasör | Boyut | Gerekli mi? |
|---|---|---|
| `proje bilgileri/` — şartname, envanter PDF'leri, ham fotoğraf arşivi | 7,6 GB | Küçük belgeler (şartname, sunum, mockup PNG) Drive'dan; fotoğraf arşivi paylaşılan "Vakıf Eserleri Envanteri – Bursa Fotoğraf Arşivi" Drive klasöründen. Yalnızca **yeni içerik/fotoğraf** eklenecekse gerekir; uygulamanın fotoğrafları zaten `public/` içinde ve git'te. |
| `_eski/` | küçük | Hayır (eski, boş deneme dosyaları) |
| `node_modules/` | — | Hayır, `npm install` ile kurulur |

---

## 3. Kurulum ve çalıştırma

Gereken: **Node.js 24+** (eski bilgisayarda v24.22.1), npm, git.

```bash
npm install                                   # bağımlılıklar
npm run dev                                   # geliştirme: http://localhost:5173
npm run build && npm run preview -- --port 4173   # üretim sürümü: http://localhost:4173
```

### Uçtan uca test
```bash
npx playwright install chromium firefox       # yalnız ilk seferde (~300 MB tarayıcı indirir)
npm run build && npm run preview -- --port 4173   # ayrı bir terminalde açık kalsın
npm run test:e2e                              # Chromium 1280 + 360 px ve Firefox 1280 px, 15'er adım
```
Ekran görüntüleri `test-sonuclari/` klasörüne yazılır (git dışı). Beklenen: her yapılandırmada `15/15`.

**Not:** Brave tarayıcıda 360° tur Shields yüzünden açılmayabilir — demo için Chrome/Firefox kullanın.

---

## 4. Mimari ve veri modeli

- **Tüm içerik JSON'da:** `src/data/eserler/<id>.json`. Yeni eser = yeni JSON + `public/gorseller/<id>/` fotoğrafları; **kod değişmez**
  (`src/data/index.ts` klasördeki tüm JSON'ları `import.meta.glob` ile otomatik yükler).
- **Tip tanımları:** `src/types/eser.ts` (`Eser`, `Kaynak`, `Gorsel`, `BilgiNoktasi`, `Soru`, `Tur`, `Tur360`, `RestorasyonGorevi`, `Maket`).
  İsteğe bağlı alanlar: `tur` (gezinti), `tur360`, `restorasyon`, `maket` — olmayan eserde ilgili bölüm görünmez.
- **Yönetim ekranı** değişiklikleri `localStorage` (`kokxr-icerik`) üst katmanında tutulur; JSON varsayılanlarının üstüne yazılır.
  Kalıcı yapmak için: Yönetim → "JSON olarak indir" → dosyayı `src/data/eserler/` içine koy → commit.
- **Rozetler:** `localStorage` → `kokxr-rozetler` (eser id'si = test rozeti, `<id>:restorasyon` = restorasyon rozeti).
- **Three.js** dinamik import ile yalnızca maket/gezinti açılınca yüklenir (ayrı ~568 kB parça).
- **Derinlik haritaları** (`public/derinlik/`) Depth Anything V2 (small) ile çevrimdışı üretildi (`@huggingface/transformers`,
  model `onnx-community/depth-anything-v2-small`). Yeni gezinti durağı eklenirse yeniden üretmek gerekir.

### İçerik kuralları (AGENTS.md'den — çok önemli)
- **Tarihsel bilgi uydurma.** Her metin `kaynakId` ile envanter PDF'inde sayfa numaralı bir kaynağa bağlı
  ("Vakıf Eserleri Envanteri – Bursa, Osmangazi, "Ulucami"/"II. Murad Külliyesi", s. X").
  Kaynaksız içerik "Kaynaklı bilgi" olarak işaretlenemez (yönetim ekranı da bunu zorunlu kılar).
- **Verisi olmayan 3B/VR/360°'yi varmış gibi gösterme.** Maket ve gezinti ekranda "temsili" etiketlidir; 360° tur 360TR'ye aittir ve kaynak bağlantısı gösterilir.
- **Lisansı belirsiz görseli yayımlama.** Arşiv fotoğraflarının kullanım izni sponsordan teyit edilmedi → repo **private** kalmalı.
- Fotoğraf → yapı eşleştirmesi tahminle değil, envanter PDF'inde hangi bölümde kullanıldığına bakılarak yapıldı.

---

## 5. Üç ajanla çalışma düzeni

| Ajan | Komut | Rol |
|---|---|---|
| Claude Code | `claude` | Lider: plan, içerik/veri, kod incelemesi, **commit** |
| Codex CLI | `codex` | Uygulama kodu (`docs/next-task.md`'deki görevi uygular) |
| Antigravity | `agy` | Tarayıcıda test, rapor yazar (`docs/test-raporu*.md`) |

Akış: Claude `docs/next-task.md` yazar → Codex uygular → Claude inceler + commit → test (Antigravity veya `npm run test:e2e`).
Aynı dosyaya iki ajan aynı anda dokunmaz.

### Bilinen tuzaklar
- **Codex'i arka planda çalıştırırken** stdin kapatılmalı, yoksa "Reading additional input from stdin…" diye takılır:
  ```bash
  codex exec --sandbox workspace-write -c sandbox_workspace_write.network_access=true -C . "<görev>" < /dev/null
  ```
- Codex sandbox'ı `.git`'i salt okunur yapar → **Codex commit atamaz**, commit'i Claude (veya siz) atar.
- `agy -p` (komut satırı modu) izin soramaz; komut çalıştırması gereken testlerde `--dangerously-skip-permissions` gerekir
  (kullanıcı onayıyla). Bu bilgisayarda `--mode auto` desteklenmiyordu.
- `pkill -f "codex exec"` Claude'un kendi kabuğunu da öldürür; `pgrep -f "codex exe[c] --sandbox"` ile PID bulun.

---

## 6. Kalan işler (öncelik sırasıyla)

**4 Kasım akşamı kod dondurma — sonrasında yalnız demoyu bozan hata düzeltilir.**

1. **Arayüz yenilemesi tamamlandı** — kullanıcının son isteğine göre açık, sade ve modern tasarım uygulandı.
   Önceki koyu-altın tema önerisinin yerini bu tasarım aldı. Ayrıntılar: `docs/ui-tasarim.md`.
2. **PWA** — telefona/masaüstüne kurulabilir uygulama (manifest + service worker; fotoğraflar önbelleğe). Şartnamedeki
   "mobil veya masaüstü uygulaması" maddesini güçlendirir. 360° tur yine internet ister.
3. **Yedek demo videosu tamamlandı** — `node scripts/demo_video.mjs <cikti.webm>` ile yeniden çekilir (önce `npm run build` ve 4173'te `npm run preview`). Arayüz değişirse finalden önce tekrar çekin; video git dışındadır.
4. Küçük: yönetim listesindeki erişilebilir adda fazla boşluk ("Düzenle : …") — `src/pages/Yonetim.tsx` `sr-only` span.
5. İsteğe bağlı: Muradiye için de maket; Ulu Camii minberi/şadırvanı için "elde çevrilebilir" küçük nesne maketi.

### Final günü kontrol listesi
- [ ] `npm run build` alınmış `dist/` ve yedek video **iki dizüstünde ve USB'de**
- [ ] Demo Chrome/Firefox'ta, **Brave değil**; 360° tur için internet bağlantısı denendi
- [ ] Demo öncesi tarayıcı `localStorage` temiz (Yönetim → "Tüm üst katmanı sıfırla") ya da hazır demo durumu
- [ ] Sunumda "çalışan prototip" ile "vizyon (VR, zaman katmanı…)" ayrı slaytlarda
- [ ] Her ekip üyesi mimariyi ve veri modelini 1 dakikada anlatabiliyor (şartname 5.1.2)

**Önerilen 3 dakikalık demo akışı:** `docs/test-raporu-2.md` sonunda.

---

## 7. Açık konular (kullanıcı/ekip tarafında)

- **Arşiv fotoğraflarının kullanım izni** — sponsordan (Vakıf Katılım) yazılı teyit.
- **Envanter kitabının tam adı** — kaynak satırlarında şimdilik "Vakıf Eserleri Envanteri – Bursa" yazıyor.
- **360TR** — resmî embed kodu (ücretsiz hesapla: https://www.360tr.com/tr/hesabim/embed/yeni?tour=359) ve/veya bilgilendirme e-postası.
  Şu an herkese açık `https://www.360tr.com/embed/bursa-ulu-camii` adresi kullanılıyor.
- Organizasyona: web tabanlı (PWA) uygulamanın "mobil/masaüstü uygulaması" sayılıp sayılmadığı.

---

## 8. Önemli dosyalar

| Dosya | İçerik |
|---|---|
| `AGENTS.md` | Tüm ajanlar için proje kuralları |
| `docs/plan.md` | Web MVP planı, şartname eşlemesi |
| `docs/durum.md` | Gün sonu durum notu |
| `docs/next-task.md` | Codex'e verilen son görev (Görev 4 — tamamlandı) |
| `docs/test-raporu.md`, `docs/test-raporu-2.md` | Antigravity raporu ve son uçtan uca test |
| `docs/sohbet-ozeti.md` | Projenin başlangıç bağlamı (ekip, eski Unity planı, kaynaklar) |
| `proje bilgileri/KÖK&KOD Hackathon _ Yarışma Şartnamesi_TR.pdf` | Şartname (git dışında) |
