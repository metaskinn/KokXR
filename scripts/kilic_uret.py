"""Kılıç atölyesi modelleri. Önce dokular: blender -b --python scripts/kilic_doku.py
Çalıştır: blender -b --python scripts/kilic_uret.py [-- --onizleme <klasor>]
Çıktı: assets/kilic/kilic.blend, public/modeller/kilic.glb, public/modeller/kilic-atolye.glb

Ölçüler: Topkapı 1/90 (Yücel, Islamic Swords and Swordsmiths, Plate 87): toplam 126,5 cm, namlu 106 cm.
Genişlik, kalınlık, eğrilik ve balçak ölçüleri fotoğraflardan tahmindir. Birim metre.
Kılıç: balçak merkezi başlangıç, namlu +X, sırt +Z, ağız -Z (glTF'te sırt +Y).

Namlu halka halka üretilir. TEXCOORD_1 = (u, a): u uzunluk boyunca 0-1, a halka çevresinde 0-1.
Uygulama bunlarla külçe kesitini hesaplar ve bölge bölge dövme yapar (docs/kilic-atolyesi.md)."""
import math
import sys
from pathlib import Path
import bpy
import bmesh
from mathutils import Vector
from mathutils.geometry import tessellate_polygon

ROOT = Path(__file__).resolve().parents[1]
DOKU = ROOT / 'assets' / 'kilic' / 'doku'
NAMLU_BOY, TOPLAM = 1.06, 1.265

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.preferences.filepaths.save_version = 0


# ------------------------------------------------------------ malzemeler
def _doku(ad, renkli=True):
    im = bpy.data.images.load(str(DOKU / f'{ad}.png'))
    im.colorspace_settings.name = 'sRGB' if renkli else 'Non-Color'
    return im


def malzeme(ad, on, olcek=1.0, kod=None):
    m = bpy.data.materials.new(ad); m.use_nodes = True
    n = m.node_tree.nodes; l = m.node_tree.links; p = n['Principled BSDF']
    koor = None
    if olcek != 1.0:
        koor = n.new('ShaderNodeMapping'); koor.inputs['Scale'].default_value = (olcek, olcek, 1)
        l.new(n.new('ShaderNodeTexCoord').outputs['UV'], koor.inputs['Vector'])
    def bag(t):
        if koor: l.new(koor.outputs['Vector'], t.inputs['Vector'])
    r = n.new('ShaderNodeTexImage'); r.image = _doku(f'{on}_renk'); bag(r)
    l.new(r.outputs['Color'], p.inputs['Base Color'])
    pm = n.new('ShaderNodeTexImage'); pm.image = _doku(f'{on}_pm', False); bag(pm)
    ay = n.new('ShaderNodeSeparateColor'); l.new(pm.outputs['Color'], ay.inputs[0])
    l.new(ay.outputs[1], p.inputs['Roughness']); l.new(ay.outputs[2], p.inputs['Metallic'])
    nm = n.new('ShaderNodeTexImage'); nm.image = _doku(f'{on}_normal', False); bag(nm)
    nn = n.new('ShaderNodeNormalMap'); l.new(nm.outputs['Color'], nn.inputs['Color']); l.new(nn.outputs['Normal'], p.inputs['Normal'])
    return m


def kakma_malzemesi():
    m = bpy.data.materials.new('Altin_Kakma'); m.use_nodes = True
    n = m.node_tree.nodes; l = m.node_tree.links; p = n['Principled BSDF']
    t = n.new('ShaderNodeTexImage'); t.image = _doku('namlu_kakma')
    l.new(t.outputs['Color'], p.inputs['Base Color']); l.new(t.outputs['Alpha'], p.inputs['Alpha'])
    p.inputs['Metallic'].default_value = 1; p.inputs['Roughness'].default_value = .28
    m.blend_method = 'BLEND'; m.use_backface_culling = True
    return m


def duz(ad, renk, purz=.5, metal=0.0, isi=None, guc=0.0, alfa=1.0):
    m = bpy.data.materials.new(ad); m.use_nodes = True
    p = m.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = (*renk, 1); p.inputs['Roughness'].default_value = purz
    p.inputs['Metallic'].default_value = metal
    if isi:
        p.inputs['Emission Color'].default_value = (*isi, 1); p.inputs['Emission Strength'].default_value = guc
    if alfa < 1:
        p.inputs['Alpha'].default_value = alfa; m.blend_method = 'BLEND'
    return m


M = {
    'namlu': malzeme('Celik_Namlu', 'namlu'), 'kakma': kakma_malzemesi(),
    'balcak': malzeme('Balcak_Kakma', 'balcak'), 'fildisi': malzeme('Mors_Disi', 'fildisi'),
    'altin': duz('Altin', (.95, .68, .28), .26, 1), 'sap': duz('Sap_Celik', (.20, .20, .21), .55, 1),
    'tugla': malzeme('Tugla', 'tugla', 2.0), 'tas': malzeme('Tas', 'tas', 2.5),
    'ahsap': malzeme('Ahsap', 'ahsap', 1.5), 'demir': malzeme('Demir', 'demir', 1.2),
    'deri': malzeme('Deri', 'deri', 1.5), 'kor': malzeme('Kor', 'kor', 2.2),
    'hasir': malzeme('Hasir', 'hasir', 1.0), 'kumas': malzeme('Kumas', 'kumas', 2.0),
    'su': duz('Su', (.03, .07, .08), .06, .0, alfa=.82), 'kulce': duz('Kulce_Celik', (.13, .13, .14), .62, 1),
    'ip': duz('Ip', (.52, .42, .26), .9),
}
# Kor ısıması: uygulama şiddeti körükle değiştirir.
_k = M['kor'].node_tree; _e = _k.nodes.new('ShaderNodeTexImage'); _e.image = _doku('kor_isi')
_k.links.new(_e.outputs['Color'], _k.nodes['Principled BSDF'].inputs['Emission Color'])
_k.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 2.0


