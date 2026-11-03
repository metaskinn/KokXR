# Vazo modeli ve doğrudan sürükleme

Kullanıcının isteği: düğmelerle yön/yuva seçmek yerine parçaları fareyle doğrudan tutup birleştirmek; modeli Blender'da tasarlamak.

## Kaynaklar

- `assets/vazo/vazo.blend`: Blender 4.5.3 LTS ile üretilmiş, düzenlenebilir kaynak.
- `public/modeller/vazo.glb`: tarayıcının GLTFLoader ile yüklediği model.
- `scripts/vazo_uret.py`: Blender Python betiği; kaynak ve GLB dosyalarını yeniden üretir.

Model proje için özgün oluşturuldu. Üçüncü taraf model, fotoğraf veya doku kullanılmadı. Belirli bir tarihî eseri temsil etmez. Ölçüler oyun sahnesi için seçilmiştir.

Blender'da altı ayrı nesne vardır: `Vazo_Parca_01`–`Vazo_Parca_06`. Her nesnenin `pieceId` özel özelliği 0–5 kimliğini taşır ve GLB extras alanına aktarılır. Parçalar fiziksel kalınlık, iç seramik yüzey, kapalı taban payları ve düzensiz kırık hattı içerir. Malzemeler yeşil sır, krem bezeme, koyu yeşil motif, ham seramik ve ağız/taban şerididir. Modelde malzeme renkleri kullanılır; harici doku isteği yoktur.

Yeniden üretim:

```bash
blender --background --python scripts/vazo_uret.py
```

Bu komut `assets/vazo/vazo.blend` ve `public/modeller/vazo.glb` çıktılarını günceller. Betiği çalıştırmadan mevcut elle yapılan Blender düzenlemelerini ayrı dosyada saklayın; betik sahneyi yeniden kurar.

## Etkileşim

- İnceleme modunda fare/parmakla çevirme ve tekerlek/iki parmakla yakınlaştırma.
- Onarım başlayınca parçalar siluetin iki yanında görünür.
- Modelin kendi yüzeyi veya üzerindeki numara tutularak sürüklenir.
- Sürükleme boyunca OrbitControls devre dışıdır. Parça, kameraya dönük ve tutuş derinliğinden geçen düzlemde hareket eder; böylece perspektifte imleçten kaçmaz.
- Parçanın ekrandaki merkezi kendi hedefinin 20–34 piksel yakınına geldiğinde işaret belirginleşir. Bırakınca doğru derinliğe animasyonla oturur. Bu eşik ekran genişliğine göre ayarlanır.
- Yanlış yerde bırakılan parça rafa geri döner. Basit tıklama yalnızca parçayı seçer; başarısız deneme sayılmaz.
- Pointer capture, pointercancel ve kaybolan yakalama ele alınır. Escape sürüklemeyi iptal eder; kamera kilidi kalkar.
- Seçili parça için ok tuşlarıyla taşıma ve Enter ile aynı yakınlık kuralına göre bırakma alternatifi vardır. Parça listesi kapalı “Klavye ile birleştir” bölümündedir.
- Yeniden başlatma mevcut sürüklemeyi/animasyonu temizler. Rota değişince renderer, kontroller, dinleyiciler, geometri ve malzemeler bırakılır. Model yüklenemezse hata gösterilir ve onarım başlatılamaz.
- Azaltılmış hareket tercihinde yerine oturma animasyonu atlanır.

## Doğrulama

- `npm run build`
- `node tests/vazo.mjs`: Chrome, 1280 ve 360px; gerçek GLB isteği, yanlış bırakma, fare/dokunma ile 6 parça tamamlama, model yüzeyinden tutuş, sıfırlama, Escape, klavye, rota temizliği ve model yükleme hatası.
- Blender'da kaynak altı parçanın kapalı manifold olduğu ve pozitif hacim taşıdığı bmesh ile kontrol edildi.
- Ekran görüntüleri `test-sonuclari/vazo-*-blender-incele.png`, `vazo-*-surukle-baslangic.png`, `vazo-*-surukle-tamam.png` dosyalarında (git dışında).

Teknik referanslar: [Three.js Raycaster](https://threejs.org/docs/pages/Raycaster), [Three.js GLTFLoader](https://threejs.org/docs/pages/GLTFLoader), [Blender glTF aktarımı](https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html).
