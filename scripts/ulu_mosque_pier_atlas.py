"""Ulu Camii maketinin paye ve levha atlaslarını arşiv fotoğraflarından üretir.

Yazı taklit edilmez, aynalanmaz: her pano arşivdeki düz çekim fotoğrafın kendisidir. Fotoğrafın aydınlatması
ve zemin rengi çıkarılır, yazı sıva rengiyle çarpılır; böylece pano payenin üstüne yapıştırılmış kart gibi değil,
sıvaya boyanmış gibi durur. Tepelik ve kemer bandı da arşiv fotoğraflarından alınır.

Gereken: Pillow. Çalıştırma: python3 scripts/ulucami_paye_atlas.py <arşiv Links klasörü> [çıktı klasörü]
Çıktı: paye-atlas.jpg, levha-atlas.jpg (2048 px) ve hafif cihaz için -k sürümleri (1024 px).
Yerleşim src/components/maket/ulucami/payeler.ts dosyasındaki sabitlerle aynı kalmalıdır.
"""
import os
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

Image.MAX_IMAGE_PIXELS = None
LINKS = Path(sys.argv[1])
KOK = Path(__file__).resolve().parent.parent
CIKTI = Path(sys.argv[2]) if len(sys.argv) > 2 else KOK / 'public/gorseller/ulu-camii/maket'

ATLAS = 2048
HUCRE_G, HUCRE_Y = 512, 1000
SIVA = (241, 232, 214)

# Sekiz pano (arşiv kodu, kırpma payı). Hangi yüzde durdukları temsilîdir.
PANOLAR = ['0022', '0061', '0063', '0075', '0108', '0093', '0106', '0190']
# Tepelik: (arşiv kodu, kutu 0-1)
TEPELIKLER = [('ERD05161', (0.762, 0.150, 0.996, 0.281))]
# Levhalar: (arşiv kodu, atlastaki sol, üst, sağ, alt)
LEVHALAR = [
    ('0011', (0, 150, 1400, 790)),
    ('0081', (0, 800, 1400, 1250)),
    ('0183', (0, 1260, 1400, 1760)),
    ('0124', (1410, 150, 2048, 620)),
    ('0087', (1410, 630, 2048, 1200)),
]
# Kemer bandının orta çizgisi: 0288 fotoğrafında (5139x3706) kemerin sağ yarısı boyunca noktalar.
BANT_KAYNAK = '0288'
BANT_YOL = [(2470, 300), (2720, 350), (2960, 450), (3170, 590), (3350, 770), (3490, 990), (3590, 1240), (3650, 1500)]
BANT_ISARET = 1
BANT_KAYMA = 32   # orta çizginin bandın ortasına oturması için kemer dışına doğru kayma
BANT_YARI = 36


def bul(kod):
    return LINKS / next(f for f in sorted(os.listdir(LINKS)) if kod in f and f.lower().endswith(('.jpg', '.jpeg')))


def ac(kod):
    return Image.open(bul(kod)).convert('RGB')


def zemin_duzle(im, yaricap=6, kucuk=96, esik=0.9):
    """Aydınlatmayı ve kâğıt rengini çıkarır: zemin 255'e gider, mürekkep kalır."""
    k = im.copy()
    k.thumbnail((kucuk, kucuk), Image.Resampling.BOX)
    arka = k.filter(ImageFilter.MaxFilter(yaricap * 2 + 1)).filter(ImageFilter.GaussianBlur(yaricap))
    arka = arka.resize(im.size, Image.Resampling.BICUBIC)
    a, b = im.tobytes(), arka.tobytes()
    tablo = bytearray(len(a))
    for i in range(len(a)):
        v = a[i] / max(b[i], 1) / esik
        tablo[i] = 255 if v >= 1 else int(v * 255)
    return Image.frombytes('RGB', im.size, bytes(tablo))


def kenar_soldur(im, pay):
    """Kırpımın kenarını beyaza yaklaştırır: çarpınca kesik çizgisi kalmaz."""
    w, h = im.size
    maske = Image.new('L', (w, h), 0)
    ImageDraw.Draw(maske).rectangle((pay, pay, w - pay, h - pay), fill=255)
    maske = maske.filter(ImageFilter.GaussianBlur(pay / 2))
    return Image.composite(im, Image.new('RGB', (w, h), (255, 255, 255)), maske)


def tepelik_uret():
    sonuc = []
    for kod, (x0, y0, x1, y1) in TEPELIKLER:
        im = ac(kod)
        k = im.crop((int(x0 * im.width), int(y0 * im.height), int(x1 * im.width), int(y1 * im.height)))
        sonuc.append(Image.blend(kenar_soldur(zemin_duzle(k, 12, 128, 0.94), 6), kenar_soldur(zemin_duzle(k, 12, 128, 0.94), 6).convert('L').convert('RGB'), 0.45))
    return sonuc


