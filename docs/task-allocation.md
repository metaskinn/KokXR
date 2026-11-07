# KökXR – 24-Hour Final Task Allocation (4 people, parallel)

Hours are counted from the moment development starts: S0 = start (after the opening, estimated Saturday 10.00), S24 = end. When the presentation time is announced at the opening, the last block is shifted accordingly.

## Rules to avoid conflicts
1. Everyone works on their own branch: `veri`, `yonetim`, `arayuz`, `demo`. Merging into the main branch (the one that goes to Vercel) happens only at the shared sync points.
2. The folders each person touches are separate (see "Owns" below). If a file in someone else's area must be changed, tell them first.
3. Between S0 and S1 everyone locks the **artifact data schema** together. After that nobody changes the schema alone.
4. Shared syncs: S4, S8, S12, S16, S20. 10 minutes: what is done, what is blocked, merging.
5. Code freeze at S18: no new features, only bug fixes and rehearsal.

## Person 1 – Data and Content
Owns: artifact data files (or seed), the artifact images under `public/`, the image downscaling script.
- S0–S1: Lock the schema together (id, slug, city, district, category, period, founder (vâkıf), summary, history, sources[book, volume, page], images[file, alt text, credit], verification status).
- S1–S4: Pick 10 artifacts from the Drive (1–2 from each category: mosque, complex (külliye), tomb, water structure, inn/commercial, madrasa). For each artifact download 3–6 photos and downscale them to 1600px and 400px WebP.
- S4–S12: For each artifact write a short, book-sourced history (80–150 words) and a source line. Write the alt texts. Leave a field you do not know empty; do not make it up.
- S12–S16: Prepare the data of 1 artifact from the Konya or Hatay book (to be added live from Person 2's management screen).
- S16–S18: Compare all texts with the book one last time, do a spelling check.
- S18–S24: The data slide in the presentation (how many artifacts, sources, data pipeline) and the answer to the jury question "where did the data come from".

## Person 2 – Management Screen and Approval Flow
Owns: the management screen, the API/data persistence layer, login (auth), and their tests.
- S0–S1: Schema lock. Check whether the existing management screen actually saves.
- S1–S8: Add / edit / upload image / publish artifacts, working with persistent storage. Input validation (required fields, file type and size limit, text sanitising).
- S8–S12: Approval flow: user contributions or new content are "pending", the curator "approves/rejects", only approved content is published. The mock-up is removed.
- S12–S16: Login protection for the management screen; automated tests for add, edit and approval.
- S16–S18: Rehearse adding the Konya/Hatay artifact prepared by Person 1 through the panel.
- S18–S24: Present the "live artifact adding" and "approval" steps in the demo; explain the backend part on the architecture slide.

## Person 3 – Discovery UI, Accessibility and Packaging
Owns: home page, artifact list and detail page components, PWA files, desktop package.
- S0–S1: Schema lock.
- S1–S6: The artifact detail page should also show artifacts that have no 3D (gallery, history, sources, verification badge). City/district/category filter on the home page.
- S6–S10: Map (Leaflet + OpenStreetMap) and artifact markers; Person 1 provides the coordinates.
- S10–S14: PWA (manifest, icon, service worker, offline cache). Try opening it with "install" on desktop and Android. If time remains, a Tauri/Electron desktop package.
- S14–S18: Accessibility: alt texts, keyboard navigation, font size and contrast button, narration. Run Lighthouse/axe and save the result.
- S18–S24: Bug fixing; present the discovery and accessibility steps in the demo.

## Person 4 – VR, Demo and Presentation
Owns: VR scenes and workshops (existing), the presentation file, README, demo scenario.
- S0–S1: Schema lock. Verify that the Quest works, is charged, and that the site opens in the Quest browser.
- S1–S6: Try the existing VR flows on a real Quest (Ulu Camii, Muradiye board, model, vase). Fix what is broken; do not add new VR features.
- S6–S10: Write the demo scenario (minute by minute): discover → artifact detail → listen to narration → hold it in VR → task and badge → add an artifact from management → approve → new city appeared.
- S10–S16: Update the presentation: problem, target user, solution, architecture and data model diagram, data usage, innovation, scale (Bursa → Konya → Hatay), roadmap. Remove the Şanlıurfa narrative. Position the sword as an additional experience.
- S16–S18: README: setup, running, architecture, adding a new city/artifact, libraries used and licences.
- S18–S24: 3 full rehearsals with the team (timed), a backup demo video, a local version that works if there is no wifi, the final build ready on two computers.

## Shared moments
- S8: First merge. At least 5 of the new artifacts should be visible on the site.
- S12: The artifact added from the management screen should be visible on the site.
- S16: All P0s are on the main branch and live on Vercel. If not, P1 work stops and everyone returns to P0.
- S18: Code freeze.
- S20–S24: Rehearse, rehearse, rehearse. Everyone should be able to explain their part and the architecture in 1 minute (specification 5.2.3).

## Unknowns
- The presentation duration and submission format will be announced at the opening; once announced, the time after S18 is adjusted accordingly.
- The exact start and end time of development will be clarified at the opening.
