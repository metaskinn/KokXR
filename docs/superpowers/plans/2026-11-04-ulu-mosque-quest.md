# Ulu Camii maketi — Meta Quest (WebXR) uygulama planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ulu Camii temsilî maketini Quest Browser'da VR'da açmak: önce masa üstünde maket olarak incelemek, sonra içeri girip gerçek ölçekte yürümek ve kaynaklı bilgi kartlarını okumak.

**Architecture:** Yeni uygulama veya motor yok. Mevcut `modelScene.ts` sahnesine WebXR oturumu eklenir. Kamera bir "rig" grubuna bağlanır: maket görünümünde rig 100× ölçeklenir (dünya masa boyutunda görünür), iç mekânda 1× olur. Hesaplar `three`suz saf modüllerde tutulur ve Node'da test edilir; VR arayüzü `CanvasTexture` panellerdir, çünkü HTML VR içinde görünmez.

**Tech Stack:** React 19, TypeScript, Three.js 0.187 (`renderer.xr`), Playwright. **Yeni bağımlılık yok.**

**Spec:** Ayrı spec yok; kullanıcı soru aşamasını geçip plan istedi. Ürün kararları aşağıdaki "Varsayımlar" bölümündedir ve kullanıcı onayına açıktır.

**Branch:** `ulu-camii-quest` (`origin/ulu-camii-maket` üzerinde, `57722ed`). `master`'a birleştirme bu planın parçası değildir.

## Varsayımlar (kullanıcı onaylayacak)

1. Akış: **maket görünümü → içeri gir → yürü → bilgi kartı oku → çık.**
2. Hedef cihaz Quest 2 veya üstü, iki kumanda, Quest Browser.
3. Demo herkese açık yayınlanmaz; Quest'e geliştirici bilgisayarından USB ile açılır (`adb reverse`).
4. Masaüstü ve telefon deneyimi aynen kalır; VR düğmesi yalnızca destekleyen tarayıcıda görünür.

## Kapsam dışı (sonraya)

El takibi; kumandayla maketi tutup çevirme; maketin içinde 3B "i" işaretleri; sesli anlatım; AR/passthrough; kumandanın gerçek 3B modeli (`XRControllerModelFactory` modeli internetten indirir, demoda risk); kapılardan dışarı yürüme; Muradiye; kılıç ve vazo atölyeleri.

## Global Constraints

- Arayüz Türkçe; tarihsel metin yazılmaz, tüm kart metni ve kaynak `maket.icBilgiler` + `kaynaklar` verisinden gelir.
- VR'da da ekranda şu etiket görünür: `Temsilî maket · Gerçek bir 3B tarama değildir`.
- "Gerçek", "birebir", "dijital ikiz" gibi yanıltıcı ifade kullanılmaz.
- Repo private kalır; fotoğraf izni netleşmeden herkese açık yayın yok.
- Masaüstü davranışı bozulmaz: `node tests/model-interior.mjs` her görevden sonra geçer.
- `package.json` bağımlılıkları değişmez.
- Hedef kare hızı: Quest'te en az **72 FPS**.

## Dosya yapısı

