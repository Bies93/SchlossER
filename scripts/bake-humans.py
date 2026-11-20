"""Blender background build: licensed hm08 anatomy, fitted outfits and real weights."""
import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from pathlib import Path
from collections import defaultdict
from functools import lru_cache
import gzip
import json
import math
import numpy as np
import re

REPO=Path(__file__).resolve().parents[1]
SRC=REPO/'dist'/'human-source'
OUT=REPO/'assets'/'human-cast.glb'
RIG=json.loads((SRC/'rig.game_engine.json').read_text(encoding='utf-8'))
for s in ['l','r']:RIG['eye_'+s]={'head':{'cube_name':'joint-'+s+'-eye','default_position':[0,0,0]},'parent':'head'}
raw_weight=json.loads((SRC/'weights.game_engine.json').read_text(encoding='utf-8'))['weights']
FACE={'JawOpen':'mouth-open','BlinkL':'eye-left-closure','BlinkR':'eye-right-closure',
      'Smile':'mouth-corner-puller','Purse':'mouth-pursing','BrowL':'eyebrows-left-up','BrowR':'eyebrows-right-up'}

@lru_cache(None)
def obj(path):
    vertices=[]; uv=[]; faces=[]; group=''; groups=defaultdict(set)
    for l in path.read_text(encoding='utf-8').splitlines():
        k,_,s=l.strip().partition(' ')
        if k=='v': vertices.append(tuple(map(float,s.split()[:3])))
        if k=='vt': uv.append(tuple(map(float,s.split()[:2])))
        if k=='g': group=s.strip()
        if k=='f':
            poly=[tuple(int(i)-1 for i in x.split('/')[:2]) for x in s.split()]
            groups[group].update(v[0] for v in poly)
            faces.append((group,poly))
    return np.array(vertices),uv,faces,groups

BASE,UV,FACES,GROUPS=obj(SRC/'base.obj')
W=[{} for _ in BASE]
for name,entries in raw_weight.items():
    if name not in RIG:continue
    for i,w in entries:W[i][name]=w

@lru_cache(None)
def delta(name):
    p=SRC/(name+'.target.gz')
    d=np.zeros_like(BASE)
    if p.exists():
        for l in gzip.open(p,'rt'):
            a=l.split()
            if len(a)==4 and a[0].isdigit():d[int(a[0])]=tuple(map(float,a[1:]))
    return d

@lru_cache(None)
def proxy(path):
    rows=[]; deletes=set(); mode='';scale=[]
    for l in path.read_text(encoding='utf-8-sig').splitlines():
        a=l.split()
        if not a or a[0].startswith('#'):continue
        if a[0] in ['x_scale','y_scale','z_scale']:
            scale.append(('xyz'.index(a[0][0]),int(a[1]),int(a[2]),float(a[3])));continue
        if a[0] in ['verts','delete_verts']:mode=a[0];continue
        if not a[0].lstrip('-').isdigit():continue
        if mode=='verts':
            if len(a)==1:rows.append(((int(a[0]),),[1.],[0.,0.,0.]))
            else:rows.append((tuple(map(int,a[:3])),list(map(float,a[3:6])),list(map(float,a[6:9]))))
        if mode=='delete_verts':
            i=0
            while i<len(a):
                if i+2<len(a) and a[i+1]=='-':
                    deletes.update(range(int(a[i]),int(a[i+2])+1));i+=3
                else:deletes.add(int(a[i]));i+=1
    ids=np.array([list(i)+[i[0]]*(3-len(i)) for i,_,_ in rows],dtype=int)
    strength=np.array([w+[0.]*(3-len(w)) for _,w,_ in rows])
    offsets=np.array([v for _,_,v in rows])
    return ids,strength,offsets,deletes,scale

def weights_for(ids,coef):
    w=defaultdict(float)
    for i,c in zip(ids,coef):
        for n,a in W[i].items():w[n]+=max(0,c)*a
    return w

def to_b(v,floor):
    x,y,z=v
    return (x*.1,-z*.1,(y-floor)*.1)

@lru_cache(None)
def texture(path,alpha,size):
    im=bpy.data.images.load(str(path),check_existing=False)
    if max(im.size)>size:
        sc=size/max(im.size);im.scale(max(1,round(im.size[0]*sc)),max(1,round(im.size[1]*sc)))
    return im

