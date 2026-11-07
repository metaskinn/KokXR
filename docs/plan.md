# KökXR — Web MVP Plan

> Update: 2 November 2026 · Final: 7–8 November 2026 · Code freeze: evening of 4 November
> The old Unity/VR plan (`proje bilgileri/developer.md`, `gelistirme-plani.md`) is no longer valid.

## Product

"Dokunamadığın tarihe dokun." A web application aimed at discovering the foundation (vakıf) works in Bursa,
installable on phone and desktop (PWA).

**Artifacts:** Bursa Ulu Camii · II. Murad (Muradiye) Külliyesi

**Technology:** React + TypeScript + Vite. No backend; data is in JSON files,
changes made in the admin screen are kept in the browser (localStorage) and can be
exported as JSON.

## Specification mapping (5.1.1)

| Requirement | Feature that meets it |
|---|---|
| Working mobile/desktop application | Responsive design + PWA (installable, offline) |
| More than one foundation work | Two artifacts, artifact selection screen |
| History, image, source | Artifact page: gallery, information panel, source label |
| Adding/editing content | `/admin` screen: add artifact, edit text, JSON export/import |
| Architecture that allows adding new artifacts | Each artifact = `src/content/artifacts/<id>.json` + image folder; code does not change |
| End-to-end demo | Home page → choose artifact → discover → test → badge |

## Scope

### MVP (a must)
1. Home page (slogan, artifact cards)
2. Artifact page: photo gallery (zoom), information panel, source label
3. Information points on photos (complex buildings, Ulu Camii details)
4. 3-question test per artifact + badge on completion
5. Admin screen (add/edit/export)
6. Accessibility: alt text, keyboard use, high contrast, text size

### If wanted (after the MVP is finished)
- TR/EN language selection (source texts bilingual)
- Voice narration (Web Speech API, `tr-TR`)
- Map (OpenStreetMap)

### Will not be done
3D model, 360°, VR/AR, backend, user login. Explained as "vision" in the presentation,
not shown as if present in the application.

## Data model

```ts
type Dogrulama = "dogrulanmis" | "temsili";

interface Kaynak { id: string; metin: string; sayfa?: string; }

interface Gorsel {
  dosya: string;          // public/images/<eserId>/...
  alt: string;            // screen reader text
  aciklama?: string;
  kaynakId: string;       // photo archive source
}

interface BilgiNoktasi {
  id: string;
  gorsel: string;         // which image it is on
  x: number; y: number;   // percent (0–100)
  baslik: string;
  metin: string;
  kaynakId: string;
}

interface Soru {
  soru: string;
  secenekler: string[];
  dogru: number;          // index in the secenekler array
  aciklama: string;       // shown after the answer
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
  test: Soru[];           // exactly 3 questions
  kaynaklar: Kaynak[];
}
```

**Rule:** Every text is tied to a `kaynakId`. Source texts are taken only from the
Vakıf Eserleri Envanteri PDFs under `proje bilgileri/`.

## Images

- The archive is under `proje bilgileri/`, stays outside git.
- 8–12 photos are chosen per artifact, reduced to 1600 px width,
  and put under `public/images/<eserId>/`.
- The repo is not made public until usage permission is settled, and the demo is not published publicly.

## Agents and workflow

| Agent | Command | Role | Where it touches |
|---|---|---|---|
| Claude Code | `claude` | Lead: plan, data/content, code review | `docs/`, `src/content/` |
| Codex CLI | `codex` | Application code, build | `src/` (except data), configuration |
| Antigravity | `agy` | Browser testing, design report | `docs/archive/test-report.md` |

1. Claude writes a single task into the `docs/archive/next-task.md` file.
2. Codex carries out the task, verifies with `npm run build`, makes a commit.
3. Antigravity tests the application in the browser, writes the result into `docs/archive/test-report.md`.
4. Claude reviews the report and the code, writes the next task.

Two agents do not edit the same file at the same time. Commit at the end of every task.

## Schedule

| Day | Goal |
|---|---|
| 2 Nov | Plan, data model, skeleton (Task 1), content extraction starts |
| 3 Nov | Artifact page, gallery, information panel, real content and images |
| 4 Nov | Information points, test + badge, admin screen, PWA · **code freeze in the evening** |
| 5 Nov | Antigravity test, bug fixing, rehearsal 1 |
| 6 Nov | Rehearsals 2–3, backup demo video, offline operation check |
| 7–8 Nov | Final |

## Open questions

- Is a web-based (PWA) application accepted as a "mobile or desktop application"? → to be asked to the organizers
- Permission to use the archive photos in the demo and presentation → confirm with the sponsor institution