# ------------------------------------------------------------ yardımcılar
def nesne(ad, bm, mal, koleksiyon=None, duzgun=None):
    me = bpy.data.meshes.new(ad); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(ad, me)
    (koleksiyon or bpy.context.scene.collection).objects.link(ob)
    me.materials.append(mal)
    if duzgun is not None:
        bpy.context.view_layer.objects.active = ob; ob.select_set(True)
        bpy.ops.object.shade_smooth_by_angle(angle=math.radians(duzgun)); ob.select_set(False)
    return ob


def kutu_uv(ob, olcek=1.0):
    """Üç yönden düz izdüşüm (dünya ölçekli); doku süreklidir."""
    me = ob.data
    uv = me.uv_layers.new(name='UVMap') if not me.uv_layers else me.uv_layers[0]
    for poly in me.polygons:
        nx, ny, nz = (abs(c) for c in poly.normal)
        for li in poly.loop_indices:
            v = me.vertices[me.loops[li].vertex_index].co
            if nz >= nx and nz >= ny: uv.data[li].uv = (v.x * olcek, v.y * olcek)
            elif nx >= ny: uv.data[li].uv = (v.y * olcek, v.z * olcek)
            else: uv.data[li].uv = (v.x * olcek, v.z * olcek)


def uygula(ob, tip, **ayar):
    bpy.context.view_layer.objects.active = ob
    mod = ob.modifiers.new(tip, tip)
    for k, d in ayar.items(): setattr(mod, k, d)
    ob.select_set(True); bpy.ops.object.modifier_apply(modifier=mod.name); ob.select_set(False)


