# Vase model and direct dragging

The user's request: instead of choosing direction/slot with buttons, grab the pieces directly with the mouse and join them; design the model in Blender.

## Sources

- `assets/vazo/vazo.blend`: editable source produced with Blender 4.5.3 LTS.
- `public/models/vase.glb`: the model the browser loads with GLTFLoader.
- `scripts/vase_generate.py`: Blender Python script; regenerates the source and GLB files.

The model was created originally for the project. No third-party model, photograph or texture was used. It does not represent a specific historical artifact. The dimensions were chosen for the game scene.

There are six broken pieces in Blender: `Vazo_Parca_01`–`Vazo_Parca_06`. Each piece's `pieceId` custom property carries its 0–5 identifier and is exported to the GLB extras field. In addition, `Vazo_Saglam` (`intact`) is the unbroken body visible at the start; `Onarim_Izleri` (`repairMarks`) is visible only in a completed repair. The pieces include physical thickness, an inner ceramic surface, allowances for a closed base, and an irregular break line. The materials are green glaze, cream decoration, dark green motif, raw ceramic, and a rim/base band. The model uses material colours; no external texture is requested.

Regeneration:

```bash
blender --background --python scripts/vase_generate.py
```

This command updates the outputs `assets/vazo/vazo.blend` and `public/models/vase.glb`. Before running the script, keep any existing manual Blender edits in a separate file; the script rebuilds the scene.

## Interaction

- In inspection mode: rotate with mouse/finger and zoom with wheel/two fingers.
- On first opening the single intact body is visible; the break boundaries and repair marks are hidden.
- When repair starts, the pieces appear on both sides of the silhouette.
- Following the user's last correction, the **overall vase silhouette is preserved**. There is no ring/text showing the exact position of the selected piece, and no silhouette highlight that changes per piece. The silhouette shows the same overall form until all pieces are in place.
- A piece is dragged by holding the model's own surface or the number on it.
- OrbitControls is disabled during dragging. The piece moves on a plane facing the camera and passing through the grab depth; so it does not slip away from the cursor in perspective.
- If released when the piece's on-screen centre is within 20–34 pixels of its own target, it settles into the correct depth with an animation. The proximity threshold does not produce a visible target marker. This threshold is adjusted according to the screen width.
- When all six pieces are complete, thin bronze joint marks appear. "İncelemeye dön" keeps these marks; it does not return to the intact body. Before the repair is finished, "Onarımı iptal et" restores the initial mark-free appearance.
- A piece released in the wrong place returns to the shelf. A simple click only selects the piece; it does not count as a failed attempt.
- Pointer capture, pointercancel and lost capture are handled. Escape cancels the drag; the camera lock is lifted.
- For the selected piece there is an alternative: moving it with the arrow keys and releasing it with Enter under the same proximity rule. The piece list is in the collapsed "Klavye ile birleştir" section.
- Restarting clears the current drag/animation. When the route changes, the renderer, controls, listeners, geometry and materials are released. If the model cannot be loaded, an error is shown and repair cannot be started.
- With the reduced motion preference, the settling animation is skipped.

## VR (Meta Quest Browser, WebXR)

The `VR'da aç` button appears only in a browser that supports `immersive-vr`. The code is `src/features/workshops/vase/vaseXr.ts`; it touches the scene only through `VazoXrBaglam`, and game state goes through the same path as on desktop.

- The vase opens at 1:1 scale (44 cm), at table height, 70 cm in front of the head. It goes into VR in whatever state it is in: mark-free, half repaired, or repaired.
- The mark-free vase and the repaired vase are held and rotated as a whole; when released it returns to the table. The repair marks become visible when completed. Panel: `Vazoyu parçala` / `Yeniden başlat` / `Yeniden parçala` and `VR'dan çık`.
- A piece is grabbed with ray + trigger, or by touching/aiming with the side button. When released, if it is within 9 cm (`XR_OTURMA_ESIGI`) of the target it settles via `yerineOturur`, otherwise it returns to the shelf. On desktop the same function works with the pixel threshold. There is no target marker.
- If the controller disconnects or the session closes, the piece in hand returns to the shelf without counting as an attempt. The gamepad is not read, one controller is enough, `XRControllerModelFactory` is not used.
- The `Temsilî model · Tarihî eser değildir` label is attached to the head and does not take part in the depth test.

There is no text under the vase; the "sample text" guidance of the previous panel and the `ALT_YAZI` constant were removed.

Not tried on a real Quest: the VR tests below run with an IWER emulation and do not measure performance or controller feel.

## Verification

- `npm run build`
- `node tests/vase-xr-logic.mjs`: pure calculations; it is included in `npm run test:hizli`.
- `TEST_URL=… node tests/vase-xr-button.mjs`: the button with a fake `navigator.xr`: no xr, no support, rejected.
- `XR_SIM=/gecici/klasor bash tests/xr-sim/setup.sh`, the copy build is previewed and `XR_SIM=… TEST_URL=… node tests/xr-sim/vase-sim.mjs`: end to end with a simulated Quest.
- `node tests/vase.mjs`: Chrome, 1280 and 360px; real GLB request, mark-free start, absence of a piece-specific target marker, wrong release, completing 6 pieces with mouse/touch, different appearance after repair, exact return to the initial image on cancel, grabbing from the model surface, Escape, keyboard, route cleanup and model load error.
- In Blender, it was checked with bmesh that the intact body and the six pieces are closed manifolds and carry positive volume.
- `vazo-*-izsiz.png` and `vazo-*-onarim-izleri.png` are the start/repair comparison from the same camera angle.
- Screenshots are in `test-sonuclari/vazo-*-blender-incele.png`, `vazo-*-surukle-baslangic.png`, `vazo-*-surukle-tamam.png` (outside git).

Technical references: [Three.js Raycaster](https://threejs.org/docs/pages/Raycaster), [Three.js GLTFLoader](https://threejs.org/docs/pages/GLTFLoader), [Blender glTF import/export](https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html).
