# KökXR — Meta Quest çalışması devir notu

> **Eski not.** Güncel durum ve sıradaki işler `PLAN.md` dosyasındadır; burayı yalnız VR teknik ayrıntıları ve yük ölçümleri için kullan. "Sıradaki işler" ve test durumu bölümleri artık geçerli değil.

> Yazıldı: 4 Kasım 2026 akşamı. Kullanıcı bilgisayar değiştirdiği için çalışma burada durduruldu.
> **Yeni oturumdaki yapay zekâ ajanına:** Önce bu dosyayı, sonra `AGENTS.md`, `HANDOFF.md` ve
> `docs/superpowers/plans/2026-11-04-ulu-mosque-quest.md` dosyalarını oku. Ardından "Sıradaki işler" bölümünden devam et.
> Kullanıcıyla Türkçe konuş.

## Yeni bilgisayarda başlangıç

Gerekenler: Git, Node.js, npm, Google Chrome. `HANDOFF.md` Node 24+ istiyor; aşağıdaki sonuçlar v22.23.3 ile alındı.

```bash
git clone https://github.com/selamisimsek/kokxr.git   # depo private; erişim gerekir
cd kokxr
git switch ulu-camii-quest
npm install
git restore package-lock.json   # npm sürümü lock dosyasını değiştirirse; bağımlılık değişikliği yok
claude "QUEST-HANDOFF.md dosyasını oku ve Sıradaki işler bölümünden devam et"
```

Uygulamayı açmak için:

```bash
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
# http://127.0.0.1:5173/artifact/ulu-mosque
```

Chrome'a **Immersive Web Emulator** eklentisini yeniden kurmak gerekir (eski bilgisayarda kuruluydu).

## Ne yapılıyor

Kullanıcı Ulu Camii'yi Meta Quest'e uyarlamak istedi ve yeni branch açılmasını söyledi. Daha önce projede VR görevi yoktu; VR "yapılmayacak / vizyon" olarak kayıtlıydı (`docs/plan.md:44`). Bu çalışma o kararı bu branch'te bilinçli olarak değiştiriyor.

Deneyim: Quest Browser'da `VR'da aç` → masa üstünde maket (çevir, büyüt, parçala) → `İçeri gir` → gerçek ölçekte yürü → yapıya yaklaşınca kaynaklı bilgi kartı → çık.

Yöntem: Mevcut Three.js sahnesine WebXR. Unity yok, yeni bağımlılık yok. Kullanıcı "daha uygulanabilir bir şey bulursan onu da yap" dedi; şu ana kadar WebXR'dan daha uygulanabilir bir yol bulunmadı.

## Kullanıcı kararları ve açık sorular

Kullanıcının söyledikleri:
- Ulu Camii uyarlansın, yeni branch açılsın.
- Önce plan yapılsın, sonra işi rollere ayrılmış küçük ajanlar aynı anda yapsın; işi tamamen AI yapacak.
- Commit ve push atılabilir.

Kullanıcıdan **henüz cevap gelmeyenler**:
- Elde Quest var mı, hangi model? (Plan Quest 2 veya üstü varsayıyor.)
- Plandaki "Varsayımlar" bölümü açıkça onaylanmadı; kullanıcı "yapsınlar" diyerek devam ettirdi.
- Emülatör denemesinin sonucu. Eklentiyi kurdu, adres verildi, sonuç yazmadan bilgisayar değiştirdi.
- VR gösterimi şartnamede veya jüri beklentisinde zorunlu mu? Şartname (`proje bilgileri/`) bu bilgisayarda yoktu, kontrol edilemedi.
- Bu branch ve `ulu-camii-maket` `master`'a alınacak mı? `master`'a dokunulmadı. `HANDOFF.md`'ye göre kod dondurma 4 Kasım akşamı, final 7–8 Kasım.
- Paylaşılan bağlantılarla ne yapılacağı. Açılmadı; bu plan yeni içerik gerektirmiyor:
  - Envanter yayınları: https://www.vakifkatilim.com.tr/tr/hakkimizda/medya-merkezi/yayinlarimiz
  - Fotoğraf arşivi: https://drive.google.com/drive/folders/1U-C6TeECHhlx5C15G_rhgx5f_-iJbXlM

## Git durumu

- Branch: `ulu-camii-quest`, `origin/ulu-camii-maket` (`57722ed`) üzerinde. O commit `master`'da olmayan yeni maketi (iç mekân, yürüme) içerir.
- `9f70588` plan, `90fbd33` saf modüller. Sonraki commit bu not ve yarım kalan bağlama kodudur (**WIP**).
- Yerelde kalan `calisma` branch'i boştur, `master` ile aynıdır ve push edilmedi. Önemi yok.

## Dosyalar ve durumları

| Dosya | İçerik | Durum |
|---|---|---|
| `src/features/scale-models/walkingCollision.ts` | Saf çarpışma | Tamam, testli |
| `src/shared/xr/xrMotion.ts` | Ölü bölge, yürüme, dönüş, rig, kumanda girdisi | Tamam, testli |
| `src/shared/xr/xrText.ts` | Menü öğeleri, satır kırma, isabet | Tamam, testli |
| `src/shared/xr/xrPanel.ts` | Menü ve bilgi kartı (`CanvasTexture`) | Tamam; ekran görüntüsüyle bakıldı |
| `src/features/scale-models/xrSession.ts` | Oturum, rig, kumanda, ışın, görünüm geçişi | Yazıldı; yalnız sahte `renderer.xr` ile denendi, o betik repoda değil |
| `src/features/scale-models/modelScene.ts` | XR bağlantısı, `icDurumu`, `bakisKonumu` | **Doğrulanmadı**, ajan rapor veremeden durduruldu |
| `src/features/heritage/components/ArtifactExplorer.tsx` | `VR'da aç`, destek denetimi, hata mesajı | **Doğrulanmadı** |
| `src/features/scale-models/uluMosqueInterior.ts` | `ZEMIN_Y` eklendi | Tip denetiminden geçti |
| `tests/model-xr-button.mjs` | Sahte `navigator.xr` ile düğme testi | **Sonucu bilinmiyor** |