def donus_cismi(ad, profil, mal, n=48, koleksiyon=None, uvx=1.0, uvy=1.0, eksen='Z'):
    """profil: [(yaricap, yukseklik)] -> Z (veya X) ekseni etrafında dönen cisim."""
    bm = bmesh.new(); uv = bm.loops.layers.uv.new('UVMap'); halkalar = []
    for r, h in profil:
        hal = []
        for i in range(n):
            a = i / n * math.tau; c, s = math.cos(a) * r, math.sin(a) * r
            hal.append(bm.verts.new((c, s, h) if eksen == 'Z' else (h, c, s)))
        halkalar.append(hal)
    for j in range(len(halkalar) - 1):
        for i in range(n):
            a, b = i, (i + 1) % n
            f = bm.faces.new((halkalar[j][a], halkalar[j][b], halkalar[j + 1][b], halkalar[j + 1][a]))
            for lo, (u, v) in zip(f.loops, ((i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1))):
                lo[uv].uv = (profil[min(v, len(profil) - 1)][1] * uvy, u / n * uvx)
    if profil[0][0] > 1e-4: bm.faces.new(list(reversed(halkalar[0])))
    if profil[-1][0] > 1e-4: bm.faces.new(halkalar[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in bm.faces:
        eksenli = abs(f.normal.z if eksen == 'Z' else f.normal.x)
        if eksenli > .75:
            for lo in f.loops:
                a, b = (lo.vert.co.x, lo.vert.co.y) if eksen == 'Z' else (lo.vert.co.y, lo.vert.co.z)
                lo[uv].uv = (a * uvx * .5, b * uvx * .5)
    return nesne(ad, bm, mal, koleksiyon, 40)


def kutu(ad, boyut, konum, mal, koleksiyon=None, pah=.0, uv=1.0):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
    for v in bm.verts: v.co = Vector((v.co.x * boyut[0], v.co.y * boyut[1], v.co.z * boyut[2]))
    ob = nesne(ad, bm, mal, koleksiyon)
    if pah: uygula(ob, 'BEVEL', width=pah, segments=3, limit_method='ANGLE')
    ob.location = konum
    kutu_uv(ob, uv)
    for p in ob.data.polygons: p.use_smooth = False
    return ob


# ------------------------------------------------------------ namlu
HALKA, KENAR = 240, 26  # uzunluk halkası, yan başına kesit noktası


def merkez(u):
    """Hafif eğri eksen: başlangıçta neredeyse düz, uca doğru sırta eğilir (K2: henüz tam eğrilik yok)."""
    x = u * NAMLU_BOY
    return Vector((x, 0, .070 * u ** 2.3))


def merkez_normal(u):
    a, b = merkez(max(u - .003, 0)), merkez(min(u + .003, 1))
    t = (b - a).normalized()
    return Vector((-t.z, 0, t.x))


def genislik(u):
    """(sırt ofseti, ağız ofseti): eksene göre. Basamak (mahmuz) yaklaşık u=.84'te; K1: 'step'."""
    gs = .022 - .0030 * u                      # sırt tarafı
    ga = .028 - .0065 * u                      # ağız tarafı
    if u > .84:                                # yalman: sırt küçük bir basamakla düşer
        k = (u - .84) / .16
        gs -= .0035 * min(1, (u - .84) / .006) + .0195 * k ** 1.35
    if u > .80:
        k = (u - .80) / .20
        ga *= (1 - k ** 2.2) ** .9
    if u >= .999:
        return -.0005, .0005
    return gs, ga


def kesit_yari_kalinlik(u, s):
    """s: 0 sırt, 1 ağız. Geniş sırt, ağza doğru incelme, K1'deki iki oluk."""
    t0 = (.0042 - .0016 * u) * (1 - max(0, u - .84) / .16 * .72)
    y = t0 * max(1 - s, 0) ** .72 + .00018
    # Geniş oluk: kabzadan uca (u .96'ya dek), s .17-.61
    if .012 < u < .96:
        k = (s - .17) / .44
        if 0 < k < 1:
            uc = min(1, (u - .012) / .02) * min(1, (.96 - u) / .05)
            y -= t0 * .34 * math.sin(k * math.pi) ** .6 * uc
    # Sırt oluğu: basamağa dek, s .025-.125
    if .012 < u < .835:
        k = (s - .025) / .10
        if 0 < k < 1:
            uc = min(1, (u - .012) / .02) * min(1, (.835 - u) / .012)
            y -= t0 * .20 * math.sin(k * math.pi) ** .7 * uc
    return max(y, .00012)


def namlu_noktasi(u, s, yan, ek=0.0):
    c, n = merkez(u), merkez_normal(u)
    gs, ga = genislik(u)
    p = c + n * (gs - s * (gs + ga))
    return Vector((p.x, yan * (kesit_yari_kalinlik(u, s) + ek), p.z))


def s_duzeni():
    """Ağız ve sırta yakın sık örnekleme."""
    return [(.5 - .5 * math.cos(math.pi * i / (KENAR - 1))) ** 1.05 for i in range(KENAR)]


def namlu_mesh(koleksiyon):
    bm = bmesh.new(); uv = bm.loops.layers.uv.new('UVMap'); uv2 = bm.loops.layers.uv.new('Dovme')
    S = s_duzeni(); M2 = 2 * KENAR - 2  # halka: üst yan sırttan ağza, alt yan ağızdan sırta
    halkalar = []
    for j in range(HALKA):
        u = j / (HALKA - 1); hal = []
        for i in range(KENAR): hal.append(bm.verts.new(namlu_noktasi(u, S[i], 1)))
        for i in range(KENAR - 2, 0, -1): hal.append(bm.verts.new(namlu_noktasi(u, S[i], -1)))
        halkalar.append(hal)
    for j in range(HALKA - 1):
        u0, u1 = j / (HALKA - 1), (j + 1) / (HALKA - 1)
        for i in range(M2):
            k = (i + 1) % M2
            f = bm.faces.new((halkalar[j][i], halkalar[j + 1][i], halkalar[j + 1][k], halkalar[j][k]))
            for lo, (uu, ii) in zip(f.loops, ((u0, i), (u1, i), (u1, k if k else M2), (u0, k if k else M2))):
                sv = S[ii] if ii < KENAR else S[M2 - ii] if ii < M2 else S[0]
                lo[uv].uv = (uu, 1 - sv)
                lo[uv2].uv = (uu, ii / M2)
            f.smooth = True
    bm.faces.new(list(reversed(halkalar[0])))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    ob = nesne('Namlu', bm, M['namlu'], koleksiyon)
    # Sırt ve ağız hattı keskin kalsın; oluklar yumuşak.
    bpy.context.view_layer.objects.active = ob; ob.select_set(True)
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(38)); ob.select_set(False)
    return ob


def kakma_mesh(koleksiyon):
    """Namlunun üzerinde çok ince altın kabuk; bant yalnızca s .13-.66 arasında."""
    bm = bmesh.new(); uv = bm.loops.layers.uv.new('UVMap')
    N, K = 200, 16; us = [.012 + (.90 - .012) * j / (N - 1) for j in range(N)]; ss = [.13 + .53 * i / (K - 1) for i in range(K)]
    for yan in (1, -1):
        izgara = [[bm.verts.new(namlu_noktasi(u, s, yan, .00016)) for s in ss] for u in us]
        for j in range(N - 1):
            for i in range(K - 1):
                q = (izgara[j][i], izgara[j + 1][i], izgara[j + 1][i + 1], izgara[j][i + 1])
                f = bm.faces.new(q if yan < 0 else tuple(reversed(q)))
                ks = ((j, i), (j + 1, i), (j + 1, i + 1), (j, i + 1))
                for lo, (a, b) in zip(f.loops, ks if yan < 0 else tuple(reversed(ks))):
                    lo[uv].uv = (us[a], 1 - ss[b])
                f.smooth = True
    return nesne('Namlu_Kakma', bm, M['kakma'], koleksiyon)


# ------------------------------------------------------------ balçak (kat: kollar Z, diller X)
def balcak_mesh(koleksiyon):
    """Haç biçimli, uçları genişleyen kalın kollu balçak (K1, fotoğraftan oran)."""
    def kol(eks, boy, g0, g1, uc):
        """Bir kolun yarı dış hattı; eks=(ax,az) yön, boy uzunluk."""
        ax, az = eks; px, pz = az, -ax  # hat saat yönünün tersine dolaşır; kendini kesmez
        return [(ax * d + px * g, az * d + pz * g) for d, g in (
            (0.022, g0), (boy * .55, g0 * .78), (boy * .86, g1 * .80), (boy * .96, g1), (boy, g1 * .78))] + \
            [(ax * (boy + uc), az * (boy + uc))] + \
            [(ax * d - px * g, az * d - pz * g) for d, g in ((boy, g1 * .78), (boy * .96, g1), (boy * .86, g1 * .80), (boy * .55, g0 * .78), (0.022, g0))]
    hat = []
    hat += kol((1, 0), .044, .0165, .0105, .012)    # namluya dil (sivri)
    hat += kol((0, 1), .092, .0130, .0205, .002)    # sırt kolu
    hat += kol((-1, 0), .010, .0165, .0150, .002)   # kabzaya dil (kısa: fildişi hemen başlar)
    hat += kol((0, -1), .092, .0130, .0205, .002)   # ağız kolu
    for _ in range(3):  # Chaikin: köşeleri işçilik gibi yumuşat
        yeni = []
        for i in range(len(hat)):
            a, b = hat[i], hat[(i + 1) % len(hat)]
            yeni += [(a[0] * .75 + b[0] * .25, a[1] * .75 + b[1] * .25), (a[0] * .25 + b[0] * .75, a[1] * .25 + b[1] * .75)]
        hat = yeni
    bm = bmesh.new(); uv = bm.loops.layers.uv.new('UVMap'); T = .0105
    OL = .117  # doku yarım genişliği: kol ucu dokuda ~430/512
    def uvn(x, z): return (.5 + z / OL * .5 * .92, .5 + x / OL * .5 * .92)
    ust = [bm.verts.new((x, T, z)) for x, z in hat]; alt = [bm.verts.new((x, -T, z)) for x, z in hat]
    uclu = tessellate_polygon([[Vector((x, z, 0)) for x, z in hat]])
    for a, b, c in uclu:
        for f in (bm.faces.new((ust[a], ust[b], ust[c])), bm.faces.new((alt[c], alt[b], alt[a]))):
            for lo in f.loops: lo[uv].uv = uvn(lo.vert.co.x, lo.vert.co.z)
    n = len(hat)
    for i in range(n):
        j = (i + 1) % n
        f = bm.faces.new((ust[j], ust[i], alt[i], alt[j]))
        for lo in f.loops: lo[uv].uv = (.04, .04)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    ob = nesne('Balcak', bm, M['balcak'], koleksiyon)
    uygula(ob, 'BEVEL', width=.0030, segments=4, limit_method='ANGLE', angle_limit=math.radians(60), harden_normals=False)
    bpy.context.view_layer.objects.active = ob; ob.select_set(True)
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(50)); ob.select_set(False)
    return ob


