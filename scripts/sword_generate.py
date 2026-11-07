"""Sword workshop models. Textures first: blender -b --python scripts/sword_texture.py
Run: blender -b --python scripts/sword_generate.py [-- --preview <folder>]
Output: assets/kilic/kilic.blend, public/models/sword.glb, public/models/sword-workshop.glb

Dimensions: Topkapı 1/90 (Yücel, Islamic Swords and Swordsmiths, Plate 87): overall 126.5 cm, blade 106 cm.
Width, thickness, curvature and guard dimensions are estimated from photographs. Units are metres.
Sword: guard centre is the origin, blade +X, spine +Z, edge -Z (spine +Y in glTF).

The blade is built ring by ring. TEXCOORD_1 = (u, a): u along the length 0-1, a around the ring 0-1.
The app uses these to compute the ingot cross-section and forge region by region (docs/sword-workshop.md)."""
import math
import sys
from pathlib import Path
import bpy
import bmesh
from mathutils import Vector
from mathutils.geometry import tessellate_polygon

ROOT = Path(__file__).resolve().parents[1]
TEXTURES = ROOT / 'assets' / 'kilic' / 'textures'
BLADE_LEN, TOTAL = 1.06, 1.265

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.preferences.filepaths.save_version = 0


# ------------------------------------------------------------ materials
def _texture(name, colored=True):
    im = bpy.data.images.load(str(TEXTURES / f'{name}.png'))
    im.colorspace_settings.name = 'sRGB' if colored else 'Non-Color'
    return im


def material(name, prefix, scale=1.0, code=None):
    m = bpy.data.materials.new(name); m.use_nodes = True
    n = m.node_tree.nodes; l = m.node_tree.links; p = n['Principled BSDF']
    coord = None
    if scale != 1.0:
        coord = n.new('ShaderNodeMapping'); coord.inputs['Scale'].default_value = (scale, scale, 1)
        l.new(n.new('ShaderNodeTexCoord').outputs['UV'], coord.inputs['Vector'])
    def link(t):
        if coord: l.new(coord.outputs['Vector'], t.inputs['Vector'])
    r = n.new('ShaderNodeTexImage'); r.image = _texture(f'{prefix}_color'); link(r)
    l.new(r.outputs['Color'], p.inputs['Base Color'])
    pm = n.new('ShaderNodeTexImage'); pm.image = _texture(f'{prefix}_pm', False); link(pm)
    sep = n.new('ShaderNodeSeparateColor'); l.new(pm.outputs['Color'], sep.inputs[0])
    l.new(sep.outputs[1], p.inputs['Roughness']); l.new(sep.outputs[2], p.inputs['Metallic'])
    nm = n.new('ShaderNodeTexImage'); nm.image = _texture(f'{prefix}_normal', False); link(nm)
    nn = n.new('ShaderNodeNormalMap'); l.new(nm.outputs['Color'], nn.inputs['Color']); l.new(nn.outputs['Normal'], p.inputs['Normal'])
    return m


def inlay_material():
    m = bpy.data.materials.new('Gold_Inlay'); m.use_nodes = True
    n = m.node_tree.nodes; l = m.node_tree.links; p = n['Principled BSDF']
    t = n.new('ShaderNodeTexImage'); t.image = _texture('blade_inlay')
    l.new(t.outputs['Color'], p.inputs['Base Color']); l.new(t.outputs['Alpha'], p.inputs['Alpha'])
    p.inputs['Metallic'].default_value = 1; p.inputs['Roughness'].default_value = .28
    m.blend_method = 'BLEND'; m.use_backface_culling = True
    return m


def flat(name, color, rough=.5, metal=0.0, glow=None, strength=0.0, alpha=1.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    p = m.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = (*color, 1); p.inputs['Roughness'].default_value = rough
    p.inputs['Metallic'].default_value = metal
    if glow:
        p.inputs['Emission Color'].default_value = (*glow, 1); p.inputs['Emission Strength'].default_value = strength
    if alpha < 1:
        p.inputs['Alpha'].default_value = alpha; m.blend_method = 'BLEND'
    return m


M = {
    'blade': material('Steel_Blade', 'blade'), 'inlay': inlay_material(),
    'guard': material('Guard_Inlay', 'guard'), 'ivory': material('Walrus_Tusk', 'ivory'),
    'gold': flat('Gold', (.95, .68, .28), .26, 1), 'handle': flat('Handle_Steel', (.20, .20, .21), .55, 1),
    'brick': material('Brick', 'brick', 2.0), 'stone': material('Stone', 'stone', 2.5),
    'wood': material('Wood', 'wood', 1.5), 'iron': material('Iron', 'iron', 1.2),
    'leather': material('Leather', 'leather', 1.5), 'embers': material('Embers', 'embers', 2.2),
    'sharpen': material('Sharpen_Stone', 'sharpen', 1.4), 'straw': material('Straw', 'straw', 1.0), 'cloth': material('Cloth', 'cloth', 2.0),
    'water': flat('Water', (.03, .07, .08), .06, .0, alpha=.82), 'ingot': flat('Ingot_Steel', (.13, .13, .14), .62, 1),
    'rope': flat('Rope', (.52, .42, .26), .9),
}
# Ember glow: the app changes the strength with the bellows.
_k = M['embers'].node_tree; _e = _k.nodes.new('ShaderNodeTexImage'); _e.image = _texture('embers_heat')
_k.links.new(_e.outputs['Color'], _k.nodes['Principled BSDF'].inputs['Emission Color'])
_k.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 2.0


# ------------------------------------------------------------ helpers
def make_object(name, bm, mat, collection=None, smooth=None):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me)
    (collection or bpy.context.scene.collection).objects.link(ob)
    me.materials.append(mat)
    if smooth is not None:
        bpy.context.view_layer.objects.active = ob; ob.select_set(True)
        bpy.ops.object.shade_smooth_by_angle(angle=math.radians(smooth)); ob.select_set(False)
    return ob