| Dosya | Sorumluluk |
|---|---|
| `src/features/scale-models/walkingCollision.ts` (yeni) | `modelScene.ts`'ten taşınan saf çarpışma denetimi |
| `src/shared/xr/xrMotion.ts` (yeni) | Saf hesaplar: ölü bölge, yürüme, dönüş, rig konumu |
| `src/shared/xr/xrText.ts` (yeni) | Saf hesaplar: menü öğeleri, satır kırma, panel isabeti |
| `src/shared/xr/xrPanel.ts` (yeni) | Menü ve bilgi kartını `CanvasTexture` düzlemi olarak çizer |
| `src/features/scale-models/xrSession.ts` (yeni) | Oturum, rig, kumanda, ışın, görünüm geçişleri |
| `src/features/scale-models/modelScene.ts` | XR oturumunu bağlar, kare döngüsünde XR dalı açar |
| `src/features/heritage/components/ArtifactExplorer.tsx` | `VR'da aç` düğmesi, destek denetimi, hata mesajı |
| `tests/model-xr-logic.mjs` (yeni) | Saf modül testleri (`node`, Node'un yerleşik TS desteği, `tests/sword-logic.mjs` gibi) |
| `tests/model-xr-button.mjs` (yeni) | Sahte `navigator.xr` ile düğme ve hata akışı (Playwright) |

## Review Focus

1. **VR desteklemeyen tarayıcı veya reddedilen izin:** düğme görünmez ya da Türkçe hata çıkar, maket ekranda çalışmaya devam eder → Görev 2 testi.
2. **Oturumun Meta düğmesiyle dışarıdan kapanması:** görünüm, kamera, ışık ve arka plan masaüstü hâline döner, sekme donmaz → Görev 2 cihaz/emülatör kontrolü.
3. **Kumanda yok, tek kumanda veya `gamepad` boş:** hata fırlatılmaz; tek kumandayla menü kullanılabilir → Görev 3 testi.
4. **Joystick kayması ve basılı tutma:** ölü bölge altında hareket yok, anlık dönüş her itişte bir kez olur → Görev 3 testi.
5. **Uzun kart metni:** en uzun metin (`dogu-kapisi`, 280 karakter) ve kaynak satırı panele sığar, Türkçe harfler bozulmaz → Görev 5 testi.

---

### Görev 0: Temel durumu doğrula ve yükü ölç

**Files:** Kod değişikliği yok.

- [ ] **Adım 1:** `npm install` çalıştır; `git status` temiz kalmalı. `node -v` şu an v22.23.3, `HANDOFF.md` 24+ istiyor; uyumsuzluk çıkarsa kullanıcıya bildir.
- [ ] **Adım 2:** `npm run build` ve ayrı terminalde `npm run preview -- --port 4173`. Beklenen: hatasız.
- [ ] **Adım 3:** `node tests/model-interior.mjs`. Beklenen: `1000px` ve `360px` satırları geçer. Geçmezse dur ve bildir; bu branch `master`'a hiç alınmamış kod içeriyor.
- [ ] **Adım 4:** Maket açıkken dış ve iç görünümde `renderer.info.render.calls` ve `.triangles` değerlerini geçici olarak yazdırıp not al, geçici kodu geri al. Kaba bütçe: Quest 2 için stereo toplam ~1 milyon üçgen ve ~200 çizim çağrısı. Aşılıyorsa Görev 6'daki düşürme sırası baştan uygulanır.

### Görev 1: Saf hareket hesapları

**Files:**
- Create: `src/features/scale-models/walkingCollision.ts`, `src/shared/xr/xrMotion.ts`, `tests/model-xr-logic.mjs`
- Modify: `src/features/scale-models/modelScene.ts:185-192`

**Interfaces:**
- Produces:
  - `carpiyor(yurume: IcYurume, x: number, z: number, r: number): boolean`
  - `OYUNCU_YARICAP = 0.45` (`modelScene.ts`'ten buraya taşınır)
  - `oluBolge(d: number): number` — `|d| < 0.2` ise 0, üstü 0–1 aralığına yeniden ölçeklenir, işaret korunur
  - `XR_YURUME_HIZI = 1.6` (m/sn), `XR_DONUS = Math.PI / 6`
  - `yurumeAdimi(bas: {x,z}, ileriYon: {x,z}, cubuk: {x,y}, dt: number, engel: (x,z)=>boolean): {x,z}` — yeni baş konumu. `cubuk.y < 0` ileridir (WebXR). Eksen eksen dener, duvar boyunca kayar. `dt` en fazla 0.1 sayılır.
  - `anlikDonus(sagX: number, basili: boolean): { yon: -1|0|1; basili: boolean }` — `|x| > 0.7` iken bir kez tetikler, `|x| < 0.3` olunca yeniden silahlanır
  - `basCevresindeDon(rig: {x,z}, bas: {x,z}, aci: number): {x,z}` — `x' = (rx-bx)cos a + (rz-bz)sin a + bx`, `z' = -(rx-bx)sin a + (rz-bz)cos a + bz`
  - `masaRig(aci: number, olcek: number): {x,y,z,rotY}` — `MASA_Y = 0.9`, `MASA_UZAKLIK = 1.2`; `x = D sin a`, `y = -MASA_Y·olcek`, `z = -D cos a`, `rotY = π - a`, `D = MASA_UZAKLIK·olcek`
  - `MASA_OLCEK_ILK = 100`, `MASA_OLCEK_MIN = 40`, `MASA_OLCEK_MAX = 200`
  - `durakRig(konum: number[], bak: number[], basYerel: {x,z}, zeminY: number): {x,y,z,rotY}` — `rotY = atan2(-dx, -dz)`; rig konumu, başı `konum`un x/z'sine getirecek şekilde `basYerel`in `rotY` ile döndürülmüşünü çıkarır

- [ ] **Adım 1: Başarısız testi yaz** (`node:assert/strict`, `yakin` yardımcı işlevi 1e-6 toleransla)

```js
assert.equal(oluBolge(0.15), 0); assert.equal(oluBolge(-0.1), 0); assert.equal(oluBolge(1), 1); assert.equal(oluBolge(-1), -1)
const serbest = () => false
yakin(yurumeAdimi({x:0,z:0}, {x:0,z:1}, {x:0,y:-1}, 0.1, serbest), {x:0, z:0.16})
yakin(yurumeAdimi({x:0,z:0}, {x:0,z:1}, {x:0,y:-1}, 5, serbest), {x:0, z:0.16})   // dt sınırı
yakin(yurumeAdimi({x:0,z:0}, {x:1,z:0}, {x:0,y:0}, 0.1, serbest), {x:0, z:0})
yakin(yurumeAdimi({x:0,z:0}, {x:0.6,z:0.8}, {x:0,y:-1}, 0.1, (x) => x > 0), {x:0, z:0.128}) // duvar boyunca kayar
let d = anlikDonus(0.9, false); assert.deepEqual(d, {yon:1, basili:true})
d = anlikDonus(0.9, d.basili); assert.equal(d.yon, 0)
d = anlikDonus(0.1, d.basili); assert.equal(d.basili, false)
yakin(basCevresindeDon({x:1,z:0}, {x:0,z:0}, Math.PI/2), {x:0, z:-1})
const m = masaRig(0, 100); yakin(m, {x:0, y:-90, z:-120, rotY:Math.PI})
const k = durakRig([5,2.7,7], [5,2.7,20], {x:0,z:0}, 1.1); assert.equal(k.x, 5); assert.equal(k.y, 1.1); assert.equal(k.z, 7)
const y = { sinir:{x0:-10,x1:10,z0:-10,z1:10}, kutular:[{x0:1,x1:2,z0:1,z1:2}], daireler:[{x:-5,z:-5,r:1}], gorusKesenler:[], gozY:2.7 }
assert.equal(carpiyor(y, 0, 0, .45), false); assert.equal(carpiyor(y, 1.5, 1.5, .45), true)
assert.equal(carpiyor(y, -5, -5, .45), true); assert.equal(carpiyor(y, 9.9, 0, .45), true)
```

- [ ] **Adım 2:** `node tests/model-xr-logic.mjs`. Beklenen: modül bulunamadı hatası.
- [ ] **Adım 3:** İki modülü yaz. `modelScene.ts`'teki `carpiyor` kapanışını yeni işlevi çağıracak şekilde değiştir; davranış aynı kalır.
- [ ] **Adım 4:** `node tests/model-xr-logic.mjs` geçer; `npm run build` ve `node tests/model-interior.mjs` geçer.
- [ ] **Adım 5:** Commit: `Quest: saf hareket hesapları ve çarpışma modülü`

### Görev 2: VR oturumu ve düğme

**Files:**
- Create: `src/features/scale-models/xrSession.ts`, `tests/model-xr-button.mjs`
- Modify: `src/features/scale-models/modelScene.ts`, `src/features/heritage/components/ArtifactExplorer.tsx`

**Interfaces:**
- Consumes: `masaRig`, `MASA_OLCEK_ILK` (Görev 1)
- Produces:
  - `MaketSahnesi.xrBaslat(): Promise<void>` — reddedilirse Promise reddedilir
  - `SahneSecenek.xrDegisti?: (aktif: boolean) => void`
  - `xrOturumuKur({ renderer, scene, camera, ... }): { baslat(): Promise<void>; kare(dt: number): void; bitir(): void; rig: THREE.Group }`

- [ ] **Adım 1: Başarısız testi yaz** (`tests/model-xr-button.mjs`, `addInitScript` ile `navigator.xr` taklidi; `tests/model-interior.mjs`'teki `chrome` + swiftshader ayarları)
  - `xr_yok`: `navigator.xr` `undefined` → `VR'da aç` düğmesi yok, `İçeri gir` çalışır.
  - `destek_yok`: `isSessionSupported → false` → düğme yok.
  - `reddedildi`: `isSessionSupported → true`, `requestSession` `NotAllowedError` fırlatır → düğme görünür; tıklayınca `VR oturumu başlatılamadı. Maketi ekranda kullanmaya devam edebilirsin.` görünür; `İçeri gir` hâlâ etkin; konsol hatası yok.
- [ ] **Adım 2:** Testi çalıştır. Beklenen: `reddedildi` düğmeyi bulamaz.
- [ ] **Adım 3: Sahneyi bağla**
  - `renderer.xr.enabled = true`, `renderer.xr.setReferenceSpaceType('local-floor')`, `renderer.xr.setFoveation(1)`.
  - `navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor'] })` düğme tıklamasının içinde çağrılır; sonra `renderer.xr.setSession`.
  - Girişte: `icMekan(null)` ile dışarı çık, kamerayı rig'e ekle, `masaRig(0, MASA_OLCEK_ILK)` uygula, `scene.background`ı düz `#1a2b25` yap (doku arka plan VR'da başa yapışık görünür), rig'e 6 m yarıçaplı koyu zemin diski ekle (rig'in yerel y=0'ı).
  - `sessionend`te: kamerayı rig'den çıkar, `baslangic`/`baslangicHedef`, arka plan, `camera.near/far`, `boyutla()` ve `xrDegisti(false)` geri alınır.
  - Kare döngüsünün başında: `renderer.xr.isPresenting` ise OrbitControls, `composer`, uyarlamalı kalite ve `isaretleriKonumla` atlanır; `xr.kare(dt)`, `bilgiGuncelle()` ve `renderer.render(scene, camera)` çalışır. Katmanlar XR'da animasyonsuz anında hedefe gider ve gölge bir kez güncellenir.
  - `boyutla`nın başına `if (renderer.xr.isPresenting) return`. `temizle` içinde açık oturum varsa önce `session.end()`.
- [ ] **Adım 4: Düğmeyi ekle** `EseriEleAl.tsx`: `navigator.xr?.isSessionSupported('immersive-vr')` sonucunu state'e al, `maket-kontrol` içinde `VR'da aç` düğmesi; hata mesajı `maket-durum` + `aria-live` ile. Giriş öncesi `setDurak(null)`, `setParcali(false)`.
- [ ] **Adım 5:** `node tests/model-xr-button.mjs`, `node tests/model-interior.mjs`, `npm run build` geçer.
- [ ] **Adım 6: Emülatör kontrolü.** Chrome'da Immersive Web Emulator eklentisiyle: `VR'da aç` → maket önde ve masa yüksekliğinde; emülatörden oturumu kapat → masaüstü görünümü eski hâlinde, sürükleme çalışıyor. Rig ölçeği görüntüyü bozarsa rig yerine maket kökü ve `kaide` tek grupta 0,01 ölçeklenir, gölge kamerası da aynı oranda küçültülür.
- [ ] **Adım 7:** Commit: `Quest: WebXR oturumu ve VR'da aç düğmesi`

### Görev 3: Kumandalar ve maket görünümü

**Files:**
- Modify: `src/features/scale-models/xrSession.ts`, `tests/model-xr-logic.mjs`, `src/shared/xr/xrMotion.ts`

**Interfaces:**
- Consumes: `oluBolge`, `masaRig`, `MASA_OLCEK_*` (Görev 1), `rig` (Görev 2)
- Produces: `kumandaGirdisi(kaynaklar: Iterable<{handedness: string; gamepad?: {axes: readonly number[]; buttons: readonly {pressed: boolean}[]}}>): { solX, solY, sagX, sagY, menu: boolean }` (`xrHareket.ts`). Quest'te çubuk `axes[2]`, `axes[3]`; menü `buttons[5]` (B/Y). Tek kumanda varsa onun çubuğu hem sağ hem sol sayılır.

- [ ] **Adım 1: Başarısız test ekle**
  - Boş dizi → tüm değerler 0, `menu:false`.
  - `gamepad` yok → hata yok, 0.
  - `axes` yalnız 2 elemanlı → hata yok, 0.
  - Tek sağ kumanda `axes:[0,0,.5,-.8]` → `sagX=.5`, `solY=-.8`.
  - İki kumanda → her el kendi eksenine yazar.
- [ ] **Adım 2:** Test başarısız olur.
- [ ] **Adım 3:** `kumandaGirdisi`yi yaz. `xr.kare` içinde maket görünümünde: `oluBolge(sagX)` ile `aci += x·dt·1.2`, `oluBolge(sagY)` ile `olcek *= exp(y·dt·1.2)`, `MASA_OLCEK_MIN..MAX` arası sınırla, `masaRig` uygula.
- [ ] **Adım 4:** Testler geçer; emülatörde çubukla maket döner ve büyür/küçülür.
- [ ] **Adım 5:** Commit: `Quest: kumanda girdisi ve maket görünümü`

### Görev 4: İç mekânda yürüme

**Files:**
- Modify: `src/features/scale-models/xrSession.ts`, `src/features/scale-models/modelScene.ts`, `src/features/scale-models/uluMosqueInterior.ts` (yalnız döşeme yüksekliğini dışa açmak için)

**Interfaces:**
- Consumes: `yurumeAdimi`, `anlikDonus`, `basCevresindeDon`, `durakRig`, `carpiyor`, `kumandaGirdisi`
- Produces: `xr.gorunum(durakId: string | null): void`. `null` maket görünümü, id o durakta 1× ölçek. `ZEMIN_Y`: iç döşemenin üst yüzü, `uluMosqueInterior.ts`'ten dışa açılır (masaüstündeki `gozY = 2.7` oturan veya ayaktaki gerçek kullanıcıya uymaz, VR'da göz yüksekliğini cihaz verir).

- [ ] **Adım 1:** `bilgiGuncelle` içindeki `camera.position` okumalarını `bakisKonumu()` üzerinden yap: XR'da `camera.getWorldPosition`, değilse `camera.position`. Masaüstü testi değişmeden geçer.
- [ ] **Adım 2:** `icMekan` içindeki ışık, ortam, `iceride` geçişlerini kameraya dokunmayan `icDurumu(iceride: boolean)` işlevine ayır; `icMekan` onu çağırır. `node tests/model-interior.mjs` geçer.
- [ ] **Adım 3:** `xr.gorunum` ve `kare`deki iç dalı yaz: sol çubukla `yurumeAdimi(bas, ileriYon, ...)`, engel `carpiyor(yurume, x, z, OYUNCU_YARICAP)`, çıkan farkı rig'e uygula. Sağ çubukla `anlikDonus` + `basCevresindeDon` ve `rotY += aci`. Hareket yalnızca çubuktan denetlenir; odada fiziksel yürüyüp duvar içinden geçme kapsam dışıdır.
- [ ] **Adım 4:** Geçici olarak emülatörde durak açıp doğrula: başlangıçta döşemede duruluyor, `giris` durağında güneye bakılıyor, ileri itince duvarda duruluyor.
- [ ] **Adım 5:** `npm run build`, `node tests/model-xr-logic.mjs`, `node tests/model-interior.mjs` geçer.
- [ ] **Adım 6:** Commit: `Quest: iç mekânda çubukla yürüme ve anlık dönüş`

### Görev 5: Menü ve bilgi kartı panelleri

**Files:**
- Create: `src/shared/xr/xrText.ts`, `src/shared/xr/xrPanel.ts`
- Modify: `src/features/scale-models/xrSession.ts`, `src/features/scale-models/modelScene.ts`, `tests/model-xr-logic.mjs`

**Interfaces:**
- Consumes: `xr.gorunum` (Görev 4), `parcala`, `kaynakMetni` (`KaynakSatiri.tsx`), `SahneSecenek.bilgiler`
- Produces:
  - `SahneSecenek.kaynaklar?: Kaynak[]`
  - `menuOgeleri(d: { iceride: boolean; parcali: boolean; duraklar: {id,ad}[] }): {id: string; ad: string}[]` — dışarıda `iceri`→"İçeri gir", `parcala`→"Parçala" veya "Birleştir", `cik`→"VR'dan çık". İçeride `disari`→"Dışarı çık", her durak `durak:<id>`, `cik`.
  - `satirKir(metin: string, olc: (s: string) => number, genislik: number): string[]`
  - `menuIsabet(v: number, ogeSayisi: number, baslikOrani: number): number | null` — `v` uv değeri (1 üst); başlık bandına düşerse `null`
  - `xrPaneli(...)`: `{ nesne: THREE.Mesh; ciz(ogeler): void; dispose(): void }`; `bilgiPaneli(...)`: `{ nesne; goster(baslik, metin, kaynak): void; gizle(): void; dispose(): void }`

- [ ] **Adım 1: Başarısız test ekle**
  - `menuOgeleri` dışarıda `['iceri','parcala','cik']`; `parcali:true` iken `Birleştir`.
  - İçeride 8 durak için 10 öğe, ilk `disari`, son `cik`.
  - `satirKir` sahte ölçüyle (`s => s.length`) sözcük bölmez; 100 karakterlik sözcükten taşmaz (sert böler).
  - `ulu-camii.json`'daki tüm `icBilgiler` metni, kaynağıyla birlikte, karakter başına 0,55 × 34 px ölçüyle 900 px genişlikte en fazla 13 satır olur.
  - `menuIsabet(0.95, 3, 0.2)` → `null`; `menuIsabet(0.75, 3, 0.2)` → `0`; `menuIsabet(0.05, 3, 0.2)` → `2`.
- [ ] **Adım 2:** Test başarısız olur.
- [ ] **Adım 3:** `xrMetin.ts` ve `xrPanel.ts`'i yaz. 1024 px canvas, `MeshBasicMaterial`, `toneMapped:false`, kalın sans-serif, açık zemin üstüne koyu yazı. Menü başlığında sabit metin: `Temsilî maket · Gerçek bir 3B tarama değildir`.
- [ ] **Adım 4:** `xrOturum.ts`'e bağla:
  - İki `renderer.xr.getController(i)` rig'e eklenir, her birinde ince ışın çizgisi.
  - `select` olayında `Raycaster` menü ve karta bakar. `uv.y` → `menuIsabet` → eylem. Karta tıklamak `bilgiKapat()` çağırır.
  - B/Y menüyü açıp kapatır; oturum açılışında menü açıktır.
  - Paneller rig çocuğudur, açıldığı anda başın 1,3 m önünde ve başa dönüktür; rig ölçeğiyle doğru boyutta kalır.
  - Kart `bilgiDegisti` tetiklenince `maket.icBilgiler` + `kaynakMetni` ile `Kaynak: …` satırını da çizer; kaynak bulunamazsa `Kaynak bilgisi bulunamadı.`
  - `cik` → `session.end()`. Dokular `temizle`de `dispose` edilir.
- [ ] **Adım 5:** Testler ve `npm run build` geçer; emülatörde her menü öğesi ve kart denenir.
- [ ] **Adım 6:** Commit: `Quest: VR menüsü ve kaynaklı bilgi kartları`

### Görev 6: Gerçek cihazda doğrulama ve belgeler

**Files:**
- Modify: `HANDOFF.md` (Ulu Camii maketi paragrafının altına; yalnız bu branch'te)

**Ön koşul:** Quest cihazı, geliştirici modu, USB kablo, bilgisayarda `adb`. Cihaz yoksa bu görev yapılamaz; özellik "yalnız emülatörde denendi" olarak bildirilir.

- [ ] **Adım 1:** `npm run build && npm run preview -- --port 4173`, `adb reverse tcp:4173 tcp:4173`, Quest Browser'da `http://localhost:4173/artifact/ulu-mosque`. Beklenen: `VR'da aç` görünür (`localhost` güvenli sayılır, HTTPS gerekmez).
- [ ] **Adım 2:** Geçici `?xrolcum=1` ile menü başlığına FPS yaz. Dış görünüm, şadırvan ve mihrapta oku, not al.
- [ ] **Adım 3:** 72 FPS altındaysa sırayla uygula, her adımda yeniden ölç, hedefi tutan ilk adımda dur:
  1. XR'da `renderer.shadowMap.enabled = false` ve malzemeler güncellenir.
  2. İç ışıkları 4'ten 2'ye indir.
  3. `renderer.xr.setFramebufferScaleFactor(0.8)`.
  Hâlâ yetmiyorsa dur ve kullanıcıya rakamlarla bildir; model sadeleştirme ayrı iştir.
- [ ] **Adım 4:** Elle kontrol listesi:
  - [ ] Maket doğru boyut ve yükseklikte
  - [ ] Çubukla çevirme ve büyütme
  - [ ] Parçala/Birleştir
  - [ ] İçeri gir, tüm duraklar
  - [ ] Yürüme ve duvar çarpışması
  - [ ] Anlık dönüş
  - [ ] Kart okunuyor, Türkçe harfler doğru, kaynak görünüyor
  - [ ] Tek kumandayla menü
  - [ ] Meta düğmesiyle çıkış sonrası sayfa çalışıyor
  - [ ] 10 dakika sonra aşırı ısınma/donma yok
- [ ] **Adım 5:** `?xrolcum` kodunu kaldır. `HANDOFF.md`'ye kısa paragraf: kullanım, `adb reverse` komutu, ölçülen FPS, cihaz modeli, test komutları.
- [ ] **Adım 6:** Tam regresyon: `npm run build`, `node tests/model-xr-logic.mjs`, `node tests/model-xr-button.mjs`, `node tests/model-interior.mjs`, `node tests/end-to-end.mjs chromium 1280`.
- [ ] **Adım 7:** Commit: `Quest: cihaz ayarları ve DEVAM notu`

## Açık riskler

- **Takvim:** Kod dondurma 4 Kasım akşamı. Bu çalışma ayrı branch'te yürür; `master`'a alınmasına, maket branch'inin kaderiyle birlikte kullanıcı karar verir. Görev 3 sonunda maket görünümü tek başına gösterilebilir, Görev 4-5 iç mekânı ekler.
- **Performans ölçülmedi:** Yöntem Görev 0 ve 6'da; dokular kodla üretiliyor (`uluMosqueTextures.ts`), Quest'te açılış süresi de uzun olabilir.
- **Rig ölçeği:** 100× rig yaklaşımı cihazda denenmedi; yedeği Görev 2 Adım 6'da.
- **Baş dönmesi:** Yürüme hızı 1,6 m/sn ve anlık dönüşle sınırlandı, gerçek kişilerle denenmeli.
