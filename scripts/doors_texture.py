"""Ulu Camii kapılar bölgesinin dokuları: taç kapı atlası ve cephe taşı. Kaynak yalnız arşiv fotoğraflarıdır.
Kullanım: python3 scripts/kapilar_doku.py "<arşiv>/Links" public/gorseller/ulu-camii/maket"""
import sys
from PIL import Image, ImageChops, ImageFilter, ImageDraw, ImageStat
Image.MAX_IMAGE_PIXELS = None
L = sys.argv[1] + '/'
C = sys.argv[2] + '/'

from PIL import ImageEnhance
def ImageEnhanceBright(p, f):
    return ImageEnhance.Brightness(p).enhance(f)

def ac(ad):
    return Image.open(L + ad).convert('RGB')

def dortgen(im, q, w, h):
    """q: sol üst, sol alt, sağ alt, sağ üst (kaynak piksel)."""
    return im.transform((w, h), Image.QUAD, [c for p in q for c in p], Image.BICUBIC)

def duzle(im, r=60, guc=0.8):
    """Geniş ölçekli ışık farkını alır: dokudaki ışık sahnenin ışığıyla çakışmasın."""
    m = [round(v) for v in ImageStat.Stat(im).mean]
    b = im.filter(ImageFilter.GaussianBlur(r))
    cik = []
    for ca, cb, mv in zip(im.split(), b.split(), m):
        cb = Image.blend(Image.new('L', im.size, mv), cb, guc)
        cik.append(ImageChops.subtract(ca, cb, 1, mv))
    return Image.merge('RGB', cik)

def yamala(im, kutu, dy, yum=10):
    """Kutuyu aynı sütunda dy yukarıdaki parçayla örter; kenarlar yumuşak. Kutu güncel görüntü pikselinde."""
    x0, y0, x1, y1 = kutu
    p = im.crop((x0, y0 - dy, x1, y1 - dy))
    m = Image.new('L', (x1 - x0, y1 - y0), 0)
    ImageDraw.Draw(m).rectangle((yum, yum, x1 - x0 - yum, y1 - y0 - yum), fill=255)
    im.paste(p, (x0, y0), m.filter(ImageFilter.GaussianBlur(yum / 2)))

# --- Taç kapı: önden çekim. Koordinatlar 859 piksellik önizlemeye göredir. ---
f = ac('DJI_20241027172515_0203_D_ODAK.jpeg')
k = f.width / 859
CX = 430
PX0, PX1, PY0, PY1 = 25, 835, 165, 1410
# Sol tarafı örten ağacı kaldırmak için sağ yarı aynalanır (yapı bu aralıkta bakışıktır).
ay = f.crop((int((2 * CX - 208) * k), 0, int((2 * CX - 0) * k), f.height)).transpose(Image.FLIP_LEFT_RIGHT)
mask = Image.new('L', ay.size, 255)
ImageDraw.Draw(mask).rectangle((ay.width - 12, 0, ay.width, ay.height), fill=0)
f.paste(ay, (0, 0), mask.filter(ImageFilter.GaussianBlur(4)))
# Bilgi levhaları: aynı sütunun üst blokları ile örtülür.
def yk(x0, y0, x1, y1, dy):
    yamala(f, (int(x0 * k), int(y0 * k), int(x1 * k), int(y1 * k)), int(dy * k), yum=30)
yk(606, 1136, 658, 1286, 300)
yk(212, 1176, 262, 1244, 220)
AT = 2048
atlas = Image.new('RGB', (AT, AT), (150, 148, 145))
a = AT / (PY1 - PY0)
pw = int((PX1 - PX0) * a)
tac = f.crop((int(PX0 * k), int(PY0 * k), int(PX1 * k), int(PY1 * k))).resize((pw, AT), Image.LANCZOS)
atlas.paste(tac, (0, 0))
yer = {'tac': [0, 0, pw, AT]}

