# Lux3D v2 落位探针：量桥面标高/拱洞/柜面朝向/花簇根部（无渲染，秒级）
# 用法: blender.exe --background --factory-startup --python-exit-code 1 --python measure_glb.py -- <glb目录> <输出json>
import bpy
import json
import os
import sys
from mathutils import Vector


def load(path):
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    bpy.ops.import_scene.gltf(filepath=path)
    objs = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    verts = []
    for o in objs:
        mw = o.matrix_world
        verts.extend(mw @ v.co for v in o.data.vertices)
    return verts


def probe_bridge(verts):
    # Blender 坐标: x=桥长, y=桥宽(gltf Z), z=高(gltf Y)
    deck_center = max(v.z for v in verts if abs(v.x) < 0.15 and abs(v.y) < 0.30)
    deck_end = max(v.z for v in verts if 1.35 < abs(v.x) < 1.5 and abs(v.y) < 0.30)
    intrados = min(v.z for v in verts if abs(v.x) < 0.05 and v.z > -0.55)
    base = min(v.z for v in verts)
    top = max(v.z for v in verts)
    # 拱洞半宽: 低处(|z+0.45|<0.05) 券石内缘的最小 |x|
    ring = [abs(v.x) for v in verts if -0.50 < v.z < -0.40]
    opening_half = min(ring) if ring else None
    # 桥面净宽(栏杆内侧): 桥面高度附近顶面点的最大 |y|
    deck_halfwidth = max(abs(v.y) for v in verts if abs(v.x) < 0.15 and abs(v.z - deck_center) < 0.03)
    return {
        "deck_top_center_z": round(deck_center, 4),
        "deck_top_end_z": round(deck_end, 4),
        "arch_intrados_center_z": round(intrados, 4),
        "base_min_z": round(base, 4),
        "post_top_z": round(top, 4),
        "arch_opening_half_width_at_z-0.45": round(opening_half, 4) if opening_half else None,
        "deck_half_width": round(deck_halfwidth, 4),
    }


def probe_cabinet(verts):
    zmax = max(v.z for v in verts)
    zmin = min(v.z for v in verts)
    # 抽屉格节奏: 统计 +Z 面凸出件(旋钮尖) 的 x 分布峰值
    knobs = [v for v in verts if v.z > zmax - 0.004]
    xs = sorted(set(round(v.x, 2) for v in knobs))
    return {"z_max": round(zmax, 4), "z_min": round(zmin, 4), "knob_tip_x_samples": xs[:24]}


def probe_lily(verts):
    ymin = min(v.z for v in verts)
    zmax = max(v.z for v in verts)
    low = [v for v in verts if v.z < ymin + 0.02]
    r = max((v.x ** 2 + v.y ** 2) ** 0.5 for v in low)
    return {"base_min_z": round(ymin, 4), "top_z": round(zmax, 4), "base_disc_radius": round(r, 4), "base_vert_count": len(low)}


def main():
    argv = sys.argv[sys.argv.index("--") + 1:]
    glb_dir, out = argv[0], argv[1]
    report = {}
    report["stone-bridge-v2"] = probe_bridge(load(os.path.join(glb_dir, "stone-bridge-v2.glb")))
    report["herbal-cabinet-v2"] = probe_cabinet(load(os.path.join(glb_dir, "herbal-cabinet-v2.glb")))
    report["spider-lily-v2"] = probe_lily(load(os.path.join(glb_dir, "spider-lily-v2.glb")))
    with open(out, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print(json.dumps(report, ensure_ascii=False), flush=True)


main()