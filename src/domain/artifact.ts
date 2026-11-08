export type Verification = "verified" | "illustrative";

/** `url`: optional web address (http/https) of the source; a Vakıf Katılım book citation links to its PDF page instead. */
export interface Source { id: string; text: string; page?: string; url?: string; }

export interface Image {
  file: string;          // public/images/<artifactId>/...
  alt: string;            // screen reader text
  description?: string;
  sourceId: string;       // photo archive source
  credit?: string;         // credit line shown under the image
}

export interface Hotspot {
  id: string;
  image: string;         // which image it sits on
  x: number; y: number;   // percent (0–100)
  title: string;
  text: string;
  sourceId: string;
}

export interface Question {
  question: string;
  options: string[];
  correct: number;          // index into the options array
  description: string;       // shown after answering
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
  start_?: string; // If unset, the first stop is used.
  stops: Stop[];
}

// The external provider's official 360° player; images come from the provider's server.
export interface Tour360 {
  provider: string;
  embedUrl: string;
  sourceUrl: string;
  description: string;
}

// Piece-assembly game made from a photo; the image must have a column:line aspect ratio.
export interface RestorationTask {
  title: string; image: string; alt: string;
  column: number; line: number;
  text: string; sourceId: string; note: string;
}

// Illustrative 3D model built in code; the model name is defined in src/features/scale-models/modelScene.ts.
export interface Model {
  model: string;
  description: string;
  infos: { text: string; sourceId: string }[];
  /** Interior info points: position is in model metres, radius is the approach distance at which the card opens. */
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

// Time Layer record: text is taken only from the source that sourceId points to.
export interface TimeRecord {
  id: string;
  period: string;          // visible date label
  title: string;
  text: string;
  sourceId: string;
}

export interface Artifact {
  id: string;             // "ulu-mosque", "muradiye-complex"
  /** Id of the building in src/content/inventory.json this artifact describes. Links the inventory row to this page without editing shared files. */
  inventoryId?: string;
  name: string;
  city: string;
  district: string;
  period: string;
  endowment: string;
  summary: string;
  history: string;
  verification: Verification;
  /** Building type keys (src/domain/artifactTypes.ts). Built-in artifacts leave it unset and use src/content/artifact-types.json. */
  types?: string[];
  coverImage: string;
  images: Image[];
  hotspots: Hotspot[];
  test: Question[];           // exactly 3 questions
  sources: Source[];
  tour?: Tour;
  tour360?: Tour360;
  restoration?: RestorationTask;
  model?: Model;
  /** Building location marked on the map in the admin form (WGS84). Without it the Maketler map uses src/content/artifact-locations.json. */
  location?: { lng: number; lat: number };
  timeLayer?: TimeRecord[];
}