# ------------------------------------------------------------ kabza
KABZA_BOY = TOPLAM - NAMLU_BOY - .0  # 20,5 cm, balçak merkezinden


def kabza_ekseni(k):
    """k: 0 balçak, 1 baş. Ağız yönüne (−Z) hafif eğilir (K2: kabzada eğim)."""
    x = -k * KABZA_BOY
    return Vector((x, 0, -.016 * k ** 1.9))


def kabza_kalinlik(k):
    return (.0118 + .0030 * max(0, k - .84) / .16) * (.80 + .20 * min(1, k / .22))


def kabza_plaka(ad, yan, koleksiyon):
    """Dik kesiti yuvarlak, iki plaka; baş genişleyip kesik biçimde biter (K1)."""
    bm = bmesh.new(); uv = bm.loops.layers.uv.new('UVMap')
    N, K = 72, 14; halkalar = []
    for j in range(N):
        k = .068 + .932 * j / (N - 1); c = kabza_ekseni(k)
        gz = .0152 + .0030 * math.sin(k * math.pi) * .3 + .0060 * max(0, k - .84) / .16
        gy = kabza_kalinlik(k)
        if k > .985: gz *= .92; gy *= .90
        hal = []
        for i in range(K):
            a = -math.pi / 2 + math.pi * i / (K - 1)  # plakanın dış yarım daire kesiti
            yy, zz = math.cos(a) * gy, math.sin(a) * gz
            hal.append(bm.verts.new((c.x, yan * (yy + .0005), c.z + zz)))
        halkalar.append(hal)
    for j in range(N - 1):
        for i in range(K - 1):
            q = (halkalar[j][i], halkalar[j + 1][i], halkalar[j + 1][i + 1], halkalar[j][i + 1])
            f = bm.faces.new(q)
            for lo, (a, b) in zip(f.loops, ((j, i), (j + 1, i), (j + 1, i + 1), (j, i + 1))):
                lo[uv].uv = (a / (N - 1), b / (K - 1) * .5 + (0 if yan > 0 else .5))
            f.smooth = True
    # Düz iç yüz ve kapaklar
    ic = []
    for j in range(N): ic.append((halkalar[j][0], halkalar[j][K - 1]))
    for j in range(N - 1):
        f = bm.faces.new((ic[j][1], ic[j + 1][1], ic[j + 1][0], ic[j][0]))
        for lo in f.loops: lo[uv].uv = (.5, .25)
    bm.faces.new(halkalar[0]); bm.faces.new(list(reversed(halkalar[-1])))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return nesne(ad, bm, M['fildisi'], koleksiyon)


