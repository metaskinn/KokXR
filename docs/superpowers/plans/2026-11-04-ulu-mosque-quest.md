# Ulu Camii model — Meta Quest (WebXR) implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Open the representative Ulu Camii model in VR in the Quest Browser: first examine it as a model on a table, then go inside, walk at real scale and read the sourced info cards.

**Architecture:** No new application or engine. A WebXR session is added to the existing `modelScene.ts` scene. The camera is attached to a "rig" group: in the model view the rig is scaled 100× (the world appears table-sized), indoors it becomes 1×. Calculations are kept in `three`-free pure modules and tested in Node; the VR interface is `CanvasTexture` panels, because HTML is not visible inside VR.

**Tech Stack:** React 19, TypeScript, Three.js 0.187 (`renderer.xr`), Playwright. **No new dependencies.**

**Spec:** No separate spec; the user skipped the question stage and asked for a plan. Product decisions are in the "Assumptions" section below and are open to user approval.

**Branch:** `ulu-camii-quest` (on top of `origin/ulu-camii-maket`, `57722ed`). Merging into `master` is not part of this plan.

## Assumptions (the user will approve)

1. Flow: **model view → go inside → walk → read an info card → exit.**
2. Target device is Quest 2 or above, two controllers, Quest Browser.
3. The demo is not published publicly; it is opened on the Quest from the developer's computer over USB (`adb reverse`).
4. The desktop and phone experience stays exactly the same; the VR button appears only in browsers that support it.

## Out of scope (for later)

Hand tracking; holding and turning the model with a controller; 3D "i" markers inside the model; audio narration; AR/passthrough; the real 3D model of the controller (`XRControllerModelFactory` downloads the model from the internet, a risk in the demo); walking out through the doors; Muradiye; the sword and vase workshops.

## Global Constraints

- The interface is Turkish; no historical text is written, all card text and sources come from the `maket.icBilgiler` + `kaynaklar` data.
- In VR too, this label is visible on screen: `Temsilî maket · Gerçek bir 3B tarama değildir`.
- Misleading expressions such as "gerçek", "birebir", "dijital ikiz" are not used.
- The repo stays private; no public release until photo permission is clarified.
- Desktop behavior is not broken: `node tests/model-interior.mjs` passes after every task.
- The `package.json` dependencies do not change.
- Target frame rate: at least **72 FPS** on the Quest.

## File structure

