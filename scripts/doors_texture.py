"""Textures for the Ulu Mosque doors region: crown door atlas and facade stone. Sources are archive photographs only.
Usage: python3 scripts/doors_texture.py "<archive>/Links" public/images/ulu-mosque/model
Atlas layout must match PLACE and PAINT in src/features/scale-models/ulu-mosque/doors.ts."""
import sys
from PIL import Image, ImageChops, ImageFilter, ImageDraw, ImageStat
Image.MAX_IMAGE_PIXELS = None
L = sys.argv[1] + '/'
C = sys.argv[2] + '/'

from PIL import ImageEnhance
def ImageEnhanceBright(p, f):
    return ImageEnhance.Brightness(p).enhance(f)

def open_photo(name):
    return Image.open(L + name).convert('RGB')

def quad(im, q, w, h):
    """q: top left, bottom left, bottom right, top right (source pixels)."""
    return im.transform((w, h), Image.QUAD, [c for p in q for c in p], Image.BICUBIC)

def flatten(im, r=60, strength=0.8):
    """Removes large-scale lighting differences so the texture's light does not clash with the scene's light."""
    m = [round(v) for v in ImageStat.Stat(im).mean]
    b = im.filter(ImageFilter.GaussianBlur(r))
    out = []
    for ca, cb, mv in zip(im.split(), b.split(), m):
        cb = Image.blend(Image.new('L', im.size, mv), cb, strength)
        out.append(ImageChops.subtract(ca, cb, 1, mv))
    return Image.merge('RGB', out)

def patch(im, box, dy, soft=10):
    """Covers the box with the piece dy above it in the same column; soft edges. Box is in current image pixels."""
    x0, y0, x1, y1 = box
    p = im.crop((x0, y0 - dy, x1, y1 - dy))
    m = Image.new('L', (x1 - x0, y1 - y0), 0)
    ImageDraw.Draw(m).rectangle((soft, soft, x1 - x0 - soft, y1 - y0 - soft), fill=255)
    im.paste(p, (x0, y0), m.filter(ImageFilter.GaussianBlur(soft / 2)))

# --- Crown door: frontal shot. Coordinates refer to an 859-pixel preview. ---
f = open_photo('DJI_20241027172515_0203_D_ODAK.jpeg')
k = f.width / 859
CX = 430
PX0, PX1, PY0, PY1 = 25, 835, 165, 1410
# The right half is mirrored to remove the tree covering the left side (the building is symmetric in this range).
mir = f.crop((int((2 * CX - 208) * k), 0, int((2 * CX - 0) * k), f.height)).transpose(Image.FLIP_LEFT_RIGHT)
mask = Image.new('L', mir.size, 255)
ImageDraw.Draw(mask).rectangle((mir.width - 12, 0, mir.width, mir.height), fill=0)
f.paste(mir, (0, 0), mask.filter(ImageFilter.GaussianBlur(4)))
# Information signs: covered with the upper blocks of the same column.
def pk(x0, y0, x1, y1, dy):
    patch(f, (int(x0 * k), int(y0 * k), int(x1 * k), int(y1 * k)), int(dy * k), soft=30)
pk(606, 1136, 658, 1286, 300)
pk(212, 1176, 262, 1244, 220)
AT = 2048
atlas = Image.new('RGB', (AT, AT), (150, 148, 145))
a = AT / (PY1 - PY0)
pw = int((PX1 - PX0) * a)
crown = f.crop((int(PX0 * k), int(PY0 * k), int(PX1 * k), int(PY1 * k))).resize((pw, AT), Image.LANCZOS)
atlas.paste(crown, (0, 0))
place = {'crown': [0, 0, pw, AT]}

# --- North facade, perspective-corrected view: sizes refer to a 1500-pixel view (55 pixels/metre). ---
g = open_photo('DJI_20241208084026_0291_D_ODAK.jpeg')
s = g.width / 1800
VP = (-118, 658)
def line(x, xr, yr):
    return VP[1] + (yr - VP[1]) * (x - VP[0]) / (xr - VP[0])
X0, X1, XM, Y0, Y1 = 640, 1330, 960, 280, 1340
def facade(scale):
    q = [(X0 * s, line(X0, XM, Y0) * s), (X0 * s, line(X0, XM, Y1) * s), (X1 * s, line(X1, XM, Y1) * s), (X1 * s, line(X1, XM, Y0) * s)]
    W, H = int(1500 * scale), int(1200 * (Y1 - Y0) / 770 * scale)
    return g.transform((W, H), Image.QUAD, [v for p in q for v in p], Image.BICUBIC)
R2 = facade(2)
def rk(x0, y0, x1, y1, w, h):
    return R2.crop((x0 * 2, y0 * 2, x1 * 2, y1 * 2)).resize((w, h), Image.LANCZOS)
# Upper window: stone lattice
atlas.paste(rk(478, 335, 600, 665, 240, 400), (1340, 0)); place['top'] = [1340, 0, 240, 400]
# Eave moulding
atlas.paste(ImageEnhance.Color(rk(830, 46, 1430, 100, 300, 60)).enhance(0.45).point(lambda v: min(255, int(v * 1.42))), (1340, 1490)); place['eave'] = [1340, 1490, 300, 60]
# Marble-framed opening: left half; mirrored about the x=1355 axis without touching the minaret, base y=1350
atlas.paste(rk(1170, 795, 1355, 1350, 390, 1056), (1650, 790)); place['door'] = [1650, 790, 390, 1056]