def percin(i, k, koleksiyon):
    c = kabza_ekseni(k)
    gy = kabza_kalinlik(k) + .0005
    # Y ekseninde boydan boya perçin: dışta altın halka, koyu göbek (fotoğraf)
    prof = [(0, gy + .0014), (.0030, gy + .0013), (.0034, gy + .0007), (.0060, gy + .0007), (.0066, gy - .0006)]
    bm = bmesh.new(); hal = []
    for r, y in prof:
        hal.append([bm.verts.new((c.x + math.cos(a) * r, y, c.z + math.sin(a) * r)) for a in (t / 28 * math.tau for t in range(28))])
    for j in range(len(hal) - 1):
        for t in range(28):
            f = bm.faces.new((hal[j][t], hal[j][(t + 1) % 28], hal[j + 1][(t + 1) % 28], hal[j + 1][t]))
            f.material_index = 1 if j == 0 else 0
    hal2 = [[bm.verts.new((v.co.x, -v.co.y, v.co.z)) for v in r] for r in hal]
    for j in range(len(hal2) - 1):
        for t in range(28):
            f = bm.faces.new((hal2[j][(t + 1) % 28], hal2[j][t], hal2[j + 1][t], hal2[j + 1][(t + 1) % 28]))
            f.material_index = 1 if j == 0 else 0
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    ob = nesne(f'Percin_{i}', bm, M['altin'], koleksiyon, 35)
    ob.data.materials.append(M['sap'])
    return ob


def sap_mesh(koleksiyon):
    """Plakalar takılmadan görünen namlu sapı."""
    bm = bmesh.new(); N = 30; hal = []
    for j in range(N):
        k = j / (N - 1) * .96; c = kabza_ekseni(k); g = .0105 - .0030 * k; t = .0022
        hal.append([bm.verts.new((c.x, y, c.z + z)) for y, z in ((t, g), (-t, g), (-t, -g), (t, -g))])
    for j in range(N - 1):
        for i in range(4):
            bm.faces.new((hal[j][i], hal[j][(i + 1) % 4], hal[j + 1][(i + 1) % 4], hal[j + 1][i]))
    bm.faces.new(hal[0]); bm.faces.new(list(reversed(hal[-1])))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    ob = nesne('Sap', bm, M['sap'], koleksiyon, 30)
    kutu_uv(ob, 8)
    return ob


# ------------------------------------------------------------ kılıç koleksiyonu
kk = bpy.data.collections.new('Kilic'); bpy.context.scene.collection.children.link(kk)
namlu = namlu_mesh(kk); kakma = kakma_mesh(kk); balcak = balcak_mesh(kk); sap = sap_mesh(kk)
plaka1 = kabza_plaka('Kabza_Sol', 1, kk); plaka2 = kabza_plaka('Kabza_Sag', -1, kk)
percinler = [percin(i + 1, k, kk) for i, k in enumerate((.20, .42, .64, .86))]
for ob, d in ((namlu, 'namlu'), (kakma, 'kakma'), (balcak, 'balcak'), (sap, 'sap'), (plaka1, 'kabza'), (plaka2, 'kabza')):
    ob['parca'] = d
for p in percinler: p['parca'] = 'percin'


# ------------------------------------------------------------ atölye
ak = bpy.data.collections.new('Atolye'); bpy.context.scene.collection.children.link(ak)


def orsun_hatti():
    """Yan görünüş (x, z): boynuz + gövde + topuk + ayak."""
    return [(-.31, .262), (-.23, .285), (-.14, .296), (.20, .296), (.26, .290), (.27, .262), (.15, .250),
            (.09, .225), (.075, .13), (.15, .09), (.17, .0), (-.17, .0), (-.15, .09), (-.075, .13), (-.09, .225), (-.16, .248), (-.24, .258)]


