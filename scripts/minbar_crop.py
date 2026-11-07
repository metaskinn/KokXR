"""Minbar region textures: perspective-corrected crops from archive photographs.
Output: minbar-atlas(.jpg, -1024.jpg) and minbar-kundekari(.jpg, -512.jpg). No dependency besides PIL.
Usage: minbar_crop.py <archive Links folder> <public/images/ulu-mosque/model>
Region rectangles are printed: they must match REGION in src/features/scale-models/ulu-mosque/minbar.ts."""
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageOps
import json, sys, os

ARCHIVE = sys.argv[1]
OUTPUT = sys.argv[2]
Image.MAX_IMAGE_PIXELS = None


def coefficients(target, source):
    """PIL PERSPECTIVE coefficients (Gaussian elimination; no numpy)."""
    A, b = [], []
    for (x, y), (u, v) in zip(target, source):
        A.append([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.append(u)
        A.append([0, 0, 0, x, y, 1, -v * x, -v * y]); b.append(v)
    n = 8
    M = [r + [c] for r, c in zip(A, b)]
    for i in range(n):
        p = max(range(i, n), key=lambda r: abs(M[r][i]))
        M[i], M[p] = M[p], M[i]
        for r in range(n):
            if r != i:
                f = M[r][i] / M[i][i]
                M[r] = [a - f * c for a, c in zip(M[r], M[i])]
    return [M[i][n] / M[i][i] for i in range(n)]


_cache = {}
def photo(name):
    if name not in _cache:
        _cache[name] = Image.open(os.path.join(ARCHIVE, name)).convert('RGB')
    return _cache[name]


def rectify(name, corners, w, h):
    """corners: top left, top right, bottom right, bottom left (full-resolution pixels)."""
    k = coefficients([(0, 0), (w, 0), (w, h), (0, h)], corners)
    return photo(name).transform((w, h), Image.PERSPECTIVE, k, Image.BICUBIC)


def preview(ox, oy, f, x0, y0):
    return lambda px, py: (x0 + f * px, y0 + f * py)


F99 = 'ERD04999 kopya.jpg'
F98 = 'ERD04998 kopya-2.jpg'
F65 = 'DJI_20241210010423_0173_D_ODAK.jpg'
F85 = 'DJI_20241210024324_0276_D_ODAK.jpg'
F103 = 'ERD05030 kopya.jpg'
F89 = 'DJI_20241210050233_0334_D_ODAK.jpg'

# Preview scales: conversion of the inspected crops to full resolution.
p99 = preview(0, 0, 2200 / 1204, 1320, 155)        # ac.py 99 1500 .33 .03 .88 .56
p98 = preview(0, 0, 1680 / 1112, 1600, 705)        # ac.py 98 1400 .40 .15 .82 .60
p65 = preview(0, 0, 2510 / 943, 0, 0)
p85 = preview(0, 0, 5272 / 1400, 0, 0)
p103 = preview(0, 0, 3184 / 764, 0, 0)
p89 = preview(0, 0, (0.14 * 6529) / 914, 0.28 * 6529, 0.55 * 5760)

atlas = Image.new('RGB', (2048, 2048), (34, 20, 12))
region = {}
def put(name, im, x, y):
    atlas.paste(im, (x, y))
    region[name] = [x, y, im.width, im.height]


# --- Kiosk north face (g98): from the column capital to below the curtained niche ---
def mirror_fill(im, corner):
    """Fills a corner hidden by another element in the photo with the face's symmetric half (corners without writing)."""
    m = Image.new('L', im.size, 0)
    ImageDraw.Draw(m).polygon(corner, fill=255)
    m = m.filter(ImageFilter.GaussianBlur(3))
    return Image.composite(ImageOps.mirror(im), im, m)


put('kioskNorth', mirror_fill(rectify(F98, [p98(737, 292), p98(978, 172), p98(976, 806), p98(772, 826)], 480, 1336), [(480, 900), (480, 1336), (130, 1336), (190, 1215)]), 0, 0)
# --- Kiosk west face (g99): niche, lattice, gold-framed panel, Kufic band ---
put('kioskWest', mirror_fill(rectify(F99, [p99(905, 378), p99(1137, 378), p99(1137, 990), p99(905, 990)], 480, 1266), [(262, 0), (480, 0), (480, 430)]), 490, 0)
# --- Inscription and crown above the door (g98) ---
put('doorBoard', rectify(F98, [p98(100, 1128), p98(252, 1100), p98(252, 1224), p98(102, 1248)], 512, 440), 980, 0)
crown = rectify(F98, [p98(78, 868), p98(278, 861), p98(278, 1018), p98(78, 1078)], 512, 320)
# Turns the light wall in the background into dark walnut so pixels overflowing the cut line do not look white.
px = crown.load()
for ty in range(crown.height):
    for tx in range(crown.width):
        r, g, b = px[tx, ty]
        if min(r, g, b) > 95 and max(r, g, b) - min(r, g, b) < 90:
            px[tx, ty] = (28, 16, 9)
put('doorCrown', crown, 980, 450)
# --- Side panel of the gallery stair: floral ornament on leather (g65) ---
put('leather', rectify(F65, [p65(168, 790), p65(690, 790), p65(690, 1296), p65(168, 1296)], 512, 496), 1500, 0)
# --- Pulpit: veined marble and inscription (g103) ---
marble = rectify(F103, [p103(272, 615), p103(632, 615), p103(632, 660), p103(272, 660)], 512, 128)
marble2 = Image.new('RGB', (1024, 128))
marble2.paste(marble, (0, 0)); marble2.paste(ImageOps.mirror(marble), (512, 0))
put('marble', marble2, 980, 810)
put('inscription', rectify(F103, [p103(294, 528), p103(630, 528), p103(630, 618), p103(294, 618)], 512, 137), 1500, 510)
put('pedestal', rectify(F103, [p103(296, 880), p103(612, 880), p103(614, 1018), p103(294, 1018)], 256, 112), 1500, 660)
# --- Walnut: gallery beam (g85) ---
def darken(im, kr, kg, kb):
    r, g, b = im.split()
    return Image.merge('RGB', (r.point(lambda v: v * kr), g.point(lambda v: v * kg), b.point(lambda v: v * kb)))


# Brings the flash-lit beam colour in the photo down to the gallery's overall dark walnut.
put('walnut', darken(rectify(F85, [p85(135, 584), p85(735, 584), p85(735, 610), p85(135, 610)], 1060, 84), 0.5, 0.56, 0.6), 980, 945)
# --- Star-patterned wooden panel (g85) ---
put('boardStar', rectify(F85, [p85(1172, 830), p85(1365, 830), p85(1365, 910), p85(1172, 910)], 280, 116), 1762, 660)
# --- Cabinet front: arched lattice and shelves (g89) ---
put('cabinet', rectify(F89, [p89(198, 125), p89(480, 125), p89(480, 515), p89(198, 515)], 360, 498), 0, 1345)
# --- Wood surface for the sides (g89) ---
put('cabinetSide', darken(rectify(F89, [p89(660, 210), p89(708, 210), p89(708, 430), p89(660, 430)], 120, 400), 0.62, 0.66, 0.7), 370, 1345)

os.makedirs(OUTPUT, exist_ok=True)
atlas.save(os.path.join(OUTPUT, 'minbar-atlas.jpg'), quality=86)
atlas.resize((1024, 1024), Image.LANCZOS).save(os.path.join(OUTPUT, 'minbar-atlas-1024.jpg'), quality=84)
print(json.dumps(region))

# --- Kündekâri: from the area of the minbar's west face without glass reflections, mirrored to be seamless ---
source = rectify(F99, [p99(925, 1000), p99(1117, 1000), p99(1117, 1272), p99(925, 1272)], 512, 720)
blur = source.filter(ImageFilter.GaussianBlur(70))
mean = tuple(int(sum(source.resize((1, 1)).getpixel((0, 0))[i] for _ in [0])) for i in range(3))
channels = []
for i in range(3):
    a, b = source.getchannel(i), blur.getchannel(i)
    channels.append(ImageChops.add(a, ImageChops.invert(b), scale=1, offset=mean[i] - 255))
flat = Image.merge('RGB', channels)
full = Image.new('RGB', (1024, 1440))
full.paste(flat, (0, 0)); full.paste(ImageOps.mirror(flat), (512, 0))
bottom = ImageOps.flip(full.crop((0, 0, 1024, 720)))
full.paste(bottom, (0, 720))
full.save(os.path.join(OUTPUT, 'minbar-kundekari.jpg'), quality=86)
full.resize((512, 720), Image.LANCZOS).save(os.path.join(OUTPUT, 'minbar-kundekari-512.jpg'), quality=84)
print(mean)
