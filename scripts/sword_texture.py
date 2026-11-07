"""Kılıç atölyesi dokuları (özgün, tamamen prosedürel). Çalıştır: blender -b --python scripts/kilic_doku.py
Süsleme bitkiseldir; gerçek kitabeyi taklit eden harf benzeri biçim kullanılmaz (docs/kilic-atolyesi.md)."""
import math
from pathlib import Path
import bpy
import numpy as np

CIKTI = Path(__file__).resolve().parents[1] / 'assets' / 'kilic' / 'doku'
CIKTI.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(1453)


def kaydet(ad, dizi):
    """dizi: yükseklik x genişlik x 3|4, 0-1. İlk satır görselin üstüdür."""
    h, w = dizi.shape[:2]
    if dizi.shape[2] == 3:
        dizi = np.dstack([dizi, np.ones((h, w))])
    im = bpy.data.images.new(ad, w, h, alpha=True)
    im.pixels.foreach_set(np.clip(dizi[::-1], 0, 1).astype(np.float32).ravel())
    im.filepath_raw = str(CIKTI / f'{ad}.png')
    im.file_format = 'PNG'
    im.save()
    bpy.data.images.remove(im)
    print('doku', ad, w, h)


def gurultu(h, w, olcek=4, oktav=5, kx=1.0, ky=1.0):
    """Sürekli (sarmal) fraktal gürültü, 0-1. kx/ky > 1 o yönde daha sık desen verir."""
    t = np.zeros((h, w)); guc = 1.0; top = 0.0
    for i in range(oktav):
        gx, gy = max(2, int(olcek * kx * 2 ** i)), max(2, int(olcek * ky * 2 ** i))
        g = rng.random((gy, gx))
        x = np.linspace(0, gx, w, endpoint=False); y = np.linspace(0, gy, h, endpoint=False)
        x0 = x.astype(int) % gx; y0 = y.astype(int) % gy
        fx = x - np.floor(x); fy = y - np.floor(y)
        fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy)
        a = g[np.ix_(y0, x0)]; b = g[np.ix_(y0, (x0 + 1) % gx)]
        c = g[np.ix_((y0 + 1) % gy, x0)]; d = g[np.ix_((y0 + 1) % gy, (x0 + 1) % gx)]
        fxx = fx[None, :]; fyy = fy[:, None]
        t += guc * ((a * (1 - fxx) + b * fxx) * (1 - fyy) + (c * (1 - fxx) + d * fxx) * fyy)
        top += guc; guc *= 0.5
    return t / top


def normal_haritasi(yuk, guc=2.0):
    dy, dx = np.gradient(yuk)
    n = np.dstack([-dx * guc, dy * guc, np.ones_like(yuk)])
    n /= np.linalg.norm(n, axis=2, keepdims=True)
    return n * 0.5 + 0.5


def renk_karisim(t, *duraklar):
    """t: 0-1 dizi; duraklar: (konum, (r,g,b)) sıralı."""
    konum = [d[0] for d in duraklar]
    return np.dstack([np.interp(t, konum, [d[1][i] for d in duraklar]) for i in range(3)])


class Tuval:
    """Yumuşak kenarlı fırça damgalarıyla çizilen maske."""
    def __init__(self, h, w):
        self.m = np.zeros((h, w)); self.h = h; self.w = w; self.cek = {}

    def _kalip(self, r):
        k = round(r * 4) / 4
        if k not in self.cek:
            s = int(math.ceil(k)) + 2
            y, x = np.mgrid[-s:s + 1, -s:s + 1]
            self.cek[k] = np.clip(k + .5 - np.hypot(x, y), 0, 1)
        return self.cek[k]

    def damga(self, x, y, r):
        kalip = self._kalip(max(r, .5)); s = kalip.shape[0] // 2
        xi, yi = int(round(x)), int(round(y))
        x0, x1 = max(xi - s, 0), min(xi + s + 1, self.w)
        y0, y1 = max(yi - s, 0), min(yi + s + 1, self.h)
        if x0 >= x1 or y0 >= y1:
            return
        p = kalip[y0 - yi + s:y1 - yi + s, x0 - xi + s:x1 - xi + s]
        self.m[y0:y1, x0:x1] = np.maximum(self.m[y0:y1, x0:x1], p)

    def yol(self, noktalar, r0, r1=None):
        r1 = r0 if r1 is None else r1
        for i in range(len(noktalar) - 1):
            (ax, ay), (bx, by) = noktalar[i], noktalar[i + 1]
            n = max(1, int(math.hypot(bx - ax, by - ay) / .8))
            for k in range(n):
                t = (i + k / n) / (len(noktalar) - 1)
                self.damga(ax + (bx - ax) * k / n, ay + (by - ay) * k / n, r0 + (r1 - r0) * t)


