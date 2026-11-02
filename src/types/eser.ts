export type Dogrulama = "dogrulanmis" | "temsili";

export interface Kaynak { id: string; metin: string; sayfa?: string; }

export interface Gorsel {
  dosya: string;          // public/gorseller/<eserId>/...
  alt: string;            // ekran okuyucu metni
  aciklama?: string;
  kaynakId: string;       // fotoğraf arşivi kaynağı
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

export interface Eser {
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