# --- Kuzey cephe, perspektifi düzeltilmiş görünüm: ölçü 1500 piksellik görünüme göredir (55 piksel/metre). ---
g = ac('DJI_20241208084026_0291_D_ODAK.jpeg')
s = g.width / 1800
VP = (-118, 658)
def cizgi(x, xr, yr):
    return VP[1] + (yr - VP[1]) * (x - VP[0]) / (xr - VP[0])
X0, X1, XM, Y0, Y1 = 640, 1330, 960, 280, 1340
def cephe(olcek):
    q = [(X0 * s, cizgi(X0, XM, Y0) * s), (X0 * s, cizgi(X0, XM, Y1) * s), (X1 * s, cizgi(X1, XM, Y1) * s), (X1 * s, cizgi(X1, XM, Y0) * s)]
    W, H = int(1500 * olcek), int(1200 * (Y1 - Y0) / 770 * olcek)
    return g.transform((W, H), Image.QUAD, [v for p in q for v in p], Image.BICUBIC)
R2 = cephe(2)
def rk(x0, y0, x1, y1, w, h):
    return R2.crop((x0 * 2, y0 * 2, x1 * 2, y1 * 2)).resize((w, h), Image.LANCZOS)
# Üst pencere: taş kafes
atlas.paste(rk(478, 335, 600, 665, 240, 400), (1340, 0)); yer['ust'] = [1340, 0, 240, 400]
# Saçak silmesi
atlas.paste(ImageEnhance.Color(rk(830, 46, 1430, 100, 300, 60)).enhance(0.45).point(lambda v: min(255, int(v * 1.42))), (1340, 1490)); yer['sacak'] = [1340, 1490, 300, 60]
# Mermer çerçeveli açıklık: sol yarı; minareye değmeden x=1355 ekseninden aynalanır, taban y=1350
atlas.paste(rk(1170, 795, 1355, 1350, 390, 1056), (1650, 790)); yer['kapi'] = [1650, 790, 390, 1056]

# --- Alt pencere: demir parmaklık, önden çekim. ---
h = ac('ERD04834 kopya.jpg')
s2 = h.width / 1500
alt = h.crop((int(1083 * s2), int(291 * s2), int(1132 * s2), int(372 * s2))).resize((240, 400), Image.LANCZOS)
atlas.paste(alt, (1590, 0)); yer['alt'] = [1590, 0, 240, 400]

# --- Şadırvan havuzu yüzü: mermer pano ve musluk. ---
hv = h.crop((int(528 * s2), int(575 * s2), int(905 * s2), int(790 * s2))).resize((400, 230), Image.LANCZOS)
atlas.paste(hv, (1340, 410)); yer['havuz'] = [1340, 410, 400, 230]

# --- Kaide: kaba taş ve silme, önden çekim (hafif eğik). ---
ka = dortgen(h, [(1012 * s2, 413 * s2), (1012 * s2, 493 * s2), (1262 * s2, 498 * s2), (1262 * s2, 414 * s2)], 700, 120)
atlas.paste(ka, (1340, 650)); yer['kaide'] = [1340, 650, 700, 120]

# --- Köşk kubbesi: orta dilim, kurşun levhalar. ---
d = ac('ERD04751 kopya.jpg')
s3 = d.width / 1043
# Merkezde iki dilim (16 dilimli kubbe, ±22.5 derece): her satırda kubbenin o yükseklikteki yarıçapına göre örneklenir.
R = [(362, 2), (390, 18), (420, 40), (450, 66), (480, 92), (510, 125), (540, 160), (580, 188), (620, 197), (662, 196)]
def yari(y):
    for (y0, r0), (y1, r1) in zip(R, R[1:]):
        if y0 <= y <= y1: return r0 + (r1 - r0) * (y - y0) / (y1 - y0)
    return R[-1][1]
ku = Image.new('RGB', (300, 700))
for i in range(700):
    y = 362 + 300 * (i + 0.5) / 700
    w = max(3, yari(y) * 0.3827)
    ku.paste(d.crop((int((435 - w) * s3), int(y * s3), int((435 + w) * s3), int(y * s3) + 1)).resize((300, 1), Image.BILINEAR), (0, i))