def box_uv(ob, scale=1.0):
    """Flat projection from three directions (world scaled); the texture is continuous."""
    me = ob.data
    uv = me.uv_layers.new(name='UVMap') if not me.uv_layers else me.uv_layers[0]
    for poly in me.polygons:
        nx, ny, nz = (abs(c) for c in poly.normal)
        for li in poly.loop_indices:
            v = me.vertices[me.loops[li].vertex_index].co
            if nz >= nx and nz >= ny: uv.data[li].uv = (v.x * scale, v.y * scale)
            elif nx >= ny: uv.data[li].uv = (v.y * scale, v.z * scale)
            else: uv.data[li].uv = (v.x * scale, v.z * scale)


def apply_modifier(ob, kind, **settings):
    bpy.context.view_layer.objects.active = ob
    mod = ob.modifiers.new(kind, kind)
    for k, d in settings.items(): setattr(mod, k, d)
    ob.select_set(True); bpy.ops.object.modifier_apply(modifier=mod.name); ob.select_set(False)


def lathe(name, profile, mat, n=48, collection=None, uvx=1.0, uvy=1.0, axis='Z'):
    """profile: [(radius, height)] -> solid of revolution around the Z (or X) axis."""
    bm = bmesh.new(); uv = bm.loops.layers.uv.new('UVMap'); rings = []
    for r, h in profile:
        ring = []
        for i in range(n):
            a = i / n * math.tau; c, s = math.cos(a) * r, math.sin(a) * r
            ring.append(bm.verts.new((c, s, h) if axis == 'Z' else (h, c, s)))
        rings.append(ring)
    for j in range(len(rings) - 1):
        for i in range(n):
            a, b = i, (i + 1) % n
            f = bm.faces.new((rings[j][a], rings[j][b], rings[j + 1][b], rings[j + 1][a]))
            for lo, (u, v) in zip(f.loops, ((i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1))):
                lo[uv].uv = (profile[min(v, len(profile) - 1)][1] * uvy, u / n * uvx)
    if profile[0][0] > 1e-4: bm.faces.new(list(reversed(rings[0])))
    if profile[-1][0] > 1e-4: bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in bm.faces:
        along_axis = abs(f.normal.z if axis == 'Z' else f.normal.x)
        if along_axis > .75:
            for lo in f.loops:
                a, b = (lo.vert.co.x, lo.vert.co.y) if axis == 'Z' else (lo.vert.co.y, lo.vert.co.z)
                lo[uv].uv = (a * uvx * .5, b * uvx * .5)
    return make_object(name, bm, mat, collection, 40)


def box(name, size, location, mat, collection=None, bevel=.0, uv=1.0):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
    for v in bm.verts: v.co = Vector((v.co.x * size[0], v.co.y * size[1], v.co.z * size[2]))
    ob = make_object(name, bm, mat, collection)
    if bevel: apply_modifier(ob, 'BEVEL', width=bevel, segments=3, limit_method='ANGLE')
    ob.location = location
    box_uv(ob, uv)
    for p in ob.data.polygons: p.use_smooth = False
    return ob


# ------------------------------------------------------------ blade
RINGS, SIDE = 240, 26  # rings along the length, cross-section points per side


def center(u):
    """Slightly curved axis: nearly straight at the start, bends towards the spine near the tip (K2: not fully curved yet)."""
    x = u * BLADE_LEN
    return Vector((x, 0, .070 * u ** 2.3))


def center_normal(u):
    a, b = center(max(u - .003, 0)), center(min(u + .003, 1))
    t = (b - a).normalized()
    return Vector((-t.z, 0, t.x))


def width(u):
    """(spine offset, edge offset) from the axis. Step (false edge) at about u=.84; K1: 'step'."""
    ws = .022 - .0030 * u                      # spine side
    we = .028 - .0065 * u                      # edge side
    if u > .84:                                # yelman: the spine drops with a small step
        k = (u - .84) / .16
        ws -= .0035 * min(1, (u - .84) / .006) + .0195 * k ** 1.35
    if u > .80:
        k = (u - .80) / .20
        we *= (1 - k ** 2.2) ** .9
    if u >= .999:
        return -.0005, .0005
    return ws, we


