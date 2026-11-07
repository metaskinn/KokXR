# KökXR plan and status

A single plan file. Start work here, tick items when done. For details: `QUEST-HANDOFF.md` (VR), `docs/presentation-promises.md`, `docs/specification.md`.

## Current status (7 November 2026)

Working branch `ulucami-gercekci`; the previous status is in `HANDOFF.md` section 0. The "Start on a new computer" section below in this file is dated 4 November.

- [x] Places tab: map, city, building selection (`/places`)
- [x] Web scale model and VR entry for 10 buildings in Bursa (desktop test passed)
- [x] Ulu Camii: realistic carpet and marble, light, climbing onto the minbar, lectern and mahfil
- [x] Walking stick on touch screens
- [x] Ulu Camii: photo-referenced pavilion, chandeliers, carpet/light and non-overlapping wall plaques (absolute positions and sizes are representative)
- [x] Walking to a safe target when a stop transition is cut, circular pedestal limits, eyvan views and cleanup of scene resources
- [x] Sword VR: requirement to aim at the water trough and a timed strike target per hand; pure calculation and session tests passed
- [x] The mahfil/lectern source pages and the library event of Ulu Camii were compared with the book; the contradictory direction statement in the Kaaba card was removed
- [ ] Real Quest trial: the new 9 buildings, card legibility, frame rate
- [ ] Decision to merge the `ulucami-gercekci` branch into `master`
- [ ] `kokxr.vercel.app` update (account access needed)
- [ ] Written confirmation of sponsor photo permission
- [ ] Comparing the historical texts with the book

## Start on a new computer

> Written: 4 November 2026, work was stopped because the user changed computers. There is no running agent or server.
> **To the agent in the new session:** Continue from this file on the `vaat-mokap` branch, speak Turkish. The first job is "Where it was left" below.

Required: Git, Node 24+ (`.nvmrc`), Google Chrome. On the old computer Node and `adb` were installed into the user folder, and were not carried to the new computer. `adb` is needed only for the Quest trial.

```bash
git clone git@github.com:selamisimsek/kokxr.git   # if already present: git fetch
cd kokxr
git switch vaat-mokap
npm ci
npm run test:hizli
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort   # http://127.0.0.1:5173/
```

### Where it was left

| Branch | Content | Status |
|---|---|---|
| `vaat-mokap` | Journey, time layer, presentation screens, simulation script | Clean, main working branch |
| `wip/vr-tutma` | `vaat-mokap` + menu-card fix + stop head-direction fix | Neither merged. Only `test:hizli` passed; the simulation result of the menu-card fix was not verified in this session |
| `wip/vr-vazo` | `vaat-mokap` + `vazoXr.ts` (536 lines), `VR'da onar` button, start of the caption | Unfinished. The agent stopped before it could report; it is unknown which flow was finished. Not tried in simulation or with `tests/vase.mjs` |

Order:

1. Verify `wip/vr-tutma` with `tests/xr-sim`, and when `npm run test:tarayici` passes, merge it into `vaat-mokap`.
2. Do the rest of the same work: 10× enlargement, holding the scale model in VR, time layer in the VR menu.
3. Read `wip/vr-vazo`; first determine what is finished, then complete it in the simulation and merge.
4. The "Verification and delivery" below, then the Friday device trial.

### Simulated Quest (`tests/xr-sim/`)

Drives the real three.js WebXRManager with Meta's `iwer` package. `iwer` is installed into a temporary folder, does not go into `package.json`.

```bash
export XR_SIM=/some/temp/folder
bash tests/xr-sim/setup.sh
node_modules/.bin/vite preview --outDir "$XR_SIM/dist" --host 127.0.0.1 --port 4174 --strictPort   # in a separate terminal
node tests/xr-sim/sim.mjs ana
```

- Last result, on the code before the fixes: 76 of 78 checks passed (`tests/xr-sim/last-result.json`). The remaining 2: the menu cannot be reached while a card is open, stop direction when the head is turned. The fixes are in `wip/vr-tutma`.
- The script was moved into the repo; `kur.sh` was run, but after the move `sim.mjs` was not run from start to finish.
- It does not prove FPS, comfort or the real controller mapping. In software rendering one round takes a long time.
- The simulation agent was stopped before it could give its final report; the results were read from the `son-sonuc.json` file.

## Goal

**Goal:** A live demo in a single flow at the 7–8 November final. First the mockup to be shown in the presentation; backend later.

**Standout feature:** VR. Main scene: on Quest 3, hold the scale model, examine it, go inside, repair the vase.

**Branch:** `vaat-mokap`. Ask the user before merging into `master`.

## Fixed rules

- Visible label on the mockup screen: `Demo · örnek veri` (`src/components/DemoEtiketi.tsx`). The `Temsilî maket` label stays on the scale models.
- No dates, sources, people, institutions or approvals are invented. Source-backed information is shown with the existing `kaynakId`.
- No new dependencies. Existing tests are not broken.
- Parallel agents work in their own working copy and on their own files. The main session does the routes and merging.

## Product structure

Top menu: **Eserler (`/artifacts`, `/` redirects here), Mekanlar (`/places`), Atölyeler (`/workshops`: vase, sword, tile).** The Admin link was removed from the top menu on 2026-11-07; `/admin` opens by address. The Keşfet home page was removed on 2026-11-07; the Bilgini sına, Zaman katmanı, Sanal gezinti and 360° tur sections were also removed from artifact pages (the data stays in JSON). The journey, teacher panel, vision and approval flow pages were removed on 2026-11-07 at the user's request.