@lru_cache(None)
def material(name,image=None,alpha=False,rough=.69,col=(.45,.42,.36,1),metal=0.):
    m=bpy.data.materials.new(name);m.use_nodes=True;m.diffuse_color=col
    tree=m.node_tree;b=tree.nodes.get('Principled BSDF')
    b.inputs['Base Color'].default_value=col;b.inputs['Roughness'].default_value=rough;b.inputs['Metallic'].default_value=metal
    if image and image.exists():
        tex=tree.nodes.new('ShaderNodeTexImage');tex.image=texture(image,alpha,960 if not alpha else 512)
        tree.links.new(tex.outputs['Color'],b.inputs['Base Color'])
        if alpha:
            tree.links.new(tex.outputs['Alpha'],b.inputs['Alpha']);m.surface_render_method='DITHERED'
    return m

def surface(name,coords,uv,faces,weights,rig,mat,floor,shapes=None):
    if not faces: return None
    used=sorted({i for p in faces for i,u in p}); remap={v:i for i,v in enumerate(used)}
    mesh=bpy.data.meshes.new(name);mesh.from_pydata([to_b(coords[i],floor) for i in used],[],[[remap[i] for i,u in f] for f in faces]);mesh.update()
    layer=mesh.uv_layers.new(name='UVMap')
    for poly,face in zip(mesh.polygons,faces):
        poly.use_smooth=True
        for j,(_,u) in zip(poly.loop_indices,face):layer.data[j].uv=uv[u] if uv else (0,0)
    ob=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(ob);ob.parent=rig
    mesh.materials.append(mat)
    vg={n:ob.vertex_groups.new(name=n) for n in RIG}
    for j,i in enumerate(used):
        ww=sorted(weights[i].items(),key=lambda k:-k[1])[:4]; total=sum(max(0,w) for n,w in ww)
        if total<1e-8:ww=[('head',1.)];total=1.
        for n,w in ww:
            if w>0:vg[n].add([j],w/total,'REPLACE')
    mod=ob.modifiers.new('Humanoid','ARMATURE');mod.object=rig
    if shapes:
        ob.shape_key_add(name='Basis')
        for n,array in shapes.items():
            sk=ob.shape_key_add(name=n)
            for j,i in enumerate(used):sk.data[j].co=to_b(array[i],floor)
    return ob

def joint(point,base):
    if point.get('cube_name') in GROUPS:return base[list(GROUPS[point['cube_name']])].mean(axis=0)
    if 'vertex_indices' in point:return base[point['vertex_indices']].mean(axis=0)
    x,y,z=point['default_position'];return np.array([10*x,10*z,-10*y])

def armature(name,base,floor):
    data=bpy.data.armatures.new(name)
    o=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(o)
    bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
    for n,d in RIG.items():
        b=data.edit_bones.new(n)
        b.head=to_b(joint(d['head'],base),floor) if n!='Root' else (0,0,0)
        # Bone frames deliberately coincide in world space: identical Three.js
        # local axes across body sizes. Heads and skin weights remain anatomical.
        b.tail=b.head+Vector((0,0,.075));b.align_roll(Vector((0,-1,0)))
    for n,d in RIG.items():
        if d['parent']:data.edit_bones[n].parent=data.edit_bones[d['parent']]
    bpy.ops.object.mode_set(mode='OBJECT');o.select_set(False)
    return o

def fitted(path,base):
    ids,c,offs,mask,scale=proxy(path)
    sc=np.ones(3)
    for ax,a,b,ref in scale:sc[ax]=abs(base[a,ax]-base[b,ax])/abs(ref)
    return (base[ids]*c[:,:,None]).sum(axis=1)+offs*sc,mask,[weights_for(i,v) for i,v in zip(ids,c)]

def image_in(where):
    return next(iter(sorted(where.glob('*.png'))),None)

def item(path,base,floor,rig,kind,label,facemorph=False):
    name=path.name
    coords,mask,weights=fitted(path/(name+'.mhclo'),base)
    source,uv,faces,_=obj(path/(name+'.obj'))
    if len(source)!=len(coords):raise ValueError(name+' vertices mismatch')
    mat=material(kind+'_'+name,image_in(path),alpha=kind in ['Hair','Brow'],rough=.74 if kind=='Cloth' else .57)
    shapes={n:fitted(path/(name+'.mhclo'),base+delta(t))[0] for n,t in FACE.items() if n.startswith('Brow')} if facemorph else None
    surface(label,coords,uv,[p for g,p in faces],weights,rig,mat,floor,shapes)
    return mask