def section_half_thickness(u, s):
    """s: 0 spine, 1 edge. Wide spine, thinning towards the edge, the two fullers seen in K1."""
    t0 = (.0042 - .0016 * u) * (1 - max(0, u - .84) / .16 * .72)
    y = t0 * max(1 - s, 0) ** .72 + .00018
    # Wide fuller: from the hilt towards the tip (up to u .96), s .17-.61
    if .012 < u < .96:
        k = (s - .17) / .44
        if 0 < k < 1:
            end = min(1, (u - .012) / .02) * min(1, (.96 - u) / .05)
            y -= t0 * .34 * math.sin(k * math.pi) ** .6 * end
    # Spine fuller: up to the step, s .025-.125
    if .012 < u < .835:
        k = (s - .025) / .10
        if 0 < k < 1:
            end = min(1, (u - .012) / .02) * min(1, (.835 - u) / .012)
            y -= t0 * .20 * math.sin(k * math.pi) ** .7 * end
    return max(y, .00012)


def blade_point(u, s, side, extra=0.0):
    c, n = center(u), center_normal(u)
    ws, we = width(u)
    p = c + n * (ws - s * (ws + we))
    return Vector((p.x, side * (section_half_thickness(u, s) + extra), p.z))


def s_layout():
    """Dense sampling near the edge and the spine."""
    return [(.5 - .5 * math.cos(math.pi * i / (SIDE - 1))) ** 1.05 for i in range(SIDE)]


def blade_mesh(collection):
    bm = bmesh.new(); uv = bm.loops.layers.uv.new('UVMap'); uv2 = bm.loops.layers.uv.new('Forge')
    S = s_layout(); M2 = 2 * SIDE - 2  # ring: upper side spine to edge, lower side edge to spine
    rings = []
    for j in range(RINGS):
        u = j / (RINGS - 1); ring = []
        for i in range(SIDE): ring.append(bm.verts.new(blade_point(u, S[i], 1)))
        for i in range(SIDE - 2, 0, -1): ring.append(bm.verts.new(blade_point(u, S[i], -1)))
        rings.append(ring)
    for j in range(RINGS - 1):
        u0, u1 = j / (RINGS - 1), (j + 1) / (RINGS - 1)
        for i in range(M2):
            k = (i + 1) % M2
            f = bm.faces.new((rings[j][i], rings[j + 1][i], rings[j + 1][k], rings[j][k]))
            for lo, (uu, ii) in zip(f.loops, ((u0, i), (u1, i), (u1, k if k else M2), (u0, k if k else M2))):
                sv = S[ii] if ii < SIDE else S[M2 - ii] if ii < M2 else S[0]
                lo[uv].uv = (uu, 1 - sv)
                lo[uv2].uv = (uu, ii / M2)
            f.smooth = True
    bm.faces.new(list(reversed(rings[0])))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    ob = make_object('Blade', bm, M['blade'], collection)
    # Keep the spine and edge lines sharp; fullers smooth.
    bpy.context.view_layer.objects.active = ob; ob.select_set(True)
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(38)); ob.select_set(False)
    return ob


def inlay_mesh(collection):
    """Very thin gold shell over the blade; the band covers only s .13-.66."""
    bm = bmesh.new(); uv = bm.loops.layers.uv.new('UVMap')
    N, K = 200, 16; us = [.012 + (.90 - .012) * j / (N - 1) for j in range(N)]; ss = [.13 + .53 * i / (K - 1) for i in range(K)]
    for side in (1, -1):
        grid = [[bm.verts.new(blade_point(u, s, side, .00016)) for s in ss] for u in us]
        for j in range(N - 1):
            for i in range(K - 1):
                q = (grid[j][i], grid[j + 1][i], grid[j + 1][i + 1], grid[j][i + 1])
                f = bm.faces.new(q if side < 0 else tuple(reversed(q)))
                ks = ((j, i), (j + 1, i), (j + 1, i + 1), (j, i + 1))
                for lo, (a, b) in zip(f.loops, ks if side < 0 else tuple(reversed(ks))):
                    lo[uv].uv = (us[a], 1 - ss[b])
                f.smooth = True
    return make_object('Blade_Inlay', bm, M['inlay'], collection)


