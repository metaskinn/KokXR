"""Generates the pier and plaque atlases of the Ulu Mosque model from archive photographs.

Writing is not imitated or mirrored: each panel is the archive's own straight-on photograph. The photo's lighting
and background colour are removed and the writing is multiplied with the plaster colour, so the panel looks painted on
the plaster rather than a card glued onto the pier. The crest and the arch band are also taken from archive photographs.

Requires: Pillow. Run: python3 scripts/ulu_mosque_pier_atlas.py <archive Links folder> [output folder]
Output: pier-atlas.jpg, plaque-atlas.jpg (2048 px) and -k versions (1024 px) for light devices.
The layout must stay in sync with the constants in src/features/scale-models/ulu-mosque/piers.ts.
"""
import os
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

Image.MAX_IMAGE_PIXELS = None
LINKS = Path(sys.argv[1])
ROOT = Path(__file__).resolve().parent.parent
OUTPUT = Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / 'public/images/ulu-mosque/model'

ATLAS = 2048
CELL_W, CELL_H = 512, 1000
PLASTER = (241, 232, 214)

# Eight panels (archive code). Which face they sit on is representative.
PANELS = ['0022', '0061', '0063', '0075', '0108', '0093', '0106', '0190']
# Crest: (archive code, box 0-1)
CRESTS = [('ERD05161', (0.762, 0.150, 0.996, 0.281))]
# Plaques: (archive code, left, top, right, bottom in the atlas)
PLAQUES = [
    ('0011', (0, 150, 1400, 790)),
    ('0081', (0, 800, 1400, 1250)),
    ('0183', (0, 1260, 1400, 1760)),
    ('0124', (1410, 150, 2048, 620)),
    ('0087', (1410, 630, 2048, 1200)),
]
# Centre line of the arch band: points along the right half of the arch in photo 0288 (5139x3706).
BAND_SOURCE = '0288'
BAND_PATH = [(2470, 300), (2720, 350), (2960, 450), (3170, 590), (3350, 770), (3490, 990), (3590, 1240), (3650, 1500)]
BAND_SIGN = 1
BAND_SHIFT = 32   # shift outwards from the arch so the centre line sits in the middle of the band
BAND_HALF = 36


def find(code):
    return LINKS / next(f for f in sorted(os.listdir(LINKS)) if code in f and f.lower().endswith(('.jpg', '.jpeg')))


def open_photo(code):
    return Image.open(find(code)).convert('RGB')


def flatten_background(im, radius=6, small=96, threshold=0.9):
    """Removes lighting and paper colour: the background goes to 255, the ink remains."""
    k = im.copy()
    k.thumbnail((small, small), Image.Resampling.BOX)
    back = k.filter(ImageFilter.MaxFilter(radius * 2 + 1)).filter(ImageFilter.GaussianBlur(radius))
    back = back.resize(im.size, Image.Resampling.BICUBIC)
    a, b = im.tobytes(), back.tobytes()
    table = bytearray(len(a))
    for i in range(len(a)):
        v = a[i] / max(b[i], 1) / threshold
        table[i] = 255 if v >= 1 else int(v * 255)
    return Image.frombytes('RGB', im.size, bytes(table))


def fade_edges(im, margin):
    """Brings the crop's edge towards white so no cut line remains after multiplying."""
    w, h = im.size
    mask = Image.new('L', (w, h), 0)
    ImageDraw.Draw(mask).rectangle((margin, margin, w - margin, h - margin), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(margin / 2))
    return Image.composite(im, Image.new('RGB', (w, h), (255, 255, 255)), mask)


def make_crests():
    result = []
    for code, (x0, y0, x1, y1) in CRESTS:
        im = open_photo(code)
        k = im.crop((int(x0 * im.width), int(y0 * im.height), int(x1 * im.width), int(y1 * im.height)))
        result.append(Image.blend(fade_edges(flatten_background(k, 12, 128, 0.94), 6), fade_edges(flatten_background(k, 12, 128, 0.94), 6).convert('L').convert('RGB'), 0.45))
    return result


