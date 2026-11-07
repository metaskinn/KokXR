# KökXR — Başka bilgisayarda devam rehberi

> Son güncelleme: 6 Kasım 2026 · **Final: 7–8 Kasım 2026**
> Bu dosya, projeye yeni bir bilgisayarda (ve yeni bir Claude / Codex / Antigravity oturumunda) kaldığı yerden
> devam etmek için gereken her şeyi içerir. Yeni oturumda yapay zekâ ajanına ilk olarak bu dosyayı okutun.

---

## 0. En güncel durum (6 Kasım 2026, gece)

Çalışma dalı **`ulu-camii-grafik`** (`master` üzerine). Aşağıdaki işler `master`'a birleştirilmedi; `kokxr.vercel.app` da bunları içermiyor.

```bash
git fetch origin && git switch ulu-camii-grafik
npm ci
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort   # http://127.0.0.1:5173/vr
```
Node 22+ gerekir (`.nvmrc` 24 ister). Okul makinesindeki sistem Node'u v12'dir, projeyi çalıştırmaz.

### Bu dalda eklenenler
- **Mekanlar sekmesi (`/places`):** Türkiye haritası → şehir → yapı → `/places/<eser-id>`. Liste `src/content/vrArtifacts.ts`; yapı, eser verisinde `maket` veya `restorasyon` varsa kendiliğinden açılır. Sınır çizgisi Natural Earth (kamu malı). Konya ve Hatay'da VR yok, yalnız kitap bağlantısı var.
- **9 yeni Bursa maketi (web ve VR):** Orhan Bey, I. Murat Hüdavendigar, Hamzabey, Timurtaş Paşa, II. Murat (Muradiye), Yeşil Çelebi Mehmed, Yıldırım, Emir Sultan, Umurbey. Her biri `src/features/scale-models/buildings/<eser-id>.ts`, `src/content/artifacts/<eser-id>.json`, `public/images/<eser-id>/`.
- **Yeni yapı ekleme:** `yapilar/<eser-id>.ts` içinde `export const yapi = (): Maket => ...` yeterlidir, otomatik kaydolur; yardımcı dosyalar alt klasöre konur. Kamera, kaide ve iç ışık `Maket` arayüzünde yapıya özeldir. `m.hali` Ulu Camii'nin paye düzenine bağlıdır, başka yapıda `m.haliSade` kullanın.
- **Ulu Camii iç mekânı:** kodla üretilen halı ve mermer (`scale-models/uluMosqueFloor.ts`), avize haleleri, ışık sütunu, iç yansıma ortamı, gerçek iç gölgeler. Quest ve dokunmatik cihazda `hafifCihaz()` daha hafif malzeme ve yarı boyutlu doku kullanır.
- **Yapılara çıkma:** `IcYurume.zeminler` ve `yurumeCarpisma.ts:zeminAdimi` ile yükseklikli yürüme (web ve VR). Ulu Camii'de minber, kürsü ve mahfile çıkılır.
- **Dokunmatik yürüme kolu:** `EseriEleAl.tsx:YurumeKolu`, iç mekânda ve `pointer: coarse` cihazda görünür.
- **Paneller:** web kartı ve VR kartı küçültüldü; VR kartı web kartının görsel dilinde (`maket/xrPanel.ts`).

### Testler
`tests/model-building.mjs <eser-id>` (sahne, parçalama, duraklar, eser sayfası), `tests/model-climb.mjs`, `tests/model-touchscreen.mjs`, `tests/vr-artifacts.mjs`. Hepsi `TEST_URL` ile çalışır.
Son tur: `maket-yapi` 10 yapıda, `vr-eserler` ve `maket-xr-dugme` geçti (yürüme kolundan hemen önceki kodla). `maket-dokunmatik` ve `maket-tirmanma` yalnız Ulu Camii'de çalıştı.

### Doğrulanmayanlar
- **Yeni 9 yapı Quest'te ve VR simülasyonunda denenmedi;** VR birleştirme oyunu bu yapılarda hiç çalışmadı. `tests/xr-sim/` ile simülasyon yapılabilir.
- Üçgen sayısı ve kare hızı gerçek cihazda ölçülmedi. Yürüme kolu gerçek telefonda denenmedi.
- Tarihsel metinlerin sayfa numaraları ajanlar tarafından yazıldı, elle kitapla karşılaştırılmadı.
- Yıldırım ve Umurbey'in son düzeltmeleri testten geçti ama görüntüleri tek tek incelenmedi.

