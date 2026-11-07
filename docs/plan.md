# KökXR — Web MVP Planı

> Güncelleme: 2 Kasım 2026 · Final: 7–8 Kasım 2026 · Kod dondurma: 4 Kasım akşamı
> Eski Unity/VR planı (`proje bilgileri/developer.md`, `gelistirme-plani.md`) geçersizdir.

## Ürün

"Dokunamadığın tarihe dokun." Bursa'daki vakıf eserlerini keşfetmeye yönelik,
telefona ve masaüstüne kurulabilen (PWA) bir web uygulaması.

**Eserler:** Bursa Ulu Camii · II. Murad (Muradiye) Külliyesi

**Teknoloji:** React + TypeScript + Vite. Backend yok; veriler JSON dosyalarında,
yönetim ekranındaki değişiklikler tarayıcıda (localStorage) saklanır ve JSON olarak
dışa aktarılabilir.

## Şartname eşlemesi (5.1.1)

| Şart | Karşılayan özellik |
|---|---|
| Çalışan mobil/masaüstü uygulama | Duyarlı tasarım + PWA (kurulabilir, çevrimdışı) |
| Birden fazla vakıf eseri | İki eser, eser seçim ekranı |
| Tarihçe, görsel, kaynak | Eser sayfası: galeri, bilgi paneli, kaynak etiketi |
| İçerik ekleme/düzenleme | `/admin` ekranı: eser ekle, metin düzenle, JSON dışa/içe aktar |
| Yeni eser eklenebilir mimari | Her eser = `src/content/artifacts/<id>.json` + görsel klasörü; kod değişmez |
| Uçtan uca demo | Ana sayfa → eser seç → keşfet → test → rozet |

## Kapsam

### MVP (mutlaka)
1. Ana sayfa (slogan, eser kartları)
2. Eser sayfası: fotoğraf galerisi (yakınlaştırma), bilgi paneli, kaynak etiketi
3. Fotoğraf üzerinde bilgi noktaları (külliye yapıları, Ulu Camii detayları)
4. Eser başına 3 soruluk test + tamamlanınca rozet
5. Yönetim ekranı (ekle/düzenle/dışa aktar)
6. Erişilebilirlik: alt metin, klavye ile kullanım, yüksek kontrast, yazı boyutu

### İstenirse (MVP bittikten sonra)
- TR/EN dil seçimi (kaynak metinler iki dilli)
- Sesli anlatım (Web Speech API, `tr-TR`)
- Harita (OpenStreetMap)

### Yapılmayacak
3D model, 360°, VR/AR, backend, kullanıcı girişi. Sunumda "vizyon" olarak anlatılır,
uygulamada var gibi gösterilmez.

## Veri modeli

```ts
type Dogrulama = "dogrulanmis" | "temsili";

interface Kaynak { id: string; metin: string; sayfa?: string; }

interface Gorsel {
  dosya: string;          // public/images/<eserId>/...
  alt: string;            // ekran okuyucu metni
  aciklama?: string;
  kaynakId: string;       // fotoğraf arşivi kaynağı
}

interface BilgiNoktasi {
  id: string;
  gorsel: string;         // hangi görselin üzerinde
  x: number; y: number;   // yüzde (0–100)
  baslik: string;
  metin: string;
  kaynakId: string;
}

interface Soru {
  soru: string;
  secenekler: string[];
  dogru: number;          // secenekler dizisindeki sıra
  aciklama: string;       // cevaptan sonra gösterilir
  kaynakId: string;
}

interface Eser {
  id: string;             // "ulu-camii", "muradiye-kulliyesi"
  ad: string;
  sehir: string;
  ilce: string;
  donem: string;
  vakif: string;
  ozet: string;
  tarihce: string;
  dogrulama: Dogrulama;
  kapakGorsel: string;
  gorseller: Gorsel[];
  bilgiNoktalari: BilgiNoktasi[];
  test: Soru[];           // tam 3 soru
  kaynaklar: Kaynak[];
}
```

**Kural:** Her metin bir `kaynakId`'ye bağlıdır. Kaynak metinleri yalnızca
`proje bilgileri/` altındaki Vakıf Eserleri Envanteri PDF'lerinden alınır.

## Görseller

- Arşiv `proje bilgileri/` altında, git dışında kalır.
- Eser başına 8–12 fotoğraf seçilir, 1600 px genişliğe küçültülür,
  `public/images/<eserId>/` altına konur.
- Kullanım izni netleşmeden repo herkese açık yapılmaz, demo herkese açık yayınlanmaz.

## Ajanlar ve iş akışı

| Ajan | Komut | Rol | Dokunduğu yer |
|---|---|---|---|
| Claude Code | `claude` | Lider: plan, veri/içerik, kod incelemesi | `docs/`, `src/content/` |
| Codex CLI | `codex` | Uygulama kodu, build | `src/` (data hariç), yapılandırma |
| Antigravity | `agy` | Tarayıcı testi, tasarım raporu | `docs/archive/test-report.md` |

1. Claude `docs/archive/next-task.md` dosyasına tek bir görev yazar.
2. Codex görevi uygular, `npm run build` ile doğrular, commit atar.
3. Antigravity uygulamayı tarayıcıda test eder, sonucu `docs/archive/test-report.md`'ye yazar.
4. Claude raporu ve kodu inceler, sıradaki görevi yazar.

Aynı anda iki ajan aynı dosyayı düzenlemez. Her görev sonunda commit.

## Takvim

| Gün | Hedef |
|---|---|
| 2 Kas | Plan, veri modeli, iskelet (Görev 1), içerik çıkarımı başlar |
| 3 Kas | Eser sayfası, galeri, bilgi paneli, gerçek içerik ve görseller |
| 4 Kas | Bilgi noktaları, test + rozet, yönetim ekranı, PWA · **akşam kod dondurma** |
| 5 Kas | Antigravity testi, hata düzeltme, prova 1 |
| 6 Kas | Prova 2–3, yedek demo videosu, çevrimdışı çalışma kontrolü |
| 7–8 Kas | Final |

## Açık sorular

- Web tabanlı (PWA) uygulama "mobil veya masaüstü uygulaması" olarak kabul ediliyor mu? → organizasyona sorulacak
- Arşiv fotoğraflarının demoda ve sunumda kullanım izni → sponsor kuruma teyit