def make_panel(code, crest):
    """Cell: crest at the top (with its shelf), framed writing area below. Scale on the pier: 512 px = 2.33 m."""
    cell = Image.new('RGB', (CELL_W, CELL_H), PLASTER)
    CREST_H = 300
    # Writing area: the archive panel's own thin frame stays; dark line at the bottom (ERD05027)
    d = ImageDraw.Draw(cell)
    im = open_photo(code)
    margin = int(min(im.size) * 0.012)
    im = im.crop((margin, margin, im.width - margin, im.height - margin))
    area_w, area_h = CELL_W - 8, CELL_H - CREST_H - 12
    o = min(area_w / im.width, area_h / im.height)
    k = im.resize((int(im.width * o), int(im.height * o)), Image.Resampling.LANCZOS)
    k = fade_edges(flatten_background(k), 3)
    x, y = (CELL_W - k.width) // 2, CREST_H + (CELL_H - CREST_H - 6 - k.height) // 2
    piece = cell.crop((x, y, x + k.width, y + k.height))
    cell.paste(ImageChops.multiply(piece, k), (x, y))
    d.rectangle((0, CELL_H - 6, CELL_W, CELL_H), fill=(46, 40, 34))
    ox = int(crest.width * CREST_H / crest.height)
    t = crest.resize((ox, CREST_H), Image.Resampling.LANCZOS)
    if ox > CELL_W:
        t = t.crop(((ox - CELL_W) // 2, 0, (ox + CELL_W) // 2, CREST_H))
    tx, ty = (CELL_W - t.width) // 2, CREST_H - t.height
    piece = cell.crop((tx, ty, tx + t.width, ty + t.height))
    cell.paste(ImageChops.multiply(piece, t), (tx, ty))
    return cell


def unwrap_band(source, path, half, height):
    """Straightens the strip along the path (with a quad mesh)."""
    lengths = [0.0]
    for (a, b), (c, e) in zip(path, path[1:]):
        lengths.append(lengths[-1] + ((c - a) ** 2 + (e - b) ** 2) ** 0.5)
    dx_scale = height / (2 * half)
    W = int(lengths[-1] * dx_scale)

    def point(s):
        for i in range(len(path) - 1):
            if s <= lengths[i + 1] or i == len(path) - 2:
                t = (s - lengths[i]) / (lengths[i + 1] - lengths[i])
                x = path[i][0] + (path[i + 1][0] - path[i][0]) * t
                y = path[i][1] + (path[i + 1][1] - path[i][1]) * t
                nx, ny = -(path[i + 1][1] - path[i][1]), path[i + 1][0] - path[i][0]
                L = (nx * nx + ny * ny) ** 0.5
                return x, y, nx / L, ny / L

    mesh = []
    STEP = 16
    for u in range(0, W, STEP):
        s0, s1 = u / dx_scale, min(u + STEP, W) / dx_scale
        a, b = point(s0), point(s1)
        # Quad corners: top left, bottom left, bottom right, top right; top = outside of the arch
        q = (a[0] + a[2] * half, a[1] + a[3] * half, a[0] - a[2] * half, a[1] - a[3] * half,
             b[0] - b[2] * half, b[1] - b[3] * half, b[0] + b[2] * half, b[1] + b[3] * half)
        mesh.append(((u, 0, min(u + STEP, W), height), q))
    return source.transform((W, height), Image.Transform.MESH, mesh, Image.Resampling.BICUBIC)


def make_band():
    im = open_photo(BAND_SOURCE)
    BAND_H = 128
    # Path: smooth the corners (Chaikin), then shift onto the band
    path = list(BAND_PATH)
    for _ in range(3):
        new = [path[0]]
        for (a, b), (c, e) in zip(path, path[1:]):
            new += [(a * 0.75 + c * 0.25, b * 0.75 + e * 0.25), (a * 0.25 + c * 0.75, b * 0.25 + e * 0.75)]
        path = new + [path[-1]]
    shifted = []
    for n, (a, b) in enumerate(path):
        c, e = path[min(n + 1, len(path) - 1)]
        p, r = path[max(n - 1, 0)]
        nx, ny = -(e - r), c - p
        L = (nx * nx + ny * ny) ** 0.5 or 1
        shifted.append((a - nx / L * BAND_SHIFT * BAND_SIGN, b - ny / L * BAND_SHIFT * BAND_SIGN))
    trim = 180  # leave out the chandelier wire in the photo
    s = unwrap_band(im, shifted, BAND_HALF, BAND_H)
    s = s.crop((trim, 0, s.width - 40, BAND_H))
    if os.environ.get('BAND_PREVIEW'):
        s.save(os.environ['BAND_PREVIEW'])
    # Only brightness is taken: the colour shift of the night light is dropped; paint is mapped to the olive cream ground and dark brown stem in ERD05161.
    s = s.convert('L')
    k = s.resize((max(1, s.width // 48), 1), Image.Resampling.BOX).filter(ImageFilter.GaussianBlur(1)).resize(s.size, Image.Resampling.BICUBIC)
    a, b = s.tobytes(), k.tobytes()
    mean = sum(b) / len(b)
    s = Image.frombytes('L', s.size, bytes(min(255, int(x / max(y, 1) * mean)) for x, y in zip(a, b)))
    blend = 96
    single = s.resize((ATLAS + blend, BAND_H), Image.Resampling.LANCZOS)
    gray = single.crop((0, 0, ATLAS, BAND_H))
    for x in range(blend):
        left = single.crop((ATLAS + x, 0, ATLAS + x + 1, BAND_H))
        right = single.crop((x, 0, x + 1, BAND_H))
        gray.paste(Image.blend(left, right, x / blend), (x, 0))
    # Colour mapping: darkest brown, mid warm brown, cream ground
    stops = [(0, (30, 24, 17)), (90, (74, 56, 36)), (170, (176, 158, 118)), (255, (226, 214, 180))]
    table = []
    for channel in range(3):
        for v in range(256):
            for (a0, r0), (a1, r1) in zip(stops, stops[1:]):
                if v <= a1:
                    table.append(int(r0[channel] + (r1[channel] - r0[channel]) * (v - a0) / (a1 - a0)))
                    break
    out = Image.merge('RGB', (gray, gray, gray)).point(table)
    # Thin dark line on both edges of the band (0288, ERD05161)
    d = ImageDraw.Draw(out)
    d.rectangle((0, 0, ATLAS, 4), fill=(66, 52, 34))
    d.rectangle((0, BAND_H - 5, ATLAS, BAND_H - 1), fill=(66, 52, 34))
    return out


def pier_atlas():
    crests = make_crests()
    atlas = Image.new('RGB', (ATLAS, ATLAS), PLASTER)
    for n, code in enumerate(PANELS):
        cell = make_panel(code, crests[n % len(crests)])
        atlas.paste(cell, ((n % 4) * CELL_W, (n // 4) * CELL_H))
        print('panel', code)
    # Bottom strip: flat paint swatches (plaster, dark, gold): u = 1/8, 3/8, 5/8 per the constants at the top of piers.ts
    d = ImageDraw.Draw(atlas)
    y0 = 2 * CELL_H
    d.rectangle((0, y0, ATLAS // 4, ATLAS), fill=PLASTER)
    d.rectangle((ATLAS // 4, y0, ATLAS // 2, ATLAS), fill=(44, 40, 36))
    d.rectangle((ATLAS // 2, y0, 3 * ATLAS // 4, ATLAS), fill=(138, 108, 56))
    return atlas


def plaque_atlas():
    atlas = Image.new('RGB', (ATLAS, ATLAS), (40, 34, 26))
    band = make_band()
    atlas.paste(band, (0, 0))
    # Frame strip under the arch: light, dark, brown, cream (ERD05161 and 0334): rows 128-168, repeating lengthwise.
    # Plaster margin above and below so the line does not darken at small mip levels.
    d = ImageDraw.Draw(atlas)
    for y0, y1, r in [(128, 136, (150, 138, 118)), (136, 154, (44, 38, 32)), (154, 162, (128, 98, 60)), (162, 176, (232, 222, 200))]:
        d.rectangle((0, y0, ATLAS, y1 - 1), fill=r)
    for code, (x0, y0, x1, y1) in PLAQUES:
        im = open_photo(code)
        margin = int(min(im.size) * 0.02) if code == '0081' else 0  # light edge in the photo
        im = im.crop((margin, margin, im.width - margin, im.height - margin))
        w, h = x1 - x0, y1 - y0
        o = min(w / im.width, h / im.height)
        k = im.resize((int(im.width * o), int(im.height * o)), Image.Resampling.LANCZOS)
        px0, py0 = x0 + (w - k.width) // 2, y0 + (h - k.height) // 2
        atlas.paste(k, (px0, py0))
        print('plaque', code, [px0, py0, k.width, k.height])
    return atlas


def write(im, name):
    OUTPUT.mkdir(parents=True, exist_ok=True)
    im.save(OUTPUT / f'{name}.jpg', quality=86, optimize=True, progressive=True)
    im.resize((ATLAS // 2, ATLAS // 2), Image.Resampling.LANCZOS).filter(ImageFilter.UnsharpMask(1, 40, 2)).save(OUTPUT / f'{name}-k.jpg', quality=84, optimize=True, progressive=True)


if __name__ == '__main__':
    write(pier_atlas(), 'pier-atlas')
    write(plaque_atlas(), 'plaque-atlas')
