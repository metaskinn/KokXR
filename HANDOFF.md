# KökXR — Guide to continuing on another computer

> Last updated: 6 November 2026 · **Final: 7–8 November 2026**
> This file contains everything needed to pick the project up where it was left on a new computer (and in a new Claude / Codex / Antigravity session).
> In a new session, first have the AI agent read this file.

---

## 0. Latest status (6 November 2026, night)

The working branch is **`ulu-camii-grafik`** (on top of `master`). The work below has not been merged into `master`; `kokxr.vercel.app` does not include it either.

```bash
git fetch origin && git switch ulu-camii-grafik
npm ci
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort   # http://127.0.0.1:5173/vr
```
Node 22+ is required (`.nvmrc` asks for 24). The system Node on the school machine is v12 and cannot run the project.

### Added on this branch
- **Places tab (`/places`):** Map of Türkiye → city → building → `/places/<eser-id>`. The list is in `src/content/vrArtifacts.ts`; a building opens automatically if its artifact data has `maket` or `restorasyon`. The border line is Natural Earth (public domain). Konya and Hatay have no VR, only a book link.
- **9 new Bursa scale models (web and VR):** Orhan Bey, I. Murat Hüdavendigar, Hamzabey, Timurtaş Paşa, II. Murat (Muradiye), Yeşil Çelebi Mehmed, Yıldırım, Emir Sultan, Umurbey. Each has `src/features/scale-models/buildings/<eser-id>.ts`, `src/content/artifacts/<eser-id>.json`, `public/images/<eser-id>/`.
- **Adding a new building:** `export const yapi = (): Maket => ...` inside `yapilar/<eser-id>.ts` is enough, it registers automatically; put helper files in a subfolder. Camera, pedestal and interior lighting are building-specific in the `Maket` interface. `m.hali` is tied to the Ulu Camii pier layout; in other buildings use `m.haliSade`.
- **Ulu Camii interior:** code-generated carpet and marble (`scale-models/uluMosqueFloor.ts`), chandelier halos, light column, interior reflection environment, real interior shadows. On Quest and touch devices `hafifCihaz()` uses lighter materials and half-size textures.
- **Climbing onto structures:** Walking with height via `IcYurume.zeminler` and `yurumeCarpisma.ts:zeminAdimi` (web and VR). In Ulu Camii you can climb onto the minbar, the lectern and the mahfil.
- **Touch walking stick:** `EseriEleAl.tsx:YurumeKolu`, visible in the interior and on `pointer: coarse` devices.
- **Panels:** The web card and the VR card were made smaller; the VR card uses the web card's visual language (`maket/xrPanel.ts`).

### Tests
`tests/model-building.mjs <eser-id>` (scene, splitting, stops, artifact page), `tests/model-climb.mjs`, `tests/model-touchscreen.mjs`, `tests/vr-artifacts.mjs`. All run with `TEST_URL`.
Last round: `maket-yapi` passed on 10 buildings, `vr-eserler` and `maket-xr-dugme` passed (with the code from just before the walking stick). `maket-dokunmatik` and `maket-tirmanma` ran only on Ulu Camii.

### Unverified
- **The 9 new buildings were not tried on Quest or in the VR simulation;** the VR assembly game has never run on these buildings. A simulation can be run with `tests/xr-sim/`.
- Triangle count and frame rate were not measured on a real device. The walking stick was not tried on a real phone.
- The page numbers in the historical texts were written by agents and were not compared with the book by hand.
- The latest fixes to Yıldırım and Umurbey passed the tests, but their images were not inspected one by one.

### Publishing
- **Temporary address:** A login-free deployment is obtained with `vercel deploy --temporary`; it closes after 60 minutes and is deleted if not claimed by an account.
- **Full version:** `npm run build`, then `dist/vercel.json` (SPA redirect) is added by hand. The user allowed the archive photos to be included in this deployment; sponsor permission is still an open issue.
- **`kokxr.vercel.app`:** An open version (without photos) uploaded by hand, on another team member's account. Access to that account is needed to update it.
- `~/.npm` can fill the home quota: point the `npm_config_cache` variable to a temporary folder.

---

## 0.1. Note from 5 November (old)

```bash
git fetch origin
git switch cini-atolyesi      # this note and the tile workshop are on this branch; not yet on master
npm install
npm run build && npm run preview -- --port 4173
```
Tell the new AI session: "Read HANDOFF.md, continue from section 0".

