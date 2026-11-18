/* 第一殿 · 孽镜台 — 场景搭建层 · v7 公堂陈设版
 * 依据（优先级从高到低）：
 *   A 队友《场景生图提示词_v3_恐怖版》「一殿」段 + 连贯锁 / 负面（主约束）
 *     注：业秤归「二殿」，本殿刻意不做；负面词排除活人／鬼怪实体／清晰文字／寺庙佛堂
 *   B 队友 build_script_and_assets.py 第一殿 3D 资产清单（数量 / 命名 / 尺寸）
 *   C 文献（补足形制）：《玉历宝钞》一殿秦广王条「台高一丈，镜大十围，向东悬挂，
 *     上横七字曰孽镜台前无好人」；《楞严经》卷八「业镜火珠」；敦煌 P.2003 / P.4523
 *     《佛说十王经》图卷；大足宝顶山第20龛地狱变「十大冥王…二司／书记／判官／鬼卒」
 *     「桌幡刻名号与偈文」（业秤留给二殿）；南宋陆信忠《十王图》（案、屏风、榜题）；
 *     三原城隍庙明清《十殿阎君》水陆画（堆金沥粉、青灰蓝绿）；唐海兽葡萄镜 / 八卦镜 /
 *     宝相花镜纹饰；明清旋子彩画、斗八藻井与平棊、雀替、菱花隔扇、衙署更漏与堂刑。
 * 6 件证物 = Lux3D 真实 GLB（/models/S1-*.glb，1 unit = 1 m）。
 * 墙 / 地 / 柱 / 案 / 匾 / 窗棂 / 陈设 = 程序化几何 + Canvas 贴图，不占生成名额。
 * 全局 THREE r128（vendor/），无模块打包、无网络依赖。
 */
