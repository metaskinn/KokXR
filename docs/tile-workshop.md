# Tile workshop (Çini atölyesi)

`/workshops/tile`: a game of making a tile plate (çini), from shaping on the wheel to the kiln. Desktop (mouse/touch) and WebXR use the same game logic.

## Files
- `src/features/workshops/tile/engine/state.ts`: game rules, not tied to Three.js (`tests/tile-logic.mjs`).
- `src/features/workshops/tile/engine/pattern.ts`: original pattern, regions and tahrir marks.
- `src/features/workshops/tile/engine/texture.ts`: the surface canvas of the plate.
- `src/features/workshops/tile/engine/scene.ts`: workshop scene and mouse input. `src/features/workshops/tile/engine/xr.ts`: VR session, panel and controller.
- `tests/tile.mjs`: plays through from start to finish with real mouse events.

## Sources and limits
- T.C. Kültür ve Turizm Bakanlığı, "Geleneksel Çini Ustalığı": underglaze process, biscuit, tahrir, second firing 900-940°C, colours, master names, UNESCO listing. https://yakegm.ktb.gov.tr/TR-345131/geleneksel-cini-ustaligi.html
- İstanbulumSanat, "Çini Nasıl Yapılır": description of pricking (iğneleme) and charcoaling (kömürleme). https://www.istanbulumsanat.com/cini-nasil-yapilir-cini-yapim-asamalari-nelerdir/

Game scale (not from a source): the biscuit range 850-900°, durations, score, the matte look of the paints.

Not included in the game because it could not be verified with a source: the material names and proportions in the clay recipe, which colour comes from which oxide. If verified, it can be added to the notes in `src/content/tile.ts`.

The pattern was drawn for the application; it is not a copy of a specific historical artifact.