### Branches
| Branch | What is in it | Status |
|---|---|---|
| `master` | Site, sword, vase (desktop), Ulu Camii scale model and its VR | On GitHub, `3286759` |
| `cini-atolyesi` | `master` + tile workshop (web and VR) + this note | On GitHub, **not in master** |
| `vr-panel-gecis` | `wip/vr-tutma` + card/menu layout and fade-out transition in Ulu Camii VR | On GitHub, **not in master** |
| `wip/vr-vazo` | `vaat-mokap` + vase VR repair (unfinished) | On GitHub, only `test:hizli` passed |
| `vazo-quest` | Union of these branches + finished vase VR | Local, worked in simulation, not tried on a real Quest |
| `vaat-mokap` | Time layer, journey, teacher panel, vision screens | On GitHub, not in master; ask the user before merging |

### Pending decisions (ask the user)
1. Will `cini-atolyesi`, `vr-panel-gecis` and `vaat-mokap` be merged into master, and in what order? Look at conflicts and tests before merging.
2. Will the presentation (`KokXR_Sunum_v2.pptx`, 3 slides) be updated? The specification 5.4 headings were missing.

### To do
- [ ] **Real Quest trial (Friday, with the user):** Ulu Camii and vase VR have so far run only in simulation (IWER). Performance and controller feel are unknown.
- [ ] The videos are outside `git`, on the old computer's desktop: `kokxr-vr-simulasyon-3`, `kokxr-vazo-vr-simulasyon`, `kokxr-kilic-atolyesi-2`, `kokxr-cini-atolyesi-web`, `kokxr-cini-vr-simulasyon` (all `.webm`). They must be re-recorded if the code changes.


### Video recording: do not trust Playwright's recording
`recordVideo` and the CDP screencast can capture a WebGL frame only partially: objects disappearing in one eye, the outer roof "bursting" inward.
These are in the recording, not in the scene. On a static scene the draw buffer was identical 240/240 times, while the screencast gave 40 different images in 200 frames.
- **VR:** after rendering, `gl.finish()`, then take it to a 2D canvas with `drawImage`, `toBlob` JPEG, line up 30 frames/s and encode with Playwright's ffmpeg (`~/.cache/ms-playwright/ffmpeg-*/ffmpeg-linux`) using `libvpx-vp9 -deadline good -crf 20`.
- **Page with HTML UI:** `gl.finish()` after rAF + CDP screencast JPEG, browser `--use-angle=vulkan`. With gl-egl, fully black single frames appeared on the sword; with Vulkan they did not (RTX 3070 Ti; measure again on another computer).
- **With Vulkan** a new WebGL context can drop once at startup and come back: do not show an error immediately on `webglcontextlost`, and use `willReadFrequently: true` for 2D canvas textures.
- Look at the frame board yourself before delivery. For the simulator, `tests/xr-sim/` is on the `vaat-mokap` branch; the recording scripts were temporary and are not in the repo.
- Tests that use `channel: 'chrome'` (`vazo`, `vazo-xr-dugme`, `ui`, `galeri`, `maket-ic`, `maket-xr-dugme`) need Google Chrome.
- If 4173 is occupied, `npm run test:tarayici` will not start; give an empty port with `TEST_PORT=4178 npm run test:tarayici`.

---

## 1. The project at a glance

**3 November additional note — scope as corrected by the user:** The requested experience was to rotate and examine the same vase in 3D and also to restore it by assembling its broken pieces. The Ulu Camii scale model does not replace this request. For this reason a **Vase workshop** was added at `/workshops/vase`; it opens from the home page and the top menu. The vase is clearly labeled as representative, and there is no claim of a historical artifact.
**Latest user correction:** The flow of rotating by 90° with buttons / choosing slots was removed. The vase was produced in Blender 4.5.3 as six independent ceramic pieces with thickness. The model itself or the number on it is held with the mouse and dragged in the scene; when dropped close to the right place it aligns and seats automatically. Touch, returning on a wrong drop, progress, restart, Escape and a keyboard alternative are supported.
The source is `assets/vazo/vazo.blend`, the model in the app is `public/models/vase.glb`, the regeneration script is `scripts/vase_generate.py`. Design/interaction and verification details are in `docs/vase-model.md`.
**Current look:** On first opening, the vase is shown without marks, with a separate seamless body. When it has been broken apart and fully reassembled, the repair marks appear and are kept in examination mode. The general vase silhouette stays; the ring/text giving the exact position of the selected piece and the piece-specific silhouette highlight were removed.
The existing mosque scale model was kept. Related code: `src/features/workshops/vase/VaseWorkshop.tsx`,
`src/features/workshops/vase/vase.css`, `src/features/workshops/vase/vaseScene.ts`.
Check: `node tests/vase.mjs` (installed Google Chrome, running development server;
default `http://127.0.0.1:5173`, can be changed with `TEST_URL`).

