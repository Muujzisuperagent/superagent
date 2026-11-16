# Lux3D v2 GLB 离线体检：Blender 4.5 无头导入 + 结构统计 + 多角度渲染 + 松散件分析
# 用法:
#   blender.exe --background --factory-startup --python-exit-code 1 --python inspect_glb.py -- <glb目录> <输出目录>
# 输出: <输出目录>/blender-report.json 与 <asset>-<angle>.png (1024x768)
# 坐标约定: 报告一律换算回 glTF 坐标系 (Y-up, 米=glTF单位); Blender 内部 Z-up。
import bpy
import json
import math
import os
import sys
from mathutils import Vector

ASSETS = [
    ("herbal-cabinet-v2", ["front", "back", "side"]),
    ("nine-palace-v2", ["top", "front", "persp"]),
    ("stone-bridge-v2", ["front", "side", "persp", "top"]),
    ("spider-lily-v2", ["front", "persp", "top"]),
]

# 相机方向 (Blender 坐标, 从目标指向相机)。front = 看 glTF +Z 面。
VIEW_DIRS = {
    "front": Vector((0.0, -1.0, 0.16)),
    "back": Vector((0.0, 1.0, 0.16)),
    "side": Vector((1.0, -0.4, 0.3)),
    "persp": Vector((0.85, -1.0, 0.6)),
    "top": Vector((0.0, -0.02, 1.0)),
}


def blender_to_gltf(v):
    return [round(v[0], 5), round(v[2], 5), round(-v[1], 5)]


def world_bbox(objs):
    lo = Vector((1e9, 1e9, 1e9))
    hi = Vector((-1e9, -1e9, -1e9))
    for obj in objs:
        if obj.type != "MESH":
            continue
        for corner in obj.bound_box:
            w = obj.matrix_world @ Vector(corner)
            lo = Vector((min(lo[i], w[i]) for i in range(3)))
            hi = Vector((max(hi[i], w[i]) for i in range(3)))
    return lo, hi


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for coll in (bpy.data.meshes, bpy.data.materials, bpy.data.images, bpy.data.cameras, bpy.data.lights):
        for block in list(coll):
            if block.users == 0:
                coll.remove(block)


