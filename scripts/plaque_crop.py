"""Generates the plaque and pier inscription textures of the Ulu Mosque model from archive photographs.

Calligraphy is not imitated: each texture is a perspective-corrected crop of an archive photograph in the project.
Writing is not mirrored. Input: public/images/ulu-mosque/, output: public/images/ulu-mosque/model/.
Requires: Pillow. Run: python3 scripts/plaque_crop.py [root folder]
"""
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent
INPUT = ROOT / 'public/images/ulu-mosque'
OUTPUT = INPUT / 'model'

# name: (photo, top left, top right, bottom right, bottom left, output width, output height)
# Corners are in the photo's own pixel coordinates.
PLAQUES = {
    'plaque-gold': ('calligraphy-plaque.jpg', (0, 0), (1546, 0), (1546, 1600), (0, 1600), 900, 931),
    'pier-1': ('interior-space-long.jpg', (252, 606), (416, 606), (416, 922), (252, 922), 400, 770),
    'pier-2': ('interior-space-long.jpg', (494, 612), (586, 612), (586, 776), (494, 776), 400, 712),
    'pier-3': ('fountain.jpg', (94, 360), (345, 360), (345, 776), (94, 885), 520, 1000),
    'pier-4': ('fountain.jpg', (1275, 368), (1505, 368), (1505, 875), (1275, 770), 520, 1000),
    'pier-5': ('interior-space.jpg', (728, 560), (802, 582), (800, 802), (728, 770), 400, 800),
    'pier-6': ('interior-space.jpg', (810, 582), (872, 560), (872, 770), (810, 802), 400, 800),
    'mihrab-front': ('mihrab.jpg', (0, 0), (1600, 0), (1600, 1148), (0, 1148), 1400, 1004),
    'window-interior': ('interior-space-long.jpg', (1432, 130), (1570, 110), (1575, 420), (1432, 440), 420, 760),
    'banner-green': ('minbar.jpg', (745, 352), (873, 272), (873, 588), (745, 632), 340, 700),
    'medallion': ('minbar.jpg', (88, 733), (160, 733), (160, 795), (88, 795), 360, 310),
    'plaque-small': ('minbar.jpg', (80, 866), (166, 851), (166, 890), (80, 899), 480, 254),
}


def coefficients(target, source):
    """Perspective coefficients mapping the target quad onto the source quad (Gaussian elimination)."""
    a = []
    for (x, y), (u, v) in zip(target, source):
        a.append([x, y, 1, 0, 0, 0, -u * x, -u * y, u])
        a.append([0, 0, 0, x, y, 1, -v * x, -v * y, v])
    n = 8
    for i in range(n):
        p = max(range(i, n), key=lambda r: abs(a[r][i]))
        a[i], a[p] = a[p], a[i]
        for r in range(n):
            if r != i:
                f = a[r][i] / a[i][i]
                a[r] = [x - f * y for x, y in zip(a[r], a[i])]
    return [a[i][8] / a[i][i] for i in range(n)]


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for name, (photo, tl, tr, br, bl, w, h) in PLAQUES.items():
        source = Image.open(INPUT / photo).convert('RGB')
        k = coefficients([(0, 0), (w, 0), (w, h), (0, h)], [tl, tr, br, bl])
        result = source.transform((w, h), Image.Transform.PERSPECTIVE, k, Image.Resampling.BICUBIC)
        result.save(OUTPUT / f'{name}.jpg', quality=84, optimize=True)
        print(name, photo, source.size, '->', (w, h))


if __name__ == '__main__':
    main()