def accessory(name,points,faces,rig,mat,floor,bone):
    return surface(name,points,[],[[(i,0) for i in p] for p in faces],[{bone:1.} for _ in points],rig,mat,floor)

def shirt_front(shirt,base):
    points=fitted(shirt,base)[0]
    _,_,faces,_=obj(shirt.with_suffix('.obj'))
    tree=BVHTree.FromPolygons(points,[[i for i,_ in p] for _,p in faces])
    def front(x,y):
        loc,_,_,_=tree.ray_cast(Vector((x,y,6)),Vector((0,0,-1)),7.0)
        return loc.z if loc else 0.92
    return front

def garment_panel(name,outline,rig,floor,front,mat,bone='spine_03',offset=.055):
    points=[[x,y,front(x,y)+offset] for x,y in outline]
    x,y=np.mean(outline,axis=0)
    points.append([x,y,front(x,y)+offset+.019])
    n=len(outline)
    return accessory(name,points,[(i,(i+1)%n,n) for i in range(n)],rig,mat,floor,bone)

def helmet(rig,base,floor,steel):
    v=base[list(GROUPS['body'])]
    top=v[:,1].max();core=v[v[:,1]>top-1.24]
    z=(core[:,2].max()+core[:,2].min())*.5
    w=max(abs(core[:,0]))+(.200 if steel else .22);d=(core[:,2].max()-core[:,2].min())*.5+.22
    rings=[[-.94,.98],[-.907,1.008],[-.863,1.017],[-.81,1.005],[-.73,.973],[-.52,.932],[-.27,.84],[-.02,.65],[.105,.36],[.14,.007]] if steel else [
           [-.48,1.02],[-.41,1.01],[-.15,1],[.02,.94],[.20,.78],[.28,.55],[.30,.01]]
    pts=[];polys=[];N=48
    for j,(h,r) in enumerate(rings):
        for i in range(N):
            a=i*math.tau/N;c=math.cos(a);s=math.sin(a)
            hdrop=(-.39*max(0,-s)-.20*abs(c)+.15*max(0,s))*(1-j/(len(rings)-1)) if steel else -.07*abs(c)
            wave=(.021*math.sin(a*5.7)+.013*math.sin(a*9.0)) if steel else 0
            pts.append((c*w*(r+wave),top+h+hdrop,z+s*d*(r+wave)))
            if j:polys.append(((j-1)*N+i,j*N+i,j*N+(i+1)%N,(j-1)*N+(i+1)%N))
    accessory('SteelHelm' if steel else 'WorkCap',pts,polys,rig,material('HelmetMetal' if steel else 'CapCloth',rough=.63,col=(.093,.106,.084,1),metal=.24 if steel else 0.),floor,'head')
    if not steel:
        pts=[]
        for i in range(17):
            a=-1.09+i*2.18/16;c=math.cos(a);s=math.sin(a)
            for t in (0,1):
                pts.append((s*w*(1+t*.07),top-.57-.15*t,z+c*d*(.91+t*.58)))
        accessory('CapVisor',pts,[(2*i,2*i+1,2*i+3,2*i+2) for i in range(16)],rig,material('CapCloth',rough=.63,col=(.093,.106,.084,1)),floor,'head')