def ors(koleksiyon):
    bm = bmesh.new(); h = orsun_hatti(); W = .055
    def gen(x, z):
        if x < -.14: return W * max(.08, (x + .31) / .17) * .75
        if z < .13: return W * (1.25 + (.13 - z) / .13 * 1.0)
        return W
    on = [bm.verts.new((x, gen(x, z), z)) for x, z in h]; ar = [bm.verts.new((x, -gen(x, z), z)) for x, z in h]
    bm.faces.new(on); bm.faces.new(list(reversed(ar)))
    for i in range(len(h)):
        j = (i + 1) % len(h); bm.faces.new((on[j], on[i], ar[i], ar[j]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    ob = nesne('Ors', bm, M['demir'], koleksiyon)
    uygula(ob, 'BEVEL', width=.008, segments=3, limit_method='ANGLE', angle_limit=math.radians(25))
    kutu_uv(ob, 3)
    bpy.context.view_layer.objects.active = ob; ob.select_set(True)
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(42)); ob.select_set(False)
    return ob


# Düzen: ocak -X, örs merkez, su sağ, bileği taşı arka. Yer düzlemi Z=0.
zemin = kutu('Zemin', (9, 8, .1), (0, 0, -.05), M['tas'], ak, uv=.28)
for ad, b, k in (('Duvar_Arka', (9, .3, 4.2), (0, 3.2, 2.1)), ('Duvar_Sol', (.3, 8, 4.2), (-4.4, 0, 2.1)), ('Duvar_Sag', (.3, 8, 4.2), (4.4, 0, 2.1))):
    kutu(ad, b, k, M['tugla'], ak, uv=.45)
# Ocak: tuğla gövde, kor yatağı, davlumbaz
ox, oy = -2.25, 2.1
kutu('Ocak_Govde', (1.9, 1.3, .86), (ox, oy, .43), M['tugla'], ak, .012, .75)
kutu('Ocak_Agiz', (1.5, .92, .10), (ox, oy - .08, .865), M['demir'], ak, .004, .9)
for ad, d in (('Ocak_Yan_Sol', -.8), ('Ocak_Yan_Sag', .8)):
    kutu(ad, (.26, 1.3, 1.35), (ox + d, oy, 1.42), M['tugla'], ak, .012, .75)
kutu('Ocak_Arka', (1.9, .26, 1.35), (ox, oy + .52, 1.42), M['tugla'], ak, .012, .75)
kutu('Davlumbaz', (2.1, 1.5, .4), (ox, oy, 2.28), M['tugla'], ak, .02, .75)
kutu('Baca', (.95, .85, 1.5), (ox, oy + .1, 3.2), M['tugla'], ak, .012, .75)
# Kor yatağı: kümelenmiş kor taşları
bm = bmesh.new(); yer = bm.loops.layers.uv.new('UVMap')
import random
random.seed(1453)
for _ in range(240):
    ik = bmesh.ops.create_icosphere(bm, subdivisions=1, radius=random.uniform(.028, .058))
    x, y = random.uniform(-.68, .68), random.uniform(-.40, .40)
    for v in ik['verts']:
        v.co = Vector((v.co.x * random.uniform(.8, 1.25) + x, v.co.y * random.uniform(.8, 1.25) + y, v.co.z * .8))
kor = nesne('Kor', bm, M['kor'], ak)
kor.location = (ox, oy - .08, .935); kutu_uv(kor, 5)
# Körük: iki ahşap levha, deri körük, boru
bm = bmesh.new(); hal = []
for j, (w, z) in enumerate(((.26, 0), (.27, .05), (.22, .10), (.28, .15), (.22, .20), (.27, .25), (.26, .30))):
    hal.append([bm.verts.new((sx * w * (1 if sx > 0 else 1.25), sy * w * .72, z)) for sx, sy in ((-1, -1), (1, -.3), (1, .3), (-1, 1))])
for j in range(len(hal) - 1):
    for i in range(4):
        bm.faces.new((hal[j][i], hal[j][(i + 1) % 4], hal[j + 1][(i + 1) % 4], hal[j + 1][i]))
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
kx, ky = -3.7, 1.75
koruk_deri = nesne('Koruk_Deri', bm, M['deri'], ak, 32); koruk_deri.location = (kx, ky, .62); kutu_uv(koruk_deri, 2)
kutu('Koruk_Alt', (.72, .44, .04), (kx, ky, .60), M['ahsap'], ak, .004, 1.5)
kutu('Koruk_Ust', (.72, .44, .04), (kx, ky, .94), M['ahsap'], ak, .004, 1.5)
kutu('Koruk_Sehpa', (.56, .36, .58), (kx, ky, .29), M['ahsap'], ak, .006, 1.5)
donus_cismi('Koruk_Boru', [(.035, 0), (.035, .55)], M['demir'], 16, ak, eksen='X').location = (kx + .32, ky + .0, .78)
# Örs ve kütük
donus_cismi('Ors_Kutuk', [(.0, 0), (.30, 0), (.31, .03), (.28, .30), (.285, .55), (.29, .58), (.0, .58)], M['ahsap'], 40, ak, 2.6, .9).location = (0, .1, 0)
ors_ob = ors(ak); ors_ob.location = (0, .1, .58)
# Çekiç: sap + baş
bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
for v in bm.verts: v.co = Vector((v.co.x * .14, v.co.y * .058, v.co.z * .058))
cekic_bas = nesne('Cekic_Bas', bm, M['demir'], ak); uygula(cekic_bas, 'BEVEL', width=.007, segments=3); kutu_uv(cekic_bas, 4)
sap_c = donus_cismi('Cekic_Sap', [(.0, -.38), (.017, -.378), (.019, -.20), (.015, -.02), (.015, .018), (.0, .018)], M['ahsap'], 16, ak, .5, 2)
sap_c.parent = cekic_bas
cekic_bas.location = (.13, .1, .91); cekic_bas.rotation_euler = (math.radians(90), 0, math.radians(14))
# Maşa: iki kol ve ağız
def masa(ad, yan):
    bm = bmesh.new(); yol = [(-.62, .020 * yan), (-.1, .012 * yan), (0, -.006 * yan), (.16, -.009 * yan), (.17, .0)]
    hal = [[bm.verts.new((x, y + dy, dz)) for dy, dz in ((.006, .006), (-.006, .006), (-.006, -.006), (.006, -.006))] for x, y in yol]
    for j in range(len(hal) - 1):
        for i in range(4):
            bm.faces.new((hal[j][i], hal[j][(i + 1) % 4], hal[j + 1][(i + 1) % 4], hal[j + 1][i]))
    bm.faces.new(hal[0]); bm.faces.new(list(reversed(hal[-1])))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    ob = nesne(ad, bm, M['demir'], ak, 40); kutu_uv(ob, 4); return ob
m1 = masa('Masa_1', 1); m2 = masa('Masa_2', -1); m2.parent = m1
m1.location = (-1.95, 1.42, .92); m1.rotation_euler = (0, 0, math.radians(68))
# Tezgah
kutu('Tezgah_Ust', (1.6, .62, .07), (2.9, 2.5, .86), M['ahsap'], ak, .006, 1.2)
for x in (-.7, .7):
    for y in (-.24, .24):
        kutu('Tezgah_Ayak', (.09, .09, .84), (2.9 + x, 2.5 + y, .42), M['ahsap'], ak, .004, 1.2)
# Su teknesi: dış, iç oyuk, su
sx, sy = 1.95, -.15
for ad, b, k in (('Tekne_Uzun_1', (1.5, .06, .46), (sx, sy - .29, .26)), ('Tekne_Uzun_2', (1.5, .06, .46), (sx, sy + .29, .26)),
                 ('Tekne_Kisa_1', (.06, .64, .46), (sx - .72, sy, .26)), ('Tekne_Kisa_2', (.06, .64, .46), (sx + .72, sy, .26)),
                 ('Tekne_Taban', (1.5, .64, .05), (sx, sy, .05))):
    kutu(ad, b, k, M['ahsap'], ak, .004, 1.4)
kutu('Su', (1.38, .52, .01), (sx, sy, .40), M['su'], ak)
# Bileği taşı: çerçeve + döner taş
bx, by = 3.05, 1.2
tas_cark = donus_cismi('Bileme_Tasi', [(.0, -.06), (.36, -.06), (.375, -.05), (.375, .05), (.36, .06), (.0, .06)], M['tas'], 56, ak, 2, 2)
tas_cark.rotation_euler = (math.radians(90), 0, 0); tas_cark.location = (bx, by, .82)
for d in (-.12, .12):
    for x in (-.28, .28):
        ayak = kutu('Bileme_Ayak', (.07, .07, .80), (bx + x, by + d, .40), M['ahsap'], ak, .004, 1.2)
kutu('Bileme_Kol', (.03, .03, .34), (bx, by + .19, .82), M['demir'], ak, .003, 2)
# Külçe (kılıç yumurtası): dövülmemiş, oval, K2
bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=4, radius=1)
for v in bm.verts:
    v.co = Vector((v.co.x * .085, v.co.y * .048, v.co.z * .040))