(function () {
  "use strict";
  var T = window.THREE;

  // 镜面几何（app.js 与 scene.js 共用同一组常量）
  var MIRROR = { x: 0, y: 2.02, z: -0.76, r: .94 };

  // —— 五处差异 —— 每项 0/1，1 为「镜中（进门之前）」的状态
  var KEYS = ["candle", "banner", "door", "censer", "ledger"];
  var DIFFS = [
    { key: "candle", label: "烛台方位", sub: "五支烛台 · 90° 步进", hit: "candles" },
    { key: "banner", label: "经幡顺序", sub: "六面幡 · 长短与挂序", hit: "banners" },
    { key: "door", label: "柜门开合", sub: "两扇 · 左铰链 pivot", hit: "doors" },
    { key: "censer", label: "香炉有无", sub: "案侧 · 显隐", hit: "censer" },
    { key: "ledger", label: "案上卷册朝向", sub: "三卷 · 0° / 180°", hit: "ledgers" }
  ];
  var TARGET = { candle: 1, banner: 1, door: 1, censer: 1, ledger: 1 };
  var SCRAMBLE = { candle: 0, banner: 0, door: 0, censer: 0, ledger: 0 };
  var state = Object.assign({}, SCRAMBLE);

  // —— 程序化贴图 ——
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

  // 青灰石板：错缝铺法 + 磨损高光 + 裂纹 + 水渍
  var stoneTex = tex(512, function (g, s) {
    var r = rand(7), bw = s / 4, bh = s / 4;
    g.fillStyle = "#333b38"; g.fillRect(0, 0, s, s);
    for (var row = 0; row < 4; row++) {
      for (var col = -1; col <= 4; col++) {
        var ox = (row % 2) ? bw * .5 : 0;
        var x = col * bw + ox, y = row * bh;
        var v = 52 + Math.floor(r() * 17);
        g.fillStyle = "rgb(" + v + "," + (v + 7) + "," + (v + 4) + ")";
        g.fillRect(x + 2, y + 2, bw - 4, bh - 4);
        g.strokeStyle = "rgba(150,170,158,.11)"; g.lineWidth = 1;
        g.strokeRect(x + 4, y + 4, bw - 8, bh - 8);
        g.strokeStyle = "rgba(9,15,14,.42)"; g.lineWidth = 2;
        g.strokeRect(x + 1, y + 1, bw - 2, bh - 2);
        for (var k = 0; k < 3; k++) {
          g.strokeStyle = "rgba(10,17,16," + (.10 + r() * .16) + ")";
          g.lineWidth = .8 + r() * 1.4;
          g.beginPath();
          var px = x + 8 + r() * (bw - 16), py = y + 8 + r() * (bh - 16);
          g.moveTo(px, py); g.lineTo(px + (r() - .5) * 46, py + (r() - .5) * 38); g.stroke();
        }
      }
    }
    for (var i = 0; i < 5200; i++) {
      var q = 40 + Math.floor(r() * 55);
      g.fillStyle = "rgba(" + q + "," + (q + 6) + "," + (q + 3) + "," + (.04 + r() * .13) + ")";
      g.fillRect(r() * s, r() * s, 1 + r() * 4, 1 + r() * 2);
    }
    for (var w = 0; w < 9; w++) {
      g.strokeStyle = "rgba(12,20,19,.10)"; g.lineWidth = 6 + r() * 16;
      g.beginPath(); g.arc(r() * s, r() * s, 18 + r() * 60, 0, Math.PI * 2); g.stroke();
    }
  }, { repeat: [3, 3] });

  var stoneBump = tex(256, function (g, s) {
    var r = rand(11);
    g.fillStyle = "#808080"; g.fillRect(0, 0, s, s);
    for (var i = 0; i < 4200; i++) {
      var v = 90 + Math.floor(r() * 90);
      g.fillStyle = "rgb(" + v + "," + v + "," + v + ")";
      g.fillRect(r() * s, r() * s, 1 + r() * 3, 1 + r() * 2);
    }
    g.strokeStyle = "#4a4a4a"; g.lineWidth = 3;
    for (var k = 0; k <= 4; k++) {
      g.beginPath(); g.moveTo(0, k * s / 4); g.lineTo(s, k * s / 4); g.stroke();
    }
  }, { repeat: [3, 3] });

  // 深色老榆木：木纹 / 节疤 / 漆皮剥落
  var woodTex = tex(256, function (g, s) {
    var r = rand(23);
    g.fillStyle = "#241c17"; g.fillRect(0, 0, s, s);
    for (var i = 0; i < 190; i++) {
      var y = r() * s, a = .03 + r() * .13;
      g.strokeStyle = "rgba(" + (92 + r() * 44 | 0) + "," + (68 + r() * 30 | 0) + ",50," + a + ")";
      g.lineWidth = .5 + r() * 2.4;
      g.beginPath(); g.moveTo(0, y);
      g.bezierCurveTo(s * .3, y + (r() - .5) * 11, s * .7, y + (r() - .5) * 11, s, y + (r() - .5) * 6);
      g.stroke();
    }
    for (var k = 0; k < 5; k++) {
      g.strokeStyle = "rgba(12,9,7,.5)"; g.lineWidth = 1.4;
      g.beginPath(); g.ellipse(r() * s, r() * s, 5 + r() * 12, 2 + r() * 4, r() * .4, 0, Math.PI * 2); g.stroke();
    }
    for (var j = 0; j < 900; j++) {
      g.fillStyle = "rgba(8,6,5," + (r() * .18) + ")";
      g.fillRect(r() * s, r() * s, 1 + r() * 8, 1);
    }
  });

  // 氧化青铜：绿锈斑 + 褐斑 + 泥金细线
  var bronzeTex = tex(256, function (g, s) {
    var r = rand(31);
    g.fillStyle = "#3d5c51"; g.fillRect(0, 0, s, s);
    for (var i = 0; i < 260; i++) {
      g.fillStyle = "rgba(" + (58 + r() * 62 | 0) + "," + (96 + r() * 72 | 0) + "," + (80 + r() * 50 | 0) + "," + (.06 + r() * .2) + ")";
      g.beginPath(); g.arc(r() * s, r() * s, 3 + r() * 26, 0, Math.PI * 2); g.fill();
    }
    for (var j = 0; j < 160; j++) {
      g.fillStyle = "rgba(30,26,20," + (.05 + r() * .16) + ")";
      g.beginPath(); g.arc(r() * s, r() * s, 2 + r() * 15, 0, Math.PI * 2); g.fill();
    }
    g.strokeStyle = "rgba(184,158,96,.16)"; g.lineWidth = 1;
    for (var k = 0; k < 40; k++) {
      g.beginPath(); var x = r() * s, y = r() * s;
      g.moveTo(x, y); g.lineTo(x + (r() - .5) * 70, y + (r() - .5) * 12); g.stroke();
    }
  });

  // 做旧白麻布 + 破边 alpha
  var hempTex = tex(256, function (g, s) {
    var r = rand(41);
    g.fillStyle = "#8e968c"; g.fillRect(0, 0, s, s);
    for (var i = 0; i < 1400; i++) {
      g.fillStyle = "rgba(" + (170 + r() * 40 | 0) + "," + (172 + r() * 38 | 0) + "," + (160 + r() * 36 | 0) + "," + (r() * .1) + ")";
      g.fillRect(r() * s, r() * s, 1, 1 + r() * 5);
    }
    g.strokeStyle = "rgba(30,36,32,.18)"; g.lineWidth = 1;
    for (var k = 0; k < s; k += 4) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, s); g.stroke(); }
    for (var m = 0; m < s; m += 6) { g.beginPath(); g.moveTo(0, m); g.lineTo(s, m); g.stroke(); }
    for (var n = 0; n < 24; n++) {
      g.fillStyle = "rgba(46,44,36," + (.04 + r() * .09) + ")";
      g.beginPath(); g.arc(r() * s, r() * s, 4 + r() * 18, 0, Math.PI * 2); g.fill();
    }
  });
  var hempAlpha = tex(256, function (g, s) {
    var r = rand(53);
    g.fillStyle = "#fff"; g.fillRect(0, 0, s, s);
    g.fillStyle = "#000"; g.beginPath(); g.moveTo(0, s);
    for (var x = 0; x <= s; x += 6) g.lineTo(x, s - 12 - r() * 26);
    g.lineTo(s, s); g.closePath(); g.fill();
    for (var i = 0; i < 38; i++) {
      g.fillStyle = "rgba(0,0,0," + (.35 + r() * .55) + ")";
      g.beginPath(); g.arc(r() * s, r() * s, 1 + r() * 4, 0, Math.PI * 2); g.fill();
    }
  }, { clamp: true });

  // 玄色织锦桌围：暗青底 + 泥金回纹（云雷纹方折）+ 团花 + 虫蛀做旧
  // 形制参考明清十王殿公案桌围；替代过亮的白麻桌幡
  var skirtTex = tex(512, function (g, s) {
    var r = rand(113);
    g.fillStyle = "#1d2b27"; g.fillRect(0, 0, s, s);
    g.strokeStyle = "rgba(120,146,132,.10)"; g.lineWidth = 1;
    for (var k = 0; k < s; k += 5) {
      g.beginPath(); g.moveTo(k, 0); g.lineTo(k, s); g.stroke();
      g.beginPath(); g.moveTo(0, k); g.lineTo(s, k); g.stroke();
    }
    g.strokeStyle = "rgba(168,142,92,.60)"; g.lineWidth = 3;
    g.beginPath(); g.moveTo(0, 14); g.lineTo(s, 14);
    g.moveTo(0, s - 16); g.lineTo(s, s - 16); g.stroke();
    for (var i = 0; i < 9; i++) {
      var x = i * s / 9 + 8, y = s * .30, w = s / 9 - 16, h = s * .34;
      g.strokeStyle = "rgba(160,138,90,.58)"; g.lineWidth = 2;
      g.strokeRect(x, y, w, h);
      g.strokeRect(x + 7, y + 7, Math.max(2, w - 14), Math.max(2, h - 14));
      g.beginPath(); g.moveTo(x + w / 2, y + 7); g.lineTo(x + w / 2, y + h - 7); g.stroke();
      var cx = (i + .5) * s / 9;
      g.strokeStyle = "rgba(176,150,94,.50)"; g.lineWidth = 1.5;
      g.beginPath(); g.arc(cx, s * .47, s * .030, 0, Math.PI * 2); g.stroke();
      g.fillStyle = "rgba(150,62,48,.34)";
      g.beginPath(); g.arc(cx, s * .47, s * .010, 0, Math.PI * 2); g.fill();
    }
    for (var n = 0; n < 260; n++) {
      g.fillStyle = r() < .55
        ? "rgba(4,8,7," + (.10 + r() * .45) + ")"
        : "rgba(164,148,110," + (.02 + r() * .10) + ")";
      g.beginPath();
      g.ellipse(r() * s, r() * s, 2 + r() * 13, 1 + r() * 5, r() * 3, 0, Math.PI * 2);
      g.fill();
    }
  });

  // 宣纸 / 黄纸
  var paperTex = tex(256, function (g, s) {
    var r = rand(59);
    g.fillStyle = "#c3bda2"; g.fillRect(0, 0, s, s);
    for (var i = 0; i < 2200; i++) {
      g.fillStyle = "rgba(90,86,68," + (r() * .08) + ")";
      g.fillRect(r() * s, r() * s, 1 + r() * 6, 1);
    }
    g.strokeStyle = "rgba(120,112,86,.18)"; g.lineWidth = 1;
    for (var k = 0; k < s; k += 9) { g.beginPath(); g.moveTo(0, k); g.lineTo(s, k); g.stroke(); }
  });

  // 案上模糊朱笔字迹（不可辨，符合负面词「无清晰文字」）
  var inkTex = tex(256, function (g, s) {
    var r = rand(67);
    g.filter = "blur(3px)";
    g.strokeStyle = "rgba(150,58,42,.55)"; g.lineWidth = 3 + r() * 2;
    for (var i = 0; i < 20; i++) {
      var x = 20 + r() * (s - 40), y = 24 + r() * (s - 48);
      g.beginPath(); g.moveTo(x, y);
      g.bezierCurveTo(x + 8, y + 10, x - 6, y + 18, x + (r() - .5) * 24, y + 24 + r() * 18);
      g.stroke();
    }
    g.filter = "none";
  }, { clamp: true });

  // 一圈烧了一半的黄纸纸钱（俯视地面，透明底）
  var ashTex = tex(512, function (g, s) {
    var r = rand(71), cx = s / 2, cy = s / 2, rad = s * .34;
    g.clearRect(0, 0, s, s);
    g.strokeStyle = "rgba(150,150,132,.10)"; g.lineWidth = 22;
    g.beginPath(); g.arc(cx, cy, rad, 0, Math.PI * 2); g.stroke();
    for (var i = 0; i < 22; i++) {
      var a = i / 22 * Math.PI * 2 + (r() - .5) * .12;
      var px = cx + Math.cos(a) * (rad + (r() - .5) * 26);
      var py = cy + Math.sin(a) * (rad + (r() - .5) * 26);
      g.save(); g.translate(px, py); g.rotate(a + Math.PI / 2 + (r() - .5) * .6);
      g.fillStyle = "rgba(176,158,104," + (.32 + r() * .34) + ")";
      g.fillRect(-13, -9, 26, 18);
      g.strokeStyle = "rgba(38,32,24,.72)"; g.lineWidth = 2;
      g.beginPath(); g.moveTo(-13, -9); g.lineTo(-13 + r() * 12, -9 + r() * 5);
      g.lineTo(-9 + r() * 10, 9); g.stroke();
      g.fillStyle = "rgba(26,22,18,.55)";
      g.fillRect(-13 + r() * 6, 5, 8 + r() * 10, 4);
      g.restore();
    }
    for (var j = 0; j < 260; j++) {
      var aa = r() * Math.PI * 2, rr = rad * (.6 + r() * .8);
      g.fillStyle = "rgba(" + (110 + r() * 70 | 0) + "," + (108 + r() * 66 | 0) + "," + (96 + r() * 60 | 0) + "," + (.06 + r() * .22) + ")";
      g.fillRect(cx + Math.cos(aa) * rr, cy + Math.sin(aa) * rr, 1 + r() * 3, 1 + r() * 2);
    }
  }, { clamp: true });

  // 镜框云雷纹（环形，透明底）
  var cloudTex = tex(512, function (g, s) {
    var cx = s / 2, cy = s / 2, r = rand(83);
    g.clearRect(0, 0, s, s);
    g.strokeStyle = "rgba(178,158,102,.62)"; g.lineWidth = 3;
    g.beginPath(); g.arc(cx, cy, s * .475, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = "rgba(126,164,146,.68)"; g.lineWidth = 2;
    g.beginPath(); g.arc(cx, cy, s * .385, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.arc(cx, cy, s * .335, 0, Math.PI * 2); g.stroke();
    for (var i = 0; i < 40; i++) {
      var a = i / 40 * Math.PI * 2, rr = s * .43;
      g.save();
      g.translate(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
      g.rotate(a + Math.PI / 2);
      g.strokeStyle = "rgba(158,190,170," + (.35 + r() * .4) + ")";
      g.lineWidth = 2.2;
      g.beginPath();
      g.moveTo(-13, -8); g.lineTo(13, -8); g.lineTo(13, 8);
      g.lineTo(-4, 8); g.lineTo(-4, 0); g.lineTo(5, 0);
      g.stroke();
      g.restore();
    }
  }, { clamp: true });

  // 泥金剥落榜题：七字严重模糊、不可辨（《玉历宝钞》「孽镜台前无好人」）
  var plaqueTex = tex(512, function (g, s) {
    var r = rand(77);
    g.fillStyle = "#1b1610"; g.fillRect(0, 0, s, s);
    g.strokeStyle = "rgba(178,150,92,.58)"; g.lineWidth = 7;
    g.strokeRect(16, 16, s - 32, s - 32);
    g.strokeStyle = "rgba(178,150,92,.22)"; g.lineWidth = 2;
    g.strokeRect(28, 28, s - 56, s - 56);
    g.filter = "blur(7px)";
    g.fillStyle = "rgba(190,162,102,.52)";
    g.font = '600 60px "Songti SC","STSong","SimSun",serif';
    g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText("孽鏡臺前無好人", s / 2, s / 2 + 3);
    g.filter = "none";
    for (var i = 0; i < 260; i++) {
      g.fillStyle = "rgba(22,18,13," + (.18 + r() * .7) + ")";
      g.fillRect(r() * s, r() * s, 3 + r() * 26, 2 + r() * 11);
    }
    g.fillStyle = "rgba(166,62,44,.62)";
    g.fillRect(s - 96, s - 96, 42, 42);
  }, { clamp: true });

  // 菱花格窗：暗木格 + 背后灰白雾光
  var windowTex = tex(256, function (g, s) {
    var r = rand(89);
    g.fillStyle = "#0b1413"; g.fillRect(0, 0, s, s);
    var grd = g.createRadialGradient(s / 2, s / 2, 10, s / 2, s / 2, s * .72);
    grd.addColorStop(0, "rgba(138,164,152,.30)");
    grd.addColorStop(1, "rgba(12,20,19,0)");
    g.fillStyle = grd; g.fillRect(0, 0, s, s);
    g.strokeStyle = "rgba(64,80,72,.92)"; g.lineWidth = 4;
    for (var k = -s; k < s * 2; k += 34) {
      g.beginPath(); g.moveTo(k, 0); g.lineTo(k + s, s); g.stroke();
      g.beginPath(); g.moveTo(k, s); g.lineTo(k + s, 0); g.stroke();
    }
    g.strokeStyle = "rgba(88,104,94,.55)"; g.lineWidth = 2;
    for (var i = 0; i < 9; i++) {
      g.beginPath(); g.arc(r() * s, r() * s, 5 + r() * 8, 0, Math.PI * 2); g.stroke();
    }
    g.strokeStyle = "rgba(48,60,54,.95)"; g.lineWidth = 9;
    g.strokeRect(4, 4, s - 8, s - 8);
  }, { clamp: true });

  // 青绿旋子彩画（梁枋）v6：箍头回纹 + 一整二破旋花 + 枋心宝相花 + 双泥金线
  // 横向压成 0.26 m 细长条后仍要读得出节奏，故单元密、线条硬、对比足
  var beamTex = tex(1024, function (g, s) {
    var r = rand(97), H = s / 4;              // 贴图为 4:1，取中间 1/4 高度画纹
    g.fillStyle = "#12201c"; g.fillRect(0, 0, s, s);
    // 上下双泥金线 + 青绿岔口线
    g.strokeStyle = "rgba(176,150,94,.52)"; g.lineWidth = 5;
    g.beginPath(); g.moveTo(0, 12); g.lineTo(s, 12);
    g.moveTo(0, s - 12); g.lineTo(s, s - 12); g.stroke();
    g.strokeStyle = "rgba(96,148,128,.42)"; g.lineWidth = 3;
    g.beginPath(); g.moveTo(0, 30); g.lineTo(s, 30);
    g.moveTo(0, s - 30); g.lineTo(s, s - 30); g.stroke();
    // 箍头：两端万字回纹带
    [0, s - 84].forEach(function (x0) {
      g.strokeStyle = "rgba(178,152,98,.55)"; g.lineWidth = 4;
      g.strokeRect(x0 + 4, 20, 76, s - 40);
      for (var x = x0 + 10; x < x0 + 76; x += 16) {
        g.beginPath(); g.moveTo(x, 26); g.lineTo(x + 10, 26);
        g.lineTo(x + 10, s - 30); g.stroke();
      }
    });
    // 找头：16 组一整二破旋花（外圈旋瓣 + 内圈栀花心）
    for (var i = 0; i < 16; i++) {
      var cx = 92 + (i + .5) * (s - 184) / 16, cy = s / 2, R = s / 34;
      g.strokeStyle = "rgba(112,168,146,.62)"; g.lineWidth = 3.2;
      g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.stroke();
      g.strokeStyle = "rgba(182,156,100,.58)"; g.lineWidth = 2.4;
      for (var p = 0; p < 8; p++) {
        var a = p / 8 * Math.PI * 2;
        g.beginPath();
        g.moveTo(cx + Math.cos(a) * 5, cy + Math.sin(a) * 5);
        g.quadraticCurveTo(cx + Math.cos(a + .42) * R * .92,
                           cy + Math.sin(a + .42) * R * .92,
                           cx + Math.cos(a) * R, cy + Math.sin(a) * R);
        g.stroke();
      }
      g.strokeStyle = "rgba(150,196,174,.48)"; g.lineWidth = 2;
      g.beginPath(); g.arc(cx, cy, R * .28, 0, Math.PI * 2); g.stroke();
      g.fillStyle = "rgba(176,150,94,.40)";
      g.beginPath(); g.arc(cx, cy, 3, 0, Math.PI * 2); g.fill();
      // 旋花之间的菱角地
      g.strokeStyle = "rgba(88,132,114,.28)"; g.lineWidth = 2;
      g.beginPath(); g.moveTo(cx + R + 9, 34); g.lineTo(cx + R + 9, s - 34); g.stroke();
    }
    // 枋心：正中一朵宝相花（堆金沥粉感）
    g.strokeStyle = "rgba(186,160,104,.42)"; g.lineWidth = 3;
    g.beginPath(); g.ellipse(s / 2, s / 2, s / 12, s / 8, 0, 0, Math.PI * 2); g.stroke();
    for (var q = 0; q < 12; q++) {
      var qa = q / 12 * Math.PI * 2;
      g.beginPath();
      g.moveTo(s / 2 + Math.cos(qa) * 8, s / 2 + Math.sin(qa) * 6);
      g.quadraticCurveTo(s / 2 + Math.cos(qa + .3) * s / 16,
                         s / 2 + Math.sin(qa + .3) * s / 11,
                         s / 2 + Math.cos(qa) * s / 13, s / 2 + Math.sin(qa) * s / 9);
      g.stroke();
    }
    // 做旧：漆皮剥落与积尘
    for (var n = 0; n < 240; n++) {
      g.fillStyle = r() < .6 ? "rgba(6,12,10," + (.10 + r() * .45) + ")"
                             : "rgba(168,150,106," + (.02 + r() * .10) + ")";
      g.fillRect(r() * s, r() * s, 2 + r() * 22, 1 + r() * 7);
    }
  }, { clamp: true });

  // 水墨山水榜题挂轴（残、模糊、无清晰文字）
  var scrollTex = tex(256, function (g, s) {
    var r = rand(101);
    g.fillStyle = "#a9a691"; g.fillRect(0, 0, s, s);
    g.filter = "blur(2.5px)";
    for (var i = 0; i < 7; i++) {
      g.fillStyle = "rgba(52,62,58," + (.10 + r() * .18) + ")";
      g.beginPath();
      var x = r() * s, y = s * (.42 + r() * .34);
      g.moveTo(x - 50, y + 40); g.lineTo(x, y - 20 - r() * 40);
      g.lineTo(x + 55, y + 40); g.closePath(); g.fill();
    }
    g.filter = "none";
    g.strokeStyle = "rgba(60,66,58,.45)"; g.lineWidth = 2;
    g.strokeRect(14, 14, s - 28, s - 28);
    g.fillStyle = "rgba(150,62,46,.28)"; g.fillRect(s - 52, 26, 22, 22);
    for (var j = 0; j < 90; j++) {
      g.fillStyle = "rgba(70,66,52," + (r() * .12) + ")";
      g.fillRect(r() * s, r() * s, 2 + r() * 12, 1 + r() * 4);
    }
  }, { clamp: true });

  // 莲瓣（柱础 / 须弥座束腰）
  var lotusTex = tex(256, function (g, s) {
    g.fillStyle = "#4a5650"; g.fillRect(0, 0, s, s);
    for (var i = 0; i < 12; i++) {
      var x = (i + .5) * s / 12;
      g.strokeStyle = "rgba(150,168,154,.42)"; g.lineWidth = 2;
      g.beginPath(); g.moveTo(x - s / 24, s); g.quadraticCurveTo(x, s * .32, x + s / 24, s); g.stroke();
      g.fillStyle = "rgba(120,142,128,.12)";
      g.beginPath(); g.moveTo(x - s / 24, s); g.quadraticCurveTo(x, s * .32, x + s / 24, s); g.fill();
    }
    g.strokeStyle = "rgba(176,150,94,.18)"; g.lineWidth = 3;
    g.beginPath(); g.moveTo(0, 8); g.lineTo(s, 8); g.stroke();
  });

  // 案牙板卷草雕花
  var carveTex = tex(512, function (g, s) {
    var r = rand(103);
    g.fillStyle = "#2a211a"; g.fillRect(0, 0, s, s);
    g.strokeStyle = "rgba(146,124,88,.42)"; g.lineWidth = 2;
    for (var i = 0; i < 9; i++) {
      var cx = (i + .5) * s / 9;
      g.beginPath();
      g.moveTo(cx - s / 20, s * .78);
      g.bezierCurveTo(cx - s / 14, s * .22, cx + s / 14, s * .22, cx + s / 20, s * .78);
      g.stroke();
      g.beginPath(); g.arc(cx, s * .42, s / 42, 0, Math.PI * 2); g.stroke();
    }
    g.strokeStyle = "rgba(10,8,6,.5)"; g.lineWidth = 3;
    for (var k = 0; k < 40; k++) {
      g.beginPath(); var y = r() * s; g.moveTo(0, y); g.lineTo(s, y + (r() - .5) * 5); g.stroke();
    }
  });

  var glowTex = tex(128, function (g, s) {
    var grd = g.createRadialGradient(s / 2, s / 2, 2, s / 2, s / 2, s / 2);
    grd.addColorStop(0, "rgba(214,246,234,.92)");
    grd.addColorStop(.28, "rgba(140,220,200,.36)");
    grd.addColorStop(1, "rgba(90,180,160,0)");
    g.fillStyle = grd; g.fillRect(0, 0, s, s);
  }, { clamp: true });

  // 镜中才有的一双绣花鞋（俯视，朱红点缀 < 5%）
  var shoeTex = tex(128, function (g, s) {
    g.clearRect(0, 0, s, s);
    g.fillStyle = "rgba(150,62,48,.88)";
    g.beginPath(); g.ellipse(s / 2, s * .56, s * .22, s * .34, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "rgba(190,160,98,.75)"; g.lineWidth = 2;
    g.beginPath(); g.ellipse(s / 2, s * .56, s * .22, s * .34, 0, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = "rgba(226,196,140,.7)"; g.lineWidth = 1.4;
    for (var i = 0; i < 5; i++) {
      g.beginPath(); g.moveTo(s * .38 + i * 7, s * .44); g.lineTo(s * .38 + i * 7, s * .70); g.stroke();
    }
    g.fillStyle = "rgba(226,206,158,.8)";
    g.beginPath(); g.arc(s / 2, s * .28, s * .07, 0, Math.PI * 2); g.fill();
  }, { clamp: true });

  var smokeTex = tex(128, function (g, s) {
    var r = rand(107);
    g.clearRect(0, 0, s, s);
    for (var i = 0; i < 9; i++) {
      g.strokeStyle = "rgba(178,198,186," + (.05 + r() * .09) + ")";
      g.lineWidth = 6 + r() * 16;
      g.beginPath(); var x = s * .2 + r() * s * .6;
      g.moveTo(x, s);
      g.bezierCurveTo(x + (r() - .5) * 40, s * .7, x + (r() - .5) * 46, s * .35, x + (r() - .5) * 30, 0);
      g.stroke();
    }
  }, { clamp: true });

  // 单块 1 m 青石板（v3：地面改成真实错缝石块，不再是贴图里画假缝）
  var tileTex = tex(256, function (g, s) {
    var r = rand(127);
    g.fillStyle = "#39423e"; g.fillRect(0, 0, s, s);
    var vg = g.createRadialGradient(s * .5, s * .45, s * .12, s * .5, s * .5, s * .74);
    vg.addColorStop(0, "rgba(140,162,150,.14)");
    vg.addColorStop(1, "rgba(8,14,13,.34)");
    g.fillStyle = vg; g.fillRect(0, 0, s, s);
    for (var i = 0; i < 16; i++) {
      g.strokeStyle = "rgba(12,20,19," + (.10 + r() * .22) + ")";
      g.lineWidth = .7 + r() * 1.5;
      var x = 16 + r() * (s - 32), y = 16 + r() * (s - 32);
      g.beginPath(); g.moveTo(x, y);
      g.lineTo(x + (r() - .5) * 70, y + (r() - .5) * 55); g.stroke();
    }
    for (var j = 0; j < 1700; j++) {
      var q = 38 + Math.floor(r() * 60);
      g.fillStyle = "rgba(" + q + "," + (q + 6) + "," + (q + 3) + "," + (.04 + r() * .14) + ")";
      g.fillRect(r() * s, r() * s, 1 + r() * 4, 1 + r() * 2);
    }
    g.strokeStyle = "rgba(8,14,13,.58)"; g.lineWidth = 6;
    g.strokeRect(3, 3, s - 6, s - 6);
    g.strokeStyle = "rgba(158,178,164,.10)"; g.lineWidth = 1;
    g.strokeRect(9, 9, s - 18, s - 18);
  }, { clamp: true });

  // 门洞透进来的一线冷雾光（竖直渐变 + 两侧羽化）
  var shaftTex = tex(256, function (g, s) {
    g.clearRect(0, 0, s, s);
    var v = g.createLinearGradient(0, 0, 0, s);
    v.addColorStop(0, "rgba(160,214,196,.34)");
    v.addColorStop(.55, "rgba(140,198,180,.13)");
    v.addColorStop(1, "rgba(120,180,164,0)");
    g.fillStyle = v; g.fillRect(0, 0, s, s);
    var h = g.createLinearGradient(0, 0, s, 0);
    h.addColorStop(0, "rgba(0,0,0,1)");
    h.addColorStop(.5, "rgba(0,0,0,0)");
    h.addColorStop(1, "rgba(0,0,0,1)");
    g.globalCompositeOperation = "destination-out";
    g.fillStyle = h; g.fillRect(0, 0, s, s);
    g.globalCompositeOperation = "source-over";
  }, { clamp: true });

  // 十王殿仪仗虎头牌：简化兽面 + 泥金榜题（刻意模糊，字不可辨）
  function makeSign(word) {
    return tex(256, function (g, s) {
      var r = rand(139);
      g.fillStyle = "#191611"; g.fillRect(0, 0, s, s);
      g.strokeStyle = "rgba(174,148,94,.52)"; g.lineWidth = 6;
      g.strokeRect(13, 13, s - 26, s - 26);
      g.strokeStyle = "rgba(178,152,98,.40)"; g.lineWidth = 4;
      g.beginPath(); g.arc(s * .35, s * .27, s * .065, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.arc(s * .65, s * .27, s * .065, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.moveTo(s * .5, s * .19); g.lineTo(s * .5, s * .36); g.stroke();
      g.filter = "blur(4px)";
      g.fillStyle = "rgba(190,164,108,.60)";
      g.font = '600 66px "Songti SC","STSong","SimSun",serif';
      g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText(word, s / 2, s * .64);
      g.filter = "none";
      for (var i = 0; i < 220; i++) {
        g.fillStyle = "rgba(10,8,6," + (.10 + r() * .55) + ")";
        g.fillRect(r() * s, r() * s, 2 + r() * 18, 1 + r() * 7);
      }
    }, { clamp: true });
  }
  var signTexA = makeSign("肅靜"), signTexB = makeSign("迴避");

  // —— 材质（低饱和、高对比；单一青绿光源 + 朱红点缀 < 5%）——
  var MAT = {
    stone: new T.MeshStandardMaterial({ map: stoneTex, bumpMap: stoneBump, bumpScale: .016,
                                        color: 0x8b958e, roughness: .92, metalness: .02 }),
    tile: new T.MeshStandardMaterial({ map: tileTex, bumpMap: stoneBump, bumpScale: .012,
                                       color: 0x606b64, roughness: .93, metalness: .02,
                                       envMapIntensity: .45 }),
    wall: new T.MeshStandardMaterial({ color: 0x0d1313, roughness: .97, envMapIntensity: .10 }),
    wood: new T.MeshStandardMaterial({ map: woodTex, color: 0x9a8a76, roughness: .68 }),
    darkWood: new T.MeshStandardMaterial({ map: woodTex, color: 0x57483a, roughness: .72 }),
    pillar: new T.MeshStandardMaterial({ map: woodTex, color: 0x655343, roughness: .7 }),
    bronze: new T.MeshStandardMaterial({ map: bronzeTex, color: 0x759a88, roughness: .55, metalness: .55 }),
    bronzeDark: new T.MeshStandardMaterial({ map: bronzeTex, color: 0x3d5e53, roughness: .66, metalness: .48 }),
    hemp: new T.MeshStandardMaterial({ map: hempTex, alphaMap: hempAlpha, transparent: true,
                                       alphaTest: .08, color: 0x8b948b, roughness: .95, side: T.DoubleSide }),
    skirt: new T.MeshStandardMaterial({ map: skirtTex, color: 0xb9c3b7, roughness: .94,
                                        envMapIntensity: .3, side: T.DoubleSide }),
    paper: new T.MeshStandardMaterial({ map: paperTex, color: 0xa8a48e, roughness: .95, side: T.DoubleSide }),
    ink: new T.MeshBasicMaterial({ map: inkTex, transparent: true, depthWrite: false, opacity: .72 }),
    plaque: new T.MeshBasicMaterial({ map: plaqueTex }),
    cinnabar: new T.MeshStandardMaterial({ color: 0xa8462f, roughness: .6,
                                           emissive: 0x3a0e07, emissiveIntensity: .5 }),
    black: new T.MeshStandardMaterial({ color: 0x0a0e0d, roughness: 1 }),
    flame: new T.MeshBasicMaterial({ color: 0xa9f0e2, transparent: true, opacity: .85 }),
    gold: new T.MeshStandardMaterial({ color: 0xb9a271, roughness: .45, metalness: .5,
                                       emissive: 0x2a2110, emissiveIntensity: .3 }),
    goldLine: new T.MeshBasicMaterial({ color: 0x9a8a5c, transparent: true, opacity: .5, side: T.DoubleSide }),
    window: new T.MeshBasicMaterial({ map: windowTex, color: 0x4a6157 }),
    beam: new T.MeshStandardMaterial({ map: beamTex, color: 0x88a698, roughness: .86,
                                       emissive: 0x0a1713, emissiveIntensity: .22 }),
    scroll: new T.MeshBasicMaterial({ map: scrollTex, color: 0x6e7a70 }),
    ash: new T.MeshBasicMaterial({ map: ashTex, transparent: true, depthWrite: false, opacity: .92 }),
    cloud: new T.MeshBasicMaterial({ map: cloudTex, transparent: true, depthWrite: false, side: T.DoubleSide }),
    lotus: new T.MeshStandardMaterial({ map: lotusTex, color: 0x7e8c83, roughness: .9 }),
    carve: new T.MeshStandardMaterial({ map: carveTex, color: 0x8f7a60, roughness: .76 }),
    ashPoint: new T.PointsMaterial({ color: 0xb4bfb3, size: .022, transparent: true,
                                     opacity: .4, depthWrite: false, sizeAttenuation: true }),
    glow: new T.SpriteMaterial({ map: glowTex, color: 0x9fe8d8, transparent: true,
                                 blending: T.AdditiveBlending, depthWrite: false }),
    glowFloor: new T.MeshBasicMaterial({ map: glowTex, transparent: true, opacity: .3,
                                         blending: T.AdditiveBlending, depthWrite: false }),
    shoe: new T.MeshBasicMaterial({ map: shoeTex, transparent: true, side: T.DoubleSide, depthWrite: false }),
    smoke: new T.MeshBasicMaterial({ map: smokeTex, transparent: true, opacity: .3,
                                     depthWrite: false, side: T.DoubleSide }),
    shaft: new T.MeshBasicMaterial({ map: shaftTex, transparent: true, opacity: .62,
                                     blending: T.AdditiveBlending, depthWrite: false,
                                     side: T.DoubleSide }),
    signA: new T.MeshBasicMaterial({ map: signTexA }),
    signB: new T.MeshBasicMaterial({ map: signTexB })
  };

  function box(parent, w, h, d, x, y, z, mat, opts) {
    var m = new T.Mesh(new T.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = !!(opts && opts.shadow !== false);
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  function cyl(parent, rt, rb, h, seg, x, y, z, mat) {
    var m = new T.Mesh(new T.CylinderGeometry(rt, rb, h, seg), mat);
    m.position.set(x, y, z);
    m.castShadow = true; m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  function plane(parent, w, h, x, y, z, mat, ry) {
    var m = new T.Mesh(new T.PlaneGeometry(w, h), mat);
    m.position.set(x, y, z);
    if (ry) m.rotation.y = ry;
    parent.add(m);
    return m;
  }

  // 批量小构件：一次 draw call 画 n 个实例（莲瓣 / 连珠 / 斗 / 铁链 / 石板）
  // list 每项 { x,y,z, rx,ry,rz, s 或 sx,sy,sz }
  function instances(parent, geo, mat, list) {
    var im = new T.InstancedMesh(geo, mat, list.length);
    var m = new T.Matrix4(), q = new T.Quaternion(), p = new T.Vector3(),
        sc = new T.Vector3(), e = new T.Euler();
    for (var i = 0; i < list.length; i++) {
      var o = list[i];
      p.set(o.x, o.y, o.z);
      e.set(o.rx || 0, o.ry || 0, o.rz || 0);
      q.setFromEuler(e);
      var s = (o.s === undefined) ? 1 : o.s;
      sc.set(o.sx === undefined ? s : o.sx,
             o.sy === undefined ? s : o.sy,
             o.sz === undefined ? s : o.sz);
      m.compose(p, q, sc);
      im.setMatrixAt(i, m);
    }
    im.instanceMatrix.needsUpdate = true;
    im.frustumCulled = false;   // 实例散布全殿，别被单个 geometry 的包围球整批剔掉
    im.castShadow = false; im.receiveShadow = true;
    parent.add(im);
    return im;
  }

  // —— 建筑骨架：12 × 12 × 4 m，严格居中对称 ——
  function buildArchitecture(root) {
    var arch = new T.Group(); root.add(arch);
    var D = new T.Group(); arch.add(D);           // 细化层，单独成组便于排查

    // 青石地：144 块 1 m 独立石板，奇数行错缝，逐块微高低差（走近有真实缝与磨损）
    // InstancedMesh 只占 1 个 draw call，替换原来 9 块 4×4 大板贴图里画的假缝
    var tileList = [], tr = rand(211);
    for (var row = 0; row < 12; row++)
      for (var col = 0; col < 12; col++) {
        tileList.push({
          x: -5.5 + col + (row % 2 ? .5 : 0),
          y: -.09 + (tr() - .5) * .018,
          z: -5.5 + row,
          ry: (tr() - .5) * .018,
          sx: .965 + tr() * .030, sz: .965 + tr() * .030
        });
      }
    instances(arch, new T.BoxGeometry(.985, .18, .985), MAT.tile, tileList);

    // 四壁（北墙 -Z 留 1.6 m 门洞，门外漆黑虚空）
    box(arch, 12, 4, .22, 0, 2, 6, MAT.wall);
    box(arch, .22, 4, 12, 6, 2, 0, MAT.wall);
    box(arch, .22, 4, 12, -6, 2, 0, MAT.wall);
    box(arch, 5.2, 4, .22, -3.4, 2, -6, MAT.wall);
    box(arch, 5.2, 4, .22, 3.4, 2, -6, MAT.wall);
    box(arch, 1.6, 1.3, .22, 0, 3.35, -6, MAT.wall);
    box(arch, 12, .2, 12, 0, 4.1, 0, MAT.black, { shadow: false });

    // 公案前地面：一圈烧了一半的黄纸纸钱 + 悬空灰烬（队友提示词核心「不对劲」）
    var ash = new T.Mesh(new T.PlaneGeometry(3.4, 3.4), MAT.ash);
    ash.rotation.x = -Math.PI / 2; ash.position.set(0, .012, 2.05);
    ash.renderOrder = 1; D.add(ash);
    var pts = [], rr = rand(109);
    for (var i = 0; i < 78; i++) {
      var a = rr() * Math.PI * 2, rad = .45 + rr() * 2.5;
      pts.push(Math.cos(a) * rad, .10 + rr() * 1.25, 2.05 + Math.sin(a) * rad * .62);
    }
    var pg = new T.BufferGeometry();
    pg.setAttribute("position", new T.Float32BufferAttribute(pts, 3));
    D.add(new T.Points(pg, MAT.ashPoint));

    // 门洞：门槛、门楣、两侧白麻帷幔（无风却微微朝镜倾）
    box(D, 1.72, .10, .30, 0, .05, -5.86, MAT.stone, { shadow: false });
    box(D, 2.10, .16, .26, 0, 2.74, -5.86, MAT.darkWood, { shadow: false });
    [-1, 1].forEach(function (s) {
      var v = new T.Mesh(new T.PlaneGeometry(.70, 2.45), MAT.hemp);
      v.position.set(s * .74, 1.42, -5.70);
      v.rotation.y = s * .20;
      D.add(v);
    });

    // 柱：青石础 + 莲瓣 + 收分柱身 + 青铜束箍 + 简化斗拱
    [[-5.25, -4.7], [5.25, -4.7], [-5.25, 4.7], [5.25, 4.7]].forEach(function (p) {
      box(D, .66, .14, .66, p[0], .07, p[1], MAT.stone);
      cyl(D, .25, .29, .20, 8, p[0], .24, p[1], MAT.lotus);
      cyl(D, .19, .235, 3.72, 8, p[0], 2.20, p[1], MAT.pillar);
      cyl(D, .238, .238, .06, 8, p[0], .58, p[1], MAT.bronzeDark);
      cyl(D, .238, .238, .06, 8, p[0], 3.56, p[1], MAT.bronzeDark);
      box(D, .62, .12, .62, p[0], 4.00, p[1], MAT.darkWood);
      box(D, .88, .09, .28, p[0], 4.08, p[1], MAT.darkWood);
      box(D, .28, .09, .88, p[0], 4.08, p[1], MAT.darkWood);
    });

    // 梁架 + 青绿旋子彩画（梁柱向上隐入黑暗）
    box(arch, 11.4, .30, .34, 0, 3.90, -4.7, MAT.darkWood);
    box(arch, 11.4, .30, .34, 0, 3.90, 4.7, MAT.darkWood);
    box(arch, .34, .30, 9.4, -5.25, 3.90, 0, MAT.darkWood);
    box(arch, .34, .30, 9.4, 5.25, 3.90, 0, MAT.darkWood);
    plane(D, 11.2, .26, 0, 3.90, -4.51, MAT.beam, 0);
    plane(D, 11.2, .26, 0, 3.90, 4.51, MAT.beam, Math.PI);
    plane(D, 9.2, .26, -5.07, 3.90, 0, MAT.beam, Math.PI / 2);
    plane(D, 9.2, .26, 5.07, 3.90, 0, MAT.beam, -Math.PI / 2);

    // 侧墙隔扇：菱花格窗贴图取代粗竖条，窗后是灰白浓雾
    for (var side = -1; side <= 1; side += 2) {
      for (var wi = -1; wi <= 1; wi++) {
        var x = side * 5.86, z = wi * 3.4;
        box(D, .06, 2.72, 1.46, x, 2.0, z, MAT.darkWood, { shadow: false });
        plane(D, 1.36, 2.56, x - side * .045, 2.0, z, MAT.window,
              side > 0 ? -Math.PI / 2 : Math.PI / 2);
        box(D, .09, 2.72, .09, x - side * .05, 2.0, z - .70, MAT.bronzeDark, { shadow: false });
        box(D, .09, 2.72, .09, x - side * .05, 2.0, z + .70, MAT.bronzeDark, { shadow: false });
      }
    }

    // 北墙两侧：榜题式水墨挂轴（陆信忠《十王图》屏风／榜题，字不可辨）
    [-1, 1].forEach(function (s) {
      box(D, 1.28, 2.26, .05, s * 3.35, 2.05, -5.84, MAT.darkWood, { shadow: false });
      plane(D, 1.14, 2.08, s * 3.35, 2.05, -5.805, MAT.scroll, 0);
      box(D, 1.36, .06, .09, s * 3.35, 3.20, -5.80, MAT.bronzeDark, { shadow: false });
    });

    // 殿额：镜台正上方悬匾（泥金剥落七字榜题，字不可辨）+ 双垂链吊于梁底
    // 原挂北墙会被镜框完全遮住；改悬龛前，构图重心落在「匾—镜—案」一条中轴上
    var PZ = -1.34;
    box(D, 2.30, .60, .09, 0, 3.40, PZ, MAT.darkWood, { shadow: false });
    plane(D, 2.10, .46, 0, 3.40, PZ + .052, MAT.plaque, 0);
    box(D, 2.34, .030, .12, 0, 3.72, PZ, MAT.bronzeDark, { shadow: false });
    box(D, 2.34, .030, .12, 0, 3.08, PZ, MAT.bronzeDark, { shadow: false });
    [-1.06, 1.06].forEach(function (dx) {
      [-1, 1].forEach(function (dy) {
        var stud = new T.Mesh(new T.SphereGeometry(.026, 8, 6), MAT.goldLine);
        stud.position.set(dx, 3.40 + dy * .23, PZ + .06);
        D.add(stud);
      });
    });
    [-.86, .86].forEach(function (dx) {
      cyl(D, .012, .012, .42, 5, dx, 3.91, PZ, MAT.bronzeDark);
    });
    // 后墙两侧楹联：远景层次（镜框之外仍可辨）
    [-1, 1].forEach(function (s) {
      plane(D, .30, 1.70, s * 2.18, 2.34, -4.30, MAT.scroll, 0);
      box(D, .36, .05, .08, s * 2.18, 3.22, -4.27, MAT.bronzeDark, { shadow: false });
    });

    // 中央须弥座（承镜）：《玉历宝钞》「台高一丈」，莲瓣束腰 + 两级踏步
    box(D, 2.10, .14, 1.40, 0, .07, -1.2, MAT.stone);
    box(D, 1.94, .09, 1.28, 0, .185, -1.2, MAT.lotus);
    box(D, 1.78, .14, 1.14, 0, .31, -1.2, MAT.darkWood);
    box(D, 2.00, .09, 1.30, 0, .405, -1.2, MAT.stone);
    box(D, 2.14, .035, 1.44, 0, .155, -1.2, MAT.bronzeDark, { shadow: false });
    box(D, 1.50, .09, .34, 0, .045, -.32, MAT.stone, { shadow: false });
    box(D, 1.50, .09, .34, 0, .135, -.60, MAT.stone, { shadow: false });

    // 镜框云雷纹（队友提示词「镜框铸云雷纹」）+ 内圈泥金细弦
    var ring = new T.Mesh(new T.RingGeometry(.945, 1.10, 64), MAT.cloud);
    ring.position.set(MIRROR.x, MIRROR.y, MIRROR.z + .02);
    ring.renderOrder = 6; D.add(ring);
    var inner = new T.Mesh(new T.RingGeometry(.922, .944, 64), MAT.goldLine);
    inner.position.set(MIRROR.x, MIRROR.y, MIRROR.z + .021);
    inner.renderOrder = 6; D.add(inner);
    // 镜缘连珠纹 48 颗 + 八卦乳钉 8 枚（唐八卦镜 / 宝相花镜形制），各 1 draw call
    var pearls = [], studs = [];
    for (var bi = 0; bi < 48; bi++) {
      var pa = bi / 48 * Math.PI * 2;
      pearls.push({ x: MIRROR.x + Math.cos(pa) * 1.076,
                    y: MIRROR.y + Math.sin(pa) * 1.076, z: MIRROR.z + .030 });
    }
    for (var bj = 0; bj < 8; bj++) {
      var ba = bj / 8 * Math.PI * 2;
      studs.push({ x: MIRROR.x + Math.cos(ba) * 1.045,
                   y: MIRROR.y + Math.sin(ba) * 1.045, z: MIRROR.z + .036 });
    }
    instances(D, new T.SphereGeometry(.014, 6, 5), MAT.goldLine, pearls);
    instances(D, new T.SphereGeometry(.026, 8, 6), MAT.gold, studs);

    // 镜前翘头 long 案 2.6 × 0.9 × 0.85 m
    var desk = new T.Group(); arch.add(desk);
    box(desk, 2.6, .12, .9, 0, .79, .95, MAT.darkWood);
    [-1, 1].forEach(function (s) {
      box(desk, .10, .17, .90, s * 1.30, .88, .95, MAT.darkWood);
    });
    [-1.15, 1.15].forEach(function (dx) {
      [-.32, .32].forEach(function (dz) {
        box(desk, .13, .73, .13, dx, .37, .95 + dz, MAT.darkWood);
      });
    });
    box(desk, 2.42, .34, .07, 0, .56, 1.36, MAT.darkWood);
    plane(desk, 2.38, .30, 0, .56, 1.402, MAT.carve, 0);

    // 玄色织锦桌围 2.38 × 0.56 m（泥金回纹）+ 上沿压边 + 九枚铜坠
    var flag = new T.Mesh(new T.PlaneGeometry(2.38, .56), MAT.skirt);
    flag.position.set(0, .47, 1.425); arch.add(flag);
    box(D, 2.40, .022, .035, 0, .755, 1.432, MAT.gold, { shadow: false });
    box(D, 2.40, .016, .028, 0, .185, 1.432, MAT.bronzeDark, { shadow: false });
    for (var fi = 0; fi < 9; fi++) {
      var fx = -1.06 + fi * .265;
      var drop = new T.Mesh(new T.ConeGeometry(.014, .068, 5), MAT.goldLine);
      drop.position.set(fx, .155, 1.436);
      drop.rotation.z = Math.PI;
      D.add(drop);
    }

    // 案上陈设：摊开的宣纸卷宗 + 未干朱笔字迹 + 砚 + 笔架 + 镇纸 + 惊堂木 + 朱印盒
    var sheet = new T.Mesh(new T.PlaneGeometry(.76, .38), MAT.paper);
    sheet.rotation.x = -Math.PI / 2; sheet.position.set(0, .856, 1.18); desk.add(sheet);
    var ink = new T.Mesh(new T.PlaneGeometry(.70, .33), MAT.ink);
    ink.rotation.x = -Math.PI / 2; ink.position.set(0, .858, 1.18); ink.renderOrder = 2; desk.add(ink);
    box(desk, .20, .05, .14, -.96, .875, .72, MAT.black, { shadow: false });
    box(desk, .16, .025, .10, -.96, .903, .72, MAT.bronzeDark, { shadow: false });
    box(desk, .22, .055, .07, .96, .875, .72, MAT.darkWood, { shadow: false });
    box(desk, .022, .022, .30, .92, .90, .88, MAT.cinnabar, { shadow: false });
    [-.42, .42].forEach(function (dx) {
      box(desk, .035, .028, .30, dx, .87, 1.34, MAT.bronzeDark, { shadow: false });
    });
    box(desk, .17, .07, .12, -.95, .875, .95, MAT.darkWood, { shadow: false });
    box(desk, .13, .06, .11, .98, .875, 1.20, MAT.cinnabar, { shadow: false });

    // 两个柜框（门由 GLB 填入）+ 铜包角、锁扣
    [[-4.15, -5.45], [4.15, -5.45]].forEach(function (p) {
      box(arch, 1.72, 2.18, .42, p[0], 1.09, p[1], MAT.darkWood);
      box(arch, 1.46, 1.94, .04, p[0], 1.09, p[1] + .22, MAT.black, { shadow: false });
      [[-.80, -1.02], [.80, -1.02], [-.80, 1.02], [.80, 1.02]].forEach(function (c) {
        box(D, .13, .13, .05, p[0] + c[0], 1.09 + c[1], p[1] + .25, MAT.bronzeDark, { shadow: false });
      });
      var lock = new T.Mesh(new T.TorusGeometry(.055, .014, 6, 12), MAT.gold);
      lock.position.set(p[0] + .52, 1.09, p[1] + .28); D.add(lock);
    });

    // 门口一对极小朱红灯穗（唯一暖色点）
    [-.95, .95].forEach(function (dx) {
      box(D, .035, .22, .035, dx, 2.75, -5.82, MAT.cinnabar, { shadow: false });
    });

    // 烛台下的冷光池（「光像从地底渗出来」）
    [[-2.0, -.6], [2.0, -.6], [-4.0, -.6], [4.0, -.6], [0, -3.1]].forEach(function (p, i) {
      if (i !== 0 && i !== 3) return;
      var gp = new T.Mesh(new T.PlaneGeometry(1.5, 1.5), MAT.glowFloor);
      gp.rotation.x = -Math.PI / 2; gp.position.set(p[0], .006, p[1]);
      gp.renderOrder = 1; D.add(gp);
    });

    // ══════════ v3 形制补完：走近才看得见的细节，全部不进 hitTargets ══════════
    var PILLARS = [[-5.25, -4.7], [5.25, -4.7], [-5.25, 4.7], [5.25, 4.7]];

    // 1) 覆盆柱础：48 片外倾莲瓣 + 4 道柱身泥金束腰
    var petals = [], bands = [];
    PILLARS.forEach(function (p) {
      for (var i = 0; i < 12; i++) {
        var a = i / 12 * Math.PI * 2;
        petals.push({ x: p[0] + Math.cos(a) * .285, y: .245, z: p[1] + Math.sin(a) * .285,
                      rx: Math.sin(a) * .38, rz: -Math.cos(a) * .38 });
      }
      bands.push({ x: p[0], y: 1.86, z: p[1] });
    });
    instances(D, new T.ConeGeometry(.052, .155, 4), MAT.lotus, petals);
    instances(D, new T.CylinderGeometry(.212, .212, .018, 10), MAT.gold, bands);

    // 2) 雀替：柱与梁之间的斜撑托木，8 片
    var brackets = [];
    PILLARS.forEach(function (p) {
      [-1, 1].forEach(function (s) {
        brackets.push({ x: p[0] + s * .40, y: 3.52, z: p[1], rz: s * .42 });
      });
    });
    instances(D, new T.BoxGeometry(.60, .19, .075), MAT.carve, brackets);

    // 3) 柱头铺作：栌斗 + 两层出跳华拱（十字）+ 散斗，3 draw call 代替 20 个 box
    var lu = [], gong = [], dou = [];
    PILLARS.forEach(function (p) {
      lu.push({ x: p[0], y: 3.66, z: p[1] });
      [0, 1].forEach(function (li) {
        var L = .96 + li * .30, yy = 3.77 + li * .09;
        gong.push({ x: p[0], y: yy, z: p[1], sx: L });
        gong.push({ x: p[0], y: yy, z: p[1], sx: L, ry: Math.PI / 2 });
        [-1, 1].forEach(function (s) {
          dou.push({ x: p[0] + s * L * .45, y: yy + .075, z: p[1] });
          dou.push({ x: p[0], y: yy + .075, z: p[1] + s * L * .45 });
        });
      });
    });
    instances(D, new T.BoxGeometry(.48, .15, .48), MAT.darkWood, lu);
    instances(D, new T.BoxGeometry(1, .085, .15), MAT.darkWood, gong);
    instances(D, new T.BoxGeometry(.13, .10, .13), MAT.bronzeDark, dou);

    // 4) 须弥座束腰立瓣 20 片（莲瓣束腰是须弥座的标志形制）
    var seat = [];
    for (var sp = 0; sp < 20; sp++) {
      var sa = sp / 20 * Math.PI * 2;
      seat.push({ x: Math.cos(sa) * .80, y: .255, z: -1.2 + Math.sin(sa) * .54,
                  rx: Math.sin(sa) * .30, rz: -Math.cos(sa) * .30 });
    }
    instances(D, new T.ConeGeometry(.075, .16, 4), MAT.lotus, seat);

    // 5) 殿内两侧垂铁链 + 链坠（十王殿刑械意象，默认机位也看得见）
    var links = [];
    [-2.15, 2.15].forEach(function (cx) {
      for (var li = 0; li < 14; li++)
        links.push({ x: cx, y: 3.48 - li * .145, z: -4.35,
                     ry: (li % 2) ? Math.PI / 2 : 0 });
    });
    instances(D, new T.TorusGeometry(.042, .011, 5, 8), MAT.bronzeDark, links);
    instances(D, new T.SphereGeometry(.055, 8, 6), MAT.gold,
              [{ x: -2.15, y: 1.55, z: -4.35 }, { x: 2.15, y: 1.55, z: -4.35 }]);

    // 6) 公案两侧「肅靜 / 迴避」虎头牌（十王图常见仪仗）
    [[-2.55, MAT.signA], [2.55, MAT.signB]].forEach(function (sg) {
      box(D, .50, 1.24, .055, sg[0], .94, -.15, MAT.darkWood, { shadow: false });
      plane(D, .44, 1.14, sg[0], .94, -.119, sg[1], 0);
      box(D, .58, .05, .10, sg[0], 1.59, -.15, MAT.gold, { shadow: false });
      cyl(D, .030, .030, .30, 8, sg[0], .15, -.15, MAT.darkWood);
      box(D, .32, .05, .32, sg[0], .025, -.15, MAT.darkWood, { shadow: false });
    });

    // 7) 案上签筒与签、朱砂碟（判官案头的实用器）
    var sticks = [], sr = rand(151);
    [-1.06, 1.06].forEach(function (cx) {
      cyl(D, .075, .070, .22, 10, cx, .975, .75, MAT.bronzeDark);
      for (var si = 0; si < 5; si++) {
        var a = si / 5 * Math.PI * 2;
        sticks.push({ x: cx + Math.cos(a) * .032, y: 1.13, z: .75 + Math.sin(a) * .032,
                      rx: (sr() - .5) * .12, rz: (sr() - .5) * .12 });
      }
    });
    instances(D, new T.CylinderGeometry(.006, .006, .30, 5), MAT.carve, sticks);
    cyl(D, .095, .095, .028, 12, .58, .872, 1.06, MAT.bronzeDark);
    cyl(D, .072, .072, .008, 12, .58, .890, 1.06, MAT.cinnabar);

    // 8) 门洞雾光：默认机位被镜子挡住，绕到侧面 / 走近门洞才看得到
    //    （曾试过贴地窗光斑，会把整片青石地提亮成「瓷砖」，破坏暗调，已撤掉）
    var doorGlow = new T.Mesh(new T.PlaneGeometry(1.5, 2.8), MAT.shaft);
    doorGlow.position.set(0, 1.5, -5.62); D.add(doorGlow);

    // ══════════ v6 装饰花纹层：把骨架补成一座有彩画、雕饰与堆金的十王殿 ══════════
    // 依据：明清旋子彩画（箍头／找头／枋心）、三原城隍庙水陆画堆金沥粉、斗八藻井与
    // 平棊、菱花隔扇裙板、须弥座壶门、缠枝莲拜石。全部 Canvas 贴图 + InstancedMesh。
    // 一律不进 hitTargets，不破坏五处差异交互；新增约 18 draw call。

    // 斗八藻井：三层同心八角 + 莲心 + 四角如意云 + 井口连珠
    var caissonTex = tex(512, function (g, s) {
      var r = rand(307), c = s / 2;
      g.fillStyle = "#101d19"; g.fillRect(0, 0, s, s);
      function octa(rad, stroke, lw) {
        g.strokeStyle = stroke; g.lineWidth = lw;
        g.beginPath();
        for (var k = 0; k < 8; k++) {
          var a = k / 8 * Math.PI * 2 + Math.PI / 8;
          var x = c + Math.cos(a) * rad, y = c + Math.sin(a) * rad;
          k ? g.lineTo(x, y) : g.moveTo(x, y);
        }
        g.closePath(); g.stroke();
      }
      [s * .47, s * .39, s * .31, s * .23].forEach(function (rad, i) {
        octa(rad, i % 2 ? "rgba(174,148,96,.46)" : "rgba(106,158,138,.52)", i === 0 ? 6 : 3);
      });
      // 八个梯形井格里的卷云
      for (var k = 0; k < 8; k++) {
        var a = k / 8 * Math.PI * 2 + Math.PI / 8, rad = s * .35;
        g.save(); g.translate(c + Math.cos(a) * rad, c + Math.sin(a) * rad);
        g.rotate(a + Math.PI / 2);
        g.strokeStyle = "rgba(160,196,176,.42)"; g.lineWidth = 2.6;
        g.beginPath(); g.moveTo(-22, 12); g.bezierCurveTo(-18, -12, 18, -12, 22, 10);
        g.bezierCurveTo(10, 2, -10, 2, -22, 12); g.stroke();
        g.restore();
      }
      // 明镜莲心
      g.strokeStyle = "rgba(186,160,104,.58)"; g.lineWidth = 3;
      for (var p = 0; p < 16; p++) {
        var pa = p / 16 * Math.PI * 2;
        g.beginPath();
        g.moveTo(c + Math.cos(pa) * 12, c + Math.sin(pa) * 12);
        g.quadraticCurveTo(c + Math.cos(pa + .18) * s * .15,
                           c + Math.sin(pa + .18) * s * .15,
                           c + Math.cos(pa) * s * .19, c + Math.sin(pa) * s * .19);
        g.stroke();
      }
      g.fillStyle = "rgba(170,210,190,.20)";
      g.beginPath(); g.arc(c, c, s * .055, 0, Math.PI * 2); g.fill();
      // 外框回纹 + 连珠
      g.strokeStyle = "rgba(178,152,98,.50)"; g.lineWidth = 5;
      g.strokeRect(10, 10, s - 20, s - 20);
      g.fillStyle = "rgba(176,152,100,.40)";
      for (var b = 0; b < 48; b++) {
        var ba = b / 48 * Math.PI * 2;
        g.beginPath(); g.arc(c + Math.cos(ba) * s * .455,
                             c + Math.sin(ba) * s * .455, 2.2, 0, Math.PI * 2); g.fill();
      }
      for (var n = 0; n < 320; n++) {
        g.fillStyle = "rgba(4,9,8," + (.10 + r() * .45) + ")";
        g.fillRect(r() * s, r() * s, 2 + r() * 20, 1 + r() * 8);
      }
    }, { clamp: true });

    // 水陆画式壁画带：云气分层 + 模糊立姿人影 + 堆金衣纹 + 极小朱色伞盖（字不可辨）
    var muralTex = tex(512, function (g, s) {
      var r = rand(311);
      var bg = g.createLinearGradient(0, 0, 0, s);
      bg.addColorStop(0, "#1c2a26"); bg.addColorStop(.6, "#16211e"); bg.addColorStop(1, "#0d1513");
      g.fillStyle = bg; g.fillRect(0, 0, s, s);
      // 三层卷云
      g.filter = "blur(6px)";
      for (var L = 0; L < 3; L++) {
        g.fillStyle = "rgba(112,156,140," + (.10 + L * .03) + ")";
        g.beginPath(); g.moveTo(0, s * (.22 + L * .24));
        for (var x = 0; x <= s; x += 32)
          g.quadraticCurveTo(x + 16, s * (.16 + L * .24) - r() * 26,
                             x + 32, s * (.22 + L * .24));
        g.lineTo(s, s * (.32 + L * .24)); g.lineTo(0, s * (.32 + L * .24));
        g.closePath(); g.fill();
      }
      // 立姿人影（判官／鬼差剪影，刻意模糊不可辨）
      for (var i = 0; i < 4; i++) {
        var px = s * (.16 + i * .22), py = s * (.40 + r() * .08);
        g.fillStyle = "rgba(8,14,13,.72)";
        g.beginPath(); g.ellipse(px, py, s * .055, s * .19, 0, 0, Math.PI * 2); g.fill();
        g.beginPath(); g.arc(px, py - s * .20, s * .034, 0, Math.PI * 2); g.fill();
        g.strokeStyle = "rgba(178,152,98,.34)"; g.lineWidth = 3;
        g.beginPath(); g.moveTo(px - s * .05, py - s * .08);
        g.lineTo(px + s * .05, py + s * .10); g.stroke();
        if (i === 1) {
          g.fillStyle = "rgba(150,62,48,.30)";
          g.beginPath(); g.arc(px + 18, py - s * .30, s * .07, Math.PI, 0); g.fill();
        }
      }
      g.filter = "none";
      // 堆金沥粉边框
      g.strokeStyle = "rgba(176,150,94,.42)"; g.lineWidth = 4;
      g.strokeRect(12, 12, s - 24, s - 24);
      g.strokeStyle = "rgba(120,166,146,.24)"; g.lineWidth = 2;
      g.strokeRect(22, 22, s - 44, s - 44);
      for (var n = 0; n < 420; n++) {
        g.fillStyle = r() < .55 ? "rgba(4,9,8," + (.10 + r() * .5) + ")"
                                : "rgba(170,150,104," + (.02 + r() * .10) + ")";
        g.fillRect(r() * s, r() * s, 2 + r() * 24, 1 + r() * 9);
      }
    }, { clamp: true });

    // 墙裙：缠枝腰线 + 青砖下碱
    var dadoTex = tex(512, function (g, s) {
      var r = rand(313);
      g.fillStyle = "#1b2723"; g.fillRect(0, 0, s, s);
      // 上部 0–22% 为泥金卷草腰线
      g.fillStyle = "#17231f"; g.fillRect(0, 0, s, s * .22);
      g.strokeStyle = "rgba(176,150,94,.48)"; g.lineWidth = 3;
      g.beginPath(); g.moveTo(0, s * .20); g.lineTo(s, s * .20); g.stroke();
      for (var i = 0; i < 8; i++) {
        var cx = (i + .5) * s / 8;
        g.strokeStyle = "rgba(112,164,142,.52)"; g.lineWidth = 2.6;
        g.beginPath(); g.moveTo(cx - s / 18, s * .17);
        g.bezierCurveTo(cx - s / 22, s * .02, cx + s / 22, s * .02, cx + s / 18, s * .17);
        g.stroke();
        g.strokeStyle = "rgba(176,150,94,.36)"; g.lineWidth = 1.8;
        g.beginPath(); g.arc(cx, s * .10, s * .018, 0, Math.PI * 2); g.stroke();
      }
      // 下部青砖错缝
      var bh = s * .13;
      for (var row = 0; row < 7; row++) {
        for (var col = -1; col <= 8; col++) {
          var bx = col * s / 8 + (row % 2 ? s / 16 : 0), by = s * .22 + row * bh;
          var v = 32 + Math.floor(r() * 14);
          g.fillStyle = "rgb(" + v + "," + (v + 7) + "," + (v + 4) + ")";
          g.fillRect(bx + 2, by + 2, s / 8 - 4, bh - 4);
          g.strokeStyle = "rgba(9,15,14,.55)"; g.lineWidth = 2;
          g.strokeRect(bx + 2, by + 2, s / 8 - 4, bh - 4);
        }
      }
      for (var n = 0; n < 900; n++) {
        g.fillStyle = "rgba(8,14,13," + (r() * .16) + ")";
        g.fillRect(r() * s, r() * s, 1 + r() * 7, 1 + r() * 3);
      }
    }, { repeat: [2, 1] });

    // 柱身缠枝：竖向 S 藤 + 叶 + 泥金箍头
    var pillarWrapTex = tex(256, function (g, s) {
      var r = rand(317);
      g.fillStyle = "#241d17"; g.fillRect(0, 0, s, s);
      g.strokeStyle = "rgba(152,132,96,.46)"; g.lineWidth = 2.4;
      for (var vine = 0; vine < 3; vine++) {
        var x0 = (vine + .5) * s / 3;
        g.beginPath(); g.moveTo(x0, 0);
        for (var y = 0; y <= s; y += 24) {
          g.lineTo(x0 + Math.sin(y / s * Math.PI * 4 + vine) * s * .10, y);
        }
        g.stroke();
        for (var k = 0; k < 7; k++) {
          var ly = (k + .5) * s / 7, lx = x0 + Math.sin(ly / s * Math.PI * 4 + vine) * s * .10;
          g.fillStyle = "rgba(108,156,134,.30)";
          g.beginPath(); g.ellipse(lx + (k % 2 ? 12 : -12), ly, 10, 5, k % 2 ? .5 : -.5, 0, Math.PI * 2); g.fill();
          g.strokeStyle = "rgba(180,154,100,.36)"; g.lineWidth = 1.4;
          g.beginPath(); g.arc(lx, ly, 4, 0, Math.PI * 2); g.stroke();
        }
      }
      g.strokeStyle = "rgba(176,150,94,.40)"; g.lineWidth = 4;
      g.beginPath(); g.moveTo(0, 8); g.lineTo(s, 8);
      g.moveTo(0, s - 8); g.lineTo(s, s - 8); g.stroke();
      for (var n = 0; n < 300; n++) {
        g.fillStyle = "rgba(6,10,8," + (r() * .22) + ")";
        g.fillRect(r() * s, r() * s, 1 + r() * 12, 1 + r() * 3);
      }
    }, { clamp: true });

    // 隔扇裙板：如意云头开光 + 夔龙卷草 + 泥金边框
    var panelTex = tex(256, function (g, s) {
      var r = rand(319);
      g.fillStyle = "#241d16"; g.fillRect(0, 0, s, s);
      g.strokeStyle = "rgba(176,150,94,.46)"; g.lineWidth = 4;
      g.strokeRect(10, 10, s - 20, s - 20);
      g.strokeStyle = "rgba(116,164,142,.48)"; g.lineWidth = 2.6;
      g.beginPath();
      g.moveTo(s * .18, s * .42);
      g.bezierCurveTo(s * .22, s * .20, s * .42, s * .20, s * .5, s * .38);
      g.bezierCurveTo(s * .58, s * .20, s * .78, s * .20, s * .82, s * .42);
      g.bezierCurveTo(s * .86, s * .70, s * .60, s * .80, s * .5, s * .64);
      g.bezierCurveTo(s * .40, s * .80, s * .14, s * .70, s * .18, s * .42);
      g.stroke();
      g.strokeStyle = "rgba(176,150,94,.40)"; g.lineWidth = 2;
      for (var k = 0; k < 4; k++) {
        var cx = s * (.25 + k * .17);
        g.beginPath(); g.arc(cx, s * .48, s * .035, 0, Math.PI * 2); g.stroke();
      }
      for (var n = 0; n < 240; n++) {
        g.fillStyle = "rgba(6,10,8," + (r() * .24) + ")";
        g.fillRect(r() * s, r() * s, 1 + r() * 14, 1 + r() * 4);
      }
    }, { clamp: true });

    // 匾额／须弥座回纹边（透明底，只画边框与四角云头）
    var borderTex = tex(256, function (g, s) {
      g.clearRect(0, 0, s, s);
      g.strokeStyle = "rgba(182,156,102,.62)"; g.lineWidth = 4;
      g.strokeRect(8, 8, s - 16, s - 16);
      g.strokeStyle = "rgba(126,172,150,.40)"; g.lineWidth = 2;
      for (var x = 14; x < s - 14; x += 18) {
        g.beginPath(); g.moveTo(x, 14); g.lineTo(x + 11, 14); g.lineTo(x + 11, 22);
        g.moveTo(x, s - 14); g.lineTo(x + 11, s - 14); g.lineTo(x + 11, s - 22); g.stroke();
      }
      g.strokeStyle = "rgba(182,156,102,.55)"; g.lineWidth = 3;
      [[18, 18], [s - 18, 18], [18, s - 18], [s - 18, s - 18]].forEach(function (p) {
        g.beginPath(); g.arc(p[0], p[1], 10, 0, Math.PI * 2); g.stroke();
      });
    }, { clamp: true });

    // 拜石：青石 + 缠枝莲边 + 中央宝相团花
    var baiShiTex = tex(512, function (g, s) {
      var r = rand(331), c = s / 2;
      g.fillStyle = "#29332d"; g.fillRect(0, 0, s, s);
      g.strokeStyle = "rgba(168,152,108,.40)"; g.lineWidth = 5;
      g.strokeRect(20, 20, s - 40, s - 40);
      g.strokeStyle = "rgba(140,168,150,.36)"; g.lineWidth = 3;
      for (var i = 0; i < 14; i++) {
        var a = i / 14 * Math.PI * 2;
        g.beginPath();
        g.moveTo(c + Math.cos(a) * s * .30, c + Math.sin(a) * s * .30);
        g.quadraticCurveTo(c + Math.cos(a + .22) * s * .40,
                           c + Math.sin(a + .22) * s * .40,
                           c + Math.cos(a) * s * .44, c + Math.sin(a) * s * .44);
        g.stroke();
      }
      g.strokeStyle = "rgba(178,152,100,.46)"; g.lineWidth = 3.4;
      g.beginPath(); g.arc(c, c, s * .21, 0, Math.PI * 2); g.stroke();
      for (var p = 0; p < 12; p++) {
        var pa = p / 12 * Math.PI * 2;
        g.beginPath();
        g.moveTo(c + Math.cos(pa) * s * .045, c + Math.sin(pa) * s * .045);
        g.quadraticCurveTo(c + Math.cos(pa + .26) * s * .17,
                           c + Math.sin(pa + .26) * s * .17,
                           c + Math.cos(pa) * s * .20, c + Math.sin(pa) * s * .20);
        g.stroke();
      }
      for (var n = 0; n < 1600; n++) {
        var q = 30 + Math.floor(r() * 52);
        g.fillStyle = "rgba(" + q + "," + (q + 6) + "," + (q + 3) + "," + (.05 + r() * .16) + ")";
        g.fillRect(r() * s, r() * s, 1 + r() * 5, 1 + r() * 2);
      }
    }, { clamp: true });

    // 中轴甬道边纹（透明底，纵向 repeat；只在石板缝上刻两道卷草）
    var pathTex = tex(256, function (g, s) {
      var r = rand(337);
      g.clearRect(0, 0, s, s);
      [s * .10, s * .90].forEach(function (base, idx) {
        g.strokeStyle = "rgba(172,150,102,.34)"; g.lineWidth = 2.4;
        g.beginPath(); g.moveTo(base, 0); g.lineTo(base, s); g.stroke();
        for (var k = 0; k < 5; k++) {
          var y = (k + .5) * s / 5, dir = idx ? -1 : 1;
          g.strokeStyle = "rgba(120,164,144,.28)"; g.lineWidth = 2;
          g.beginPath(); g.moveTo(base, y - 16);
          g.bezierCurveTo(base + dir * 22, y - 10, base + dir * 22, y + 10, base, y + 16);
          g.stroke();
        }
      });
      g.strokeStyle = "rgba(176,152,102,.20)"; g.lineWidth = 1.6;
      for (var k2 = 0; k2 < 4; k2++) {
        g.beginPath(); g.arc(s / 2, (k2 + .5) * s / 4, s * .045, 0, Math.PI * 2); g.stroke();
      }
      for (var n = 0; n < 120; n++) {
        g.fillStyle = "rgba(8,14,13," + (r() * .12) + ")";
        g.fillRect(r() * s, r() * s, 1 + r() * 8, 1 + r() * 3);
      }
    }, { repeat: [1, 6] });

    // 幢幡绢面：暗绢 + 泥金框 + 模糊符箓 + 破边
    var gonfTex = tex(256, function (g, s) {
      var r = rand(347);
      g.fillStyle = "rgba(38,50,44,.92)"; g.fillRect(0, 0, s, s);
      g.strokeStyle = "rgba(178,152,98,.55)"; g.lineWidth = 4;
      g.strokeRect(12, 10, s - 24, s - 20);
      g.filter = "blur(3px)";
      g.strokeStyle = "rgba(176,196,180,.48)"; g.lineWidth = 5;
      g.beginPath();
      g.moveTo(s * .5, 34); g.lineTo(s * .5, s - 34);
      g.moveTo(s * .34, 62); g.lineTo(s * .66, 62);
      g.moveTo(s * .36, s * .55); g.lineTo(s * .64, s * .55);
      g.stroke();
      g.filter = "none";
      g.fillStyle = "rgba(150,62,48,.26)"; g.fillRect(s * .42, s * .68, s * .16, s * .16);
      g.globalCompositeOperation = "destination-out";
      for (var x = 0; x <= s; x += 6) {
        g.fillStyle = "rgba(0,0,0,.8)";
        g.fillRect(x, s - 6 - r() * 22, 6, 24);
      }
      g.globalCompositeOperation = "source-over";
    }, { clamp: true });

    // 朱砂符箓（黄纸 + 焦边，朱红面积严格控制在 <5%）
    var talismanTex = tex(128, function (g, s) {
      var r = rand(349);
      g.fillStyle = "rgba(176,166,132,.72)"; g.fillRect(12, 8, s - 24, s - 16);
      g.filter = "blur(2px)";
      g.strokeStyle = "rgba(150,58,42,.72)"; g.lineWidth = 4;
      g.beginPath(); g.moveTo(s * .5, 22); g.lineTo(s * .5, s - 24);
      g.moveTo(s * .34, 40); g.lineTo(s * .66, 40);
      g.moveTo(s * .36, s * .60); g.lineTo(s * .64, s * .60); g.stroke();
      g.filter = "none";
      for (var i = 0; i < 60; i++) {
        g.fillStyle = "rgba(30,22,16," + (r() * .3) + ")";
        g.fillRect(r() * s, r() * s, 1 + r() * 7, 1 + r() * 3);
      }
    }, { clamp: true });

    var MV = {
      caisson: new T.MeshBasicMaterial({ map: caissonTex, color: 0x718c7e }),
      dado: new T.MeshStandardMaterial({ map: dadoTex, color: 0x7d8a80, roughness: .96,
                                         side: T.DoubleSide, envMapIntensity: .1 }),
      mural: new T.MeshBasicMaterial({ map: muralTex, color: 0x63796b, side: T.DoubleSide }),
      pillarWrap: new T.MeshStandardMaterial({ map: pillarWrapTex, color: 0x78877a,
                                               roughness: .82, side: T.DoubleSide }),
      panel: new T.MeshStandardMaterial({ map: panelTex, color: 0x828f80,
                                          roughness: .9, side: T.DoubleSide }),
      border: new T.MeshBasicMaterial({ map: borderTex, transparent: true,
                                        depthWrite: false, side: T.DoubleSide }),
      baiShi: new T.MeshStandardMaterial({ map: baiShiTex, color: 0x59645c,
                                           roughness: .96, side: T.DoubleSide,
                                           envMapIntensity: .25 }),
      grid: new T.MeshBasicMaterial({ color: 0x1b2a25 }),
      path: new T.MeshBasicMaterial({ map: pathTex, transparent: true,
                                      depthWrite: false, side: T.DoubleSide, opacity: .85 }),
      gonf: new T.MeshBasicMaterial({ map: gonfTex, transparent: true,
                                      depthWrite: false, side: T.DoubleSide }),
      talisman: new T.MeshBasicMaterial({ map: talismanTex, transparent: true,
                                          depthWrite: false, side: T.DoubleSide })
    };

    // 1) 天花：中央斗八藻井 + 四周平棊方格（22 根细木条一次画完）+ 四角垂莲
    var caisson = new T.Mesh(new T.PlaneGeometry(4.2, 4.2), MV.caisson);
    caisson.rotation.x = Math.PI / 2;
    caisson.position.set(0, 3.982, 0);
    D.add(caisson);
    var gridList = [];
    for (var gk = -5; gk <= 5; gk++) {
      gridList.push({ x: gk, y: 3.990, z: 0, sx: .040, sz: 11.7 });
      gridList.push({ x: 0, y: 3.990, z: gk, sx: 11.7, sz: .040 });
    }
    instances(D, new T.BoxGeometry(1, .022, 1), MV.grid, gridList);
    instances(D, new T.ConeGeometry(.085, .24, 6), MAT.gold,
      [[-1.95, -1.95], [1.95, -1.95], [-1.95, 1.95], [1.95, 1.95]].map(function (p) {
        return { x: p[0], y: 3.86, z: p[1], rx: Math.PI };
      }));

    // 2) 梁底也上彩画（走近抬头能看见），与梁正面同纹
    instances(D, new T.PlaneGeometry(1, 1), MAT.beam,
      [-4.7, 4.7].map(function (z) {
        return { x: 0, y: 3.732, z: z, rx: Math.PI / 2, sx: 11.2, sy: .30 };
      }));

    // 3) 墙裙（北墙留门洞分两段），一次实例化
    instances(D, new T.PlaneGeometry(1, 1), MV.dado, [
      { x: -3.4, y: .525, z: -5.872, sx: 5.2, sy: 1.05, ry: 0 },
      { x:  3.4, y: .525, z: -5.872, sx: 5.2, sy: 1.05, ry: 0 },
      { x: 0, y: .525, z: 5.872, sx: 11.7, sy: 1.05, ry: Math.PI },
      { x: -5.872, y: .525, z: 0, sx: 11.7, sy: 1.05, ry: Math.PI / 2 },
      { x:  5.872, y: .525, z: 0, sx: 11.7, sy: 1.05, ry: -Math.PI / 2 }
    ]);

    // 4) 壁画带：侧墙窗间各 2 幅 + 南墙 2 幅（水陆画 / 十王变相）
    instances(D, new T.PlaneGeometry(1, 1), MV.mural, [
      { x: -5.862, y: 2.06, z: -1.70, sx: 1.72, sy: 2.06, ry: Math.PI / 2 },
      { x: -5.862, y: 2.06, z:  1.70, sx: 1.72, sy: 2.06, ry: Math.PI / 2 },
      { x:  5.862, y: 2.06, z: -1.70, sx: 1.72, sy: 2.06, ry: -Math.PI / 2 },
      { x:  5.862, y: 2.06, z:  1.70, sx: 1.72, sy: 2.06, ry: -Math.PI / 2 },
      { x: -3.25, y: 2.06, z: 5.862, sx: 2.30, sy: 2.06, ry: Math.PI },
      { x:  3.25, y: 2.06, z: 5.862, sx: 2.30, sy: 2.06, ry: Math.PI }
    ]);

    // 5) 四柱缠枝包柱（open-ended 薄套，1 draw call）
    instances(D, new T.CylinderGeometry(.244, .244, 3.66, 12, 1, true), MV.pillarWrap,
      PILLARS.map(function (p) { return { x: p[0], y: 2.20, z: p[1] }; }));

    // 6) 隔扇裙板 + 绦环板：让 6 扇窗从「一张贴图」变成有格心／绦环／裙板的真隔扇
    var panelList = [], railList = [];
    for (var sd = -1; sd <= 1; sd += 2) {
      for (var wj = -1; wj <= 1; wj++) {
        var wx = sd * 5.80, wz = wj * 3.4, wry = sd > 0 ? -Math.PI / 2 : Math.PI / 2;
        panelList.push({ x: wx, y: 1.00, z: wz, sx: 1.30, sy: .64, ry: wry });
        railList.push({ x: sd * 5.79, y: 1.36, z: wz, sx: .035, sy: .10, sz: 1.38 });
        railList.push({ x: sd * 5.79, y: 1.68, z: wz, sx: .035, sy: .06, sz: 1.38 });
      }
    }
    instances(D, new T.PlaneGeometry(1, 1), MV.panel, panelList);
    instances(D, new T.BoxGeometry(1, 1, 1), MAT.bronzeDark, railList);

    // 7) 匾额泥金回纹外框（镜台正上方，构图重心）
    plane(D, 2.40, .70, 0, 3.40, PZ + .066, MV.border, 0);

    // 8) 中轴甬道刻纹 + 案前缠枝莲拜石（都在纸钱圈之下／之上分层）
    var path = new T.Mesh(new T.PlaneGeometry(2.3, 10.2), MV.path);
    path.rotation.x = -Math.PI / 2; path.position.set(0, .005, .35);
    path.renderOrder = 1; D.add(path);
    var bai = new T.Mesh(new T.PlaneGeometry(1.42, .90), MV.baiShi);
    bai.rotation.x = -Math.PI / 2; bai.position.set(0, .009, 2.05);
    bai.renderOrder = 1; D.add(bai);

    // 9) 四角悬幢幡：横杆 + 悬绳 + 绢面 + 流苏 + 铜铃，全部实例化
    var GONF = [[-3.55, -3.15], [3.55, -3.15], [-3.55, 2.75], [3.55, 2.75]];
    instances(D, new T.BoxGeometry(1, 1, 1), MAT.darkWood,
      GONF.map(function (p) { return { x: p[0], y: 3.60, z: p[1], sx: .46, sy: .035, sz: .035 }; }));
    instances(D, new T.CylinderGeometry(1, 1, 1, 5), MAT.bronzeDark,
      GONF.map(function (p) { return { x: p[0], y: 3.43, z: p[1], sx: .008, sy: .34, sz: .008 }; }));
    instances(D, new T.PlaneGeometry(1, 1), MV.gonf,
      GONF.map(function (p) { return { x: p[0], y: 2.72, z: p[1], sx: .30, sy: 1.06 }; }));
    var tassels = [], bells = [];
    GONF.forEach(function (p) {
      for (var ti = -2; ti <= 2; ti++)
        tassels.push({ x: p[0] + ti * .062, y: 2.14, z: p[1], rx: Math.PI,
                       sx: .012, sy: .16, sz: .012 });
      bells.push({ x: p[0], y: 2.03, z: p[1] });
    });
    instances(D, new T.ConeGeometry(1, 1, 5), MAT.goldLine, tassels);
    instances(D, new T.SphereGeometry(.038, 8, 6), MAT.gold, bells);

    // 10) 柱侧四张朱砂符箓（唯一新增朱色，面积极小）
    instances(D, new T.PlaneGeometry(1, 1), MV.talisman, [
      { x: -4.86, y: 1.92, z: -5.855, sx: .13, sy: .32 },
      { x:  4.86, y: 1.92, z: -5.855, sx: .13, sy: .32 },
      { x: -4.86, y: 1.36, z: -5.855, sx: .11, sy: .26 },
      { x:  4.86, y: 1.36, z: -5.855, sx: .11, sy: .26 }
    ]);

    // ══════════ v7 公堂陈设：阴司第一殿 = 审案公堂，按文献补摆设与木构 ══════════
    // 依据：大足宝顶山第 20 龛地狱变「十大冥王…两侧二司、书记、判官、鬼卒」
    //       「桌幡刻各自名号与偈文」；南宋陆信忠《十王图》案后屏风；明清衙署公堂
    //       之雀替、门簪、门枕石、堂刑与更漏；《玉历宝钞》一殿秦广王条。
    // 刻意不做业秤（队友《场景生图提示词_v3_恐怖版》把业秤划给二殿，不串殿），
    // 不做人像／清晰文字（守负面词）。零生成、零积分，不进 hitTargets、不参与五处差异。

    // 程序化贴图：雀替镂空卷草（透明底）、桌幡偈文、平棊格心团花
    var queTiTex = tex(256, function (g, s) {
      g.clearRect(0, 0, s, s);
      g.fillStyle = "rgba(30,25,19,.95)";
      g.beginPath();
      g.moveTo(4, 14); g.lineTo(s - 26, 14);
      g.quadraticCurveTo(s - 8, s * .56, 10, s - 10);
      g.lineTo(4, s - 10); g.closePath(); g.fill();
      g.strokeStyle = "rgba(176,150,94,.60)"; g.lineWidth = 3; g.stroke();
      g.strokeStyle = "rgba(146,190,168,.36)"; g.lineWidth = 2.4;
      for (var q = 0; q < 3; q++) {
        var ox = q * 72;
        g.beginPath();
        g.moveTo(24 + ox, s - 28);
        g.bezierCurveTo(52 + ox, s * .56, 96 + ox, s * .70, 132 + ox, 30);
        g.stroke();
        g.beginPath(); g.arc(52 + ox, s * .58, 12, 0, Math.PI * 2); g.stroke();
      }
      g.fillStyle = "rgba(176,150,94,.28)";
      for (var t = 0; t < 9; t++) g.fillRect(16 + t * 26, s - 18, 3, 9);
    }, { clamp: true });

    var zhuoFanTex = tex(256, function (g, s) {
      var r = rand(771);
      g.fillStyle = "#1c2a27"; g.fillRect(0, 0, s, s);
      for (var n = 0; n < 1200; n++) {
        g.fillStyle = "rgba(150,172,158," + (r() * .055) + ")";
        g.fillRect(r() * s, r() * s, 1 + r() * 2, 1 + r() * 2);
      }
      g.strokeStyle = "rgba(176,150,94,.55)"; g.lineWidth = 5;
      g.strokeRect(13, 13, s - 26, s - 26);
      g.strokeStyle = "rgba(176,150,94,.24)"; g.lineWidth = 1.5;
      g.strokeRect(24, 24, s - 48, s - 48);
      // 只留随机笔痕，不写可辨的字（提示词把「清晰文字」列为负面）；
      // 规则的小十字阵列远看会像一列真字，改用散笔
      var r2 = rand(913);
      g.strokeStyle = "rgba(202,182,136,.34)"; g.lineWidth = 3;
      for (var c = 0; c < 3; c++) for (var rw = 0; rw < 5; rw++) {
        var bx = 56 + c * 72, by = 44 + rw * 42;
        for (var st = 0; st < 3; st++) {
          var x0 = bx + (r2() - .5) * 14, y0 = by + (r2() - .5) * 12;
          g.beginPath();
          g.moveTo(x0, y0);
          g.lineTo(x0 + 7 + r2() * 17, y0 + (r2() - .5) * 9);
          g.stroke();
        }
      }
      g.globalCompositeOperation = "destination-out";
      for (var k = 0; k < 24; k++) {
        g.fillStyle = "rgba(0,0,0," + (.2 + r() * .5) + ")";
        g.beginPath();
        g.arc(r() * s, (r() < .5 ? 2 : s - 2) + (r() - .5) * 22,
              4 + r() * 10, 0, Math.PI * 2);
        g.fill();
      }
      g.globalCompositeOperation = "source-over";
    }, { clamp: true });

    var pingQiTex = tex(512, function (g, s) {
      g.clearRect(0, 0, s, s);
      var cell = s / 12;
      for (var r0 = 0; r0 < 12; r0++) for (var c0 = 0; c0 < 12; c0++) {
        var cx = (c0 + .5) * cell, cy = (r0 + .5) * cell;
        // 中央 4.2 m 让给斗八藻井
        if (Math.abs(cx - s / 2) < s * .19 &&
            Math.abs(cy - s / 2) < s * .19) continue;
        // 只画格心小团花：格线由 v6 的支条木格负责，再画一遍会把天花织成亮网
        g.strokeStyle = "rgba(150,186,166,.085)"; g.lineWidth = 1;
        for (var pet = 0; pet < 8; pet++) {
          var a = pet / 8 * Math.PI * 2;
          g.beginPath();
          g.ellipse(cx + Math.cos(a) * cell * .14, cy + Math.sin(a) * cell * .14,
                    cell * .085, cell * .045, a, 0, Math.PI * 2);
          g.stroke();
        }
        g.fillStyle = "rgba(176,150,94,.07)";
        g.beginPath(); g.arc(cx, cy, cell * .038, 0, Math.PI * 2); g.fill();
      }
    }, { clamp: true });

    var MQ = {
      queTi: new T.MeshBasicMaterial({ map: queTiTex, transparent: true,
                                       depthWrite: false, side: T.DoubleSide }),
      zhuoFan: new T.MeshBasicMaterial({ map: zhuoFanTex, transparent: true,
                                          depthWrite: false, side: T.DoubleSide }),
      pingQi: new T.MeshBasicMaterial({ map: pingQiTex, transparent: true,
                                         opacity: .5, depthWrite: false,
                                         side: T.DoubleSide })
    };

    // 1) 平棊格心团花：满顶支条方格内补八瓣团花，中央留给斗八藻井
    var pingQi = new T.Mesh(new T.PlaneGeometry(11.7, 11.7), MQ.pingQi);
    pingQi.rotation.x = Math.PI / 2;
    pingQi.position.set(0, 3.976, 0);
    D.add(pingQi);

    // 2) 雀替：四柱与梁交角的镂空卷草托木（明清衙署木构标志），8 片一次画完
    var qList = [];
    PILLARS.forEach(function (p) {
      var sx = p[0] < 0 ? 1 : -1, sz = p[1] < 0 ? 1 : -1;
      qList.push({ x: p[0] + sx * .34, y: 3.60, z: p[1], sx: .66, sy: .46 });
      qList.push({ x: p[0], y: 3.60, z: p[1] + sz * .34,
                   sx: .66, sy: .46, ry: Math.PI / 2 });
    });
    instances(D, new T.PlaneGeometry(1, 1), MQ.queTi, qList);

    // 3) 门洞：门楣四枚门簪 + 一对门枕石 + 门槛铜包角
    instances(D, new T.CylinderGeometry(.052, .052, .10, 6), MAT.gold,
      [-.62, -.22, .22, .62].map(function (dx) {
        return { x: dx, y: 2.92, z: -5.72, rx: Math.PI / 2 };
      }));
    instances(D, new T.BoxGeometry(1, 1, 1), MAT.stone,
      [-.88, .88].map(function (dx) {
        return { x: dx, y: .13, z: -5.78, sx: .30, sy: .26, sz: .36 };
      }));
    instances(D, new T.BoxGeometry(1, 1, 1), MAT.bronzeDark,
      [-.80, .80].map(function (dx) {
        return { x: dx, y: .055, z: -5.86, sx: .16, sy: .028, sz: .30 };
      }));

    // 4) 案左右二司／书记席：空座 + 签押矮几（大足石刻「两侧二司、书记、判官」）
    var SEATS = [[-3.30, .55], [3.30, .55]];
    instances(D, new T.BoxGeometry(1, 1, 1), MAT.darkWood,
      SEATS.map(function (p) {
        return { x: p[0], y: .48, z: p[1], sx: .62, sy: .07, sz: .56 };
      }));
    // 透空靠背：搭脑 + 上下横枨 + 两边柱 + 三根竖棂。
    // 第一版用实心板，近看像两块深棕木板，不像椅子，也不透光。
    var backList = [];
    SEATS.forEach(function (p) {
      var bz = p[1] + .25;
      backList.push({ x: p[0], y: 1.23, z: bz, sx: .70, sy: .045, sz: .09 });
      backList.push({ x: p[0], y: 1.16, z: bz, sx: .62, sy: .05, sz: .07 });
      backList.push({ x: p[0], y: .56, z: bz, sx: .62, sy: .045, sz: .07 });
      [-.29, .29].forEach(function (dx) {
        backList.push({ x: p[0] + dx, y: .87, z: bz, sx: .05, sy: .62, sz: .07 });
      });
      [-.13, 0, .13].forEach(function (dx) {
        backList.push({ x: p[0] + dx, y: .87, z: bz, sx: .026, sy: .54, sz: .045 });
      });
    });
    instances(D, new T.BoxGeometry(1, 1, 1), MAT.darkWood, backList);
    var seatParts = [];
    SEATS.forEach(function (p) {
      [-.25, .25].forEach(function (dx) {
        [-.21, .21].forEach(function (dz) {
          seatParts.push({ x: p[0] + dx, y: .23, z: p[1] + dz,
                           sx: .05, sy: .46, sz: .05 });
        });
        seatParts.push({ x: p[0] + dx, y: .68, z: p[1],
                         sx: .05, sy: .045, sz: .52 });
      });
      seatParts.push({ x: p[0], y: .40, z: p[1] + .62, sx: .78, sy: .045, sz: .40 });
      [-.32, .32].forEach(function (dx) {
        seatParts.push({ x: p[0] + dx, y: .20, z: p[1] + .62,
                         sx: .05, sy: .40, sz: .05 });
      });
    });
    instances(D, new T.BoxGeometry(1, 1, 1), MAT.darkWood, seatParts);
    instances(D, new T.BoxGeometry(1, 1, 1), MAT.paper,
      SEATS.map(function (p) {
        return { x: p[0], y: .432, z: p[1] + .62, sx: .30, sy: .016, sz: .20 };
      }));
    instances(D, new T.BoxGeometry(1, 1, 1), MAT.bronzeDark,
      SEATS.map(function (p) {
        return { x: p[0] + .22, y: .445, z: p[1] + .62, sx: .025, sy: .025, sz: .24 };
      }));

    // 5) 侧墙刑具架：木枷 + 铁链 + 水火棍（明清公堂堂刑 / 大足地狱变）
    var RACKS = [[-5.02, -2.85], [5.02, -2.85]];
    var rackParts = [], chain = [], redTips = [];
    RACKS.forEach(function (p) {
      rackParts.push({ x: p[0], y: 1.05, z: p[1] - .60, sx: .07, sy: 2.10, sz: .07 });
      rackParts.push({ x: p[0], y: 1.05, z: p[1] + .60, sx: .07, sy: 2.10, sz: .07 });
      rackParts.push({ x: p[0], y: 2.06, z: p[1], sx: .09, sy: .09, sz: 1.34 });
      // 木枷：两片横木 + 两端竖木，中间留圆孔
      rackParts.push({ x: p[0], y: 1.66, z: p[1] - .22, sx: .09, sy: .06, sz: .62 });
      rackParts.push({ x: p[0], y: 1.66, z: p[1] + .22, sx: .09, sy: .06, sz: .62 });
      rackParts.push({ x: p[0], y: 1.66, z: p[1] - .48, sx: .09, sy: .06, sz: .10 });
      rackParts.push({ x: p[0], y: 1.66, z: p[1] + .48, sx: .09, sy: .06, sz: .10 });
      var tilt = p[0] < 0 ? -.10 : .10, kx = p[0] + (p[0] < 0 ? .12 : -.12);
      rackParts.push({ x: kx, y: .62, z: p[1] + .34,
                       sx: .045, sy: 1.24, sz: .045, rz: tilt });
      redTips.push({ x: kx, y: 1.22, z: p[1] + .34, sx: .05, sy: .10, sz: .05 });
      for (var ci = 0; ci < 5; ci++)
        chain.push({ x: p[0], y: 1.92 - ci * .13, z: p[1] - .02,
                     rx: ci % 2 ? Math.PI / 2 : 0, s: .055 });
    });
    instances(D, new T.BoxGeometry(1, 1, 1), MAT.darkWood, rackParts);
    instances(D, new T.TorusGeometry(1, .18, 5, 9), MAT.bronzeDark, chain);
    instances(D, new T.BoxGeometry(1, 1, 1), MAT.cinnabar, redTips);

    // 6) 桌幡偈文：案左垂一幅（大足石刻「桌幡刻各自名号与偈文」，字迹不可辨）
    plane(D, .36, .64, -1.02, .46, 1.452, MQ.zhuoFan, 0);
    box(D, .42, .022, .030, -1.02, .79, 1.450, MAT.bronzeDark, { shadow: false });
    box(D, .36, .018, .026, -1.02, .14, 1.450, MAT.goldLine, { shadow: false });

    // 7) 铜壶滴漏（阴司计时，与「时辰烛台」呼应；明清衙署更漏）
    var LOU = [2.55, .25];
    box(D, .68, .06, .54, LOU[0], .10, LOU[1], MAT.darkWood, { shadow: false });
    [[.30, .50], [.60, .42], [.90, .32]].forEach(function (lv) {
      box(D, lv[1], .04, lv[1] * .82, LOU[0], lv[0], LOU[1], MAT.darkWood,
          { shadow: false });
      cyl(D, lv[1] * .27, lv[1] * .30, .15, 10,
          LOU[0], lv[0] + .10, LOU[1], MAT.bronzeDark);
    });
    instances(D, new T.BoxGeometry(1, 1, 1), MAT.darkWood,
      [[-.28, -.20], [.28, -.20], [-.28, .20], [.28, .20]].map(function (o) {
        return { x: LOU[0] + o[0], y: .55, z: LOU[1] + o[1],
                 sx: .035, sy: 1.06, sz: .035 };
      }));
    cyl(D, .008, .008, .70, 5, LOU[0], .74, LOU[1], MAT.goldLine);

    return { group: arch, desk: desk, detail: D };
  }

  // —— 灯光 ——
  function buildLights(scene, root) {
    scene.add(new T.HemisphereLight(0x2b4a41, 0x05080a, .22));
    // 单一青绿主光：从镜后上方斜下，只照亮中央镜与案，四周沉入死黑
    var key = new T.SpotLight(0x8fd8c2, 18, 14, Math.PI / 5.6, .88, 1.65);
    key.position.set(0, 3.7, -3.4);
    key.target.position.set(0, 1.2, .4);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = .5; key.shadow.camera.far = 18;
    key.shadow.bias = -.0007;
    scene.add(key, key.target);
    var fill = new T.DirectionalLight(0x47756c, .14);
    fill.position.set(3, 2, 6); scene.add(fill);
    // 贴地冷光：像从地底渗出来，让纸钱圈、案脚、须弥座读得出来
    [[-2.3, 1.7], [2.3, 1.7]].forEach(function (p) {
      var l = new T.PointLight(0x4e9e8a, 1.1, 4.6, 2.1);
      l.position.set(p[0], .16, p[1]); root.add(l);
    });
    // 青白冷焰（烛火不动，只 2 支亮）+ 光晕
    var flames = [];
    [[-2.0, -.6], [2.0, -.6], [-4.0, -.6], [4.0, -.6], [0, -3.1]].forEach(function (p, i) {
      var lit = (i === 0 || i === 3);
      var f = new T.Mesh(new T.SphereGeometry(.055, 10, 8), MAT.flame);
      f.position.set(p[0], 1.24, p[1]);
      f.visible = lit; root.add(f);
      var halo = new T.Sprite(MAT.glow);
      halo.scale.set(.52, .52, 1);
      halo.position.set(p[0], 1.25, p[1]);
      halo.visible = lit; root.add(halo);
      var l = new T.PointLight(0x9fe8d8, lit ? 2.6 : 0, 4.2, 2);
      l.position.set(p[0], 1.22, p[1]); root.add(l);
      flames.push({ mesh: f, light: l, lit: lit, halo: halo });
    });
    return { key: key, flames: flames };
  }

  // —— 资产加载 ——
  var FILES = [
    ["mirror", "S1-01_karma_mirror_A.glb"],
    ["candlestand", "S1-05_candlestand_A.glb"],
    ["censer", "S1-06_censer_A.glb"],
    ["banner", "S1-07_banner_A.glb"],
    ["door", "S1-08_cabinet_door_A.glb"],
    ["ledger", "S1-09_ledger_volume_A.glb"]
  ];
  // 整幕要同时摆 18 个实例，三档资产按需切换：
  //   默认 low  — 512² 贴图 + 顶点聚类减面，整幕约 32.5 万 tri / 11 MB，网页流畅
  //   ?q=lod    — 512² 贴图 + 满面数，约 300 万 tri / 39 MB，中距离验收
  //   ?q=hq     — 2048² 原版 + 满面数，94 MB，近景单件验收（勿用于整幕）
  var BASE = /q=hq/.test(location.search) ? "/models/"
           : /q=lod/.test(location.search) ? "/models/lod/"
           : "/models/low/";

  // v7.1：以前是「6 件全部成功才揭幕」，任何一件挂起或 404 都会 reject，
  // 页面永远卡在「载入证物 / 场景未能启动」，房间根本出不来。改成逐件超时 +
  // 失败占位：缺哪件就少摆哪件，殿宇和其余陈设照常显示，绝不阻断进殿。
  function loadAssets(onProgress) {
    var loader = new T.GLTFLoader();
    var out = {}, done = 0;
    // 出图模式（clean=1）用大的超时：无头浏览器的 --virtual-time-budget 会
    // 快进到定时器，短超时会让 rAF 提前空转、拖垮软渲染截图。正常游玩有
    // 1.2 秒强制揭幕兜底，单件超时慢一点不影响进殿。
    var TIMEOUT = /clean=1/.test(location.search) ? 60000 : 12000;
    return Promise.all(FILES.map(function (pair) {
      return new Promise(function (resolve) {
        var settled = false;
        function finish(scene, label) {
          if (settled) return;
          settled = true; clearTimeout(timer);
          out[pair[0]] = scene || null;
          done++;
          if (onProgress) onProgress(done, FILES.length, pair[1] + label);
          resolve();
        }
        var timer = setTimeout(function () { finish(null, "（超时跳过）"); }, TIMEOUT);
        loader.load(BASE + pair[1],
          function (g) { finish(g.scene, ""); },
          undefined,
          function () { finish(null, "（缺失跳过）"); });
      });
    })).then(function () { return out; });
  }

  function inst(proto) {
    // 占位：某件 GLB 超时 / 缺失时返回空组，摆放逻辑不抛错，殿里只是少一件证物
    if (!proto) return new T.Group();
    var o = proto.clone(true);
    o.traverse(function (n) {
      if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; }
    });
    return o;
  }

  // 镜中才有、实景没有：公案前一双绣花鞋（队友 v3「镜中有、实景空」）
  function makeMirrorOnly(root) {
    var g = new T.Group();
    g.visible = false;
    [-1, 1].forEach(function (s) {
      var sh = new T.Mesh(new T.PlaneGeometry(.24, .13), MAT.shoe);
      sh.rotation.x = -Math.PI / 2;
      sh.position.set(s * .18, .024, 1.86);
      g.add(sh);
    });
    root.add(g);
    return g;
  }

  // —— 摆放 6 类证物，返回可交互引用 ——
  function placeAssets(root, g) {
    var R = { hitTargets: [], candles: [], banners: [], doors: [], ledgers: [], censer: null,
              mirror: null, mirrorDisc: null, smoke: null, mirrorOnly: null };

    // 镜（Ø2.4 m / 架高 2.8 m），立在须弥座上（台面 y = .45）
    var mirror = inst(g.mirror);
    mirror.position.set(0, .46, -1.2);
    root.add(mirror); R.mirror = mirror;

    // 五支烛台：90° 步进可转（规范 ×5，高 1.2 m）
    [[-2.0, -.6], [2.0, -.6], [-4.0, -.6], [4.0, -.6], [0, -3.1]].forEach(function (p, i) {
      var pivot = new T.Group(); pivot.position.set(p[0], 0, p[1]);
      var o = inst(g.candlestand); pivot.add(o); root.add(pivot);
      pivot.rotation.y = (i % 2) ? Math.PI / 2 : 0;
      // 烛泪：沿烛台外壁挂下的几道凝白
      for (var t = 0; t < 3; t++) {
        var drip = new T.Mesh(new T.CylinderGeometry(.008, .012, .10 + t * .035, 5), MAT.hemp);
        drip.position.set((t - 1) * .045, 1.02 - t * .02, .045);
        o.add(drip);
      }
      o.traverse(function (n) { if (n.isMesh) n.userData.hit = "candles"; });
      R.candles.push({ pivot: pivot, obj: o, base: pivot.rotation.y });
      R.hitTargets.push(o);
    });

    // 六面经幡：每侧 3 面，幡面朝殿心；另加白麻飘带，无风却朝镜倾
    var order = [2, 0, 1, 1, 2, 0];
    var targetOrder = [0, 1, 2, 2, 1, 0];
    for (var side = -1; side <= 1; side += 2) {
      for (var i = 0; i < 3; i++) {
        var holder = new T.Group();
        holder.position.set(side * 4.85, 1.02, -3.1 + i * 2.75);
        holder.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
        var o = inst(g.banner);
        holder.add(o); root.add(holder);
        for (var k = 0; k < 2; k++) {
          var rib = new T.Mesh(new T.PlaneGeometry(.11, 1.30), MAT.hemp);
          rib.position.set((k - .5) * .30, -.36, .05);
          rib.rotation.z = k ? -.20 : .20;
          rib.rotation.x = -.26;
          holder.add(rib);
        }
        var idx = (side > 0 ? 3 : 0) + i;
        o.traverse(function (n) { if (n.isMesh) n.userData.hit = "banners"; });
        R.banners.push({ holder: holder, obj: o, cur: order[idx], target: targetOrder[idx] });
        R.hitTargets.push(o);
      }
    }

    // 两扇柜门：pivot 在左铰链边（GLB 铰链实测在左、铜环在右）
    [[-4.15, -5.45], [4.15, -5.45]].forEach(function (p, i) {
      var pivot = new T.Group();
      pivot.position.set(p[0] - .72, 0, p[1] + .24);
      var o = inst(g.door);
      o.position.x = .72;
      pivot.add(o); root.add(pivot);
      o.traverse(function (n) { if (n.isMesh) n.userData.hit = "doors"; });
      R.doors.push({ pivot: pivot, obj: o, open: i === 0 });
      R.hitTargets.push(o);
    });

    // 香炉（案侧小几，Ø0.5 m，可移走 / 放回）+ 贴地流动的香烟
    var c = inst(g.censer);
    c.position.set(1.55, .62, .95);
    root.add(c);
    box(root, .62, .62, .62, 1.55, .31, .95, MAT.darkWood);
    var smoke = new T.Group();
    [-1, 0, 1].forEach(function (k) {
      var s = new T.Mesh(new T.PlaneGeometry(.32, 1.15), MAT.smoke);
      s.position.set(k * .10, 1.28 + k * .08, .95);
      s.rotation.y = k * .5;
      smoke.add(s);
    });
    root.add(smoke); R.smoke = smoke;
    c.traverse(function (n) { if (n.isMesh) n.userData.hit = "censer"; });
    R.censer = c; R.hitTargets.push(c);

    // 案上三卷册（0.42 × 0.19 × 0.35 m，朝向可变）
    [-.72, 0, .72].forEach(function (dx, i) {
      var pivot = new T.Group(); pivot.position.set(dx, .85, .95);
      var o = inst(g.ledger);
      pivot.add(o); root.add(pivot);
      o.traverse(function (n) { if (n.isMesh) n.userData.hit = "ledgers"; });
      R.ledgers.push({ pivot: pivot, obj: o, cur: i === 1 ? 1 : 0 });
      R.hitTargets.push(o);
    });

    return R;
  }

  // —— 把差异状态应用到场景（镜中渲染会临时切到 TARGET 再切回）——
  function applyState(R, s) {
    R.candles.forEach(function (c, i) {
      c.pivot.rotation.y = c.base + (s.candle ? Math.PI / 2 : 0) + (s.candle ? 0 : (i % 2 ? .32 : -.18));
    });
    R.banners.forEach(function (b) {
      var v = s.banner ? b.target : b.cur;
      b.obj.scale.set(1, .84 + v * .13, 1);
      b.holder.position.y = 1.02 + (s.banner ? 0 : v * .12);
    });
    R.doors.forEach(function (d) {
      d.pivot.rotation.y = s.door ? (d.open ? -Math.PI * .46 : Math.PI * .46) : 0;
    });
    if (R.censer) R.censer.visible = !!s.censer;
    if (R.smoke) R.smoke.visible = !!s.censer;
    R.ledgers.forEach(function (l, i) {
      l.pivot.rotation.y = (s.ledger ? 0 : (i === 1 ? Math.PI : Math.PI * .5));
    });
  }

  window.HallScene = {
    KEYS: KEYS, DIFFS: DIFFS, TARGET: TARGET, SCRAMBLE: SCRAMBLE,
    state: state, MAT: MAT, assetBase: BASE, MIRROR: MIRROR,
    buildArchitecture: buildArchitecture,
    buildLights: buildLights,
    loadAssets: loadAssets,
    placeAssets: placeAssets,
    applyState: applyState,
    makeMirrorOnly: makeMirrorOnly,
    inst: inst,
    FILES: FILES
  };
})();