# ------------------------------------------------------------ guard (plane: arms Z, langets X)
def guard_mesh(collection):
    """Cross-shaped guard with thick arms that flare at the ends (K1, proportions from the photograph)."""
    def arm(dirn, length, g0, g1, tip):
        """Half outline of one arm; dirn=(ax,az) direction, length the arm length."""
        ax, az = dirn; px, pz = az, -ax  # outline runs counter-clockwise; does not self-intersect
        return [(ax * d + px * g, az * d + pz * g) for d, g in (
            (0.022, g0), (length * .55, g0 * .78), (length * .86, g1 * .80), (length * .96, g1), (length, g1 * .78))] + \
            [(ax * (length + tip), az * (length + tip))] + \
            [(ax * d - px * g, az * d - pz * g) for d, g in ((length, g1 * .78), (length * .96, g1), (length * .86, g1 * .80), (length * .55, g0 * .78), (0.022, g0))]
    outline = []
    outline += arm((1, 0), .044, .0165, .0105, .012)    # langet towards the blade (pointed)
    outline += arm((0, 1), .092, .0130, .0205, .002)    # spine arm
    outline += arm((-1, 0), .010, .0165, .0150, .002)   # langet towards the hilt (short: the ivory starts right away)
    outline += arm((0, -1), .092, .0130, .0205, .002)   # edge arm
    for _ in range(3):  # Chaikin: soften corners like handwork
        new = []
        for i in range(len(outline)):
            a, b = outline[i], outline[(i + 1) % len(outline)]
            new += [(a[0] * .75 + b[0] * .25, a[1] * .75 + b[1] * .25), (a[0] * .25 + b[0] * .75, a[1] * .25 + b[1] * .75)]
        outline = new
    bm = bmesh.new(); uv = bm.loops.layers.uv.new('UVMap'); T = .0105
    OL = .117  # texture half-width: arm tip at ~430/512 in the texture
    def uvn(x, z): return (.5 + z / OL * .5 * .92, .5 + x / OL * .5 * .92)
    top = [bm.verts.new((x, T, z)) for x, z in outline]; bottom = [bm.verts.new((x, -T, z)) for x, z in outline]
    tris = tessellate_polygon([[Vector((x, z, 0)) for x, z in outline]])
    for a, b, c in tris:
        for f in (bm.faces.new((top[a], top[b], top[c])), bm.faces.new((bottom[c], bottom[b], bottom[a]))):
            for lo in f.loops: lo[uv].uv = uvn(lo.vert.co.x, lo.vert.co.z)
    n = len(outline)
    for i in range(n):
        j = (i + 1) % n
        f = bm.faces.new((top[j], top[i], bottom[i], bottom[j]))
        for lo in f.loops: lo[uv].uv = (.04, .04)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    ob = make_object('Guard', bm, M['guard'], collection)
    apply_modifier(ob, 'BEVEL', width=.0030, segments=4, limit_method='ANGLE', angle_limit=math.radians(60), harden_normals=False)
    bpy.context.view_layer.objects.active = ob; ob.select_set(True)
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(50)); ob.select_set(False)
    return ob


# ------------------------------------------------------------ hilt
HILT_LEN = TOTAL - BLADE_LEN - .0  # 20.5 cm, from the guard centre


def hilt_axis(k):
    """k: 0 guard, 1 pommel. Bends slightly towards the edge (−Z) (K2: hilt is angled)."""
    x = -k * HILT_LEN
    return Vector((x, 0, -.016 * k ** 1.9))


def hilt_thickness(k):
    return (.0118 + .0030 * max(0, k - .84) / .16) * (.80 + .20 * min(1, k / .22))


def hilt_plate(name, side, collection):
    """Two plates with a rounded cross-section; the pommel flares and ends cut off (K1)."""
    bm = bmesh.new(); uv = bm.loops.layers.uv.new('UVMap')
    N, K = 72, 14; rings = []
    for j in range(N):
        k = .068 + .932 * j / (N - 1); c = hilt_axis(k)
        gz = .0152 + .0030 * math.sin(k * math.pi) * .3 + .0060 * max(0, k - .84) / .16
        gy = hilt_thickness(k)
        if k > .985: gz *= .92; gy *= .90
        ring = []
        for i in range(K):
            a = -math.pi / 2 + math.pi * i / (K - 1)  # outer half-circle section of the plate
            yy, zz = math.cos(a) * gy, math.sin(a) * gz
            ring.append(bm.verts.new((c.x, side * (yy + .0005), c.z + zz)))
        rings.append(ring)
    for j in range(N - 1):
        for i in range(K - 1):
            q = (rings[j][i], rings[j + 1][i], rings[j + 1][i + 1], rings[j][i + 1])
            f = bm.faces.new(q)
            for lo, (a, b) in zip(f.loops, ((j, i), (j + 1, i), (j + 1, i + 1), (j, i + 1))):
                lo[uv].uv = (a / (N - 1), b / (K - 1) * .5 + (0 if side > 0 else .5))
            f.smooth = True
    # Flat inner face and caps
    inner = []
    for j in range(N): inner.append((rings[j][0], rings[j][K - 1]))
    for j in range(N - 1):
        f = bm.faces.new((inner[j][1], inner[j + 1][1], inner[j + 1][0], inner[j][0]))
        for lo in f.loops: lo[uv].uv = (.5, .25)
    bm.faces.new(rings[0]); bm.faces.new(list(reversed(rings[-1])))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return make_object(name, bm, M['ivory'], collection)