| User | Where they enter |
|---|---|
| Student, jury | Eserler, Mekanlar, Atölyeler |
| Admin | Directly at the `/admin` address |

Accessibility criteria: steps are unlocked, the back button works, focus moves to the heading when the step changes, status is not conveyed by color alone, targets are at least 44 px, no horizontal overflow at 320 px.

## To do

### 1. Foundation

- [x] Quest code review and fixing the 4 findings
- [x] Single controller fix
- [x] Document layout, `CLAUDE.md`, quick test commands, Node 24
- [x] ~~`/yolculuk` skeleton~~ (removed on 2026-11-07)
- [x] `maket-ic` and `maket-xr-dugme` passed with the VR fixes
- [x] Simulated VR trial: 76 of 78 checks passed

### 2. VR (priority)

Verification: simulated Quest script, then a real device.

- [ ] Reaching the menu while a card is open, and stop direction when the head is turned (`wip/vr-tutma`, to be verified and merged)
- [ ] 10× enlargement on desktop and in VR
- [ ] Holding the scale model with the controller in VR
- [ ] Vase repair in VR: hold the piece, seat it in place (unfinished: `wip/vr-vazo`)
- [ ] Sample text under the vase (unfinished: `wip/vr-vazo`)
- [ ] Time layer in the VR menu
- [ ] Entering VR from Mekanlar should not take more than two clicks

### 3. Presentation screens

- [x] ~~Time layer~~ (removed from the interface on 2026-11-07), with source-backed period data. It does not animate the structure's old appearance, and is explained this way in the presentation too. The sources were not compared with the inventory PDF.
- [x] Teacher panel, vision, approval flow and library screens were removed on 2026-11-07.
- [ ] AR: only after the rest of this list is finished

### 4. Verification and delivery

- [ ] All tests: `npm run test:hizli`, `npm run test:tarayici`, `npm run test:e2e`
- [ ] The `tests/ui.mjs` focus check failed once, passed when re-run; watch whether it is an intermittent problem
- [ ] Independent review: missing labels, invented content, broken flow, accessibility
- [ ] Final look with 1280 and 360 px screenshots
- [ ] Backup demo video (desktop), `dist/` copies, `HANDOFF.md` update

### 5. Friday 6 November: real device (with the user)

Preparation: Quest 3, data cable, developer mode already on, `adb` on the computer where the trial will be done.

If `no permissions` appears in the `adb devices` output, USB permission is needed (asks for `sudo`, the user runs it):

```bash
echo 'SUBSYSTEM=="usb", ATTR{idVendor}=="2833", MODE="0666"' | sudo tee /etc/udev/rules.d/51-quest.rules
sudo udevadm control --reload-rules && sudo udevadm trigger
```

- [ ] `adb reverse tcp:4173 tcp:4173`, in Quest Browser `http://localhost:4173/places`
- [ ] Entering VR, FPS measurement (target 72); if below, the reduction order in `QUEST-HANDOFF.md`
- [ ] `docs/superpowers/plans/2026-11-04-ulu-mosque-quest.md` Task 6 checklist
- [ ] Holding, vase repair, label legibility, single controller, comfort
- [ ] VR backup video on a real device
- [ ] Remove the non-working feature from the demo, present it as vision

### 6. Final 7–8 November

- [ ] The final day checklist in `HANDOFF.md`
- [ ] Separation of working features and vision in the presentation
- [ ] What problem VR solves is explained clearly (specification 5.2.2)

## Cut list

If time is not enough, cut in this order: AR → time layer in the VR menu. Holding and vase repair in VR are cut last.

## Promise status

| Promise | At the final | Type |
|---|---|---|
| Rotate, split | Existing scale model | Real |
| 10× enlarge | Limits go up to 10× | Real |
| Hold | Vase; scale model and vase in VR | Real, to be verified on device |
| Text on the underside | Sample text on the representative vase | Mockup |
| Time layer | Removed from the interface (2026-11-07); data stays | None |
| Restoration task | Tile puzzle, vase workshop | Real |
| Verified information | Source-backed cards | Real |
| Teacher panel | Screen removed (2026-11-07) | None, vision only in the presentation |
| KökMobil, Dokunulabilir Müze | Screen removed (2026-11-07) | None, vision only in the presentation |
| Digital Heritage Library | Screen removed (2026-11-07); artifact list `/artifacts` | Partial |
| Scanning, 1:1 digital twin | Screen removed (2026-11-07); `Tarama verisi yok` | None, vision only in the presentation |
| VR | WebXR | Real, to be tried on Friday |
| AR | `immersive-ar`, if time remains | To be verified on device |
| Single-scenario demo | Page removed (2026-11-07); `/places` and `/workshops` | Real |

## Time estimate

Remaining code work 5–9 hours with parallel agents, device trial 1–2 hours. It is an estimate, not a measurement.

## Open decisions

- If there is scanning data or a real curator approval, it is added to the product; otherwise it stays as vision.
- Later pushes: with the user's permission.
- No public release; photo permission is not settled. If the team will view it from another device, a password-protected release is asked of the user.
- The time layer dates (Ulu Camii 4, Muradiye 6) must be compared with the inventory PDF.
