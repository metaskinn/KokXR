# Sword workshop — design and sources

**Request:** A realistic experience similar to the vase workshop. Starting from raw steel, make the sword of Fatih Sultan Mehmed,
then try it in a test area. Route: `/workshops/sword`.

## Sources and verified information

| # | Source | Information |
|---|---|---|
| K1 | Ünsal Yücel, *Islamic Swords and Swordsmiths*, Plate 87, p. 128 (catalogue page seen via [myArmoury](http://myarmoury.com/talk/viewtopic.34526.html)) | Topkapı 1/90, a curved sword attributed to Mehmed II. Total 126.5 cm, blade 106 cm. Single-edged, slightly curved, broad-backed. One wide fuller from hilt to tip, a second fuller on the back edge as far as the "step". Cross-shaped, thick-armed, gold-inlaid guard (balçak). Longer than usual grip: two walrus-ivory plates fixed with four rivets; no separate metal pommel, shaped in the form of an ivory pommel. Ceremonial sword. Gold-inlaid thuluth inscription on both faces. |
| K2 | Hasan Korkmaz, İlhan Özkeçeci, "Osmanlı kesici silahlarından bir form: Türk eğri kılıcı", *YJAD*, 2025 ([PDF](https://yjad.yildiz.edu.tr/storage/upload/pdfs/1766990843-tr.pdf)) | Approx. 1/90 is the oldest known sword from the Ottoman period; the blade has not yet gained its full curvature, the grip has a slope. Straight-armed guard 15th c. Part names: blade (namlu), guard (balçak), grip (kabza), pommel (kabza başı), yalman, spur (mahmuz), fuller (kan oluğu). The steel ingot called the sword egg (kılıç yumurtası) is forged; quenching is called water-giving (su verme). Production is collective: swordsmiths (Seyfiye ocağı), calligrapher, mother-of-pearl worker, jeweller, painter (nakkaş). |
| K3 | Milli Saraylar post ([X](https://x.com/millisaraylar/status/1265951735228575744), from the search summary) | Second half of the 15th c.; steel, iron and gold; length 125 cm. **Note:** The length differs from K1 (126.5 cm); the interface shows both with their sources. |

The inscription translation is given in K1 ("...Sultan Muhammad Khan, the son of Sultan Murad Khan..."). **The translation is shown only with attribution to K1.**

## Everything that is representative (stated explicitly in the interface)

- The model is not an exact copy or a 3D scan; dimensions are from K1, while width, thickness, amount of curvature and guard dimensions are estimates from photographs.
- **The gold band is vegetal decoration; it is not the real inscription.** No fake Arabic letters are used: the real text has religious content.
- Temperature, timing and scores are simplified for the game; it does not describe how sword 1/90 was actually made.
- The type of steel used is unknown; it is not said "it was made of this steel". The test area is fiction: there is no claim that the ceremonial sword (K1) was tested like this in battle.

## Flow

| Stage | What the user does | Quality effect |
|---|---|---|
| 1. Ingot | Takes the sword egg with tongs and puts it in the furnace | — |
| 2. Heating | Holds the bellows pressed; the steel turns from dark red to yellow | Temperature |
| 3. Forging | Strikes region by region with the hammer on the anvil; the ingot really lengthens and becomes a blade, reheats when it cools | Shape, crack risk |
| 4. Quenching | Reheats, dips into water at the right moment; steam | Hardness or crack |
| 5. Sharpening | Drags along the whole length on the stone; edge and shine increase | Sharpness, shine |
| 6. Mounting | Guard, two walrus-ivory plates, four rivets; gold band appears, collective-production note | — |
| 7. Inspection | Rotates in hand, zooms; part names and sources | — |
| 8. Test area | Draws cuts with the mouse: straw mat roll, log, hanging cloth; the result depends on skill | Score card |

## Visual goal

Dark workshop, furnace light. Physically based materials, ACES tone mapping, bloom, shadows, spark and steam particles,
glow according to temperature colour, sounds generated with WebAudio (can be turned off). Reduced motion, keyboard and touch support.

## Files

- `scripts/sword_texture.py` — generates the textures (`assets/kilic/doku/`)
- `scripts/sword_generate.py` — Blender script: `assets/kilic/kilic.blend`, `public/models/sword.glb`, `public/models/sword-workshop.glb`