def rivet(i, k, collection):
    c = hilt_axis(k)
    gy = hilt_thickness(k) + .0005
    # Rivet running through along Y: gold ring outside, dark centre (photograph)
    prof = [(0, gy + .0014), (.0030, gy + .0013), (.0034, gy + .0007), (.0060, gy + .0007), (.0066, gy - .0006)]
    bm = bmesh.new(); ring = []
    for r, y in prof:
        ring.append([bm.verts.new((c.x + math.cos(a) * r, y, c.z + math.sin(a) * r)) for a in (t / 28 * math.tau for t in range(28))])
    for j in range(len(ring) - 1):
        for t in range(28):
            f = bm.faces.new((ring[j][t], ring[j][(t + 1) % 28], ring[j + 1][(t + 1) % 28], ring[j + 1][t]))
            f.material_index = 1 if j == 0 else 0
    ring2 = [[bm.verts.new((v.co.x, -v.co.y, v.co.z)) for v in r] for r in ring]
    for j in range(len(ring2) - 1):
        for t in range(28):
            f = bm.faces.new((ring2[j][(t + 1) % 28], ring2[j][t], ring2[j + 1][t], ring2[j + 1][(t + 1) % 28]))
            f.material_index = 1 if j == 0 else 0
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    ob = make_object(f'Rivet_{i}', bm, M['gold'], collection, 35)
    ob.data.materials.append(M['handle'])
    return ob


def handle_mesh(collection):
    """Blade tang, visible before the plates are attached."""
    bm = bmesh.new(); N = 30; ring = []
    for j in range(N):
        k = j / (N - 1) * .96; c = hilt_axis(k); g = .0105 - .0030 * k; t = .0022
        ring.append([bm.verts.new((c.x, y, c.z + z)) for y, z in ((t, g), (-t, g), (-t, -g), (t, -g))])
    for j in range(N - 1):
        for i in range(4):
            bm.faces.new((ring[j][i], ring[j][(i + 1) % 4], ring[j + 1][(i + 1) % 4], ring[j + 1][i]))
    bm.faces.new(ring[0]); bm.faces.new(list(reversed(ring[-1])))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    ob = make_object('Handle', bm, M['handle'], collection, 30)
    box_uv(ob, 8)
    return ob


# ------------------------------------------------------------ sword collection
sc_ = bpy.data.collections.new('Sword'); bpy.context.scene.collection.children.link(sc_)
blade = blade_mesh(sc_); inlay = inlay_mesh(sc_); guard = guard_mesh(sc_); handle = handle_mesh(sc_)
plate1 = hilt_plate('Hilt_Left', 1, sc_); plate2 = hilt_plate('Hilt_Right', -1, sc_)
rivets = [rivet(i + 1, k, sc_) for i, k in enumerate((.20, .42, .64, .86))]
# 'parca' extras keep the values stored in sword.glb.
for ob, d in ((blade, 'namlu'), (inlay, 'kakma'), (guard, 'balcak'), (handle, 'sap'), (plate1, 'kabza'), (plate2, 'kabza')):
    ob['parca'] = d
for p in rivets: p['parca'] = 'percin'


# ------------------------------------------------------------ workshop
wc = bpy.data.collections.new('Workshop'); bpy.context.scene.collection.children.link(wc)


def anvil_outline():
    """Side view (x, z): horn + body + heel + foot."""
    return [(-.31, .262), (-.23, .285), (-.14, .296), (.20, .296), (.26, .290), (.27, .262), (.15, .250),
            (.09, .225), (.075, .13), (.15, .09), (.17, .0), (-.17, .0), (-.15, .09), (-.075, .13), (-.09, .225), (-.16, .248), (-.24, .258)]


