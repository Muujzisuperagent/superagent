/* 序厅 · 阴司便民司 — 渲染 / 漫游 / 教学链状态机
 * 沿用第一殿 v7.2 修好的三件事：
 *   1) 启动不等任何资产：init() 里同步搭完建筑壳，揭幕与渲染循环立刻可用；
 *      Aholo Lux3D GLB 由 boot() 异步挂载，缺件静默回退、绝不阻断进厅；
 *      **不在启动流程里同步 render**（软渲染 / 无头截图会被那一帧拖到超时）。
 *   2) 相机锁内：夹取量同步加到 controls.target，保持 offset 不变，
 *      否则 OrbitControls 下一帧从被夹扁的半径重算，相机会缩向 target 钻进案里。
 *   3) R / 双击 / 左下角按钮 = 万能逃生键，?reset=1 也能强制回廊中。
 * 教学链：摇号 → 取牌 → 合牒 → 点香 → 门自开。全程不出现文字教程，
 * 用「当前可交互物件的冷白微光 + 底部纯图形槽位」引导；观察点只点亮灯格。
 */
(function () {
  "use strict";
  var T = window.THREE, P = window.PrologueScene, D = window.PrologueDialogue;
  var $ = function (s) { return document.querySelector(s); };
  var Q = location.search;
  var CLEAN = /clean=1/.test(Q), DEBUG = /debug=1/.test(Q);
  var renderer, scene, camera, controls, S;
  var raycaster = new T.Raycaster(), pointer = new T.Vector2();
  var keys = Object.create(null), lastWalkT = 0, lastFrameT = 0;
  var idle = 0, animT = 0, frame = 0, toastTimer = null, wakeUntil = 0;
  var WALK = P.LAYOUT.walk;
  // v29：走到案边判官身边才触发对话。?noapproach=1 回到「一开局就开口」；
  // 出图 / 探针 / 面板自测参数一律保留强制开场，既有带字幕定稿图不受影响。
  var J = P.judgeAt || [0.18, 0, -1.28];
  var NO_APPROACH = /noapproach=1/.test(Q);
  var FORCE_DLG = /dlg=1|dlgchoice=1|dlglog=1|dlgtalk=1/.test(Q);
  var APPROACH_TEST = /dlgapproach=1/.test(Q);
  var APPROACH_ON = !!(D && D.enabled) && !CLEAN && !NO_APPROACH && !FORCE_DLG;
  var APPROACH_R = 2.20, LEAVE_R = 2.95, nearJudge = false;

  // v31：两厅串联。教学链 4 步完成（门开）后，尽头的门 → 冷白雾过场 → 进第一殿。
  // v32：用户要「从门直接穿过去」——不再需要点门，WASD 走过门扇即自动进殿；
  //      同时把行走边界从离门 2.8 m 放宽到门跟前 / 门后，去掉那堵隐形墙。
  // 门未开时点门仍给原来那句「无引者不得离殿」观察台词。
  // ?nogate=1 回到旧行为；?gateprobe=1 / ?walkgate=1 把状态写进 title 供无头验证。
  var GATE_ON = !/nogate=1/.test(Q);
  var GATE_PROBE = /gateprobe=1/.test(Q);
  var WALK_GATE_TEST = /walkgate=1/.test(Q);
  var GATE_CROSS_Z = -20.55;   // 门扇在 z=-20.42，跨过它就算穿门
  var WALLS = /walls=1/.test(Q); // 回退开关：恢复家具 / 判官碰撞盒
  var WRONG_PICK_PROBE = /wrongpick=1/.test(Q); // v35：点错顺序提示自测
  var gateHintAt = 0;          // 关门走到门口时的提示节流
  // v33：按教学链进度明确告诉玩家「现在该点什么」——之前 HUD 只说「走到案边」，
  // 用户走到门口才发现过不去，却不知道要先按序办完这四件事。
  var TASK = [
    "① 回案前点<b>取号机的铜摇柄</b>（会落出一枚竹牌）",
    "② 捡起摇柄旁地上那枚<b>新落的竹牌</b>",
    "③ 点案上摊开的<b>两半路引</b>，把骑缝合上",
    "④ 点案角的<b>小铜香炉</b>，把香点上",
    "门开了 · 走到长廊尽头，<b>穿过那扇门</b>"
  ];
  function walkMinZ() {
    // 门开前也能走到门跟前（-20.05，贴着关着的门扇）；门开后允许跨过去。
    if (GATE_ON && S && S.step >= 4) return -20.95;
    return -20.05;
  }
  var entering = false, gateTimer = null;

  // 旋转中心就近：OrbitControls 是「相机绕 target 公转」。原先 target 放在走廊深处
  // 10.4 m 外，而走廊只有 6.4 m 宽 —— 转约 18° 相机就撞上 keepInside() 的边界被硬夹
  // 回来，target 还被同步推着漂，看起来就是「转不动 / 一顿一顿」。
  // 把 target 放到相机前方 1.05 m：公转变成了「原地转头」，半径极小、永不撞墙，
  // 而初始视线方向完全一致（AIM 仍是原来那个远瞄准点），所有机位构图不变。
  var LOOK_DIST = 1.05;
  var AIM = new T.Vector3(P.LAYOUT.start.t[0], P.LAYOUT.start.t[1], P.LAYOUT.start.t[2]);

  function invalidate(n) { idle = Math.max(idle, n || 26); }
  function wake(ms) { wakeUntil = Math.max(wakeUntil, performance.now() + (ms || 900)); }
  /** 朝一个远点取视线，但把旋转中心压到相机前方 LOOK_DIST 处。 */
  function aimAt(pt) {
    var d = new T.Vector3().subVectors(pt, camera.position);
    if (d.lengthSq() < 1e-6) d.set(0, 0, -1);
    d.normalize();
    controls.target.copy(camera.position).addScaledVector(d, LOOK_DIST);
    controls.update();
  }
  function loadTxt(t) { $("#loadTxt").textContent = t; }
  function toast(msg) {
    if (CLEAN) return;
    var el = $("#toast");
    el.textContent = msg;
    el.classList.add("on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("on"); }, 2300);
  }
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

  // ——— 图形 HUD：不写任何教程文字，只有槽位与灯格 ———
  function renderHUD() {
    var step = S.step;
    for (var i = 0; i < 4; i++) {
      var el = $("#slot" + i);
      if (el) el.classList.toggle("on", step >= i + 1);
    }
    var n = S.observedCount;
    for (var j = 0; j < S.observeTotal; j++) {
      var lamp = $("#lamp" + j);
      if (lamp) lamp.classList.toggle("on", j < n);
    }
    $("#hud").classList.toggle("done", step >= 4);
    // v31：门一开就把底部提示换成「去尽头的门」，否则玩家不知道该往哪走。
    // 这仍是图形/极短文字引导，不是场景内可读文字（v3 负面词照旧守住）。
    var hint = $("#hint");
    if (hint) {
      // v33：第一行突出「当前该做什么」，第二行才是操作说明。
      // 没申辩时先提示去跟判官说「我不认」，申辩后按教学链进度点四样物件。
      var task;
      if (step >= 4 && GATE_ON) task = TASK[4];
      else if (!D || !D.enabled || !D.state().sworn) task = '<b>先去案边跟判官说「我不认」</b>（走近他就开口）';
      else task = TASK[step] + '（第 ' + (step + 1) + '/4 步）';
      hint.innerHTML = '<span style="color:#cfe6dc">' + task + '</span>' +
        '<br><b>W A S D</b> 走动 · <b>点物件</b>操作 · <b>T 卷宗</b> · <b>R 回廊中';
    }
    if (DEBUG) {
      dbg("step=" + step + " / 4  observed=" + n + "/" + S.observeTotal +
          "  cam=" + camera.position.toArray().map(function (v) { return v.toFixed(2); }).join(",") +
          "  frame=" + frame + "  tris=" + renderer.info.render.triangles +
          "\nnext=" + (step < 4 ? S.PICKS[step] : "—"));
    }
  }

  // ——— 相机 ———
  function keepInside() {
    var p = camera.position;
    var minZ = walkMinZ();
    var x = Math.max(WALK.minX, Math.min(WALK.maxX, p.x));
    var y = Math.max(WALK.minY, Math.min(WALK.maxY, p.y));
    var z = Math.max(minZ, Math.min(WALK.maxZ, p.z));
    if (x === p.x && y === p.y && z === p.z) return;
    var dx = x - p.x, dy = y - p.y, dz = z - p.z;
    p.set(x, y, z);
    // 旋转中心同步平移：保持 offset(=position-target) 不变，球坐标半径不塌
    if (controls) {
      controls.target.x += dx;
      controls.target.y += dy;
      controls.target.z += dz;
    }
  }

  function goHome() {
    keys = Object.create(null);
    var st = P.LAYOUT.start;
    camera.position.set(st.p[0], st.p[1], st.p[2]);
    aimAt(AIM);           // 视线仍指向走廊深处，但旋转中心就在眼前
    keepInside();
    invalidate(26);
  }

  function canStand(x, z) {
    // v32：只保留房间外边界，不再把玩家挡在离门 2.8 m 处（walkMinZ 门态自适应）。
    if (x < WALK.minX || x > WALK.maxX || z < walkMinZ() || z > WALK.maxZ) return false;
    // v32：用户反馈「房间里有空气墙」——长凳 / 木案 / 判官周围的硬矩形碰撞
    // 全部移除，默认可以直接走过去。?walls=1 才恢复这三处碰撞供对照。
    if (WALLS) {
      if (x > -1.62 && x < .34 && z > 1.66 && z < 2.26) return false;
      if (x > .42 && x < 2.62 && z > -1.52 && z < -.58) return false;
      if (Math.abs(x - J[0]) < .42 && Math.abs(z - J[2]) < .42) return false;
    }
    return true;
  }

  function onKey(ev) {
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    var k = (ev.code || "").replace(/^Key/, "").toLowerCase();
    if (["w", "a", "s", "d", "q", "e", "r", "shiftleft", "shiftright",
         "arrowup", "arrowdown", "arrowleft", "arrowright"].indexOf(k) < 0) return;
    if (ev.type === "keydown") {
      if (k === "r") { goHome(); toast("回到长凳前"); return; }
      keys[k] = true; lastWalkT = 0; invalidate(3);
      if (k.indexOf("arrow") === 0) ev.preventDefault();
    } else { delete keys[k]; lastWalkT = 0; }
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
    keepInside();
    invalidate(3);
    return true;
  }

  // ——— 教学链 ———
  var STEP_TOAST = [
    "木柄转了一圈，一枚竹牌落出来。",
    "竹牌收进袖里。",
    "两半纸合上了骑缝。",
    "香头亮了。第一殿的门，自己开了。"
  ];

  function pickIdOf(o) {
    while (o) {
      if (o.userData && o.userData.pick) return o.userData.pick;
      o = o.parent;
    }
    return null;
  }

  // ——— v29：走近判官触发对话 ———
  // 只算水平距离，Q/E 升降视点不会误触发；要退到 LEAVE_R 之外才重置，
  // 免得玩家在阈值边缘来回蹭、字幕反复弹。整个过程非阻断，随时能走开。
  function checkApproach() {
    if (!APPROACH_ON || !D) return;
    var dx = camera.position.x - J[0], dz = camera.position.z - J[2];
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (!nearJudge && dist < APPROACH_R) {
      nearJudge = true;
      var st = D.state();
      if (!st.started) D.start();        // 第一次走近：判官说开场白，播完才弹按钮
      else if (st.sworn) D.talk();       // 申辩过再回来：再听他说一句
      // v34：已开场但还没申辩时不再 protest 重亮按钮——玩家走近/退回反复蹭
      // 会在开场两句播完前把字幕打断、按钮提前弹出，正是「话和按钮重叠」的来源。
      // 开场白会自己播完并在 onIdle 放行按钮，不需要走近来催。
      invalidate(20);
      if (APPROACH_TEST) {
        document.title = "APPROACH near=true started=" + D.state().started +
          " choice=" + !!document.querySelector("#dlgChoice.on") +
          " dist=" + dist.toFixed(2);
      }
    } else if (nearJudge && dist > LEAVE_R) {
      nearJudge = false;
    }
  }

  // ——— v31：穿门过场 → 第一殿 ———
  function enterFirstHall() {
    if (entering) return;
    entering = true;
    var el = document.getElementById("gate");
    if (el) el.classList.add("on");
    if (D && D.enabled) D.end();          // 把收尾两句补上，剧情不断层
    invalidate(6);
    if (GATE_PROBE || WALK_GATE_TEST) {
      // 自测：只写 title，不真跳；无头 dump-dom 读得到「门已开 + 过场已亮 + 目标」
      document.title = (GATE_PROBE ? "GATE " : "WALKGATE ") +
        "opened=true veil=on crossed=pos target=first-hall" +
        " observed=" + S.observedCount + "/" + S.observeTotal;
      return;
    }
    gateTimer = setTimeout(function () {
      location.href = "../first-hall/?from=prologue=1";
    }, 1150);
  }

  // v32：门开后玩家 WASD 走过门扇（z < GATE_CROSS_Z）即自动穿门进殿，
  // 不再要求点击。门关着时 walkMinZ 把人挡在 -20.05，走不到这里，自然不触发。
  function checkGateCross() {
    if (entering || !GATE_ON) return;
    if (S.step < 4) {
      // 门还没开却走到了长廊尽头——明确告诉玩家该回去做什么，别让他以为要捡道具。
      if (camera.position.z < -18.5 && performance.now() - gateHintAt > 3200) {
        gateHintAt = performance.now();
        toast("门还锁着 · 回案前按顺序办：摇号 → 竹牌 → 合牒 → 点香");
      }
      return;
    }
    if (camera.position.z < GATE_CROSS_Z) {
      keys = Object.create(null);   // 停下脚步，避免过场里继续走动
      enterFirstHall();
    }
  }

  function handle(id) {
    // v31：门开以后，尽头门从「观察点」升级为「出口」。注意放在观察点分支之前，
    // 这样同样一个 id=door，开门前出台词、开门后穿门，两态共用一份几何。
    if (id === "door" && GATE_ON && S.step >= 4) { enterFirstHall(); return; }
    // v28：判官崔珏是独立 NPC。点他 = 与他对谈（轮播判官台词，未申辩时
    // 顺带把「我不认」重新亮出来）；不计入 9 处观察点、不推进教学链。
    if (id === "judge") {
      if (D && D.enabled) D.talk();
      invalidate(20);
      return;
    }
    // 观察点：点亮灯格 + 一句剧本 / v3 台词；仍不推进主线、不提示下一步点哪
    if (S.OBSERVE.indexOf(id) >= 0) {
      if (S.setObserved(id)) { renderHUD(); invalidate(12); }
      if (D && D.enabled) D.observe(id);
      return;
    }
    if (S.step >= 4) return;
    if (id !== S.PICKS[S.step]) {
      // v35：保留严格顺序，但不再静默——用户「忘记要顺序」时，点没轮到的物件
      // 没有任何反应，就会误以为「只有木牌能点、其他都点不动」。这里给一句明确
      // 提示当前该点哪件；状态机 / 动画 / 定稿图一律不动。观察点走上面的分支不受影响。
      var want = S.PICKS[S.step];
      var label = { machine: "取号机摇柄", ticket: "新落的竹牌",
                    pass: "两半路引", incense: "小铜香炉" };
      toast("按顺序来 · 现在该点" + (label[want] || want));
      if (WRONG_PICK_PROBE) {
        document.title = "WRONGPICK clicked=" + id + " want=" + want +
          " keptStep=" + S.step + " toast=shown";
      }
      return;
    }
    var before = S.step;
    S.advance(false);
    renderHUD();
    if (D && D.enabled) D.step(before); else toast(STEP_TOAST[before]);
    invalidate(150);
  }

  function onPick(ev) {
    if (ev.target !== renderer.domElement) return;
    // 探针模式绕过节流：无头虚拟时间下 rAF 帧数不足以推进动画，会误判为卡住
    if (S.busy() && !window.__probeBypass) return;   // 动画播完再接受下一次点击
    var rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    var hits = raycaster.intersectObjects(S.pickMeshes, true);
    for (var i = 0; i < hits.length; i++) {
      if (hits[i].object.visible === false) continue;
      // 贴地烟幕在点香前 opacity=0，但仍会被 raycaster 命中并挡住地上的竹牌
      var mt = hits[i].object.material;
      if (mt && mt.transparent && mt.opacity === 0) continue;
      var id = pickIdOf(hits[i].object);
      if (id) { handle(id); return; }
    }
  }

  function savePNG() {
    // preserveDrawingBuffer 已关闭，必须在同一个同步调用栈内 render 完立刻取像素
    renderer.render(scene, camera);
    var a = document.createElement("a");
    a.download = "序厅_阴司便民司.png";
    a.href = renderer.domElement.toDataURL("image/png");
    a.click();
  }

  function bindUI() {
    renderer.domElement.addEventListener("click", onPick, false);
    renderer.domElement.addEventListener("dblclick", function (e) {
      e.preventDefault(); goHome(); toast("回到长凳前");
    }, false);
    ["pointerdown", "pointermove", "wheel"].forEach(function (n) {
      renderer.domElement.addEventListener(n, function () {
        // 松手后的阻尼惯性不再产生 pointermove，必须靠 wake 续帧；
        // 否则 controls.update() 停摆，转动会一顿一顿地断在半路。
        wake(900); invalidate(26);
      }, { passive: true });
    });
    window.addEventListener("pointerup", function () { wake(1200); }, { passive: true });
    window.addEventListener("keydown", onKey, false);
    window.addEventListener("keyup", onKey, false);
    $("#rescue").addEventListener("click", goHome, false);
    $("#showPanel").addEventListener("click", function () {
      $("#panel").classList.toggle("hide");
    }, false);
    $("#collapse").addEventListener("click", function () {
      $("#panel").classList.add("hide");
    }, false);
    $("#shot").addEventListener("click", savePNG, false);
    $("#viewFront").addEventListener("click", function () { goHome(); }, false);
    $("#reset").addEventListener("click", function () {
      S.reset(); renderHUD(); goHome(); invalidate(30);
    }, false);
    $("#solve").addEventListener("click", function () {
      S.applyStep(4, true); renderHUD(); invalidate(30);
      if (D && D.enabled) D.end();
    }, false);
    $("#meta").innerHTML = [
      ["场景", "序厅 · 阴司便民司 / 教学关"],
      ["依据", "队友《场景生图提示词 v3 · 恐怖版》1｜序厅"],
      ["资产", "<span id=\"metaAsset\">Aholo Lux3D · 9 件生成资产（6 新 + 3 复用）</span>"],
      ["材质", "氧化青铜 / 老榆木 / 青灰石 / 宣纸 / 白麻布 / 纸扎"],
      ["漫游", "WASD · Q/E · Shift · R"],
      ["对白", "走近案边判官 · 点他重听 · F 申辩 · T 卷宗"],
      ["版本", "v3 · 坐姿判官 + 走近触发"]
    ].map(function (r) {
      return "<div><dt>" + r[0] + "</dt><dd>" + r[1] + "</dd></div>";
    }).join("");
  }

  // ——— 初始化 ———
  function init() {
    var cv = $("#cv");
    try {
      renderer = new T.WebGLRenderer({ canvas: cv, antialias: true,
        // 关掉绘制缓冲保留：它强制每帧多一次全屏拷贝，是连续漫游掉帧的大头。
        // 截图改用「同步 render 后立即 toDataURL」，同一调用栈内仍能取到像素。
        alpha: false, preserveDrawingBuffer: false, powerPreference: "high-performance" });
    } catch (e) {
      $("#loadTitle").textContent = "此浏览器无法启用 WebGL";
      $("#loadTxt").textContent = "请用 Chrome / Edge 打开，并确认硬件加速可用。";
      return false;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    renderer.setSize(innerWidth, innerHeight);
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    renderer.shadowMap.enabled = false;

    scene = new T.Scene();
    camera = new T.PerspectiveCamera(54, innerWidth / innerHeight, .08, 70);
    controls = new T.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = .11;
    controls.rotateSpeed = .85;             // 略降，避免原地转头时一拖就飞
    controls.enablePan = false;             // 右键平移是把旋转中心带出殿的元凶
    // 就近旋转中心：缩放只允许在 0.9~1.35 m 内微调，防止把公转半径重新拉大
    controls.minDistance = .90; controls.maxDistance = 1.35;
    controls.minPolarAngle = Math.PI * .30;
    controls.maxPolarAngle = Math.PI * .505;
    controls._dragging = false;
    renderer.domElement.addEventListener("pointerdown", function () { controls._dragging = true; });
    window.addEventListener("pointerup", function () { controls._dragging = false; });

    // 建筑壳在 build() 里一次性搭完；Lux3D GLB 之后异步补挂，不等网络请求
    S = P.build(scene);
    bindUI();
    goHome();

    window.addEventListener("resize", function () {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
      invalidate(20);
    }, false);

    // 诊断 / 出图参数
    if (CLEAN) document.body.classList.add("clean");
    var sm = /[?&]step=(\d+)/.exec(Q);
    if (sm) S.applyStep(Math.min(4, +sm[1]), true);
    if (/solved=1/.test(Q)) S.applyStep(4, true);
    // v31：?gateprobe=1 自动走完门开 + 触发过场，无头 dump-dom 直接读 title 判定。
    // ?nogate=1 时门开但不穿门（回到旧观察点行为），自测据此验证回退开关。
    if (GATE_PROBE) {
      S.applyStep(4, true); renderHUD();
      if (GATE_ON) enterFirstHall();
      else document.title = "GATE disabled(nogate) step=" + S.step + " target=none";
    }
    // v32：walkgate=1 自动开门 + 把相机放到门外（z=-20.6），靠真实 walkMinZ
    // 边界放行 + checkGateCross() 位置检测触发穿门，验证「走过去就能进」而非点击。
    if (WALK_GATE_TEST) {
      S.applyStep(4, true); renderHUD();
      camera.position.set(0, 1.62, -20.6);
      aimAt(AIM);
      // 先确认没开门时这个位置会被夹回去；开门后 checkGateCross 才会真的穿门。
      if (GATE_ON) {
        checkGateCross();   // enterFirstHall 已把 WALKGATE 结果写进 title
      } else {
        document.title = "WALKGATE disabled(nogate) step=" + S.step;
      }
    }
    var cm = /[?&]cam=(-?[\d.]+),(-?[\d.]+),(-?[\d.]+)/.exec(Q);
    if (cm) {
      camera.position.set(+cm[1], +cm[2], +cm[3]);
      aimAt(AIM);                 // 视线仍锚在原远点，等效旧版「target 固定」
      keepInside();
    }
    var lm = /[?&]look=(-?[\d.]+),(-?[\d.]+),(-?[\d.]+)/.exec(Q);
    if (lm) {
      aimAt(new T.Vector3(+lm[1], +lm[2], +lm[3]));
      keepInside();
    }
    var om = /[?&]orbit=(-?[\d.]+),(-?[\d.]+),(-?[\d.]+)/.exec(Q);
    if (om) {
      // 旧语义：以原远瞄准点为球心按 (az,pol,dist) 摆机位。位置照旧算，
      // 再把旋转中心就近化，构图与旧版一致。
      camera.position.setFromSpherical(
        new T.Spherical(+om[3], +om[2], +om[1])).add(AIM);
      aimAt(AIM);
      keepInside();
    }
    renderHUD();

    // 确定性探针：无头浏览器做漫游 / 教学链验证
    window.__prologueProbe = function () {
      return { step: S.step, observed: S.observedCount,
               cam: camera.position.toArray().map(function (v) { return +v.toFixed(3); }),
               target: controls.target.toArray().map(function (v) { return +v.toFixed(3); }),
               busy: S.busy() };
    };
    window.__stepProbe = function (n) {
      S.advance(false); renderHUD(); invalidate(60);
      return S.step;
    };
    // v31：厅间过场自测。gate=1 时可由无头脚本主动调用 __gateProbe() 验证
    // 「门开 → 过场亮起 → 目标第一殿」整条链路，不依赖真实点击投影。
    window.__gateProbe = function () {
      return { gateOn: GATE_ON, step: S.step, opened: S.step >= 4,
               entering: entering,
               veil: !!document.getElementById("gate") &&
                     document.getElementById("gate").classList.contains("on"),
               target: "../first-hall/?from=prologue=1" };
    };
    window.__enterGate = function () { enterFirstHall(); return window.__gateProbe(); };
    // v32：空气墙自测——原长凳 / 木案 / 判官三处碰撞盒位置现在都应可站立。
    window.__standProbe = function () {
      return { bench: canStand(-0.6, 1.95), desk: canStand(1.5, -1.0),
               judge: canStand(J[0], J[2]), walls: WALLS,
               minZclosed: -20.05, minZopen: walkMinZ() };
    };
    if (/wallprobe=1/.test(Q)) {
      var sp = window.__standProbe();
      document.title = "WALL bench=" + sp.bench + " desk=" + sp.desk +
        " judge=" + sp.judge + " walls=" + sp.walls;
    }
    // v33：门态诊断——默认 step=0 门必须关（minZ 只到 -20.05）；solved=1 才开（-20.95）。
    if (/gateprobe2=1/.test(Q)) {
      document.title = "GATE2 step=" + S.step + " open=" + (S.step >= 4) +
        " minZ=" + walkMinZ() + " hint=" + $("#hint").textContent.slice(0, 24);
    }
    // v35：点一个「没轮到」的证物（step=0 时点香炉），验证状态不推进 + 提示出现。
    if (WRONG_PICK_PROBE) {
      var before = S.step;
      handle("incense");                       // step=0 时香炉尚未轮到
      var after = S.step;
      // handle 里已写了一次 title，这里补上前后对比，避免被覆盖
      document.title = "WRONGPICK clicked=incense want=" + S.PICKS[before] +
        " keptStep=" + after + " stayed=" + (before === after) +
        " toast=" + ($("#toast").textContent || "none").slice(0, 20);
    }
    window.__walkProbe = function (n) {
      keys.w = true;
      for (var i = 0; i < (n || 20); i++) stepWalk();
      keys = Object.create(null);
      invalidate(4);
      return camera.position.toArray().map(function (v) { return +v.toFixed(3); });
    };

    // ?probe=1：把每一步该点的物件投影到屏幕，构造真实点击事件走完整条教学链。
    // 验证的是 raycaster 命中 + 状态机 + HUD，不是直接改状态；无头浏览器 dump-dom
    // 读 document.title 即可判定。
    if (/[?&]probe=1(?:&|$)/.test(Q)) {
      window.__probeBypass = true;
      var plog = [];
      function autoPick(n) {
        if (n >= 4 || S.step >= 4) {
          document.title = "AUTOPICK " + plog.join(" | ") + " FINAL=" + S.step;
          window.__probeLog = plog;
          return;
        }
        var want = S.PICKS[S.step], center = null;
        camera.updateMatrixWorld();
        S.pickMeshes.forEach(function (o) {
          if (center || o.visible === false || pickIdOf(o) !== want) return;
          o.updateWorldMatrix(true, true);
          var bb = new T.Box3().setFromObject(o);
          if (!bb.isEmpty()) center = bb.getCenter(new T.Vector3());
        });
        if (!center) { plog.push(want + ":NO_MESH"); return autoPick(n + 1); }
        var v = center.clone().project(camera);
        var rect = renderer.domElement.getBoundingClientRect();
        onPick({ target: renderer.domElement,
                 clientX: rect.left + (v.x * .5 + .5) * rect.width,
                 clientY: rect.top + (.5 - v.y * .5) * rect.height });
        plog.push(want + "->" + S.step);
        setTimeout(function () { autoPick(n + 1); }, 1800);
      }
      setTimeout(function () { autoPick(0); }, 500);
    }
    return true;
  }

  function tick() {
    requestAnimationFrame(tick);
    var now = performance.now();
    var dt = lastFrameT ? Math.min(.05, (now - lastFrameT) / 1000) : .016;
    lastFrameT = now;
    if (!CLEAN) animT += dt;
    // 出图模式把时间冻结在 0：雾幕偏移 / 微光呼吸全部静止，无头截图不会等无限动画
    var moving = S.update(dt, CLEAN ? 0 : animT);
    var walked = stepWalk();
    checkApproach();
    checkGateCross();
    // 走近前判官胸前一点极淡呼吸微光（图形引导，不是文字提示）；触发后收掉
    if (S.refs.judgeGlow) {
      S.refs.judgeGlow.material.opacity = nearJudge ? .025 :
        (CLEAN ? .10 : .075 + .045 * Math.sin(animT * 1.6));
    }
    // controls.update() 必须每帧调用：enableDamping 的惯性靠连续 update 衰减。
    // 旧写法只在「还有帧可渲」时才 update，松手后惯性会冻住 —— 这是转动卡顿的
    // 第二个原因。update() 返回 true 表示相机仍在变化，可直接当作续帧信号。
    var changed = controls.update();
    keepInside();
    if (idle > 0) idle--;
    // 静止时跳过 render 省资源；但阻尼惯性 / 漫游 / 雾动 / 交互续帧期间一律连续出帧
    if (moving || walked || changed || now < wakeUntil || idle > 0) {
      renderer.render(scene, camera);
      frame++;
    }
  }

  function boot() {
    if (!init()) return;
    // 揭幕不等资产、不在启动流程里同步 render（那一帧会把软渲染拖到 150 s+）。
    // 建筑壳在 init() 结束时已经完整，直接揭幕；Aholo Lux3D GLB 异步挂载，
    // 单件缺失 / 超时都不阻断进厅（沿用第一殿 v7.1 的修复结论）。
    if (window.PrologueLux3D) {
      window.PrologueLux3D.mount(S, function () {
        invalidate(8);
        var el = document.getElementById("metaAsset"), st = window.__lux3dStatus;
        if (el && st) el.textContent = "Aholo Lux3D · 已挂载 " +
          st.mounted + " / " + st.total + " 件生成资产";
      });
    }
    loadTxt("阴司便民司 · 三更");
    $("#loading").classList.add("done");
    invalidate(40);
    tick();
    // v29：默认改成「走到判官身边才开口」；出图 / 探针 / 面板自测 /
    // ?noapproach=1 仍走这条强制开场，保证带字幕定稿图与验证脚本不变。
    // ?clean=1 / ?probe=1 / ?nodlg=1 时 D.enabled=false，两条路都不会启动。
    if (D && D.enabled && !APPROACH_ON) setTimeout(function () { D.start(); }, 900);
    if (APPROACH_TEST && APPROACH_ON) {
      // 自测：把相机放到判官斜前方约 2.05 m（仍在 APPROACH_R 内），
      // dump-dom 不用等 rAF 就能读到触发结果；第 18 张实拍也用这个参数。
      // v30：1.52 m 时脸贴满整个画面，拉远并下移视线，让坐姿与案桌一起进画。
      camera.position.set(J[0] + .36, 1.58, J[2] + 2.02);
      aimAt(new T.Vector3(J[0], 1.16, J[2]));
      keepInside();
      checkApproach();
      invalidate(30);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, false);
  } else boot();
})();
