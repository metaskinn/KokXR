# KökXR — Meta Quest work handoff note

> **Old note.** The current status and next tasks are in `PLAN.md`; use this only for VR technical details and load measurements. The "Next tasks" and test status sections are no longer valid.

> Written: evening of 4 November 2026. The work was stopped here because the user changed computers.
> **To the AI agent in the new session:** First read this file, then `AGENTS.md`, `HANDOFF.md` and
> `docs/archive/2026-11-04-ulu-mosque-quest.md`. Then continue from the "Next tasks" section.
> Speak Turkish with the user.

## Starting on the new computer

Required: Git, Node.js, npm, Google Chrome. `HANDOFF.md` asks for Node 24+; the results below were obtained with v22.23.3.

```bash
git clone https://github.com/selamisimsek/kokxr.git   # the repo is private; access is needed
cd kokxr
git switch ulu-camii-quest
npm install
git restore package-lock.json   # if the npm version changes the lock file; there is no dependency change
claude "Read QUEST-HANDOFF.md and continue from the Next tasks section"
```

To open the app:

```bash
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
# http://127.0.0.1:5173/artifact/ulu-mosque
```

The **Immersive Web Emulator** extension must be reinstalled in Chrome (it was installed on the old computer).

## What is being done

The user wanted to adapt Ulu Camii to Meta Quest and asked for a new branch to be opened. Previously there was no VR task in the project; VR was recorded as "will not be done / vision" (`docs/archive/2026-11-02-web-mvp-plan.md:44`). This work deliberately changes that decision on this branch.

Experience: In Quest Browser `VR'da aç` → scale model on the table (rotate, enlarge, split) → `İçeri gir` → walk at real scale → source-backed information card when approaching a structure → exit.

Method: WebXR on the existing Three.js scene. No Unity, no new dependency. The user said "if you find something more feasible, do that too"; so far nothing more feasible than WebXR has been found.

## User decisions and open questions

What the user said:
- Ulu Camii should be adapted, and a new branch should be opened.
- First a plan should be made, then small role-assigned agents should do the work at the same time; the AI will do the work entirely.
- Commit and push are allowed.

**Not yet answered** by the user:
- Is there a Quest at hand, which model? (The plan assumes Quest 2 or higher.)
- The "Assumptions" section of the plan was not explicitly approved; the user continued by saying "let them do it".
- The result of the emulator trial. They installed the extension, the address was given, they changed computers without writing the result.
- Is a VR presentation required in the specification or in the jury's expectations? The specification (`proje bilgileri/`) was not on this computer, so it could not be checked.
- Will this branch and `ulu-camii-maket` be taken into `master`? `master` was not touched. According to `HANDOFF.md`, the code freeze is the evening of 4 November, the final is 7–8 November.
- What to do with the shared links. They were not opened; this plan needs no new content:
  - Inventory publications: https://www.vakifkatilim.com.tr/tr/hakkimizda/medya-merkezi/yayinlarimiz
  - Photo archive: https://drive.google.com/drive/folders/1U-C6TeECHhlx5C15G_rhgx5f_-iJbXlM

## Git status

- Branch: `ulu-camii-quest`, on top of `origin/ulu-camii-maket` (`57722ed`). That commit contains the new scale model (interior, walking) that is not in `master`.
- `9f70588` plan, `90fbd33` pure modules. The next commit is this note and the unfinished binding code (**WIP**).
- The locally remaining `calisma` branch is empty, same as `master`, and was not pushed. It does not matter.

## Files and their status

| File | Content | Status |
|---|---|---|
| `src/features/scale-models/walkingCollision.ts` | Pure collision | Done, tested |
| `src/shared/xr/xrMotion.ts` | Dead zone, walking, turning, rig, controller input | Done, tested |
| `src/shared/xr/xrText.ts` | Menu items, line breaking, hit | Done, tested |
| `src/shared/xr/xrPanel.ts` | Menu and information card (`CanvasTexture`) | Done; looked at with a screenshot |
| `src/features/scale-models/xrSession.ts` | Session, rig, controller, ray, view switch | Written; tried only with a fake `renderer.xr`, that script is not in the repo |
| `src/features/scale-models/modelScene.ts` | XR binding, `icDurumu`, `bakisKonumu` | **Not verified**, the agent was stopped before it could report |
| `src/features/heritage/components/ArtifactExplorer.tsx` | `VR'da aç`, support check, error message | **Not verified** |
| `src/features/scale-models/uluMosqueInterior.ts` | `ZEMIN_Y` added | Passed the type check |
| `tests/model-xr-button.mjs` | Button test with a fake `navigator.xr` | **Result unknown** |

## Test status (actual results at hand)

Those that were run on the final state and passed:
- `npx tsc --noEmit -p tsconfig.app.json`: no errors
- `npx vite build`: successful (to a temporary folder)
- `node tests/model-xr-logic.mjs`: passed
- `node tests/model-xr-text.mjs`: passed, the longest card is 10 lines (limit 13)

**Those with unknown results:**
- `tests/model-xr-button.mjs` and `tests/model-interior.mjs` after the change. The agent was running them, was stopped and no report came. They must be run again.
- VR itself: nobody has yet verified that it works in the emulator or on Quest.

