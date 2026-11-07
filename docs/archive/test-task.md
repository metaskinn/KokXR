# Test Task 2 — Final end-to-end test (Antigravity)

**Assigned to:** Antigravity (`agy`)
**Read first:** `AGENTS.md`, `docs/plan.md`, `docs/durum.md`, the previous report `docs/test-raporu.md`

The application is running at http://localhost:4173 (production build). Do not start/stop the server.

## Rules

- **Do not change code files.** Write only `docs/test-raporu-2.md`; screenshots under `docs/test-ekranlari/son-test/`.
- Do not install packages, do not run git commands.
- Test in a real browser; do not write a check that was not done in the browser as "passed".
- The 3D/WebGL sections can be slow with a software GPU; wait for them to load.

## Scenario (1280 px desktop and 360 px phone)

1. **Previous bugs:** Have the 4 bugs in `docs/test-raporu.md` been fixed? (test with keyboard, discovery card visibility, focus, favicon)
2. **Pick up the artifact (Ulu Camii):** "maketini eline al" → the model loads; rotating by dragging, zooming with the wheel;
   "Parçala" removes the roof and the piers inside become visible, "Birleştir" lowers it back; "Kendi kendine dönsün",
   "Görünümü sıfırla"; focusing on the model area, the arrow keys and +/− work; the "temsili maket" label and the sourced information list are visible.
3. **360° tour (Ulu Camii):** "360° turu başlat" → the 360TR player opens, one can look around by dragging, the scene changes;
   below it there is a source link and an "açılmıyorsa yeni sekmede aç" link.
4. **Virtual walkthrough (two artifacts):** start → visit at least 4 stops via the stop links; depth/parallax movement; stop list;
   the "temsilidir, 360° değildir" label is visible.
5. **Restoration task (Muradiye):** "Panoyu parçala ve onar" → select a piece, put it in the slot, rotate; hint on/off;
   complete the panel → "Pano onarıldı" and sourced information; "Baştan başla". Also place and rotate at least one piece with the keyboard (R).
6. **Management:** from the top bar "Yönetim" → change the Ulu Camii summary → it appears on the home page → return to default;
   add a new test artifact (representative) → it appears on the home page and on its own page → delete. "Kaynaklı bilgi" cannot be selected without a source.
7. **General:** gallery, test, badges (test badge + restoration badge), page not found, no horizontal overflow, no errors belonging to the
   application in the console (except the 360TR iframe's own errors; note these separately), no breakage when moving between pages.
8. **Demo flow:** Imagine a 3-minute presentation will be given to the jury: home page → Ulu Camii (model take-apart, 360° tour) →
   Muradiye (walkthrough, restoration) → management. Write down the places in the flow that stall, stay slow or are confusing.

## Report format (`docs/test-raporu-2.md`)

```markdown
# Test Report 2 — <date time>
Browser: … (version, GPU/WebGL status)

| # | Step | Desktop | Phone | Note |
|---|------|----------|---------|-----|

## Bugs (in order of severity)
1. **[Critical/Medium/Low]** What happened — how to reproduce — expected — related file (if you know)

## Demo flow notes
## Design suggestions (at most 5)
```