def uniform(rig,base,floor,shirt):
    a,b=(joint(RIG[n]['head'],base) for n in ['upperarm_l','lowerarm_l'])
    axis=b-a;axis/=np.linalg.norm(axis);t=np.cross(axis,[0,0,1]);t/=np.linalg.norm(t);u=np.cross(t,axis)
    center=a+(b-a)*.40; pts=[];ix=[]
    cloth=fitted(shirt,base)[0]-center
    cloth=cloth[(abs(cloth@axis)<.33)&(np.linalg.norm(cloth,axis=1)<1.1)]
    bounds=[(np.percentile(cloth@q,5),np.percentile(cloth@q,95)) if len(cloth)>2 else (-.60,.60) for q in (t,u)]
    offset=[(l+r)*.5 for l,r in bounds]
    radii=[(r-l)*.63+.09 for l,r in bounds]
    for j,d in enumerate([-.28,-.255,.255,.28]):
        rad=[.635,.654,.650,.632][j]
        for n in range(24):
            q=n*math.tau/24;pts.append(center+axis*d+t*(offset[0]+rad*radii[0]*math.cos(q)/.65)+u*(offset[1]+rad*radii[1]*math.sin(q)/.65))
            if j:ix.append(((j-1)*24+n,j*24+n,j*24+(n+1)%24,(j-1)*24+(n+1)%24))
    accessory('LinenBand',pts,ix,rig,material('LinenBand',rough=.92,col=(.51,.44,.29,1)),floor,'upperarm_l')
    # Plain 1940s short field blouse: pressed buttons, flap seams and field repairs.
    front=shirt_front(shirt,base)
    y0=joint(RIG['spine_03']['head'],base)[1]+.48
    for side in (-1,1):
        for profile,offset,mat_name,color in [
            ([(.52,-.64),(.61,-.75),(1.27,-.74),(1.36,-.63),(1.35,.02),(.54,.02)],.032,'PocketWool',(.105,.11,.079,1)),
            ([(.51,.12),(.51,-.095),(.76,-.12),(.94,-.21),(1.37,-.12),(1.37,.12)],.065,'FieldFlap',(.143,.146,.101,1))]:
            pair=[(x*side,y0+y) for x,y in (profile if side>0 else profile[::-1])]
            garment_panel('TunicPocket',pair,rig,floor,front,material(mat_name,rough=.91,col=color),offset=offset)
        garment_panel('Collar',[(side*x,y0+y) for x,y in ([ (.12,.68),(.39,.89),(.66,.84),(.57,.58)] if side<0 else [(.57,.58),(.66,.84),(.39,.89),(.12,.68)])],
            rig,floor,front,material('FieldCollar',rough=.89,col=(.082,.098,.071,1)),offset=.043)
    garment_panel('FieldRepair',[(-.80,y0-.93),(-.72,y0-1.21),(-.43,y0-1.12),(-.49,y0-.91)],rig,floor,
        front,material('FieldPatch',rough=.94,col=(.080,.085,.061,1)),offset=.036,bone='spine_02')
    coords=[];faces=[]
    for x,y in [(0.036,y0+.50-j*.258) for j in range(6) if j!=4]+[(s*.92,y0-.11) for s in [-1,1]]:
        z=front(x,y)+.041
        b=len(coords);coords.extend([(x,y,z+.026)]+[(x+.056*math.cos(i*math.tau/12),y+.056*math.sin(i*math.tau/12),z) for i in range(12)])
        faces.extend([(b,b+1+i,b+1+(i+1)%12) for i in range(12)])
    accessory('TunicButtons',coords,faces,rig,material('FieldButtons',rough=.55,col=(.125,.128,.099,1),metal=.33),floor,'spine_03')

