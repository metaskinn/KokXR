#!/bin/bash
# Prepares a temporary copy for the simulated Quest; does not touch the repo code or package.json.
# Usage: XR_SIM=/tmp/folder bash tests/xr-sim/setup.sh
# Then:  node_modules/.bin/vite preview --outDir "$XR_SIM/dist" --host 127.0.0.1 --port 4174 --strictPort
#        XR_SIM=/tmp/folder node tests/xr-sim/sim.mjs main      (Ulu Mosque)
#        XR_SIM=/tmp/folder TEST_URL=http://127.0.0.1:4174 node tests/xr-sim/vase-sim.mjs      (Vase)
#        XR_SIM=/tmp/folder TEST_URL=http://127.0.0.1:4174 node tests/xr-sim/assemble-sim.mjs      (Model assembly)
set -e
: "${XR_SIM:?set the XR_SIM folder}"
K="$(cd "$(dirname "$0")/../.." && pwd)"
mkdir -p "$XR_SIM/copy" "$XR_SIM/package" "$XR_SIM/copy-clean"
[ -d "$XR_SIM/package/node_modules/iwer" ] || (cd "$XR_SIM/package" && npm init -y >/dev/null && npm install --silent iwer)
rm -rf "$XR_SIM/copy/src" "$XR_SIM/copy/public"
cp -r "$K/src" "$K/public" "$K/index.html" "$K/vite.config.ts" "$K/package.json" "$K"/tsconfig*.json "$XR_SIM/copy/"
[ -e "$XR_SIM/copy/node_modules" ] || ln -s "$K/node_modules" "$XR_SIM/copy/node_modules"
[ -e "$XR_SIM/copy-clean/node_modules" ] || ln -s "$K/node_modules" "$XR_SIM/copy-clean/node_modules"
cp "$K/tests/xr-sim/sim-page.js" "$XR_SIM/"
cd "$XR_SIM/copy"
node "$K/tests/xr-sim/hook-add.mjs"
node_modules/.bin/vite build --logLevel error --outDir "$XR_SIM/dist" --emptyOutDir
echo "Ready: $XR_SIM/dist"