def anvil(collection):
    bm = bmesh.new(); h = anvil_outline(); W = .055
    def half_width(x, z):
        if x < -.14: return W * max(.08, (x + .31) / .17) * .75
        if z < .13: return W * (1.25 + (.13 - z) / .13 * 1.0)
        return W
    front = [bm.verts.new((x, half_width(x, z), z)) for x, z in h]; back = [bm.verts.new((x, -half_width(x, z), z)) for x, z in h]
    bm.faces.new(front); bm.faces.new(list(reversed(back)))
    for i in range(len(h)):
        j = (i + 1) % len(h); bm.faces.new((front[j], front[i], back[i], back[j]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    ob = make_object('Anvil', bm, M['iron'], collection)
    apply_modifier(ob, 'BEVEL', width=.008, segments=3, limit_method='ANGLE', angle_limit=math.radians(25))
    box_uv(ob, 3)
    bpy.context.view_layer.objects.active = ob; ob.select_set(True)
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(42)); ob.select_set(False)
    return ob


# Layout: forge -X, anvil centre, water right, sharpening stone back. Ground plane Z=0.
floor = box('Floor', (9, 8, .1), (0, 0, -.05), M['stone'], wc, uv=.28)
for name, b, k in (('Wall_Back', (9, .3, 4.2), (0, 3.2, 2.1)), ('Wall_Left', (.3, 8, 4.2), (-4.4, 0, 2.1)), ('Wall_Right', (.3, 8, 4.2), (4.4, 0, 2.1))):
    box(name, b, k, M['brick'], wc, uv=.45)
# Forge: brick body, ember bed, hood
ox, oy = -2.25, 2.1
box('Hearth_Body', (1.9, 1.3, .86), (ox, oy, .43), M['brick'], wc, .012, .75)
box('Hearth_Mouth', (1.5, .92, .10), (ox, oy - .08, .865), M['iron'], wc, .004, .9)
for name, d in (('Hearth_Side_Left', -.8), ('Hearth_Side_Right', .8)):
    box(name, (.26, 1.3, 1.35), (ox + d, oy, 1.42), M['brick'], wc, .012, .75)
box('Hearth_Back', (1.9, .26, 1.35), (ox, oy + .52, 1.42), M['brick'], wc, .012, .75)
box('Hood', (2.1, 1.5, .4), (ox, oy, 2.28), M['brick'], wc, .02, .75)
box('Chimney', (.95, .85, 1.5), (ox, oy + .1, 3.2), M['brick'], wc, .012, .75)
# Ember bed: clustered ember stones
bm = bmesh.new(); bed_uv = bm.loops.layers.uv.new('UVMap')
import random
random.seed(1453)
for _ in range(240):
    ico = bmesh.ops.create_icosphere(bm, subdivisions=1, radius=random.uniform(.028, .058))
    x, y = random.uniform(-.68, .68), random.uniform(-.40, .40)
    for v in ico['verts']:
        v.co = Vector((v.co.x * random.uniform(.8, 1.25) + x, v.co.y * random.uniform(.8, 1.25) + y, v.co.z * .8))
kor = make_object('Embers', bm, M['embers'], wc)
kor.location = (ox, oy - .08, .935); box_uv(kor, 5)
# Bellows: two wooden boards, leather bellows, pipe
bm = bmesh.new(); ring = []
for j, (w, z) in enumerate(((.26, 0), (.27, .05), (.22, .10), (.28, .15), (.22, .20), (.27, .25), (.26, .30))):
    ring.append([bm.verts.new((sx * w * (1 if sx > 0 else 1.25), sy * w * .72, z)) for sx, sy in ((-1, -1), (1, -.3), (1, .3), (-1, 1))])
for j in range(len(ring) - 1):
    for i in range(4):
        bm.faces.new((ring[j][i], ring[j][(i + 1) % 4], ring[j + 1][(i + 1) % 4], ring[j + 1][i]))
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
kx, ky = -3.7, 1.75
bellows_leather = make_object('Bellows_Leather', bm, M['leather'], wc, 32); bellows_leather.location = (kx, ky, .62); box_uv(bellows_leather, 2)
box('Bellows_Bottom', (.72, .44, .04), (kx, ky, .60), M['wood'], wc, .004, 1.5)
box('Bellows_Top', (.72, .44, .04), (kx, ky, .94), M['wood'], wc, .004, 1.5)
box('Bellows_Stand', (.56, .36, .58), (kx, ky, .29), M['wood'], wc, .006, 1.5)
lathe('Bellows_Pipe', [(.035, 0), (.035, .55)], M['iron'], 16, wc, axis='X').location = (kx + .32, ky + .0, .78)
# Anvil and log
lathe('Anvil_Log', [(.0, 0), (.30, 0), (.31, .03), (.28, .30), (.285, .55), (.29, .58), (.0, .58)], M['wood'], 40, wc, 2.6, .9).location = (0, .1, 0)
anvil_ob = anvil(wc); anvil_ob.location = (0, .1, .58)
# Hammer: handle + head
bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
for v in bm.verts: v.co = Vector((v.co.x * .14, v.co.y * .058, v.co.z * .058))
hammer_head = make_object('Hammer_Head', bm, M['iron'], wc); apply_modifier(hammer_head, 'BEVEL', width=.007, segments=3); box_uv(hammer_head, 4)
hammer_handle = lathe('Hammer_Handle', [(.0, -.38), (.017, -.378), (.019, -.20), (.015, -.02), (.015, .018), (.0, .018)], M['wood'], 16, wc, .5, 2)
hammer_handle.parent = hammer_head
hammer_head.location = (.13, .1, .91); hammer_head.rotation_euler = (math.radians(90), 0, math.radians(14))
# Tongs: two arms and jaws
def tongs(name, side):
    bm = bmesh.new(); path = [(-.62, .020 * side), (-.1, .012 * side), (0, -.006 * side), (.16, -.009 * side), (.17, .0)]
    ring = [[bm.verts.new((x, y + dy, dz)) for dy, dz in ((.006, .006), (-.006, .006), (-.006, -.006), (.006, -.006))] for x, y in path]
    for j in range(len(ring) - 1):
        for i in range(4):
            bm.faces.new((ring[j][i], ring[j][(i + 1) % 4], ring[j + 1][(i + 1) % 4], ring[j + 1][i]))
    bm.faces.new(ring[0]); bm.faces.new(list(reversed(ring[-1])))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    ob = make_object(name, bm, M['iron'], wc, 40); box_uv(ob, 4); return ob
t1 = tongs('Table_1', 1); t2 = tongs('Table_2', -1); t2.parent = t1
t1.location = (-1.95, 1.42, .92); t1.rotation_euler = (0, 0, math.radians(68))
# Workbench
box('Bench_Top', (1.6, .62, .07), (2.9, 2.5, .86), M['wood'], wc, .006, 1.2)
for x in (-.7, .7):
    for y in (-.24, .24):
        box('Bench_Leg', (.09, .09, .84), (2.9 + x, 2.5 + y, .42), M['wood'], wc, .004, 1.2)
# Water trough: outer walls, inner hollow, water
sx, sy = 1.95, -.15
for name, b, k in (('Trough_Long_1', (1.5, .06, .46), (sx, sy - .29, .26)), ('Trough_Long_2', (1.5, .06, .46), (sx, sy + .29, .26)),
                   ('Trough_Short_1', (.06, .64, .46), (sx - .72, sy, .26)), ('Trough_Short_2', (.06, .64, .46), (sx + .72, sy, .26)),
                   ('Trough_Base', (1.5, .64, .05), (sx, sy, .05))):
    box(name, b, k, M['wood'], wc, .004, 1.4)
box('Water', (1.38, .52, .01), (sx, sy, .40), M['water'], wc)
# Sharpening stone: frame + rotating stone
bx, by = 3.05, 1.2
stone_wheel = lathe('Sharpen_Stone', [(.0, -.06), (.36, -.06), (.375, -.05), (.375, .05), (.36, .06), (.0, .06)], M['sharpen'], 72, wc, 3, 5)
stone_wheel.rotation_euler = (math.radians(90), 0, 0); stone_wheel.location = (bx, by, .82)
for d in (-.12, .12):
    for x in (-.28, .28):
        leg = box('Sharpen_Leg', (.07, .07, .80), (bx + x, by + d, .40), M['wood'], wc, .004, 1.2)
box('Sharpen_Arm', (.03, .03, .34), (bx, by + .19, .82), M['iron'], wc, .003, 2)
# Ingot (sword egg): unforged, oval, K2
bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=4, radius=1)
for v in bm.verts:
    v.co = Vector((v.co.x * .085, v.co.y * .048, v.co.z * .040))