**UI renewal:** In line with the user's request for a simple and modern interface, an off-white, pine green and bronze palette; a photo-led home page; active menu; artifact section links;
shared form, gallery and workshop styles were applied. Research sources, color ratios and test
commands are in `docs/ui-design.md`. `node tests/ui.mjs` checks four screen widths.

**Sword workshop (`/workshops/sword`):** Eight stages from ingot to sword with a representative model of the Topkapı Env. 1/90 sword, then a test area. Sources and representative limits are in `docs/sword-workshop.md`; historical texts only in `src/content/sword.ts`. Regeneration: `blender -b --python scripts/sword_texture.py`, then `scripts/sword_generate.py` (textures are outside git). Target damage `src/features/workshops/sword/engine/targets.ts`, motion `animation.ts`. Test: `TEST_GPU=1 node tests/sword.mjs`, `node tests/sword-logic.mjs`. Video: `node scripts/sword_video.mjs <file.webm>`.

**Ulu Camii scale model (rebuilt):** `src/features/scale-models/uluMosque*.ts`, generated by code. Exterior: stone facade, ribbed lead domes, octagonal drums, a crown gate with eleven rows of muqarnas, two different minarets, courtyard pavilions. Interior: with `İçeri gir` you walk with the keyboard (`W A S D`, arrow keys, `Shift`; with collisions), and when you approach a structure the `maket.icBilgiler` card opens. The inscription plaques and pier texts are crops of archive photos (`scripts/plaque_crop.py`, needs Pillow; output `public/images/ulu-mosque/model/`); which face they stand on is representative. The door axis, mahfil, lectern and closed south windows are from the Kültür Portalı text (`kp-ulu`). Image processing (AO, bloom) turns itself off on a slow device; to force high quality use `?kalite=yuksek`. Test: `node tests/model-interior.mjs`.

**Photo revision:** The palette was warmed slightly with a 90% existing + 10% warm tone mix.
The gallery was moved to first place on the artifact page; photos fit without cropping, discovery markers
stay aligned with the photo. Arrows, thumbnails, keyboard, mobile swipe and 100–300% zoom/fit were added.
The navigation directions were moved outside the photo, and a mode showing the whole photo was added.
`node tests/gallery.mjs`: 10 photos each of two artifacts, verified on desktop and mobile.

**KökXR** — "Dokunamadığın tarihe dokun." A **web application** (React + TypeScript + Vite) for the KÖK&KOD Hackathon (Vakıf Katılım + 42 Türkiye)
that lets people discover the foundation (vakıf) works in Bursa.

**Artifacts:** Bursa Ulu Camii · II. Murad (Muradiye) Külliyesi

| Feature | Where | Status |
|---|---|---|
| Home page, artifact selection, badges | `src/pages/AnaSayfa.tsx` | ✅ |
| **Vase workshop** — Blender model; hold, drag and assemble pieces in the scene with mouse/touch; on Quest with WebXR (tested in simulation) | `src/features/workshops/vase/VaseWorkshop.tsx`, `maket/vazoSahnesi.ts`, `maket/vazoXr.ts` | ✅ |
| Gallery + discovery points on photos | `src/features/heritage/components/Gallery.tsx` | ✅ |
| History, sources, 3-question test | `src/features/heritage/pages/ArtifactPage.tsx`, `Test.tsx` | ✅ |
| **Hold the artifact in your hand** — Ulu Camii representative 3D scale model (rotate, zoom, Parçala/Birleştir) | `src/features/heritage/components/ArtifactExplorer.tsx`, `maket/` | ✅ |
| **360° tour** — 360TR's official embed player (iframe, Ulu Camii only) | `src/components/Tur360.tsx` | ✅ (needs internet) |
| **Depth virtual walkthrough** — photo stops + AI depth map (2.5D) | `src/components/SanalGezinti.tsx`, `gezinti/` | ✅ |
| **Restoration task** — Muradiye tile panel puzzle | `src/components/Restorasyon.tsx` | ✅ |
| **Admin screen** — add/edit content, JSON export/import (specification 5.1.1) | `src/features/admin/AdminPage.tsx`, `EserFormu.tsx` | ✅ |
| End-to-end test (15 steps) | `tests/end-to-end.mjs` | ✅ 15/15 |