## Test durumu (eldeki gerçek sonuçlar)

Son hâlde çalıştırılıp geçenler:
- `npx tsc --noEmit -p tsconfig.app.json`: hata yok
- `npx vite build`: başarılı (geçici klasöre)
- `node tests/model-xr-logic.mjs`: geçti
- `node tests/model-xr-text.mjs`: geçti, en uzun kart 10 satır (sınır 13)

**Sonucu bilinmeyenler:**
- `tests/model-xr-button.mjs` ve değişiklik sonrası `tests/model-interior.mjs`. Ajan bunları çalıştırıyordu, durduruldu ve rapor gelmedi. Yeniden çalıştırılmalı.
- VR'ın kendisi: emülatörde veya Quest'te çalıştığını henüz kimse doğrulamadı.

VR değişikliklerinden **önceki** kodda (`57722ed`) `tests/model-interior.mjs` geçti (yaklaşık 7 dakika sürüyor). Yani o testte yeni kırmızı çıkarsa neden büyük ihtimalle bu branch'teki değişikliktir.

## Yük ölçümü (`57722ed`, yazılımsal çizim)

| Ölçü | Dış | İç |
|---|---|---|
| Tek göz çizim çağrısı | 63 | 48–57 |
| Tek göz üçgen | ~401 bin | ~394–399 bin |
| Stereo tahmini çağrı / üçgen | ~126 / ~802 bin | ~114 / ~798 bin |

- 61 mesh, 50 malzeme, instancing yok, en büyük tek geometri 135.360 üçgen.
- Gölgeli karede çağrı ve üçgen yaklaşık iki katı (122 / 802 bin), ama gölge haritası durağan, her karede çizilmez.
- 41 doku, en büyüğü 2048×1024, yaklaşık 103 MB (mip dahil). 29'u kodla üretiliyor.
- Masaüstü gölge haritası 4096, Quest'te `hover: none` ise 2048 olmalı; cihazda doğrulanmadı.
- Sahne oluşturma yazılımsal çizimde 4–8 sn; bu Quest süresi değildir.

Yorum: Plandaki kaba bütçenin (stereo ~1 milyon üçgen, ~200 çağrı) içinde ama üçgende sınıra yakın. Asıl riskler dört iç ışık, malzeme sayısı, doku belleği ve açılış süresi. Kare hızı cihazda ölçülmedi.

## Kod okurken bilinmesi gerekenler