kulce = nesne('Kilic_Yumurtasi', bm, M['kulce'], ak, 180); kulce.location = (2.8, 2.5, .93); kutu_uv(kulce, 6)
for ob in ak.objects: ob['atolye'] = True

# ------------------------------------------------------------ test alanı
tk = bpy.data.collections.new('Test'); bpy.context.scene.collection.children.link(tk)
tx = 14.0
kutu('Avlu_Zemin', (9, 8, .1), (tx, 0, -.05), M['tas'], tk, uv=.28)
kutu('Avlu_Duvar', (9, .4, 3.3), (tx, 3.4, 1.65), M['tugla'], tk, uv=.45)
# Hasır rulo: kaide + direk + rulo
donus_cismi('Hasir_Kaide', [(.0, 0), (.22, 0), (.20, .08), (.04, .10), (.0, .10)], M['ahsap'], 28, tk, 2, 2).location = (tx - 2.0, 0, 0)
hr = donus_cismi('Hasir_Rulo', [(.0, 0), (.075, .0), (.075, 1.05), (.0, 1.05)], M['hasir'], 28, tk, 3, 8); hr.location = (tx - 2.0, 0, .55)
donus_cismi('Hasir_Direk', [(.016, 0), (.016, .75)], M['ahsap'], 12, tk).location = (tx - 2.0, 0, .08)
for i, z in enumerate((.1, .5, .9)):
    donus_cismi(f'Hasir_Bag_{i}', [(.0765, 0), (.0775, .004), (.0775, .018), (.0765, .022)], M['ip'], 28, tk).location = (tx - 2.0, 0, .55 + z)
# Kütük: testere sehpası üzerinde yatay
kt = donus_cismi('Test_Kutuk', [(.0, -.45), (.11, -.45), (.115, -.40), (.105, 0), (.115, .40), (.11, .45), (.0, .45)], M['ahsap'], 28, tk, 2, 2, eksen='X'); kt.location = (tx, .1, .74)
for d in (-.34, .34):
    kutu('Kutuk_Ayak', (.08, .36, .62), (tx + d, .1, .31), M['ahsap'], tk, .004, 1.2)
# Asılı kumaş: gergi + kumaş
kutu('Kumas_Dikme_1', (.07, .07, 2.0), (tx + 1.65, .1, 1.0), M['ahsap'], tk, .004, 1.2)
kutu('Kumas_Dikme_2', (.07, .07, 2.0), (tx + 2.65, .1, 1.0), M['ahsap'], tk, .004, 1.2)
kutu('Kumas_Kiris', (1.14, .07, .07), (tx + 2.15, .1, 1.98), M['ahsap'], tk, .004, 1.2)
bm = bmesh.new(); uv = bm.loops.layers.uv.new('UVMap'); A, B = 32, 44
iz = [[bm.verts.new((-.42 + .84 * i / (A - 1), .018 * math.sin(i / 2.2 + j / 9) * (.4 + .6 * j / (B - 1)), -1.3 * j / (B - 1))) for i in range(A)] for j in range(B)]
for j in range(B - 1):
    for i in range(A - 1):
        f = bm.faces.new((iz[j][i], iz[j + 1][i], iz[j + 1][i + 1], iz[j][i + 1]))
        for lo, (a, b) in zip(f.loops, ((i, j), (i, j + 1), (i + 1, j + 1), (i + 1, j))):
            lo[uv].uv = (a / (A - 1), 1 - b / (B - 1))
        f.smooth = True