def yaprak(t, x, y, aci, boy, r):
    """Rumi yaprağı: kıvrılan, ucu incelen damla."""
    n = 16; yolu = []
    for i in range(n + 1):
        k = i / n; a = aci + k * 1.9
        yolu.append((x + math.cos(a) * boy * k, y + math.sin(a) * boy * k))
    for i in range(n):
        k = i / (n - 1)
        t.yol(yolu[i:i + 2], r * (.5 + 2.2 * math.sin(math.pi * k ** .7)))


def sarmal(t, x, y, aci, boy, r, yon=1, tur=1.7):
    n = 46; yolu = []
    for i in range(n + 1):
        k = i / n; a = aci + yon * k * math.tau * tur; d = boy * (1 - k) ** 1.15
        yolu.append((x + boy * math.cos(aci + yon * math.pi / 2) + d * math.cos(a - yon * math.pi / 2),
                     y + boy * math.sin(aci + yon * math.pi / 2) + d * math.sin(a - yon * math.pi / 2)))
    t.yol(yolu, r, r * .45)
    ux, uy = yolu[-1]
    t.damga(ux, uy, r * 1.5)


def kivrim(t, cx, cy, R, yon, a0, r, tur=1.6):
    """Merkezi belli, dıştan içe sarılan kıvrım; banttan taşmaz."""
    yolu = []
    for k in np.linspace(0, 1, 44):
        a = a0 + yon * k * math.tau * tur; d = R * (1 - k) ** 1.1
        yolu.append((cx + d * math.cos(a), cy + d * math.sin(a)))
    t.yol(yolu, r, r * .5)
    t.damga(*yolu[-1], r * 1.5)


def sarmasik_bandi(t, x0, x1, y, genlik, adim, r):
    """Yatay rumi sarmaşık: dalgalı gövde, her dalganın içine sarılan kıvrım ve yaprak."""
    yolu = [(x, y + genlik * math.sin((x - x0) / adim * math.pi)) for x in np.arange(x0, x1, 2.0)]
    t.yol(yolu, r)
    x = x0 + adim * .5; yon = 1
    while x < x1 - adim * .5:
        # Dalga tepesi yon tarafında; kıvrım gövdeden başlar, bant ortasına doğru sarılır.
        R = genlik * .56
        cy = y + yon * (genlik - R * 1.02)
        kivrim(t, x, cy, R, yon, yon * math.pi / 2, r * .85)
        # Dalganın dönüş noktasından karşı yöne kısa yaprak
        lx = x + adim * .5
        if lx < x1:
            yaprak(t, lx, y, yon * 1.15 - 1.2, genlik * .62, r * .55)
        x += adim; yon = -yon


# -------------------------------------------------- Namlu (x = kabzadan uca, y = sırttan ağza)
H, W = 512, 4096
uzun = gurultu(H, W, 6, 5, kx=1.2, ky=7)
capraz = gurultu(H, W, 8, 5, kx=8, ky=1.5)
cizik = np.zeros((H, W))
for _ in range(900):  # çok ince bileme izleri: yalnız pürüzde, gözle zor seçilir
    x = rng.integers(0, W); y0 = rng.integers(0, H); boy = rng.integers(20, 120); e = rng.uniform(-.2, .2)
    for k in range(boy):
        cizik[(y0 + k) % H, int(x + k * e) % W] = rng.uniform(.3, 1)