def formal_details(name,rig,base,floor,shirt):
    F=shirt_front(shirt,base)
    chest=joint(RIG['spine_03']['head'],base)[1]
    neck=joint(RIG['neck_01']['head'],base)[1]
    if name=='niklas':
        y=neck-.50
        garment_panel('BowTie',[(-.39,y-.13),(-.1,y-.067),(.39,y-.13),(.41,y+.12),(.10,y+.07),(-.40,y+.12)],
          rig,floor,F,material('BowSilk',rough=.51,col=(.014,.017,.018,1)),offset=.101)
        garment_panel('PocketSquare',[(.61,chest+.48),(.88,chest+.47),(.89,chest+.67),(.77,chest+.60),(.65,chest+.67)],
          rig,floor,F,material('FormalLinen',rough=.85,col=(.66,.60,.51,1)),offset=.062)
        return
    # Dark ritual cassock over the fitted, skinned shirt and trousers. The
    # weighted hem follows hips/knees; tabs and embroidery are integral surfaces.
    points=[];faces=[];weights=[];N=48
    rows=[(1.45,2.55,1.84), (1.58,2.50,1.80), (2.36,2.36,1.63),(3.54,2.25,1.39),(4.20,2.16,1.33),
           (5.20,2.01,1.25),(6.62,1.89,1.19),(7.75,1.75,1.17),(8.86,1.68,1.08),(9.58,1.57,1.04)]
    for row,(h,rx,rz) in enumerate(rows):
        for i in range(N+1):
            angle=.215+(math.tau-.43)*i/N;fold=.08*math.sin(angle*11+row*.61)+.039*math.cos(angle*17-row*.42)
            x=math.sin(angle)*rx*(1+fold);z=math.cos(angle)*rz*(1+fold*.84)-.10
            points.append((x,h+floor+.035*math.sin(angle*5),z))
            side='l' if x>0 else 'r';leg=np.clip((7.8-h)/5.25,.0,.73);shin=min(leg,max(0.,(3.85-h)/4))
            weights.append({'pelvis':1-leg,'thigh_'+side:leg-shin,'calf_'+side:shin})
            if row and i:
                a=row*(N+1)+i
                faces.append([(a-N-2,0),(a-N-1,0),(a,0),(a-1,0)])
    surface('RitualCassock',points,[],faces,weights,rig,material('RitualCloth',rough=.94,col=(.062,.027,.042,1)),floor)
    for sign in [-1,1]:
        for y,H in [(chest-1.8,neck-.35),(chest-1.89,chest-1.81)]:
            x=sign*.56;low=(x-.153,x+.153);high=(x-.159,x+.159)
            garment_panel('DamaskStole',[(low[0],y),(low[1],y),(high[1],H),(high[0],H)],rig,floor,F,
              material('RitualStole',rough=.84,col=(.104,.028,.051,1)),offset=.127)
        for edge in [-1,1]:
            x=sign*.56+edge*.131
            garment_panel('StoleBraid',[(x-.015,chest-1.8),(x+.015,chest-1.8),(x+.015,neck-.35),(x-.015,neck-.35)],
                rig,floor,F,material('RitualThread',rough=.73,col=(.259,.157,.074,1)),offset=.148)
        for y in [chest+i*.18 for i in range(-8,5)]:
            x=sign*.56
            garment_panel('ThreadWork',[(x-.063,y),(x,y-.054),(x+.063,y),(x,y+.054)],rig,floor,F,
              material('RitualThread',rough=.73,col=(.259,.157,.074,1)),offset=.155)
    y=chest+.52
    disk=[(.173*math.cos(i*math.tau/24),y+.211*math.sin(i*math.tau/24)) for i in range(24)]
    garment_panel('OrbMedallion',disk,rig,floor,F,material('RitualCopper',rough=.55,col=(.276,.169,.087,1),metal=.51),offset=.147)
    garment_panel('OrbInset',[(-.095,y),(-.061,y-.099),(0,y-.116),(.077,y-.071),(.099,y+.05),(.025,y+.113),(-.054,y+.102)],
        rig,floor,F,material('RitualOrbStone',rough=.49,col=(.081,.182,.174,1)),offset=.183)

def batch_ritual_hardware(rig):
    # The individual braid motifs stay easy to author, but each finish is
    # one skinning draw rather than thirty tiny draws crossing the scene.
    groups=defaultdict(list)
    for o in rig.children:
        if o.type=='MESH' and o.data.materials and o.data.materials[0].name in ['RitualThread','RitualStole']:
            groups[o.data.materials[0].name].append(o)
    for finish,objects in groups.items():
        if len(objects)<2:continue
        bpy.ops.object.select_all(action='DESELECT')
        for o in objects:o.select_set(True)
        bpy.context.view_layer.objects.active=objects[0]
        bpy.ops.object.join();objects[0].name=finish

# Actor-specific builds sharing the identical topology, mapping and joint names.
# A blend of adult targets avoids the unconfigured base's averaged mannequin.
cast=[
 ('base','caucasian-male-young','young_caucasian_male','male_casualsuit01','short01','shoes01',1.77,[]),
 ('hubert','caucasian-male-old','old_caucasian_male','male_casualsuit01',None,'shoes03',1.79,[('head-rectangular',.34),('l-eye-bag-incr',.65),('r-eye-bag-incr',.46)]),
 ('ghoulA','caucasian-male-old','young_caucasian_male','male_worksuit01',None,'shoes03',1.82,[('chin-width-incr',.33)]),
 ('ghoulB','caucasian-female-young','young_asian_female','female_casualsuit01','bob01','shoes01',1.67,[('head-oval',.46),('l-eye-bag-incr',.62)]),
 ('ghoulC','african-male-young','young_african_male','male_casualsuit03',None,'shoes03',1.83,[('head-rectangular',.43),('l-eye-bag-incr',.62),('r-eye-bag-incr',.33)]),
 ('clubAda','caucasian-female-young','young_asian_female','female_elegantsuit01','bob01','shoes01',1.72,[('head-oval',.48)]),
 ('clubMira','asian-female-young','young_asian_female','female_casualsuit01','short03','shoes01',1.61,[('head-rectangular',.24)]),
 ('clubNiko','caucasian-male-young','young_caucasian_male','male_casualsuit01','short01','shoes01',1.78,[('chin-width-incr',.23)]),
 ('clubSami','african-male-young','young_african_male','male_casualsuit03','afro01','shoes03',1.88,[('head-oval',.28)]),
 ('clubVeit','caucasian-male-old','old_caucasian_male','male_elegantsuit01','short03','shoes03',1.76,[('head-rectangular',.42)]),
 ('orbPriest','caucasian-male-old','old_caucasian_male','male_elegantsuit01','short01','shoes03',1.784,[('head-oval',.52),('l-eye-bag-incr',.35)]),
 ('niklas','caucasian-male-young','young_caucasian_male','male_elegantsuit01','short01','shoes03',1.84,[('head-rectangular',.55),('chin-width-incr',.46)]),
]
bpy.ops.wm.read_factory_settings(use_empty=True)

