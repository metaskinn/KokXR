"""Sword workshop textures (original, fully procedural). Run: blender -b --python scripts/sword_texture.py
The ornament is floral; no letter-like shapes imitating a real inscription are used (docs/sword-workshop.md)."""
import math
from pathlib import Path
import bpy
import numpy as np

OUTPUT = Path(__file__).resolve().parents[1] / 'assets' / 'kilic' / 'textures'
OUTPUT.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(1453)


def save(name, array):
    """array: height x width x 3|4, 0-1. The first row is the top of the image."""
    h, w = array.shape[:2]
    if array.shape[2] == 3:
        array = np.dstack([array, np.ones((h, w))])
    im = bpy.data.images.new(name, w, h, alpha=True)
    im.pixels.foreach_set(np.clip(array[::-1], 0, 1).astype(np.float32).ravel())
    im.filepath_raw = str(OUTPUT / f'{name}.png')
    im.file_format = 'PNG'
    im.save()
    bpy.data.images.remove(im)
    print('texture', name, w, h)


def noise(h, w, scale=4, octaves=5, kx=1.0, ky=1.0):
    """Continuous (tiling) fractal noise, 0-1. kx/ky > 1 gives a denser pattern in that direction."""
    t = np.zeros((h, w)); amp = 1.0; total = 0.0
    for i in range(octaves):
        gx, gy = max(2, int(scale * kx * 2 ** i)), max(2, int(scale * ky * 2 ** i))
        g = rng.random((gy, gx))
        x = np.linspace(0, gx, w, endpoint=False); y = np.linspace(0, gy, h, endpoint=False)
        x0 = x.astype(int) % gx; y0 = y.astype(int) % gy
        fx = x - np.floor(x); fy = y - np.floor(y)
        fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy)
        a = g[np.ix_(y0, x0)]; b = g[np.ix_(y0, (x0 + 1) % gx)]
        c = g[np.ix_((y0 + 1) % gy, x0)]; d = g[np.ix_((y0 + 1) % gy, (x0 + 1) % gx)]
        fxx = fx[None, :]; fyy = fy[:, None]
        t += amp * ((a * (1 - fxx) + b * fxx) * (1 - fyy) + (c * (1 - fxx) + d * fxx) * fyy)
        total += amp; amp *= 0.5
    return t / total


def normal_map(height, strength=2.0):
    dy, dx = np.gradient(height)
    n = np.dstack([-dx * strength, dy * strength, np.ones_like(height)])
    n /= np.linalg.norm(n, axis=2, keepdims=True)
    return n * 0.5 + 0.5


def color_ramp(t, *stops):
    """t: 0-1 array; stops: (position, (r,g,b)) in order."""
    pos = [s[0] for s in stops]
    return np.dstack([np.interp(t, pos, [s[1][i] for s in stops]) for i in range(3)])


class Canvas:
    """Mask drawn with soft-edged brush stamps."""
    def __init__(self, h, w):
        self.m = np.zeros((h, w)); self.h = h; self.w = w; self.cache = {}

    def _kernel(self, r):
        k = round(r * 4) / 4
        if k not in self.cache:
            s = int(math.ceil(k)) + 2
            y, x = np.mgrid[-s:s + 1, -s:s + 1]
            self.cache[k] = np.clip(k + .5 - np.hypot(x, y), 0, 1)
        return self.cache[k]

    def stamp(self, x, y, r):
        kernel = self._kernel(max(r, .5)); s = kernel.shape[0] // 2
        xi, yi = int(round(x)), int(round(y))
        x0, x1 = max(xi - s, 0), min(xi + s + 1, self.w)
        y0, y1 = max(yi - s, 0), min(yi + s + 1, self.h)
        if x0 >= x1 or y0 >= y1:
            return
        p = kernel[y0 - yi + s:y1 - yi + s, x0 - xi + s:x1 - xi + s]
        self.m[y0:y1, x0:x1] = np.maximum(self.m[y0:y1, x0:x1], p)

    def path(self, points, r0, r1=None):
        r1 = r0 if r1 is None else r1
        for i in range(len(points) - 1):
            (ax, ay), (bx, by) = points[i], points[i + 1]
            n = max(1, int(math.hypot(bx - ax, by - ay) / .8))
            for k in range(n):
                t = (i + k / n) / (len(points) - 1)
                self.stamp(ax + (bx - ax) * k / n, ay + (by - ay) * k / n, r0 + (r1 - r0) * t)


def leaf(t, x, y, angle, length, r):
    """Rumi leaf: a curling drop that tapers to the tip."""
    n = 16; pts = []
    for i in range(n + 1):
        k = i / n; a = angle + k * 1.9
        pts.append((x + math.cos(a) * length * k, y + math.sin(a) * length * k))
    for i in range(n):
        k = i / (n - 1)
        t.path(pts[i:i + 2], r * (.5 + 2.2 * math.sin(math.pi * k ** .7)))