# --- Lower window: iron grille, frontal shot. ---
h = open_photo('ERD04834 kopya.jpg')
s2 = h.width / 1500
alt = h.crop((int(1083 * s2), int(291 * s2), int(1132 * s2), int(372 * s2))).resize((240, 400), Image.LANCZOS)
atlas.paste(alt, (1590, 0)); place['alt'] = [1590, 0, 240, 400]

# --- Fountain basin face: marble panel and tap. ---
pool = h.crop((int(528 * s2), int(575 * s2), int(905 * s2), int(790 * s2))).resize((400, 230), Image.LANCZOS)
atlas.paste(pool, (1340, 410)); place['pool'] = [1340, 410, 400, 230]

# --- Pedestal: rough stone and moulding, frontal shot (slightly oblique). ---
ped = quad(h, [(1012 * s2, 413 * s2), (1012 * s2, 493 * s2), (1262 * s2, 498 * s2), (1262 * s2, 414 * s2)], 700, 120)
atlas.paste(ped, (1340, 650)); place['pedestal'] = [1340, 650, 700, 120]

# --- Kiosk dome: middle segment, lead sheets. ---
d = open_photo('ERD04751 kopya.jpg')
s3 = d.width / 1043
# Two segments at the centre (16-segment dome, ±22.5 degrees): each row is sampled according to the dome's radius at that height.
R = [(362, 2), (390, 18), (420, 40), (450, 66), (480, 92), (510, 125), (540, 160), (580, 188), (620, 197), (662, 196)]
def radius(y):
    for (y0, r0), (y1, r1) in zip(R, R[1:]):
        if y0 <= y <= y1: return r0 + (r1 - r0) * (y - y0) / (y1 - y0)
    return R[-1][1]
dome = Image.new('RGB', (300, 700))
for i in range(700):
    y = 362 + 300 * (i + 0.5) / 700
    w = max(3, radius(y) * 0.3827)
    dome.paste(d.crop((int((435 - w) * s3), int(y * s3), int((435 + w) * s3), int(y * s3) + 1)).resize((300, 1), Image.BILINEAR), (0, i))
# The photo was taken in cloudy weather: darkened so it does not look pale under the scene's sun, more at the top.
for i in range(700):
    f = 0.56 + 0.2 * (i / 700)
    dome.paste(dome.crop((0, i, 300, i + 1)).point(lambda v, f=f: int(v * f)), (0, i))
atlas.paste(dome, (1340, 780)); place['dome'] = [1340, 780, 300, 700]

# --- Paint swatches: wood, cream plaster and water are drawn from the same atlas (no extra draw call). ---
PAINT = ['#2f1c12', '#d9cdb0', '#d8cfb6', '#a79d84', '#27442f', '#55796f']
for i, color in enumerate(PAINT):
    ImageDraw.Draw(atlas).rectangle((1760 + i * 44, 420, 1760 + i * 44 + 39, 459), fill=color)
atlas.save(C + 'doors-atlas.jpg', quality=88, optimize=True)
atlas.resize((1024, 1024), Image.LANCZOS).save(C + 'doors-atlas-1024.jpg', quality=84, optimize=True)

# --- Facade stone: laid with stones cut from clean wall areas of the archive (128 pixels/metre, 8 x 8 m, seamless). ---
import random
r = random.Random(1402)
OL = 128 / 55
Rt = facade(OL)
REGIONS = [(705, 485, 945, 790), (1010, 470, 1390, 770), (715, 830, 930, 1190), (1005, 825, 1165, 1180), (840, 110, 1140, 225), (1170, 110, 1430, 225)]
REGIONS = [tuple(int(v * OL) for v in b) for b in REGIONS]
weights = [(b[2] - b[0]) * (b[3] - b[1]) for b in REGIONS]
N = 1024
t = Image.new('RGB', (N, N))
joint = Image.new('L', (N, N), 255)
dd = ImageDraw.Draw(joint)
# Course heights: chosen to fit exactly
courses = []
while sum(courses) < N - 90: courses.append(r.choice([40, 44, 48, 54, 60, 68]))
courses.append(N - sum(courses))
y = 0
for h in courses:
    x = r.randrange(N)
    start = x
    while x < start + N:
        w = min(r.randint(58, 170), start + N - x)
        if start + N - x - w < 40: w = start + N - x
        b = r.choices(REGIONS, weights)[0]
        px = r.randint(b[0], b[2] - w - 1) if b[2] - b[0] > w + 1 else b[0]
        py = r.randint(b[1], b[3] - h - 1)
        p = Rt.crop((px, py, px + w, py + h))
        # Tone differences between stones are reduced: in the photo the wall does not jump between regions.
        mp = ImageStat.Stat(p).mean
        tj = 0.97 + r.random() * 0.08
        p = Image.merge('RGB', [c.point(lambda v, f=(((192, 172, 146)[i] / mp[i]) ** 0.72) * tj: min(255, int(v * f))) for i, c in enumerate(p.split())])
        for ox in (x % N, x % N - N):
            t.paste(p, (ox, y))
            dd.rectangle((ox, y, ox + w - 1, y + 1), fill=165)
            dd.rectangle((ox, y, ox + 1, y + h - 1), fill=165)
        x += w
    y += h
joint = joint.filter(ImageFilter.GaussianBlur(0.8))
t = ImageChops.multiply(t, Image.merge('RGB', [joint, joint, joint]))
# Tone: the pale beige of the photograph
target = (192, 172, 146)
m = ImageStat.Stat(t).mean
t = Image.merge('RGB', [c.point(lambda v, f=target[i] / m[i]: min(255, int(v * f))) for i, c in enumerate(t.split())])
t.save(C + 'facade-stone.jpg', quality=85, optimize=True)
print(place)