# Fotoğraf bulutlu havada: sahnenin güneşi altında soluk kalmasın diye koyulaştırılır, üst kısım daha çok.
for i in range(700):
    f = 0.56 + 0.2 * (i / 700)
    ku.paste(ku.crop((0, i, 300, i + 1)).point(lambda v, f=f: int(v * f)), (0, i))
atlas.paste(ku, (1340, 780)); yer['kubbe'] = [1340, 780, 300, 700]

# --- Boya örnekleri: ahşap, krem sıva ve su aynı atlastan çizilir (ek çizim çağrısı olmasın). ---
BOYA = ['#2f1c12', '#d9cdb0', '#d8cfb6', '#a79d84', '#27442f', '#55796f']
for i, renk in enumerate(BOYA):
    ImageDraw.Draw(atlas).rectangle((1760 + i * 44, 420, 1760 + i * 44 + 39, 459), fill=renk)
atlas.save(C + 'kapilar-atlas.jpg', quality=88, optimize=True)
atlas.resize((1024, 1024), Image.LANCZOS).save(C + 'kapilar-atlas-1024.jpg', quality=84, optimize=True)

# --- Cephe taşı: arşivin temiz duvar bölgelerinden kesilen taşlarla dizilir (128 piksel/metre, 8 x 8 m, dikişsiz). ---
import random
r = random.Random(1402)
OL = 128 / 55
Rt = cephe(OL)
BOLGE = [(705, 485, 945, 790), (1010, 470, 1390, 770), (715, 830, 930, 1190), (1005, 825, 1165, 1180), (840, 110, 1140, 225), (1170, 110, 1430, 225)]
BOLGE = [tuple(int(v * OL) for v in b) for b in BOLGE]
agirlik = [(b[2] - b[0]) * (b[3] - b[1]) for b in BOLGE]
N = 1024
t = Image.new('RGB', (N, N))
derz = Image.new('L', (N, N), 255)
dd = ImageDraw.Draw(derz)
# Sıra yükseklikleri: tam sığacak biçimde
sira = []
while sum(sira) < N - 90: sira.append(r.choice([40, 44, 48, 54, 60, 68]))
sira.append(N - sum(sira))
y = 0
for h in sira:
    x = r.randrange(N)
    bas = x
    while x < bas + N:
        w = min(r.randint(58, 170), bas + N - x)
        if bas + N - x - w < 40: w = bas + N - x
        b = r.choices(BOLGE, agirlik)[0]
        px = r.randint(b[0], b[2] - w - 1) if b[2] - b[0] > w + 1 else b[0]
        py = r.randint(b[1], b[3] - h - 1)
        p = Rt.crop((px, py, px + w, py + h))
        # Taşlar arası ton farkı azaltılır: fotoğrafta duvar bölgeler arasında sıçramaz.
        mp = ImageStat.Stat(p).mean
        tj = 0.97 + r.random() * 0.08
        p = Image.merge('RGB', [c.point(lambda v, f=(((192, 172, 146)[i] / mp[i]) ** 0.72) * tj: min(255, int(v * f))) for i, c in enumerate(p.split())])
        for ox in (x % N, x % N - N):
            t.paste(p, (ox, y))
            dd.rectangle((ox, y, ox + w - 1, y + 1), fill=165)
            dd.rectangle((ox, y, ox + 1, y + h - 1), fill=165)
        x += w
    y += h
derz = derz.filter(ImageFilter.GaussianBlur(0.8))
t = ImageChops.multiply(t, Image.merge('RGB', [derz, derz, derz]))
# Ton: fotoğraftaki soluk bej
hedef = (192, 172, 146)
m = ImageStat.Stat(t).mean
t = Image.merge('RGB', [c.point(lambda v, f=hedef[i] / m[i]: min(255, int(v * f))) for i, c in enumerate(t.split())])
t.save(C + 'cephe-tas.jpg', quality=85, optimize=True)
print(yer)
