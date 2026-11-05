# Vazo modeli ve doğrudan sürükleme

Kullanıcının isteği: düğmelerle yön/yuva seçmek yerine parçaları fareyle doğrudan tutup birleştirmek; modeli Blender'da tasarlamak.

## Kaynaklar

- `assets/vazo/vazo.blend`: Blender 4.5.3 LTS ile üretilmiş, düzenlenebilir kaynak.
- `public/modeller/vazo.glb`: tarayıcının GLTFLoader ile yüklediği model.
- `scripts/vazo_uret.py`: Blender Python betiği; kaynak ve GLB dosyalarını yeniden üretir.

Model proje için özgün oluşturuldu. Üçüncü taraf model, fotoğraf veya doku kullanılmadı. Belirli bir tarihî eseri temsil etmez. Ölçüler oyun sahnesi için seçilmiştir.

Blender'da altı kırık parça vardır: `Vazo_Parca_01`–`Vazo_Parca_06`. Her parçanın `pieceId` özel özelliği 0–5 kimliğini taşır ve GLB extras alanına aktarılır. Ayrıca `Vazo_Saglam` (`intact`) başlangıçta görünen kesintisiz gövdedir; `Onarim_Izleri` (`repairMarks`) yalnızca tamamlanmış onarımda görünür. Parçalar fiziksel kalınlık, iç seramik yüzey, kapalı taban payları ve düzensiz kırık hattı içerir. Malzemeler yeşil sır, krem bezeme, koyu yeşil motif, ham seramik ve ağız/taban şerididir. Modelde malzeme renkleri kullanılır; harici doku isteği yoktur.

Yeniden üretim:

```bash
blender --background --python scripts/vazo_uret.py
```

Bu komut `assets/vazo/vazo.blend` ve `public/modeller/vazo.glb` çıktılarını günceller. Betiği çalıştırmadan mevcut elle yapılan Blender düzenlemelerini ayrı dosyada saklayın; betik sahneyi yeniden kurar.

## Etkileşim

- İnceleme modunda fare/parmakla çevirme ve tekerlek/iki parmakla yakınlaştırma.
- İlk açılışta sağlam tek gövde görünür; kırık sınırları ve onarım izleri gizlidir.
- Onarım başlayınca parçalar siluetin iki yanında görünür.
- Kullanıcının son düzeltmesiyle **genel vazo silueti korunur**. Seçili parçanın tam konumunu gösteren halka/yazı ve parçaya göre değişen siluet vurgusu yoktur. Siluet tüm parçalar yerleşene kadar aynı genel formu gösterir.
- Modelin kendi yüzeyi veya üzerindeki numara tutularak sürüklenir.
- Sürükleme boyunca OrbitControls devre dışıdır. Parça, kameraya dönük ve tutuş derinliğinden geçen düzlemde hareket eder; böylece perspektifte imleçten kaçmaz.
- Parçanın ekrandaki merkezi kendi hedefinin 20–34 piksel yakınına geldiğinde bırakılırsa doğru derinliğe animasyonla oturur. Yakınlık eşiği görünür bir hedef işareti üretmez. Bu eşik ekran genişliğine göre ayarlanır.
- Altı parça tamamlanınca ince bronz birleşim izleri görünür. “İncelemeye dön” bu izleri korur; yeniden sağlam gövdeye geçmez. Onarım bitmeden “Onarımı iptal et” başlangıçtaki izsiz görünümü geri getirir.
- Yanlış yerde bırakılan parça rafa geri döner. Basit tıklama yalnızca parçayı seçer; başarısız deneme sayılmaz.
- Pointer capture, pointercancel ve kaybolan yakalama ele alınır. Escape sürüklemeyi iptal eder; kamera kilidi kalkar.
- Seçili parça için ok tuşlarıyla taşıma ve Enter ile aynı yakınlık kuralına göre bırakma alternatifi vardır. Parça listesi kapalı “Klavye ile birleştir” bölümündedir.
- Yeniden başlatma mevcut sürüklemeyi/animasyonu temizler. Rota değişince renderer, kontroller, dinleyiciler, geometri ve malzemeler bırakılır. Model yüklenemezse hata gösterilir ve onarım başlatılamaz.
- Azaltılmış hareket tercihinde yerine oturma animasyonu atlanır.