t = np.clip(.5 + (uzun - .5) * .55 + (capraz - .5) * .12, 0, 1)
kaydet('namlu_renk', renk_karisim(t, (0, (.60, .61, .63)), (1, (.74, .75, .77))))
sert = np.clip(.21 + (uzun - .5) * .10 + (capraz - .5) * .05 + cizik * .05, .12, .6)
kaydet('namlu_pm', np.dstack([np.ones_like(t), sert, np.ones_like(t)]))  # glTF: G pürüz, B metal
kaydet('namlu_normal', normal_haritasi(uzun * .30 + capraz * .08, .5))

# Altın bant: yalnızca bitkisel sarmaşık (sahte yazı yok)
kak = Tuval(H, W)
kx0, kx1 = int(W * .018), int(W * .88)
sarmasik_bandi(kak, kx0, kx1, H * .262, H * .062, 46, 2.8)
sarmasik_bandi(kak, kx0, kx1, H * .500, H * .086, 60, 3.4)
for y in (H * .175, H * .350, H * .405, H * .600):
    kak.yol([(x, y) for x in (kx0, kx1)], 2.6)
m = kak.m
altin_doku = gurultu(H, W, 40, 3)
altin = renk_karisim(altin_doku, (0, (.86, .62, .25)), (1, (1.0, .80, .40)))
kaydet('namlu_kakma', np.dstack([altin, m]))

# -------------------------------------------------- Balçak: koyu çelik, altın kakma
S = 1024
g = gurultu(S, S, 12, 5)
cizik2 = gurultu(S, S, 90, 2)
kak = Tuval(S, S); cx = cy = S / 2
for ax, ay, uz in ((1, 0, 430), (-1, 0, 430), (0, 1, 250), (0, -1, 250)):
    px, py = -ay, ax
    # Çift kenar şeridi ve kol boyunca kıvrımlar
    for e in (-1, 1):
        kak.yol([(cx + ax * 70 + px * e * 62, cy + ay * 70 + py * e * 62),
                 (cx + ax * uz + px * e * 34, cy + ay * uz + py * e * 34)], 2.4)
    d = 95; yon = 1
    while d < uz - 40:
        gen = 40 - 16 * d / uz
        sarmal(kak, cx + ax * d, cy + ay * d, math.atan2(ay, ax), gen * .62, 2.6, yon=yon, tur=1.45)
        d += gen * 1.75; yon = -yon
    kak.yol([(cx + ax * 80, cy + ay * 80), (cx + ax * (uz - 12), cy + ay * (uz - 12))], 2.2)
for a in np.arange(0, math.tau, math.tau / 8):  # merkez göbek
    yaprak(kak, cx + math.cos(a) * 26, cy + math.sin(a) * 26, a - .9, 62, 2.2)
yuva = [(cx + 74 * math.cos(a), cy + 74 * math.sin(a)) for a in np.linspace(0, math.tau, 80)]
kak.yol(yuva, 2.4)
m = kak.m[..., None]
celik = renk_karisim(g, (0, (.16, .17, .19)), (1, (.30, .31, .34)))
altin = renk_karisim(gurultu(S, S, 40, 3), (0, (.85, .62, .24)), (1, (1, .78, .36)))
kaydet('balcak_renk', celik * (1 - m) + altin * m)
kaydet('balcak_pm', np.dstack([np.ones((S, S)), np.clip(.34 + (cizik2 - .5) * .16, 0, 1) * (1 - m[..., 0]) + .24 * m[..., 0], np.ones((S, S))]))
kaydet('balcak_normal', normal_haritasi(kak.m * 1.3 + g * .25, 1.6))