---

## 2. Moving the project to a new computer

The repo is on GitHub (**private**): `git@github.com:selamisimsek/kokxr.git` · branch: `master`

On the new computer:
```bash
git clone git@github.com:selamisimsek/kokxr.git      # the SSH key must also be added to GitHub on that computer
# or: git clone https://github.com/selamisimsek/kokxr.git   (Personal Access Token instead of a password)
cd kokxr
```
Between the two computers: `git pull` before starting work, `git add -A && git commit -m "…" && git push` when done.
The repo **must stay private** (permission to use the archive photos is not settled).

### What is not carried over (outside git, copy separately if needed)
| Folder | Size | Needed? |
|---|---|---|
| `proje bilgileri/` — specification, inventory PDFs, raw photo archive | 7.6 GB | Small documents (specification, presentation, mockup PNG) from Drive; the photo archive from the shared "Vakıf Eserleri Envanteri – Bursa Fotoğraf Arşivi" Drive folder. Only needed if **new content/photos** will be added; the app's photos are already in `public/` and in git. |
| `_eski/` | small | No (old, empty trial files) |
| `node_modules/` | — | No, installed with `npm install` |

---

## 3. Setup and running

Required: **Node.js 24+** (v24.22.1 on the old computer), npm, git.

```bash
npm install                                   # dependencies
npm run dev                                   # development: http://localhost:5173
npm run build && npm run preview -- --port 4173   # production build: http://localhost:4173
```

### End-to-end test
```bash
npx playwright install chromium firefox       # first time only (downloads ~300 MB of browsers)
npm run build && npm run preview -- --port 4173   # keep it open in a separate terminal
npm run test:e2e                              # Chromium 1280 + 360 px and Firefox 1280 px, 15 steps each
```
Screenshots are written to the `test-sonuclari/` folder (outside git). Expected: `15/15` in each configuration.

**Note:** In the Brave browser the 360° tour may not open because of Shields — use Chrome/Firefox for the demo.

---

## 4. Architecture and data model

- **All content is in JSON:** `src/content/artifacts/<id>.json`. A new artifact = a new JSON + `public/images/<id>/` photos; **the code does not change**
  (`src/infrastructure/contentRepository.ts` automatically loads all JSON files in the folder with `import.meta.glob`).
- **Type definitions:** `src/domain/artifact.ts` (`Eser`, `Kaynak`, `Gorsel`, `BilgiNoktasi`, `Soru`, `Tur`, `Tur360`, `RestorasyonGorevi`, `Maket`).
  Optional fields: `tur` (walkthrough), `tur360`, `restorasyon`, `maket` — the related section is not shown for an artifact that does not have it.
- **Admin screen** changes are kept in a `localStorage` (`kokxr-icerik`) overlay layer; it is written over the JSON defaults.
  To make them permanent: Admin → "JSON olarak indir" → put the file into `src/content/artifacts/` → commit.
- **Badges:** `localStorage` → `kokxr-rozetler` (artifact id = test badge, `<id>:restorasyon` = restoration badge).
- **Three.js** is loaded with a dynamic import only when the scale model/walkthrough is opened (a separate ~568 kB chunk).
- **Depth maps** (`public/depth/`) were produced offline with Depth Anything V2 (small) (`@huggingface/transformers`,
  model `onnx-community/depth-anything-v2-small`). They must be regenerated if a new walkthrough stop is added.

### Content rules (from AGENTS.md — very important)
- **Do not invent historical information.** Every text is tied via `kaynakId` to a source with a page number in the inventory PDF
  ("Vakıf Eserleri Envanteri – Bursa, Osmangazi, "Ulucami"/"II. Murad Külliyesi", s. X").
  Content without a source cannot be marked as "Kaynaklı bilgi" (the admin screen also enforces this).
