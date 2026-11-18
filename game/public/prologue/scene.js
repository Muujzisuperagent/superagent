/* 序厅 · 阴司便民司 — 场景搭建层
 * 依据（优先级由高到低）：
 *   A 队友《场景生图提示词_v3_恐怖版》「1｜序厅」【本场】+【连贯锁】+【负面】
 *     —— 主约束。灰白与旧纸色、狭长侧廊、一点透视略偏心、尽头没入浓雾、
 *        右侧六扇木格窗只开一扇、窗纸外侧模糊手掌印、湿脚印走到长凳前断掉、
 *        凳面刚被人坐过的凹痕、一排纸扎人面壁无点睛、摇柄取号机与散落竹牌、
 *        白纸灯笼青白冷火、朱笔水牌字迹模糊、香烟贴地朝门外流。
 *   B 队友 build_script_and_assets.py 的 S0 清单 —— 只借编号 / 数量 / 尺寸 / 动线，
 *        不采纳与 A 冲突的「六扇办事窗口 1 开 5 闭」「可读须知六条」「低位暖光」
 *        「角色实体」。S0-15 的暖光是旧版遗留，v3 负面词禁暖黄火焰。
 *   C 剧本《还魂路引》序厅段 —— 教学动线：摇号 → 取竹牌 → 观察 → 合成牒 → 点香
 *        → 第一殿门自开；不出现文字教程，用物件微光与图形灯格引导。
 * Aholo Lux3D 版：关键证物由 Lux3D G1 文生 3D 生成带 PBR 贴图的 GLB，
 * 经 prologue/lux3d.js 挂到 refs.luxHosts；长廊 / 窗洞 / 雾幕 / 地面等建筑壳、
 * 以及摇柄 / 落牌 / 合牒 / 门开等状态动画仍由引擎负责（沿用第一殿架构约定）。
 * GLB 未到位时自动回退到程序化占位，场景照常可玩 —— 但这不是合规交付态，
 * 合规交付必须带 9 件 Lux3D 资产在屏，见《Aholo_Lux3D_资产举证清单_全作品.md》。
 * THREE r128（本目录 vendor/），无模块打包、无网络依赖。
 */