ingot = make_object('Sword_Egg', bm, M['ingot'], wc, 180); ingot.location = (2.8, 2.5, .93); box_uv(ingot, 6)
# 'atolye' extra keeps the key stored in sword-workshop.glb.
for ob in wc.objects: ob['atolye'] = True

# ------------------------------------------------------------ test area
tc = bpy.data.collections.new('Test'); bpy.context.scene.collection.children.link(tc)
tx = 14.0
box('Courtyard_Floor', (9, 8, .1), (tx, 0, -.05), M['stone'], tc, uv=.28)
box('Courtyard_Wall', (9, .4, 3.3), (tx, 3.4, 1.65), M['brick'], tc, uv=.45)
# Straw roll: pedestal + post + roll
lathe('Straw_Pedestal', [(.0, 0), (.22, 0), (.20, .08), (.04, .10), (.0, .10)], M['wood'], 28, tc, 2, 2).location = (tx - 2.0, 0, 0)
sr = lathe('Straw_Roll', [(.0, 0), (.075, .0), (.075, 1.05), (.0, 1.05)], M['straw'], 28, tc, 3, 8); sr.location = (tx - 2.0, 0, .55)
lathe('Straw_Post', [(.016, 0), (.016, .75)], M['wood'], 12, tc).location = (tx - 2.0, 0, .08)
for i, z in enumerate((.1, .5, .9)):
    lathe(f'Straw_Link_{i}', [(.0765, 0), (.0775, .004), (.0775, .018), (.0765, .022)], M['rope'], 28, tc).location = (tx - 2.0, 0, .55 + z)
# Log: horizontal on a sawhorse
tl = lathe('Test_Log', [(.0, -.45), (.11, -.45), (.115, -.40), (.105, 0), (.115, .40), (.11, .45), (.0, .45)], M['wood'], 28, tc, 2, 2, axis='X'); tl.location = (tx, .1, .74)
for d in (-.34, .34):
    box('Log_Leg', (.08, .36, .62), (tx + d, .1, .31), M['wood'], tc, .004, 1.2)
# Hanging cloth: frame + cloth
box('Cloth_Stanchion_1', (.07, .07, 2.0), (tx + 1.65, .1, 1.0), M['wood'], tc, .004, 1.2)
box('Cloth_Stanchion_2', (.07, .07, 2.0), (tx + 2.65, .1, 1.0), M['wood'], tc, .004, 1.2)
box('Cloth_Beam', (1.14, .07, .07), (tx + 2.15, .1, 1.98), M['wood'], tc, .004, 1.2)
bm = bmesh.new(); uv = bm.loops.layers.uv.new('UVMap'); A, B = 32, 44
grid = [[bm.verts.new((-.42 + .84 * i / (A - 1), .018 * math.sin(i / 2.2 + j / 9) * (.4 + .6 * j / (B - 1)), -1.3 * j / (B - 1))) for i in range(A)] for j in range(B)]
for j in range(B - 1):
    for i in range(A - 1):
        f = bm.faces.new((grid[j][i], grid[j + 1][i], grid[j + 1][i + 1], grid[j][i + 1]))
        for lo, (a, b) in zip(f.loops, ((i, j), (i, j + 1), (i + 1, j + 1), (i + 1, j))):
            lo[uv].uv = (a / (A - 1), 1 - b / (B - 1))
        f.smooth = True