- **Do not show 3D/VR/360° without data as if it existed.** The scale model and walkthrough are labeled "temsili" on screen; the 360° tour belongs to 360TR and a source link is shown.
- **Do not publish images with unclear licenses.** Permission to use the archive photos has not been confirmed by the sponsor → the repo must stay **private**.
- The photo → building matching was done not by guesswork but by checking in which section of the inventory PDF each was used.

---

## 5. Working with three agents

| Agent | Command | Role |
|---|---|---|
| Claude Code | `claude` | Lead: plan, content/data, code review, **commit** |
| Codex CLI | `codex` | Application code (carries out the task in `docs/archive/next-task.md`) |
| Antigravity | `agy` | Browser testing, writes the report (`docs/archive/test-report*.md`) |

Flow: Claude writes `docs/archive/next-task.md` → Codex implements → Claude reviews + commits → test (Antigravity or `npm run test:e2e`).
Two agents never touch the same file at the same time.

### Known pitfalls
- **When running Codex in the background**, stdin must be closed, otherwise it hangs with "Reading additional input from stdin…":
  ```bash
  codex exec --sandbox workspace-write -c sandbox_workspace_write.network_access=true -C . "<task>" < /dev/null
  ```
- The Codex sandbox makes `.git` read-only → **Codex cannot commit**; Claude (or you) commits.
- `agy -p` (command-line mode) cannot ask for permission; for tests that must run commands, `--dangerously-skip-permissions` is needed
  (with the user's approval). `--mode auto` was not supported on this computer.
- `pkill -f "codex exec"` also kills Claude's own shell; find the PID with `pgrep -f "codex exe[c] --sandbox"`.

---

## 6. Remaining work (in order of priority)

**Code freeze on the evening of 4 November — after that only bugs that break the demo are fixed.**

1. **UI renewal completed** — a light, simple and modern design was applied according to the user's latest request.
   This design replaced the earlier dark-gold theme proposal. Details: `docs/ui-design.md`.
2. **PWA** — an app installable on phone/desktop (manifest + service worker; photos cached). Strengthens the specification item
   "mobile or desktop application". The 360° tour still needs internet.
3. **Backup demo video completed** — re-recorded with `node scripts/demo_video.mjs <output.webm>` (first `npm run build` and `npm run preview` on 4173). Record it again before the final if the UI changes; the video is outside git.
4. Minor: extra space in the accessible name in the admin list ("Düzenle : …") — `src/features/admin/AdminPage.tsx` `sr-only` span.
5. Optional: a scale model for Muradiye too; a small "hand-rotatable" object model for the Ulu Camii minbar/şadırvan.

### Final day checklist
- [ ] The `dist/` from `npm run build` and the backup video **on two laptops and on USB**
- [ ] Demo in Chrome/Firefox, **not Brave**; internet connection tried for the 360° tour
- [ ] Browser `localStorage` clean before the demo (Admin → "Tüm üst katmanı sıfırla") or a prepared demo state
- [ ] In the presentation, "working prototype" and "vision (VR, time layer…)" on separate slides
- [ ] Every team member can explain the architecture and data model in 1 minute (specification 5.1.2)

**Suggested 3-minute demo flow:** at the end of `docs/archive/test-report-2.md`.

---

## 7. Open issues (on the user/team side)

- **Permission to use the archive photos** — written confirmation from the sponsor (Vakıf Katılım).
- **Full title of the inventory book** — the source lines currently say "Vakıf Eserleri Envanteri – Bursa".
- **360TR** — the official embed code (with a free account: https://www.360tr.com/tr/hesabim/embed/yeni?tour=359) and/or an information e-mail.
  Currently the publicly available `https://www.360tr.com/embed/bursa-ulu-camii` address is used.
- To the organizers: whether a web-based (PWA) application counts as a "mobile/desktop application".

---

## 8. Important files

| File | Content |
|---|---|
| `AGENTS.md` | Project rules for all agents |
| `docs/plan.md` | Web MVP plan, specification mapping |
| `docs/archive/status.md` | End-of-day status note |
| `docs/archive/next-task.md` | The last task given to Codex (Task 4 — completed) |
| `docs/archive/test-report.md`, `docs/archive/test-report-2.md` | Antigravity report and the latest end-to-end test |
| `docs/archive/chat-summary.md` | The project's starting context (team, old Unity plan, sources) |
| `proje bilgileri/KÖK&KOD Hackathon _ Yarışma Şartnamesi_TR.pdf` | Specification (outside git) |
