#!/bin/bash
# Simüle Quest için geçici kopya hazırlar; deponun koduna ve package.json'a dokunmaz.
# Kullanım: XR_SIM=/gecici/klasor bash tests/xr-sim/kur.sh
# Sonra:    node_modules/.bin/vite preview --outDir "$XR_SIM/dist" --host 127.0.0.1 --port 4174 --strictPort
#           XR_SIM=/gecici/klasor node tests/xr-sim/sim.mjs ana      (Ulu Camii)
#           XR_SIM=/gecici/klasor TEST_URL=http://127.0.0.1:4174 node tests/xr-sim/vazo-sim.mjs      (Vazo)
set -e
: "${XR_SIM:?XR_SIM klasörünü ver}"
K="$(cd "$(dirname "$0")/../.." && pwd)"
mkdir -p "$XR_SIM/kopya" "$XR_SIM/paket" "$XR_SIM/kopya-temiz"
[ -d "$XR_SIM/paket/node_modules/iwer" ] || (cd "$XR_SIM/paket" && npm init -y >/dev/null && npm install --silent iwer)
rm -rf "$XR_SIM/kopya/src" "$XR_SIM/kopya/public"
cp -r "$K/src" "$K/public" "$K/index.html" "$K/vite.config.ts" "$K/package.json" "$K"/tsconfig*.json "$XR_SIM/kopya/"
[ -e "$XR_SIM/kopya/node_modules" ] || ln -s "$K/node_modules" "$XR_SIM/kopya/node_modules"
[ -e "$XR_SIM/kopya-temiz/node_modules" ] || ln -s "$K/node_modules" "$XR_SIM/kopya-temiz/node_modules"
cp "$K/tests/xr-sim/sim-sayfa.js" "$XR_SIM/"
cd "$XR_SIM/kopya"
node "$K/tests/xr-sim/kanca-ekle.mjs"
node_modules/.bin/vite build --logLevel error --outDir "$XR_SIM/dist" --emptyOutDir
echo "Hazır: $XR_SIM/dist"
