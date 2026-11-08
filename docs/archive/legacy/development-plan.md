# KökXR — Phase-by-Phase Development Plan

> Today: **Friday, 23 October 2026** · Final: **7–8 November 2026 (Saturday–Sunday)** · Remaining: 15 days
> For rules and technical details: `developer.md`

---

## MVP: three things, nothing more

| # | MVP | Visible in the demo |
|---|---|---|
| 1 | **A walkable space** | The user walks inside a historic room and cannot pass through walls |
| 2 | **Interaction with the objects in the space** | 3–5 objects in the room are picked up, turned and put down |
| 3 | **Information about a single artifact** | When approaching or holding the main artifact, an info panel opens: name, period, history, info points, source |

Everything outside these (gallery, mini quiz, time layer, teacher panel…) **is not built**; it is described in the presentation as "vision".

**Two platforms, same scene:**
- **Desktop** (WASD + mouse): The product that is ready in every case. Meets the specification's "desktop application" requirement.
- **VR** (Quest): Added if the device is verified in Phase 0.

---

## Phases

Each phase has an **exit criterion**. We do not move to the next phase until the criterion is met. If the criterion cannot be met by the date, the decision in the "If delayed" line is applied.

### Phase 0 · Setup and verification
**23–24 Oct (Fri–Sat)** · Week 1

| Who | Work |
|---|---|
| Unity | Quest developer mode, Quest Link, Unity 6.3 LTS, `KokXR` project with the VR template, Git + GitHub Desktop |
| 3D | 3 candidate environment models for choosing the space (room, madrasa cell, library…) + 3 candidate artifact models. License table |
| Content | 3 candidates for the main artifact. A short history and at least 2 sources for each |
| Product | Draft of the 2-minute demo scenario. Updating the scope statements in the presentation |

**Exit criterion:** On pressing Play, the template scene appears on the Quest and the cube can be grabbed. The project is on GitHub.
**Decision (evening of 24 Oct):** The space and the main artifact are chosen. This decision is never changed again.
**If delayed:** If VR does not work by 25 Oct, **VR is dropped entirely** and we switch to the desktop path. The loss is 0 days, since the later phases can proceed with desktop too.

---

### Phase 1 · Walkable space
**25–27 Oct (Sun–Tue)** · Week 1

| Who | Work |
|---|---|
| Unity | The `Mekan.unity` scene. Placing the environment model (or a simple room with ProBuilder). Adding colliders to floor and walls. A WASD + mouse controller for desktop. The template's locomotion system for VR: teleport + walking. Basic lighting |
| 3D | Cleaning the chosen environment model in Blender: scale (1 unit = 1 m), deleting unnecessary details, polygon reduction |
| Content | The full text of the main artifact: name, period, place, foundation, 100–150 word history, 3 info points, sources |
| Product | Drawing the path the user will follow in the space: entrance → where they look → how they head to the artifact |

**Exit criterion:** On both desktop and (if available) VR, one can walk around inside the room for 1 minute. One does not fall through walls or floor. It also works as a built version.
**If delayed:** If the ready environment model causes problems, 4 walls, a floor and a door are made with ProBuilder. Visuals are improved later.

---

### Phase 2 · Interaction with objects
**28–30 Oct (Wed–Fri)** · Week 1 → Week 2

| Who | Work |
|---|---|
| Unity | Making 3–5 objects grabbable. VR: `XR Grab Interactable` + `Rigidbody`. Desktop: on clicking the object being looked at it comes in front of the camera, is turned with the mouse, and returns to its place when clicked again. Highlight when hovering over an object |
| 3D | Preparing the object models (book, candlestick, rahle, lamp…) and the final state of the main artifact. Pivot in the center, correct scale |
| Content | A one-sentence label text for each of the other objects ("19. yy pirinç şamdan, temsili") |
| Product | Having 2 people from outside the team test the Phase 1 build, noting where they get stuck |

**Exit criterion:** The user can pick up, turn and put down every object in the room. Objects do not fall into the wall or disappear (a fallen object returns to its place).
**If delayed:** The number of objects is reduced to 1 (only the main artifact). If physics causes problems, the objects are kept physics-free and return to their place when released.

---

### Phase 3 · The artifact's information
**31 Oct–2 Nov (Sat–Mon)** · Week 2

| Who | Work |
|---|---|
| Unity | An **info panel** that opens when the main artifact is held or approached (a panel floating in the air in VR, fixed on screen on desktop). 3 **info points** (hotspots) on the artifact: clicking shows that point's explanation. A source line and a "doğrulanmış / temsili" label under the panel. Texts are read from a JSON file |
| 3D | Determining the positions of the info points on the model |
| Content | Entering the texts into the JSON, final check of the sources. Optional: an audio recording (.mp3) of the history read aloud |
| Product | Accessibility check: font size, contrast, subtitles. Presentation draft v1 |