- `yurumeAdimi` ölü bölgeyi kendi uygular; çağırmadan önce `oluBolge` uygulama.
- `anlikDonus` sağa itişte `yon: 1` döndürür, pozitif `rotY` sola çevirir. Bu yüzden `aci = -yon * XR_DONUS`; aynı `aci` hem `basCevresindeDon`'a hem `rotY`'ye gider.
- `camera.position` XR'da rig yerelidir, dünya konumu için `getWorldPosition` kullan. Baş pozu ilk render'a kadar güncel değildir, `xr.getCamera()` üzerinden okunur.
- Rig 100× ölçekliyken near 0,05 m yaklaşık 5 sahne birimine denk gelir. Oturum kapanınca near/far'ı Three.js geri almaz, `oturumBitti` alır.
- Karta ışınla isabet yalnız `bilgiKapat()` çağırır; kartı `bilgiDegisti(null)` → `xr.bilgiGoster(null)` zinciri gizler.
- `xr.kare(dt)` render'dan önce çağrılmalı. `temizle` açık oturumda `oturumBitti` çağırmaz.
- Paneller `depthTest=false`, menü 1,34 m, kart 1,30 m uzakta; ışın önce karta çarpar.
- `ciz` ve `goster` dokuyu yeniden yükler, kare döngüsünde çağırma.
- Panel öğeleri için `bilgiPaneli()` gizli, `xrPaneli()` görünür başlar.
- Testler plandan farklı olarak iki dosyadadır: `maket-xr-mantik.mjs`, `maket-xr-metin.mjs`.

## Bilinen sorunlar

1. **Tek kumanda:** İç mekânda aynı çubuk hem yana kaydırıyor hem döndürüyor (`kumandaGirdisi` + `xrOturum`). Düzeltilmedi. Öneri: tek kumandada sağa/sola itiş yalnız dönüş olsun.
2. **Görev 3 kısmı:** Maketi çevirme ve büyütme yazıldı, emülatörde görülmedi.
3. **Doğrulanamayanlar (cihaz gerekir):** rig ölçeğinin görsel doğruluğu, `axes[2/3]` ve `buttons[5]` eşlemesi, `local-floor` ile `ZEMIN_Y` uyumu, panel okunurluğu, stereo konfor, 72 FPS.

## Sıradaki işler

1. **Doğrula:** `npm run build`, `npm run preview -- --port 4173 --strictPort`, ardından `node tests/model-xr-button.mjs` ve `node tests/model-interior.mjs`. Hata varsa düzelt.
2. **Kullanıcıya sor:** Quest modeli var mı ve emülatörde ne gördü?
3. **Emülatörde kullanıcıyla dene:** VR'a giriş, sağ çubuk, menü, `İçeri gir`, sol çubuk, bilgi kartı, çıkış. Sıra: plan Görev 2 Adım 6, Görev 3 Adım 4, Görev 4 Adım 4, Görev 5 Adım 5.
4. **Tek kumanda sorununu düzelt.**
5. **Gerçek cihaz (plan Görev 6):** Quest'te geliştirici modu, USB, `adb`. `adb reverse tcp:4173 tcp:4173`, sonra Quest Browser'da `http://localhost:4173/artifact/ulu-mosque`. FPS ölç; 72 altındaysa plandaki düşürme sırası.
6. **Düşük maliyetli yedek:** Mevcut 360TR turunu Quest Browser'da dene (kod gerekmez, internet gerekir, henüz denenmedi). Performans yetmezse serbest yürümeyi kapatıp masa üstü maket + durak geçişiyle devam et.
7. **Bitirirken:** `HANDOFF.md`'ye kısa paragraf ekle. `master`'a birleştirmeyi kullanıcıya sormadan yapma.

Kullanıcıya verilen süre tahmini: kalan kod ve birleştirme 20–40 dk, cihaz denemesi ve FPS ayarı 1–2 saat. Tahmindir, ölçüm değildir.

## Kurallar

- `AGENTS.md`: Arayüz Türkçe. Tarihsel bilgi uydurma. Verisi olmayan 3B/VR'ı varmış gibi gösterme. Görev kapsamı dışına çıkma, her aşamada test et.
- VR'da `Temsilî maket · Gerçek bir 3B tarama değildir` etiketi görünür kalmalı.
- Repo private kalmalı; arşiv fotoğraflarının izni netleşmedi, herkese açık yayın yok.
- Yeni bağımlılık ekleme. Commit veya push yalnız kullanıcı izniyle; bu çalışma için izin verildi.

## Eski bilgisayarda kalanlar

Git'e girmedi, gerekmez:
- `.claude/worktrees/agent-a7b935c7767014bf5`: ölçüm ajanının geçici kopyası ve ham kayıtları (`test-sonuclari/g0-*`, `maket-ic-*.png`). Sonuçlar bu dosyaya işlendi. Silmek için depo kökünde: `git worktree remove --force .claude/worktrees/agent-a7b935c7767014bf5 && git branch -D worktree-agent-a7b935c7767014bf5`
- Ajanların geçici deneme betikleri ve panel ekran görüntüleri oturumun geçici klasöründeydi.