### Yayın
- **Geçici adres:** `vercel deploy --temporary` ile girişsiz yayın alınıyor; 60 dakikada kapanır, hesaba alınmazsa silinir.
- **Tam sürüm:** `npm run build`, ardından `dist/vercel.json` (SPA yönlendirmesi) elle eklenir. Kullanıcı arşiv fotoğraflarının bu yayında yer almasına izin verdi; sponsor izni hâlâ açık konudur.
- **`kokxr.vercel.app`:** başka bir ekip üyesinin hesabında, elle yüklenmiş açık sürüm (fotoğrafsız). Güncellemek için o hesaba erişim gerekir.
- `~/.npm` ev kotasını doldurabiliyor: `npm_config_cache` değişkenini geçici klasöre verin.

---

## 0.1. 5 Kasım notu (eski)

```bash
git fetch origin
git switch cini-atolyesi      # bu not ve çini atölyesi bu dalda; master'da henüz yok
npm install
npm run build && npm run preview -- --port 4173
```
Yeni yapay zekâ oturumuna: "HANDOFF.md'yi oku, 0. bölümden devam et" de.

### Dallar
| Dal | İçinde ne var | Durum |
|---|---|---|
| `master` | Site, kılıç, vazo (masaüstü), Ulu Camii maketi ve VR'ı | GitHub'da, `3286759` |
| `cini-atolyesi` | `master` + çini atölyesi (web ve VR) + bu not | GitHub'da, **master'a girmedi** |
| `vr-panel-gecis` | `wip/vr-tutma` + Ulu Camii VR'da kart/menü düzeni ve karartmalı geçiş | GitHub'da, **master'a girmedi** |
| `wip/vr-vazo` | `vaat-mokap` + vazo VR onarımı (yarım) | GitHub'da, yalnız `test:hizli` geçti |
| `vazo-quest` | Bu dalların birleşimi + bitmiş vazo VR | Yerelde, simülasyonda çalıştı, gerçek Quest'te denenmedi |
| `vaat-mokap` | Zaman katmanı, yolculuk, öğretmen paneli, vizyon ekranları | GitHub'da, master'a girmedi; birleştirmeden önce kullanıcıya sor |

### Bekleyen kararlar (kullanıcıya sor)
1. `cini-atolyesi`, `vr-panel-gecis`, `vaat-mokap` master'a birleştirilecek mi, hangi sırayla? Birleştirmeden önce çakışmalara ve testlere bak.
2. Sunum (`KokXR_Sunum_v2.pptx`, 3 slayt) güncellenecek mi? Şartname 5.4 başlıkları eksikti.

### Yapılacaklar
- [ ] **Gerçek Quest denemesi (cuma, kullanıcıyla):** Ulu Camii, vazo ve çini VR'ı şimdiye dek yalnız simülasyonda (IWER) çalıştı. Performans ve kumanda hissi bilinmiyor.
- [ ] Videolar `git` dışında, eski bilgisayarın masaüstünde: `kokxr-vr-simulasyon-3`, `kokxr-vazo-vr-simulasyon`, `kokxr-kilic-atolyesi-2`, `kokxr-cini-atolyesi-web`, `kokxr-cini-vr-simulasyon` (hepsi `.webm`). Kod değişirse yeniden çekilmeli.
- [ ] Çini: ses yok; sürükleme adımlarının klavye karşılığı yok, "Ustaya bırak" ile geçiliyor.

### Çini atölyesi (`/workshops/tile`)
Kod `src/features/workshops/tile/engine/`, metinler `src/content/tile.ts`, kaynaklar ve sınırlar `docs/tile-workshop.md`.
Testler: `node tests/tile-logic.mjs` ve (4173 açıkken) `node tests/tile.mjs`.
Oksit eşleştirmesi ve çamur malzeme adları kaynakla doğrulanamadığı için bilerek oyuna alınmadı; kaynaksız eklemeyin.