kk_ob = nesne('Test_Kumas', bm, M['kumas'], tk); kk_ob.location = (tx + 2.15, .1, 1.95)
kk_ob.data.materials[0].use_backface_culling = False
for ob in tk.objects: ob['test'] = True


# ------------------------------------------------------------ dışa aktarım
def dis_aktar(yol, koleksiyonlar):
    bpy.ops.object.select_all(action='DESELECT')
    for c in koleksiyonlar:
        for ob in c.objects: ob.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(yol), export_format='GLB', use_selection=True, export_apply=True, export_extras=True,
                              export_image_format='WEBP', export_image_quality=86, export_tangents=False, export_yup=True)
    print('GLB', yol, round(yol.stat().st_size / 1e6, 1), 'MB')


(ROOT / 'assets' / 'kilic').mkdir(parents=True, exist_ok=True); (ROOT / 'public' / 'modeller').mkdir(parents=True, exist_ok=True)
dis_aktar(ROOT / 'public' / 'modeller' / 'kilic.glb', [kk])
dis_aktar(ROOT / 'public' / 'modeller' / 'kilic-atolye.glb', [ak, tk])
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'assets' / 'kilic' / 'kilic.blend'), compress=True)

# ------------------------------------------------------------ önizleme (isteğe bağlı): Cycles
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
if '--onizleme' in argv:
    cik = Path(argv[argv.index('--onizleme') + 1]); cik.mkdir(parents=True, exist_ok=True)
    sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.samples = 96; sc.cycles.use_denoising = True
    try:
        pr = bpy.context.preferences.addons['cycles'].preferences; pr.compute_device_type = 'OPTIX'; pr.get_devices()
        for d in pr.devices: d.use = True
        sc.cycles.device = 'GPU'
    except Exception as e:
        print('GPU yok:', e)
    sc.render.resolution_x, sc.render.resolution_y = 1600, 900
    sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Medium High Contrast'
    w = bpy.data.worlds.new('D'); sc.world = w; w.use_nodes = True
    w.node_tree.nodes['Background'].inputs[0].default_value = (.05, .055, .065, 1); w.node_tree.nodes['Background'].inputs[1].default_value = 1.0
    def isik(ad, tip, kon, guc, boy=1.0, renk=(1, 1, 1), hedef=None):
        li = bpy.data.lights.new(ad, tip); li.energy = guc; li.color = renk
        if tip == 'AREA': li.size = boy
        ob = bpy.data.objects.new(ad, li); sc.collection.objects.link(ob); ob.location = kon
        if hedef is not None: ob.rotation_euler = (Vector(hedef) - Vector(kon)).to_track_quat('-Z', 'Y').to_euler()
        return ob
    def kamera(kon, hedef, lens):
        cam = bpy.data.cameras.new('K'); cam.lens = lens
        ob = bpy.data.objects.new('K', cam); sc.collection.objects.link(ob); ob.location = kon
        ob.rotation_euler = (Vector(hedef) - Vector(kon)).to_track_quat('-Z', 'Y').to_euler(); sc.camera = ob
        return ob
    def goster(colls):
        for c in (kk, ak, tk):
            c.hide_render = c not in colls
    def isle(ad):
        sc.render.filepath = str(cik / f'{ad}.png'); bpy.ops.render.render(write_still=True); print('render', ad)
    # Atölye sahnesi (doğal konum) ve kılıç ayrı: kılıcı atölyeye değmeden stüdyoda göster
    goster([kk])
    isik('Anahtar', 'AREA', (.45, -1.1, .95), 34, 2.4, (1, .95, .88), (.35, 0, 0))
    isik('Serit', 'AREA', (.5, -.25, 1.05), 26, 2.6, (1, 1, 1), (.5, 0, 0))
    isik('Kenar', 'AREA', (.2, 1.0, .5), 25, 1.6, (.8, .88, 1), (.2, 0, 0))
    kamera((.26, -1.75, .08), (.27, 0, .02), 40); isle('kilic_tam')
    kamera((-.08, -.42, .0), (-.04, 0, .0), 50); isle('kilic_kabza')
    kamera((.92, -.26, .09), (.93, 0, .06), 50); isle('kilic_uc')
    for ob in list(sc.collection.objects):
        if ob.type in ('LIGHT', 'CAMERA'): sc.collection.objects.unlink(ob)
    goster([ak])
    kor_isik = isik('Ocak', 'POINT', (-2.25, 2.0, 1.25), 90, renk=(1, .42, .12))
    isik('Pencere', 'AREA', (2.2, -3.2, 3.6), 520, 5, (.72, .82, 1), (.3, .5, .4))
    isik('Dolgu', 'POINT', (.5, -.9, 1.5), 26, renk=(1, .72, .5))
    kamera((1.3, -3.25, 1.5), (-.25, .85, .75), 28); isle('atolye')
    kamera((.75, -1.15, 1.25), (.02, .1, .78), 45); isle('ors_yakin')
    for ob in list(sc.collection.objects):
        if ob.type in ('LIGHT', 'CAMERA'): sc.collection.objects.unlink(ob)
    goster([tk])
    isik('Gunes', 'SUN', (tx, -2, 6), 3.5, renk=(1, .94, .85), hedef=(tx + 1, 1, 0))
    kamera((tx, -3.9, 1.55), (tx, .3, .95), 30); isle('test_alani')
print('Kılıç modelleri tamam.')
