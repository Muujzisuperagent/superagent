# -*- coding: utf-8 -*-
"""序厅 v31 · 第三轮：颜色止损（把 round2 的「白昼展厅」拉回暗调）。

round2 实测（audit_img.py --scene 序厅）：
  luma_mean 0.458 / near_black 5.21% / 宣纸 20.93% / 深木 29.40% / 青灰石 38.68%
目标：
  luma_mean 0.20~0.28 / near_black 10~18% / 宣纸 6~10% / 青灰石 25~35% / 深木 35~45%
做法（只调材质底色与光比，不引入暖黄火）：
  ① 墙面回到中灰旧墙 #5a5c52 一档，不再是 #cfc9b6 的白墙
  ② 地面回到 #3a444a 一档（冷青灰）
  ③ 木料回到深木 #352c23 一档（护墙板 / 梁柱 / 案）
  ④ 雾与背景压回暗青灰 #6f7a72 一档
  ⑤ 半球光强度 1.15 → 0.62，天顶与地面反弹都压暗
  ⑥ 旧纸色只留在小面积：纸扎人、灯笼、案上纸牒、墙面水牌
"""
import io, sys

def patch(path, pairs):
    s = io.open(path, encoding='utf-8').read()
    for old, new, tag in pairs:
        n = s.count(old)
        if n != 1:
            print('FAIL %s/%s count=%d' % (path, tag, n)); sys.exit(1)
        s = s.replace(old, new)
        print('ok', path, tag)
    io.open(path, 'w', encoding='utf-8', newline='\n').write(s)

patch('public/prologue/scene.js', [
    # ① 墙面：中灰旧墙
    ("""      g.fillStyle = "#cfc9b6"; g.fillRect(0, 0, s, s);
      for (var i = 0; i < 2600; i++) {
        var v = 186 + Math.floor(r() * 40);
        g.fillStyle = "rgba(" + v + "," + (v + 2) + "," + (v - 14) + "," + (.10 + r() * .3) + ")";
        g.fillRect(r() * s, r() * s, 1 + r() * 7, 1 + r() * 4);
      }
      for (var k = 0; k < 22; k++) {
        softBlob(g, r() * s, r() * s, 22 + r() * 60, "132,132,116", .12);
      }""",
     """      g.fillStyle = "#5a5c52"; g.fillRect(0, 0, s, s);
      for (var i = 0; i < 2600; i++) {
        var v = 78 + Math.floor(r() * 30);
        g.fillStyle = "rgba(" + v + "," + (v + 2) + "," + (v - 8) + "," + (.10 + r() * .3) + ")";
        g.fillRect(r() * s, r() * s, 1 + r() * 7, 1 + r() * 4);
      }
      for (var k = 0; k < 22; k++) {
        softBlob(g, r() * s, r() * s, 22 + r() * 60, "34,38,34", .16);
      }""", 'wall-mid-grey'),
    # ② 地面：冷青灰
    ("""      g.fillStyle = "#5b6670"; g.fillRect(0, 0, s, s);""",
     """      g.fillStyle = "#3a444a"; g.fillRect(0, 0, s, s);""", 'floor-cold-slate'),
    ("""        var v = 82 + Math.floor(r() * 22);
        g.fillStyle = "rgb(" + v + "," + (v + 7) + "," + (v + 14) + ")";""",
     """        var v = 54 + Math.floor(r() * 18);
        g.fillStyle = "rgb(" + v + "," + (v + 8) + "," + (v + 13) + ")";""", 'floor-slab-cold'),
    # ③ 木料：深木一档
    ("""      g.fillStyle = "#4b4033"; g.fillRect(0, 0, s, s);
      for (var i = 0; i < 170; i++) {
        var y = r() * s, a = .05 + r() * .12;
        g.strokeStyle = "rgba(178,154,118," + a + ")";""",
     """      g.fillStyle = "#352c23"; g.fillRect(0, 0, s, s);
      for (var i = 0; i < 170; i++) {
        var y = r() * s, a = .04 + r() * .10;
        g.strokeStyle = "rgba(150,128,96," + a + ")";""", 'wood-deep'),
    # ④ 雾 / 背景：暗青灰
    ("""    scene.fog = new T.Fog(0xc3c6bd, 8.5, 27.0);
    scene.background = new T.Color(0xc8c6b8);""",
     """    scene.fog = new T.Fog(0x6f7a72, 8.5, 27.0);
    scene.background = new T.Color(0x74807a);""", 'fog-dark'),
    # ⑤ 半球光：压暗
    ("""    scene.add(new T.HemisphereLight(0xa8b6ab, 0x6e7168, 1.15));
    scene.add(new T.AmbientLight(0x7d8880, .30));""",
     """    scene.add(new T.HemisphereLight(0x8fa39b, 0x1c231f, .62));
    scene.add(new T.AmbientLight(0x5c6760, .16));""", 'ambient-down'),
    # 门口 / 地面冷光同步压回
    ("""    var footLight = new T.PointLight(0xb2ccc2, .44, 4.6, 2);""",
     """    var footLight = new T.PointLight(0xa9c6bd, .34, 4.6, 2);""", 'foot-light'),
    ("""    var floorGlow = new T.PointLight(0xa9c0b8, .48, 12, 2);""",
     """    var floorGlow = new T.PointLight(0x9fb8b0, .40, 12, 2);""", 'floor-glow'),
    # 判官三盏灯：白昼化，回压
    ("""      var jlight = new T.PointLight(0xc4ded6, .34, 3.0, 2);""",
     """      var jlight = new T.PointLight(0xc4ded6, .40, 3.2, 2);""", 'judge-fill'),
    ("""      var jrim = new T.PointLight(0xa8ccc4, .66, 2.4, 2);""",
     """      var jrim = new T.PointLight(0xa8ccc4, .78, 2.6, 2);""", 'judge-rim'),
    ("""      var jtop = new T.PointLight(0xbcd8cf, .22, 1.9, 2);""",
     """      var jtop = new T.PointLight(0xbcd8cf, .26, 2.0, 2);""", 'judge-top'),
])

# ⑥ 纸扎人 tint 收回到旧纸但不再过白
patch('public/prologue/lux3d.js', [
    ("""      tint: 0xc4c0ae, squash: [.56, 1.75, .40] },""",
     """      tint: 0xa8a894, squash: [.56, 1.75, .40] },""", 'folk-tint'),
])
print('done')