cloth_ob = make_object('Test_Cloth', bm, M['cloth'], tc); cloth_ob.location = (tx + 2.15, .1, 1.95)
cloth_ob.data.materials[0].use_backface_culling = False
for ob in tc.objects: ob['test'] = True


# ------------------------------------------------------------ export
def export(path, collections):
    bpy.ops.object.select_all(action='DESELECT')
    for c in collections:
        for ob in c.objects: ob.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(path), export_format='GLB', use_selection=True, export_apply=True, export_extras=True,
                              export_image_format='WEBP', export_image_quality=86, export_tangents=False, export_yup=True)
    print('GLB', path, round(path.stat().st_size / 1e6, 1), 'MB')


(ROOT / 'assets' / 'kilic').mkdir(parents=True, exist_ok=True); (ROOT / 'public' / 'models').mkdir(parents=True, exist_ok=True)
export(ROOT / 'public' / 'models' / 'sword.glb', [sc_])
export(ROOT / 'public' / 'models' / 'sword-workshop.glb', [wc, tc])
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'assets' / 'kilic' / 'kilic.blend'), compress=True)

# ------------------------------------------------------------ preview (optional): Cycles
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
if '--preview' in argv:
    out = Path(argv[argv.index('--preview') + 1]); out.mkdir(parents=True, exist_ok=True)
    sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.samples = 96; sc.cycles.use_denoising = True
    try:
        pr = bpy.context.preferences.addons['cycles'].preferences; pr.compute_device_type = 'OPTIX'; pr.get_devices()
        for d in pr.devices: d.use = True
        sc.cycles.device = 'GPU'
    except Exception as e:
        print('No GPU:', e)
    sc.render.resolution_x, sc.render.resolution_y = 1600, 900
    sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Medium High Contrast'
    w = bpy.data.worlds.new('D'); sc.world = w; w.use_nodes = True
    w.node_tree.nodes['Background'].inputs[0].default_value = (.05, .055, .065, 1); w.node_tree.nodes['Background'].inputs[1].default_value = 1.0
    def light(name, kind, loc, power, size=1.0, color=(1, 1, 1), target=None):
        li = bpy.data.lights.new(name, kind); li.energy = power; li.color = color
        if kind == 'AREA': li.size = size
        ob = bpy.data.objects.new(name, li); sc.collection.objects.link(ob); ob.location = loc
        if target is not None: ob.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
        return ob
    def camera(loc, target, lens):
        cam = bpy.data.cameras.new('K'); cam.lens = lens
        ob = bpy.data.objects.new('K', cam); sc.collection.objects.link(ob); ob.location = loc
        ob.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler(); sc.camera = ob
        return ob
    def show(colls):
        for c in (sc_, wc, tc):
            c.hide_render = c not in colls
    def render(name):
        sc.render.filepath = str(out / f'{name}.png'); bpy.ops.render.render(write_still=True); print('render', name)
    # Workshop scene (natural placement) and sword separately: show the sword in a studio, away from the workshop
    show([sc_])
    light('Key', 'AREA', (.45, -1.1, .95), 34, 2.4, (1, .95, .88), (.35, 0, 0))
    light('Strip', 'AREA', (.5, -.25, 1.05), 26, 2.6, (1, 1, 1), (.5, 0, 0))
    light('Rim', 'AREA', (.2, 1.0, .5), 25, 1.6, (.8, .88, 1), (.2, 0, 0))
    camera((.26, -1.75, .08), (.27, 0, .02), 40); render('sword_full')
    camera((-.08, -.42, .0), (-.04, 0, .0), 50); render('sword_hilt')
    camera((.92, -.26, .09), (.93, 0, .06), 50); render('sword_tip')
    for ob in list(sc.collection.objects):
        if ob.type in ('LIGHT', 'CAMERA'): sc.collection.objects.unlink(ob)
    show([wc])
    forge_light = light('Forge', 'POINT', (-2.25, 2.0, 1.25), 90, color=(1, .42, .12))
    light('Window', 'AREA', (2.2, -3.2, 3.6), 520, 5, (.72, .82, 1), (.3, .5, .4))
    light('Fill', 'POINT', (.5, -.9, 1.5), 26, color=(1, .72, .5))
    camera((1.3, -3.25, 1.5), (-.25, .85, .75), 28); render('workshop')
    camera((.75, -1.15, 1.25), (.02, .1, .78), 45); render('anvil_close')
    for ob in list(sc.collection.objects):
        if ob.type in ('LIGHT', 'CAMERA'): sc.collection.objects.unlink(ob)
    show([tc])
    light('Sun', 'SUN', (tx, -2, 6), 3.5, color=(1, .94, .85), target=(tx + 1, 1, 0))
    camera((tx, -3.9, 1.55), (tx, .3, .95), 30); render('test_area')
print('Sword models done.')
