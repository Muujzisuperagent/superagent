/* 第一殿 · 孽镜台 — 渲染 / 交互 / 旧景画幅 */
(function () {
  "use strict";
  var T = window.THREE, H = window.HallScene;
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  var renderer, scene, camera, controls, root, R, lights;
  var rt, mirrorCam, mirrorDisc, crackDisc, hairlineDisc, mirrorFill, sealMesh,
      mirrorDirty = false, mirrorOn = true;
  var won = false, sealT = -1, toastTimer = null;
  var raycaster = new T.Raycaster(), pointer = new T.Vector2();
  var MIRROR = H.MIRROR || { x: 0, y: 2.02, z: -0.76, r: 0.94 };
  var Q = location.search;
  var LITE = /lite=1/.test(Q), DEBUG = /debug=1/.test(Q);
  // v7.3 两厅串联：?from=prologue=1 表示玩家是从序厅点香、穿过门走进来的。
  // 只影响两句承接对白与一个「回到便民司」按钮，不碰渲染 / 解谜 / 出图参数。
  var FROM_PROLOGUE = /from=prologue/.test(Q);
  var CARRY_PROBE = /carryprobe=1/.test(Q);
  // 自测：把串联态写进 title，供无头 dump-dom 直接读取（不改任何游戏状态）
  function carryTitle(tag) {
    if (!CARRY_PROBE) return;
    document.title = "CARRY " + (tag || "-") +
      " from=" + FROM_PROLOGUE +
      " carryIn=" + (!!$("#carryIn") && $("#carryIn").classList.contains("on")) +
      " won=" + won +
      " toPrologue=" + (!!$("#toPrologue") && $("#toPrologue").classList.contains("on"));
  }
  var frame = 0, idle = 0;

  // —— 旧景画幅：点镜子时定格「进门之前」的殿，作为屏幕空间的一幅画浮出 ——
  // 不贴在镜面几何上，从任何角度看都是正对玩家的一幅画，不会随镜面透视穿帮。
  var VISION = { w: 960, h: 600 };
  var visionOpen = false, visionLayout = null, visionSnap = null;
  var mistGroup = null, mistT = 0, mistImgA = null, mistImgB = null, fogImg = null;
  var MIST_OFF = /mist=0/.test(Q), CLEAN = /clean=1/.test(Q);
  // 默认「无提示」：不给圈、不给对照、不报差几处；?hints=1 才恢复，供内部复核
  var HINTS = /hints=1/.test(Q);
  var MARK_ANCHORS = [
    { key: "candle", p: [-2.00, 1.05, -0.60] },
    { key: "banner", p: [-4.60, 1.55, -0.35] },
    { key: "door",   p: [-3.90, 1.20, -5.35] },
    { key: "censer", p: [ 1.55, 0.85,  0.95] },
    { key: "ledger", p: [ 0.00, 1.00,  0.95] }
  ];
  // 0 = 实景初始（打乱），1 = 镜中（进门之前）
  var STATE_TEXT = {
    candle: ["斜向错开", "一律转正"],
    banner: ["原挂序 · 错落", "镜中序 · 齐整"],
    door:   ["两扇合拢", "一扇半开"],
    censer: ["香炉不在", "香炉在案"],
    ledger: ["卷册侧转", "卷册朝正"]
  };

  // —— 键盘漫游：WASD / 方向键沿地面走，Q/E 升降，Shift 加速，R 复位 ——
  var keys = Object.create(null), lastWalkT = 0;
  var WALK = { minX: -5.35, maxX: 5.35, minZ: -5.35, maxZ: 5.35,
               minY: .95, maxY: 2.85 };

  // 整幕是静态场景：静止时不重绘，只在视角/状态变化时跑一小段阻尼帧。
  function invalidate(n) { idle = Math.max(idle, n || 26); }

  function dbg(txt) {
    if (!DEBUG) return;
    var el = $("#dbg");
    if (!el) {
      el = document.createElement("div"); el.id = "dbg";
      el.style.cssText = "position:fixed;left:16px;bottom:16px;z-index:40;padding:9px 12px;" +
        "background:#10171a;border:1px solid #4a6;color:#cfe;font:11px/1.6 monospace;white-space:pre";
      document.body.appendChild(el);
    }
    el.textContent = txt;
  }
  window.addEventListener("error", function (e) {
    dbg("JS ERROR: " + e.message + "\n" + (e.filename || "") + ":" + e.lineno);
  });

  function loadTxt(t) { $("#loadTxt").textContent = t; }
  function fail(msg) {
    $(".ring").style.display = "none";
    $("#loadTitle").textContent = "场景未能启动";
    $("#loadTxt").innerHTML = msg;
  }
  function toast(main, sub) {
    var el = $("#toast");
    el.innerHTML = main + (sub ? "<small>" + sub + "</small>" : "");
    el.classList.add("on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("on"); }, 2600);
  }

  // ——— v7.4：第一殿开场旁白 ———
  // 台词全部出自《还魂路引 · 阴曹地府密室剧本》「第一殿 · 秦广王｜孽镜台」段，
  // 少量衔接句按剧本设定改写并标注「衔接」。纯 DOM 字幕，不往场景里贴图写字。
  // 自动播一遍；点字幕可推进；「重听旁白」按钮可重播。clean 出图一律不播不显。
  var INTRO = [
    { text: "第一殿，秦广王座下 · 孽镜台。", src: "剧本 · 第一殿 孽镜台" },
    { text: "孽镜照见一生善恶，无可抵赖。可这面镜子不映人，只映这座殿。",
      src: "剧本 · 考据 / 场景（照胆镜传说）" },
    { text: "镜中是「你进门之前」的模样，与眼前有五处不同——把它们摆回镜中样子，镜面才肯裂开。",
      src: "剧本 · 谜题 / 中式语法（对照勘验）" },
    { text: "镜碎那刻，你会拿到第一枚半印，和第一桩证据：你死时，房里空无一人。",
      src: "剧本 · 产出（半印① + 证据 A）" }
  ];
  var INTRO_PROBE = /introprobe=1/.test(Q);
  var introIdx = -1, introTimer = null;
  function introShow(i) {
    var el = $("#intro");
    if (!el) return;
    if (i >= INTRO.length) { introHide(); return; }
    introIdx = i;
    el.querySelector(".intro-text").textContent = INTRO[i].text;
    el.querySelector(".intro-src").textContent = INTRO[i].src;
    el.classList.add("on");
    clearTimeout(introTimer);
    if (!INTRO_PROBE) {
      introTimer = setTimeout(function () { introShow(i + 1); }, 4600);
    }
  }
  function introHide() {
    var el = $("#intro");
    if (el) el.classList.remove("on");
    clearTimeout(introTimer);
    introIdx = -1;
  }
  function introStart() {
    if (CLEAN) return;                 // clean 出图不播不显，13 张定稿图不受影响
    introShow(0);
  }
  function introNext() {
    if (introIdx < 0) return;
    introShow(introIdx + 1);
  }

  // —— 镜面 / 裂纹贴图 ——
  function crackTexture() {
    var c = document.createElement("canvas"); c.width = c.height = 512;
    var g = c.getContext("2d");
    g.clearRect(0, 0, 512, 512);
    g.strokeStyle = "rgba(226,240,232,.9)"; g.lineWidth = 2.4;
    var paths = [
      [[256, 40], [238, 168], [268, 246], [244, 360], [262, 470]],
      [[238, 168], [140, 208], [72, 190]],
      [[268, 246], [372, 226], [452, 268]],
      [[244, 360], [160, 396], [96, 440]],
      [[268, 246], [330, 330], [402, 348]]
    ];
    paths.forEach(function (p) {
      g.beginPath(); g.moveTo(p[0][0], p[0][1]);
      for (var i = 1; i < p.length; i++) g.lineTo(p[i][0], p[i][1]);
      g.stroke();
    });
    g.strokeStyle = "rgba(150,210,190,.45)"; g.lineWidth = 6;
    g.beginPath(); g.moveTo(256, 40); g.lineTo(262, 470); g.stroke();
    var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t;
  }

  // 常驻细裂纹：队友 v3「镜面布满细小裂纹」——初始就有，不是解谜后才出现
  function fineCrackTexture() {
    var c = document.createElement("canvas"); c.width = c.height = 512;
    var g = c.getContext("2d");
    g.clearRect(0, 0, 512, 512);
    var s = 20261113;
    function rr() { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }
    for (var i = 0; i < 34; i++) {
      var x = 40 + rr() * 432, y = 40 + rr() * 432;
      g.strokeStyle = "rgba(214,232,222," + (.10 + rr() * .26) + ")";
      g.lineWidth = .6 + rr() * 1.1;
      g.beginPath(); g.moveTo(x, y);
      for (var k = 0; k < 3 + (rr() * 3 | 0); k++) {
        x += (rr() - .5) * 90; y += (rr() - .5) * 90;
        g.lineTo(x, y);
      }
      g.stroke();
    }
    var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t;
  }

  // 暗青铜镜面：不映殿，只有浮锈、云雾与一圈淡符印（提示可点）
  function darkMirrorTexture() {
    var c = document.createElement("canvas"); c.width = c.height = 512;
    var g = c.getContext("2d");
    var gr = g.createRadialGradient(256, 226, 26, 256, 256, 272);
    gr.addColorStop(0, "#1d3733"); gr.addColorStop(.55, "#102320"); gr.addColorStop(1, "#060e0d");
    g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
    var s = 20261114;
    function rr() { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }
    for (var i = 0; i < 110; i++) {
      g.fillStyle = "rgba(150,190,172," + (.010 + rr() * .028) + ")";
      g.beginPath(); g.arc(rr() * 512, rr() * 512, 10 + rr() * 72, 0, Math.PI * 2); g.fill();
    }
    g.strokeStyle = "rgba(150,196,176,.19)"; g.lineWidth = 2;
    g.beginPath(); g.arc(256, 256, 106, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = "rgba(150,196,176,.10)"; g.lineWidth = 1;
    g.beginPath(); g.arc(256, 256, 124, 0, Math.PI * 2); g.stroke();
    for (var k = 0; k < 8; k++) {
      var a = k / 8 * Math.PI * 2;
      g.strokeStyle = "rgba(160,200,182,.15)"; g.lineWidth = 2;
      g.beginPath();
      g.moveTo(256 + Math.cos(a) * 94, 256 + Math.sin(a) * 94);
      g.lineTo(256 + Math.cos(a) * 116, 256 + Math.sin(a) * 116);
      g.stroke();
    }
    var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t;
  }

  // —— 云气纹理：全部程序化生成，零外部图片、零积分 ——
  // 大团 + 细缕叠加，再描几笔中国式卷云气（如意云头），比纯噪声更像「阴气」。
  function makeMistDataURL(seed, cool) {
    var w = 512, h = 320, c = document.createElement("canvas");
    c.width = w; c.height = h;
    var g = c.getContext("2d");
    var s = seed;
    function rr() { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }
    var tint = cool ? "122,178,170" : "150,200,182";
    g.globalCompositeOperation = "lighter";
    function puff(x, y, r, a) {
      var gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, "rgba(" + tint + "," + a + ")");
      gr.addColorStop(.45, "rgba(" + tint + "," + (a * .42) + ")");
      gr.addColorStop(1, "rgba(" + tint + ",0)");
      g.fillStyle = gr;
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
    // 少而淡的大团 + 多而细的云缕：避免出现一块发灰的「污渍」
    for (var i = 0; i < 9; i++) puff(rr() * w, 40 + rr() * (h - 80), 52 + rr() * 96, .028 + rr() * .038);
    for (var j = 0; j < 46; j++) puff(rr() * w, rr() * h, 18 + rr() * 58, .026 + rr() * .038);
    g.globalCompositeOperation = "source-over";
    g.lineWidth = 1.2;
    for (var k = 0; k < 14; k++) {
      var x0 = rr() * w, y0 = rr() * h, len = 50 + rr() * 140;
      g.strokeStyle = "rgba(" + tint + "," + (.055 + rr() * .07) + ")";
      g.beginPath(); g.moveTo(x0, y0);
      g.bezierCurveTo(x0 + len * .3, y0 - 18 - rr() * 22,
                      x0 + len * .7, y0 + 16 + rr() * 22, x0 + len, y0 - 6);
      g.stroke();
      g.beginPath(); g.arc(x0 + len, y0 - 6, 5 + rr() * 7, .2, Math.PI * 1.7); g.stroke();
    }
    return c.toDataURL("image/png");
  }

  // v6 满屏浓雾：比画幅云气大一档、厚一档，照镜时把整个视野吞进去
  function makeFogDataURL() {
    var w = 768, h = 480, c = document.createElement("canvas");
    c.width = w; c.height = h;
    var g = c.getContext("2d");
    var s = 202611151;
    function rr() { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }
    g.globalCompositeOperation = "lighter";
    function puff(x, y, r, a, tint) {
      var gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, "rgba(" + tint + "," + a + ")");
      gr.addColorStop(.42, "rgba(" + tint + "," + (a * .52) + ")");
      gr.addColorStop(1, "rgba(" + tint + ",0)");
      g.fillStyle = gr;
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
    // 大团底雾：整幅铺满，不留干净的空地
    for (var i = 0; i < 26; i++) {
      puff(rr() * w, rr() * h, 110 + rr() * 210,
           .09 + rr() * .13, i % 3 ? "138,186,172" : "170,212,196");
    }
    // 中团翻涌
    for (var j = 0; j < 70; j++) {
      puff(rr() * w, rr() * h, 45 + rr() * 115,
           .075 + rr() * .11, j % 4 ? "150,198,182" : "186,222,206");
    }
    // 云团之间擦出蜿蜒雾隙：不然会糊成一层均匀灰纱，看不出翻涌
    g.globalCompositeOperation = "destination-out";
    for (var v = 0; v < 18; v++) {
      var vx = rr() * w, vy = rr() * h, vr = 42 + rr() * 130;
      var vg = g.createRadialGradient(vx, vy, 0, vx, vy, vr);
      vg.addColorStop(0, "rgba(0,0,0," + (.16 + rr() * .30) + ")");
      vg.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = vg;
      g.beginPath(); g.arc(vx, vy, vr, 0, Math.PI * 2); g.fill();
    }
    // 卷云长缕：中国式云头，横向流动
    g.globalCompositeOperation = "source-over";
    for (var k = 0; k < 26; k++) {
      var x0 = -40 + rr() * w, y0 = rr() * h, len = 130 + rr() * 300;
      g.strokeStyle = "rgba(166,210,194," + (.035 + rr() * .065) + ")";
      g.lineWidth = 1.4 + rr() * 2.6;
      g.beginPath(); g.moveTo(x0, y0);
      g.bezierCurveTo(x0 + len * .32, y0 - 24 - rr() * 34,
                      x0 + len * .68, y0 + 22 + rr() * 34, x0 + len, y0 - 8);
      g.stroke();
      g.beginPath(); g.arc(x0 + len, y0 - 8, 7 + rr() * 13, .15, Math.PI * 1.75); g.stroke();
    }
    return c.toDataURL("image/png");
  }

  // 雾中浮尘 / 冷烬：细小光点，缓慢上飘（CSS 平铺 + 平移）
  function makeMoteDataURL() {
    var s = 256, c = document.createElement("canvas");
    c.width = c.height = s;
    var g = c.getContext("2d"), q = 991733;
    function rr() { q = (q * 1664525 + 1013904223) % 4294967296; return q / 4294967296; }
    for (var i = 0; i < 150; i++) {
      var x = rr() * s, y = rr() * s, r = .5 + rr() * 1.9;
      g.fillStyle = "rgba(190,226,210," + (.10 + rr() * .45) + ")";
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
      if (rr() < .12) {
        g.strokeStyle = "rgba(172,214,198,.16)"; g.lineWidth = .8;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rr() - .5) * 14, y - 6 - rr() * 16); g.stroke();
      }
    }
    return c.toDataURL("image/png");
  }

  // 时空涟漪：从镜心荡开的一圈圈水纹，只在照镜瞬间明显
  function makeRippleDataURL() {
    var s = 512, c = document.createElement("canvas");
    c.width = c.height = s;
    var g = c.getContext("2d"), cx = s / 2, cy = s / 2;
    g.clearRect(0, 0, s, s);
    for (var k = 0; k < 7; k++) {
      var rad = 30 + k * 33;
      g.strokeStyle = "rgba(178,220,204," + (.30 - k * .032) + ")";
      g.lineWidth = k === 0 ? 5 : 2.4 + (k % 2) * 1.4;
      g.beginPath(); g.ellipse(cx, cy, rad, rad * .92, 0, 0, Math.PI * 2); g.stroke();
      g.strokeStyle = "rgba(120,178,158,.10)";
      g.lineWidth = 8;
      g.beginPath(); g.ellipse(cx, cy, rad + 7, rad * .92 + 7, 0, 0, Math.PI * 2); g.stroke();
    }
    var gr = g.createRadialGradient(cx, cy, 0, cx, cy, 90);
    gr.addColorStop(0, "rgba(196,232,216,.28)");
    gr.addColorStop(1, "rgba(150,200,182,0)");
    g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, 90, 0, Math.PI * 2); g.fill();
    return c.toDataURL("image/png");
  }

  // v6 整幅雾边遮罩：罩在 #visionFrame 上，连云气层／题头一起啃出雾边。
  // 只放到 #visionImage 上时，遮罩外的 veil / drift 会把边缘重新补成硬矩形。
  function makeFrameMaskDataURL() {
    var w = 512, h = 320, c = document.createElement("canvas");
    c.width = w; c.height = h;
    var g = c.getContext("2d");
    g.fillStyle = "#fff"; g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = "destination-out";
    var s = 202611156;
    function rr() { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }
    function fade(x0, y0, x1, y1, x, y, ww, hh, a) {
      var gr = g.createLinearGradient(x0, y0, x1, y1);
      gr.addColorStop(0, "rgba(0,0,0," + a + ")");
      gr.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = gr; g.fillRect(x, y, ww, hh);
    }
    fade(0, 0, 0, 14, 0, 0, w, 14, .24);            // 上：极轻，保住题头
    fade(0, h, 0, h - 22, 0, h - 22, w, 22, .50);
    fade(0, 0, 42, 0, 0, 0, 42, h, .66);            // 左右：雾边，但保住画幅轮廓
    fade(w, 0, w - 42, 0, w - 42, 0, 42, h, .66);
    for (var i = 0; i < 72; i++) {
      var edge = i % 4, x, y;
      if (edge === 0) { x = rr() * w; y = -6 + rr() * 40; }
      else if (edge === 1) { x = rr() * w; y = h + 6 - rr() * 40; }
      else if (edge === 2) { x = -6 + rr() * 78; y = rr() * h; }
      else { x = w + 6 - rr() * 78; y = rr() * h; }
      var rad = 38 + rr() * 78;
      var gr = g.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, "rgba(0,0,0," + (.10 + rr() * .20) + ")");
      gr.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = gr;
      g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
    }
    g.globalCompositeOperation = "source-over";
    return c.toDataURL("image/png");
  }

  // 边缘遮罩：四边羽化 + 云团啃出不规则缺口，画幅不再是一块死板矩形
  function makeEdgeMaskDataURL() {
    var w = 512, h = 320, c = document.createElement("canvas");
    c.width = w; c.height = h;
    var g = c.getContext("2d");
    g.fillStyle = "#fff"; g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = "destination-out";
    var s = 20261115;
    function rr() { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }
    function fade(x0, y0, x1, y1, x, y, ww, hh) {
      var gr = g.createLinearGradient(x0, y0, x1, y1);
      gr.addColorStop(0, "rgba(0,0,0,.72)");
      gr.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = gr; g.fillRect(x, y, ww, hh);
    }
    fade(0, 0, 0, 40, 0, 0, w, 40);
    fade(0, h, 0, h - 40, 0, h - 40, w, 40);
    // 左右啃得更深：上下有题头/对照条压着，雾边主要靠两侧读出来
    fade(0, 0, 44, 0, 0, 0, 44, h);
    fade(w, 0, w - 44, 0, w - 44, 0, 44, h);
    // 大尺度、低对比的云团起伏：只让边缘柔和地凹凸，不擦出孤立的小黑斑
    for (var i = 0; i < 44; i++) {
      var edge = i % 4, x, y;
      if (edge === 0) { x = rr() * w; y = -8 + rr() * 52; }
      else if (edge === 1) { x = rr() * w; y = h + 8 - rr() * 52; }
      else if (edge === 2) { x = -8 + rr() * 70; y = rr() * h; }
      else { x = w + 8 - rr() * 70; y = rr() * h; }
      var rad = 40 + rr() * 70;
      var gr = g.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, "rgba(0,0,0," + (.12 + rr() * .22) + ")");
      gr.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = gr;
      g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
    }
    g.globalCompositeOperation = "source-over";
    return c.toDataURL("image/png");
  }

  // 3D 镜前雾片的贴图：软团云，加色混合
  function mistSpriteTexture() {
    var c = document.createElement("canvas"); c.width = c.height = 256;
    var g = c.getContext("2d");
    g.globalCompositeOperation = "lighter";
    var s = 912371;
    function rr() { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }
    for (var i = 0; i < 34; i++) {
      var x = 40 + rr() * 176, y = 40 + rr() * 176, r = 22 + rr() * 78;
      var gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, "rgba(168,214,194," + (.055 + rr() * .075) + ")");
      gr.addColorStop(.5, "rgba(130,180,164," + (.02 + rr() * .035) + ")");
      gr.addColorStop(1, "rgba(90,140,126,0)");
      g.fillStyle = gr;
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
    var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t;
  }

  function setupVisionTextures() {
    var a = makeMistDataURL(202611151, false);
    var b = makeMistDataURL(773311902, true);
    var m = makeEdgeMaskDataURL();
    var fog = makeFogDataURL();
    var L = $("#visionLayer");
    if (L) {
      L.style.setProperty("--mistA", "url('" + a + "')");
      L.style.setProperty("--mistB", "url('" + b + "')");
      L.style.setProperty("--edgeMask", "url('" + m + "')");
      L.style.setProperty("--frameMask", "url('" + makeFrameMaskDataURL() + "')");
      L.style.setProperty("--fogTex", "url('" + fog + "')");
      L.style.setProperty("--moteTex", "url('" + makeMoteDataURL() + "')");
      L.style.setProperty("--rippleTex", "url('" + makeRippleDataURL() + "')");
    }
    // 导出 PNG 时把云气也合成进去
    mistImgA = new Image(); mistImgA.src = a;
    mistImgB = new Image(); mistImgB.src = b;
    fogImg = new Image(); fogImg.src = fog;
  }

  function setupMirrorMist() {
    mistGroup = new T.Group(); root.add(mistGroup);
    var tex = mistSpriteTexture(), s = 447711;
    function rr() { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }
    // v6：雾片从 7 增到 16，铺满镜前并向外漫，配合满屏穿越雾
    for (var i = 0; i < 16; i++) {
      var sp = new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true,
        opacity: 0, depthWrite: false, blending: T.AdditiveBlending, color: 0xa8cdb9 }));
      sp.userData = { dx: (rr() - .5) * 4.4, dy: (rr() - .5) * 2.6,
                      s0: 1.1 + rr() * 1.7, rot: rr() * Math.PI * 2,
                      spin: (rr() - .5) * 1.1, a: .65 + rr() * .35 };
      mistGroup.add(sp);
    }
    mistGroup.visible = false;
  }

  function startMistBurst() {
    // 出图模式跳过：7 片加色雾 sprite 连跑 160 帧，SwiftShader 下会拖垮无头截图；
    // 且画幅盖住镜面，这层雾对成图几乎没贡献。正常游玩时照常涌出。
    if (!mistGroup || MIST_OFF || CLEAN) return;
    mistT = 0;
    mistGroup.visible = true;
    invalidate(160);
  }

  // 雾片从镜心向外飘、上浮、放大再淡出；只在照镜后的 2.4 秒里占渲染帧
  function stepMist(dt) {
    if (!mistGroup || !mistGroup.visible) return;
    mistT += dt;
    var k = mistT / 2.4;
    if (k >= 1) { mistGroup.visible = false; return; }
    mistGroup.children.forEach(function (sp) {
      var u = sp.userData;
      sp.position.set(MIRROR.x + u.dx * k * 1.25,
                      MIRROR.y + u.dy * k * .85 + k * .22,
                      MIRROR.z + .17 + k * .18);
      var sc = u.s0 * (.42 + k * 2.05);
      sp.scale.set(sc, sc * .74, 1);
      sp.material.rotation = u.rot + k * u.spin;
      sp.material.opacity = u.a * Math.sin(Math.PI * Math.min(1, k * 1.3)) * .62;
    });
    invalidate(2);
  }

  // 每次照镜重新起雾：强制 reflow 让 CSS 动画从头播一次
  function restartVisionAnimation() {
    ["#visionFrame", "#visionCanvas", "#visionMist", "#visionBurst",
     "#visionDim", "#visionFog", "#visionRipple", "#visionMotes", "#visionDrift"].forEach(function (sel) {
      var e = $(sel);
      if (!e) return;
      e.style.animation = "none";
      void e.offsetWidth;
      e.style.animation = "";
    });
  }

  function setupMirror() {
    rt = new T.WebGLRenderTarget(VISION.w, VISION.h,
      { minFilter: T.LinearFilter, magFilter: T.LinearFilter });
    rt.texture.encoding = T.sRGBEncoding;      // 与主输出一致，画幅不偏色
    // 旧景不是「镜像」，不做水平翻转：与照镜当刻同机位同朝向，才看得清差异
    mirrorCam = new T.PerspectiveCamera(70, VISION.w / VISION.h, .05, 80);

    // 只在旧景渲染时点亮的补光，不影响实景的低调布光
    mirrorFill = new T.AmbientLight(0xa8c8bb, 1.15);
    mirrorFill.visible = false;
    scene.add(mirrorFill);

    // 镜面本体：暗青铜，不再贴任何房间画面
    mirrorDisc = new T.Mesh(
      new T.CircleGeometry(MIRROR.r, 64),
      new T.MeshBasicMaterial({ map: darkMirrorTexture(), color: 0xffffff })
    );
    mirrorDisc.position.set(MIRROR.x, MIRROR.y, MIRROR.z);
    mirrorDisc.renderOrder = 3;
    root.add(mirrorDisc);

    // 细裂纹常驻镜面；解谜成功后叠加一道粗裂
    hairlineDisc = new T.Mesh(
      new T.CircleGeometry(MIRROR.r, 64),
      new T.MeshBasicMaterial({ map: fineCrackTexture(), transparent: true,
                                opacity: .30, depthWrite: false })
    );
    hairlineDisc.position.set(MIRROR.x, MIRROR.y, MIRROR.z + .004);
    hairlineDisc.renderOrder = 4;
    root.add(hairlineDisc);

    crackDisc = new T.Mesh(
      new T.CircleGeometry(MIRROR.r, 64),
      new T.MeshBasicMaterial({ map: crackTexture(), transparent: true,
                                opacity: .95, depthWrite: false })
    );
    crackDisc.position.set(MIRROR.x, MIRROR.y, MIRROR.z + .006);
    crackDisc.renderOrder = 5;
    crackDisc.visible = false;
    root.add(crackDisc);

    // 画幅内容用 DOM canvas 呈现（见 paintVisionCanvas），不参与 WebGL 合成，
    // 因此从任何角度看都是屏幕空间的一幅画，不会贴在镜面上。
    var cv = $("#visionCanvas");
    if (cv) { cv.width = VISION.w; cv.height = VISION.h; }
    setupVisionTextures();
    setupMirrorMist();
  }

  // 离屏渲染「进门之前」：状态临时切到 TARGET，用照镜当刻的机位定格
  function renderVision() {
    if (!visionOpen || !mirrorDirty || !mirrorOn || !R) return;
    mirrorDirty = false;
    crackDisc.visible = false;
    H.applyState(R, H.TARGET);
    mirrorFill.visible = true;
    if (R.mirrorOnly) R.mirrorOnly.visible = true;   // 镜中有、实景无的绣花鞋

    mirrorCam.position.copy(visionSnap.p);
    mirrorCam.quaternion.copy(visionSnap.q);
    mirrorCam.fov = camera.fov;
    mirrorCam.aspect = VISION.w / VISION.h;
    mirrorCam.updateProjectionMatrix();

    // 镜前涌雾只属于「现在」，别把它拍进旧景画幅里遮住五处差异
    var mistWas = mistGroup && mistGroup.visible;
    if (mistGroup) mistGroup.visible = false;
    renderer.setRenderTarget(rt);
    renderer.clear();
    renderer.render(scene, mirrorCam);
    renderer.setRenderTarget(null);
    if (mistGroup) mistGroup.visible = mistWas;

    if (DEBUG) {
      // 抽样离屏纹理中心，确认旧景不是黑屏
      var buf = new Uint8Array(4);
      try {
        renderer.readRenderTargetPixels(rt, VISION.w >> 1, VISION.h >> 1, 1, 1, buf);
        window.__rtSample = Array.from(buf);
      } catch (e) { window.__rtSample = "err:" + e.message; }
    }

    mirrorFill.visible = false;
    if (R.mirrorOnly) R.mirrorOnly.visible = false;
    H.applyState(R, H.state);                      // 切回实景
    crackDisc.visible = won;
    paintVisionCanvas();
    updateMarkers();
  }

  // 把离屏结果读进 DOM canvas（WebGL 原点在左下，需要逐行翻转）；
  // 顺带轻微提亮，让「过去」的殿像蒙了一层冷光，五处差异更醒目。
  function paintVisionCanvas() {
    var cv = $("#visionCanvas");
    if (!cv) return;
    var w = VISION.w, h = VISION.h, row = w * 4;
    var buf = new Uint8Array(w * h * 4);
    try {
      renderer.readRenderTargetPixels(rt, 0, 0, w, h, buf);
    } catch (e) { return; }
    var g = cv.getContext("2d");
    var img = g.createImageData(w, h);
    for (var y = 0; y < h; y++) {
      img.data.set(buf.subarray((h - 1 - y) * row, (h - y) * row), y * row);
    }
    for (var i = 0; i < img.data.length; i += 4) {
      for (var c = 0; c < 3; c++) {
        var v = img.data[i + c] / 255;
        img.data[i + c] = Math.min(255, Math.round(Math.pow(v, .82) * 255 * 1.14));
      }
    }
    g.putImageData(img, 0, 0);
  }

  function layoutVision() {
    var W = innerWidth, H = innerHeight;
    var ratio = VISION.w / VISION.h;
    var w = Math.min(W * .58, 840), h = w / ratio;
    var maxH = H - 170;
    if (h > maxH) { h = maxH; w = h * ratio; }
    // 有右侧面板时略偏左避让；clean 出图时面板隐藏，画幅正中
    var offset = document.body.classList.contains("clean") ? 0 : Math.min(70, W * .05);
    var left = Math.max(18, Math.round((W - w) / 2 - offset));
    var top = Math.max(66, Math.round((H - h) / 2 - 16));
    var f = $("#visionFrame");
    if (f) {
      f.style.left = left + "px"; f.style.top = top + "px";
      f.style.width = Math.round(w) + "px"; f.style.height = Math.round(h) + "px";
    }
    // 外溢的雾比画幅大一圈，看起来是「从镜里漫出来」而非一块弹窗
    var a = $("#visionAura"), pad = 96;
    if (a) {
      a.style.left = (left - pad) + "px"; a.style.top = (top - pad) + "px";
      a.style.width = (Math.round(w) + pad * 2) + "px";
      a.style.height = (Math.round(h) + pad * 2) + "px";
    }
    // WebGL viewport 原点在左下，DOM 在左上
    visionLayout = { x: left, y: H - top - Math.round(h),
                     w: Math.round(w), h: Math.round(h),
                     cssW: Math.round(w), cssH: Math.round(h) };
    invalidate(8);
  }

  // 五项对照：镜中固定是 1，实景随玩家切换
  function renderCompare() {
    var el = $("#visionCompare");
    if (!el || !HINTS) return;
    var CN = ["一", "二", "三", "四", "五"];
    el.innerHTML = H.DIFFS.map(function (d, i) {
      var ok = H.state[d.key] === H.TARGET[d.key];
      var t = STATE_TEXT[d.key];
      return '<div class="vc' + (ok ? " ok" : "") + '">' +
        '<span class="vcn">' + CN[i] + '</span>' +
        '<span class="vcl">' + d.label + '</span>' +
        '<span class="vcs">镜中 ' + t[1] + '<br>实景 ' + t[H.state[d.key] ? 1 : 0] + '</span>' +
        '<span class="vcst">' + (ok ? "合" : "不合") + '</span></div>';
    }).join("");
  }

  // 画幅里的五个位置圈：用定格相机投影，随画幅缩放对齐
  function updateMarkers() {
    var layer = $("#visionMarkers");
    if (!layer || !HINTS || !visionLayout || !visionSnap) return;
    var w = visionLayout.cssW, h = visionLayout.cssH;
    var CN = ["一", "二", "三", "四", "五"];
    layer.innerHTML = MARK_ANCHORS.map(function (a, i) {
      var v = new T.Vector3(a.p[0], a.p[1], a.p[2]).project(mirrorCam);
      var x = (v.x * .5 + .5) * w, y = (.5 - v.y * .5) * h;
      var ok = H.state[a.key] === H.TARGET[a.key];
      var vis = v.z < 1 && x > 12 && x < w - 12 && y > 42 && y < h - 86;
      return '<div class="vm' + (ok ? " ok" : "") + '" style="left:' + x.toFixed(1) +
             'px;top:' + y.toFixed(1) + 'px;display:' + (vis ? "grid" : "none") +
             '">' + CN[i] + '</div>';
    }).join("");
  }

  function toggleVision(force) {
    if (!mirrorOn) { toast("旧景未启用", "软渲染诊断模式关了照镜"); return; }
    visionOpen = (typeof force === "boolean") ? force : !visionOpen;
    document.body.classList.toggle("vision", visionOpen);
    if (!visionOpen) document.body.classList.remove("peek");
    var b = $("#toggleMirror");
    if (b) {
      b.textContent = visionOpen ? "收起旧景" : "照镜 · 看进门之前";
      b.classList.toggle("on", visionOpen);
    }
    if (visionOpen) {
      // 定格照镜当刻的机位：画幅是「过去的一张画」，之后走动不跟着转
      visionSnap = { p: camera.position.clone(), q: camera.quaternion.clone() };
      layoutVision();
      renderCompare();
      mirrorDirty = true;
      restartVisionAnimation();     // 雾重新起一次
      startMistBurst();             // 3D 镜前也涌出一团
    }
    invalidate(30);
  }

  // —— UI ——
  function renderDiffList() {
    $("#diffList").innerHTML = H.DIFFS.map(function (d, i) {
      var ok = H.state[d.key] === H.TARGET[d.key];
      return '<button class="diff' + (ok ? " ok" : "") + '" data-key="' + d.key + '">' +
        '<span class="no">' + ["一", "二", "三", "四", "五"][i] + '</span>' +
        '<span class="txt">' + d.label + '<small>' + d.sub + '</small></span>' +
        '<span class="st">' + (ok ? "合" : "不合") + '</span></button>';
    }).join("");
    $$("#diffList .diff").forEach(function (el) {
      el.addEventListener("click", function () { toggle(el.dataset.key); });
    });
  }
  function check() {
    var n = H.KEYS.filter(function (k) { return H.state[k] === H.TARGET[k]; }).length;
    var v = $("#verdict");
      if (n === 5) {
      if (!won) {
        won = true;
        crackDisc.visible = true;
        toast("镜面「咔」地裂开一道细纹", "半印① 从镜后落下 · 形已核");
        sealT = 0;
        R.seal && (R.seal.visible = true);
        // v7.3：串联态通关后，把第一枚半印明确接回序厅那条「四十九日 · 六殿半印」的线，
        // 并给出一个可直接点回便民司的入口。非串联态（直接进第一殿）不出现。
        if (FROM_PROLOGUE) {
          var toP = $("#toPrologue");
          if (toP) toP.classList.add("on");
        }
        carryTitle("win");
      }
      v.className = "win";
      v.textContent = HINTS
        ? "五处皆合。镜面裂开，半印① 落下，一张纸随镜风飘出。"
        : "镜面裂了。半印从镜后落下，一张纸随镜风飘出。";
    } else {
      won = false;
      crackDisc.visible = false;
      v.className = "";
      // 默认无提示：固定一句氛围叙述，不报差几处、不指向任何物件
      v.textContent = HINTS
        ? "镜面只起一层薄雾……还差 " + (5 - n) + " 处。照镜可看旧景。" +
          (n >= 3 ? " 鬼差提灯经过，差异物件的轮廓亮一下。" : " 司吏：不对。再看。")
        : "镜面只起一层薄雾。雾里那座殿，静静的。";
    }
    renderCompare();
    updateMarkers();
    invalidate(30);
  }
  function toggle(key) {
    if (!H.KEYS.length || H.KEYS.indexOf(key) < 0) return;
    H.state[key] = H.state[key] ? 0 : 1;
    H.applyState(R, H.state);
    renderDiffList(); check();
  }

  function bindUI() {
    renderDiffList();
    $("#reset").addEventListener("click", function () {
      Object.assign(H.state, H.SCRAMBLE);
      H.applyState(R, H.state); renderDiffList(); check();
      // v7.3：重置陈设=重新核形，半印未落，先收起回厅入口
      if (FROM_PROLOGUE) {
        var tp = $("#toPrologue"); if (tp) tp.classList.remove("on");
      }
      toast("殿又被弄乱了", "把五处摆回镜中的样子");
    });
    // v7.3：回序厅。带 from=prologue 回到进来时的状态，序厅从头可玩。
    var toP = $("#toPrologue");
    if (toP) toP.addEventListener("click", function () {
      location.href = "../prologue/";
    }, false);
    $("#solve").addEventListener("click", function () {
      Object.assign(H.state, H.TARGET);
      H.applyState(R, H.state); renderDiffList(); check();
    });
    $("#shot").addEventListener("click", function () {
      var a = document.createElement("a");
      a.download = "第一殿_孽镜台_场景.png";
      var src = renderer.domElement;
      if (visionOpen && visionLayout) {
        // 画幅是 DOM canvas，导出时把它合成回场景图（描边与文字为 UI，不入图）
        var c = document.createElement("canvas");
        c.width = src.width; c.height = src.height;
        var g = c.getContext("2d"), pr = renderer.getPixelRatio(), L = visionLayout;
        g.drawImage(src, 0, 0);
        // 满屏穿越雾：先压暗「现在」，再叠一层浓雾；旧景画幅在其上
        if (!MIST_OFF) {
          g.fillStyle = "rgba(4,11,12,.40)";
          g.fillRect(0, 0, c.width, c.height);
          if (fogImg && fogImg.complete) {
            g.save();
            g.globalAlpha = .80;          // 与 CSS 的 normal 雾墙一致
            g.drawImage(fogImg, 0, 0, c.width, c.height);
            g.restore();
          }
        }
        var dx = L.x * pr, dy = (innerHeight - L.y - L.h) * pr,
            dw = L.w * pr, dh = L.h * pr;
        g.drawImage($("#visionCanvas"), dx, dy, dw, dh);
        // DOM 上的云气层也叠进去，导出的图不能变成「无雾版」
        if (!MIST_OFF && mistImgA && mistImgA.complete && mistImgB && mistImgB.complete) {
          g.save();
          g.globalCompositeOperation = "screen";
          g.globalAlpha = .56;
          g.drawImage(mistImgA, dx - dw * .08, dy - dh * .08, dw * 1.16, dh * 1.16);
          g.globalAlpha = .34;
          g.drawImage(mistImgB, dx + dw * .04, dy + dh * .03, dw * 1.12, dh * 1.12);
          g.restore();
        }
        if (!MIST_OFF) {
          // 四边涌进来的云气带（对应 #visionVeil 的 inset 雾影）
          g.save();
          g.globalCompositeOperation = "screen";
          var bw = dw * .12, bh = dh * .12;
          function fogEdge(x0, y0, x1, y1, x, y, ww, hh, a) {
            var gr = g.createLinearGradient(x0, y0, x1, y1);
            gr.addColorStop(0, "rgba(176,216,200," + a + ")");
            gr.addColorStop(1, "rgba(176,216,200,0)");
            g.fillStyle = gr; g.fillRect(x, y, ww, hh);
          }
          fogEdge(dx, 0, dx + bw, 0, dx, dy, bw, dh, .27);
          fogEdge(dx + dw, 0, dx + dw - bw, 0, dx + dw - bw, dy, bw, dh, .27);
          fogEdge(0, dy, 0, dy + bh, dx, dy, dw, bh, .23);
          fogEdge(0, dy + dh, 0, dy + dh - bh, dx, dy + dh - bh, dw, bh, .21);
          g.restore();
        }
        a.href = c.toDataURL("image/png");
      } else {
        a.href = src.toDataURL("image/png");
      }
      a.click();
    });
    $("#viewFront").addEventListener("click", goFront);
    $("#toggleMirror").addEventListener("click", function () { toggleVision(); });
    $("#visionFrame").addEventListener("click", function () { toggleVision(false); });
    $("#collapse").addEventListener("click", function () {
      $("#panel").classList.add("hide"); $("#showPanel").style.display = "grid";
    });
    $("#showPanel").addEventListener("click", function () {
      $("#panel").classList.remove("hide"); this.style.display = "none";
    });
    $("#meta").innerHTML = [
      ["房间", "12 × 12 × 4 m"], ["证物", "6 类 / 18 件实例"],
      ["单位", "1 unit = 1 m · Y-up"], ["光源", "青绿主光 + 地渗冷光"],
      ["旧景", "点镜定格 · 离屏 960²"], ["照镜", "满殿涌雾 · 由远及近"],
      ["资产", "Aholo Lux3D · S1-xx"],
      ["漫游", "WASD · Q/E · Shift · R"], ["细化", "v7 · 公堂陈设 + 视角锁内"]
    ].map(function (r) { return "<div><dt>" + r[0] + "</dt><dd>" + r[1] + "</dd></div>"; }).join("");
  }

  // v7：把「转视角」锁在殿内。殿只有 12 × 12 × 4 m（墙 ±6、天花 4.1 m），
  // 旧版 maxDistance=18 + 允许右键平移，相机一拉远／一抬头就跑到墙外，只剩漆黑虚空。
  // 只夹相机位置，不动 target：WASD 是「相机 + target 同步平移」，target 本就该允许在殿外，
  // 夹它会让走路时视角突然跳。OrbitControls 每帧从 position 重算 spherical，夹完不会抖。
  function keepInside() {
    var p = camera.position;
    var x = Math.max(WALK.minX, Math.min(WALK.maxX, p.x));
    var y = Math.max(WALK.minY, Math.min(WALK.maxY, p.y));
    var z = Math.max(WALK.minZ, Math.min(WALK.maxZ, p.z));
    if (x === p.x && y === p.y && z === p.z) return;
    var dx = x - p.x, dy = y - p.y, dz = z - p.z;
    p.set(x, y, z);
    // v7.1：旋转中心必须跟着夹取量一起挪，保持 offset(=position-target) 不变。
    // 只夹相机不夹 target 会破坏 OrbitControls 的球坐标：下一帧 update 从被
    // 夹扁的半径重算，相机会一帧帧缩向 target、最后钻进公案/镜台里，看起来
    // 就像「整个房间不见了」。同步平移后视角方向不变，顶到墙只是转不动而已。
    if (controls) {
      controls.target.x += dx;
      controls.target.y += dy;
      controls.target.z += dz;
    }
  }

  function goFront() {
    // v7.2：复位必须是「万能逃生键」。以前只挪相机，若正卡在照镜状态，
    // 满屏 #visionDim 暗幕和雾层还在，按 R 看起来仍是一片黑、像没进房间。
    document.body.classList.remove("vision", "peek");
    visionOpen = false;
    visionSnap = null;
    var b = $("#toggleMirror");
    if (b) { b.textContent = "照镜 · 看进门之前"; b.classList.remove("on"); }
    keys = Object.create(null);
    camera.position.set(0, 1.65, 4.6);
    controls.target.set(0, 1.5, -1.1);
    controls.update();
    invalidate(26);
  }

  function canStand(x, z) {
    if (x < WALK.minX || x > WALK.maxX || z < WALK.minZ || z > WALK.maxZ) return false;
    if (Math.abs(x) < 1.25 && z > -1.05 && z < -.50) return false;
    var P = [[-5.25, -4.7], [5.25, -4.7], [-5.25, 4.7], [5.25, 4.7]];
    for (var i = 0; i < 4; i++) {
      var dx = x - P[i][0], dz = z - P[i][1];
      if (dx * dx + dz * dz < .22) return false;
    }
    return true;
  }

  function onKey(ev) {
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    var code = ev.code || "";
    if (code === "Escape" && ev.type === "keydown") { toggleVision(false); return; }
    // 照镜时按住空格 = 暂时收起画幅看实景，松开回来，便于来回比对
    if (code === "Space") {
      if (ev.type === "keydown") {
        if (visionOpen) document.body.classList.add("peek");
        ev.preventDefault();
      } else document.body.classList.remove("peek");
      return;
    }
    var k = code.replace(/^Key/, "").toLowerCase();
    if (["w", "a", "s", "d", "q", "e", "r", "shiftleft", "shiftright",
         "arrowup", "arrowdown", "arrowleft", "arrowright"].indexOf(k) < 0) return;
    if (ev.type === "keydown") {
      if (k === "r") { goFront(); toast("视角已复位", "WASD 继续走"); return; }
      keys[k] = true;
      lastWalkT = 0;
      invalidate(3);
      if (k.indexOf("arrow") === 0) ev.preventDefault();
    } else {
      delete keys[k];
      lastWalkT = 0;
    }
  }

  function stepWalk() {
    var K = keys, f = 0, r = 0, up = 0;
    if (K.w || K.arrowup) f += 1;
    if (K.s || K.arrowdown) f -= 1;
    if (K.d || K.arrowright) r += 1;
    if (K.a || K.arrowleft) r -= 1;
    if (K.e) up += 1;
    if (K.q) up -= 1;
    if (!f && !r && !up) return false;

    var now = performance.now();
    var dt = lastWalkT ? Math.min(.05, (now - lastWalkT) / 1000) : .016;
    lastWalkT = now;
    var speed = (K.shiftleft || K.shiftright) ? 4.4 : 2.1;

    var fwd = new T.Vector3().subVectors(controls.target, camera.position);
    fwd.y = 0;
    if (fwd.lengthSq() < 1e-6) fwd.set(0, 0, -1);
    fwd.normalize();
    var right = new T.Vector3().crossVectors(fwd, new T.Vector3(0, 1, 0)).normalize();
    var dx = (fwd.x * f + right.x * r) * speed * dt;
    var dz = (fwd.z * f + right.z * r) * speed * dt;
    var dy = up * speed * .55 * dt;

    var p = camera.position, t = controls.target;
    var ox = p.x, oy = p.y, oz = p.z;
    if (canStand(p.x + dx, p.z)) p.x += dx;
    if (canStand(p.x, p.z + dz)) p.z += dz;
    p.y = Math.max(WALK.minY, Math.min(WALK.maxY, p.y + dy));
    t.x += p.x - ox; t.y += p.y - oy; t.z += p.z - oz;

    invalidate(3);
    return true;
  }

  // —— 点击 3D 物件 / 镜子 ——
  function onPick(ev) {
    if (ev.target !== renderer.domElement) return;
    var rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    // 镜子优先：点镜面或镜框都算「照镜 / 收起」
    var mh = raycaster.intersectObject(mirrorDisc, false)[0];
    if (!mh && R.mirror) mh = raycaster.intersectObject(R.mirror, true)[0];
    if (mh) {
      var nearer = raycaster.intersectObjects(R.hitTargets, true)[0];
      if (!nearer || mh.distance <= nearer.distance + .06) { toggleVision(); return; }
    }

    var hits = raycaster.intersectObjects(R.hitTargets, true);
    if (!hits.length) return;
    var o = hits[0].object, key = null;
    while (o && !key) { key = o.userData && o.userData.hit; o = o.parent; }
    if (key) {
      var d = H.DIFFS.filter(function (x) { return x.hit === key; })[0];
      if (d) toggle(d.key);
    }
  }

  // —— 启动 ——
  function init() {
    if (!window.WebGLRenderingContext) { fail("当前浏览器不支持 WebGL"); return false; }
    try {
      renderer = new T.WebGLRenderer({ canvas: $("#cv"), antialias: true,
                                       preserveDrawingBuffer: true });
    } catch (e) { fail("WebGL 初始化失败：" + e.message + "<br>建议用 Chrome / Edge 打开"); return false; }
    renderer.setPixelRatio(LITE ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(innerWidth, innerHeight);
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = .90;
    renderer.shadowMap.enabled = !LITE;
    renderer.shadowMap.type = T.PCFSoftShadowMap;

    scene = new T.Scene();
    scene.background = new T.Color(0x070b0c);
    scene.fog = new T.FogExp2(0x070d0d, .038);
    try {
      var pm = new T.PMREMGenerator(renderer);
      var env = pm.fromScene(new T.RoomEnvironment(), .04);
      scene.environment = env.texture; pm.dispose();
    } catch (e) { console.warn("env", e); }

    var gc = document.createElement("canvas"); gc.width = gc.height = 128;
    var gx = gc.getContext("2d"), im = gx.createImageData(128, 128);
    for (var gi = 0; gi < im.data.length; gi += 4) {
      var v = 88 + Math.random() * 120;
      im.data[gi] = im.data[gi + 1] = im.data[gi + 2] = v;
      im.data[gi + 3] = 255;
    }
    gx.putImageData(im, 0, 0);
    var grainEl = document.getElementById("grain");
    if (grainEl) grainEl.style.backgroundImage = "url(" + gc.toDataURL() + ")";

    camera = new T.PerspectiveCamera(70, innerWidth / innerHeight, .05, 80);
    controls = new T.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = .07;
    // 禁用右键平移：pan 会把旋转中心推出殿，相机便绕着殿外的点转出去
    controls.enablePan = false;
    // 默认机位到 target 约 5.7 m；6.2 只留一点拉远余量，再远必出墙
    controls.minDistance = 1.2; controls.maxDistance = 6.2;
    // 不许俯冲到天花以上，也不许钻到地板以下
    controls.minPolarAngle = Math.PI * .30;
    controls.maxPolarAngle = Math.PI * .505;
    controls.addEventListener("change", function () {
      keepInside();
      if (idle < 10) idle = 10;
    });
    goFront();
    window.addEventListener("keydown", onKey, false);
    window.addEventListener("keyup", onKey, false);
    window.addEventListener("blur", function () {
      keys = Object.create(null);
      document.body.classList.remove("peek");
    }, false);

    // v7.4：旁白字幕点一下推进一句；重听按钮重播。都不占任何游戏按键。
    var introEl = $("#intro");
    if (introEl) introEl.addEventListener("click", introNext, false);
    var replayEl = $("#replayIntro");
    if (replayEl) replayEl.addEventListener("click", function (e) {
      e.stopPropagation(); introStart();
    }, false);

    root = new T.Group(); scene.add(root);
    H.buildArchitecture(root);
    lights = H.buildLights(scene, root);

    window.addEventListener("resize", function () {
      camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
      if (visionOpen) layoutVision();
      invalidate(20);
    });
    renderer.domElement.addEventListener("dblclick", goFront);

    if (DEBUG) {
      // v7.3：串联态自测。是否承接序厅 / 承接对白是否亮 / 通关后回厅入口是否出现
      window.__carryProbe = function () {
        return { fromPrologue: FROM_PROLOGUE,
                 carryIn: !!$("#carryIn") && $("#carryIn").classList.contains("on"),
                 won: won,
                 toPrologue: !!$("#toPrologue") && $("#toPrologue").classList.contains("on"),
                 backTarget: "../prologue/" };
      };
      window.__walkProbe = function (n) {
        var before = camera.position.toArray();
        for (var i = 0; i < (n || 1); i++) { lastWalkT = 0; stepWalk(); }
        return { before: before, after: camera.position.toArray(),
                 keys: Object.keys(keys) };
      };
      window.__visionProbe = function (on) {
        toggleVision(!!on);
        return { open: visionOpen, layout: visionLayout, dirty: mirrorDirty,
                 snap: visionSnap ? visionSnap.p.toArray() : null };
      };
      // 极限视角自检：返回相机是否仍在殿内安全盒
      window.__orbitProbe = function (az, pol, dist) {
        camera.position.setFromSpherical(new T.Spherical(dist, pol, az))
          .add(controls.target);
        controls.update();
        var p = camera.position;
        return { cam: p.toArray(), target: controls.target.toArray(),
                 inside: Math.abs(p.x) <= WALK.maxX + .001 &&
                         Math.abs(p.z) <= WALK.maxZ + .001 &&
                         p.y >= WALK.minY - .001 && p.y <= WALK.maxY + .001 };
      };
    }
    return true;
  }

  function tick() {
    requestAnimationFrame(tick);
    // v7.2：每帧兜底自愈。keepInside() 只在 OrbitControls 的 change 回调里跑，
    // 别的路径（?cam=、滚轮、damping 残留、旧标签页状态）仍可能把相机留在
    // 殿外 —— 那里既没有几何也没有灯光，画面就是一面黑墙角。越界立即回殿。
    if (camera && camera.position) {
      var cp = camera.position;
      if (!isFinite(cp.x + cp.y + cp.z) ||
          Math.abs(cp.x) > WALK.maxX + .6 ||
          Math.abs(cp.z) > WALK.maxZ + .6 ||
          cp.y < WALK.minY - .4 || cp.y > WALK.maxY + .8) goFront();
    }
    stepWalk();
    stepMist(1 / 60);
    if (idle <= 0) return;
    idle--;
    controls.update();
    renderVision();
    if (sealT >= 0 && sealT < 1) {
      sealT = Math.min(1, sealT + .016);
      if (R.seal) {
        R.seal.position.y = 2.3 - 1.45 * (1 - Math.pow(1 - sealT, 2));
        R.seal.rotation.y += .05;
      }
      invalidate(2);
    }
    renderer.render(scene, camera);
    frame++;
    if (DEBUG && (frame <= 2 || frame % 12 === 0 || Object.keys(keys).length)) {
      var px = new Uint8Array(4);
      var gl = renderer.getContext();
      try { gl.readPixels(innerWidth >> 1, innerHeight >> 1, 1, 1,
                          gl.RGBA, gl.UNSIGNED_BYTE, px); } catch (e) {}
      dbg("frame=" + frame + "  calls=" + renderer.info.render.calls +
          "  tris=" + renderer.info.render.triangles +
          "\nbase=" + H.assetBase + "  geoTris=" + window.__geoTris +
          "\ncenterPx=" + Array.from(px).join(",") +
          "\ncam=" + camera.position.toArray().map(function (v) { return v.toFixed(2); }).join(",") +
          "\nvision=" + visionOpen + "  mirrorOn=" + mirrorOn + "  idle=" + idle +
          "  rt=" + (window.__rtSample || "-") +
          "\nwalk=" + (Object.keys(keys).join("+") || "-") +
          "\nkeys: WASD 走 · Q/E 升降 · Shift 加速 · R 复位 · Esc 收起");
    }
  }

  function boot() {
    if (!init()) return;
    // v7.1 / v7.2：旧版要等 6 件资产全部成功才揭幕 + 起渲染循环，任一件挂起
    // 就永远停在「准备中…」。这里改成定时揭幕 + 异步补一帧；**不在启动流程里
    // 同步 render** —— 实测无头 / 软渲染下这一帧会把整页拖到 150 s+ 超时
    // （带 clean 的页面不出这一帧，16–23 s 就正常出图）。持续循环仍由资产回调启动。
    // 逃生键在 init() 之后立刻绑上，不等资产：哪怕 6 件 GLB 全挂也能回殿。
    $("#rescue").addEventListener("click", goFront, false);
    var revealed = false;
    function reveal() {
      if (revealed) return;
      revealed = true;
      $("#loading").classList.add("done");
      // 资产还没到位时补一帧房间，避免揭幕后看到空白 canvas；一次性 rAF，
      // 不占住渲染循环，也不会拖垮无头截图的虚拟时间预算。
      requestAnimationFrame(function () {
        if (!R && !CLEAN) renderer.render(scene, camera);
      });
      // v7.3：从序厅穿门进来时的一句承接对白，6 秒后淡出；只在串联态出现。
      if (FROM_PROLOGUE && !CLEAN) {
        var ci = $("#carryIn");
        if (ci) {
          ci.classList.add("on");
          setTimeout(function () { ci.classList.remove("on"); }, 6000);
        }
      }
      // v7.4：开场旁白——承接对白亮起后约 1.2 秒接上，避免两处文字同时挤进来。
      // 直接进第一殿（非串联）也会播；clean 出图不播；introprobe 由探针显式驱动。
      if (!CLEAN && !INTRO_PROBE) setTimeout(introStart, FROM_PROLOGUE ? 1200 : 350);
      // introprobe：把旁白首句 / 句数 / clean 状态写进 title，供无头验证。
      if (INTRO_PROBE) {
        // introprobe 模式下 introShow 不设定时器，链路由这里显式驱动，验证推进逻辑。
        if (!CLEAN) {
          introShow(0);
          var firstTxt = $("#intro").querySelector(".intro-text").textContent;
          introNext(); introNext();          // 点两次字幕 → 第 3 句
          var thirdTxt = $("#intro").querySelector(".intro-text").textContent;
          document.title = "INTRO lines=" + INTRO.length +
            " first=" + firstTxt.slice(0, 8) +
            " advanced=" + (thirdTxt !== firstTxt && introIdx === 2) +
            " clean=false dom=" + (!!$("#intro"));
        } else {
          document.title = "INTRO lines=" + INTRO.length +
            " first=" + INTRO[0].text.slice(0, 8) +
            " clean=true dom=" + (!!$("#intro"));
        }
      }
      carryTitle("reveal");
    }
    // 双保险：1.2 秒无条件揭幕，哪怕一个 GLB 都还没回来也先把殿放出来；
    // 遮罩本身也可点掉，玩家不必等。
    var revealTimer = setTimeout(reveal, 1200);
    $("#loading").addEventListener("click", reveal, false);
    loadTxt("搭建殿宇…");
    H.loadAssets(function (n, total, name) {
      loadTxt("载入证物 " + n + " / " + total + " · " + name);
    }).then(function (glbs) {
      loadTxt("摆放证物…");
      var gt = 0;
      Object.keys(glbs).forEach(function (k) {
        glbs[k].traverse(function (o) {
          if (o.isMesh && o.geometry && o.geometry.index)
            gt += o.geometry.index.count / 3;
        });
      });
      window.__geoTris = Math.round(gt);
      R = H.placeAssets(root, glbs);
      R.mirrorOnly = H.makeMirrorOnly(root);
      H.applyState(R, H.state);

      R.seal = new T.Mesh(
        new T.BoxGeometry(.06, .04, .06),
        new T.MeshStandardMaterial({ color: 0xa8462f, roughness: .5,
                                     emissive: 0x3a0e07, emissiveIntensity: .8 })
      );
      R.seal.position.set(0, 2.3, -.7);
      R.seal.visible = false; root.add(R.seal);

      setupMirror();
      if (LITE) { mirrorOn = false; mirrorDirty = false; }
      bindUI();
      if (/clean=1/.test(Q)) document.body.classList.add("clean");
      if (/mist=0/.test(Q)) document.body.classList.add("nomist");
      if (/mist=burst/.test(Q)) document.body.classList.add("miststill");
      if (HINTS) document.body.classList.add("hints");
      if (/solved=1/.test(Q)) {
        Object.assign(H.state, H.TARGET);
        H.applyState(R, H.state); renderDiffList();
      }
      check();
      // v7.2：每次进页面都从殿中央起步。以前只有在 init() 里调一次 goFront()，
      // 之后资产加载、damping 残留或旧缓存都可能把相机留在殿外（那里没几何
      // 也没灯光，就是一片黑墙角）。?cam= / ?orbit= 诊断参数在下面照常覆盖。
      goFront();
      var cm = /[?&]cam=(-?[\d.]+),(-?[\d.]+),(-?[\d.]+)/.exec(Q);
      if (cm) {
        camera.position.set(+cm[1], +cm[2], +cm[3]);
        controls.target.set(0, 1.5, -1.1);
        controls.update();
      }
      // 出图诊断：?orbit=方位角,极角,距离 模拟把视角转到极限，验证相机仍被锁在殿内
      var om = /[?&]orbit=(-?[\d.]+),(-?[\d.]+),(-?[\d.]+)/.exec(Q);
      if (om) {
        camera.position.setFromSpherical(
          new T.Spherical(+om[3], +om[2], +om[1])).add(controls.target);
        controls.update();
        invalidate(20);
      }
      layoutVision();
      renderCompare();
      if (/vision=1/.test(Q) && !LITE) toggleVision(true);
      // v7.2：官方「强制回殿」链接参数，等价于按 R / 点「回殿中」
      if (/reset=1/.test(Q)) goFront();
      renderer.domElement.addEventListener("click", onPick);
      reveal();
      clearTimeout(revealTimer);
      invalidate(30);
      tick();
    }).catch(function (e) {
      // 资产异常不再把整幕锁死：房间已经渲染，只给一条轻提示
      clearTimeout(revealTimer);
      reveal();
      invalidate(30);
      tick();
      toast("部分证物未载入", e.message);
    });
  }

  boot();
})();
