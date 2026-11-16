# Lux3D v2 落位预演：按推荐 position/scale/rotation 在 Blender 里摆好, 用游戏等价机位渲染验证
# 用法: blender.exe --background --factory-startup --python-exit-code 1 --python place_preview.py -- <glb目录> <输出目录>
# 坐标: 游戏 (x, y, z) Y-up → Blender (x, -z, y) Z-up。先 transform_apply 烘焙导入变换, 再按世界轴缩放。
import bpy
import math
import os
import sys
from mathutils import Vector


def clear():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for coll in (bpy.data.meshes, bpy.data.materials, bpy.data.images):
        for b in list(coll):
            if b.users == 0:
                coll.remove(b)


def load_baked(path):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    objs = [o for o in bpy.data.objects if o.type == "MESH" and o not in before]
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    objs[0].rotation_mode = "XYZ"  # glTF 导入器默认 QUATERNION, 欧拉赋值会被忽略
    return objs[0]


def game_transform(obj, scale_local_xyz, rot_axis, rot_deg, pos_game):
    # scale 按烘焙后的 Blender 局部轴 (x, 深y, 高z) 直传
    obj.scale = scale_local_xyz
    if rot_axis:
        setattr(obj.rotation_euler, rot_axis, math.radians(rot_deg))
    obj.location = (pos_game[0], -pos_game[2], pos_game[1])


def stage(ground_size=60, ground_z=0.0, ground_color=(0.25, 0.26, 0.27), ground_center=(0, 0)):
    world = bpy.data.worlds.new("w")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = (0.10, 0.13, 0.13, 1)
    world.node_tree.nodes["Background"].inputs[1].default_value = 1.0
    bpy.context.scene.world = world
    for name, rot, e in [
        ("key", (math.radians(50), math.radians(-15), math.radians(-25)), 2.6),
        ("fill", (math.radians(65), math.radians(20), math.radians(150)), 0.8),
        ("rim", (math.radians(30), 0, math.radians(190)), 1.4),
    ]:
        ld = bpy.data.lights.new(name, "SUN")
        ld.energy = e
        ob = bpy.data.objects.new(name, ld)
        ob.rotation_euler = rot
        bpy.context.collection.objects.link(ob)
    bpy.ops.mesh.primitive_plane_add(size=ground_size, location=(ground_center[0], ground_center[1], ground_z))
    m = bpy.data.materials.new("g")
    m.use_nodes = True
    m.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (*ground_color, 1)
    m.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.9
    bpy.context.active_object.data.materials.append(m)


def shot(name, outdir, cam_game, target_game, lens=35):
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x = 1024
    scene.render.resolution_y = 768
    cd = bpy.data.cameras.new("c")
    cd.lens = lens
    cam = bpy.data.objects.new("c", cd)
    bpy.context.collection.objects.link(cam)
    scene.camera = cam
    cam.location = (cam_game[0], -cam_game[2], cam_game[1])
    t = bpy.data.objects.new("t", None)
    t.location = (target_game[0], -target_game[2], target_game[1])
    bpy.context.collection.objects.link(t)
    con = cam.constraints.new("TRACK_TO")
    con.target = t
    con.track_axis = "TRACK_NEGATIVE_Z"
    con.up_axis = "UP_Y"
    scene.render.filepath = os.path.join(outdir, name)
    bpy.ops.render.render(write_still=True)
    print("[shot]", name, flush=True)


def main():
    argv = sys.argv[sys.argv.index("--") + 1:]
    glb_dir, outdir = argv[0], argv[1]

    # 1) 九宫: 放倒 + 非均匀, 游戏机位 (0,1.65,-21.5) 看向阵心
    clear()
    ob = load_baked(os.path.join(glb_dir, "nine-palace-v2.glb"))
    game_transform(ob, (40.3, 8.04, 40.3), "x", 90, (0, 0.13, -27.75))
    stage(40, 0.0, ground_center=(0, 27.75))
    shot("placement-nine-palace.png", outdir, (0, 1.65, -21.5), (0, 0.25, -27.75))

    # 2) 石桥: 长轴转 Z + 非均匀, 桥头人眼机位
    clear()
    ob = load_baked(os.path.join(glb_dir, "stone-bridge-v2.glb"))
    game_transform(ob, (6.8, 3.796, 2.4362), "z", 90, (0, 1.339, -62.4))
    stage(80, -0.55, (0.02, 0.05, 0.05), ground_center=(0, 62.4))
    shot("placement-bridge.png", outdir, (0, 1.87, -50.0), (0, 1.9, -62.4))
    shot("placement-bridge-side.png", outdir, (14, 2.2, -62.4), (0, 1.2, -62.4))

    # 3) 百子柜双实例夹门洞, 殿内人眼机位
    clear()
    for side in (-1, 1):
        ob = load_baked(os.path.join(glb_dir, "herbal-cabinet-v2.glb"))
        game_transform(ob, (3.076, 1.355, 3.346), None, 0, (side * 3.45, 2.42, -7.02))
    stage(40, 0.0)
    shot("placement-cabinet.png", outdir, (0, 1.65, 2.5), (0, 2.3, -7.0))

    # 4) 彼岸花簇 3 实例, 河岸低机位
    clear()
    for i, (x, z) in enumerate([(9.6, -55), (11.2, -58.5), (9.0, -62)]):
        ob = load_baked(os.path.join(glb_dir, "spider-lily-v2.glb"))
        ob.scale = (1.442, 1.442, 1.442)
        ob.rotation_euler.z = i * 1.3
        ob.location = (x, -z, -0.2 + 0.26 * 1.442 - 0.02)
    stage(60, -0.2, (0.16, 0.17, 0.16), ground_center=(10, 58.5))
    shot("placement-lily.png", outdir, (6.5, 1.1, -52.5), (10, 0.5, -58.5), 40)
    print("[all-done]", flush=True)


main()