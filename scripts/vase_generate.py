"""Özgün KökXR seramik vazosu. Blender 4.5: blender -b --python scripts/vazo_uret.py"""
import math
from pathlib import Path
import bpy
import bmesh
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def linear(c):
    return c / 12.92 if c < .04045 else ((c + .055) / 1.055) ** 2.4

def material(name, hexcolor, roughness, metallic=0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    color = tuple(linear(int(hexcolor[i:i+2], 16)/255) for i in (0,2,4)) + (1,)
    m.diffuse_color = color
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = color
    p.inputs['Roughness'].default_value = roughness
    p.inputs['Metallic'].default_value = metallic
    p.inputs['Coat Weight'].default_value = .25 if roughness < .4 else 0
    return m

materials = [material('Yesil seramik sir', '4e8b7d', .27), material('Krem bezeme', 'e3d4b0', .36), material('Koyu yesil motif', '28554c', .32), material('Ham seramik kirik yuzey', 'bd9874', .88), material('Agiz ve taban seridi', 'b99b62', .36, .12)]
profile = [(0,6.5),(1,7),(2,7.4),(4,8),(7,10.8),(11,14),(16,16),(21,16.2),(25,14.3),(29,10.3),(33,6.3),(37,5.4),(41,6.7),(43,8),(44,8.2)]

def radius(y):
    for i in range(1, len(profile)):
        y0,r0 = profile[i-1]; y1,r1 = profile[i]
        if y <= y1:
            t = max(0,min(1,(y-y0)/(y1-y0)))
            # Catmull-Rom yumuşak çömlek profili.
            prev=profile[max(i-2,0)][1]; nxt=profile[min(i+1,len(profile)-1)][1]
            return .5*((2*r0)+(-prev+r1)*t+(2*prev-5*r0+4*r1-nxt)*t*t+(-prev+3*r0-3*r1+nxt)*t*t*t)
    return profile[-1][1]

def seam(a):
    return 22 + 2.0*math.sin(a*3+.4) + 1.0*math.sin(a*9+.7)

objects=[]
NU,NV=48,48
for band in range(2):
    for sector in range(3):
        pid=band*3+sector
        vertices=[]; faces=[]; slots=[]
        for inside in (False, True):
            for j in range(NV+1):
                t=j/NV
                for i in range(NU+1):
                    a=sector*math.tau/3+i/NU*math.tau/3
                    bottom=0 if band==0 else seam(a)
                    top=seam(a) if band==0 else 44
                    # Düz bezeme halkaları; yalnız kırık hattına yakın satırlar dalgalanır.
                    if band==0:
                        y=18*j/(NV-8) if j<=NV-8 else 18+(top-18)*(j-(NV-8))/8
                    else:
                        y=bottom+(26-bottom)*j/8 if j<=8 else 26+(44-26)*(j-8)/(NV-8)
                    theta=a+.045*math.sin(y*.7)
                    r=radius(y)-(0.85 if inside else 0)
                    # Z yukarı (Blender); GLB dışa aktarımı Y yukarıya dönüştürür.
                    inner_y=max(y,.85) if inside and band==0 else y
                    vertices.append((math.sin(theta)*r,-math.cos(theta)*r,inner_y))
        layer=(NU+1)*(NV+1)
        for inside in (False,True):
            offset=layer if inside else 0
            for j in range(NV):
                for i in range(NU):
                    a=offset+j*(NU+1)+i; b=a+NU+1
                    faces.append((a,a+1,b+1,b) if not inside else (a,b,b+1,a+1))
                    if inside:
                        slots.append(3)
                    else:
                        x,_,y=vertices[a]
                        theta=sector*math.tau/3+(i+.5)/NU*math.tau/3
                        if y<2 or y>41.8:
                            slots.append(4)
                        elif 8.5<y<10 or 26.5<y<28 or 36.5<y<37.5:
                            slots.append(1)
                        elif 13<y<23 and abs(math.sin(theta*8)) + abs(math.sin((y-13)*.55)) < .8:
                            slots.append(2)
                        else:
                            slots.append(0)
        # Kalınlığı kapatan kırık kenarlar; her parça bağımsız kapalı bir kabuktur.
        for row in (0,NV):
            if row==0 and band==0:
                continue
            for i in range(NU):
                a=row*(NU+1)+i
                faces.append((a,a+1,a+1+layer,a+layer)); slots.append(3)
        for col in (0,NU):
            for j in range(NV):
                a=j*(NU+1)+col; b=a+NU+1
                faces.append((a,b,b+layer,a+layer)); slots.append(3)
        if band==0:
            # Vazoda açık bir alt delik kalmasın: tabanın altı ve iç döşemesi.
            bottom_center=len(vertices); vertices.append((0,0,0))
            inner_center=len(vertices); vertices.append((0,0,.85))
            for i in range(NU):
                faces.append((bottom_center,i+1,i)); slots.append(3)
                faces.append((inner_center,layer+i,layer+i+1)); slots.append(3)
            faces.append((bottom_center,0,layer,inner_center)); slots.append(3)
            faces.append((bottom_center,inner_center,layer+NU,NU)); slots.append(3)
        center=sum((Vector(v) for v in vertices),Vector())/len(vertices)
        mesh=bpy.data.meshes.new(f'Kiriksiz_sinir_{pid+1}')
        mesh.from_pydata([Vector(v)-center for v in vertices], [], faces)
        for m in materials: mesh.materials.append(m)
        for poly,slot in zip(mesh.polygons,slots):
            poly.material_index=slot
            poly.use_smooth = slot != 3
        bm=bmesh.new(); bm.from_mesh(mesh)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        bm.to_mesh(mesh); bm.free()
        obj=bpy.data.objects.new(f'Vazo_Parca_{pid+1:02}',mesh)
        bpy.context.collection.objects.link(obj)
        obj.location=center
        obj['pieceId']=pid
        obj['description']='KokXR icin ozgun tasarim; tarihi eser rekonstruksiyonu degildir.'
        bevel=obj.modifiers.new('Seramik kenar yumusatma','BEVEL')
        bevel.width=.055; bevel.segments=2
        bevel.limit_method='ANGLE'
        objects.append(obj)

# Başlangıç görünümü için kırık sınırları olmayan, çevresi kesintisiz tek kabuk.
# Bu ağ onarımda kullanılmaz; altı kırık parçanın yerine yalnız ilk incelemede görünür.
N=144
levels=[i/4 for i in range(177)]
verts=[]; faces=[]; slots=[]
for inside in (False,True):
    for y in levels:
        for i in range(N):
            theta=i/N*math.tau+.045*math.sin(y*.7)
            r=radius(y)-(.85 if inside else 0)
            verts.append((math.sin(theta)*r,-math.cos(theta)*r,max(y,.85) if inside else y))
layer=N*len(levels)
for inside in (False,True):
    offset=layer if inside else 0
    for j in range(len(levels)-1):
        y=(levels[j]+levels[j+1])/2
        for i in range(N):
            a=offset+j*N+i; b=offset+j*N+(i+1)%N
            c=b+N; d=a+N
            faces.append((a,b,c,d) if not inside else (a,d,c,b))
            theta=(i+.5)/N*math.tau
            slots.append(3 if inside else 4 if y<2 or y>41.8 else 1 if 8.5<y<10 or 26.5<y<28 or 36.5<y<37.5 else 2 if 13<y<23 and abs(math.sin(theta*8))+abs(math.sin((y-13)*.55))<.8 else 0)
for i in range(N):
    a=(len(levels)-1)*N+i; b=(len(levels)-1)*N+(i+1)%N
    faces.append((a,a+layer,b+layer,b)); slots.append(4)
bottom_center=len(verts); verts.append((0,0,0))
inner_center=len(verts); verts.append((0,0,.85))
for i in range(N):
    nxt=(i+1)%N
    faces.append((bottom_center,nxt,i)); slots.append(3)
    faces.append((inner_center,layer+i,layer+nxt)); slots.append(3)
mesh=bpy.data.meshes.new('Kesintisiz_saglam_seramik')
mesh.from_pydata(verts,[],faces)
for m in materials: mesh.materials.append(m)
for poly,slot in zip(mesh.polygons,slots):
    poly.material_index=slot
    poly.use_smooth=slot!=3
bm=bmesh.new(); bm.from_mesh(mesh)
bmesh.ops.recalc_face_normals(bm,faces=bm.faces)
bm.to_mesh(mesh); bm.free()
intact=bpy.data.objects.new('Vazo_Saglam',mesh)
intact['intact']=True
bpy.context.collection.objects.link(intact)
objects.append(intact)

# Tamamlanan onarımda görünen ince birleşim çizgileri; hedef yardımı değildir.
curve=bpy.data.curves.new('Onarim_birlesim_cizgileri','CURVE')
curve.dimensions='3D'; curve.bevel_depth=.075; curve.bevel_resolution=2
curve.use_fill_caps=True
def line(points,closed=False):
    spline=curve.splines.new('POLY')
    spline.points.add(len(points)-1)
    for p,v in zip(spline.points,points): p.co=(*v,1)
    spline.use_cyclic_u=closed
def surface_point(a,y):
    theta=a+.045*math.sin(y*.7)
    r=radius(y)+.025
    return (math.sin(theta)*r,-math.cos(theta)*r,y)
line([surface_point(i/288*math.tau,seam(i/288*math.tau)) for i in range(288)],True)
for sector in range(3):
    line([surface_point(sector*math.tau/3,i/4) for i in range(177)])
curve.materials.append(material('Onarim izi - sicak bronz','a98451',.55))
marks=bpy.data.objects.new('Onarim_Izleri',curve)
bpy.context.collection.objects.link(marks)
bpy.ops.object.select_all(action='DESELECT')
marks.select_set(True); bpy.context.view_layer.objects.active=marks
bpy.ops.object.convert(target='MESH')
marks=bpy.context.object
marks['repairMarks']=True
objects.append(marks)

bpy.context.scene.unit_settings.system='METRIC'
bpy.context.scene['model_note']='KokXR ozgun temsili vazo; ucuncu taraf model veya doku kullanilmadi.'
bpy.ops.object.select_all(action='DESELECT')
for obj in objects: obj.select_set(True)
bpy.context.view_layer.objects.active=objects[0]
(ROOT/'assets/vazo').mkdir(parents=True,exist_ok=True)
(ROOT/'public/modeller').mkdir(parents=True,exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'assets/vazo/vazo.blend'))
bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/modeller/vazo.glb'),export_format='GLB',use_selection=True,export_extras=True,export_apply=True,export_cameras=False,export_lights=False)
print('KOKXR: izsiz saglam vazo, 6 kalinlikli parca ve onarim izleri; .blend ve .glb hazir.')