for name,macro,skin,clothes,hair,shoes,height,features in cast:
    print('Baking',name,flush=True)
    base=BASE+delta(macro)
    for key,v in features:base+=delta(key)*v
    mask=GROUPS['body']; lo,hi=base[list(mask),1].min(),base[list(mask),1].max()
    scale=height*10/(hi-lo)
    # Fit at the native size first. Put the authored size on the root, so all
    # imported skeletons retain their proportional rest lengths and skinning.
    rig=armature(name,base,lo)
    rig['size']=scale
    cut=set()
    for kind,p in [('Cloth',SRC/'clothes'/clothes),('Shoes',SRC/'clothes'/shoes)]:
        cut|=item(p,base,lo,rig,kind,kind)
    if hair: item(SRC/'hair'/hair,base,lo,rig,'Hair','Hair')
    brows=SRC/'eyebrows'/'eyebrow001'
    if (brows/'eyebrow001.obj').exists():item(brows,base,lo,rig,'Brow','Brow',True)
    mat=material('Skin_'+skin,image_in(SRC/'skins'/skin),rough=.71,col=(.51,.33,.24,1))
    face={n:base+delta(t) for n,t in FACE.items()}
    keep=[p for g,p in FACES if g in ['body','helper-tongue'] and not any(i in cut for i,u in p)]
    surface('Skin',base,UV,keep,W,rig,mat,lo,face)
    if name=='hubert':
        teeth=[p for g,p in FACES if g in ['helper-upper-teeth','helper-lower-teeth']]
        surface('Teeth',base,UV,teeth,W,rig,material('AgedTeeth',rough=.38,col=(.60,.51,.39,1)),lo,{'JawOpen':face['JawOpen']})
    eye,_,_=fitted(SRC/'low-poly.mhclo',base)
    _,uv,fac,_=obj(SRC/'low-poly.obj')
    # Independent eye joints share the head as parent, with their own rest pivots.
    for s,tag in [(1,'L'),(-1,'R')]:
        subset=[p for g,p in fac if np.mean([eye[i][0] for i,u in p])*s>0]
        eyeMat=material('Eye',SRC/'brown_eye.png',rough=.30)
        surface('Eye'+tag,eye,uv,subset,[{'eye_'+tag.lower():1.} for _ in eye],rig,eyeMat,lo)
    if name in ['hubert','ghoulA']:helmet(rig,base,lo,name=='hubert')
    if name=='hubert':uniform(rig,base,lo,SRC/'clothes'/clothes/(clothes+'.mhclo'))
    if name in ['orbPriest','niklas']:formal_details(name,rig,base,lo,SRC/'clothes'/clothes/(clothes+'.mhclo'))
    if name=='orbPriest':batch_ritual_hardware(rig)

bpy.ops.wm.save_as_mainfile(filepath=str(SRC.parent/'Human-Cast.blend'),compress=True)
bpy.ops.export_scene.gltf(filepath=str(OUT),export_format='GLB',export_extras=True,export_yup=True,
    export_animations=False,export_image_format='JPEG',export_jpeg_quality=86,export_morph_normal=False,export_morph_tangent=False,
    export_meshopt_compression_enable=True,export_meshopt_extension='EXT_meshopt_compression')