def pano_uret(kod, tepelik):
    """Hücre: üstte tepelik (rafıyla), altında çerçeveli yazı alanı. Payedeki ölçek: 512 px = 2.33 m."""
    hucre = Image.new('RGB', (HUCRE_G, HUCRE_Y), SIVA)
    TEPE_H = 300
    # Yazı alanı: arşiv panosunun kendi ince çerçevesi durur; altta koyu çizgi (ERD05027)
    d = ImageDraw.Draw(hucre)
    im = ac(kod)
    pay = int(min(im.size) * 0.012)
    im = im.crop((pay, pay, im.width - pay, im.height - pay))
    alan_g, alan_h = HUCRE_G - 8, HUCRE_Y - TEPE_H - 12
    o = min(alan_g / im.width, alan_h / im.height)
    k = im.resize((int(im.width * o), int(im.height * o)), Image.Resampling.LANCZOS)
    k = kenar_soldur(zemin_duzle(k), 3)
    x, y = (HUCRE_G - k.width) // 2, TEPE_H + (HUCRE_Y - TEPE_H - 6 - k.height) // 2
    parca = hucre.crop((x, y, x + k.width, y + k.height))
    hucre.paste(ImageChops.multiply(parca, k), (x, y))
    d.rectangle((0, HUCRE_Y - 6, HUCRE_G, HUCRE_Y), fill=(46, 40, 34))
    ox = int(tepelik.width * TEPE_H / tepelik.height)
    t = tepelik.resize((ox, TEPE_H), Image.Resampling.LANCZOS)
    if ox > HUCRE_G:
        t = t.crop(((ox - HUCRE_G) // 2, 0, (ox + HUCRE_G) // 2, TEPE_H))
    tx, ty = (HUCRE_G - t.width) // 2, TEPE_H - t.height
    parca = hucre.crop((tx, ty, tx + t.width, ty + t.height))
    hucre.paste(ImageChops.multiply(parca, t), (tx, ty))
    return hucre


def bant_ac(kaynak, yol, yari, boy_y):
    """Yol boyunca şeridi düzleştirir (dörtgen ağ ile)."""
    uz = [0.0]
    for (a, b), (c, e) in zip(yol, yol[1:]):
        uz.append(uz[-1] + ((c - a) ** 2 + (e - b) ** 2) ** 0.5)
    dx_olcek = boy_y / (2 * yari)
    W = int(uz[-1] * dx_olcek)

    def nokta(s):
        for i in range(len(yol) - 1):
            if s <= uz[i + 1] or i == len(yol) - 2:
                t = (s - uz[i]) / (uz[i + 1] - uz[i])
                x = yol[i][0] + (yol[i + 1][0] - yol[i][0]) * t
                y = yol[i][1] + (yol[i + 1][1] - yol[i][1]) * t
                nx, ny = -(yol[i + 1][1] - yol[i][1]), yol[i + 1][0] - yol[i][0]
                L = (nx * nx + ny * ny) ** 0.5
                return x, y, nx / L, ny / L

    ag = []
    ADIM = 16
    for u in range(0, W, ADIM):
        s0, s1 = u / dx_olcek, min(u + ADIM, W) / dx_olcek
        a, b = nokta(s0), nokta(s1)
        # Dörtgen köşeleri: sol üst, sol alt, sağ alt, sağ üst; üst = kemerin dışı
        q = (a[0] + a[2] * yari, a[1] + a[3] * yari, a[0] - a[2] * yari, a[1] - a[3] * yari,
             b[0] - b[2] * yari, b[1] - b[3] * yari, b[0] + b[2] * yari, b[1] + b[3] * yari)
        ag.append(((u, 0, min(u + ADIM, W), boy_y), q))
    return kaynak.transform((W, boy_y), Image.Transform.MESH, ag, Image.Resampling.BICUBIC)


def bant_uret():
    im = ac(BANT_KAYNAK)
    BANT_H = 128
    # Yol: köşeleri yumuşat (Chaikin), sonra banda kaydır
    yol = list(BANT_YOL)
    for _ in range(3):
        yeni = [yol[0]]
        for (a, b), (c, e) in zip(yol, yol[1:]):
            yeni += [(a * 0.75 + c * 0.25, b * 0.75 + e * 0.25), (a * 0.25 + c * 0.75, b * 0.25 + e * 0.75)]
        yol = yeni + [yol[-1]]
    kayik = []
    for n, (a, b) in enumerate(yol):
        c, e = yol[min(n + 1, len(yol) - 1)]
        p, r = yol[max(n - 1, 0)]
        nx, ny = -(e - r), c - p
        L = (nx * nx + ny * ny) ** 0.5 or 1
        kayik.append((a - nx / L * BANT_KAYMA * BANT_ISARET, b - ny / L * BANT_KAYMA * BANT_ISARET))
    kirp = 180  # fotoğraftaki avize telini dışarıda bırak
    s = bant_ac(im, kayik, BANT_YARI, BANT_H)
    s = s.crop((kirp, 0, s.width - 40, BANT_H))
    if os.environ.get('BANT_ONIZLE'):
        s.save(os.environ['BANT_ONIZLE'])
    # Yalnız parlaklık alınır: gece ışığının renk kayması atılır, boya ERD05161'deki zeytin krem zemin ve koyu kahve dala eşlenir.
    s = s.convert('L')
    k = s.resize((max(1, s.width // 48), 1), Image.Resampling.BOX).filter(ImageFilter.GaussianBlur(1)).resize(s.size, Image.Resampling.BICUBIC)
    a, b = s.tobytes(), k.tobytes()
    ort = sum(b) / len(b)
    s = Image.frombytes('L', s.size, bytes(min(255, int(x / max(y, 1) * ort)) for x, y in zip(a, b)))
    bind = 96
    tek = s.resize((ATLAS + bind, BANT_H), Image.Resampling.LANCZOS)
    gri = tek.crop((0, 0, ATLAS, BANT_H))
    for x in range(bind):
        sol = tek.crop((ATLAS + x, 0, ATLAS + x + 1, BANT_H))
        sag = tek.crop((x, 0, x + 1, BANT_H))
        gri.paste(Image.blend(sol, sag, x / bind), (x, 0))
    # Renk eşlemesi: en koyu kahve, orta sıcak kahve, zemin krem
    durak = [(0, (30, 24, 17)), (90, (74, 56, 36)), (170, (176, 158, 118)), (255, (226, 214, 180))]
    tablo = []
    for kanal in range(3):
        for v in range(256):
            for (a0, r0), (a1, r1) in zip(durak, durak[1:]):
                if v <= a1:
                    tablo.append(int(r0[kanal] + (r1[kanal] - r0[kanal]) * (v - a0) / (a1 - a0)))
                    break
    cikti = Image.merge('RGB', (gri, gri, gri)).point(tablo)
    # Bandın iki kenarında ince koyu çizgi (0288, ERD05161)
    d = ImageDraw.Draw(cikti)
    d.rectangle((0, 0, ATLAS, 4), fill=(66, 52, 34))
    d.rectangle((0, BANT_H - 5, ATLAS, BANT_H - 1), fill=(66, 52, 34))
    return cikti


def paye_atlasi():
    tepelikler = tepelik_uret()
    atlas = Image.new('RGB', (ATLAS, ATLAS), SIVA)
    for n, kod in enumerate(PANOLAR):
        hucre = pano_uret(kod, tepelikler[n % len(tepelikler)])
        atlas.paste(hucre, ((n % 4) * HUCRE_G, (n // 4) * HUCRE_Y))
        print('pano', kod)
    # Alt şerit: düz boya örnekleri (sıva, koyu, altın): dosya başındaki sabitlerle u = 1/8, 3/8, 5/8
    d = ImageDraw.Draw(atlas)
    y0 = 2 * HUCRE_Y
    d.rectangle((0, y0, ATLAS // 4, ATLAS), fill=SIVA)
    d.rectangle((ATLAS // 4, y0, ATLAS // 2, ATLAS), fill=(44, 40, 36))
    d.rectangle((ATLAS // 2, y0, 3 * ATLAS // 4, ATLAS), fill=(138, 108, 56))
    return atlas


def levha_atlasi():
    atlas = Image.new('RGB', (ATLAS, ATLAS), (40, 34, 26))
    bant = bant_uret()
    atlas.paste(bant, (0, 0))
    # Kemer altı çerçeve şeridi: açık, koyu, kahve, krem (ERD05161 ve 0334): 128-168 arası, boyuna tekrarlı.
    # Üstünde ve altında sıva payı: küçük mip düzeylerinde çizgi kararmasın.
    d = ImageDraw.Draw(atlas)
    for y0, y1, r in [(128, 136, (150, 138, 118)), (136, 154, (44, 38, 32)), (154, 162, (128, 98, 60)), (162, 176, (232, 222, 200))]:
        d.rectangle((0, y0, ATLAS, y1 - 1), fill=r)
    for kod, (x0, y0, x1, y1) in LEVHALAR:
        im = ac(kod)
        pay = int(min(im.size) * 0.02) if kod == '0081' else 0  # fotoğraftaki açık kenar
        im = im.crop((pay, pay, im.width - pay, im.height - pay))
        g, h = x1 - x0, y1 - y0
        o = min(g / im.width, h / im.height)
        k = im.resize((int(im.width * o), int(im.height * o)), Image.Resampling.LANCZOS)
        px0, py0 = x0 + (g - k.width) // 2, y0 + (h - k.height) // 2
        atlas.paste(k, (px0, py0))
        print('levha', kod, [px0, py0, k.width, k.height])
    return atlas


def yaz(im, ad):
    CIKTI.mkdir(parents=True, exist_ok=True)
    im.save(CIKTI / f'{ad}.jpg', quality=86, optimize=True, progressive=True)
    im.resize((ATLAS // 2, ATLAS // 2), Image.Resampling.LANCZOS).filter(ImageFilter.UnsharpMask(1, 40, 2)).save(CIKTI / f'{ad}-k.jpg', quality=84, optimize=True, progressive=True)


if __name__ == '__main__':
    yaz(paye_atlasi(), 'paye-atlas')
    yaz(levha_atlasi(), 'levha-atlas')