| File | Responsibility |
|---|---|
| `src/features/scale-models/walkingCollision.ts` (new) | Pure collision check moved from `modelScene.ts` |
| `src/shared/xr/xrMotion.ts` (new) | Pure calculations: dead zone, walking, turning, rig position |
| `src/shared/xr/xrText.ts` (new) | Pure calculations: menu items, line wrapping, panel hit-test |
| `src/shared/xr/xrPanel.ts` (new) | Draws the menu and info card as a `CanvasTexture` plane |
| `src/features/scale-models/xrSession.ts` (new) | Session, rig, controller, ray, view transitions |
| `src/features/scale-models/modelScene.ts` | Connects the XR session, opens the XR branch in the frame loop |
| `src/features/heritage/components/ArtifactExplorer.tsx` | `VR'da aç` button, support check, error message |
| `tests/model-xr-logic.mjs` (new) | Pure module tests (`node`, Node's built-in TS support, like `tests/sword-logic.mjs`) |
| `tests/model-xr-button.mjs` (new) | Button and error flow with a fake `navigator.xr` (Playwright) |

## Review Focus

1. **A browser that does not support VR, or a denied permission:** the button is not visible or a Turkish error appears, the model keeps working on screen → Task 2 test.
2. **The session being closed externally with the Meta button:** the view, camera, light and background return to the desktop state, the tab does not freeze → Task 2 device/emulator check.
3. **No controller, a single controller, or an empty `gamepad`:** no error is thrown; the menu can be used with a single controller → Task 3 test.
4. **Joystick drift and holding down:** no movement below the dead zone, the snap turn happens once per push → Task 3 test.
5. **Long card text:** the longest text (`dogu-kapisi`, 280 characters) and the source line fit the panel, Turkish letters are not corrupted → Task 5 test.

---

### Task 0: Verify the baseline and measure the load

**Files:** No code changes.

- [ ] **Step 1:** Run `npm install`; `git status` must stay clean. `node -v` is currently v22.23.3, `HANDOFF.md` asks for 24+; if a mismatch arises, tell the user.
- [ ] **Step 2:** `npm run build` and, in a separate terminal, `npm run preview -- --port 4173`. Expected: no errors.
- [ ] **Step 3:** `node tests/model-interior.mjs`. Expected: the `1000px` and `360px` lines pass. If they do not, stop and report; this branch contains code that was never taken into `master`.
- [ ] **Step 4:** With the model open, temporarily print the `renderer.info.render.calls` and `.triangles` values in the outside and inside views and note them, then revert the temporary code. Rough budget: for Quest 2, a stereo total of ~1 million triangles and ~200 draw calls. If exceeded, the reduction order in Task 6 is applied from the start.

### Task 1: Pure motion calculations

**Files:**
- Create: `src/features/scale-models/walkingCollision.ts`, `src/shared/xr/xrMotion.ts`, `tests/model-xr-logic.mjs`
- Modify: `src/features/scale-models/modelScene.ts:185-192`

**Interfaces:**
- Produces:
  - `carpiyor(yurume: IcYurume, x: number, z: number, r: number): boolean`
  - `OYUNCU_YARICAP = 0.45` (moved here from `modelScene.ts`)
  - `oluBolge(d: number): number` — 0 if `|d| < 0.2`, above that it is rescaled to the 0–1 range, the sign is preserved
  - `XR_YURUME_HIZI = 1.6` (m/s), `XR_DONUS = Math.PI / 6`
  - `yurumeAdimi(bas: {x,z}, ileriYon: {x,z}, cubuk: {x,y}, dt: number, engel: (x,z)=>boolean): {x,z}` — the new head position. `cubuk.y < 0` is forward (WebXR). Tries axis by axis, slides along the wall. `dt` is counted as at most 0.1.
  - `anlikDonus(sagX: number, basili: boolean): { yon: -1|0|1; basili: boolean }` — triggers once while `|x| > 0.7`, re-arms when `|x| < 0.3`
  - `basCevresindeDon(rig: {x,z}, bas: {x,z}, aci: number): {x,z}` — `x' = (rx-bx)cos a + (rz-bz)sin a + bx`, `z' = -(rx-bx)sin a + (rz-bz)cos a + bz`
  - `masaRig(aci: number, olcek: number): {x,y,z,rotY}` — `MASA_Y = 0.9`, `MASA_UZAKLIK = 1.2`; `x = D sin a`, `y = -MASA_Y·olcek`, `z = -D cos a`, `rotY = π - a`, `D = MASA_UZAKLIK·olcek`
  - `MASA_OLCEK_ILK = 100`, `MASA_OLCEK_MIN = 40`, `MASA_OLCEK_MAX = 200`
  - `durakRig(konum: number[], bak: number[], basYerel: {x,z}, zeminY: number): {x,y,z,rotY}` — `rotY = atan2(-dx, -dz)`; the rig position subtracts the `basYerel` rotated by `rotY`, so that the head comes to the x/z of `konum`

- [ ] **Step 1: Write the failing test** (`node:assert/strict`, the `yakin` helper function with 1e-6 tolerance)

```js
assert.equal(oluBolge(0.15), 0); assert.equal(oluBolge(-0.1), 0); assert.equal(oluBolge(1), 1); assert.equal(oluBolge(-1), -1)
const serbest = () => false
yakin(yurumeAdimi({x:0,z:0}, {x:0,z:1}, {x:0,y:-1}, 0.1, serbest), {x:0, z:0.16})
yakin(yurumeAdimi({x:0,z:0}, {x:0,z:1}, {x:0,y:-1}, 5, serbest), {x:0, z:0.16})   // dt limit
yakin(yurumeAdimi({x:0,z:0}, {x:1,z:0}, {x:0,y:0}, 0.1, serbest), {x:0, z:0})
yakin(yurumeAdimi({x:0,z:0}, {x:0.6,z:0.8}, {x:0,y:-1}, 0.1, (x) => x > 0), {x:0, z:0.128}) // slides along the wall
let d = anlikDonus(0.9, false); assert.deepEqual(d, {yon:1, basili:true})
d = anlikDonus(0.9, d.basili); assert.equal(d.yon, 0)
d = anlikDonus(0.1, d.basili); assert.equal(d.basili, false)
yakin(basCevresindeDon({x:1,z:0}, {x:0,z:0}, Math.PI/2), {x:0, z:-1})
const m = masaRig(0, 100); yakin(m, {x:0, y:-90, z:-120, rotY:Math.PI})
const k = durakRig([5,2.7,7], [5,2.7,20], {x:0,z:0}, 1.1); assert.equal(k.x, 5); assert.equal(k.y, 1.1); assert.equal(k.z, 7)
const y = { sinir:{x0:-10,x1:10,z0:-10,z1:10}, kutular:[{x0:1,x1:2,z0:1,z1:2}], daireler:[{x:-5,z:-5,r:1}], gorusKesenler:[], gozY:2.7 }
assert.equal(carpiyor(y, 0, 0, .45), false); assert.equal(carpiyor(y, 1.5, 1.5, .45), true)
assert.equal(carpiyor(y, -5, -5, .45), true); assert.equal(carpiyor(y, 9.9, 0, .45), true)
```

- [ ] **Step 2:** `node tests/model-xr-logic.mjs`. Expected: module-not-found error.
- [ ] **Step 3:** Write the two modules. Change the `carpiyor` closure in `modelScene.ts` to call the new function; the behavior stays the same.
- [ ] **Step 4:** `node tests/model-xr-logic.mjs` passes; `npm run build` and `node tests/model-interior.mjs` pass.
- [ ] **Step 5:** Commit: `Quest: saf hareket hesapları ve çarpışma modülü`

### Task 2: VR session and button

**Files:**
- Create: `src/features/scale-models/xrSession.ts`, `tests/model-xr-button.mjs`
- Modify: `src/features/scale-models/modelScene.ts`, `src/features/heritage/components/ArtifactExplorer.tsx`

**Interfaces:**
- Consumes: `masaRig`, `MASA_OLCEK_ILK` (Task 1)
- Produces:
  - `MaketSahnesi.xrBaslat(): Promise<void>` — if denied, the Promise is rejected
  - `SahneSecenek.xrDegisti?: (aktif: boolean) => void`
  - `xrOturumuKur({ renderer, scene, camera, ... }): { baslat(): Promise<void>; kare(dt: number): void; bitir(): void; rig: THREE.Group }`

- [ ] **Step 1: Write the failing test** (`tests/model-xr-button.mjs`, a `navigator.xr` fake via `addInitScript`; the `chrome` + swiftshader settings from `tests/model-interior.mjs`)
  - `xr_yok`: `navigator.xr` is `undefined` → no `VR'da aç` button, `İçeri gir` works.
  - `destek_yok`: `isSessionSupported → false` → no button.
  - `reddedildi`: `isSessionSupported → true`, `requestSession` throws `NotAllowedError` → the button is visible; on click `VR oturumu başlatılamadı. Maketi ekranda kullanmaya devam edebilirsin.` appears; `İçeri gir` is still enabled; no console error.
- [ ] **Step 2:** Run the test. Expected: `reddedildi` cannot find the button.
- [ ] **Step 3: Connect the scene**
  - `renderer.xr.enabled = true`, `renderer.xr.setReferenceSpaceType('local-floor')`, `renderer.xr.setFoveation(1)`.
  - `navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor'] })` is called inside the button click; then `renderer.xr.setSession`.
  - On entry: leave with `icMekan(null)`, add the camera to the rig, apply `masaRig(0, MASA_OLCEK_ILK)`, make `scene.background` a flat `#1a2b25` (a textured background looks glued to the head in VR), add a dark floor disc of 6 m radius to the rig (the rig's local y=0).
  - On `sessionend`: take the camera out of the rig, restore `baslangic`/`baslangicHedef`, the background, `camera.near/far`, `boyutla()` and `xrDegisti(false)`.
  - At the start of the frame loop: if `renderer.xr.isPresenting`, OrbitControls, `composer`, adaptive quality and `isaretleriKonumla` are skipped; `xr.kare(dt)`, `bilgiGuncelle()` and `renderer.render(scene, camera)` run. The layers go to the target instantly without animation in XR and the shadow is updated once.
  - At the start of `boyutla`: `if (renderer.xr.isPresenting) return`. In `temizle`, if there is an open session, first `session.end()`.
- [ ] **Step 4: Add the button** in `EseriEleAl.tsx`: put the result of `navigator.xr?.isSessionSupported('immersive-vr')` into state, a `VR'da aç` button inside `maket-kontrol`; the error message via `maket-durum` + `aria-live`. Before entry `setDurak(null)`, `setParcali(false)`.
- [ ] **Step 5:** `node tests/model-xr-button.mjs`, `node tests/model-interior.mjs`, `npm run build` pass.
- [ ] **Step 6: Emulator check.** In Chrome with the Immersive Web Emulator extension: `VR'da aç` → the model is in front and at table height; close the session from the emulator → the desktop view is as before, dragging works. If the rig scale distorts the image, the model root and `kaide` are scaled by 0.01 in a single group instead of the rig, and the shadow camera is shrunk by the same ratio.
- [ ] **Step 7:** Commit: `Quest: WebXR oturumu ve VR'da aç düğmesi`

### Task 3: Controllers and model view

**Files:**
- Modify: `src/features/scale-models/xrSession.ts`, `tests/model-xr-logic.mjs`, `src/shared/xr/xrMotion.ts`

**Interfaces:**
- Consumes: `oluBolge`, `masaRig`, `MASA_OLCEK_*` (Task 1), `rig` (Task 2)
- Produces: `kumandaGirdisi(kaynaklar: Iterable<{handedness: string; gamepad?: {axes: readonly number[]; buttons: readonly {pressed: boolean}[]}}>): { solX, solY, sagX, sagY, menu: boolean }` (`xrHareket.ts`). On the Quest the stick is `axes[2]`, `axes[3]`; the menu is `buttons[5]` (B/Y). If there is a single controller, its stick counts as both right and left.

- [ ] **Step 1: Add failing tests**
  - Empty array → all values 0, `menu:false`.
  - No `gamepad` → no error, 0.
  - `axes` has only 2 elements → no error, 0.
  - A single right controller `axes:[0,0,.5,-.8]` → `sagX=.5`, `solY=-.8`.
  - Two controllers → each hand writes to its own axis.
- [ ] **Step 2:** The test fails.
- [ ] **Step 3:** Write `kumandaGirdisi`. In `xr.kare`, in the model view: with `oluBolge(sagX)`, `aci += x·dt·1.2`; with `oluBolge(sagY)`, `olcek *= exp(y·dt·1.2)`, clamp between `MASA_OLCEK_MIN..MAX`, apply `masaRig`.
- [ ] **Step 4:** The tests pass; in the emulator the model rotates and grows/shrinks with the stick.
- [ ] **Step 5:** Commit: `Quest: kumanda girdisi ve maket görünümü`

### Task 4: Walking indoors

**Files:**
- Modify: `src/features/scale-models/xrSession.ts`, `src/features/scale-models/modelScene.ts`, `src/features/scale-models/uluMosqueInterior.ts` (only to expose the floor height)

**Interfaces:**
- Consumes: `yurumeAdimi`, `anlikDonus`, `basCevresindeDon`, `durakRig`, `carpiyor`, `kumandaGirdisi`
- Produces: `xr.gorunum(durakId: string | null): void`. `null` is the model view, an id is 1× scale at that stop. `ZEMIN_Y`: the top surface of the interior floor, exposed from `uluMosqueInterior.ts` (the desktop `gozY = 2.7` does not suit a real seated or standing user; in VR the device supplies eye height).

- [ ] **Step 1:** Make the `camera.position` reads inside `bilgiGuncelle` go through `bakisKonumu()`: in XR `camera.getWorldPosition`, otherwise `camera.position`. The desktop test passes unchanged.
- [ ] **Step 2:** Split the light, ambient and `iceride` transitions inside `icMekan` into a function `icDurumu(iceride: boolean)` that does not touch the camera; `icMekan` calls it. `node tests/model-interior.mjs` passes.
- [ ] **Step 3:** Write `xr.gorunum` and the interior branch in `kare`: with the left stick `yurumeAdimi(bas, ileriYon, ...)`, obstacle `carpiyor(yurume, x, z, OYUNCU_YARICAP)`, apply the resulting difference to the rig. With the right stick `anlikDonus` + `basCevresindeDon` and `rotY += aci`. Movement is controlled only by the stick; physically walking in the room and passing through a wall is out of scope.
- [ ] **Step 4:** Temporarily open a stop in the emulator and verify: one starts standing on the floor, at the `giris` stop one looks south, pushing forward stops at the wall.
- [ ] **Step 5:** `npm run build`, `node tests/model-xr-logic.mjs`, `node tests/model-interior.mjs` pass.
- [ ] **Step 6:** Commit: `Quest: iç mekânda çubukla yürüme ve anlık dönüş`

### Task 5: Menu and info-card panels

**Files:**
- Create: `src/shared/xr/xrText.ts`, `src/shared/xr/xrPanel.ts`
- Modify: `src/features/scale-models/xrSession.ts`, `src/features/scale-models/modelScene.ts`, `tests/model-xr-logic.mjs`

**Interfaces:**
- Consumes: `xr.gorunum` (Task 4), `parcala`, `kaynakMetni` (`KaynakSatiri.tsx`), `SahneSecenek.bilgiler`
- Produces:
  - `SahneSecenek.kaynaklar?: Kaynak[]`
  - `menuOgeleri(d: { iceride: boolean; parcali: boolean; duraklar: {id,ad}[] }): {id: string; ad: string}[]` — outside: `iceri`→"İçeri gir", `parcala`→"Parçala" or "Birleştir", `cik`→"VR'dan çık". Inside: `disari`→"Dışarı çık", each stop `durak:<id>`, `cik`.
  - `satirKir(metin: string, olc: (s: string) => number, genislik: number): string[]`
  - `menuIsabet(v: number, ogeSayisi: number, baslikOrani: number): number | null` — `v` is the uv value (1 is top); `null` if it falls in the header band
  - `xrPaneli(...)`: `{ nesne: THREE.Mesh; ciz(ogeler): void; dispose(): void }`; `bilgiPaneli(...)`: `{ nesne; goster(baslik, metin, kaynak): void; gizle(): void; dispose(): void }`

- [ ] **Step 1: Add failing tests**
  - `menuOgeleri` outside `['iceri','parcala','cik']`; `Birleştir` when `parcali:true`.
  - Inside, 10 items for 8 stops, the first `disari`, the last `cik`.
  - `satirKir` with a fake measure (`s => s.length`) does not split words; it does not overflow from a 100-character word (hard-splits).
  - All the `icBilgiler` text in `ulu-camii.json`, together with its source, at 900 px width with a measure of 0.55 × 34 px per character, comes to at most 13 lines.
  - `menuIsabet(0.95, 3, 0.2)` → `null`; `menuIsabet(0.75, 3, 0.2)` → `0`; `menuIsabet(0.05, 3, 0.2)` → `2`.
- [ ] **Step 2:** The test fails.
- [ ] **Step 3:** Write `xrMetin.ts` and `xrPanel.ts`. 1024 px canvas, `MeshBasicMaterial`, `toneMapped:false`, bold sans-serif, dark text on a light background. Fixed text in the menu header: `Temsilî maket · Gerçek bir 3B tarama değildir`.
- [ ] **Step 4:** Connect to `xrOturum.ts`:
  - Two `renderer.xr.getController(i)` are added to the rig, with a thin ray line on each.
  - On the `select` event, `Raycaster` looks at the menu and card. `uv.y` → `menuIsabet` → action. Clicking the card calls `bilgiKapat()`.
  - B/Y opens and closes the menu; the menu is open when the session opens.
  - The panels are rig children, at the moment they open they are 1.3 m in front of the head and facing the head; they stay the right size with the rig scale.
  - When `bilgiDegisti` fires, the card also draws the `Kaynak: …` line with `maket.icBilgiler` + `kaynakMetni`; if no source is found, `Kaynak bilgisi bulunamadı.`
  - `cik` → `session.end()`. The textures are `dispose`d in `temizle`.
- [ ] **Step 5:** The tests and `npm run build` pass; try every menu item and the card in the emulator.
- [ ] **Step 6:** Commit: `Quest: VR menüsü ve kaynaklı bilgi kartları`

### Task 6: Verification on a real device and documents

**Files:**
- Modify: `HANDOFF.md` (below the Ulu Camii model paragraph; only on this branch)

**Prerequisite:** A Quest device, developer mode, a USB cable, `adb` on the computer. Without a device this task cannot be done; the feature is reported as "tried only in the emulator".

- [ ] **Step 1:** `npm run build && npm run preview -- --port 4173`, `adb reverse tcp:4173 tcp:4173`, in the Quest Browser `http://localhost:4173/artifact/ulu-mosque`. Expected: `VR'da aç` is visible (`localhost` counts as secure, HTTPS is not needed).
- [ ] **Step 2:** With a temporary `?xrolcum=1`, write the FPS in the menu header. Read it in the outside view, at the şadırvan and at the mihrab, and note it.
- [ ] **Step 3:** If below 72 FPS, apply in order, re-measure at each step, and stop at the first step that meets the target:
  1. In XR, `renderer.shadowMap.enabled = false` and the materials are updated.
  2. Reduce the interior lights from 4 to 2.
  3. `renderer.xr.setFramebufferScaleFactor(0.8)`.
  If it is still not enough, stop and report the numbers to the user; model simplification is a separate job.
- [ ] **Step 4:** Manual checklist:
  - [ ] The model is at the right size and height
  - [ ] Rotating and enlarging with the stick
  - [ ] Parçala/Birleştir
  - [ ] Go inside, all stops
  - [ ] Walking and wall collision
  - [ ] Snap turn
  - [ ] The card is readable, Turkish letters are correct, the source is visible
  - [ ] Menu with a single controller
  - [ ] The page works after exiting with the Meta button
  - [ ] No excessive heating/freezing after 10 minutes
- [ ] **Step 5:** Remove the `?xrolcum` code. A short paragraph in `HANDOFF.md`: usage, the `adb reverse` command, the measured FPS, the device model, test commands.
- [ ] **Step 6:** Full regression: `npm run build`, `node tests/model-xr-logic.mjs`, `node tests/model-xr-button.mjs`, `node tests/model-interior.mjs`, `node tests/end-to-end.mjs chromium 1280`.
- [ ] **Step 7:** Commit: `Quest: cihaz ayarları ve DEVAM notu`

## Open risks

- **Schedule:** Code freeze on the evening of 4 November. This work runs on a separate branch; whether it is taken into `master` is the user's decision, together with the fate of the model branch. At the end of Task 3 the model view can be shown on its own, Tasks 4-5 add the interior.
- **Performance not measured:** The method is in Tasks 0 and 6; the textures are generated in code (`uluMosqueTextures.ts`), so the opening time on the Quest may also be long.
- **Rig scale:** The 100× rig approach has not been tried on the device; the fallback is in Task 2 Step 6.
- **Motion sickness:** Walking speed was limited to 1.6 m/s and snap turning; it should be tried with real people.