(function () {
  "use strict";
  var T = window.THREE;

  // 狭长侧廊：宽 6.4 m，沿 -z 延伸 26 m，墙高 4.6 m（梁柱向上隐入黑暗）
  var LAYOUT = {
    halfW: 3.2, zFront: 5.2, zBack: -21.0, wallH: 4.6,
    walk: { minX: -2.72, maxX: 2.72, minZ: -17.6, maxZ: 4.55,
            minY: .95, maxY: 2.75 },
    start: { p: [-.55, 1.62, 3.95], t: [.35, 1.38, -6.4] },
    stepNames: ["摇号", "取牌", "合牒", "点香", "门开"]
  };

  // 主线 4 步 + 自动开门；观察彩蛋只点亮图形灯格，不阻断
  var PICKS = ["machine", "ticket", "pass", "incense"];
  // v27：新增 4 处可点观察点（全部复用已有几何，不新建物件），
  // 每处在 dialogue.js 里配一句剧本 / v3 台词，点了出对白但不推进主线。
  var OBSERVE = ["handprint", "bench", "folk", "smoke", "notice",
                 "watercard", "window", "lamp", "door"];
  var OBSERVE_TOTAL = 9;
  // v29：判官改坐姿，坐在木案左侧、伸手可及桌沿。这个坐标同时给 app.js 做
  // 「走近触发对话」的距离判定与绕行碰撞，不在这里硬编码第二份。
  var JUDGE_AT = [0.18, 0, -1.28];

  function canvas(size, draw) {
    var c = document.createElement("canvas");
    c.width = c.height = size;
    draw(c.getContext("2d"), size);
    var t = new T.CanvasTexture(c);
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.encoding = T.sRGBEncoding;
    return t;
  }
  function tex(size, draw, opt) {
    var t = canvas(size, draw);
    opt = opt || {};
    if (opt.repeat) t.repeat.set(opt.repeat[0], opt.repeat[1]);
    if (opt.clamp) t.wrapS = t.wrapT = T.ClampToEdgeWrapping;
    return t;
  }
  function rand(seed) {
    var s = seed;
    return function () { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
  }
  function softBlob(g, x, y, r, col, a) {
    var gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, "rgba(" + col + "," + a + ")");
    gr.addColorStop(.55, "rgba(" + col + "," + (a * .45) + ")");
    gr.addColorStop(1, "rgba(" + col + ",0)");
    g.fillStyle = gr;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }

  // —————————————————————— 程序化贴图 ——————————————————————
  function makeTextures() {
    var M = {};

    // 青灰石板：偏灰白、错缝铺、水渍与磨损
    M.stone = tex(512, function (g, s) {
      var r = rand(7), bw = s / 4, bh = s / 4;
      g.fillStyle = "#3b4442"; g.fillRect(0, 0, s, s);
      for (var row = 0; row < 4; row++) for (var col = -1; col <= 4; col++) {
        var ox = (row % 2) ? bw * .5 : 0, x = col * bw + ox, y = row * bh;
        var v = 58 + Math.floor(r() * 20);
        g.fillStyle = "rgb(" + v + "," + (v + 7) + "," + (v + 5) + ")";
        g.fillRect(x + 2, y + 2, bw - 4, bh - 4);
        g.strokeStyle = "rgba(178,196,188,.10)"; g.lineWidth = 1;
        g.strokeRect(x + 5, y + 5, bw - 10, bh - 10);
        g.strokeStyle = "rgba(10,17,16,.48)"; g.lineWidth = 2;
        g.strokeRect(x + 1, y + 1, bw - 2, bh - 2);
        for (var k = 0; k < 3; k++) {
          g.strokeStyle = "rgba(12,20,19," + (.08 + r() * .14) + ")";
          g.lineWidth = .8 + r() * 1.3;
          g.beginPath();
          var px = x + 8 + r() * (bw - 16), py = y + 8 + r() * (bh - 16);
          g.moveTo(px, py); g.lineTo(px + (r() - .5) * 44, py + (r() - .5) * 36); g.stroke();
        }
      }
      for (var i = 0; i < 4200; i++) {
        var q = 52 + Math.floor(r() * 60);
        g.fillStyle = "rgba(" + q + "," + (q + 6) + "," + (q + 4) + "," + (.03 + r() * .12) + ")";
        g.fillRect(r() * s, r() * s, 1 + r() * 4, 1 + r() * 2);
      }
      for (var w = 0; w < 10; w++) {
        g.strokeStyle = "rgba(16,26,25,.09)"; g.lineWidth = 7 + r() * 18;
        g.beginPath(); g.arc(r() * s, r() * s, 20 + r() * 62, 0, Math.PI * 2); g.stroke();
      }
    }, { repeat: [2, 9] });

    // 深色老榆木
    M.wood = tex(512, function (g, s) {
      var r = rand(19);
      g.fillStyle = "#2b2721"; g.fillRect(0, 0, s, s);
      for (var i = 0; i < 170; i++) {
        var y = r() * s, a = .04 + r() * .10;
        g.strokeStyle = "rgba(150,126,92," + a + ")";
        g.lineWidth = .5 + r() * 2.2;
        g.beginPath(); g.moveTo(0, y);
        for (var x = 0; x <= s; x += 32) g.lineTo(x, y + Math.sin(x * .017 + i) * (1 + r() * 2));
        g.stroke();
      }
      for (var k = 0; k < 24; k++) {
        g.strokeStyle = "rgba(8,7,6,.22)"; g.lineWidth = 1 + r() * 2;
        var cx = r() * s, cy = r() * s;
        g.beginPath(); g.ellipse(cx, cy, 9 + r() * 22, 3 + r() * 6, r() * .4, 0, Math.PI * 2); g.stroke();
      }
    });

    // 石墙（上部）
    M.wall = tex(512, function (g, s) {
      var r = rand(31);
      g.fillStyle = "#404a47"; g.fillRect(0, 0, s, s);
      for (var i = 0; i < 2600; i++) {
        var v = 48 + Math.floor(r() * 42);
        g.fillStyle = "rgba(" + v + "," + (v + 8) + "," + (v + 5) + "," + (.10 + r() * .3) + ")";
        g.fillRect(r() * s, r() * s, 1 + r() * 7, 1 + r() * 4);
      }
      for (var k = 0; k < 22; k++) {
        softBlob(g, r() * s, r() * s, 22 + r() * 60, "18,28,26", .10);
      }
    }, { repeat: [1, 5] });

    // 宣纸 / 旧纸色
    M.paper = tex(256, function (g, s) {
      var r = rand(43);
      g.fillStyle = "#cfc7ae"; g.fillRect(0, 0, s, s);
      for (var i = 0; i < 3600; i++) {
        g.fillStyle = "rgba(120,108,86," + (.02 + r() * .09) + ")";
        g.fillRect(r() * s, r() * s, 1 + r() * 3, 1);
      }
      for (var k = 0; k < 14; k++) softBlob(g, r() * s, r() * s, 12 + r() * 40, "150,132,100", .10);
      g.strokeStyle = "rgba(105,92,70,.12)"; g.lineWidth = 1;
      for (var y = 0; y < s; y += 7) { g.beginPath(); g.moveTo(0, y); g.lineTo(s, y + 1); g.stroke(); }
    }, { clamp: true });

    // 窗纸：从外面按着几个模糊手掌印（负面词要「字迹模糊不可辨」，这里只留压痕）
    M.windowPaper = tex(512, function (g, s) {
      var r = rand(57);
      g.fillStyle = "#c8c4b2"; g.fillRect(0, 0, s, s);
      for (var i = 0; i < 2600; i++) {
        g.fillStyle = "rgba(120,116,98," + (.02 + r() * .09) + ")";
        g.fillRect(r() * s, r() * s, 1 + r() * 3, 1);
      }
      // 宣纸帘纹
      g.strokeStyle = "rgba(112,108,90,.10)"; g.lineWidth = 1;
      for (var y = 0; y < s; y += 9) { g.beginPath(); g.moveTo(0, y); g.lineTo(s, y); g.stroke(); }
      // 三处模糊掌压：掌根一团 + 五条短指印，全部低对比、边缘发虚
      [[150, 190, 1.0], [330, 300, .82], [250, 430, .62]].forEach(function (p) {
        var cx = p[0], cy = p[1], sc = p[2];
        for (var a = 0; a < 5; a++) {
          var ang = -Math.PI * .78 + a * .34;
          var fx = cx + Math.cos(ang) * 66 * sc, fy = cy + Math.sin(ang) * 66 * sc;
          softBlob(g, fx, fy, 20 * sc, "70,82,78", .26);
        }
        softBlob(g, cx, cy, 54 * sc, "66,80,75", .30);
        softBlob(g, cx, cy + 28 * sc, 34 * sc, "120,124,116", .07);
      });
      for (var k = 0; k < 9; k++) softBlob(g, r() * s, r() * s, 20 + r() * 46, "130,126,108", .07);
    }, { clamp: true });

    // 朱笔水牌 / 须知木牌：只画散笔与晕开的朱痕，绝不构成可辨字
    M.notice = tex(512, function (g, s) {
      var r = rand(71);
      g.fillStyle = "#c6bda4"; g.fillRect(0, 0, s, s);
      for (var i = 0; i < 2200; i++) {
        g.fillStyle = "rgba(110,98,78," + (.02 + r() * .08) + ")";
        g.fillRect(r() * s, r() * s, 1 + r() * 3, 1);
      }
      g.lineCap = "round";
      for (var row = 0; row < 6; row++) {
        var yy = 62 + row * 72;
        for (var c = 0; c < 3 + (r() * 3 | 0); c++) {
          var xx = 58 + c * 96 + (r() - .5) * 22;
          g.strokeStyle = row === 0 ? "rgba(142,58,44," + (.28 + r() * .22) + ")"
                                    : "rgba(48,44,40," + (.13 + r() * .15) + ")";
          g.lineWidth = 3 + r() * 4;
          g.beginPath();
          g.moveTo(xx, yy); g.lineTo(xx + 18 + r() * 30, yy + (r() - .5) * 8);
          g.moveTo(xx + 12, yy - 12); g.lineTo(xx + 9, yy + 16);
          if (r() > .45) { g.moveTo(xx - 3, yy + 8); g.lineTo(xx + 28, yy + 12); }
          g.stroke();
        }
      }
      // 一点朱砂（全画面 <5%）
      softBlob(g, 410, 442, 26, "150,52,38", .30);
      for (var k = 0; k < 10; k++) softBlob(g, r() * s, r() * s, 16 + r() * 38, "128,116,96", .08);
    }, { clamp: true });

    // 竹牌：竹黄 + 模糊朱痕
    M.bamboo = tex(256, function (g, s) {
      var r = rand(83);
      g.fillStyle = "#b8a575"; g.fillRect(0, 0, s, s);
      for (var i = 0; i < 60; i++) {
        g.strokeStyle = "rgba(96,82,52," + (.05 + r() * .10) + ")"; g.lineWidth = .6 + r() * 1.6;
        var y = r() * s; g.beginPath(); g.moveTo(0, y); g.lineTo(s, y + (r() - .5) * 5); g.stroke();
      }
      g.strokeStyle = "rgba(142,54,40,.30)"; g.lineWidth = 5; g.lineCap = "round";
      g.beginPath(); g.moveTo(96, 78); g.lineTo(150, 84);
      g.moveTo(122, 62); g.lineTo(118, 150); g.moveTo(100, 124); g.lineTo(156, 130); g.stroke();
      softBlob(g, 128, 128, 60, "110,92,60", .08);
    }, { clamp: true });

    // 空白路引：两半、骑缝、边缘泛黄；不写任何字
    M.pass = tex(512, function (g, s) {
      var r = rand(97);
      g.fillStyle = "#d3c9ae"; g.fillRect(0, 0, s, s);
      for (var i = 0; i < 3200; i++) {
        g.fillStyle = "rgba(112,98,76," + (.02 + r() * .08) + ")";
        g.fillRect(r() * s, r() * s, 1 + r() * 3, 1);
      }
      g.strokeStyle = "rgba(96,84,64,.24)"; g.lineWidth = 2;
      g.strokeRect(18, 18, s - 36, s - 36);
      g.strokeStyle = "rgba(96,84,64,.14)"; g.lineWidth = 1;
      g.strokeRect(28, 28, s - 56, s - 56);
      for (var row = 0; row < 5; row++) {
        g.strokeStyle = "rgba(74,68,58," + (.07 + r() * .05) + ")"; g.lineWidth = 2;
        g.beginPath(); g.moveTo(60, 110 + row * 74); g.lineTo(s - 60, 110 + row * 74 + (r() - .5) * 6); g.stroke();
      }
      for (var k = 0; k < 12; k++) softBlob(g, r() * s, r() * s, 18 + r() * 46, "140,120,88", .09);
    }, { clamp: true });

    // 纸扎人糊纸：正面交领衣纹（朝墙，几乎看不到）／背面纸壳 + 竹篾透痕。
    // 画风锁：灰白旧纸色、无脸谱朱砂、不点睛。
    // 素脸只留空眼窝与糊纸压痕（见 M.folkFace），衣纹一律用淡墨硬折线，
    // 底色与袍身 / 头袖同一张 #6c6d61 旧纸，不引入任何新色相。
    M.folkFront = tex(256, function (g, s) {
      var r = rand(113);
      g.fillStyle = "#6c6d61"; g.fillRect(0, 0, s, s);
      for (var f = 0; f < 2400; f++) {
        g.fillStyle = "rgba(78,78,68," + (.02 + r() * .10) + ")";
        g.fillRect(r() * s, r() * s, 1 + r() * 3, 1);
      }
      // 内襟（里层）：交领下方露出的一块浅色纸，压出「里面还有一层」
      g.fillStyle = "rgba(152,152,136,.16)";
      g.beginPath(); g.moveTo(96, 28); g.lineTo(160, 28); g.lineTo(128, 120); g.closePath(); g.fill();
      // 交领右衽：外襟是有宽度的深色纸带，不是两根线；左襟压右襟形成不对称 y
      g.fillStyle = "rgba(48,48,42,.30)";
      g.beginPath(); g.moveTo(86, 24); g.lineTo(102, 22); g.lineTo(150, 112); g.lineTo(135, 118); g.closePath(); g.fill();
      g.fillStyle = "rgba(48,48,42,.24)";
      g.beginPath(); g.moveTo(170, 24); g.lineTo(154, 22); g.lineTo(118, 100); g.lineTo(133, 106); g.closePath(); g.fill();
      // 领缘高光：每条纸带内侧一道细亮边，读得出纸片厚度
      g.strokeStyle = "rgba(170,170,152,.14)"; g.lineWidth = 2;
      g.beginPath(); g.moveTo(102, 24); g.lineTo(150, 112); g.stroke();
      g.beginPath(); g.moveTo(154, 24); g.lineTo(118, 100); g.stroke();
      // 袖窿：两道腋下弧，把肩与袍身分开
      g.strokeStyle = "rgba(54,54,46,.22)"; g.lineWidth = 3;
      g.beginPath(); g.moveTo(32, 42); g.quadraticCurveTo(62, 76, 66, 118); g.stroke();
      g.beginPath(); g.moveTo(224, 42); g.quadraticCurveTo(194, 76, 190, 118); g.stroke();
      // 腰束带 + 上下两道糊缝
      g.fillStyle = "rgba(46,46,40,.16)"; g.fillRect(24, 152, 208, 20);
      g.strokeStyle = "rgba(44,44,38,.28)"; g.lineWidth = 3;
      g.beginPath(); g.moveTo(24, 152); g.lineTo(232, 152); g.stroke();
      g.strokeStyle = "rgba(170,170,152,.10)"; g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(24, 173); g.lineTo(232, 173); g.stroke();
      // 从腰部放射的衣褶：一深一浅并排才有折面，单独几根线只会像划痕
      [[62, 228], [96, 214], [160, 204], [194, 226]].forEach(function (p, i) {
        var x0 = 108 + i * 13, x1 = p[0], y1 = p[1];
        g.strokeStyle = "rgba(50,50,44,.20)"; g.lineWidth = 3;
        g.beginPath(); g.moveTo(x0, 176); g.lineTo(x1, y1); g.stroke();
        g.strokeStyle = "rgba(166,166,148,.10)"; g.lineWidth = 2;
        g.beginPath(); g.moveTo(x0 + 4, 176); g.lineTo(x1 + 4, y1); g.stroke();
      });
      g.strokeStyle = "rgba(54,54,46,.24)"; g.lineWidth = 2.4;
      g.beginPath(); g.moveTo(128, 176); g.lineTo(128, 242); g.stroke();
      // 摆缘包边：一条有宽度的深色纸边
      g.fillStyle = "rgba(48,48,42,.20)"; g.fillRect(16, 232, 224, 9);
      g.strokeStyle = "rgba(170,170,152,.10)"; g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(16, 232); g.lineTo(240, 232); g.stroke();
      for (var k = 0; k < 9; k++) softBlob(g, r() * s, r() * s, 12 + r() * 30, "120,118,104", .06);
      softBlob(g, 128, 132, 42, "122,62,50", .035);  // 极淡一点朱，落在衣上不是脸
    }, { clamp: true });
    M.folkBack = tex(256, function (g, s) {
      var r = rand(127);
      g.fillStyle = "#787568"; g.fillRect(0, 0, s, s);
      for (var i = 0; i < 2800; i++) {
        g.fillStyle = "rgba(86,84,74," + (.02 + r() * .10) + ")";
        g.fillRect(r() * s, r() * s, 1 + r() * 3, 1);
      }
      // 糊纸下面的竹篾骨架：一道脊 + 三道横撑，只在纸背透出极淡暗影
      g.strokeStyle = "rgba(58,58,52,.13)"; g.lineWidth = 5;
      g.beginPath(); g.moveTo(128, 16); g.lineTo(128, 244); g.stroke();
      g.strokeStyle = "rgba(58,58,52,.10)"; g.lineWidth = 4;
      [52, 116, 182].forEach(function (y) {
        g.beginPath(); g.moveTo(36, y); g.lineTo(220, y + (r() - .5) * 6); g.stroke();
      });
      // 肩胛：两道从颈根斜向腋下的折线，背后也能读出「有肩」
      g.strokeStyle = "rgba(72,70,62,.20)"; g.lineWidth = 2.4;
      g.beginPath(); g.moveTo(120, 40); g.lineTo(58, 78); g.stroke();
      g.beginPath(); g.moveTo(136, 40); g.lineTo(198, 78); g.stroke();
      // 中缝与横向硬折（纸折线，不是柔软布褶）
      g.strokeStyle = "rgba(78,76,68,.17)"; g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(128, 18); g.lineTo(128, 238); g.stroke();
      g.strokeStyle = "rgba(78,76,68,.10)"; g.lineWidth = 1.2;
      for (var k = 0; k < 6; k++) {
        var y = 92 + k * 26;
        g.beginPath(); g.moveTo(30, y); g.lineTo(226, y + (r() - .5) * 9); g.stroke();
      }
      // —— 袍服背面衣纹 ——
      // 玩家在廊内看到的正是这一面。此前只有竹篾骨架暗影，读起来是「一块板」；
      // 现在补出后领缘、衣襟侧缘、腰带、垂带与下摆硬折，全是纸折的硬直线。
      // 后领缘：一道弧形糊纸边，比骨架线略深
      g.strokeStyle = "rgba(56,54,48,.30)"; g.lineWidth = 6;
      g.beginPath(); g.moveTo(86, 30); g.quadraticCurveTo(128, 49, 170, 30); g.stroke();
      g.strokeStyle = "rgba(98,96,86,.16)"; g.lineWidth = 2;
      g.beginPath(); g.moveTo(89, 35); g.quadraticCurveTo(128, 52, 167, 35); g.stroke();
      // 衣襟侧缘：从腋下贯到袍摆的两道硬折
      g.strokeStyle = "rgba(60,58,50,.22)"; g.lineWidth = 3;
      g.beginPath(); g.moveTo(34, 62); g.lineTo(46, 240); g.stroke();
      g.beginPath(); g.moveTo(222, 62); g.lineTo(210, 240); g.stroke();
      // 腰带：两道糊缝 + 中间一个纸结
      g.strokeStyle = "rgba(52,52,46,.32)"; g.lineWidth = 5;
      g.beginPath(); g.moveTo(28, 157); g.lineTo(228, 157); g.stroke();
      g.strokeStyle = "rgba(98,96,86,.18)"; g.lineWidth = 2;
      g.beginPath(); g.moveTo(28, 166); g.lineTo(228, 166); g.stroke();
      g.fillStyle = "rgba(56,56,48,.24)"; g.fillRect(118, 153, 20, 17);
      // 腰带下两条垂带
      g.strokeStyle = "rgba(62,60,52,.20)"; g.lineWidth = 3;
      g.beginPath(); g.moveTo(122, 170); g.lineTo(118, 222); g.stroke();
      g.beginPath(); g.moveTo(136, 170); g.lineTo(140, 218); g.stroke();
      // 云肩 / 披领在背面的投影：两道如意弧，肩部不再是一整块平纸
      g.strokeStyle = "rgba(50,50,44,.24)"; g.lineWidth = 4;
      g.beginPath(); g.moveTo(28, 46); g.quadraticCurveTo(78, 76, 128, 60);
      g.quadraticCurveTo(178, 76, 228, 46); g.stroke();
      g.strokeStyle = "rgba(166,166,148,.10)"; g.lineWidth = 2;
      g.beginPath(); g.moveTo(28, 51); g.quadraticCurveTo(78, 81, 128, 65);
      g.quadraticCurveTo(178, 81, 228, 51); g.stroke();
      // 下摆竖向硬折：明确是「袍」不是「板」；每条折配一道亮边成折面
      [70, 106, 150, 186].forEach(function (x) {
        var ex = x + (r() - .5) * 16;
        g.strokeStyle = "rgba(60,58,50,.22)"; g.lineWidth = 2.6;
        g.beginPath(); g.moveTo(x, 172); g.lineTo(ex, 240); g.stroke();
        g.strokeStyle = "rgba(166,166,148,.09)"; g.lineWidth = 1.8;
        g.beginPath(); g.moveTo(x + 4, 172); g.lineTo(ex + 4, 240); g.stroke();
      });
      // 摆缘包边
      g.fillStyle = "rgba(48,48,42,.18)"; g.fillRect(14, 232, 228, 9);
      g.strokeStyle = "rgba(166,166,148,.09)"; g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(14, 232); g.lineTo(242, 232); g.stroke();
      // 旧水渍，别像新裁的纸
      for (var w = 0; w < 5; w++) softBlob(g, r() * s, r() * s, 22 + r() * 34, "96,94,82", .05);
      // 边缘毛糙，别像裁齐的立牌
      g.globalCompositeOperation = "destination-out";
      for (var e = 0; e < 90; e++) {
        var ex = (r() > .5 ? 0 : s - 1) + (r() - .5) * 12;
        g.fillStyle = "rgba(0,0,0," + (.2 + r() * .5) + ")";
        g.fillRect(ex, r() * s, 2 + r() * 7, 1 + r() * 3);
      }
    }, { clamp: true });

    // 头 / 袖 / 肩头用的中性糊纸：与袍身同一底色和纸纤维，但不带骨架十字暗线
    // （球面套上十字会像缠绷带）。明度压到不比袍身亮，保证整个人是同一张旧纸。
    M.folkPlain = tex(256, function (g, s) {
      var r = rand(163);
      g.fillStyle = "#6c6d61"; g.fillRect(0, 0, s, s);
      for (var i = 0; i < 2600; i++) {
        g.fillStyle = "rgba(78,78,68," + (.02 + r() * .10) + ")";
        g.fillRect(r() * s, r() * s, 1 + r() * 3, 1);
      }
      g.strokeStyle = "rgba(72,72,62,.07)"; g.lineWidth = 1;
      for (var k = 0; k < 9; k++) {
        var y = k * 30 + r() * 8;
        g.beginPath(); g.moveTo(0, y); g.lineTo(s, y); g.stroke();
      }
      for (var w = 0; w < 4; w++) softBlob(g, r() * s, r() * s, 20 + r() * 30, "88,88,76", .05);
    }, { clamp: true });

    // 层叠纸衣专用糊纸：比头 / 袖亮一档，给云肩、衣襟、腰带、飘带、包边分层。
    // 关键是「带纸纤维」—— 纯色材质正对冷白灯会过曝成白塑料片，
    // 有纹理压住亮度后，衣服的层叠形状仍在，但整件仍读成同一张旧纸。
    M.folkCloth = tex(256, function (g, s) {
      var r = rand(179);
      g.fillStyle = "#82837a"; g.fillRect(0, 0, s, s);
      for (var i = 0; i < 2800; i++) {
        g.fillStyle = "rgba(96,96,84," + (.02 + r() * .09) + ")";
        g.fillRect(r() * s, r() * s, 1 + r() * 3, 1);
      }
      // 几道浅压痕：一层层糊上去的接缝，不是印上去的花纹
      g.strokeStyle = "rgba(72,72,62,.10)"; g.lineWidth = 1.2;
      for (var k = 0; k < 7; k++) {
        var y = k * 36 + r() * 10;
        g.beginPath(); g.moveTo(0, y); g.lineTo(s, y + (r() - .5) * 8); g.stroke();
      }
      for (var w = 0; w < 5; w++) softBlob(g, r() * s, r() * s, 18 + r() * 30, "104,104,92", .05);
    }, { clamp: true });

    // 墨发：不是纯黑，是旧纸灰褐再压暗一档，竖向纸纤维当发丝。
    // 3D 发帽 / 发髻 / 鬓发共用这一张，和袍身仍是同一材质词族。
    M.folkHair = tex(128, function (g, s) {
      var r = rand(211);
      g.fillStyle = "#3e4038"; g.fillRect(0, 0, s, s);
      for (var i = 0; i < 900; i++) {
        g.fillStyle = "rgba(26,28,24," + (.05 + r() * .18) + ")";
        g.fillRect(r() * s, r() * s, 1, 2 + r() * 6);
      }
      g.strokeStyle = "rgba(22,24,20,.24)"; g.lineWidth = 1.2;
      for (var k = 0; k < 18; k++) {
        var x = k * 8 + r() * 4;
        g.beginPath(); g.moveTo(x, 0);
        g.bezierCurveTo(x + 5, s * .34, x - 5, s * .68, x + 2, s);
        g.stroke();
      }
    }, { clamp: true });

    // 人脸：mina 要「随便做个人脸」，别再只给糊纸压痕。
    // 发际 / 鬓角 / 眉 / 杏仁眼 / 瞳 / 鼻梁鼻翼 / 有唇形的嘴都画清楚；
    // 一律用旧纸灰褐的淡墨深浅，不点朱砂、不上彩、不画脸谱，画风仍统一。
    // ?plainface=1 可一键回到「不点睛」的 v3 版，比赛若要严守无点睛约束。
    var PLAIN_FACE = /plainface=1/.test(window.location.search);
    M.folkFace = tex(256, function (g, s) {
      var r = rand(197);
      g.fillStyle = "#86877a"; g.fillRect(0, 0, s, s);
      for (var i = 0; i < 2400; i++) {
        g.fillStyle = "rgba(78,78,68," + (.02 + r() * .10) + ")";
        g.fillRect(r() * s, r() * s, 1 + r() * 3, 1);
      }
      // 发际 + 鬓角：M 形下缘，上半是墨发（3D 发帽负责头顶与后脑）
      g.fillStyle = "rgba(48,50,43,.92)";
      g.beginPath();
      g.moveTo(28, 44);
      g.quadraticCurveTo(128, -26, 228, 44);
      g.lineTo(228, 104);
      g.quadraticCurveTo(196, 76, 168, 88);
      g.quadraticCurveTo(150, 62, 128, 74);
      g.quadraticCurveTo(106, 62, 88, 88);
      g.quadraticCurveTo(60, 76, 28, 104);
      g.closePath(); g.fill();
      // 两颊极淡灰褐晕（不是腮红、不是朱砂）
      softBlob(g, 88, 158, 30, "120,108,96", .10);
      softBlob(g, 168, 158, 30, "120,108,96", .10);
      // 眉：有弧度的短眉
      g.strokeStyle = "rgba(44,46,40,.74)"; g.lineWidth = 5; g.lineCap = "round";
      g.beginPath(); g.moveTo(82, 110); g.quadraticCurveTo(102, 99, 120, 108); g.stroke();
      g.beginPath(); g.moveTo(136, 108); g.quadraticCurveTo(154, 99, 174, 110); g.stroke();
      // 眼：杏仁形眼白 + 上下眼睑 + 瞳（?plainface=1 时留空窝）
      [[100, 128], [156, 128]].forEach(function (e) {
        var x = e[0], y = e[1];
        g.fillStyle = "rgba(216,218,204,.50)";
        g.beginPath(); g.ellipse(x, y, 18, 8, 0, 0, Math.PI * 2); g.fill();
        g.strokeStyle = "rgba(36,38,32,.80)"; g.lineWidth = 3;
        g.beginPath(); g.moveTo(x - 19, y - 1);
        g.quadraticCurveTo(x, y - 13, x + 19, y - 1); g.stroke();
        g.beginPath(); g.moveTo(x - 19, y - 1);
        g.quadraticCurveTo(x, y + 10, x + 19, y - 1); g.stroke();
        if (!PLAIN_FACE) {
          g.fillStyle = "rgba(30,32,27,.90)";
          g.beginPath(); g.ellipse(x, y, 5.6, 6.2, 0, 0, Math.PI * 2); g.fill();
          g.fillStyle = "rgba(222,224,210,.55)";
          g.beginPath(); g.arc(x - 2, y - 2.4, 1.7, 0, Math.PI * 2); g.fill();
        }
      });
      // 鼻：鼻梁 + 鼻底弧 + 两个鼻孔暗点
      g.strokeStyle = "rgba(42,44,38,.60)"; g.lineWidth = 2.6;
      g.beginPath(); g.moveTo(124, 136); g.lineTo(120, 166); g.stroke();
      g.beginPath(); g.moveTo(117, 166); g.quadraticCurveTo(128, 173, 139, 166); g.stroke();
      g.fillStyle = "rgba(38,40,34,.50)";
      g.beginPath(); g.ellipse(120, 166, 3, 2, 0, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.ellipse(136, 166, 3, 2, 0, 0, Math.PI * 2); g.fill();
      // 嘴：上唇弓 + 下唇，不笑不哭
      g.strokeStyle = "rgba(38,40,34,.70)"; g.lineWidth = 3;
      g.beginPath(); g.moveTo(110, 192);
      g.quadraticCurveTo(118, 186, 128, 190);
      g.quadraticCurveTo(138, 186, 146, 192); g.stroke();
      g.beginPath(); g.moveTo(110, 192);
      g.quadraticCurveTo(128, 202, 146, 192); g.stroke();
      // 脸缘 + 下颌糊纸接缝
      g.strokeStyle = "rgba(58,60,52,.32)"; g.lineWidth = 2;
      g.beginPath(); g.ellipse(128, 132, 66, 92, 0, 0, Math.PI * 2); g.stroke();
      g.strokeStyle = "rgba(62,64,56,.20)"; g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(96, 214); g.lineTo(160, 212); g.stroke();
      for (var w = 0; w < 5; w++) softBlob(g, r() * s, r() * s, 18 + r() * 28, "92,92,80", .05);
      // 边缘径向渐隐：糊纸脸自然融进头壳，不是硬裁的一块方板
      g.globalCompositeOperation = "destination-in";
      var gr = g.createRadialGradient(128, 126, 58, 128, 126, 124);
      gr.addColorStop(0, "rgba(0,0,0,1)");
      gr.addColorStop(.76, "rgba(0,0,0,1)");
      gr.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = gr; g.fillRect(0, 0, s, s);
      g.globalCompositeOperation = "source-over";
    }, { clamp: true });

    // 团雾：大团 + 擦空隙 + 卷云纹，供窗外 / 尽头雾幕 / 贴地烟共用
    M.fog = tex(512, function (g, s) {
      var r = rand(149);
      g.clearRect(0, 0, s, s);
      for (var i = 0; i < 30; i++) {
        softBlob(g, r() * s, r() * s, 42 + r() * 128, "224,232,229", .07 + r() * .10);
      }
      g.globalCompositeOperation = "destination-out";
      for (var k = 0; k < 28; k++) {
        var x = r() * s, y = r() * s, rr = 26 + r() * 68;
        var gr = g.createRadialGradient(x, y, 0, x, y, rr);
        gr.addColorStop(0, "rgba(0,0,0,.55)"); gr.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = gr; g.beginPath(); g.arc(x, y, rr, 0, Math.PI * 2); g.fill();
      }
      g.globalCompositeOperation = "source-over";
      g.strokeStyle = "rgba(236,242,238,.07)"; g.lineWidth = 3;
      for (var c = 0; c < 9; c++) {
        var cx = r() * s, cy = r() * s;
        g.beginPath(); g.arc(cx, cy, 18 + r() * 40, .4, 2.6); g.stroke();
      }
    }, { clamp: true });

    // 湿脚印：深色湿痕 + 一点冷反光
    M.wet = tex(128, function (g, s) {
      var r = rand(163);
      g.clearRect(0, 0, s, s);
      softBlob(g, 64, 64, 44, "18,28,27", .36);
      g.fillStyle = "rgba(20,32,30,.28)";
      g.beginPath(); g.ellipse(64, 68, 20, 34, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = "rgba(20,32,30,.24)";
      g.beginPath(); g.ellipse(64, 26, 15, 13, 0, 0, Math.PI * 2); g.fill();
      // 湿痕靠一圈冷白水光读出来，深色底上才看得见
      softBlob(g, 52, 44, 32, "206,230,222", .80);
      g.strokeStyle = "rgba(206,232,224,.72)"; g.lineWidth = 3.4;
      g.beginPath(); g.ellipse(64, 66, 22, 36, 0, 0, Math.PI * 2); g.stroke();
      for (var i = 0; i < 40; i++) {
        g.fillStyle = "rgba(196,220,214," + (.03 + r() * .10) + ")";
        g.fillRect(r() * s, r() * s, 1 + r() * 3, 1);
      }
    }, { clamp: true });

    // 贴地烟：横向拉长的柔雾条
    M.smoke = tex(256, function (g, s) {
      var r = rand(181);
      g.clearRect(0, 0, s, s);
      for (var i = 0; i < 28; i++) {
        softBlob(g, r() * s, 128 + (r() - .5) * 70, 26 + r() * 70, "206,216,211", .10 + r() * .10);
      }
      g.globalCompositeOperation = "destination-out";
      for (var k = 0; k < 12; k++) {
        var x = r() * s, y = 128 + (r() - .5) * 100;
        var gr = g.createRadialGradient(x, y, 0, x, y, 20 + r() * 34);
        gr.addColorStop(0, "rgba(0,0,0,.6)"); gr.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = gr; g.beginPath(); g.arc(x, y, 54, 0, Math.PI * 2); g.fill();
      }
    }, { clamp: true });

    // 骑缝半印：一小点朱砂，通关后落上
    M.seal = tex(128, function (g, s) {
      g.clearRect(0, 0, s, s);
      g.fillStyle = "rgba(150,52,38,.72)";
      g.fillRect(22, 22, 84, 84);
      g.globalCompositeOperation = "destination-out";
      g.strokeStyle = "rgba(0,0,0,.9)"; g.lineWidth = 7;
      g.strokeRect(34, 34, 60, 60);
      g.beginPath(); g.moveTo(64, 34); g.lineTo(64, 94); g.stroke();
      g.globalCompositeOperation = "source-over";
      softBlob(g, 64, 64, 50, "160,60,42", .18);
    }, { clamp: true });

    // 引导微光
    M.glow = tex(128, function (g, s) {
      softBlob(g, 64, 64, 62, "196,232,222", .55);
      softBlob(g, 64, 64, 28, "232,248,242", .42);
    }, { clamp: true });

    // ——— v28 判官崔珏专用贴图 ———
    // 造型依据：《西游记》第十一回「头顶乌纱飘软带，腰围犀角显金厢……
    // 身著罗袍隐瑞光……怀揣一本生死簿……鬓发蓬松飘耳上，胡须飞舞绕腮旁」；
    // 动漫 / 游戏判官造型补了垂缨冠横簪、宽袍 + 续平绪垂带、右手执笔左手捧簿。
    // 配色仍锁在青灰冷调：罗袍用墨青而非大红，朱砂只在笔尖 / 带扣 / 印上
    // 留不到 5%，不引入暖色，不与满场灰白旧纸打架。
    M.judgeRobe = tex(256, function (g, s) {
      var r = rand(313);
      g.fillStyle = "#39433f"; g.fillRect(0, 0, s, s);
      for (var i = 0; i < 2600; i++) {
        g.fillStyle = "rgba(20,26,24," + (.03 + r() * .10) + ")";
        g.fillRect(r() * s, r() * s, 1 + r() * 3, 1);
      }
      // 暗团云纹：淡墨弧线，远看是织纹，近看才读出云头；不是可读图案
      g.strokeStyle = "rgba(158,178,168,.12)"; g.lineWidth = 1.8;
      for (var k = 0; k < 11; k++) {
        var cx = r() * s, cy = r() * s;
        g.beginPath();
        g.moveTo(cx - 22, cy);
        g.bezierCurveTo(cx - 12, cy - 13, cx + 12, cy - 13, cx + 22, cy);
        g.bezierCurveTo(cx + 11, cy + 9, cx - 11, cy + 9, cx - 22, cy);
        g.stroke();
      }
      for (var w = 0; w < 4; w++) softBlob(g, r() * s, r() * s, 22 + r() * 26, "24,30,28", .06);
    }, { clamp: true });

    // 胸前补子：一方暗银云纹，给墨青袍身一个视觉落点（不写字、不画兽）
    M.judgeCloud = tex(128, function (g, s) {
      var r = rand(317);
      g.fillStyle = "#4b5751"; g.fillRect(0, 0, s, s);
      g.strokeStyle = "rgba(176,196,186,.34)"; g.lineWidth = 2;
      g.strokeRect(9, 9, s - 18, s - 18);
      g.lineWidth = 2.4;
      for (var k = 0; k < 3; k++) {
        var y = 40 + k * 26;
        g.beginPath(); g.moveTo(26, y + 8);
        g.bezierCurveTo(36, y - 12, 54, y - 12, 64, y + 4);
        g.bezierCurveTo(74, y - 12, 92, y - 12, 102, y + 8); g.stroke();
      }
      for (var i = 0; i < 700; i++) {
        g.fillStyle = "rgba(24,30,28," + (.03 + r() * .08) + ")";
        g.fillRect(r() * s, r() * s, 1 + r() * 2, 1);
      }
    }, { clamp: true });

    // 乌纱：近黑的墨青，细横纱纹；不是纯黑块
    M.judgeHat = tex(128, function (g, s) {
      var r = rand(331);
      g.fillStyle = "#232a27"; g.fillRect(0, 0, s, s);
      g.strokeStyle = "rgba(120,138,130,.13)"; g.lineWidth = 1;
      for (var y = 0; y < s; y += 4) {
        g.beginPath(); g.moveTo(0, y); g.lineTo(s, y); g.stroke();
      }
      for (var i = 0; i < 500; i++) {
        g.fillStyle = "rgba(8,12,10," + (.04 + r() * .08) + ")";
        g.fillRect(r() * s, r() * s, 1 + r() * 3, 1);
      }
    }, { clamp: true });

    // 生死簿封面：泛旧纸 + 模糊竖笔痕。v3 负面词禁「清晰文字」，
    // 所以只留看不清的墨痕，不写任何一个可辨的字。
    M.judgeBook = tex(128, function (g, s) {
      var r = rand(337);
      g.fillStyle = "#83826f"; g.fillRect(0, 0, s, s);
      for (var i = 0; i < 1400; i++) {
        g.fillStyle = "rgba(70,70,58," + (.02 + r() * .09) + ")";
        g.fillRect(r() * s, r() * s, 1 + r() * 3, 1);
      }
      g.strokeStyle = "rgba(56,58,48,.30)"; g.lineWidth = 2;
      g.strokeRect(8, 8, s - 16, s - 16);
      // 几列糊掉的竖笔痕：像写过字，但一个也认不出来
      for (var c = 0; c < 4; c++) {
        var x = 34 + c * 20;
        g.strokeStyle = "rgba(48,50,42," + (.10 + r() * .10) + ")";
        g.lineWidth = 2.2;
        for (var k = 0; k < 5; k++) {
          var y = 26 + k * 18 + r() * 4;
          g.beginPath(); g.moveTo(x, y);
          g.quadraticCurveTo(x + (r() - .5) * 6, y + 6, x + (r() - .5) * 5, y + 11);
          g.stroke();
        }
      }
      for (var w = 0; w < 3; w++) softBlob(g, r() * s, r() * s, 16 + r() * 22, "84,80,64", .07);
    }, { clamp: true });

    // v29 细化：暗绣回纹（领缘 / 袖口 / 帽缘 / 袍摆）。取《神都夜行录》崔珏
    // 「边缘隐隐金色刺绣花纹」与《决战!平安京》判官的表袴大口纹，但压成灰青淡墨，
    // 不用金、不写字、不画兽 —— 远看只是衣缘的一道织纹。
    M.judgeBrocade = tex(128, function (g, s) {
      var r = rand(359);
      g.fillStyle = "#47534c"; g.fillRect(0, 0, s, s);
      g.strokeStyle = "rgba(174,196,184,.28)"; g.lineWidth = 1.8;
      for (var y = 8; y < s; y += 16) {
        for (var x = 8; x < s; x += 16) {
          g.beginPath();
          g.moveTo(x, y + 11); g.lineTo(x, y + 2); g.lineTo(x + 11, y + 2);
          g.lineTo(x + 11, y + 9); g.lineTo(x + 4, y + 9); g.stroke();
        }
      }
      for (var i = 0; i < 500; i++) {
        g.fillStyle = "rgba(20,26,24," + (.03 + r() * .07) + ")";
        g.fillRect(r() * s, r() * s, 1 + r() * 2, 1);
      }
    }, { clamp: true });

    // v29 细化：《阴阳师》判官「逸墨沾衣」—— 袖口几滴飞墨，透明底只叠暗度
    M.judgeInk = tex(128, function (g, s) {
      g.clearRect(0, 0, s, s);
      softBlob(g, 52, 60, 20, "18,24,22", .34);
      softBlob(g, 78, 76, 11, "18,24,22", .26);
      softBlob(g, 38, 88, 7, "18,24,22", .20);
      softBlob(g, 96, 48, 5, "18,24,22", .18);
    }, { clamp: true });

    // 判官的脸：不是纸扎人那种空茫的糊纸脸，是「昔日曾为唐国相」的清瘦长者。
    // 长眉入鬓、细长眼、挺鼻梁、薄唇、法令纹与颧骨淡影；八字须和颌下须根
    // 先画在脸上，垂到胸前的长须由 3D 纸片接下去（会随身体微微飘）。
    // 淡墨深浅 + 旧纸底色，不点朱砂、不上彩、不画脸谱。
    M.judgeFace = tex(256, function (g, s) {
      var r = rand(347);
      // v30：底色压回旧纸灰褐明度带，v29 的 #888a7c 在冷雾里亮成一张独立白面具
      g.fillStyle = "#74766a"; g.fillRect(0, 0, s, s);
      for (var i = 0; i < 2200; i++) {
        g.fillStyle = "rgba(78,78,68," + (.02 + r() * .09) + ")";
        g.fillRect(r() * s, r() * s, 1 + r() * 3, 1);
      }
      // 发际：比纸人更高更方，两鬓略退；同步压淡，避免「黑发压白脸」的脸谱感
      g.fillStyle = "rgba(46,48,41,.78)";
      g.beginPath();
      g.moveTo(24, 40); g.quadraticCurveTo(128, -22, 232, 40);
      g.lineTo(232, 92); g.quadraticCurveTo(198, 66, 172, 80);
      g.quadraticCurveTo(150, 58, 128, 70); g.quadraticCurveTo(106, 58, 84, 80);
      g.quadraticCurveTo(58, 66, 24, 92); g.closePath(); g.fill();
      // 鬓角蓬松的两簇（原文「鬓发蓬松飘耳上」）
      [[26, 92], [230, 92]].forEach(function (e) {
        g.fillStyle = "rgba(46,48,41,.80)";
        g.beginPath(); g.ellipse(e[0], e[1] + 14, 13, 26, e[0] < 128 ? .28 : -.28, 0, Math.PI * 2); g.fill();
      });
      // 颧骨与下颌的淡影：脸有骨相，不是一张平纸
      softBlob(g, 84, 152, 30, "88,84,72", .11);
      softBlob(g, 172, 152, 30, "88,84,72", .11);
      softBlob(g, 128, 214, 42, "96,92,78", .09);
      // 长眉入鬓（v30：暗廊里要读得出，但纯黑粗勾线会变成简笔漫画，整体压淡半档）
      g.strokeStyle = "rgba(30,32,26,.76)"; g.lineWidth = 5.2; g.lineCap = "round";
      g.beginPath(); g.moveTo(76, 112); g.quadraticCurveTo(100, 96, 124, 110); g.stroke();
      g.beginPath(); g.moveTo(132, 110); g.quadraticCurveTo(156, 96, 180, 112); g.stroke();
      // 眉心一道极淡竖纹（威严，不画成怒容）
      g.strokeStyle = "rgba(48,50,42,.22)"; g.lineWidth = 2.0;
      g.beginPath(); g.moveTo(128, 90); g.lineTo(128, 106); g.stroke();
      // 细长眼：眼白窄、上眼睑压得住，?plainface=1 时留空窝
      [[100, 128], [156, 128]].forEach(function (e) {
        var x = e[0], y = e[1];
        g.fillStyle = "rgba(214,216,202,.34)";
        g.beginPath(); g.ellipse(x, y, 18, 6.5, 0, 0, Math.PI * 2); g.fill();
        g.strokeStyle = "rgba(26,28,22,.78)"; g.lineWidth = 3.2;
        g.beginPath(); g.moveTo(x - 19, y + 1);
        g.quadraticCurveTo(x, y - 11, x + 19, y); g.stroke();
        g.beginPath(); g.moveTo(x - 19, y + 1);
        g.quadraticCurveTo(x, y + 8, x + 19, y); g.stroke();
        if (!PLAIN_FACE) {
          g.fillStyle = "rgba(28,30,25,.80)";
          g.beginPath(); g.ellipse(x, y, 4.4, 5.0, 0, 0, Math.PI * 2); g.fill();
          g.fillStyle = "rgba(226,228,214,.42)";
          g.beginPath(); g.arc(x - 1.8, y - 2.2, 1.4, 0, Math.PI * 2); g.fill();
        }
      });
      // 挺鼻梁 + 鼻底 + 鼻孔
      g.strokeStyle = "rgba(34,36,30,.60)"; g.lineWidth = 3.0;
      g.beginPath(); g.moveTo(126, 134); g.lineTo(121, 166); g.stroke();
      g.beginPath(); g.moveTo(115, 167); g.quadraticCurveTo(128, 175, 141, 167); g.stroke();
      g.fillStyle = "rgba(36,38,32,.40)";
      g.beginPath(); g.ellipse(120, 167, 2.8, 2, 0, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.ellipse(136, 167, 2.8, 2, 0, 0, Math.PI * 2); g.fill();
      // 法令纹两道淡折痕
      g.strokeStyle = "rgba(52,54,46,.18)"; g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(106, 170); g.quadraticCurveTo(100, 186, 108, 198); g.stroke();
      g.beginPath(); g.moveTo(150, 170); g.quadraticCurveTo(156, 186, 148, 198); g.stroke();
      // 薄唇，面无表情：一条主唇线 + 极淡下唇阴影，不围出 O 形
      g.strokeStyle = "rgba(30,32,26,.74)"; g.lineWidth = 2.6;
      g.beginPath(); g.moveTo(112, 190); g.quadraticCurveTo(128, 187, 144, 190); g.stroke();
      g.strokeStyle = "rgba(44,46,38,.16)"; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(116, 194); g.quadraticCurveTo(128, 198, 140, 194); g.stroke();
      // 八字须（长须的 3D 纸片从这里接下去）
      g.strokeStyle = "rgba(52,54,46,.62)"; g.lineWidth = 4.2; g.lineCap = "round";
      g.beginPath(); g.moveTo(126, 178); g.quadraticCurveTo(112, 174, 98, 184); g.stroke();
      g.beginPath(); g.moveTo(130, 178); g.quadraticCurveTo(144, 174, 158, 184); g.stroke();
      // 不再画颌下深色须根，也不再画脸缘硬描边：v29/v30 实拍里那圈 ellipse
      // 把脸片框成一张贴上去的纸面具。边缘只靠下面的径向渐隐融进头壳。
      // 边缘径向渐隐（v30）：v28 的 86→128 且 .72 处仍全不透明，等于只在最外
      // 12px 软化，脸片边缘还是一条硬椭圆，近景读成贴上去的纸面具。
      // 这里把渐隐带拉宽到 103→132，五官（最大半径约 60）全在实心区内。
      g.globalCompositeOperation = "destination-in";
      var gr = g.createRadialGradient(128, 130, 84, 128, 130, 132);
      gr.addColorStop(0, "rgba(0,0,0,1)");
      gr.addColorStop(.40, "rgba(0,0,0,1)");
      gr.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = gr; g.fillRect(0, 0, s, s);
      g.globalCompositeOperation = "source-over";
    }, { clamp: true });

    return M;
  }

  // —————————————————————— 场景搭建 ——————————————————————
  function build(scene) {
    var M = makeTextures();
    var MAT = {
      stone: new T.MeshStandardMaterial({ map: M.stone, roughness: .94, metalness: .02 }),
      wall: new T.MeshStandardMaterial({ map: M.wall, roughness: .96, metalness: 0 }),
      wood: new T.MeshStandardMaterial({ map: M.wood, roughness: .88, metalness: .02 }),
      woodDark: new T.MeshStandardMaterial({ color: 0x211e1a, roughness: .92 }),
      ceiling: new T.MeshStandardMaterial({ color: 0x070a09, roughness: 1 }),
      paper: new T.MeshStandardMaterial({ map: M.paper, roughness: 1, side: T.DoubleSide }),
      windowPaper: new T.MeshStandardMaterial({ map: M.windowPaper, roughness: 1,
                                               transparent: true, opacity: .96, side: T.DoubleSide }),
      notice: new T.MeshStandardMaterial({ map: M.notice, roughness: 1, side: T.DoubleSide }),
      bamboo: new T.MeshStandardMaterial({ map: M.bamboo, roughness: .9, side: T.DoubleSide }),
      pass: new T.MeshStandardMaterial({ map: M.pass, roughness: 1, side: T.DoubleSide }),
      folkFront: new T.MeshStandardMaterial({ map: M.folkFront, roughness: 1, side: T.DoubleSide }),
      folkBack: new T.MeshStandardMaterial({ map: M.folkBack, roughness: 1, side: T.DoubleSide }),
      // 纸壳侧壁 / 折棱 / 空袖内壁：都在灰白旧纸的明度带里，不引入新的材质词族
      folkWhite: new T.MeshStandardMaterial({ map: M.folkPlain, roughness: 1, side: T.DoubleSide }),
      folkFace: new T.MeshStandardMaterial({ map: M.folkFace, roughness: 1,
        side: T.DoubleSide, transparent: true, depthWrite: false }),
      folkHair: new T.MeshStandardMaterial({ map: M.folkHair, roughness: 1,
        side: T.DoubleSide }),
      // 衣服层次全靠同一张糊纸纹上的明度阶梯：缘边最深 → 腰带 → 折棱 → 内衬最浅。
      // 全部带 M.folkCloth 的纸纤维，亮度被纹理压住，不会被冷白灯打成白塑料铠甲；
      // 最浅的内衬也只比袍身亮一档，不引入新颜色，仍融在灰白旧纸 / 青灰冷调里。
      folkEdge:   new T.MeshStandardMaterial({ map: M.folkCloth, color: 0x7d7f73,
                    roughness: 1, side: T.DoubleSide }),
      folkBand:   new T.MeshStandardMaterial({ map: M.folkCloth, color: 0x9a9c8e,
                    roughness: 1, side: T.DoubleSide }),
      folkInner:  new T.MeshStandardMaterial({ map: M.folkCloth, color: 0xd4d6c7,
                    roughness: 1, side: T.DoubleSide }),
      folkCrease: new T.MeshStandardMaterial({ map: M.folkCloth, color: 0x898b7f,
                    roughness: 1, side: T.DoubleSide }),
      folkHollow: new T.MeshBasicMaterial({ color: 0x2e332e, side: T.DoubleSide, fog: true }),
      // 脚下纸灰压到几乎看不见，别让人像站在白色垫子上
      folkAsh: new T.MeshBasicMaterial({ color: 0x4b524c, transparent: true, opacity: .26 }),
      // v25：柱础是画面里唯一还过曝成纯白块的水平面。显式关掉色调映射并压进
      // 地面的暗度带，保留「冷白石础」的形，但不再抢纸扎人的视觉焦点。
      colBase: new T.MeshBasicMaterial({ color: 0x0d1210, fog: false, toneMapped: false }),
      // ——— v28 判官：与纸扎人共用「糊纸 + 淡墨」材质词族，但整体压暗一档 ———
      // 罗袍最深、缘边次之、腰带暗银、内襟最浅；朱砂只有几平方厘米的笔尖 / 带扣。
      judgeRobe: new T.MeshStandardMaterial({ map: M.judgeRobe, roughness: 1,
        side: T.DoubleSide }),
      judgeHat: new T.MeshStandardMaterial({ map: M.judgeHat, roughness: .94,
        side: T.DoubleSide }),
      judgeCloud: new T.MeshStandardMaterial({ map: M.judgeCloud, roughness: 1,
        side: T.DoubleSide }),
      judgeBook: new T.MeshStandardMaterial({ map: M.judgeBook, roughness: 1,
        side: T.DoubleSide }),
      judgeFace: new T.MeshStandardMaterial({ map: M.judgeFace, roughness: 1,
        side: T.DoubleSide, transparent: true, depthWrite: false }),
      judgeSkin: new T.MeshStandardMaterial({ map: M.folkPlain, color: 0xd8d8c8,
        roughness: 1, side: T.DoubleSide }),
      // v28 实拍修正：领口/书页第一版太亮，读成两条白斜挎带 + 白托盘。
      // 全部压到只比墨青袍亮 10~20%，靠纹理与明度差读层次，不靠高光。
      judgeEdge:   new T.MeshStandardMaterial({ map: M.folkCloth, color: 0x59635c,
                    roughness: 1, side: T.DoubleSide }),
      judgeBand:   new T.MeshStandardMaterial({ map: M.folkCloth, color: 0x79857c,
                    roughness: 1, side: T.DoubleSide }),
      judgeInner:  new T.MeshStandardMaterial({ map: M.folkCloth, color: 0x8b968b,
                    roughness: 1, side: T.DoubleSide }),
      // 长须要灰白：不能用墨发贴图（map × color 会乘成近黑），改用中性糊纸纹提亮
      judgeBeard:  new T.MeshStandardMaterial({ map: M.folkCloth, color: 0x848e82,
                    roughness: 1, side: T.DoubleSide }),
      judgeSilver: new T.MeshStandardMaterial({ color: 0x657168, roughness: .52,
                    metalness: .08, side: T.DoubleSide }),
      // v29：暗绣回纹 / 飞墨渍 / 牒页，全部沿用糊纸纹明度带，不新增高光材质
      judgeBrocade: new T.MeshStandardMaterial({ map: M.judgeBrocade, roughness: 1,
                    side: T.DoubleSide }),
      judgeInk: new T.MeshBasicMaterial({ map: M.judgeInk, transparent: true,
                    opacity: .72, depthWrite: false, side: T.DoubleSide }),
      judgePage: new T.MeshStandardMaterial({ map: M.folkCloth, color: 0x8b968b,
                    roughness: 1, side: T.DoubleSide }),
      // 笔尖 / 带扣 / 印：整幕唯一一点朱砂，面积远低于 v3 的 5% 上限
      cinnabar: new T.MeshBasicMaterial({ color: 0x9c4a36, fog: false, toneMapped: false }),
      // 没有 envMap 时高 metalness 会把铜件渲染成纯黑，这里压到低金属度 + 一点自发光
      bronze: new T.MeshStandardMaterial({ color: 0x4e5f57, roughness: .55, metalness: .12,
                                           emissive: 0x1a2420, emissiveIntensity: .12 }),
      bronzeDark: new T.MeshStandardMaterial({ color: 0x5a6a62, roughness: .70, metalness: .10,
                                               emissive: 0x141c19, emissiveIntensity: .30 }),
      ember: new T.MeshBasicMaterial({ color: 0xc8f2e6 }),
      lampPaper: new T.MeshStandardMaterial({ map: M.paper, color: 0xdfe4d9, roughness: 1,
                                              emissive: 0x86b8a8, emissiveIntensity: .46,
                                              transparent: true, opacity: .94, side: T.DoubleSide }),
      fog: new T.MeshBasicMaterial({ map: M.fog, transparent: true, opacity: .9,
                                    depthWrite: false, side: T.DoubleSide,
                                    color: 0xdfe8e4, fog: false }),
      // 加色混合：深色湿痕融进石板、冷白水光浮出来，才读得出一串湿脚印
      wet: new T.MeshBasicMaterial({ map: M.wet, transparent: true, depthWrite: false,
                                    side: T.DoubleSide, opacity: .92,
                                    blending: T.AdditiveBlending }),
      smoke: new T.MeshBasicMaterial({ map: M.smoke, transparent: true, depthWrite: false,
                                      side: T.DoubleSide, opacity: .0, color: 0xd8e2dd }),
      seal: new T.MeshBasicMaterial({ map: M.seal, transparent: true, depthWrite: false,
                                     side: T.DoubleSide }),
      ash: new T.MeshBasicMaterial({ color: 0x9aa39c, transparent: true, opacity: .5 }),
      money: new T.MeshStandardMaterial({ color: 0x9a8c5e, roughness: 1, side: T.DoubleSide })
    };

    // 每一层雾独立 clone 贴图：共用一张 texture 时 offset 动画会互相覆盖
    function fogMat(opacity, color) {
      var m = MAT.fog.clone();
      m.map = M.fog.clone();
      m.map.needsUpdate = true;
      m.opacity = opacity;
      m.fog = false;
      if (color) m.color.setHex(color);
      return m;
    }

    var root = new T.Group();
    scene.add(root);
    var pickMeshes = [];
    var refs = {}, glows = {}, observed = Object.create(null);

    function box(w, h, d, mat, x, y, z, parent) {
      var m = new T.Mesh(new T.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z);
      (parent || root).add(m);
      return m;
    }
    function plane(w, h, mat, x, y, z, parent) {
      var m = new T.Mesh(new T.PlaneGeometry(w, h), mat);
      m.position.set(x, y, z);
      (parent || root).add(m);
      return m;
    }
    function groundPlane(w, d, mat, x, z, parent) {
      var m = plane(w, d, mat, x, .012, z, parent);
      m.rotation.x = -Math.PI / 2;
      return m;
    }
    function cyl(rt, rb, h, mat, x, y, z, parent, seg) {
      var m = new T.Mesh(new T.CylinderGeometry(rt, rb, h, seg || 10), mat);
      m.position.set(x, y, z);
      (parent || root).add(m);
      return m;
    }
    function mark(obj, id) {
      obj.userData.pick = id;
      obj.traverse(function (o) { if (o.isMesh) o.userData.pick = id; });
      pickMeshes.push(obj);
      return obj;
    }
    function glowAt(id, x, y, z, size) {
      var sp = new T.Sprite(new T.SpriteMaterial({ map: M.glow, transparent: true,
        depthWrite: false, blending: T.AdditiveBlending, opacity: .0 }));
      sp.position.set(x, y, z);
      sp.scale.set(size, size, 1);
      sp.userData.id = id;
      root.add(sp);
      glows[id] = sp;
      return sp;
    }

    // ——— 地面 / 天花 / 墙 ———
    var L = LAYOUT, len = L.zFront - L.zBack, midZ = (L.zFront + L.zBack) / 2;
    var winZ = [-1.4, -3.9, -6.4, -8.9, -11.4, -13.9];
    var openIdx = 2;
    var WIN_W = 2.0, WIN_H = 1.55, WIN_CY = 2.05;
    var WIN_BOT = WIN_CY - WIN_H / 2, WIN_TOP = WIN_CY + WIN_H / 2;
    groundPlane(L.halfW * 2 + .6, len, MAT.stone, 0, midZ).position.y = 0;
    var ceil = groundPlane(L.halfW * 2 + .6, len, MAT.ceiling, 0, midZ);
    ceil.position.y = L.wallH; ceil.rotation.x = Math.PI / 2;

    // 左墙：实心，下半木护墙板 / 上半石墙（纸扎人靠这面墙面壁）
    var wxL = -(L.halfW + .16);
    box(.32, L.wallH, len, MAT.wall, wxL, L.wallH / 2, midZ);
    box(.06, 1.34, len, MAT.wood, wxL + .18, .67, midZ);
    box(.09, .07, len, MAT.woodDark, wxL + .2, 1.34, midZ);
    box(.045, .022, len, MAT.bronzeDark, wxL + .235, 1.30, midZ);

    // 右墙：六扇窗必须真的留洞，否则窗外浓雾会被实心墙挡住、窗成贴纸
    var wxR = L.halfW + .16;
    function wallPiece(za, zb, y0, y1, mat) {
      if (zb - za < .001 || y1 - y0 < .001) return;
      box(.32, y1 - y0, zb - za, mat, wxR, (y0 + y1) / 2, (za + zb) / 2);
    }
    function wainscot(za, zb, h) {
      if (h <= 0 || zb - za < .001) return;
      box(.06, h, zb - za, MAT.wood, wxR - .18, h / 2, (za + zb) / 2);
      box(.09, .05, zb - za, MAT.woodDark, wxR - .2, h, (za + zb) / 2);
    }
    var holes = winZ.map(function (z) { return { a: z - WIN_W / 2, b: z + WIN_W / 2, z: z }; })
                    .sort(function (p, q) { return q.b - p.b; });
    var cursor = L.zFront;
    holes.forEach(function (h, i) {
      if (cursor > h.b) {
        wallPiece(h.b, cursor, 0, L.wallH, MAT.wall);
        wainscot(h.b, cursor, 1.34);
      }
      // 窗台下 / 窗额上各留一段实墙，中间是真洞
      wallPiece(h.a, h.b, 0, WIN_BOT, MAT.wall);
      wallPiece(h.a, h.b, WIN_TOP, L.wallH, MAT.wall);
      wainscot(h.a, h.b, Math.min(1.34, WIN_BOT - .04));
      // 洞后：只有开着的那扇透出翻涌灰白浓雾与冷白光，其余五扇是压死的暗窗
      // fog:false 是关键：暗背板若参与线性雾，远处的五扇会被雾洗成灰白，
      // 六扇看起来全亮，「只开一扇」就失效了
      var outsideBack = plane(WIN_W + .2, WIN_H + .2,
        new T.MeshBasicMaterial({ color: i === openIdx ? 0xc6dad3 : 0x141c19,
                                  side: T.DoubleSide, fog: false }), 0, WIN_CY, h.z);
      outsideBack.rotation.y = Math.PI / 2;
      outsideBack.position.set(wxR + .48, WIN_CY, h.z);
      if (i === openIdx) {
        var outsideFog = plane(WIN_W + .1, WIN_H + .1, fogMat(.94, 0xeef4f0), 0, WIN_CY, h.z);
        outsideFog.rotation.y = Math.PI / 2;
        outsideFog.position.set(wxR + .28, WIN_CY, h.z);
        refs.openFog = outsideFog;
      }
      cursor = h.a;
    });
    if (cursor > L.zBack) {
      wallPiece(L.zBack, cursor, 0, L.wallH, MAT.wall);
      wainscot(L.zBack, cursor, 1.34);
    }

    // 梁柱：向上隐入黑暗，只留几道极暗的横枋与柱影
    var colZ = [3.4, -2.6, -8.6, -14.6];
    colZ.forEach(function (z) {
      [-1, 1].forEach(function (s) {
        var x = s * 2.94;
        cyl(.165, .19, L.wallH - .1, MAT.woodDark, x, (L.wallH - .1) / 2, z, root, 10);
        cyl(.26, .30, .18, MAT.colBase, x, .09, z, root, 10);
        box(.42, .10, .42, MAT.woodDark, x, L.wallH - .22, z);
      });
      box(6.1, .22, .34, MAT.ceiling, 0, L.wallH - .16, z);
    });
    // 顶部隐入黑：横枋一律压到近黑，制造「梁柱向上隐入黑暗，看不到屋顶」
    for (var bz = L.zFront - 2; bz > L.zBack + 1; bz -= 3.1) {
      box(6.4, .10, .16, MAT.ceiling, 0, L.wallH - .5, bz);
    }

    // ——— 右侧六扇木格窗，只开一扇（第 3 扇） ———
    // 墙体已在上面按窗位留真洞；这里只做窗框、菱花棂与窗纸，洞后雾光透进来
    refs.windows = [];
    winZ.forEach(function (z, i) {
      var wx = L.halfW - .02;
      var g = new T.Group(); g.position.set(wx, 0, z); root.add(g);
      var fw = WIN_W, fh = WIN_H, cy = WIN_CY;
      var frameMat = MAT.wood;
      // 窗面在 y-z 平面上：宽沿 z、高沿 y、厚沿 x，所以这些构件都不旋转。
      // 早先给它们加 rotation.y 会把 2 m 长的框条转向 x、伸进走廊，实拍像百叶窗。
      [[cy - fh / 2, .09], [cy + fh / 2, .09]].forEach(function (p) {
        box(.09, p[1], fw, frameMat, 0, p[0], 0, g);
      });
      [-fw / 2, fw / 2].forEach(function (dz) {
        box(.09, fh, .10, frameMat, 0, cy, dz, g);
      });
      // 木格棂：菱花简化为纵横方格
      for (var k = -3; k <= 3; k++) {
        box(.05, fh - .12, .035, frameMat, 0, cy, k * .26, g);
      }
      for (var j = -2; j <= 2; j++) {
        box(.05, .035, fw - .12, frameMat, 0, cy + j * .32, 0, g);
      }
      // 窗纸（法向 -x，朝廊内）：只有平面需要转，转后宽度正好沿 z。
      // 材质在创建时就按开/闭选死，不做事后替换 —— 事后换材质那版完全没生效，
      // 六扇窗一直显示创建时的浅色窗纸贴图，看起来就是「六扇全亮」。
      var paperMat = (i === openIdx)
        ? new T.MeshBasicMaterial({ map: M.windowPaper, color: 0xe2e9df,
            transparent: true, opacity: .38, side: T.DoubleSide, fog: false })
        : new T.MeshBasicMaterial({ color: 0x1a221e, side: T.DoubleSide,
            fog: false, transparent: false, depthWrite: true });
      var paper = plane(fw - .12, fh - .12, paperMat, 0, cy, 0, g);
      paper.rotation.y = -Math.PI / 2;
      paper.position.x = .055;          // 放在格棂后面，木格才不会被盖住
      if (i === openIdx) {
        // 唯一开着的一扇：窗纸半揭，洞后冷白浓雾直接渗进廊内
        paper.scale.y = .52;
        paper.position.y = cy - fh * .22;
        mark(paper, "handprint");
        refs.handPaper = paper;
        glowAt("handprint", wx - .42, cy, z, .62);
      } else {
        // 兜底：闭扇在洞里再塞一块暗填充，任何漏光都吃掉，保证「只开一扇」
        box(.06, WIN_H - .08, WIN_W - .08,
          new T.MeshBasicMaterial({ color: 0x101815, fog: false }),
          .08, WIN_CY, 0, g);   // g 在 x=3.18，局部 .08 ⇒ 世界 3.26，落在格棂之后
      }
      // 窗台：只把「开的那扇」的窗台标成可点观察点。
      // 不能 mark(g) —— 组内窗纸已 mark 成 handprint，会被整组覆盖掉。
      var sill = box(.26, .07, fw + .18, MAT.wood, 0, cy - fh / 2 - .06, 0, g);
      if (i === openIdx) mark(sill, "window");
      refs.windows.push(g);
    });

    // 窗外冷白主光：只从开的那扇渗进来，来源不明
    var winLight = new T.SpotLight(0xd6e8e2, 2.0, 12, Math.PI / 4, .90, 1.1);
    winLight.position.set(4.4, 2.3, winZ[openIdx]);
    winLight.target.position.set(-1.2, .35, winZ[openIdx] - 1.2);
    scene.add(winLight); scene.add(winLight.target);
    var winFill = new T.PointLight(0xa8c4bd, .42, 9, 2);
    winFill.position.set(2.5, 1.9, winZ[openIdx]);
    scene.add(winFill);

    // ——— 走廊尽头：浓雾看不到底 + 第一殿的门 ———
    // 四层错开的雾幕，越远越浓，中间留透光空隙 —— 单放两层会糊成一堵白墙
    var fogNear = plane(6.2, 4.9, fogMat(.18, 0xcbd7d2), 0, 2.3, -11.8);
    var fogMid = plane(6.5, 5.1, fogMat(.28, 0xd6e1db), 0, 2.3, -14.9);
    var fogFront = plane(6.8, 5.4, fogMat(.42, 0xdfe8e3), 0, 2.3, -17.6);
    var fogDeep = plane(7.2, 5.8, fogMat(.62, 0xe9f0ec), 0, 2.3, -19.4);
    [fogNear, fogMid, fogFront, fogDeep].forEach(function (f) { root.add(f); });
    refs.fogNear = fogNear; refs.fogMid = fogMid;
    refs.fogFront = fogFront; refs.fogDeep = fogDeep;

    // 门外无底黑暗（门开后也不见天光）；门开时雾里再透出一层冷白
    var voidPlane = plane(5.2, 4.2, new T.MeshBasicMaterial({ color: 0x080c0b }), 0, 2.0, -20.85);
    root.add(voidPlane);
    var doorFog = plane(2.6, 3.2, fogMat(0, 0xdfeae4), 0, 1.7, -20.72);
    root.add(doorFog);
    refs.doorFog = doorFog;
    // 门框
    box(.24, 3.35, .22, MAT.woodDark, -1.28, 1.67, -20.5);
    box(.24, 3.35, .22, MAT.woodDark,  1.28, 1.67, -20.5);
    box(2.85, .26, .24, MAT.woodDark, 0, 3.30, -20.5);
    box(2.85, .12, .30, MAT.wood, 0, .06, -20.5);
    // 门楣新匾 + 底下露出的旧匾残字 + 已迁址纸条（全部模糊不可辨）
    // 匾额只留一块暗木轮廓，不写任何字（v3 负面词禁清晰文字）。
    // 早先那张偏黄的 notice 贴图在浓雾里浮成一个亮黄方块，非常跳眼。
    var plaqueMat = new T.MeshBasicMaterial({ color: 0x232b27 });
    var plaque = plane(2.3, .56, plaqueMat, 0, 3.72, -20.36);
    root.add(plaque);
    var oldPlaque = plane(1.5, .38, plaqueMat, -.42, 3.48, -20.32);
    oldPlaque.rotation.z = .06; root.add(oldPlaque);
    // 双扇门：各绕外侧铰链转开
    var doorL = new T.Group(); doorL.position.set(-1.17, 0, -20.42); root.add(doorL);
    var doorR = new T.Group(); doorR.position.set( 1.17, 0, -20.42); root.add(doorR);
    [[doorL, -.58], [doorR, .58]].forEach(function (pair) {
      var g = pair[0], dx = pair[1];
      var leaf = box(1.16, 3.05, .09, MAT.woodDark, dx, 1.53, 0, g);
      leaf.material = MAT.wood;
      // 门钉与铜包角
      for (var r = 0; r < 4; r++) for (var c = 0; c < 3; c++) {
        var stud = new T.Mesh(new T.SphereGeometry(.026, 6, 5), MAT.bronzeDark);
        stud.position.set(dx + (c - 1) * .28, .72 + r * .55, -.055);
        g.add(stud);
      }
      box(.10, .13, .12, MAT.bronze, dx + (dx < 0 ? .38 : -.38), 1.35, -.09, g);
    });
    refs.doorL = doorL; refs.doorR = doorR;
    mark(doorL, "door"); mark(doorR, "door");   // v27：尽头门可点，给「无引者不得离殿」台词

    // ——— 入口（玩家身后）：黑漆木门 + 门帘 ———
    box(.20, 3.2, .18, MAT.woodDark, -1.0, 1.6, L.zFront - .1);
    box(.20, 3.2, .18, MAT.woodDark,  1.0, 1.6, L.zFront - .1);
    box(2.3, .22, .20, MAT.woodDark, 0, 3.24, L.zFront - .1);
    var curtain = plane(1.9, 1.15, MAT.paper, 0, 2.55, L.zFront - .22);
    curtain.material = MAT.paper.clone(); curtain.material.color.setHex(0xa9a898);
    root.add(curtain);

    // ——— 湿脚印：从门口走到长凳前，就断了 ———
    var rr = rand(211);
    for (var fi = 0; fi < 9; fi++) {
      // 全部落在相机前方，否则第一排脚印在身后，整串就读不出来
      var fz = 3.72 - fi * .19;
      var fx = (fi % 2 ? .15 : -.15) + (rr() - .5) * .045;
      var fp = groundPlane(.28, .46, MAT.wet, fx, fz);
      fp.position.y = .018 + fi * .0002;
      fp.rotation.z = (rr() - .5) * .16;
      fp.material = MAT.wet.clone();
      fp.material.opacity = .95 - fi * .022;
    }
    // 断掉的那一枚：只剩半个湿痕
    var lastFoot = groundPlane(.13, .18, MAT.wet.clone(), -.02, 2.10);
    lastFoot.material.opacity = .28;

    // ——— 长凳：凳面留着刚被人坐过的凹痕 ———
    var bench = new T.Group(); bench.position.set(-.62, 0, 1.95); root.add(bench);
    box(1.82, .085, .46, MAT.wood, 0, .45, 0, bench);
    box(1.82, .045, .045, MAT.woodDark, 0, .395, -.19, bench);
    box(1.82, .045, .045, MAT.woodDark, 0, .395,  .19, bench);
    [-.77, .77].forEach(function (dx) {
      box(.085, .42, .085, MAT.woodDark, dx, .21, -.16, bench);
      box(.085, .42, .085, MAT.woodDark, dx, .21,  .16, bench);
    });
    var dent = groundPlane(.52, .30, MAT.wet.clone(), .08, .02, bench);
    dent.position.y = .497; dent.material.opacity = .33;
    var dentRing = new T.Mesh(new T.RingGeometry(.20, .27, 24),
      new T.MeshBasicMaterial({ color: 0x1a211f, transparent: true, opacity: .22,
                                side: T.DoubleSide, depthWrite: false }));
    dentRing.rotation.x = -Math.PI / 2; dentRing.position.set(.08, .495, .02);
    dentRing.scale.set(1, .62, 1); bench.add(dentRing);
    mark(bench, "bench");
    glowAt("bench", -.62, .72, 1.95, .55);

    // ——— 靠左墙一排纸扎人：三个面壁，两个侧过身来 ———
    // 造型依据：《纸嫁衣》纸人「与人外形类似，但四肢僵硬」；
    // 《千与千寻》无脸男靠驼背、垂袖、静止建立「人」的存在感。
    // v3「面壁无点睛」仍守：面壁的三个只见素白后脑；另两个侧转 / 回头，
    // 露出的脸是糊纸压出的空眼窝（不点睛、无脸谱朱砂），正面能读到交领右衽。
    // 色相一律旧纸灰褐，「像人」靠肩斜、收腰、袍摆外张、空袖、低头与个体微差。
    var folkGroup = new T.Group(); root.add(folkGroup);
    // 不等距站位 + 五组不同体态 + 两个侧身，去掉「一个模型复制五遍」的假感
    var FOLK = [
      { z: -1.55, x: -2.98, h: 1.000, w: 1.000, lean: .052, head: .13, droop:  .000, sl: .10, sr: -.12, yaw:  .00, turn: 3.20, face: true  },
      { z: -2.82, x: -2.91, h: 0.958, w: 1.065, lean: .086, head: .21, droop:  .042, sl: .15, sr: -.07, yaw:  .05, turn: 0.00, face: false },
      { z: -4.34, x: -2.99, h: 1.035, w: 0.960, lean: .038, head: .09, droop: -.030, sl: .07, sr: -.16, yaw: -.04, turn: 2.93, face: true  },
      { z: -5.66, x: -2.92, h: 0.978, w: 1.020, lean: .070, head: .25, droop:  .026, sl: .12, sr: -.10, yaw:  .03, turn: 0.00, face: false },
      { z: -7.03, x: -2.97, h: 1.012, w: 0.985, lean: .048, head: .16, droop: -.018, sl: .09, sr: -.14, yaw: -.02, turn: 0.00, face: false }
    ];

    // Extrude / ShapeGeometry 的 UV 是模型坐标，压回 0..1 整张糊纸才铺得满
    function normalizeUV(geo) {
      geo.computeBoundingBox();
      var bb = geo.boundingBox, uv = geo.attributes.uv;
      if (!uv) return geo;
      var dx = bb.max.x - bb.min.x || 1, dy = bb.max.y - bb.min.y || 1;
      for (var i = 0; i < uv.count; i++) {
        uv.setXY(i, (uv.getX(i) - bb.min.x) / dx, (uv.getY(i) - bb.min.y) / dy);
      }
      uv.needsUpdate = true;
      return geo;
    }
    // 一片「剪出来的纸」：任意多边形，用于云肩、飘带、内衬等层叠部件。
    // 纸扎本来就是一层层糊上去的，用独立纸片而不是贴图线条，才有厚度与层影。
    function paperStrip(pts, z, mat, parent, px, py) {
      var sh = new T.Shape();
      sh.moveTo(pts[0][0], pts[0][1]);
      for (var i = 1; i < pts.length; i++) sh.lineTo(pts[i][0], pts[i][1]);
      sh.closePath();
      var m = new T.Mesh(normalizeUV(new T.ShapeGeometry(sh, 2)), mat);
      m.position.set(px || 0, py || 0, z);
      (parent || root).add(m);
      return m;
    }
    // 人形纸壳剪影：领口凹、肩线斜、收腰、袍摆 A 字外张且边缘毛糙不齐
    function folkShellShape(v) {
      var w = v.w, d = v.droop, sh = new T.Shape();
      sh.moveTo(-.335 * w, .015);
      sh.lineTo(-.300 * w, .045); sh.lineTo(-.262 * w, .012);
      sh.lineTo(-.170 * w, .038); sh.lineTo(-.090 * w, .014);
      sh.lineTo(0, .034);         sh.lineTo(.096 * w, .012);
      sh.lineTo(.188 * w, .040);  sh.lineTo(.268 * w, .014);
      sh.lineTo(.335 * w, .038);
      sh.lineTo(.212 * w, .735);            // 右腰
      sh.lineTo(.238 * w, 1.115);          // 右腋
      sh.lineTo(.292 * w, 1.352 - d);      // 右肩外（一侧略塌）
      sh.lineTo(.092 * w, 1.438);
      sh.lineTo(0, 1.398);                 // 领口凹，脖子从这里长出来
      sh.lineTo(-.092 * w, 1.438);
      sh.lineTo(-.292 * w, 1.352 + d);    // 左肩外
      sh.lineTo(-.238 * w, 1.115);
      sh.lineTo(-.212 * w, .735);
      sh.closePath();
      return sh;
    }

    FOLK.forEach(function (v) {
      var g = new T.Group();
      g.position.set(v.x, 0, v.z);
      // 面朝左墙并偏向走廊深处 = 面壁；turn>0 的两个侧过身来，廊内能瞥见素脸
      g.rotation.y = -Math.PI / 2 - .95 + v.yaw + v.turn;
      g.scale.setScalar(v.h);
      folkGroup.add(g);

      var lean = new T.Group();      // 局部 +z 指向墙，正值 = 上半身朝墙前倾
      lean.rotation.x = v.lean;
      g.add(lean);

      var shape = folkShellShape(v);
      // 纸壳有 2.6 cm 进深：不是零厚度立牌；背面糊纸 / 侧壁用略深的纸棱色
      var shellGeo = normalizeUV(new T.ExtrudeGeometry(shape,
        { depth: .026, bevelEnabled: false, curveSegments: 2, steps: 1 }));
      // 把纸壳从「平板」鼓成微凸的糊纸弧面：中间往背面凸 5 cm、两侧收回，剪影不变
      var pos = shellGeo.attributes.position, halfW = .335 * v.w;
      for (var pi = 0; pi < pos.count; pi++) {
        var tt = Math.min(1, Math.abs(pos.getX(pi)) / halfW);
        pos.setZ(pi, pos.getZ(pi) - .052 * (1 - tt * tt));
      }
      pos.needsUpdate = true;
      shellGeo.computeVertexNormals();
      var shell = new T.Mesh(shellGeo, [MAT.folkBack, MAT.folkCrease]);
      shell.position.z = -.013;
      lean.add(shell);
      // 正面（+z 朝墙）贴交领衣纹，背面（-z 朝廊）由 shell 的 folkBack 承担
      var front = new T.Mesh(normalizeUV(new T.ShapeGeometry(shape, 2)), MAT.folkFront);
      front.position.z = .015;
      lean.add(front);
      // 袍身侧翼：把「一块板」撑成有进深的纸壳筒
      [-1, 1].forEach(function (sgn) {
        var wing = plane(.17, .72, MAT.folkBack, sgn * .208 * v.w, .38, -.052, lean);
        wing.rotation.y = sgn * .70;
      });

      // —— 层叠纸衣 ——
      // 参考《纸嫁衣》系列「汉服版型 + 立体缘饰」与现实纸扎「一层层糊纸」的做法：
      // 云肩、双层交领、宽腰带纸结飘带、摆缘包边都是**独立纸片**，不是贴图上的线。
      // 两面都糊：面壁的三个露出 -z 面，转身的两个露出 +z 面。
      [-1, 1].forEach(function (side) {
        var w = v.w;
        var B = side > 0 ? .020 : -.072;        // 贴着纸壳表面的起始层
        var L = function (n) { return B + side * n * .006; };
        // ① 云肩：四瓣如意弧，深色缘 + 浅色面
        var cape = [
          [-.085*w, 1.425], [.085*w, 1.425], [.20*w, 1.395], [.30*w, 1.300],
          [.25*w, 1.215], [.17*w, 1.245], [.09*w, 1.170], [-.09*w, 1.170],
          [-.17*w, 1.245], [-.25*w, 1.215], [-.30*w, 1.300], [-.20*w, 1.395]
        ];
        paperStrip(cape, L(0), MAT.folkEdge, lean);
        paperStrip(cape.map(function (p) {
          return [p[0] * .90, 1.19 + (p[1] - 1.19) * .90];
        }), L(1), MAT.folkInner, lean);
        // ② 交领右衽：v25 换成整片斜掩的宽衣襟，不再是两根细背带。
        // 内襟自右肩斜向左腰、外衽自左肩斜向右腰，在胸口交叠成 Y 字领口；
        // 缘边只沿外衽一侧走一道，读得出「一层层糊上去」的先后顺序。
        paperStrip([
          [-.285*w, 1.398], [-.105*w, 1.420], [.115*w, .855], [-.045*w, .838]
        ], L(2), MAT.folkInner, lean);
        paperStrip([
          [.285*w, 1.398], [.105*w, 1.420], [-.115*w, .885], [.045*w, .868]
        ], L(3), MAT.folkBand, lean);
        paperStrip([
          [.105*w, 1.420], [.138*w, 1.414], [-.082*w, .879], [-.115*w, .885]
        ], L(4), MAT.folkEdge, lean);
        // ③ 宽腰带：主体 + 上下缘边 + 菱形纸结
        box(.44*w, .064, .014, MAT.folkBand, 0, .752, L(2), lean);
        box(.44*w, .010, .016, MAT.folkEdge, 0, .786, L(3), lean);
        box(.44*w, .010, .016, MAT.folkEdge, 0, .718, L(3), lean);
        var knot = box(.072, .072, .022, MAT.folkEdge, .010, .752, L(5), lean);
        knot.rotation.z = .785;
        // ④ 两条飘带：末端斜剪，微微外撇
        [-1, 1].forEach(function (sgn) {
          var rb = paperStrip([
            [-.030, 0], [.030, 0], [.024, -.34], [-.016, -.32]
          ], L(4), MAT.folkInner, lean, sgn * .052, .722);
          rb.rotation.z = sgn * .06;
        });
        // ⑤ 摆缘包边 + 两道从腰到摆的硬折棱
        box(.66*w, .022, .012, MAT.folkEdge, 0, .032, L(2), lean);
        [-1, 1].forEach(function (sgn) {
          var cr = box(.010, .62, .010, MAT.folkCrease, sgn * .118 * w, .40, L(2), lean);
          cr.rotation.z = sgn * .11;
        });
      });

      // 颈 + 低分段扁椭球头：有棱面才像糊纸壳，不是光滑塑料人头
      var neck = cyl(.052, .064, .115, MAT.folkWhite, 0, 1.452, 0, lean, 8);
      neck.scale.z = .72;
      var head = new T.Mesh(new T.SphereGeometry(.132, 10, 8), MAT.folkWhite);
      head.position.set(0, 1.612, .026);  // 略往前探：面壁时头比肩更靠近墙
      head.scale.set(.90, 1.18, .76);
      head.rotation.x = v.head;           // 各自低头的角度不同
      head.rotation.y = v.yaw * 1.6;      // 微微侧转，五个人朝向不完全一致
      lean.add(head);

      // —— 头发：总不能是个光头 ——
      // 上半球墨发帽（包住头顶与后脑）+ 顶部一个低扁发髻 + 两片垂鬓。
      // 都挂在 head 下，自动跟随各自的低头 / 侧转；颜色是旧纸压暗的墨褐，
      // 不是纯黑、不是新颜色，仍和青灰冷调一致。
      var hair = new T.Mesh(new T.SphereGeometry(.136, 12, 8,
        0, Math.PI * 2, 0, Math.PI * .36), MAT.folkHair);
      head.add(hair);
      var bun = new T.Mesh(new T.SphereGeometry(.060, 10, 8), MAT.folkHair);
      bun.position.set(0, .140, -.028);
      bun.scale.set(1, .78, .88);
      head.add(bun);
      [-1, 1].forEach(function (sg) {
        var side = new T.Mesh(new T.PlaneGeometry(.050, .155), MAT.folkHair);
        side.position.set(sg * .113, .012, .008);
        side.rotation.y = sg * .55;
        head.add(side);
      });

      // 五个人都贴脸：面朝墙的三个从廊内看是后脑（现在有发不是光球），
      // 侧过身来的两个从廊内能看清眉眼。脸片贴球头正面 z≈.142
      // （球半径 .132 × scale.z .76 ≈ .100），第一版误放 z=1.012 等于飘在
      // 0.77 m 外，是「完全看不见脸」的根因。
      var fs = new T.Shape(), fr = rand(233 + Math.round(-v.z * 7));
      for (var ai = 0; ai <= 26; ai++) {
        var th = ai / 26 * Math.PI * 2, j = 1 + (fr() - .5) * .05;
        var px = Math.cos(th) * .108 * j, py = Math.sin(th) * .142 * j;
        if (ai === 0) fs.moveTo(px, py); else fs.lineTo(px, py);
      }
      fs.closePath();
      var faceCard = new T.Mesh(normalizeUV(new T.ShapeGeometry(fs, 3)), MAT.folkFace);
      faceCard.position.z = .142;
      head.add(faceCard);

      // 宽袍大袖：动漫 / 汉服的宽袖是「一片平直垂落的方形纸」，不是上窄下阔的漏斗。
      // 四棱柱 + 转 45° 让一个平面正朝镜头，再压扁成纸片厚度；上下半径几乎一致，
      // 只在袖口留一道外翻缘。肘部折环保留，读得出垂手站着时袖子在这里弯过。
      function squareSleeve(rt, rb, h, mat, parent, yy) {
        // 先在几何空间转向再压扁：若用 mesh.rotation + mesh.scale，
        // 压缩方向会跟着旋转 45°，袖子会扭成斜菱形而不是正朝镜头的宽袖。
        var geo = new T.CylinderGeometry(rt, rb, h, 4, 1, true);
        geo.rotateY(Math.PI / 4);       // 四棱柱的一面转向 +z
        geo.scale(1, 1, .44);           // 再压进深，正面看是矩形宽袖
        var m = new T.Mesh(geo, mat);
        m.position.y = yy;
        parent.add(m);
        return m;
      }
      [-1, 1].forEach(function (sgn) {
        var arm = new T.Group();
        arm.position.set(sgn * .258, .985, .014);   // v25 袖根收回，接上斜肩
        arm.rotation.z = sgn < 0 ? v.sl : v.sr;
        lean.add(arm);
        // 上窄下略阔：宽袖自然垂坠，不再是上下等粗的方柱
        squareSleeve(.078, .104, .34, MAT.folkWhite, arm, .17);
        // 肩头改成斜折纸片顺着肩线接回袍身（方肩块会像玩偶关节）
        var sh = paperStrip([
          [-.085, .352], [.085, .352], [.105, .300], [-.105, .306]
        ], .042, MAT.folkWhite, arm);
        sh.rotation.z = sgn * .18;
        // 肘部堆积折环，读得出袖子在这里弯过
        squareSleeve(.104, .108, .028, MAT.folkBand, arm, .005);
        var elbow = new T.Group();        // 肘点落在袖子中段
        elbow.rotation.z = -sgn * .11;
        elbow.rotation.x = -.18;          // 前臂略往墙的方向垂，像人垂手站着
        arm.add(elbow);
        squareSleeve(.104, .132, .34, MAT.folkWhite, elbow, -.17);
        // 两道横向糊纸接缝：把「一根光柱」读成一层层糊出来的纸袖
        box(.170, .011, .010, MAT.folkCrease, 0, .258, .050, arm).rotation.z =  sgn * .035;
        box(.212, .011, .010, MAT.folkCrease, 0, -.090, .062, elbow).rotation.z = -sgn * .045;
        // 袖口外翻缘：宽袖的深色收口，比袖身略宽
        squareSleeve(.134, .140, .040, MAT.folkEdge, elbow, -.352);
        // 方形袖口内壁暗，读得出里面是空的
        var hollow = new T.Mesh(new T.PlaneGeometry(.24, .24), MAT.folkHollow);
        hollow.rotation.x = -Math.PI / 2;
        hollow.scale.y = .44;
        hollow.position.y = -.372;
        elbow.add(hollow);
      });

      // 脚下极淡的一点纸灰
      groundPlane(.34, .26, MAT.folkAsh, 0, 0, g).position.y = .014;
    });
    mark(folkGroup, "folk");
    glowAt("folk", -2.55, 1.38, -4.34, .9);

    // ——— 判官崔珏（v28）———
    // 造型依据：《西游记》第十一回「头顶乌纱飘软带，腰围犀角显金厢，手擎牙笏凝祥霭，
    // 身著罗袍隐瑞光……怀揣一本生死簿……鬓发蓬松飘耳上，胡须飞舞绕腮旁」；
    // 动漫 / 游戏判官（垂缨冠横簪、宽袍 + 续平绪垂带、执朱笔捧生死簿）补了姿态。
    // 位置：案桌左前方的廊中，一进门就能看见；略朝右前方侧身，脸迎着玩家。
    // 不挡右侧取号机 / 案上三件，也不挡左墙水牌与面壁纸扎人。
    // ?nojudge=1 完全不创建（连 pick 都不注册），回到「无角色实体」的 v3 严格版。
    // ——— v29 判官：坐在木案左侧的官帽椅上 ———
    // 新增参考（动漫 / 游戏，只取文字描写，不点外链）：
    //   《阴阳师》判官「逸墨沾衣」：笔直冠帽 + 笄、腰侧系小物件、飞墨沾袖、伏案挥毫；
    //   《决战!平安京》判官「点墨夺魂」：垂缨冠 + 束带、袍 / 续平绪 / 表袴大口纹；
    //   《神都夜行录》崔珏：玄色长袍墨绿氅、衣缘暗绣、朱砂勾判词。
    // 落到本幕：垂缨与笄、帽缘暗绣回纹、领缘袖口襕边、飞墨、腰侧印匣与竹牌、
    // 生死簿包角订线、耳与三缕鬓丝、案上文房。仍全部锁在灰白旧纸 / 青灰冷调。
    // 坐姿：椅面 .48、大腿水平、小腿垂直、袍摆铺膝；肩 1.06、头 1.28、帽顶 1.63，
    // 明显低于站立版 2.0，也低于面壁纸扎人 1.75。右手搭案、左手托簿。
    function buildJudgeV29() {
      var judge = new T.Group();
      judge.position.set(JUDGE_AT[0], 0, JUDGE_AT[2]);
      judge.rotation.y = .24;      // 朝 +z 略偏右，迎着从长凳绕过来的玩家
      root.add(judge);

      // 四棱柱方袖：先在几何空间转 45° 再压进深，正面才是平直宽袖
      function slv(rt, rb, h, mat, parent, yy) {
        var geo = new T.CylinderGeometry(rt, rb, h, 4, 1, true);
        geo.rotateY(Math.PI / 4); geo.scale(1, 1, .46);
        var m = new T.Mesh(geo, mat); m.position.y = yy; parent.add(m); return m;
      }

      // ① 官帽椅：座面 / 四腿 / 靠背 / 搭脑 / 扶手，深木压在暗调里
      box(.70, .055, .58, MAT.woodDark, 0, .480, -.060, judge);
      [[-.28, -.29], [.28, -.29], [-.28, .17], [.28, .17]].forEach(function (p) {
        box(.062, .460, .062, MAT.woodDark, p[0], .235, p[1], judge);
      });
      box(.620, .050, .050, MAT.wood, 0, .715, -.320, judge);
      box(.600, .175, .048, MAT.woodDark, 0, .930, -.320, judge);
      box(.660, .046, .075, MAT.wood, 0, 1.062, -.320, judge);
      [-1, 1].forEach(function (sg) {
        box(.060, .048, .440, MAT.wood, sg * .310, .700, -.040, judge);
        box(.052, .215, .052, MAT.woodDark, sg * .310, .585, .155, judge);
      });

      // ② 坐姿的腿（v30）：大腿水平朝前、小腿垂直、靴尖朝玩家。
      //    v29 的圆柱带端盖，转 90° 后两个圆盖正对镜头，被读成「黑膝甲」；
      //    这里一律用 openEnded 开口圆柱，膝头由袍摆盖住。
      [-1, 1].forEach(function (sg) {
        var thigh = new T.Mesh(new T.CylinderGeometry(.104, .114, .440, 10, 1, true),
          MAT.judgeRobe);
        thigh.rotation.x = Math.PI / 2;
        thigh.position.set(sg * .135, .530, .195); judge.add(thigh);
        // 小腿与靴同袍色、收细：v30 第一版两根近黑粗柱像机器人腿
        var shin = new T.Mesh(new T.CylinderGeometry(.070, .062, .405, 10, 1, true),
          MAT.judgeRobe);
        shin.position.set(sg * .135, .275, .415); judge.add(shin);
        box(.124, .076, .205, MAT.judgeRobe, sg * .135, .050, .492, judge);
        box(.126, .009, .208, MAT.judgeEdge, sg * .135, .013, .492, judge);
      });

      // ③ 袍摆铺膝（v30）：v29 的完整锥台 + 亮色下摆圈在实拍里读成一把硬边圆伞，
      //    这里收窄摆幅、去掉亮边，只留一道极窄暗绣，再压五道纵向衣褶。
      var lap = new T.Mesh(new T.CylinderGeometry(.225, .425, .470, 14, 1, true), MAT.judgeRobe);
      lap.scale.set(1, 1, .78); lap.position.set(0, .525, .150); judge.add(lap);
      var lapBand = new T.Mesh(new T.CylinderGeometry(.420, .428, .016, 14, 1, true), MAT.judgeBrocade);
      lapBand.scale.set(1, 1, .78); lapBand.position.set(0, .300, .150); judge.add(lapBand);
      [-.26, -.13, 0, .13, .26].forEach(function (px) {
        var fold = plane(.012, .400, MAT.judgeEdge, px, .520,
          .445 - Math.abs(px) * .10, judge);
        fold.rotation.x = -.14; fold.rotation.z = px * .20;
      });
      // 躯干：从髋 .50 到肩 1.06
      var torso = new T.Mesh(new T.CylinderGeometry(.205, .235, .560, 12, 1, true), MAT.judgeRobe);
      torso.scale.set(1, 1, .68); torso.position.set(0, .780, -.040); judge.add(torso);

      // ④ 云肩四瓣如意弧：外缘深、内面暗银云纹
      var cape = [
        [-.100, 1.105], [.100, 1.105], [.245, 1.070], [.345, .975],
        [.285, .890], [.195, .920], [.105, .845], [-.105, .845],
        [-.195, .920], [-.285, .890], [-.345, .975], [-.245, 1.070]
      ];
      paperStrip(cape, .180, MAT.judgeEdge, judge);
      paperStrip(cape.map(function (p) {
        return [p[0] * .88, .850 + (p[1] - .850) * .88];
      }), .186, MAT.judgeCloud, judge);

      // ⑤ 交领右衽：三片斜襟交叠成 Y 字，缘边再压一道回纹；里衣再露一层
      // v30：内襟原来一路斜到 .700，和外衽在胸前交叉成 X，实拍读成束带 / 铠甲。
      // 收短到胸口 .858，让交叠点上移，下方只留外衽一条斜线 —— Y 字右衽。
      paperStrip([[-.285, 1.065], [-.120, 1.088], [.020, .858], [-.060, .846]],
        .190, MAT.judgeInner, judge);
      paperStrip([[.285, 1.065], [.120, 1.088], [-.075, .724], [.060, .712]],
        .197, MAT.judgeBand, judge);
      paperStrip([[.120, 1.088], [.150, 1.081], [-.045, .718], [-.075, .724]],
        .204, MAT.judgeBrocade, judge);
      paperStrip([[-.032, .720], [.032, .720], [.040, .600], [-.040, .600]],
        .202, MAT.judgeEdge, judge);
      paperStrip([[-.085, 1.090], [.085, 1.090], [.060, 1.010], [-.060, 1.010]],
        .188, MAT.judgePage, judge);

      // ⑥ 犀角带 + 暗银带扣 + 续平绪垂带
      box(.565, .095, .030, MAT.judgeBand, 0, .620, .180, judge);
      box(.565, .012, .034, MAT.judgeEdge, 0, .672, .182, judge);
      box(.565, .012, .034, MAT.judgeEdge, 0, .568, .182, judge);
      box(.100, .100, .034, MAT.judgeSilver, 0, .620, .200, judge);
      box(.030, .030, .038, MAT.judgeEdge, 0, .620, .220, judge);
      [-1, 1].forEach(function (sg) {
        var rb = paperStrip([[-.036, 0], [.036, 0], [.028, -.340], [-.020, -.320]],
          .190, MAT.judgeInner, judge, sg * .075, .560);
        rb.rotation.z = sg * .08;
        box(.010, .340, .008, MAT.judgeBrocade, sg * .075, .390, .196, judge)
          .rotation.z = sg * .08;
      });

      // ⑦ 腰侧小挂件：印匣 / 竹牌串 / 小铃（动漫判官腰间那点「人间玩意」）
      box(.072, .090, .042, MAT.judgeBook, -.300, .568, .112, judge);
      box(.082, .012, .048, MAT.judgeEdge, -.300, .618, .112, judge);
      [-1, 1].forEach(function (sg) {
        box(.020, .072, .008, MAT.bamboo, -.300 + sg * .018, .488, .122, judge);
      });
      var bell = new T.Mesh(new T.SphereGeometry(.021, 8, 6), MAT.judgeSilver);
      bell.position.set(.300, .538, .112); judge.add(bell);

      // ⑧ 双臂：肘搁案沿、前臂前抬，左手托簿右手执笔
      [-1, 1].forEach(function (sg) {
        var arm = new T.Group();
        arm.position.set(sg * .255, 1.010, .010);
        arm.rotation.z = sg * .12;
        judge.add(arm);
        slv(.082, .112, .240, MAT.judgeRobe, arm, .120);
        var sh = paperStrip([[-.090, .250], [.090, .250], [.112, .200], [-.112, .205]],
          .048, MAT.judgeRobe, arm);
        sh.rotation.z = sg * .16;
        slv(.112, .116, .024, MAT.judgeBrocade, arm, .002);
        var elbow = new T.Group();
        elbow.rotation.x = sg < 0 ? -.66 : -.82;   // 前臂搭向案面
        elbow.rotation.z = -sg * .10;
        arm.add(elbow);
        slv(.116, .142, .255, MAT.judgeRobe, elbow, -.128);
        box(.180, .010, .010, MAT.judgeBand, 0, .040, .066, elbow);
        slv(.144, .150, .026, MAT.judgeBrocade, elbow, -.266);
        slv(.150, .154, .026, MAT.judgeEdge, elbow, -.292);
        var hollow = new T.Mesh(new T.PlaneGeometry(.24, .24), MAT.folkHollow);
        hollow.rotation.x = -Math.PI / 2; hollow.scale.y = .46;
        hollow.position.y = -.312; elbow.add(hollow);
        var hand = new T.Mesh(new T.SphereGeometry(.046, 10, 8), MAT.judgeSkin);
        hand.position.set(0, -.298, .052);
        hand.scale.set(.92, .78, .62);
        elbow.add(hand);
        if (sg > 0) {   // 右袖口一点飞墨，不糊满整只袖子
          var ink = new T.Mesh(new T.PlaneGeometry(.170, .130), MAT.judgeInk);
          ink.position.set(0, -.170, .074); elbow.add(ink);
        }
      });

      // ⑨ 生死簿：摊在膝前；包角 / 书口页纹 / 订线 / 只留模糊笔痕的签条
      var book = new T.Group();
      book.position.set(-.300, .815, .330);
      book.rotation.set(-.52, .16, .12);
      judge.add(book);
      box(.285, .028, .210, MAT.judgeBook, 0, 0, 0, book);
      box(.262, .018, .192, MAT.judgePage, 0, .017, 0, book);
      box(.014, .038, .210, MAT.judgeEdge, -.142, 0, 0, book);
      [-.070, -.024, .024, .070].forEach(function (dz) {
        box(.010, .006, .008, MAT.judgeEdge, -.134, .026, dz, book);
      });
      [-.060, -.020, .020, .060].forEach(function (dy) {
        box(.250, .004, .006, MAT.judgeBand, 0, dy, .098, book);
      });
      box(.052, .004, .088, MAT.judgePage, .080, .024, -.020, book);

      // ⑩ 朱笔：竹节笔杆 + 笔斗 + 笔毫 + 一点朱砂笔尖
      var brush = new T.Group();
      brush.position.set(.340, .955, .320);
      brush.rotation.set(-.20, 0, -.62);
      judge.add(brush);
      cyl(.011, .013, .300, MAT.woodDark, 0, .105, 0, brush, 8);
      [.030, .150].forEach(function (yy) {
        cyl(.014, .014, .010, MAT.judgeEdge, 0, yy, 0, brush, 8);
      });
      cyl(.014, .014, .022, MAT.judgeSilver, 0, -.028, 0, brush, 8);
      cyl(.020, .002, .078, MAT.folkHair, 0, -.080, 0, brush, 8);
      cyl(.004, .004, .020, MAT.cinnabar, 0, -.127, 0, brush, 8);

      // ⑪ 颈 + 头 + 耳 + 发 + 脸片（沿用 v28 修好的五官与 ?plainface=1 开关）
      var jneck = cyl(.056, .068, .105, MAT.judgeSkin, 0, 1.085, 0, judge, 10);
      jneck.scale.z = .78;
      var jhead = new T.Mesh(new T.SphereGeometry(.148, 14, 12), MAT.judgeSkin);
      jhead.position.set(0, 1.275, .018);
      jhead.scale.set(.93, 1.16, .82);
      jhead.rotation.y = -.10;
      judge.add(jhead);
      [-1, 1].forEach(function (sg) {   // v29 新增：耳朵
        var ear = new T.Mesh(new T.SphereGeometry(.029, 8, 6), MAT.judgeSkin);
        ear.position.set(sg * .136, -.012, .006);
        ear.scale.set(.52, 1, .60);
        jhead.add(ear);
      });
      var jhair = new T.Mesh(new T.SphereGeometry(.146, 14, 10,
        0, Math.PI * 2, 0, Math.PI * .27), MAT.folkHair);
      jhead.add(jhair);
      [-1, 1].forEach(function (sg) {
        var tuft = plane(.050, .130, MAT.folkHair, sg * .128, .046, -.010, jhead);
        tuft.rotation.z = sg * .22; tuft.rotation.y = sg * .48;
        var wisp = plane(.016, .115, MAT.folkHair, sg * .156, .014, -.005, jhead);
        wisp.rotation.z = sg * .46;
        var wisp2 = plane(.010, .088, MAT.folkHair, sg * .166, -.030, -.020, jhead);
        wisp2.rotation.z = sg * .58;
      });
      var jfs = new T.Shape(), jr = rand(353);
      for (var ai = 0; ai <= 30; ai++) {
        var th = ai / 30 * Math.PI * 2, jj = 1 + (jr() - .5) * .045;
        // v30：脸片比头壳正面还大时，近景会读成一张独立的白面具；
        // 收到头宽以内并贴回球面，五官仍是 v28 定稿那套长眉细目 / 平直薄唇。
        var px = Math.cos(th) * .108 * jj, py = Math.sin(th) * .144 * jj;
        if (ai === 0) jfs.moveTo(px, py); else jfs.lineTo(px, py);
      }
      jfs.closePath();
      var jface = new T.Mesh(normalizeUV(new T.ShapeGeometry(jfs, 3)), MAT.judgeFace);
      jface.position.z = .156;
      jhead.add(jface);

      // ⑫ 绕腮长须：从颌下 1.15 接到胸前，绝不盖住眉眼嘴（v28 踩过的坑）
      paperStrip([[-.022, 1.150], [.022, 1.150], [.030, .985],
                  [.010, .885], [-.010, .885], [-.030, .985]],
        .185, MAT.judgeBeard, judge);
      [-1, 1].forEach(function (sg) {
        paperStrip([[sg * .030, 1.145], [sg * .048, 1.140],
                    [sg * .064, .960], [sg * .044, .930]], .184, MAT.judgeBeard, judge);
        paperStrip([[sg * .118, 1.170], [sg * .084, 1.156], [sg * .106, 1.020],
                    [sg * .166, .900], [sg * .192, .920], [sg * .146, 1.034]],
          .183, MAT.judgeBeard, judge);
        paperStrip([[sg * .138, 1.152], [sg * .154, 1.145],
                    [sg * .224, .998], [sg * .206, .984]], .181, MAT.judgeBeard, judge);
      });

      // ⑬ 垂缨冠（v30）：v29 那 5 层方盒在实拍里读成一叠黑台阶，改成
      //    圆帽筒 + 薄帽檐 + 圆收帽顶 + 横向展脚幞头。展脚是中式文官最识别的剪影，
      //    横簪只露两点暗银簪头（v28 踩过「亮白天线」的坑），垂缨软带从檐侧垂到肩。
      var hatBrim = new T.Mesh(new T.CylinderGeometry(.212, .212, .026, 12), MAT.judgeHat);
      hatBrim.scale.set(1, 1, .80); hatBrim.position.set(0, 1.446, -.012); judge.add(hatBrim);
      var hatEdge = new T.Mesh(new T.CylinderGeometry(.220, .220, .010, 12, 1, true), MAT.judgeBrocade);
      hatEdge.scale.set(1, 1, .80); hatEdge.position.set(0, 1.432, -.012); judge.add(hatEdge);
      var hatBody = new T.Mesh(new T.CylinderGeometry(.146, .162, .155, 12, 1, true), MAT.judgeHat);
      hatBody.scale.set(1, 1, .82); hatBody.position.set(0, 1.532, -.012); judge.add(hatBody);
      var hatTop = new T.Mesh(new T.SphereGeometry(.152, 12, 8,
        0, Math.PI * 2, 0, Math.PI * .5), MAT.judgeHat);
      hatTop.scale.set(.96, .42, .80); hatTop.position.set(0, 1.608, -.012); judge.add(hatTop);
      var hatBand = new T.Mesh(new T.CylinderGeometry(.164, .164, .018, 12, 1, true), MAT.judgeBrocade);
      hatBand.scale.set(1, 1, .82); hatBand.position.set(0, 1.474, -.012); judge.add(hatBand);
      var pin = cyl(.006, .006, .390, MAT.judgeSilver, 0, 1.540, -.030, judge, 8);
      pin.rotation.z = Math.PI / 2;
      [-1, 1].forEach(function (sg) {
        var tip = new T.Mesh(new T.SphereGeometry(.012, 8, 6), MAT.judgeSilver);
        tip.position.set(sg * .200, 1.540, -.030); judge.add(tip);
        // 展脚：短、薄、后移并上翘，从帽后两侧伸出；v30 第一版又长又平，
        // 正面读成一根横穿过头的黑杆，这里收成中式幞头的两片翅。
        var wing = box(.230, .018, .048, MAT.judgeHat, sg * .292, 1.478, -.125, judge);
        wing.rotation.z = -sg * .13;
        var wingEdge = box(.218, .005, .038, MAT.judgeBrocade, sg * .292, 1.465, -.125, judge);
        wingEdge.rotation.z = -sg * .13;
        // 垂缨软带：从帽檐侧垂到肩，末端外撇（《西游记》「头顶乌纱飘软带」）
        paperStrip([[sg * .172, 1.442], [sg * .132, 1.438], [sg * .146, 1.190],
                    [sg * .206, 1.070], [sg * .232, 1.088], [sg * .190, 1.206]],
          .050, MAT.judgeHat, judge);
        paperStrip([[sg * .208, 1.078], [sg * .226, 1.074],
                    [sg * .240, .996], [sg * .224, .992]], .046, MAT.judgeEdge, judge);
      });

      // 脚下纸灰 + 脸前冷白补光 + 未走近时一点极淡的呼吸微光（图形引导，非文字）
      groundPlane(.82, .64, MAT.folkAsh, 0, 0, judge).position.y = .014;
      var jlight = new T.PointLight(0xbcd8cf, .55, 3.2, 2);
      jlight.position.set(JUDGE_AT[0] + .42, 1.60, JUDGE_AT[2] + .72);
      scene.add(jlight);
      var jglow = new T.Sprite(new T.SpriteMaterial({ map: M.glow, transparent: true,
        depthWrite: false, blending: T.AdditiveBlending, opacity: .10 }));
      jglow.position.set(0, 1.00, .24);
      jglow.scale.set(.85, .85, 1);
      judge.add(jglow);
      refs.judgeGlow = jglow;

      mark(judge, "judge");
      refs.judge = judge;
    }

    var NO_JUDGE = /nojudge=1/.test(window.location.search);
    var V28_JUDGE = /v28judge=1/.test(window.location.search);
    if (!NO_JUDGE && !V28_JUDGE) buildJudgeV29();
    // ?v28judge=1：回到 v28 站立版做造型对照（默认不执行）
    if (!NO_JUDGE && V28_JUDGE) {
      var judge = new T.Group();
      judge.position.set(-1.78, 0, -.62);
      judge.rotation.y = .26;          // 侧身朝右前方，正对玩家进门的方向
      root.add(judge);

      // 四棱柱方袖：先在几何空间转 45° 再压进深，正面才是平直宽袖而不是漏斗
      // （写成函数表达式，避免 strict 模式下块内函数声明的兼容问题）
      var judgeSleeve = function (rt, rb, h, mat, parent, yy) {
        var geo = new T.CylinderGeometry(rt, rb, h, 4, 1, true);
        geo.rotateY(Math.PI / 4);
        geo.scale(1, 1, .46);
        var m = new T.Mesh(geo, mat);
        m.position.y = yy;
        parent.add(m);
        return m;
      };

      // ① 罗袍：12 段棱面 A 字袍身，压进深让体量偏扁（糊纸 / 布袍，不是圆桶）
      var robeGeo = new T.CylinderGeometry(.225, .405, 1.30, 12, 1, true);
      robeGeo.scale(1, 1, .64);
      var robe = new T.Mesh(robeGeo, MAT.judgeRobe);
      robe.position.y = .70;
      judge.add(robe);
      // 胸肩段：云肩上缘到 1.445，袍身只到 1.35，中间必须有躯干托住
      var chestGeo = new T.CylinderGeometry(.212, .230, .17, 12, 1, true);
      chestGeo.scale(1, 1, .64);
      var jchest = new T.Mesh(chestGeo, MAT.judgeRobe);
      jchest.position.y = 1.395;
      judge.add(jchest);
      var hemGeo = new T.CylinderGeometry(.408, .414, .055, 12, 1, true);
      hemGeo.scale(1, 1, .64);
      var jhem = new T.Mesh(hemGeo, MAT.judgeEdge);
      jhem.position.y = .072; judge.add(jhem);

      // ② 云肩：四瓣如意弧，外缘深 / 内面暗银云纹（M.judgeCloud）
      var jcape = [
        [-.10, 1.445], [.10, 1.445], [.235, 1.410], [.345, 1.310],
        [.285, 1.220], [.195, 1.252], [.105, 1.175], [-.105, 1.175],
        [-.195, 1.252], [-.285, 1.220], [-.345, 1.310], [-.235, 1.410]
      ];
      paperStrip(jcape, .176, MAT.judgeEdge, judge);
      paperStrip(jcape.map(function (p) {
        return [p[0] * .88, 1.18 + (p[1] - 1.18) * .88];
      }), .183, MAT.judgeCloud, judge);

      // ③ 交领右衽：两片斜襟在胸口交叠成 Y 字。v28 实拍后收窄下端、
      //    压暗材质 —— 第一版两条又宽又亮的斜带又被读成「斜挎背带」。
      paperStrip([
        [-.285, 1.405], [-.120, 1.428], [.075, .965], [-.060, .952]
      ], .190, MAT.judgeInner, judge);
      paperStrip([
        [.285, 1.405], [.120, 1.428], [-.075, .990], [.060, .977]
      ], .197, MAT.judgeBand, judge);
      paperStrip([
        [.120, 1.428], [.150, 1.421], [-.045, .984], [-.075, .990]
      ], .204, MAT.judgeEdge, judge);
      // 从交叠点往腰带垂一道暗衽，把 Y 字的竖笔画接完整
      paperStrip([
        [-.032, .985], [.032, .985], [.040, .800], [-.040, .800]
      ], .202, MAT.judgeEdge, judge);

      // ④ 犀角带：宽腰带 + 暗银带扣 + 一点朱砂印；两条续平绪垂带斜剪末端
      box(.565, .105, .030, MAT.judgeBand, 0, .800, .210, judge);
      box(.565, .012, .034, MAT.judgeEdge, 0, .858, .212, judge);
      box(.565, .012, .034, MAT.judgeEdge, 0, .742, .212, judge);
      box(.100, .100, .034, MAT.judgeSilver, 0, .800, .230, judge);
      box(.030, .030, .038, MAT.judgeEdge, 0, .800, .250, judge);
      [-1, 1].forEach(function (sg) {
        var rb = paperStrip([
          [-.036, 0], [.036, 0], [.028, -.50], [-.020, -.48]
        ], .216, MAT.judgeInner, judge, sg * .070, .740);
        rb.rotation.z = sg * .07;
        box(.010, .50, .008, MAT.judgeEdge, sg * .070, .49, .220, judge)
          .rotation.z = sg * .07;
      });

      // ⑤ 宽袖 + 捧簿 / 执笔的两只手
      [-1, 1].forEach(function (sg) {
        var arm = new T.Group();
        arm.position.set(sg * .278, 1.295, .012);
        arm.rotation.z = sg * .10;
        judge.add(arm);
        judgeSleeve(.086, .116, .30, MAT.judgeRobe, arm, .155);
        var sh = paperStrip([
          [-.095, .318], [.095, .318], [.118, .262], [-.118, .268]
        ], .048, MAT.judgeRobe, arm);
        sh.rotation.z = sg * .16;
        judgeSleeve(.116, .120, .026, MAT.judgeEdge, arm, .002);
        var elbow = new T.Group();
        elbow.rotation.z = -sg * .10;
        elbow.rotation.x = sg < 0 ? -.52 : -.40;   // 前臂前抬：左手托簿、右手执笔
        arm.add(elbow);
        judgeSleeve(.120, .148, .30, MAT.judgeRobe, elbow, -.150);
        box(.200, .012, .010, MAT.judgeBand, 0, .060, .070, elbow);
        judgeSleeve(.150, .156, .042, MAT.judgeEdge, elbow, -.320);
        var hollow = new T.Mesh(new T.PlaneGeometry(.26, .26), MAT.folkHollow);
        hollow.rotation.x = -Math.PI / 2; hollow.scale.y = .46;
        hollow.position.y = -.342; elbow.add(hollow);
        // 袖口里露出一点旧纸色的手
        var hand = new T.Mesh(new T.SphereGeometry(.052, 10, 8), MAT.judgeSkin);
        hand.position.set(0, -.330, .055);
        hand.scale.set(.92, .78, .62);
        elbow.add(hand);
      });

      // ⑥ 生死簿：左手托着，封面只留模糊笔痕（v3 禁清晰文字）
      var book = new T.Group();
      book.position.set(-.355, 1.045, .305);
      book.rotation.set(-.44, .14, .10);
      judge.add(book);
      box(.275, .030, .205, MAT.judgeBook, 0, 0, 0, book);
      box(.255, .020, .188, MAT.judgeInner, 0, .018, 0, book);
      box(.014, .040, .205, MAT.judgeEdge, -.137, 0, 0, book);
      [-.070, -.024, .024, .070].forEach(function (dz) {
        box(.010, .006, .008, MAT.judgeEdge, -.128, .026, dz, book);
      });

      // ⑦ 朱笔：右手斜持，笔头倒锥 + 一点朱砂笔尖（全幕唯一暖色之一）
      var brush = new T.Group();
      brush.position.set(.355, 1.075, .300);
      brush.rotation.set(-.22, 0, -.58);
      judge.add(brush);
      cyl(.011, .013, .30, MAT.woodDark, 0, .105, 0, brush, 8);
      cyl(.014, .014, .022, MAT.judgeSilver, 0, -.028, 0, brush, 8);
      cyl(.020, .002, .078, MAT.folkHair, 0, -.080, 0, brush, 8);
      cyl(.004, .004, .020, MAT.cinnabar, 0, -.127, 0, brush, 8);

      // ⑧ 颈 + 头：比纸扎人略大，仍是低分段椭球（有棱面，不是光滑塑料人头）
      var jneck = cyl(.058, .070, .120, MAT.judgeSkin, 0, 1.440, 0, judge, 10);
      jneck.scale.z = .78;
      var jhead = new T.Mesh(new T.SphereGeometry(.152, 14, 12), MAT.judgeSkin);
      jhead.position.set(0, 1.655, .018);
      jhead.scale.set(.93, 1.16, .82);
      jhead.rotation.y = -.08;
      judge.add(jhead);
      // 发帽 + 蓬松鬓发（原文「鬓发蓬松飘耳上」）
      // v28 实拍修正：发帽原本盖到眉骨、两片垂鬓盖到眼尾，五官全被吃掉。
      // 发帽收窄到只包头顶，鬓发缩短上移并往后收，脸片明确推到最前层。
      var jhair = new T.Mesh(new T.SphereGeometry(.150, 14, 10,
        0, Math.PI * 2, 0, Math.PI * .27), MAT.folkHair);
      jhead.add(jhair);
      [-1, 1].forEach(function (sg) {
        var tuft = new T.Mesh(new T.PlaneGeometry(.055, .135), MAT.folkHair);
        tuft.position.set(sg * .134, .048, -.010);
        tuft.rotation.z = sg * .22;
        tuft.rotation.y = sg * .48;
        jhead.add(tuft);
        var wisp = new T.Mesh(new T.PlaneGeometry(.018, .120), MAT.folkHair);
        wisp.position.set(sg * .162, .015, -.005);
        wisp.rotation.z = sg * .46;
        jhead.add(wisp);
      });
      // 脸片贴球头正面：头壳正面 z≈.125，发帽前缘≈.111；
      // 放到 head 局部 .170（× scale.z .82 + .018 ≈ .157 世界）才稳稳压住发帽。
      var jfs = new T.Shape(), jr = rand(353);
      for (var ai = 0; ai <= 30; ai++) {
        var th = ai / 30 * Math.PI * 2, j = 1 + (jr() - .5) * .045;
        var px = Math.cos(th) * .122 * j, py = Math.sin(th) * .160 * j;
        if (ai === 0) jfs.moveTo(px, py); else jfs.lineTo(px, py);
      }
      jfs.closePath();
      var jface = new T.Mesh(normalizeUV(new T.ShapeGeometry(jfs, 3)), MAT.judgeFace);
      jface.position.z = .170;
      jhead.add(jface);

      // ⑨ 绕腮长须：脸上画了八字须与须根，3D 纸片从**颌下**接到胸前。
      //    v28 实拍第一版从 1.575 起，直接把眉眼嘴全糊住了 —— 脸片下缘在
      //    世界 y≈1.47、嘴约 1.565，所以须顶必须压到 1.52 以下。
      //    灰白淡墨、末端外撇，读作「胡须飞舞绕腮旁」而不是一整块黑胡子。
      // 中央长须收成一束窄须丝：第一版宽 .084 的整片读成一条白「领带」。
      // z 必须大于脸片世界 z（≈.157），否则会被脸片盖住顶部。
      paperStrip([
        [-.022, 1.500], [.022, 1.500], [.030, 1.300],
        [.010, 1.190], [-.010, 1.190], [-.030, 1.300]
      ], .185, MAT.judgeBeard, judge);
      [-1, 1].forEach(function (sg) {
        paperStrip([
          [sg * .030, 1.495], [sg * .048, 1.490],
          [sg * .064, 1.285], [sg * .044, 1.255]
        ], .184, MAT.judgeBeard, judge);
      });
      [-1, 1].forEach(function (sg) {
        paperStrip([
          [sg * .120, 1.525], [sg * .085, 1.510], [sg * .108, 1.360],
          [sg * .170, 1.235], [sg * .196, 1.256], [sg * .148, 1.375]
        ], .183, MAT.judgeBeard, judge);
        // 一缕飘出腮外的细须
        paperStrip([
          [sg * .140, 1.505], [sg * .156, 1.498],
          [sg * .228, 1.330], [sg * .210, 1.316]
        ], .181, MAT.judgeBeard, judge);
      });

      // ⑩ 乌纱：低方帽 + 帽檐 + 横簪 + 两条垂到肩的软带（「头顶乌纱飘软带」）
      box(.370, .035, .300, MAT.judgeHat, 0, 1.836, -.012, judge);
      box(.290, .145, .235, MAT.judgeHat, 0, 1.915, -.012, judge);
      box(.235, .045, .190, MAT.judgeHat, 0, 1.995, -.012, judge);
      // 横簪只露两端一点：第一版 .40 m + 银色在暗廊里像两根白天线
      var pin = cyl(.008, .008, .325, MAT.judgeSilver, 0, 1.925, -.030, judge, 8);
      pin.rotation.z = Math.PI / 2;
      [-1, 1].forEach(function (sg) {
        paperStrip([
          [sg * .185, 1.840], [sg * .135, 1.838], [sg * .158, 1.500],
          [sg * .222, 1.348], [sg * .252, 1.372], [sg * .206, 1.512]
        ], .045, MAT.judgeHat, judge);
      });

      // ⑪ 粉底靴压暗（柱础纯白块的教训：这里绝不留高亮水平面）
      [-1, 1].forEach(function (sg) {
        box(.130, .095, .230, MAT.judgeHat, sg * .145, .055, .090, judge);
        box(.130, .016, .230, MAT.judgeEdge, sg * .145, .012, .090, judge);
      });
      groundPlane(.72, .52, MAT.folkAsh, 0, 0, judge).position.y = .014;

      // 只有判官脸前加一点冷白补光，让他从暗廊里浮出来；不加暖光、不打亮全廊
      var jlight = new T.PointLight(0xbcd8cf, .48, 3.4, 2);
      jlight.position.set(-1.30, 2.20, .55);
      scene.add(jlight);

      mark(judge, "judge");
      refs.judge = judge;
    }

    // ——— 木案 + 摇柄取号机 ———
    var desk = new T.Group(); desk.position.set(1.52, 0, -1.05); root.add(desk);
    box(2.05, .085, .82, MAT.wood, 0, .90, 0, desk);
    box(2.05, .12, .06, MAT.woodDark, 0, .83, -.36, desk);
    box(2.05, .12, .06, MAT.woodDark, 0, .83,  .36, desk);
    [-.88, .88].forEach(function (dx) {
      box(.09, .86, .09, MAT.woodDark, dx, .43, -.31, desk);
      box(.09, .86, .09, MAT.woodDark, dx, .43,  .31, desk);
    });
    box(1.86, .17, .05, MAT.wood, 0, .70, -.35, desk);

    // v29：案左端一套文房，配合坐在案侧的判官。位置避开取号机（desk 局部 x=-.42）、
    // 空白路引（世界 x=2.04）与香炉（2.38），不参与拾取、不抢四件证物的微光。
    var wen = new T.Group(); wen.position.set(-.86, .945, .16); desk.add(wen);
    box(.260, .026, .170, MAT.bronzeDark, -.110, .013, -.055, wen);   // 砚
    box(.200, .004, .120, MAT.judgeEdge, -.110, .028, -.055, wen);    // 砚池
    cyl(.052, .052, .020, MAT.bronzeDark, .190, .010, -.060, wen, 12); // 印泥碟
    cyl(.040, .040, .005, MAT.cinnabar, .190, .022, -.060, wen, 12);   // 一点朱
    box(.270, .012, .165, MAT.judgePage, -.010, .007, .110, wen);      // 空白牒页
    box(.250, .003, .150, MAT.judgeBook, -.010, .014, .110, wen);
    box(.230, .016, .024, MAT.bamboo, -.010, .024, .110, wen);         // 镇纸
    [-1, 1].forEach(function (sg) {
      box(.016, .058, .016, MAT.woodDark, sg * .100, .042, -.150, wen);
    });
    box(.230, .012, .018, MAT.woodDark, 0, .078, -.150, wen);
    cyl(.008, .008, .190, MAT.woodDark, 0, .090, -.150, wen, 8)
      .rotation.z = Math.PI / 2;                                       // 备用笔
    cyl(.013, .002, .046, MAT.folkHair, .112, .090, -.150, wen, 8)
      .rotation.z = -Math.PI / 2;

    // 取号机：木盒 + 铜出牌口 + 侧摇柄
    // 不带深木纹贴图：贴图会再乘一次暗色，背光处仍是一个纯黑盒子
    var machineWood = new T.MeshStandardMaterial({ map: M.wood, color: 0xffffff,
      roughness: .92, emissive: 0x2a2e29, emissiveIntensity: .32 });
    var machine = new T.Group(); machine.position.set(-.42, .94, -.02); desk.add(machine);
    box(.48, .56, .40, machineWood, 0, .28, 0, machine);
    box(.50, .045, .42, MAT.woodDark, 0, .575, 0, machine);
    box(.34, .035, .03, MAT.bronzeDark, 0, .20, -.205, machine);
    box(.22, .012, .012, MAT.bronze, 0, .36, -.208, machine);
    var crank = new T.Group(); crank.position.set(.30, .34, 0); machine.add(crank);
    cyl(.022, .022, .21, MAT.bronze, .10, 0, 0, crank).rotation.z = Math.PI / 2;
    var arm = box(.030, .26, .030, MAT.bronze, .21, .11, 0, crank);
    arm.rotation.z = -.12;
    var knob = new T.Mesh(new T.SphereGeometry(.055, 10, 8), MAT.bronze);
    knob.position.set(.245, .235, 0); crank.add(knob);
    refs.crank = crank;
    mark(machine, "machine");
    glowAt("machine", 1.10, 1.55, -1.07, .72);
    var machineLight = new T.PointLight(0xa8c8bc, .38, 3.0, 2);
    machineLight.position.set(1.10, 1.62, -1.07); scene.add(machineLight);

    // ——— 地上散落十几枚竹牌 ———
    var rr2 = rand(233);
    for (var bi = 0; bi < 13; bi++) {
      var bz = .6 - rr2() * 3.4, bx = -.6 + rr2() * 2.9;
      var bp = groundPlane(.12, .042, MAT.bamboo, bx, bz);
      bp.position.y = .020 + bi * .0003;
      bp.rotation.z = rr2() * Math.PI * 2;
    }
    // 摇柄后落出的那一枚（可点）
    var drop = new T.Mesh(new T.BoxGeometry(.12, .008, .042), MAT.bamboo);
    drop.position.set(1.02, .02, -.42);
    drop.rotation.y = .32; drop.visible = false;
    root.add(drop);
    mark(drop, "ticket");
    refs.drop = drop;
    glowAt("ticket", 1.02, .22, -.42, .48);

    // ——— 空白路引：两半，中间未合的骑缝 ———
    var passGroup = new T.Group(); passGroup.position.set(1.52 + .52, .951, -1.05 + .18);
    root.add(passGroup);
    var passL = plane(.20, .28, MAT.pass, -.108, 0, 0, passGroup);
    var passR = plane(.20, .28, MAT.pass,  .108, 0, 0, passGroup);
    [passL, passR].forEach(function (p) { p.rotation.x = -Math.PI / 2; });
    var seal = plane(.115, .115, MAT.seal.clone(), 0, .004, 0, passGroup);
    seal.rotation.x = -Math.PI / 2; seal.visible = false;
    // 两半纸中间留了 1.6 cm 骑缝，点正中央射线会穿过去（真实玩家也会点空）。
    // 铺一块几乎透明的命中板盖住整张路引，父组已 mark 为 "pass"。
    var passHit = plane(.44, .30,
      new T.MeshBasicMaterial({ transparent: true, opacity: .001,
                                depthWrite: false, side: T.DoubleSide }),
      0, .002, 0, passGroup);
    passHit.rotation.x = -Math.PI / 2;
    refs.passHit = passHit;
    refs.passL = passL; refs.passR = passR; refs.seal = seal;
    mark(passGroup, "pass");
    glowAt("pass", 2.04, 1.22, -.87, .60);

    // ——— 小铜香炉 + 更香 ———
    var censer = new T.Group(); censer.position.set(1.52 + .86, .94, -1.05 - .20);
    root.add(censer);
    cyl(.115, .095, .13, MAT.bronze, 0, .065, 0, censer, 14);
    var rim = new T.Mesh(new T.TorusGeometry(.115, .016, 6, 16), MAT.bronzeDark);
    rim.rotation.x = Math.PI / 2; rim.position.y = .13; censer.add(rim);
    [-1, 0, 1].forEach(function (k) {
      var leg = cyl(.012, .014, .075, MAT.bronzeDark,
                    Math.cos(k * 2.09) * .085, -.015, Math.sin(k * 2.09) * .085, censer, 6);
      leg.rotation.z = Math.cos(k * 2.09) * .2;
    });
    // 灰（悬停不落地）
    for (var ai = 0; ai < 9; ai++) {
      var ashP = new T.Mesh(new T.SphereGeometry(.006 + rr2() * .008, 5, 4), MAT.ash);
      ashP.position.set((rr2() - .5) * .16, .16 + rr2() * .22, (rr2() - .5) * .16);
      censer.add(ashP);
    }
    // 更香：6 段，点香后逐段变短
    var stickSegs = [];
    for (var si = 0; si < 6; si++) {
      var seg = cyl(.007, .008, .048, MAT.woodDark, 0, .20 + si * .048, 0, censer, 6);
      stickSegs.push(seg);
    }
    var ember = new T.Mesh(new T.SphereGeometry(.014, 8, 6), MAT.ember);
    ember.position.set(0, .20 + 6 * .048, 0); ember.visible = false; censer.add(ember);
    refs.stickSegs = stickSegs; refs.ember = ember;
    mark(censer, "incense");
    glowAt("incense", 2.38, 1.42, -1.25, .56);
    // 香头一点冷光
    var emberLight = new T.PointLight(0xb8e8d8, 0, 2.2, 2);
    emberLight.position.set(censer.position.x, censer.position.y + .5, censer.position.z);
    scene.add(emberLight); refs.emberLight = emberLight;

    // ——— 香烟不往上飘，贴着地面朝门外流 ———
    var smokeGroup = new T.Group(); root.add(smokeGroup);
    for (var smi = 0; smi < 11; smi++) {
      var sm = groundPlane(.62 + smi * .085, 1.25 + smi * .075,
        MAT.smoke.clone(), 2.35 + Math.sin(smi * .65) * .30,
        -1.25 + smi * .56);
      sm.position.y = .028 + smi * .0015;
      sm.rotation.z = (rr2() - .5) * .24;
      sm.material.opacity = 0;
      sm.userData.target = .20 - smi * .012;
      smokeGroup.add(sm);
    }
    refs.smokeGroup = smokeGroup;
    mark(smokeGroup, "smoke");
    glowAt("smoke", 2.3, .22, 1.6, .55);

    // ——— 墙上朱笔水牌 / 办事须知木牌（字迹模糊，只作观察点） ———
    var noticeR = plane(.88, 1.30, MAT.notice, L.halfW - .10, 2.05, 1.35);
    noticeR.rotation.y = -Math.PI / 2; root.add(noticeR);
    mark(noticeR, "notice");
    glowAt("notice", 2.95, 2.05, 1.35, .52);
    var noticeL = plane(.98, 1.52, MAT.notice.clone(), -L.halfW + .10, 2.10, -.05);
    noticeL.rotation.y = Math.PI / 2; noticeL.material.color.setHex(0xb9b8a8);
    root.add(noticeL);
    mark(noticeL, "watercard");   // v27：左墙朱笔水牌，台词「甲字叁号 · 叁号窗口暂停服务」
    box(1.06, 1.60, .04, MAT.woodDark, -L.halfW + .13, 2.10, -.05);

    // ——— 头顶一盏白纸灯笼，燃青白冷火 ———
    var lamp = new T.Group(); lamp.position.set(.35, 3.34, -1.1); root.add(lamp);
    var shade = cyl(.20, .20, .44, MAT.lampPaper, 0, 0, 0, lamp, 16);
    shade.material.side = T.DoubleSide;
    cyl(.20, .20, .025, MAT.woodDark, 0, .235, 0, lamp, 16);
    cyl(.20, .20, .025, MAT.woodDark, 0, -.235, 0, lamp, 16);
    // 竹箍三道，纸罩才不像一根白塑料管
    [-.14, 0, .14].forEach(function (hy) {
      var hoop = new T.Mesh(new T.TorusGeometry(.202, .006, 5, 18), MAT.woodDark);
      hoop.rotation.x = Math.PI / 2; hoop.position.y = hy; lamp.add(hoop);
    });
    box(.012, .9, .012, MAT.woodDark, 0, .66, 0, lamp);
    var flame = new T.Mesh(new T.SphereGeometry(.045, 8, 8), MAT.ember);
    flame.scale.set(.7, 1.5, .7); lamp.add(flame);  // 火苗笔直不晃
    var halo = new T.Sprite(new T.SpriteMaterial({ map: M.glow, transparent: true,
      depthWrite: false, blending: T.AdditiveBlending, opacity: .42 }));
    halo.scale.set(.62, .62, 1); lamp.add(halo);
    var lampLight = new T.PointLight(0xbfe6d9, 1.15, 8.5, 2);
    scene.add(lampLight); lampLight.position.copy(lamp.position);
    mark(lamp, "lamp");   // v27：白纸灯笼可点，给「青白冷火」台词

    // ——— 黄纸纸钱与香灰悬停半空不落地 ———
    for (var pi = 0; pi < 14; pi++) {
      var ppx = (rr2() - .5) * 4.6;
      // 别让一片纸钱正好孤零零悬在画面正中，看着像贴图穿帮
      if (Math.abs(ppx) < .55) ppx += (ppx >= 0 ? 1 : -1) * .95;
      var pp = plane(.032 + rr2() * .032, .032 + rr2() * .032, MAT.money,
        ppx, .55 + rr2() * 1.85, -1 + (rr2() - .5) * 13);
      pp.rotation.set((rr2() - .5) * .9, rr2() * Math.PI * 2, (rr2() - .5) * .7);
      pp.material = MAT.money.clone();
      pp.material.transparent = true; pp.material.opacity = .30 + rr2() * .26;
    }

    // ——— 环境与补光：没有太阳天空，光像从地底渗出来 ———
    // 没有太阳和天空。环境光只够看清轮廓，亮部只来自窗外渗进来的冷白与灯笼，
    // 四周才压得住「一大片死暗、光不知从哪来」的阴司感。
    scene.add(new T.AmbientLight(0x66716d, .42));
    var floorGlow = new T.PointLight(0x9fb8b0, .40, 12, 2);
    floorGlow.position.set(-.4, .22, -5.5); scene.add(floorGlow);
    var backGlow = new T.PointLight(0xdceae4, .30, 13, 2);
    backGlow.position.set(0, 2.0, -18.2); scene.add(backGlow);
    // 门口一小片贴地冷光，让那串湿脚印读得出来（不是阳光，像从地底渗出来）
    var footLight = new T.PointLight(0xa9c6bd, .34, 4.6, 2);
    footLight.position.set(-.1, .38, 3.25); scene.add(footLight);
    scene.fog = new T.Fog(0x98a6a0, 8.5, 27.0);
    scene.background = new T.Color(0x8b9994);

    // ——— 状态与动画 ———
    var step = 0;                 // 0..4（4 = 门已开）
    var anim = { crank: -1, drop: -1, pass: -1, incense: -1, door: -1 };
    var smokeAlpha = 0, doorAngle = 0, crankAngle = 0;
    var lampFogPhase = 0;

    function setGlow() {
      var active = step < 4 ? PICKS[step] : null;
      Object.keys(glows).forEach(function (id) {
        var on = (id === active) || (OBSERVE.indexOf(id) >= 0 && !observed[id]);
        glows[id].userData.on = !!on;
        glows[id].userData.main = (id === active);
      });
    }

    function applyStep(n, instant) {
      step = Math.max(0, Math.min(4, n | 0));
      // 静态终态
      refs.crank.rotation.z = step >= 1 ? Math.PI * 2 : 0;
      refs.drop.visible = step >= 1 && step < 2;
      refs.passL.position.x = step >= 3 ? -.101 : -.108;
      refs.passR.position.x = step >= 3 ?  .101 :  .108;
      refs.seal.visible = step >= 3;
      refs.ember.visible = step >= 4;
      refs.emberLight.intensity = step >= 4 ? .55 : 0;
      refs.ember.position.y = .20 + (step >= 4 ? 2 : 6) * .048;
      refs.stickSegs.forEach(function (s, i) { s.visible = step < 4 || i < 2; });
      smokeAlpha = step >= 4 ? 1 : 0;
      doorAngle = step >= 4 ? 1 : 0;
      refs.doorL.rotation.y = doorAngle * .92;
      refs.doorR.rotation.y = -doorAngle * .92;
      // 点香后雾稍散，让「第一殿的门自己开了」真的看得见
      refs.fogNear.material.opacity = step >= 4 ? .08 : .18;
      refs.fogMid.material.opacity = step >= 4 ? .12 : .28;
      fogFront.material.opacity = step >= 4 ? .18 : .42;
      fogDeep.material.opacity = step >= 4 ? .28 : .62;
      refs.doorFog.material.opacity = step >= 4 ? .62 : 0;
      smokeGroup.children.forEach(function (sm) {
        sm.material.opacity = smokeAlpha * (sm.userData.target || .16);
      });
      if (instant) {
        anim = { crank: -1, drop: -1, pass: -1, incense: -1, door: -1 };
      }
      setGlow();
      return step;
    }

    // 由 app.js 在每次交互成功后推进。instant=true 直接定格终态（出图 / 复位用），
    // 否则把物件退回上一步的终态，交给 update() 逐帧播动画。
    function advance(instant) {
      var from = step;
      if (step >= 4) return step;
      step = from + 1;
      if (instant) {
        applyStep(step, true);
        return step;
      }
      if (from === 0) {
        // 竹牌立刻出现在出牌口，动画只负责下落：不依赖动画时序，
        // 玩家 / 探针在点完摇柄后马上就能点到它。
        refs.crank.rotation.z = 0;
        refs.drop.visible = true;
        refs.drop.position.y = 1.28;
        anim.crank = 0; anim.drop = 0;
      }
      if (from === 1) refs.drop.visible = false;
      if (from === 2) {
        refs.passL.position.x = -.108; refs.passR.position.x = .108;
        refs.seal.visible = false; anim.pass = 0;
      }
      if (from === 3) {
        refs.ember.visible = false; refs.emberLight.intensity = 0;
        refs.ember.position.y = .20 + 6 * .048;
        refs.stickSegs.forEach(function (s) { s.visible = true; });
        smokeAlpha = 0; doorAngle = 0;
        refs.doorL.rotation.y = 0; refs.doorR.rotation.y = 0;
        smokeGroup.children.forEach(function (sm) { sm.material.opacity = 0; });
        refs.fogNear.material.opacity = .18; refs.fogMid.material.opacity = .28;
        fogFront.material.opacity = .42; fogDeep.material.opacity = .62;
        refs.doorFog.material.opacity = 0;
        anim.incense = 0; anim.door = 0;
      }
      setGlow();
      return step;
    }

    function busy() {
      return Object.keys(anim).some(function (k) { return anim[k] >= 0; });
    }

    function setObserved(id) {
      if (OBSERVE.indexOf(id) < 0 || observed[id]) return false;
      observed[id] = true;
      setGlow();
      return true;
    }

    function update(dt, t) {
      var moving = false;
      // 摇柄 0.8 s 转一圈；竹牌独立计时（等 0.45 s 再落 0.5 s），
      // 不能挂在 crank 块里，否则摇柄一停 drop 就再也不推进了
      if (anim.crank >= 0) {
        moving = true;
        anim.crank += dt / .8;
        var c = Math.min(1, anim.crank);
        refs.crank.rotation.z = c * Math.PI * 2;
        if (anim.crank >= 1) anim.crank = -1;
      }
      if (anim.drop >= 0) {
        moving = true;
        anim.drop += dt / .95;
        var raw = Math.min(1, anim.drop);
        var d = Math.max(0, (raw - .474) / .526);
        if (d > 0) {
          refs.drop.visible = true;
          refs.drop.position.y = 1.28 - 1.26 * (1 - Math.pow(1 - d, 2));
          refs.drop.rotation.y = .32 + d * 1.5;
        }
        if (raw >= 1) anim.drop = -1;
      }
      // 两半路引合拢 + 半印落下
      if (anim.pass >= 0) {
        moving = true;
        anim.pass += dt / .7;
        var p = Math.min(1, anim.pass), e = 1 - Math.pow(1 - p, 3);
        refs.passL.position.x = -.108 + .007 * e;
        refs.passR.position.x =  .108 - .007 * e;
        if (p > .55) {
          refs.seal.visible = true;
          refs.seal.scale.setScalar(.6 + .4 * ((p - .55) / .45));
        }
        if (p >= 1) anim.pass = -1;
      }
      // 点香：香头亮 → 烟贴地流 → 香逐段变短 → 门开
      if (anim.incense >= 0) {
        moving = true;
        anim.incense += dt / 1.5;
        var a = Math.min(1, anim.incense);
        refs.ember.visible = a > .08;
        refs.emberLight.intensity = a * .55;
        smokeAlpha = Math.max(0, (a - .18) / .82);
        smokeGroup.children.forEach(function (sm) {
          sm.material.opacity = smokeAlpha * (sm.userData.target || .16);
        });
        // 香从顶端往下烧，底部段保留、顶端逐段消失，香头跟着下移
        var keep = Math.max(2, 6 - Math.floor(a * 4));
        refs.stickSegs.forEach(function (s, i) { s.visible = i < keep; });
        refs.ember.position.y = .20 + keep * .048;
        if (a >= 1) anim.incense = -1;
      }
      if (anim.door >= 0) {
        moving = true;
        anim.door += dt / 1.2;
        var dd = Math.min(1, anim.door), de = 1 - Math.pow(1 - dd, 2);
        doorAngle = de;
        refs.doorL.rotation.y = de * .92;
        refs.doorR.rotation.y = -de * .92;
        refs.fogNear.material.opacity = .18 - .10 * de;
        refs.fogMid.material.opacity = .28 - .16 * de;
        fogFront.material.opacity = .42 - .24 * de;
        fogDeep.material.opacity = .62 - .34 * de;
        refs.doorFog.material.opacity = .62 * de;
        if (dd >= 1) anim.door = -1;
      }
      // 微光呼吸 / 雾幕缓慢翻涌（出图模式由 app.js 冻结 t）
      var pulse = .42 + .30 * Math.sin(t * 2.1);
      Object.keys(glows).forEach(function (id) {
        var g = glows[id];
        var target = g.userData.on ? (g.userData.main ? pulse : .12 + .06 * Math.sin(t * 1.3 + id.length)) : 0;
        g.material.opacity += (target - g.material.opacity) * Math.min(1, dt * 6);
      });
      if (refs.openFog) refs.openFog.material.map.offset.x = (t * .0035) % 1;
      refs.fogNear.material.map.offset.x = (t * .0012) % 1;
      refs.fogMid.material.map.offset.x = -(t * .0018) % 1;
      fogFront.material.map.offset.x = (t * .0022) % 1;
      fogDeep.material.map.offset.x = -(t * .0016) % 1;
      lampFogPhase += dt;
      return moving;
    }

    function reset() {
      observed = Object.create(null);
      applyStep(0, true);
    }

    // ——— Aholo Lux3D 资产挂载点 ———
    // 只暴露引用，不改任何交互 / 动画。GLB 由 prologue/lux3d.js 异步挂载；
    // 文件不存在时整层静默跳过，程序化占位继续可玩。
    refs.luxHosts = {
      machine: machine,   // 取号机外壳（refs.crank 摇柄保留，仍由引擎转）
      desk: desk,         // 案上卷册（复用 S1-09）+ 路引实物（S0-21）
      bench: bench,       // 旧榆木长凳
      folk: folkGroup,    // 面壁无点睛纸扎人 ×5 实例
      ticket: drop,       // 可点竹牌（落牌动画作用在 drop 本身）
      pass: passGroup,    // 两半路引 / 半印 / 命中板全部保留
      censer: censer,     // 青铜香炉（复用 S1-06）
      lamp: lamp,         // 白纸灯笼（青白冷火由引擎补）
      doorL: doorL, doorR: doorR  // 第一殿门扇（复用 S1-08）
    };

    applyStep(0, true);

    return {
      root: root, pickMeshes: pickMeshes, refs: refs, judgeAt: JUDGE_AT,
      get step() { return step; },
      get observedCount() { return Object.keys(observed).length; },
      observeTotal: OBSERVE_TOTAL,
      PICKS: PICKS, OBSERVE: OBSERVE,
      applyStep: applyStep, advance: advance, busy: busy, setObserved: setObserved,
      update: update, reset: reset,
      layout: LAYOUT
    };
  }

  window.PrologueScene = { LAYOUT: LAYOUT, PICKS: PICKS, OBSERVE: OBSERVE, build: build };
})();