### Video kaydı: Playwright'ın kaydına güvenme
`recordVideo` ve CDP ekran yayını WebGL karesini yarım yakalayabiliyor: tek gözde kaybolan nesneler, dış çatının içeri "patlaması".
Bunlar sahnede değil, kayıttadır. Sabit sahnede çizim tamponu 240/240 aynıyken ekran yayını 200 karede 40 farklı görüntü verdi.
- **VR:** render sonrası `gl.finish()`, sonra `drawImage` ile 2B tuvale al, `toBlob` JPEG, 30 kare/sn dizip Playwright'ın ffmpeg'iyle (`~/.cache/ms-playwright/ffmpeg-*/ffmpeg-linux`) `libvpx-vp9 -deadline good -crf 20` kodla.
- **HTML arayüzlü sayfa:** rAF sonrası `gl.finish()` + CDP ekran yayını JPEG, tarayıcı `--use-angle=vulkan`. gl-egl'de kılıçta tek karelik tam siyah kareler çıktı, Vulkan'da çıkmadı (RTX 3070 Ti; başka bilgisayarda yeniden ölç).
- **Vulkan'da** yeni WebGL bağlamı açılışta bir kez düşüp geri gelebiliyor: `webglcontextlost`'ta hemen hata gösterme, 2B tuval dokularında `willReadFrequently: true` kullan.
- Teslimden önce kare panosuna kendin bak. Simülatör için `tests/xr-sim/` `vaat-mokap` dalındadır; kayıt betikleri geçiciydi ve repoda yok.
- `channel: 'chrome'` kullanan testler (`vazo`, `vazo-xr-dugme`, `ui`, `galeri`, `maket-ic`, `maket-xr-dugme`) Google Chrome ister.
- 4173 doluysa `npm run test:tarayici` başlamaz; `TEST_PORT=4178 npm run test:tarayici` ile boş port ver.

---

## 1. Proje bir bakışta

**3 Kasım ek not — kullanıcının düzelttiği kapsam:** İstenen deneyim, aynı vazoyu hem 3B olarak
çevirip incelemek hem de kırık parçalarını birleştirerek restore etmekti. Ulu Camii maketi bu isteğin
yerine geçmez. Bu nedenle `/workshops/vase` adresine **Vazo atölyesi** eklendi; ana sayfadan ve üst
menüden açılır. Vazo açıkça temsili olarak etiketlidir, tarihî eser iddiası yoktur.
**Son kullanıcı düzeltmesi:** Düğmelerle 90° döndürme/yuva seçme akışı kaldırıldı. Vazo Blender 4.5.3'te
kalınlıklı altı bağımsız seramik parça olarak üretildi. Modelin kendisi veya üzerindeki numara fareyle
tutulup sahnede sürüklenir; doğru yere yakın bırakılınca otomatik hizalanır ve oturur. Dokunma,
yanlış bırakınca geri dönme, ilerleme, yeniden başlatma, Escape ve klavye alternatifi desteklenir.
Kaynak `assets/vazo/vazo.blend`, uygulamadaki model `public/models/vase.glb`, yeniden üretim
betiği `scripts/vase_generate.py`. Tasarım/etkileşim ve doğrulama ayrıntıları `docs/vase-model.md` içinde.
**Güncel görünüm:** İlk açılışta ayrı kesintisiz gövdeyle izsiz vazo gösterilir. Parçalanıp tamamen
birleştirilince onarım izleri belirir ve inceleme modunda korunur. Genel vazo silueti durur;
seçili parçanın tam konumunu veren halka/yazı ve parçaya özel siluet vurgusu kaldırılmıştır.
Mevcut cami maketi ve çini bulmacası korunmuştur. İlgili kod: `src/features/workshops/vase/VaseWorkshop.tsx`,
`src/features/workshops/vase/vase.css`, `src/features/workshops/vase/vaseScene.ts`.
Kontrol: `node tests/vase.mjs` (kurulu Google Chrome, çalışan geliştirme sunucusu;
varsayılan `http://127.0.0.1:5173`, `TEST_URL` ile değiştirilebilir).

**Arayüz yenilemesi:** Kullanıcının sade ve modern arayüz isteği doğrultusunda kırık beyaz,
çam yeşili ve bronz palet; fotoğraf ağırlıklı ana sayfa; aktif menü; eser bölüm bağlantıları;
ortak form, galeri ve atölye stilleri uygulandı. Araştırma kaynakları, renk oranları ve test
komutları `docs/ui-design.md` içinde. `node tests/ui.mjs` dört ekran genişliğini kontrol eder.

