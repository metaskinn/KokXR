# Task 5 — Sword workshop (`/atolye/kilic`)

**Assigned to:** Codex CLI
**Read first:** `AGENTS.md`, `docs/kilic-atolyesi.md`, `docs/ui-tasarim.md`, `src/data/kilic.ts`, `src/pages/VazoAtolyesi.tsx`, `src/components/maket/vazoSahnesi.ts`

User request: "Vazo benzeri, gerçekçi; demiri alıp en baştan Fatih Sultan Mehmed'in kılıcını yapalım, sonra test edelim. En iyi tasarım, kaliteli, yeni nesil." (Similar to the vase, realistic; let's take the iron and make the sword of Fatih Sultan Mehmed from the very beginning, then test it. Best design, quality, new generation.) Not an ordinary page, but a **cinematic, full-screen-feeling** experience.

## Do not touch

`scripts/`, `assets/`, `public/`, `src/data/`, `proje bilgileri/`, `_eski/`. **Do not write historical text**: all historical/sourced text comes from `src/data/kilic.ts`. If needed, add only interface/game text (that contains no historical claim). Do not use misleading expressions such as "360°", "VR", "birebir", "gerçek kılıç". The `kilicTanitim.durustluk` text must always be visible on the page.

## Files

- `src/pages/KilicAtolyesi.tsx`, `src/pages/kilic.css`
- `src/components/kilic/sahne.ts` (dynamic import; renderer, light, camera, events)
- `src/components/kilic/dovme.ts` (blade deformation), `durum.ts` (pure game logic, no DOM/three), `parcacik.ts`, `ses.ts`, `test.ts`
- `App.tsx`: route and "Kılıç atölyesi" in the top menu; `AnaSayfa.tsx`: an introduction section in the same style under the vase introduction (`kilicTanitim`).
- `tests/kilic.mjs` (Chromium, 1280 and 360 px; `TEST_URL`, default `http://127.0.0.1:4173`; do not specify `channel`).
- Three.js should load only when the page is opened. Do not add a new dependency.

## Models (ready)

`public/modeller/kilic.glb`: `Namlu`, `Namlu_Kakma`, `Balcak`, `Sap`, `Kabza_Sol`, `Kabza_Sag`, `Percin_1..4`. Unit metre. Origin guard (balçak) centre; blade +X, **back +Y (edge −Y)**, thickness Z.

`public/modeller/kilic-atolye.glb`: use the node names (Blender → glTF: x→x, z→y, y→−z). Main positions (glTF):
- Furnace mouth / ember `Kor`: (−2.25, 0.95, −2.02); `Koruk_Deri` bellows (−3.7, ~0.78, −1.75) (scale when pressed)
- Anvil `Ors` top face: (0, 0.876, −0.1); `Cekic_Bas`, `Masa_1`
- Water `Su` (1.95, 0.40, 0.15); `Bileme_Tasi` (3.05, 0.82, −1.2), rotate around the z axis; `Tezgah_Ust` (2.9, 0.86, −2.5); `Kilic_Yumurtasi` (2.8, 0.93, −2.5)
- Test area around x=14: `Avlu_Zemin`, `Avlu_Duvar`, `Hasir_Rulo`/`Hasir_Direk`/`Hasir_Kaide` (12, 0, 0), `Test_Kutuk` (14, 0.74, −0.1), `Test_Kumas` (16.15, 1.95, −0.1)

There should be no ignored texture place. Change the `Kor` emissive intensity with the bellows.

## Forging deformation (`dovme.ts`) — the heart of the project

In the `Namlu` geometry `uv1` (TEXCOORD_1): `u = uv1.x` (0–1 from hilt to tip), `a = 1 - uv1.y` (around the ring). The finished shape is in POSITION. Blender centre axis: `Cf(u) = (1.06·u, 0.070·u^2.3, 0)` (in glTF Y = curvature). For each vertex `Fsec = P_son − Cf(u)`.

12 regions: each with `ilerleme p` (0–1), `isi` (°C-like 20–1200), `cilt` (polish 0–1), `kabuk` (oxide 0–1). Linear interpolation between regions per vertex, `s(p)=smoothstep`:

- Ingot cross-section: `Bsec(a) = (0, cos(2πa)·W, sin(2πa)·T)`, `W=.024, T=.018`; for the egg shape `·sqrt(max(1-(2u-1)^2, .02))^.75`.
- The length of each region `L_i = mix(L0/12, 1.06/12, s(p_i))`, `L0=.20`. Axis: `X(u)` is the cumulative sum of these lengths (interpolated within the region); `Y(u) = Cf(u).y · s(average p)`; so the ingot **really lengthens**. The position of the hilt (`u=0`) stays fixed; during forging shift the sword on the anvil so that the struck region comes under the hammer.
- `P = (X(u), Y(u), 0) + mix(Bsec, Fsec, s(p))`. For surface roughness, while `p<1` add a small hammer mark coming from the impact point (vertex offset noise); fade it out as `p→1`.
- Vertex update only for the changed regions, instead of `computeVertexNormals`: blend the spherical normal on the ingot and the original normal on the finished one with `s(p)` (cheap and seamless).

Material `onBeforeCompile`: vertex attributes `aIsi`, `aKabuk`, `aCilt`. Fragment: black-body colour for `isi` (≈500°C dark cherry → 800 orange → 1100 yellow-white), multiply emissive; for `kabuk` darken the base colour, change metalness and roughness (noise pattern); `cilt` lowers roughness. That is, the sword glows red as it heats, forms scale, and shines as it is sharpened. **`Namlu_Kakma`, `Balcak` etc. are visible only in the Kuşanma (mounting) stage.**

## Flow (`durum.ts`, not saved, from scratch on every refresh)

A thin stage strip at the top. Each stage: a short instruction, the relevant `kilicAsamaBilgileri` text + `Kaynak:` line, and an **"Ustaya bırak"** button (completes that stage automatically at medium quality, with animation; for the jury demo). Also "Baştan başla" and sound on/off.

| Stage | Interaction | Rule |
|---|---|---|
| 1 Ingot | Click the `Kilic_Yumurtasi` on the bench, it flies to the furnace with tongs | — |
| 2 Heating | Hold the bellows pressed (mouse/finger; keyboard Space). Temperature bar + real colour | Heats slowly without bellows. >1180 burning: quality drops, warning |
| 3 Forging | The sword comes to the anvil. Click/drag: the struck region is chosen from the cursor; the hammer descends drawing a real arc, spark, sound, camera shake | Impact effect depends on temperature: 750–1150 full; 550–750 half; <550 ineffective, `gerilim` (stress) increases, >1 crack risk. When it cools "Yeniden ısıt". Ends when all regions reach p≥.98 |
| 4 Quenching | The whole blade heats up, the "Suya daldır" button is held pressed; steam, hiss | Best 780–880. High: crack probability/quality drops. Low: hardness drops |
| 5 Sharpening | The sword comes to the stone, the stone turns. Move the cursor along the blade region by region; sparks | `cilt` increases. Staying too long in the same place heats: 'burning' penalty |
| 6 Mounting | Click `Balcak`, `Kabza_Sol`, `Kabza_Sag`, `Percin_*` in order: each comes into place with animation; then the gold band (alpha decision) slowly appears. Collective-production note | — |
| 7 Inspection | OrbitControls + zoom, lit presentation. `kilicParcaNotlari` numbered points (three vector → screen coordinate HTML button), on click a panel + source. Quality card. Below it "Test alanına geç" | — |
| 8 Test area | The camera goes to the courtyard (daylight). Three targets: `Hasir_Rulo`, `Test_Kutuk`, `Test_Kumas`. Select a target, draw a cutting line by dragging in the scene (the sword is swung in that direction, trail effect) | Below |

**Quality:** `sertlik` (quenching), `keskinlik` (sharpening), `biçim` (forging temperature/stress), `yanma` penalties. Ustaya bırak = all ~.6. If there is a crack the line is visible (bad), it can still be tested, it can break.

**Cutting:** `güç = keskinlik·.55 + sertlik·.45`, plus if the cutting line angle is vertical/horizontal and fast. Straw mat: güç≥.35 splits in two (clone + `material.clippingPlanes`, the top part falls, simple gravity + ground). Log: mark depth according to power, ≥.8 up to halfway; it never says "not split in two". Cloth (loose): güç≥.72 is cut, if it stays below it only sways. On a weak attempt steel sound, spark, a notch if needed. Score card + if won, the "Kılıç Ustası" badge (instead of `rozetKazan('kilic-ustasi')` a local display on this page is enough; you may take `rozetKazan` from App as a prop). "Hedefleri yenile".

## Visual quality (new generation)

- Renderer: `ACESFilmicToneMapping`, `SRGBColorSpace`, `PCFSoftShadowMap`, `Antialias`, `EffectComposer` + `RenderPass` + `UnrealBloomPass` (light, noticeable when heated) + `OutputPass`. `RoomEnvironment` + PMREM, low intensity in the workshop, high in the courtyard.
- The workshop is dark, the furnace `PointLight` flickers (`Math.sin` + noise) and strengthens with heat; the heated blade also emits a small light. The dimness of the scene is cinematic, but objects stay readable.
- Spark: `THREE.Points` pool, gravity, colour over lifetime; steam/smoke: soft sprite pool (canvas radial gradient). Bloom makes the spark glow. Light ember particles above the furnace.
- Cinematic camera: 1.2 s soft transition on stage change; choose the target positions in the workshop yourself, so that the main object is clear at every stage.
- Touch: a small cursor highlight (hover with `Raycaster`: the object's emissive increases slightly, the cursor changes).
- `ses.ts`: no files, produce with `WebAudio`: hammer (sine/square short ring + noise), furnace roar (filtered noise, increases with the bellows), water hiss, sharpening (band noise), cut (fast sweep), steel "ting". On by default but starts at the first user interaction; can be turned off.
- Interface: the scene is full width and full screen height; controls are glassy dark panels, bronze accent (consistent with the colours of `docs/ui-tasarim.md`). Side panel on desktop, bottom drawer on phone. Full-screen button.

## Accessibility and robustness

A keyboard equivalent for every interaction (region selection ←→, Enter strike; Space bellows; for Cutting target + "Kes" button). `aria-live` stage/result announcements, visible focus, ≥44 px touch, no overflow at 360 px. `prefers-reduced-motion`: less shake and particles, short camera transition. No WebGL/load error: a clear message. When the tab is hidden the loop stops. When the route changes everything is `dispose`d, events cleaned up, sound stopped. If FPS drops, `pixelRatio` and bloom decrease gradually.

## To count as done

- `npm run build` without errors; `node tests/uctan-uca.mjs chromium 1280` and `tests/kilic.mjs` pass. Sword test: all of the stages **both by hand (real mouse events) and with Ustaya bırak**, the deformation really lengthening (measured bounding box), visibility after mounting, a piece separating on cutting, no canvas after dispose, no errors in the console.
- **Look at the screenshots** (`test-sonuclari/kilic-*.png`): each stage, the glowing ingot, mid-forging, the finished sword, the test. If it is dark, if it looks empty, if the sword is not visible, fix it. If it is not realistic, improve it: quality is this task's success criterion.
- If there is a GPU run with `--use-gl=angle --use-angle=gl-egl --ignore-gpu-blocklist --enable-gpu`, otherwise software.
- `.git` may be read-only; Claude makes the commit. Do not touch port 4173, use your own port. Add a "Sonuç" (Result) at the end of this file: what was done, what was tested, what is missing.
