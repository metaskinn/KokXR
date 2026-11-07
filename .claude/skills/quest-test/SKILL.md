---
name: quest-test
description: Walks through testing KökXR on a Meta Quest headset (local build, preview, adb). Use when the user asks to try the app on Quest, open it on the device, or test VR on real hardware.
---

# Test on Quest

Start by searching `docs/guncel/DURUM.md` for the "Quest" and "Gerçek cihaz" sections; read only the range you need.

## Pick a route

1. **Cable (adb):** needs Developer Mode, which only the account that owns the headset can enable. If the user is not the owner, use route 2 or 3.
2. **Vercel URL:** `https://kokxr.vercel.app`. No Developer Mode needed. See the `vercel-deploy` skill for deploying.
3. **Browser only:** type the URL into Quest Browser and bookmark it.

Opening `http://<lan-ip>` on the same Wi-Fi does not work: WebXR only runs on `https` or `localhost`.

## Cable steps

1. Confirm the branch: `git branch --show-current`. The PWA manifest and icons exist on `plan/yeni`/`master`, not on `main`.
2. `npm run build`, then `npm run preview` in the background. Read the port from its output: if 4173 is taken, Vite moves to 4174.
3. `adb devices` must list the headset. If empty, check the cable, Developer Mode, and the on-headset USB debugging prompt (Always allow).
4. `adb reverse tcp:<port> tcp:<port>` using the port preview actually uses.
5. In Quest Browser open `http://localhost:<port>/yolculuk`.

## Verification and limits

- The 9 new structures have not been tried on Quest or in the VR simulation. Report only what you observed, never "works".
- FPS is measured on a real device only; software-rendering times are not Quest times.
- If the browser menu offers no "Install / Add to home", the manifest may be missing (`public/manifest.webmanifest`).
- `.nvmrc` requires Node 24+; tell the user when a different version is installed.