**Kılıç atölyesi (`/workshops/sword`):** Topkapı Env. 1/90 kılıcının temsilî modeliyle külçeden kılıca sekiz aşama, sonra test alanı. Kaynaklar ve temsilî sınırlar `docs/sword-workshop.md`; tarihsel metinler yalnız `src/content/sword.ts`. Yeniden üretim: `blender -b --python scripts/sword_texture.py`, sonra `scripts/sword_generate.py` (dokular git dışı). Hedef hasarı `src/features/workshops/sword/engine/targets.ts`, hareket `animation.ts`. Test: `TEST_GPU=1 node tests/sword.mjs`, `node tests/sword-logic.mjs`. Video: `node scripts/sword_video.mjs <dosya.webm>`.

**Ulu Camii maketi (yeniden yapıldı):** `src/features/scale-models/uluMosque*.ts`, kod ile üretilir. Dış: taş cephe, kaburgalı kurşun kubbeler, sekizgen kasnaklar, on bir sıra mukarnaslı taç kapı, iki farklı minare, avlu köşkleri. İç: `İçeri gir` ile klavyeyle yürünür (`W A S D`, ok tuşları, `Shift`; çarpışmalı), yapıya yaklaşınca `maket.icBilgiler` kartı açılır. Levha ve paye yazıları arşiv fotoğraflarının kırpımıdır (`scripts/plaque_crop.py`, Pillow gerekir; çıktı `public/images/ulu-mosque/model/`), hangi yüzde durdukları temsilîdir. Kapı ekseni, mahfil, kürsü, kapalı güney pencereleri Kültür Portalı metnindendir (`kp-ulu`). Görüntü işleme (AO, parlama) yavaş cihazda kendiliğinden kapanır, yüksek kaliteyi zorlamak için `?kalite=yuksek`. Test: `node tests/model-interior.mjs`.

**Fotoğraf revizyonu:** Palet %90 mevcut + %10 sıcak ton karışımıyla hafif sıcaklaştırıldı.
Galeri eser sayfasında ilk sıraya alındı; fotoğraflar kırpılmadan sığıyor, keşif işaretleri fotoğrafla
hizalı kalıyor. Oklar, küçük resimler, klavye, mobil kaydırma ve %100–300 büyütme/sığdırma eklendi.
Gezinti yönleri fotoğrafın dışına taşındı, bütünü gösteren fotoğraf modu eklendi.
`node tests/gallery.mjs`: iki eserin 10'ar fotoğrafı, masaüstü ve mobilde doğrulandı.

**KökXR** — "Dokunamadığın tarihe dokun." KÖK&KOD Hackathon'u (Vakıf Katılım + 42 Türkiye) için,
Bursa'daki vakıf eserlerini keşfettiren bir **web uygulaması** (React + TypeScript + Vite).

**Eserler:** Bursa Ulu Camii · II. Murad (Muradiye) Külliyesi

| Özellik | Nerede | Durum |
|---|---|---|
| Ana sayfa, eser seçimi, rozetler | `src/pages/AnaSayfa.tsx` | ✅ |
| **Vazo atölyesi** — Blender modeli; fare/dokunmayla sahnede parçaları tut, sürükle, birleştir; WebXR ile Quest'te (simülasyonda sınandı) | `src/features/workshops/vase/VaseWorkshop.tsx`, `maket/vazoSahnesi.ts`, `maket/vazoXr.ts` | ✅ |
| Galeri + fotoğraf üzerinde keşif noktaları | `src/features/heritage/components/Gallery.tsx` | ✅ |
| Tarihçe, kaynaklar, 3 soruluk test | `src/features/heritage/pages/ArtifactPage.tsx`, `Test.tsx` | ✅ |
| **Eseri eline al** — Ulu Camii temsili 3B maketi (çevir, yakınlaştır, Parçala/Birleştir) | `src/features/heritage/components/ArtifactExplorer.tsx`, `maket/` | ✅ |
| **360° tur** — 360TR'nin resmî embed oynatıcısı (iframe, yalnız Ulu Camii) | `src/components/Tur360.tsx` | ✅ (internet gerekir) |
| **Derinlikli sanal gezinti** — fotoğraf durakları + yapay zekâ derinlik haritası (2.5B) | `src/components/SanalGezinti.tsx`, `gezinti/` | ✅ |
| **Restorasyon görevi** — Muradiye çini panosu bulmacası | `src/components/Restorasyon.tsx` | ✅ |
| **Yönetim ekranı** — içerik ekle/düzenle, JSON dışa/içe aktar (şartname 5.1.1) | `src/features/admin/AdminPage.tsx`, `EserFormu.tsx` | ✅ |
| Uçtan uca test (15 adım) | `tests/end-to-end.mjs` | ✅ 15/15 |

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

