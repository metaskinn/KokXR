export type Dogrulama = "dogrulanmis" | "temsili";

export interface Kaynak { id: string; metin: string; sayfa?: string; }

export interface Gorsel {
  dosya: string;          // public/gorseller/<eserId>/...
  alt: string;            // ekran okuyucu metni
  aciklama?: string;
  kaynakId: string;       // fotoğraf arşivi kaynağı
  kredi?: string;         // görselin altında gösterilen kredi satırı
}

export interface BilgiNoktasi {
  id: string;
  gorsel: string;         // hangi görselin üzerinde
  x: number; y: number;   // yüzde (0–100)
  baslik: string;
  metin: string;
  kaynakId: string;
}

export interface Soru {
  soru: string;
  secenekler: string[];
  dogru: number;          // secenekler dizisindeki sıra
  aciklama: string;       // cevaptan sonra gösterilir
  kaynakId: string;
}

export interface Baglanti { hedef: string; etiket: string }

export interface Durak {
  id: string;
  baslik: string;
  gorsel: string;
  derinlik: string;
  metin: string;
  kaynakId?: string;
  baglantilar: Baglanti[];
}

export interface Tur {
  aciklama: string;
  baslangic?: string; // Belirtilmemişse ilk durak kullanılır.
  duraklar: Durak[];
}

// Dış sağlayıcının resmî 360° oynatıcısı; görüntüler sağlayıcının sunucusundan gelir.
export interface Tur360 {
  saglayici: string;
  embedUrl: string;
  kaynakUrl: string;
  aciklama: string;
}

// Fotoğraftan yapılan parça birleştirme oyunu; gorsel sutun:satir oranında olmalı.
export interface RestorasyonGorevi {
  baslik: string; gorsel: string; alt: string;
  sutun: number; satir: number;
  metin: string; kaynakId: string; not: string;
}

// Kodla oluşturulan temsili 3B maket; model adı src/components/maket/maketSahnesi.ts içinde tanımlı.
export interface Maket {
  model: string;
  aciklama: string;
  bilgiler: { metin: string; kaynakId: string }[];
  /** İç mekân bilgi noktaları: konum maket metresi, yaricap kartın açıldığı yaklaşma uzaklığı. */
  icBilgiler?: MaketBilgiNoktasi[];
}

export interface MaketBilgiNoktasi {
  id: string;
  baslik: string;
  metin: string;
  kaynakId: string;
  konum: number[];
  yaricap: number;
}

// Zaman Katmanı kaydı: metin yalnız kaynakId'nin gösterdiği kaynaktan alınır.
export interface ZamanKaydi {
  id: string;
  donem: string;          // görünür tarih etiketi
  baslik: string;
  metin: string;
  kaynakId: string;
}

export interface Eser {
  id: string;             // "ulu-camii", "muradiye-kulliyesi"
  ad: string;
  sehir: string;
  ilce: string;
  konum?: { enlem: number; boylam: number; kaynak: string }; // yalnız doğrulanmış koordinat; kaynak zorunlu
  yapiTuru?: string;      // Cami, Külliye, Han, Hamam, Medrese, Türbe...; süzgeç ve listelerde kullanılır
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
  tur?: Tur;
  tur360?: Tur360;
  restorasyon?: RestorasyonGorevi;
  maket?: Maket;
  zamanKatmani?: ZamanKaydi[];
}
