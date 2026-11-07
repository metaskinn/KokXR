export type Verification = "verified" | "illustrative";

export interface Source { id: string; text: string; page?: string; }

export interface Image {
  file: string;          // public/gorseller/<eserId>/...
  alt: string;            // ekran okuyucu metni
  description?: string;
  sourceId: string;       // fotoğraf arşivi kaynağı
  credit?: string;         // görselin altında gösterilen kredi satırı
}

export interface Hotspot {
  id: string;
  image: string;         // hangi görselin üzerinde
  x: number; y: number;   // yüzde (0–100)
  title: string;
  text: string;
  sourceId: string;
}

export interface Question {
  question: string;
  options: string[];
  correct: number;          // secenekler dizisindeki sıra
  description: string;       // cevaptan sonra gösterilir
  sourceId: string;
}

export interface Link { target: string; label: string }

export interface Stop {
  id: string;
  title: string;
  image: string;
  depth: string;
  text: string;
  sourceId?: string;
  links: Link[];
}

export interface Tour {
  description: string;
  start_?: string; // Belirtilmemişse ilk durak kullanılır.
  stops: Stop[];
}

// Dış sağlayıcının resmî 360° oynatıcısı; görüntüler sağlayıcının sunucusundan gelir.
export interface Tour360 {
  provider: string;
  embedUrl: string;
  sourceUrl: string;
  description: string;
}

// Fotoğraftan yapılan parça birleştirme oyunu; gorsel sutun:satir oranında olmalı.
export interface RestorationTask {
  title: string; image: string; alt: string;
  column: number; line: number;
  text: string; sourceId: string; not: string;
}

// Kodla oluşturulan temsili 3B maket; model adı src/components/maket/maketSahnesi.ts içinde tanımlı.
export interface Model {
  model: string;
  description: string;
  infos: { text: string; sourceId: string }[];
  /** İç mekân bilgi noktaları: konum maket metresi, yaricap kartın açıldığı yaklaşma uzaklığı. */
  interiorInfos?: ModelHotspot[];
}

export interface ModelHotspot {
  id: string;
  title: string;
  text: string;
  sourceId: string;
  position: number[];
  radius: number;
}

// Zaman Katmanı kaydı: metin yalnız kaynakId'nin gösterdiği kaynaktan alınır.
export interface TimeRecord {
  id: string;
  period: string;          // görünür tarih etiketi
  title: string;
  text: string;
  sourceId: string;
}

export interface Artifact {
  id: string;             // "ulu-camii", "muradiye-kulliyesi"
  ad: string;
  city: string;
  district: string;
  period: string;
  endowment: string;
  summary: string;
  history: string;
  verification: Verification;
  coverImage: string;
  images: Image[];
  hotspots: Hotspot[];
  test: Question[];           // tam 3 soru
  sources: Source[];
  tour?: Tour;
  tour360?: Tour360;
  restoration?: RestorationTask;
  model?: Model;
  timeLayer?: TimeRecord[];
}