On the code **before** the VR changes (`57722ed`) `tests/model-interior.mjs` passed (takes about 7 minutes). So if that test newly goes red, the cause is most likely a change on this branch.

## Load measurement (`57722ed`, software rendering)

| Measure | Exterior | Interior |
|---|---|---|
| Single-eye draw calls | 63 | 48–57 |
| Single-eye triangles | ~401 thousand | ~394–399 thousand |
| Stereo estimate calls / triangles | ~126 / ~802 thousand | ~114 / ~798 thousand |

- 61 meshes, 50 materials, no instancing, the largest single geometry is 135,360 triangles.
- In a frame with shadows, calls and triangles are about double (122 / 802 thousand), but the shadow map is static and not drawn every frame.
- 41 textures, the largest 2048×1024, about 103 MB (including mips). 29 are generated by code.
- Desktop shadow map 4096, on Quest with `hover: none` it should be 2048; not verified on device.
- Scene creation takes 4–8 s in software rendering; this is not the Quest time.

Comment: Within the rough budget in the plan (stereo ~1 million triangles, ~200 calls) but close to the limit in triangles. The real risks are four interior lights, the number of materials, texture memory and opening time. Frame rate was not measured on a device.

## What to know when reading the code

- `yurumeAdimi` applies the dead zone itself; do not apply `oluBolge` before calling it.
- `anlikDonus` returns `yon: 1` on a push to the right, positive `rotY` turns left. That is why `aci = -yon * XR_DONUS`; the same `aci` goes to both `basCevresindeDon` and `rotY`.
- `camera.position` is rig-local in XR; use `getWorldPosition` for the world position. The head pose is not current until the first render; it is read via `xr.getCamera()`.
- With the rig scaled 100×, a near of 0.05 m corresponds to about 5 scene units. When the session closes Three.js does not restore near/far; `oturumBitti` does.
- A ray hit on the card only calls `bilgiKapat()`; the card is hidden by the chain `bilgiDegisti(null)` → `xr.bilgiGoster(null)`.
- `xr.kare(dt)` must be called before render. `temizle` does not call `oturumBitti` in an open session.
- Panels are `depthTest=false`, the menu is 1.34 m away, the card 1.30 m; the ray hits the card first.
- `ciz` and `goster` reload the texture; do not call them in the frame loop.
- For panel items, `bilgiPaneli()` starts hidden, `xrPaneli()` starts visible.
- Unlike the plan, the tests are in two files: `maket-xr-mantik.mjs`, `maket-xr-metin.mjs`.

## Known problems

1. **Single controller:** In the interior the same stick both strafes sideways and turns (`kumandaGirdisi` + `xrOturum`). Not fixed. Suggestion: with a single controller, a right/left push should only turn.
2. **Task 3 part:** Rotating and enlarging the scale model was written, not seen in the emulator.
3. **Cannot be verified (device needed):** visual correctness of the rig scale, the `axes[2/3]` and `buttons[5]` mapping, `local-floor` compatibility with `ZEMIN_Y`, panel legibility, stereo comfort, 72 FPS.

## Next tasks

1. **Verify:** `npm run build`, `npm run preview -- --port 4173 --strictPort`, then `node tests/model-xr-button.mjs` and `node tests/model-interior.mjs`. Fix any errors.
2. **Ask the user:** Is there a Quest model, and what did they see in the emulator?
3. **Try it in the emulator with the user:** entering VR, right stick, menu, `İçeri gir`, left stick, information card, exit. Order: plan Task 2 Step 6, Task 3 Step 4, Task 4 Step 4, Task 5 Step 5.
4. **Fix the single-controller problem.**
5. **Real device (plan Task 6):** Developer mode on Quest, USB, `adb`. `adb reverse tcp:4173 tcp:4173`, then in Quest Browser `http://localhost:4173/artifact/ulu-mosque`. Measure FPS; if below 72, the reduction order in the plan.
6. **Low-cost fallback:** Try the existing 360TR tour in Quest Browser (no code needed, needs internet, not yet tried). If performance is not enough, turn off free walking and continue with the table-top scale model + stop transitions.
7. **When finishing:** Add a short paragraph to `HANDOFF.md`. Do not merge into `master` without asking the user.

The time estimate given to the user: remaining code and merging 20–40 min, device trial and FPS tuning 1–2 hours. It is an estimate, not a measurement.

## Rules

- `AGENTS.md`: The interface is Turkish. Do not invent historical information. Do not show 3D/VR without data as if it existed. Do not go outside the task scope, test at every stage.
- The label `Temsilî maket · Gerçek bir 3B tarama değildir` must stay visible in VR.
- The repo must stay private; permission for the archive photos is not settled, no public release.
- Do not add new dependencies. Commit or push only with the user's permission; permission was given for this work.

## What remains on the old computer

Did not enter git, not needed:
- `.claude/worktrees/agent-a7b935c7767014bf5`: the measurement agent's temporary copy and raw records (`test-sonuclari/g0-*`, `maket-ic-*.png`). The results were put into this file. To delete it, at the repo root: `git worktree remove --force .claude/worktrees/agent-a7b935c7767014bf5 && git branch -D worktree-agent-a7b935c7767014bf5`
- The agents' temporary trial scripts and panel screenshots were in the session's temporary folder.