def setup_stage(lo, hi):
    center = (lo + hi) / 2
    size = hi - lo
    maxdim = max(size)
    # 中性灰世界
    world = bpy.data.worlds.new("gray")
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs[0].default_value = (0.32, 0.33, 0.34, 1.0)
    bg.inputs[1].default_value = 1.0
    bpy.context.scene.world = world
    # 三点光 (sun, 免距离衰减)
    for name, rot, energy, angle in [
        ("key", (math.radians(52), math.radians(-18), math.radians(-30)), 3.2, math.radians(12)),
        ("fill", (math.radians(60), math.radians(25), math.radians(140)), 1.1, math.radians(30)),
        ("rim", (math.radians(35), math.radians(10), math.radians(200)), 1.8, math.radians(8)),
    ]:
        ld = bpy.data.lights.new(name, "SUN")
        ld.energy = energy
        ld.angle = angle
        ob = bpy.data.objects.new(name, ld)
        ob.rotation_euler = rot
        bpy.context.collection.objects.link(ob)
    # 灰底板
    bpy.ops.mesh.primitive_plane_add(size=maxdim * 12, location=(center.x, center.y, lo.z - maxdim * 0.002))
    plane = bpy.context.active_object
    plane.name = "ground"
    mat = bpy.data.materials.new("groundmat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.28, 0.29, 0.30, 1.0)
    bsdf.inputs["Roughness"].default_value = 0.95
    plane.data.materials.append(mat)
    # 相机目标
    target = bpy.data.objects.new("target", None)
    target.location = center
    bpy.context.collection.objects.link(target)
    return center, maxdim, target


def render_views(asset, outdir, views, center, maxdim, target):
    scene = bpy.context.scene
    scene.render.resolution_x = 1024
    scene.render.resolution_y = 768
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = False
    engine_ok = "BLENDER_EEVEE_NEXT"
    try:
        scene.render.engine = "BLENDER_EEVEE_NEXT"
    except TypeError:
        engine_ok = "BLENDER_EEVEE"
        scene.render.engine = engine_ok
    cam_data = bpy.data.cameras.new("cam")
    cam_data.lens = 50
    cam = bpy.data.objects.new("cam", cam_data)
    bpy.context.collection.objects.link(cam)
    scene.camera = cam
    con = cam.constraints.new("TRACK_TO")
    con.target = target
    con.track_axis = "TRACK_NEGATIVE_Z"
    con.up_axis = "UP_Y"
    paths = []
    for view in views:
        d = VIEW_DIRS[view].normalized()
        cam.location = center + d * maxdim * 2.15
        out = os.path.join(outdir, f"{asset}-{view}.png")
        scene.render.filepath = out
        try:
            bpy.ops.render.render(write_still=True)
        except Exception as exc:  # EEVEE 无头失败 → Cycles CPU 低采样
            print(f"[warn] EEVEE failed ({exc}); fallback Cycles CPU", flush=True)
            scene.render.engine = "CYCLES"
            scene.cycles.samples = 24
            scene.cycles.use_denoising = True
            scene.cycles.device = "CPU"
            bpy.ops.render.render(write_still=True)
        paths.append(os.path.basename(out))
        print(f"[render] {out} engine={scene.render.engine}", flush=True)
    return paths


def material_info():
    mats = []
    for mat in bpy.data.materials:
        if mat.name == "groundmat" or not mat.use_nodes:
            continue
        entry = {"name": mat.name, "textures": []}
        for node in mat.node_tree.nodes:
            if node.type == "BSDF_PRINCIPLED":
                bc = node.inputs["Base Color"]
                entry["baseColorFactor"] = [round(c, 4) for c in bc.default_value]
                entry["baseColorLinked"] = bc.is_linked
                entry["metallic"] = round(node.inputs["Metallic"].default_value, 4)
                entry["metallicLinked"] = node.inputs["Metallic"].is_linked
                entry["roughness"] = round(node.inputs["Roughness"].default_value, 4)
                entry["roughnessLinked"] = node.inputs["Roughness"].is_linked
                entry["normalLinked"] = node.inputs["Normal"].is_linked
            elif node.type == "TEX_IMAGE" and node.image:
                img = node.image
                entry["textures"].append({
                    "name": img.name,
                    "size": list(img.size),
                    "embedded": bool(img.packed_file),
                    "colorspace": img.colorspace_settings.name,
                })
        mats.append(entry)
    return mats


def loose_part_analysis(mesh_objs):
    """分离松散件, 回答『抽屉格/石板/拱券是否真几何』。返回件数与最大 15 件包围盒。"""
    bpy.ops.object.select_all(action="DESELECT")
    for obj in mesh_objs:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = mesh_objs[0]
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.separate(type="LOOSE")
    bpy.ops.object.mode_set(mode="OBJECT")
    parts = [o for o in bpy.context.scene.objects if o.type == "MESH" and o.name != "ground"]
    infos = []
    for p in parts:
        lo, hi = world_bbox([p])
        size = hi - lo
        infos.append({
            "size_gltf": blender_to_gltf(size),
            "center_gltf": blender_to_gltf((lo + hi) / 2),
            "volume": round(size.x * size.y * size.z, 8),
            "tris": sum(len(poly.vertices) - 2 for poly in p.data.polygons),
        })
    infos.sort(key=lambda i: -i["volume"])
    return len(parts), infos[:15]


def main():
    argv = sys.argv[sys.argv.index("--") + 1:]
    glb_dir, outdir = argv[0], argv[1]
    os.makedirs(outdir, exist_ok=True)
    report_path = os.path.join(outdir, "blender-report.json")
    report = {}
    for asset, views in ASSETS:
        clear_scene()
        path = os.path.join(glb_dir, asset + ".glb")
        print(f"[import] {path}", flush=True)
        bpy.ops.import_scene.gltf(filepath=path)
        mesh_objs = [o for o in bpy.context.scene.objects if o.type == "MESH"]
        lo, hi = world_bbox(mesh_objs)
        size = hi - lo
        tris = sum(sum(len(poly.vertices) - 2 for poly in m.data.polygons) for m in mesh_objs)
        verts = sum(len(m.data.vertices) for m in mesh_objs)
        entry = {
            "file": asset + ".glb",
            "bytes": os.path.getsize(path),
            "bbox_min_gltf": blender_to_gltf(lo),
            "bbox_max_gltf": blender_to_gltf(hi),
            "dimensions_gltf_xyz": blender_to_gltf(size),
            "objects_mesh": len(mesh_objs),
            "triangles": tris,
            "vertices": verts,
            "materials": material_info(),
        }
        center, maxdim, target = setup_stage(lo, hi)
        entry["renders"] = render_views(asset, outdir, views, center, maxdim, target)
        try:
            count, top = loose_part_analysis(mesh_objs)
            entry["loose_parts"] = count
            entry["loose_parts_top15"] = top
        except Exception as exc:
            entry["loose_parts_error"] = str(exc)
        report[asset] = entry
        with open(report_path, "w", encoding="utf-8") as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        print(f"[done] {asset}: dims={entry['dimensions_gltf_xyz']} tris={tris} parts={entry.get('loose_parts')}", flush=True)
    print("[all-done]", flush=True)


main()