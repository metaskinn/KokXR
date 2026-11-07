# Görev 5 — Kılıç atölyesi (`/atolye/kilic`)

**Atanan:** Codex CLI
**Önce oku:** `AGENTS.md`, `docs/kilic-atolyesi.md`, `docs/ui-tasarim.md`, `src/data/kilic.ts`, `src/pages/VazoAtolyesi.tsx`, `src/components/maket/vazoSahnesi.ts`

Kullanıcı isteği: "Vazo benzeri, gerçekçi; demiri alıp en baştan Fatih Sultan Mehmed'in kılıcını yapalım, sonra test edelim. En iyi tasarım, kaliteli, yeni nesil." Sıradan bir sayfa değil, **sinematik, tam ekran hissi veren** bir deneyim.

## Dokunma

`scripts/`, `assets/`, `public/`, `src/data/`, `proje bilgileri/`, `_eski/`. **Tarihsel metin yazma**: tüm tarihsel/kaynaklı metin `src/data/kilic.ts`'ten gelir. Gerekirse yalnızca arayüz/oyun metni ekle (tarih iddiası içermeyen). "360°", "VR", "birebir", "gerçek kılıç" gibi yanıltıcı ifade kullanma. `kilicTanitim.durustluk` metni sayfada her zaman görünür olmalı.

## Dosyalar

- `src/pages/KilicAtolyesi.tsx`, `src/pages/kilic.css`
- `src/components/kilic/sahne.ts` (dinamik import; renderer, ışık, kamera, olaylar)
- `src/components/kilic/dovme.ts` (namlu deformasyonu), `durum.ts` (saf oyun mantığı, DOM/three yok), `parcacik.ts`, `ses.ts`, `test.ts`
- `App.tsx`: rota ve üst menüde "Kılıç atölyesi"; `AnaSayfa.tsx`: vazo tanıtımının altına aynı dilde tanıtım bölümü (`kilicTanitim`).
- `tests/kilic.mjs` (Chromium, 1280 ve 360 px; `TEST_URL`, varsayılan `http://127.0.0.1:4173`; `channel` belirtme).
- Three.js yalnızca sayfa açılınca yüklensin. Yeni bağımlılık ekleme.

## Modeller (hazır)

`public/modeller/kilic.glb`: `Namlu`, `Namlu_Kakma`, `Balcak`, `Sap`, `Kabza_Sol`, `Kabza_Sag`, `Percin_1..4`. Birim metre. Başlangıç balçak merkezi; namlu +X, **sırt +Y (ağız −Y)**, kalınlık Z.

`public/modeller/kilic-atolye.glb`: düğüm adlarını (Blender → glTF: x→x, z→y, y→−z) kullan. Ana konumlar (glTF):
- Ocak ağzı / kor `Kor`: (−2.25, 0.95, −2.02); `Koruk_Deri` körük (−3.7, ~0.78, −1.75) (basınca ölçekle)
- Örs `Ors` üst yüzü: (0, 0.876, −0.1); `Cekic_Bas`, `Masa_1`
- Su `Su` (1.95, 0.40, 0.15); `Bileme_Tasi` (3.05, 0.82, −1.2), z ekseni çevresinde döndür; `Tezgah_Ust` (2.9, 0.86, −2.5); `Kilic_Yumurtasi` (2.8, 0.93, −2.5)
- Test alanı x=14 civarı: `Avlu_Zemin`, `Avlu_Duvar`, `Hasir_Rulo`/`Hasir_Direk`/`Hasir_Kaide` (12, 0, 0), `Test_Kutuk` (14, 0.74, −0.1), `Test_Kumas` (16.15, 1.95, −0.1)

Doku yok sayılan yer olmasın. `Kor` emissive şiddetini körükle değiştir.

## Dövme deformasyonu (`dovme.ts`) — projenin kalbi

`Namlu` geometrisinde `uv1` (TEXCOORD_1): `u = uv1.x` (kabzadan uca 0–1), `a = 1 - uv1.y` (halka çevresi). Bitmiş biçim POSITION'dadır. Blender merkez ekseni: `Cf(u) = (1.06·u, 0.070·u^2.3, 0)` (glTF'te Y=eğrilik). Her köşe için `Fsec = P_son − Cf(u)`.

12 bölge: her birinin `ilerleme p` (0–1), `isi` (°C benzeri 20–1200), `cilt` (bileme 0–1), `kabuk` (oksit 0–1). Köşe başına bölgeler arası doğrusal ara değer, `s(p)=smoothstep`:

- Külçe kesiti: `Bsec(a) = (0, cos(2πa)·W, sin(2πa)·T)`, `W=.024, T=.018`; yumurta biçimi için `·sqrt(max(1-(2u-1)^2, .02))^.75`.
- Her bölgenin uzunluğu `L_i = mix(L0/12, 1.06/12, s(p_i))`, `L0=.20`. Eksen: `X(u)` bu uzunlukların birikimli toplamı (bölge içi ara değer); `Y(u) = Cf(u).y · s(ortalama p)`; böylece külçe **gerçekten uzar**. Sapın (`u=0`) yeri sabit kalır; dövme sırasında kılıcı örsün üstünde vurulan bölge çekicin altına gelecek şekilde kaydır.
- `P = (X(u), Y(u), 0) + mix(Bsec, Fsec, s(p))`. Yüzey kabarıklığı için `p<1` iken küçük, darbe yerinden gelen çekiç izi (vertex offset gürültü) ekle; `p→1` iken sönsün.
- Köşe güncellemesi yalnız değişen bölgeler için, `computeVertexNormals` yerine: külçede küresel normali, bitmişte orijinal normali `s(p)` ile karıştır (ucuz ve dikişsiz).

Malzeme `onBeforeCompile`: köşe özellikleri `aIsi`, `aKabuk`, `aCilt`. Fragment: `isi` için siyah cisim rengi (≈500°C koyu kiraz → 800 turuncu → 1100 sarı-beyaz), emissive çarp; `kabuk` taban rengini koyu yap, metalness ve pürüz değiştir (gürültü desenli); `cilt` pürüzü düşürür. Yani kılıç ısındıkça kızarır, kabuk bağlar, bilendikçe parlar. **`Namlu_Kakma`, `Balcak` vb. yalnızca Kuşanma aşamasında görünür.**

## Akış (`durum.ts`, kaydedilmez, her yenilemede baştan)

Üstte ince aşama şeridi. Her aşama: kısa yönerge, ilgili `kilicAsamaBilgileri` metni + `Kaynak:` satırı, ve **"Ustaya bırak"** düğmesi (o aşamayı orta kalitede otomatik, animasyonlu tamamlar; jüri demosu için). Ayrıca "Baştan başla" ve ses aç/kapat.

| Aşama | Etkileşim | Kural |
|---|---|---|
| 1 Külçe | Tezgâhtaki `Kilic_Yumurtasi`'na tıkla, maşayla ocağa uçar | — |
| 2 Isıtma | Körüğü basılı tut (fare/parmak; klavye Boşluk). Sıcaklık çubuğu + gerçek renk | Körüksüz yavaş ısınır. >1180 yanma: kalite düşer, uyarı |
| 3 Dövme | Kılıç örse gelir. Tıkla/sürükle: vurulan bölge imleçten seçilir; çekiç gerçek bir yay çizip iner, kıvılcım, ses, kamera sarsıntısı | Darbe etkisi sıcaklığa bağlı: 750–1150 tam; 550–750 yarım; <550 etkisiz, `gerilim` artar, >1 çatlak riski. Soğuyunca "Yeniden ısıt". Tüm bölgeler p≥.98 olunca biter |
| 4 Su verme | Tüm namlu ısınır, "Suya daldır" düğmesi basılı tutulur; buhar, tıslama | En iyi 780–880. Yüksek: çatlak olasılığı/kalite düşer. Düşük: sertlik düşer |
| 5 Bileme | Kılıç taşa gelir, taş döner. Bölge bölge imleci namlu boyunca sürdür; kıvılcım | `cilt` artar. Fazla aynı yerde kalma ısıtır: 'yanma' cezası |
| 6 Kuşanma | Sırayla `Balcak`, `Kabza_Sol`, `Kabza_Sag`, `Percin_*`'i tıkla: animasyonla yerine gelir; sonra altın bant (alpha kararı) yavaş belirir. Kolektif yapım notu | — |
| 7 İnceleme | OrbitControls + yakınlaştırma, ışıklı sunum. `kilicParcaNotlari` numaralı noktalar (three vektörü→ekran koordinatı HTML düğme), tıklayınca panel + kaynak. Kalite kartı. Altında "Test alanına geç" | — |
| 8 Test alanı | Kamera avluya gider (gündüz ışık). Üç hedef: `Hasir_Rulo`, `Test_Kutuk`, `Test_Kumas`. Hedef seç, sahnede sürükleyerek kesim çizgisi çiz (kılıç o yönde savrulur, iz efekti) | Aşağıda |

**Kalite:** `sertlik` (su verme), `keskinlik` (bileme), `biçim` (dövme sıcaklığı/gerilim), `yanma` cezaları. Ustaya bırak = hepsi ~.6. Çatlak varsa çizgi görünür (kötü), yine de test edilebilir, kırılabilir.

