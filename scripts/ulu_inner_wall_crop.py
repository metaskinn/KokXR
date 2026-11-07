"""Generates the Ulu Mosque inner wall textures from archive photographs (perspective correction, atlas).

Outputs (public/images/ulu-mosque/model/):
  interior-window.webp: 1024 px atlas. Upper-row lattice, qibla window, niche crest (transparent edges), flat colours.
  kaaba-cover.jpg, kaaba-cover-1024.jpg: corrected crop of the cover in the display case. The writing comes from the photo, it is not drawn.
Corners are the photo's own pixels. The crest is mirrored because it is only clean on one side in the photo.
Requires: Pillow. Run: python3 scripts/ulu_inner_wall_crop.py <archive Links folder>
"""
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter

Image.MAX_IMAGE_PIXELS = None
LINKS = Path(sys.argv[1])
OUTPUT = Path(__file__).resolve().parent.parent / 'public/images/ulu-mosque/model'


def solve(A, b):
    """Gaussian elimination."""
    n = len(b)
    M = [list(A[i]) + [b[i]] for i in range(n)]
    for i in range(n):
        p = max(range(i, n), key=lambda r: abs(M[r][i]))
        M[i], M[p] = M[p], M[i]
        for r in range(n):
            if r != i:
                o = M[r][i] / M[i][i]
                M[r] = [x - o * y for x, y in zip(M[r], M[i])]
    return [M[i][n] / M[i][i] for i in range(n)]


def rectify(photo, top_left, top_right, bottom_right, bottom_left, w, h):
    """Unwarps the quad into a w×h rectangle."""
    source = [top_left, top_right, bottom_right, bottom_left]
    target = [(0, 0), (w, 0), (w, h), (0, h)]
    A, b = [], []
    for (tx, ty), (sx, sy) in zip(target, source):
        A.append([tx, ty, 1, 0, 0, 0, -sx * tx, -sx * ty]); b.append(sx)
        A.append([0, 0, 0, tx, ty, 1, -sy * tx, -sy * ty]); b.append(sy)
    return photo.transform((w, h), Image.PERSPECTIVE, tuple(solve(A, b)), Image.BICUBIC)


def flat_color(photo, x0, y0, x1, y1, size=60):
    return photo.crop((x0, y0, x1, y1)).resize((1, 1), Image.BOX).resize((size, size))


def crest(photo):
    """Leaf ornament above the niche arch: fix the horizontal shear, make the wall and arch interior transparent, mirror."""
    x0, y0 = 4600, 2900
    SHEAR, AXIS, TOP = 0.39, 355, 60
    piece = photo.crop((x0, y0, x0 + 539, y0 + 806))
    # Output (x, y) -> source (x, y + shear * (x - axis) + top)
    straight = piece.transform((AXIS, 760), Image.AFFINE, (1, 0, 0, SHEAR, 1, -SHEAR * AXIS + TOP), Image.BICUBIC)
    w, h = straight.size
    p = straight.load()
    wall = lambda r, gr, b: r > 205 and gr > 165 and b > 120 and r - b < 95
    seen = bytearray(w * h)
    stack = [(0, v) for v in range(0, h, 4)] + [(u, 0) for u in range(0, w, 4)]
    while stack:
        u, v = stack.pop()
        if not (0 <= u < w and 0 <= v < h) or seen[v * w + u] or not wall(*p[u, v]):
            continue
        seen[v * w + u] = 1
        stack += [(u + 1, v), (u - 1, v), (u, v + 1), (u, v - 1)]
    mask = Image.frombytes('L', (w, h), bytes(0 if d else 255 for d in seen))
    mask = mask.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.7))
    # The arch interior and ring are drawn with geometry; keep only the ornament.
    arch = Image.new('L', (w, h), 255)
    dr = ImageDraw.Draw(arch)
    AY = ARCH_BASE = 640
    dr.ellipse((AXIS - 262, ARCH_TOP, AXIS + 262, AY + (AY - ARCH_TOP)), fill=0)
    dr.rectangle((0, ARCH_BASE, w, h), fill=0)
    mask = ImageChops.multiply(mask, arch)
    rgba = straight.convert('RGBA')
    rgba.putalpha(mask)
    full = Image.new('RGBA', (AXIS * 2, h), (0, 0, 0, 0))
    full.paste(rgba, (0, 0))
    full.paste(rgba.transpose(Image.FLIP_LEFT_RIGHT), (AXIS, 0))
    cropped = full.crop(full.getbbox())
    # The frame of the plaque in the photo remains at the top: the ornament is below this line.
    bottom = cropped.crop((0, int(cropped.height * 0.135), cropped.width, cropped.height))
    print('crest source size', bottom.crop(bottom.getbbox()).size)
    return bottom.crop(bottom.getbbox())


ARCH_TOP = 300


def main():
    a = Image.open(LINKS / 'ERD05018 kopya.jpg').convert('RGB')
    # Upper-row window: plaster lattice (crop offset 3200, 100)
    k = lambda x, y: (3200 + x, 100 + y)
    lattice = rectify(a, k(175, 457), k(770, 26), k(768, 975), k(152, 1230), 624, 1024)
    red = flat_color(a, *k(112, 1000), *k(142, 1040))
    glass = flat_color(a, *k(680, 600), *k(705, 660))
    b = Image.open(LINKS / 'ERD05161-Geliştirilmiş-NR kopya-2.jpg').convert('RGB')
    # Qibla window: carved plaster lattice west of the green plaque (crop offset 1000, 100)
    k3 = lambda x, y: (1000 + x, 100 + y)
    qibla = rectify(b, k3(85, 112), k3(475, 93), k3(475, 1165), k3(85, 1095), 280, 540)
    brown = flat_color(b, *k3(490, 500), *k3(525, 620))
    c = Image.open(LINKS / 'DJI_20241210035234_0288_D_ODAK-3.jpg').convert('RGB')
    # Lower window glass: DJI_0288 north wall, left niche
    glass_low = flat_color(c, 2200 + 150, 2000 + 300, 2200 + 225, 2000 + 395)
    top = crest(c)
    top.thumbnail((392, 330), Image.LANCZOS)
    # Pinkish white balance in the photo: the other frames (ERD05161) show this ornament as browner.
    alpha = top.getchannel('A')
    top = ImageEnhance.Brightness(ImageEnhance.Color(top.convert('RGB')).enhance(0.7)).enhance(0.8).convert('RGBA')
    top.putalpha(alpha)

    atlas = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
    atlas.paste(lattice, (0, 0))
    tx = 628 + (392 - top.width) // 2
    atlas.paste(top, (tx, 4), top)
    atlas.paste(qibla, (684, 340))
    atlas.paste(red, (640, 900))
    atlas.paste(glass, (720, 900))
    atlas.paste(brown, (800, 900))
    atlas.paste(glass_low, (880, 900))
    atlas.save(OUTPUT / 'interior-window.webp', quality=88, method=6)
    print('crest', top.size, 'position', tx, 4)

    # Kaaba cover (crop offset 2550, 2050)
    k2 = lambda x, y: (2550 + x, 2050 + y)
    cover = rectify(a, k2(428, 305), k2(1432, 128), k2(1362, 1240), k2(178, 1152), 1400, 1180)
    cover.save(OUTPUT / 'kaaba-cover.jpg', quality=88)
    cover.resize((1024, 863), Image.LANCZOS).save(OUTPUT / 'kaaba-cover-1024.jpg', quality=86)


main()