def spiral(t, x, y, angle, length, r, direction=1, turns=1.7):
    n = 46; pts = []
    for i in range(n + 1):
        k = i / n; a = angle + direction * k * math.tau * turns; d = length * (1 - k) ** 1.15
        pts.append((x + length * math.cos(angle + direction * math.pi / 2) + d * math.cos(a - direction * math.pi / 2),
                    y + length * math.sin(angle + direction * math.pi / 2) + d * math.sin(a - direction * math.pi / 2)))
    t.path(pts, r, r * .45)
    ux, uy = pts[-1]
    t.stamp(ux, uy, r * 1.5)


def curl(t, cx, cy, R, direction, a0, r, turns=1.6):
    """Curl with a fixed centre, winding from outside inwards; stays inside the band."""
    pts = []
    for k in np.linspace(0, 1, 44):
        a = a0 + direction * k * math.tau * turns; d = R * (1 - k) ** 1.1
        pts.append((cx + d * math.cos(a), cy + d * math.sin(a)))
    t.path(pts, r, r * .5)
    t.stamp(*pts[-1], r * 1.5)


def scroll_band(t, x0, x1, y, amplitude, step, r):
    """Horizontal rumi scroll: wavy stem, a curl and a leaf wound inside each wave."""
    pts = [(x, y + amplitude * math.sin((x - x0) / step * math.pi)) for x in np.arange(x0, x1, 2.0)]
    t.path(pts, r)
    x = x0 + step * .5; direction = 1
    while x < x1 - step * .5:
        # Wave crest is on the direction side; the curl starts from the stem and winds towards the band centre.
        R = amplitude * .56
        cy = y + direction * (amplitude - R * 1.02)
        curl(t, x, cy, R, direction, direction * math.pi / 2, r * .85)
        # Short leaf in the opposite direction from the wave's turning point
        lx = x + step * .5
        if lx < x1:
            leaf(t, lx, y, direction * 1.15 - 1.2, amplitude * .62, r * .55)
        x += step; direction = -direction


# -------------------------------------------------- Blade (x = hilt to tip, y = spine to edge)
H, W = 512, 4096
along = noise(H, W, 6, 5, kx=1.2, ky=7)
across = noise(H, W, 8, 5, kx=8, ky=1.5)
scratch = np.zeros((H, W))
for _ in range(900):  # very fine sharpening marks: roughness only, barely visible
    x = rng.integers(0, W); y0 = rng.integers(0, H); length = rng.integers(20, 120); e = rng.uniform(-.2, .2)
    for k in range(length):
        scratch[(y0 + k) % H, int(x + k * e) % W] = rng.uniform(.3, 1)
t = np.clip(.5 + (along - .5) * .55 + (across - .5) * .12, 0, 1)
save('blade_color', color_ramp(t, (0, (.60, .61, .63)), (1, (.74, .75, .77))))
rough = np.clip(.21 + (along - .5) * .10 + (across - .5) * .05 + scratch * .05, .12, .6)
save('blade_pm', np.dstack([np.ones_like(t), rough, np.ones_like(t)]))  # glTF: G roughness, B metallic
save('blade_normal', normal_map(along * .30 + across * .08, .5))

# Gold band: floral scroll only (no fake writing)
inlay = Canvas(H, W)
kx0, kx1 = int(W * .018), int(W * .88)
scroll_band(inlay, kx0, kx1, H * .262, H * .062, 46, 2.8)
scroll_band(inlay, kx0, kx1, H * .500, H * .086, 60, 3.4)
for y in (H * .175, H * .350, H * .405, H * .600):
    inlay.path([(x, y) for x in (kx0, kx1)], 2.6)
m = inlay.m
gold_noise = noise(H, W, 40, 3)
gold = color_ramp(gold_noise, (0, (.86, .62, .25)), (1, (1.0, .80, .40)))
save('blade_inlay', np.dstack([gold, m]))

# -------------------------------------------------- Guard: dark steel, gold inlay
S = 1024
g = noise(S, S, 12, 5)
scratch2 = noise(S, S, 90, 2)
inlay = Canvas(S, S); cx = cy = S / 2
for ax, ay, ln in ((1, 0, 430), (-1, 0, 430), (0, 1, 250), (0, -1, 250)):
    px, py = -ay, ax
    # Double border strip and curls along the arm
    for e in (-1, 1):
        inlay.path([(cx + ax * 70 + px * e * 62, cy + ay * 70 + py * e * 62),
                    (cx + ax * ln + px * e * 34, cy + ay * ln + py * e * 34)], 2.4)
    d = 95; direction = 1
    while d < ln - 40:
        width = 40 - 16 * d / ln
        spiral(inlay, cx + ax * d, cy + ay * d, math.atan2(ay, ax), width * .62, 2.6, direction=direction, turns=1.45)
        d += width * 1.75; direction = -direction
    inlay.path([(cx + ax * 80, cy + ay * 80), (cx + ax * (ln - 12), cy + ay * (ln - 12))], 2.2)