**Kesim:** `güç = keskinlik·.55 + sertlik·.45`, kesim çizgisi açısı dikse/yataysa ve hızlıysa +. Hasır: güç≥.35 ikiye ayrılır (klon + `material.clippingPlanes`, üst parça düşer, basit yerçekimi + zemin). Kütük: güce göre iz derinliği, ≥.8 yarıya kadar; asla "ikiye bölünmedi" der. Kumaş (gevşek): güç≥.72 kesilir, altta kalıyorsa sadece sallanır. Kuvvetsiz denemede çelik sesi, kıvılcım, gerekirse çentik. Puan kartı + kazanılırsa "Kılıç Ustası" rozeti (`rozetKazan('kilic-ustasi')` yerine bu sayfada yerel gösterim yeterli; App'teki `rozetKazan`'ı prop ile alabilirsin). "Hedefleri yenile".

## Görsel kalite (yeni nesil)

- Renderer: `ACESFilmicToneMapping`, `SRGBColorSpace`, `PCFSoftShadowMap`, `Antialias`, `EffectComposer` + `RenderPass` + `UnrealBloomPass` (hafif, ısınınca belirgin) + `OutputPass`. `RoomEnvironment` + PMREM, atölyede düşük yoğunluk, avluda yüksek.
- Atölye karanlık, ocak `PointLight` titrer (`Math.sin` + gürültü) ve ısıya göre kuvvetlenir; ısınan namlu da küçük ışık saçar. Sahne loşluğu sinematik, ama nesneler okunur.
- Kıvılcım: `THREE.Points` havuzu, yerçekimi, ömürle renk; buhar/duman: yumuşak sprite havuzu (canvas radial gradient). Bloom kıvılcımı parlatır. Ocağın üstünde hafif kor parçacıkları.
- Sinematik kamera: aşama değişiminde 1,2 sn yumuşak geçiş; hedef konumlar atölyede sen seç, her aşamada asıl nesne net görünsün.
- Dokunuş: küçük imleç vurgusu (`Raycaster` ile hover: nesnenin emissive'i hafif artar, imleç değişir).
- `ses.ts`: dosya yok, `WebAudio` ile üret: çekiç (sinüs/kare kısa çın + gürültü), ocak uğultusu (filtreli gürültü, körükle artar), su tıslaması, bileme (bant gürültü), kesim (hızlı süpürme), çelik "ting". Varsayılan açık ama ilk kullanıcı etkileşiminde başlar; kapatılabilir.
- Arayüz: sahne tam genişlik ve ekran boyu; kontroller camsı koyu paneller, bronz vurgu (`docs/ui-tasarim.md` renkleri ile uyumlu). Masaüstünde yan panel, telefonda alt çekmece. Tam ekran düğmesi.

## Erişilebilirlik ve sağlamlık

Her etkileşimin klavye karşılığı (bölge seçimi ←→, Enter vur; Boşluk körük; Kesim için hedef + "Kes" düğmesi). `aria-live` aşama/sonuç duyuruları, görünür odak, ≥44 px dokunma, 360 px taşma yok. `prefers-reduced-motion`: sarsıntı ve parçacık az, kamera geçişi kısa. WebGL yok/yükleme hatası: anlaşılır mesaj. Sekme gizlenince döngü durur. Rota değişince her şey `dispose`, olaylar temizlenir, ses durur. FPS düşerse `pixelRatio` ve bloom kademeli azalır.

## Bitti sayılması için

- `npm run build` hatasız; `node tests/uctan-uca.mjs chromium 1280` ve `tests/kilic.mjs` geçer. Kılıç testi: aşamaların tamamı **hem el ile (gerçek fare olayları) hem Ustaya bırak ile**, deformasyonun gerçekten uzaması (ölçülen bounding box), kuşanma sonrası görünürlük, kesimde parça ayrılması, dispose sonrası canvas yok, konsolda hata yok.
- **Ekran görüntülerine bak** (`test-sonuclari/kilic-*.png`): her aşama, kızgın külçe, dövme ortası, bitmiş kılıç, test. Karanlıksa, boş duruyorsa, kılıç görünmüyorsa düzelt. Gerçekçi değilse iyileştir: kalite bu görevin başarı ölçütü.
- GPU varsa `--use-gl=angle --use-angle=gl-egl --ignore-gpu-blocklist --enable-gpu` ile çalıştır, yoksa yazılımsal.
- `.git` salt okunur olabilir; commit'i Claude atar. 4173 portuna dokunma, kendi portunu kullan. Bu dosyanın sonuna "Sonuç" ekle: ne yapıldı, ne test edildi, ne eksik.
