# KökXR — Sohbet Özeti ve Geliştirme Devri

**Tarih:** 2 Kasım 2026  
**Amaç:** Bu sohbetin bağlamını Claude Code, Codex CLI ve Google Antigravity'ye aktarabilmek.

## 1. Proje özeti

- **Proje adı:** KökXR
- **Slogan:** “Dokunamadığın tarihe dokun.”
- **Bağlam:** KÖK&KOD hackathon'u; vakıf eserleri ve kültürel miras.
- **Fikir:** Tarihi mekânların ve eserlerin dijital ortamda keşfedilmesi; mümkün olduğunda eserlerin 3D modellerinin incelenmesi, hikâyelerinin öğrenilmesi ve etkileşimli görevlerle pekiştirilmesi.
- **Hedef kullanıcılar:** Öğrenciler ve okullar, müzeler, vakıflar ve kültürel miras kurumları.
- **Uzun vadeli vizyon:** VR/AR desteği, 3D dijital ikizler, zaman katmanı, restorasyon görevleri, doğrulanmış bilgi, dijital miras kütüphanesi, kırsal okullara ulaşan KökMobil.

## 2. Ekip ve mevcut durum

- Ekip 4 kişiden oluşuyor; C bilgisi var, Unity/oyun/VR geliştirme deneyimi yok.
- Yüklenen sunumda ekip: Muhammet Ali Divan (kaptan), İsmet Bayandur, Selami Ali Şimşek, Meltem Taşkın.
- İlk konuşmalarda yaklaşık iki hafta kaldığı ve henüz somut geliştirmeye başlanmadığı söylendi; **kalan süre yeniden doğrulanmalı**.
- Kullanıcı **Ubuntu/Linux** üzerinde çalışıyor.
- Kurulu araçların doğrulanan sürümleri:
  - Claude Code: `2.1.309`
  - Codex CLI: `0.166.0`
  - Git: `2.53.0`
  - Node.js: `v24.22.1`
  - npm: `11.19.1`
- Google Antigravity de kurulu olduğu belirtildi; komut satırı entegrasyonu henüz doğrulanmadı.
- Kullanıcıda Claude Max, Codex ve Gemini/Antigravity erişimi var.

## 3. Sağlanan kaynaklar

### Bursa vakıf eserleri fotoğraf arşivi

Kullanıcıyla Google Drive üzerinden **“Vakıf Eserleri Envanteri - Bursa Fotoğraf Arşivi”** adlı bir klasör paylaşılmış. Ekran görüntüsünde şu klasörler görünüyor:

- `KÖK&KOD`
- `II. Cilt - Yıldırım`
- `III. Cilt - Diğer İlçeler`
- `I. ve II. Cilt - Osmangazi`

Ayrıca bir PDF görünüyor. **Klasörlerin içindeki fotoğraflar henüz tek tek incelenmedi.** Görsellerin VR/360° için uygun olmadığı kullanıcı tarafından belirtildi; kesin teknik değerlendirme için örnek fotoğraflar gerekir.

### Yayınlar ve referans siteler

- Vakıf Katılım yayınları: https://www.vakifkatilim.com.tr/tr/hakkimizda/medya-merkezi/yayinlarimiz
- Sanal Müze: https://sanalmuze.gov.tr/
- 3D Mekanlar: https://www.3dmekanlar.com/
- 360TR: https://www.360tr.com/tr/

Bu kaynaklar araştırma ve referans amaçlı gündeme geldi. **Teknik olarak erişilebilen görsellerin yeniden yayımlanması otomatik olarak izinli değildir.** Özellikle fotoğraf arşivinin hackathon demosunda ve kamuya açık uygulamada kullanılma koşulları paylaşan kurumla netleştirilmelidir. Üçüncü taraf sitelerin korumalarını aşmaya veya izinsiz toplu indirmeye dayanan bir çözüm planlanmamalıdır.

### Sunum

Kullanıcı `KokXR_Sunum_v2 (1).pptx` dosyasını yükledi. Sunumdaki başlıca vaatler:

- “Eseri Eline Al”: tut, çevir, büyüt, parçalarına ayır.
- “Zaman Katmanı”: yapının geçmiş dönemine geçiş.
- “Restorasyon Görevi”: parçaları doğru eşleştirerek onarım.
- “Doğrulanmış Bilgi”: onaylı kaynaklardan açıklamalar.
- VR / AR / Web üzerinden erişim.
- Sunumun demo çerçevesi: **tek mekân · tek eser · tek senaryo**.

Bu özelliklerin tamamı henüz yapılmış değildir; sunumdaki vizyon ile çalışan prototip ayrı gösterilmelidir.

## 4. Alınan teknik yön kararı

**İlk ürün:** Gerçek VR uygulamasından önce çalışan bir **web prototipi / tıklanabilir mockup**.

Önerilen teknoloji:

- React + TypeScript + Vite
- Tailwind CSS (gerekiyorsa)
- 3D model bulunduğunda Three.js veya React Three Fiber
- 360° panorama bulunduğunda uygun web panorama görüntüleyicisi
- İlk sürümde backend, veritabanı, kullanıcı girişi ve gerçek VR zorunlu değil.

**Neden?** Verilen fotoğraflar doğrudan VR'ye uygun değil. Normal fotoğraflar galeride, bilgi noktalarında ve yakınlaştırmalı incelemede kullanılabilir. Normal fotoğrafı güvenilir gerçek 360° mekân veya doğrulanmış 3D dijital ikiz gibi sunmamak gerekir.

## 5. MVP kapsamı

1. KökXR karşılama ekranı ve slogan.
2. Bursa'dan **tek bir vakıf eseri / mekân** seçimi.
3. Kurumun sağladığı fotoğraflarla görsel keşif.
4. Fotoğraf üzerinde tıklanabilir bilgi noktaları.
5. Yakınlaştırmalı eser veya mimari detay incelemesi.
6. Kaynağı belli tarihsel bilgi paneli.
7. Üç soruluk mini test.
8. Baştan sona sorunsuz gösterilebilen demo.

**Koşullu özellik:** Kullanım izni olan gerçek `.glb`/`.gltf` model varsa döndürülebilir 3D inceleme. 360° panorama varsa panorama görüntüleyici. Bu varlıklar yoksa ilgili özellikler MVP'de vaat edilmemeli.

**Şimdilik kapsam dışı:** Gerçek VR gözlüğü entegrasyonu, tam 3D mekân taraması, otomatik tarihsel rekonstrüksiyon, zaman katmanı, restorasyon simülasyonu, yapay zekâ rehber, çoklu müze kataloğu, KökMobil altyapısı.

## 6. Ajanların iş bölümü

| Araç | Sorumluluk | Temel çıktı |
|---|---|---|
| Claude Code | Teknik lider, görev planlama, kapsam kontrolü | `docs/plan.md`, `docs/next-task.md` |
| Codex CLI | Kod geliştirme, test, build | React uygulaması |
| Google Antigravity | IDE, tarayıcıda görsel inceleme, kalite kontrol | Test ve tasarım raporu |

**Önemli:** Ajanlar aynı klasörü paylaşabilir ama aynı dosyaları eşzamanlı düzenlememelidir. Başlangıçta Claude → Codex sıralı çalışsın; Antigravity manuel inceleme yapsın. Otomatik üç ajanlı orkestrasyon ancak bu temel akış doğrulandıktan sonra kurulsun. Git commit ve insan onayı kullanılsın.

## 7. Linux'ta önerilen ilk kurulum

Aşağıdaki komutlar **önerildi; kullanıcının bunları çalıştırdığı henüz doğrulanmadı**.

```bash
mkdir -p ~/Projects/kokxr/docs
mkdir -p ~/Projects/kokxr/kaynaklar
cd ~/Projects/kokxr
git init

cat > .gitignore <<'IGNORE'
node_modules/
dist/
.env
.env.*
!.env.example
kaynaklar/
IGNORE
```

### Ortak ajan kuralları

`~/Projects/kokxr/AGENTS.md` içine şu ilkeler yazılabilir:

```markdown
# KökXR Geliştirme Kuralları

KökXR, Bursa'daki vakıf eserlerini dijital olarak keşfetmeye yönelik bir hackathon prototipidir.

Teknolojiler: React, TypeScript, Vite.

İlk hedef:
- Ana sayfa
- Tarihi eser seçimi
- Fotoğraf galerisi
- Bilgi paneli
- Üç soruluk test

Kurallar:
- Arayüz Türkçe olacak.
- Önce çalışan basit sürümü geliştir.
- Verisi olmayan 3D veya VR özelliklerini varmış gibi gösterme.
- Tarihsel bilgi uydurma.
- Lisansı belirsiz görselleri herkese açık depoya yükleme.
- Her aşamada uygulamayı test et.
- Görev kapsamı dışında değişiklik yapma.
```

### Claude'dan plan üretme

```bash
cd ~/Projects/kokxr
claude -p --permission-mode plan \
  "AGENTS.md dosyasındaki kuralları dikkate al. KökXR için yalnızca ilk geliştirme aşamasının planını oluştur. Hedef React + TypeScript ile çalışan ana sayfa ve eser seçimi ekranı. Kod yazma. Türkçe, net ve uygulanabilir görevler yaz." \
  > docs/plan.md
```

### Codex'e uygulatma

```bash
cd ~/Projects/kokxr
codex exec --sandbox workspace-write \
  "AGENTS.md ve docs/plan.md dosyalarını oku. İlk geliştirme aşamasını uygula. React, TypeScript, Vite kullan. Ana sayfa ve eser seçim ekranını geliştir. npm run build ile doğrula. Henüz VR, 360 derece veya backend oluşturma."
```

### Antigravity

Antigravity'de `~/Projects/kokxr` klasörünü aç. Uygulamayı çalıştır, arayüzü tarayıcıda incele; başlangıçta dosyaları değiştirmeden sorunları raporla. Antigravity'nin CLI'dan otomatik çağrılması henüz doğrulanmadı.

## 8. İlk hafta hedefi

| Gün | Hedef |
|---|---|
| 1 | Tek eser ve örnek fotoğrafları seç; kullanım izinlerini doğrula. |
| 2 | Claude ile plan, Codex ile ana sayfa. |
| 3 | Mekân seçimi, fotoğraf galerisi, detay ekranı. |
| 4 | Bilgi noktaları ve yakınlaştırma. |
| 5 | Tarihsel içerik ve mini test. |
| 6 | Antigravity ile tarayıcı testi; Codex ile düzeltmeler. |
| 7 | Baştan sona demo, yedek, ekran kaydı. |

İkinci hafta, eldeki prototipin durumuna göre 3D/360° olanaklarını değerlendirme, hata düzeltme ve sunum provasına ayrılabilir. Bu bir hedef plandır; süre garantisi değildir.

## 9. Açık sorular ve sonraki adım

- **Proje klasörü gerçekten oluşturuldu mu?** Terminal çıktısı bekleniyor.
- Drive'dan hangi Bursa vakıf eseri seçilecek?
- Aynı esere ait 5–10 örnek fotoğraf paylaşılabilir mi?
- Fotoğrafların hackathon prototipinde ve kamuya açık demoda kullanım izni var mı?
- VR gözlüğü ile canlı demo hackathon için zorunlu mu?
- Güncel teslim tarihi ve kalan süre nedir?

**En yakın somut adım:** `~/Projects/kokxr` klasörünü oluşturmak, bu Markdown dosyasını `docs/sohbet-ozeti.md` olarak kopyalamak, tek bir eser seçmek ve Claude'a `docs/plan.md` hazırlatmak. Codex yalnızca ilk görevi uygulasın. Antigravity ilk ekranları test etsin.

---

> **Kaynak ayrımı:** Bu belge, kullanıcıyla yapılan sohbet, paylaşılan Google Drive ekran görüntüsü ve yüklenen KökXR sunumundan derlenmiştir. Drive'ın içindeki fotoğraflar henüz incelenmedi; önerilen teknik mimari ve görev dağılımı geliştirme tavsiyesidir, tamamlanmış ürün beyanı değildir.