## VR (Meta Quest Browser, WebXR)

`VR'da aç` düğmesi yalnız `immersive-vr` destekleyen tarayıcıda görünür. Kod `src/components/maket/vazoXr.ts`; sahneye yalnız `VazoXrBaglam` üzerinden dokunur, oyun durumu masaüstüyle aynı yoldan geçer.

- Vazo 1:1 ölçekte (44 cm), masa yüksekliğinde, başın 70 cm önünde açılır. Vazo hangi durumdaysa VR'a öyle geçer: izsiz, yarım onarım veya onarılmış.
- Izsiz vazo ve onarılmış vazo bütün olarak tutulup çevrilir; bırakınca masaya döner. Onarım izleri tamamlanınca görünür. Panel: `Vazoyu parçala` / `Yeniden başlat` / `Yeniden parçala` ve `VR'dan çık`.
- Parça, ışın + tetik veya değerek/nişanlayarak yan tuşla tutulur. Bırakınca hedefe 9 cm'den (`XR_OTURMA_ESIGI`) yakınsa `yerineOturur` ile oturur, değilse rafa döner. Masaüstünde aynı işlev piksel eşiğiyle çalışır. Hedef işareti yoktur.
- Kumanda kopar veya oturum kapanırsa eldeki parça deneme sayılmadan rafa döner. Gamepad okunmaz, tek kumanda yeter, `XRControllerModelFactory` kullanılmaz.
- `Temsilî model · Tarihî eser değildir` etiketi başa bağlıdır, derinlik sınamasına girmez.

Vazonun altında yazı yoktur; önceki panelin "örnek yazı" yönlendirmesi ve `ALT_YAZI` sabiti kaldırıldı.

Gerçek Quest'te denenmedi: aşağıdaki VR testleri IWER taklidiyle çalışır, performansı ve kumanda hissini ölçmez.

## Doğrulama

- `npm run build`
- `node tests/vazo-xr-mantik.mjs`: saf hesaplar; `npm run test:hizli` içindedir.
- `TEST_URL=… node tests/vazo-xr-dugme.mjs`: sahte `navigator.xr` ile düğme: xr yok, destek yok, reddedildi.
- `XR_SIM=/gecici/klasor bash tests/xr-sim/kur.sh`, kopya derleme önizlenip `XR_SIM=… TEST_URL=… node tests/xr-sim/vazo-sim.mjs`: simüle Quest ile baştan sona.
- `node tests/vazo.mjs`: Chrome, 1280 ve 360px; gerçek GLB isteği, izsiz başlangıç, parçaya özel hedef işaretinin yokluğu, yanlış bırakma, fare/dokunma ile 6 parça tamamlama, onarım sonrası farklı görünüm, iptalde başlangıç görüntüsüne birebir dönüş, model yüzeyinden tutuş, Escape, klavye, rota temizliği ve model yükleme hatası.
- Blender'da sağlam gövde ve altı parçanın kapalı manifold olduğu ve pozitif hacim taşıdığı bmesh ile kontrol edildi.
- `vazo-*-izsiz.png` ile `vazo-*-onarim-izleri.png` aynı kamera açısından başlangıç/onarım karşılaştırmasıdır.
- Ekran görüntüleri `test-sonuclari/vazo-*-blender-incele.png`, `vazo-*-surukle-baslangic.png`, `vazo-*-surukle-tamam.png` dosyalarında (git dışında).

Teknik referanslar: [Three.js Raycaster](https://threejs.org/docs/pages/Raycaster), [Three.js GLTFLoader](https://threejs.org/docs/pages/GLTFLoader), [Blender glTF aktarımı](https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html).