- **Tüm içerik JSON'da:** `src/content/artifacts/<id>.json`. Yeni eser = yeni JSON + `public/images/<id>/` fotoğrafları; **kod değişmez**
  (`src/infrastructure/contentRepository.ts` klasördeki tüm JSON'ları `import.meta.glob` ile otomatik yükler).
- **Tip tanımları:** `src/domain/artifact.ts` (`Eser`, `Kaynak`, `Gorsel`, `BilgiNoktasi`, `Soru`, `Tur`, `Tur360`, `RestorasyonGorevi`, `Maket`).
  İsteğe bağlı alanlar: `tur` (gezinti), `tur360`, `restorasyon`, `maket` — olmayan eserde ilgili bölüm görünmez.
- **Yönetim ekranı** değişiklikleri `localStorage` (`kokxr-icerik`) üst katmanında tutulur; JSON varsayılanlarının üstüne yazılır.
  Kalıcı yapmak için: Yönetim → "JSON olarak indir" → dosyayı `src/content/artifacts/` içine koy → commit.
- **Rozetler:** `localStorage` → `kokxr-rozetler` (eser id'si = test rozeti, `<id>:restorasyon` = restorasyon rozeti).
- **Three.js** dinamik import ile yalnızca maket/gezinti açılınca yüklenir (ayrı ~568 kB parça).
- **Derinlik haritaları** (`public/depth/`) Depth Anything V2 (small) ile çevrimdışı üretildi (`@huggingface/transformers`,
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
| Codex CLI | `codex` | Uygulama kodu (`docs/archive/next-task.md`'deki görevi uygular) |
| Antigravity | `agy` | Tarayıcıda test, rapor yazar (`docs/archive/test-report*.md`) |

Akış: Claude `docs/archive/next-task.md` yazar → Codex uygular → Claude inceler + commit → test (Antigravity veya `npm run test:e2e`).
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
   Önceki koyu-altın tema önerisinin yerini bu tasarım aldı. Ayrıntılar: `docs/ui-design.md`.
2. **PWA** — telefona/masaüstüne kurulabilir uygulama (manifest + service worker; fotoğraflar önbelleğe). Şartnamedeki
   "mobil veya masaüstü uygulaması" maddesini güçlendirir. 360° tur yine internet ister.
3. **Yedek demo videosu tamamlandı** — `node scripts/demo_video.mjs <cikti.webm>` ile yeniden çekilir (önce `npm run build` ve 4173'te `npm run preview`). Arayüz değişirse finalden önce tekrar çekin; video git dışındadır.
4. Küçük: yönetim listesindeki erişilebilir adda fazla boşluk ("Düzenle : …") — `src/features/admin/AdminPage.tsx` `sr-only` span.
5. İsteğe bağlı: Muradiye için de maket; Ulu Camii minberi/şadırvanı için "elde çevrilebilir" küçük nesne maketi.

### Final günü kontrol listesi
- [ ] `npm run build` alınmış `dist/` ve yedek video **iki dizüstünde ve USB'de**
- [ ] Demo Chrome/Firefox'ta, **Brave değil**; 360° tur için internet bağlantısı denendi
- [ ] Demo öncesi tarayıcı `localStorage` temiz (Yönetim → "Tüm üst katmanı sıfırla") ya da hazır demo durumu
- [ ] Sunumda "çalışan prototip" ile "vizyon (VR, zaman katmanı…)" ayrı slaytlarda
- [ ] Her ekip üyesi mimariyi ve veri modelini 1 dakikada anlatabiliyor (şartname 5.1.2)

**Önerilen 3 dakikalık demo akışı:** `docs/archive/test-report-2.md` sonunda.

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
| `docs/archive/status.md` | Gün sonu durum notu |
| `docs/archive/next-task.md` | Codex'e verilen son görev (Görev 4 — tamamlandı) |
| `docs/archive/test-report.md`, `docs/archive/test-report-2.md` | Antigravity raporu ve son uçtan uca test |
| `docs/archive/chat-summary.md` | Projenin başlangıç bağlamı (ekip, eski Unity planı, kaynaklar) |
| `proje bilgileri/KÖK&KOD Hackathon _ Yarışma Şartnamesi_TR.pdf` | Şartname (git dışında) |