# -------------------------------------------------- Mors dişi kabza (x = boy)
H2, W2 = 512, 1024
damar = gurultu(H2, W2, 5, 5, kx=1.4, ky=6)
leke = gurultu(H2, W2, 3, 5)
c = Tuval(H2, W2)
for x0, y0, boy in ((180, 40, 210), (505, 500, 280), (760, 20, 170), (880, 260, 230), (310, 300, 120)):
    x, y = float(x0), float(y0); yolu = [(x, y)]; yon = 1 if y0 < H2 / 2 else -1
    for _ in range(boy // 8):
        x += rng.uniform(-5, 5); y += yon * 8; yolu.append((x, y))
    c.yol(yolu, 1.05, .4)
t = np.clip(.60 + (damar - .5) * .30 - (leke - .5) * .85, 0, 1)
renk = renk_karisim(t, (0, (.46, .34, .19)), (.45, (.76, .64, .43)), (1, (.90, .82, .64)))
renk = renk * (1 - c.m[..., None] * .62)
kaydet('fildisi_renk', renk)
kaydet('fildisi_pm', np.dstack([np.ones_like(t), np.clip(.46 + (leke - .5) * .26 + c.m * .3, 0, 1), np.zeros_like(t)]))
kaydet('fildisi_normal', normal_haritasi(damar * .22 + leke * .5 - c.m * .5, 1.0))

# -------------------------------------------------- Atölye
A = 1024
# Tuğla: harç + sıra kaydırma + is
sira, sut = 14, 7
y = (np.arange(A)[:, None] / A * sira) % 1
satir = (np.arange(A)[:, None] / A * sira).astype(int)
x = (np.arange(A)[None, :] / A * sut + (satir % 2) * .5) % 1
harc = np.clip(np.minimum(np.minimum(y, 1 - y) * 9, np.minimum(x, 1 - x) * 18), 0, 1)
tek = rng.random((sira, sut + 1))[satir[:, 0]][:, (np.arange(A) / A * sut).astype(int)]
g1 = gurultu(A, A, 7, 6)
t = np.clip(.28 + tek * .30 + (g1 - .5) * .55, 0, 1)
renk = renk_karisim(t, (0, (.20, .09, .06)), (.5, (.40, .19, .12)), (1, (.55, .31, .21)))
is_ = gurultu(A, A, 2, 4)[..., None]
renk = renk * harc[..., None] + (1 - harc[..., None]) * np.array([.13, .12, .11])
kaydet('tugla_renk', renk * (.74 + .34 * is_))
kaydet('tugla_pm', np.dstack([harc * .4 + .6, np.clip(.86 + (g1 - .5) * .2, 0, 1), np.zeros((A, A))]))
kaydet('tugla_normal', normal_haritasi(harc * 3 + g1 * 1.5, 2.2))
# Taş döşeme: büyük yassı taşlar
n = 7
tx = (np.arange(A)[None, :] / A * n) % 1
ty = (np.arange(A)[:, None] / A * n + (np.arange(A)[None, :] / A * n).astype(int) * .37) % 1
derz = np.clip(np.minimum(np.minimum(tx, 1 - tx), np.minimum(ty, 1 - ty)) * 26, 0, 1)
g2 = gurultu(A, A, 8, 6)
renk = renk_karisim(g2, (0, (.11, .10, .09)), (1, (.36, .33, .30))) * (derz[..., None] * .85 + .15)
kaydet('tas_renk', renk)
kaydet('tas_pm', np.dstack([derz * .5 + .5, np.clip(.78 + (g2 - .5) * .4, 0, 1), np.zeros((A, A))]))
kaydet('tas_normal', normal_haritasi(derz * 3.2 + g2 * 1.8, 2.2))
# Ahşap
d1 = gurultu(A, A, 3, 6, kx=1, ky=12)
halka = (np.sin((np.arange(A)[:, None] / A * 60) + d1 * 22) * .5 + .5)
t = np.clip(d1 * .55 + halka * .45, 0, 1)
kaydet('ahsap_renk', renk_karisim(t, (0, (.10, .055, .03)), (.5, (.27, .15, .08)), (1, (.46, .29, .16))))
kaydet('ahsap_pm', np.dstack([np.ones((A, A)), np.clip(.68 + (d1 - .5) * .3, 0, 1), np.zeros((A, A))]))
kaydet('ahsap_normal', normal_haritasi(halka * 1.4 + d1 * 1.6, 1.8))
# Örs demiri: dövme yüzeyi, pas ve parlak aşınma
g3 = gurultu(A, A, 16, 6); pas = np.clip((gurultu(A, A, 22, 5) - .62) * 5, 0, 1) * .55
renk = renk_karisim(g3, (0, (.10, .10, .105)), (1, (.27, .27, .28)))
renk = renk * (1 - pas[..., None]) + pas[..., None] * np.array([.20, .09, .04])
kaydet('demir_renk', renk)
kaydet('demir_pm', np.dstack([np.ones((A, A)), np.clip(.48 + pas * .4 + (g3 - .5) * .25, 0, 1), np.clip(.92 - pas * .9, 0, 1)]))
kaydet('demir_normal', normal_haritasi(g3 * 2.4 + pas * 1.2, 2.0))
# Deri (körük)
g4 = gurultu(A, A, 40, 4)
kaydet('deri_renk', renk_karisim(g4, (0, (.07, .04, .025)), (1, (.27, .16, .09))))
kaydet('deri_pm', np.dstack([np.ones((A, A)), np.clip(.6 + (g4 - .5) * .3, 0, 1), np.zeros((A, A))]))
kaydet('deri_normal', normal_haritasi(g4 * 2.4, 2.2))
# Kor: ışımayı uygulama uyarır; burası taban ve ısıma haritası
g5 = gurultu(A, A, 14, 5); isi = np.clip((g5 - .44) * 4, 0, 1)
kaydet('kor_renk', renk_karisim(g5, (0, (.012, .010, .010)), (1, (.07, .05, .045))))
kaydet('kor_isi', renk_karisim(isi, (0, (0, 0, 0)), (.45, (.9, .16, .02)), (.8, (1, .45, .06)), (1, (1, .85, .35))))
kaydet('kor_normal', normal_haritasi(g5 * 4, 2.4))
kaydet('kor_pm', np.dstack([np.ones((A, A)), np.clip(.82 + (g5 - .5) * .3, 0, 1), np.zeros((A, A))]))
# Hasır: test hedefi
yat = (np.sin(np.arange(A)[:, None] / A * math.tau * 70) * .5 + .5) * np.ones((A, A))
dik = gurultu(A, A, 6, 3, kx=30, ky=1)
t = np.clip(yat * .55 + dik * .45, 0, 1)
kaydet('hasir_renk', renk_karisim(t, (0, (.30, .22, .09)), (1, (.72, .60, .32))))
kaydet('hasir_pm', np.dstack([np.ones((A, A)), np.full((A, A), .82), np.zeros((A, A))]))
kaydet('hasir_normal', normal_haritasi(yat * 2.2, 2.4))
# Bileği taşı: ince taneli kumtaşı, dönüşü gösteren koyu damarlar
g7 = gurultu(A, A, 40, 5); d7 = gurultu(A, A, 3, 4, kx=1, ky=18)
t7 = np.clip(g7 * .55 + d7 * .45, 0, 1)
kaydet('bileme_renk', renk_karisim(t7, (0, (.20, .18, .155)), (.55, (.47, .44, .385)), (1, (.68, .64, .56))))
kaydet('bileme_pm', np.dstack([np.ones((A, A)), np.clip(.86 + (g7 - .5) * .16, 0, 1), np.zeros((A, A))]))
kaydet('bileme_normal', normal_haritasi(g7 * 2.4 + d7 * 1.4, 2.0))
# Kumaş: test hedefi
ip = (np.sin(np.arange(A)[:, None] / A * math.tau * 110) * np.sin(np.arange(A)[None, :] / A * math.tau * 110)) * .5 + .5
g6 = gurultu(A, A, 3, 4)
kaydet('kumas_renk', renk_karisim(np.clip(g6 * .8 + ip * .2, 0, 1), (0, (.26, .05, .06)), (1, (.55, .13, .12))))
kaydet('kumas_pm', np.dstack([np.ones((A, A)), np.full((A, A), .92), np.zeros((A, A))]))
kaydet('kumas_normal', normal_haritasi(ip * .9, 1.0))
print('Dokular tamam:', CIKTI)