for a in np.arange(0, math.tau, math.tau / 8):  # central boss
    leaf(inlay, cx + math.cos(a) * 26, cy + math.sin(a) * 26, a - .9, 62, 2.2)
socket = [(cx + 74 * math.cos(a), cy + 74 * math.sin(a)) for a in np.linspace(0, math.tau, 80)]
inlay.path(socket, 2.4)
m = inlay.m[..., None]
steel = color_ramp(g, (0, (.16, .17, .19)), (1, (.30, .31, .34)))
gold = color_ramp(noise(S, S, 40, 3), (0, (.85, .62, .24)), (1, (1, .78, .36)))
save('guard_color', steel * (1 - m) + gold * m)
save('guard_pm', np.dstack([np.ones((S, S)), np.clip(.34 + (scratch2 - .5) * .16, 0, 1) * (1 - m[..., 0]) + .24 * m[..., 0], np.ones((S, S))]))
save('guard_normal', normal_map(inlay.m * 1.3 + g * .25, 1.6))

# -------------------------------------------------- Walrus ivory hilt (x = length)
H2, W2 = 512, 1024
vein = noise(H2, W2, 5, 5, kx=1.4, ky=6)
stain = noise(H2, W2, 3, 5)
c = Canvas(H2, W2)
for x0, y0, length in ((180, 40, 210), (505, 500, 280), (760, 20, 170), (880, 260, 230), (310, 300, 120)):
    x, y = float(x0), float(y0); pts = [(x, y)]; direction = 1 if y0 < H2 / 2 else -1
    for _ in range(length // 8):
        x += rng.uniform(-5, 5); y += direction * 8; pts.append((x, y))
    c.path(pts, 1.05, .4)
t = np.clip(.60 + (vein - .5) * .30 - (stain - .5) * .85, 0, 1)
color = color_ramp(t, (0, (.46, .34, .19)), (.45, (.76, .64, .43)), (1, (.90, .82, .64)))
color = color * (1 - c.m[..., None] * .62)
save('fildisi_color', color)
save('fildisi_pm', np.dstack([np.ones_like(t), np.clip(.46 + (stain - .5) * .26 + c.m * .3, 0, 1), np.zeros_like(t)]))
save('fildisi_normal', normal_map(vein * .22 + stain * .5 - c.m * .5, 1.0))

# -------------------------------------------------- Workshop
A = 1024
# Brick: mortar + row offset + soot
rows, cols = 14, 7
y = (np.arange(A)[:, None] / A * rows) % 1
row = (np.arange(A)[:, None] / A * rows).astype(int)
x = (np.arange(A)[None, :] / A * cols + (row % 2) * .5) % 1
mortar = np.clip(np.minimum(np.minimum(y, 1 - y) * 9, np.minimum(x, 1 - x) * 18), 0, 1)
single = rng.random((rows, cols + 1))[row[:, 0]][:, (np.arange(A) / A * cols).astype(int)]
g1 = noise(A, A, 7, 6)
t = np.clip(.28 + single * .30 + (g1 - .5) * .55, 0, 1)
color = color_ramp(t, (0, (.20, .09, .06)), (.5, (.40, .19, .12)), (1, (.55, .31, .21)))
soot = noise(A, A, 2, 4)[..., None]
color = color * mortar[..., None] + (1 - mortar[..., None]) * np.array([.13, .12, .11])
save('brick_color', color * (.74 + .34 * soot))
save('brick_pm', np.dstack([mortar * .4 + .6, np.clip(.86 + (g1 - .5) * .2, 0, 1), np.zeros((A, A))]))
save('brick_normal', normal_map(mortar * 3 + g1 * 1.5, 2.2))
# Stone paving: large flat slabs
n = 7
tx = (np.arange(A)[None, :] / A * n) % 1
ty = (np.arange(A)[:, None] / A * n + (np.arange(A)[None, :] / A * n).astype(int) * .37) % 1
joint = np.clip(np.minimum(np.minimum(tx, 1 - tx), np.minimum(ty, 1 - ty)) * 26, 0, 1)
g2 = noise(A, A, 8, 6)
color = color_ramp(g2, (0, (.11, .10, .09)), (1, (.36, .33, .30))) * (joint[..., None] * .85 + .15)
save('stone_color', color)
save('stone_pm', np.dstack([joint * .5 + .5, np.clip(.78 + (g2 - .5) * .4, 0, 1), np.zeros((A, A))]))
save('stone_normal', normal_map(joint * 3.2 + g2 * 1.8, 2.2))
# Wood
d1 = noise(A, A, 3, 6, kx=1, ky=12)
ring = (np.sin((np.arange(A)[:, None] / A * 60) + d1 * 22) * .5 + .5)
t = np.clip(d1 * .55 + ring * .45, 0, 1)
save('wood_color', color_ramp(t, (0, (.10, .055, .03)), (.5, (.27, .15, .08)), (1, (.46, .29, .16))))
save('wood_pm', np.dstack([np.ones((A, A)), np.clip(.68 + (d1 - .5) * .3, 0, 1), np.zeros((A, A))]))
save('wood_normal', normal_map(ring * 1.4 + d1 * 1.6, 1.8))
# Anvil iron: forged surface, rust and bright wear
g3 = noise(A, A, 16, 6); rust = np.clip((noise(A, A, 22, 5) - .62) * 5, 0, 1) * .55
color = color_ramp(g3, (0, (.10, .10, .105)), (1, (.27, .27, .28)))
color = color * (1 - rust[..., None]) + rust[..., None] * np.array([.20, .09, .04])
save('iron_color', color)
save('iron_pm', np.dstack([np.ones((A, A)), np.clip(.48 + rust * .4 + (g3 - .5) * .25, 0, 1), np.clip(.92 - rust * .9, 0, 1)]))
save('iron_normal', normal_map(g3 * 2.4 + rust * 1.2, 2.0))
# Leather (bellows)
g4 = noise(A, A, 40, 4)
save('leather_color', color_ramp(g4, (0, (.07, .04, .025)), (1, (.27, .16, .09))))
save('leather_pm', np.dstack([np.ones((A, A)), np.clip(.6 + (g4 - .5) * .3, 0, 1), np.zeros((A, A))]))
save('leather_normal', normal_map(g4 * 2.4, 2.2))
# Embers: the app drives the glow; this is the base and the heat map
g5 = noise(A, A, 14, 5); heat = np.clip((g5 - .44) * 4, 0, 1)
save('kor_color', color_ramp(g5, (0, (.012, .010, .010)), (1, (.07, .05, .045))))
save('kor_heat', color_ramp(heat, (0, (0, 0, 0)), (.45, (.9, .16, .02)), (.8, (1, .45, .06)), (1, (1, .85, .35))))
save('kor_normal', normal_map(g5 * 4, 2.4))
save('kor_pm', np.dstack([np.ones((A, A)), np.clip(.82 + (g5 - .5) * .3, 0, 1), np.zeros((A, A))]))
# Straw: test target
horiz = (np.sin(np.arange(A)[:, None] / A * math.tau * 70) * .5 + .5) * np.ones((A, A))
vert = noise(A, A, 6, 3, kx=30, ky=1)
t = np.clip(horiz * .55 + vert * .45, 0, 1)
save('straw_color', color_ramp(t, (0, (.30, .22, .09)), (1, (.72, .60, .32))))
save('straw_pm', np.dstack([np.ones((A, A)), np.full((A, A), .82), np.zeros((A, A))]))
save('straw_normal', normal_map(horiz * 2.2, 2.4))
# Sharpening stone: fine-grained sandstone, dark streaks showing the rotation
g7 = noise(A, A, 40, 5); d7 = noise(A, A, 3, 4, kx=1, ky=18)
t7 = np.clip(g7 * .55 + d7 * .45, 0, 1)
save('sharpen_color', color_ramp(t7, (0, (.20, .18, .155)), (.55, (.47, .44, .385)), (1, (.68, .64, .56))))
save('sharpen_pm', np.dstack([np.ones((A, A)), np.clip(.86 + (g7 - .5) * .16, 0, 1), np.zeros((A, A))]))
save('sharpen_normal', normal_map(g7 * 2.4 + d7 * 1.4, 2.0))
# Cloth: test target
thread = (np.sin(np.arange(A)[:, None] / A * math.tau * 110) * np.sin(np.arange(A)[None, :] / A * math.tau * 110)) * .5 + .5
g6 = noise(A, A, 3, 4)
save('cloth_color', color_ramp(np.clip(g6 * .8 + thread * .2, 0, 1), (0, (.26, .05, .06)), (1, (.55, .13, .12))))
save('cloth_pm', np.dstack([np.ones((A, A)), np.full((A, A), .92), np.zeros((A, A))]))
save('cloth_normal', normal_map(thread * .9, 1.0))
print('Textures done:', OUTPUT)