**Exit criterion:** The demo scenario works from start to finish: enter → walk around → touch an object → take the main artifact → info panel and info points → source visible.
**If delayed:** The info points are cut, only a single info panel remains. The audio recording is cut.

---

### Phase 4 · Polish and freeze
**3–4 Nov (Tue–Wed)** · Week 2

| Who | Work |
|---|---|
| Unity | Welcome screen ("KökXR — başlamak için tıkla" + controls). Ambient sound. Building the APK for Quest and checking performance (there must be no stutter). Bug fixing |
| 3D | Lighting and texture improvements, only those that do not hurt performance |
| Content | Checking the historical information and sources in the presentation. License slide |
| Product | README: setup and running. Running the test scenario fully on the build |

**Evening of Wednesday, 4 Nov: CODE FREEZE.** After this time no new features are added, only bugs that break the demo are fixed.

---

### Phase 5 · Rehearsal
**5–6 Nov (Thu–Fri)** · Week 2 → Final

| Who | Work |
|---|---|
| Everyone | 3 full rehearsals: presentation + live demo, timed |
| Unity | Copying the final build to a USB drive and two laptops |
| Product | Recording the backup demo video (desktop + VR screen recording) |
| Everyone | Each member becomes able to explain the architecture and their own part in 1 minute |

### Final · 7–8 Nov (Sat–Sun)

---

## Weekly schedule

### Week 1 · 23–29 October · "Space and objects"
**Week goal:** The room can be walked around and the objects can be grabbed.

| Day | Date | Phase | Expected at end of day |
|---|---|---|---|
| Fri | 23 Oct | 0 | Unity installed, VR template opened |
| Sat | 24 Oct | 0 | Cube grabbed on Quest, space and artifact chosen |
| Sun | 25 Oct | 1 | Environment model is in the scene |
| Mon | 26 Oct | 1 | Walking with WASD on desktop |
| Tue | 27 Oct | 1 | Walking in VR too, build made ✅ |
| Wed | 28 Oct | 2 | Objects are grabbed in VR |
| **Thu** | **29 Oct** | 2 | **Week 1 review** (below) |

### Week 2 · 30 October–5 November · "Information and polish"
**Week goal:** The demo scenario works from start to finish and the code is frozen.

| Day | Date | Phase | Expected at end of day |
|---|---|---|---|
| Fri | 30 Oct | 2 | Object grabbing works on desktop ✅ |
| Sat | 31 Oct | 3 | Info panel is filled from JSON |
| Sun | 1 Nov | 3 | Info points work |
| Mon | 2 Nov | 3 | Demo scenario works end to end ✅ |
| Tue | 3 Nov | 4 | Welcome screen, Quest APK |
| **Wed** | **4 Nov** | 4 | **CODE FREEZE** |
| **Thu** | **5 Nov** | 5 | **Week 2 review**, rehearsal 1 |

### Final week · 6–8 November
| Fri | 6 Nov | Rehearsals 2 and 3, backup video, final build copies |
|---|---|---|
| Sat–Sun | 7–8 Nov | **Final** |

---

## Progress tracking rhythm

### Every day · 15-minute status meeting (noon or evening)

Everyone says 3 sentences:
1. What was finished **yesterday**?
2. What will be finished **today**?
3. Is there a **blocker**?

If there is a blocker, the two relevant people solve it after the meeting. The meeting is not extended. The results are entered into the task statuses on the board.

### Weekly review · Thursday evening, 45 minutes

1. **Demo (15 min):** The Unity lead shows the **built** version. The editor screen does not count.
2. **Exit criteria (10 min):** Did the week's phases meet the criteria? Yes / no.
3. **Cut decision (10 min):** If there is a delay, the "If delayed" decision of the relevant phase is applied **at that moment**. There is no "let's try a bit more" option.
4. **Next week (10 min):** Tasks are assigned to people on the board.

The review note is added to the `ilerleme.md` file in the following format:

```
## Week 1 — 29 October
Status: 🟢 on track / 🟡 at risk / 🔴 delayed
Working: …
Not working: …
Cut: …
Next week: …
```

### Milestone backups
On each day marked ✅, the working build is saved to a USB drive as `KokXR_<date>.zip`. If something breaks at the final, we go back to the latest ✅ version.

---

## Specification note

Specification item 5.1.1 asks for "multiple foundation artifacts" and "adding/editing content". This single-artifact scope does not fully meet the two items and carries a risk of losing points. Two things reduce the risk and are already included in the plan:
- The artifact information is **in a JSON file**, not in code (Phase 3). The jury can be shown "A new artifact = a new JSON file + model; the code does not change".
- The other objects in the room also have short labels (Phase 2).

If Phase 4 finishes on time and the team wants, adding only a JSON + model for a second artifact would be about half a day's work. This is not a decision, it is an option.
