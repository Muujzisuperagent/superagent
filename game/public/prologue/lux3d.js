/* 序厅 · Aholo Lux3D 资产接入层（可选，缺 GLB 时整层静默跳过）
 *
 * 架构约定（沿用第一殿 build 文档第 31 行）：
 *   Lux3D 模型只负责「有这个东西、表面可信」，所有状态变化 —— 摇柄转一圈、
 *   竹牌落下、两半合拢、香逐段变短、双扇门开 —— 全部由引擎驱动。
 *   所以这里只替换「外观」，绝不改 scene.js 的状态机与 refs 动画部件。
 *
 * 目录：
 *   ../models/prologue/S0-*.glb   序厅新生成的 6 件
 *   ../models/low/S1-*.glb        第一殿已生成的复用件（低模，网页端不炸显存）
 *
 * 隐私：本文件不含任何签名 URL、API Key 或凭证。
 * 合规：9 件 GLB 全部到位后，序厅才是比赛要求的 Lux3D 交付态。
 */
(function () {
  "use strict";
  var T = window.THREE;
  var NEW = "../models/prologue/";
  var REUSE = "../models/low/";

  // fit = [宽, 高, 深]（米）。原始 Lux3D 包围盒互不成比例，一律等比定尺后底部对齐。
  // keepGeom / keepRefs 里的程序化部件不替换外观（它们是动画或线索，仍由引擎控制）。
  // tint: the Lux3D assets come out warm and saturated. The hall's material
  // language (paper folk / old elm / wet bluestone) is a cold grey-green
  // band, so each asset gets a multiply tint that pulls it into that band
  // while keeping its own texture detail. The paper lantern stays untouched:
  // it is the hall's only warm-white light source.
  var ASSETS = [
    // 判官：Lux3D G1-Turbo 坐像（taskId 8405488，S0-42）。乌纱幞头（高冠 +
    // 两侧平直展脚）、深灰绿官袍、清瘦长须、朱笔 + 生死簿 + 自带案桌。
    // 案桌与人物在同一个 mesh（node 只有一个 geometry_0），拆不出独立节点；
    // 挂在 judgeShell 上，自带案桌落在程序化木案（desk at x=1.52）左侧空档，
    // 与 desk 不相交。程序化 v29 身体只做兜底：GLB 挂上后由 hideRefs 隐藏。
    { key: "judge", url: NEW + "S0-42_judge_seated_A.glb", host: "judge",
      fit: [1.10, 1.32, .88], axis: [1, 1], pos: [0, 0, .02],
      tint: 0x9fa8a2, noShell: true, hideRefs: ["judgeProc"], pick: "judge",
      label: "判官坐像（Lux3D）" },
    // machine: a low wide counter-top box (not a cabinet). 0.46 wide,
    // 0.30 tall -- clearly wider than tall, so it reads as a machine on the
    // counter rather than a cupboard.
    { key: "machine", url: NEW + "S0-12_ticket_machine_A.glb", host: "machine",
      fit: [.46, .30, .38], pos: [0, 0, 0], keepRefs: ["crank"], label: "取号机",
      tint: 0x8d9a92, squash: [.46, .30, .38] },
    { key: "ticket", url: NEW + "S0-13_bamboo_tally_A.glb", host: "ticket",
      fit: [.12, .012, .042], proxySelf: true, label: "竹牌", tint: 0x9aa89c },
    // bench: a long narrow plank seat, 1.82 m long, 0.46 high, 0.44 deep.
    // The source GLB's long edge is its X axis; it is placed unrotated so the
    // seat runs along the corridor.
    { key: "bench", url: NEW + "S0-07_elm_bench_A.glb", host: "bench",
      fit: [1.82, .46, .44], axis: [0, 0], label: "榆木长凳", tint: 0x8c9188,
      squash: [1.82, .46, .44] },
    // folk: a full-height paper effigy, 1.80 m tall. The five instances keep
    // their own h / lean / yaw / turn so they are not five copies. The wide
    // AABB of the source model (arms out) is squashed back to body width.
    { key: "folk", url: NEW + "S0-37_paper_effigy_A.glb", host: "folk",
      fit: [.56, 1.75, .40], axis: [1, 1], instances: 5, label: "面壁纸扎人",
      tint: 0xa8a894, squash: [.56, 1.75, .40] },
    { key: "lamp", url: NEW + "S0-15_paper_lantern_A.glb", host: "lamp",
      fit: [.40, .50, .40], keepGeom: ["SphereGeometry"], label: "白纸灯笼" },
    // 路引的「两半可合」是状态不是模型结构，两半 + 半印 + 命中板全部保留；
    // Lux3D 实物挂在木案上，作为同一张牒的可信表面。
    // pass: a blank document lying FLAT on the desk, 0.40 x 0.28 m, a couple
    // of millimetres thick. The source model is a sheet standing on edge, so
    // it is laid down (rotX) and then squashed on the thin axis.
    { key: "pass", url: NEW + "S0-21_blank_pass_A.glb", host: "desk",
      fit: [.40, .012, .28], pos: [.86, .951, .24], rotY: -.22, rotX: -Math.PI / 2,
      axis: [0, 0], squash: [.40, .012, .28],
      noShell: true, label: "空白路引", tint: 0xa8b0a0, map: [0, 1, 2] },
    { key: "censer", url: REUSE + "S1-06_censer_A.glb", host: "censer",
      fit: [.30, .28, .28], keepGeom: ["SphereGeometry"], keepRefs: ["stickSegs", "ember"],
      label: "青铜香炉（复用）", tint: 0x93a49c },
    { key: "ledger", url: REUSE + "S1-09_ledger_volume_A.glb", host: "desk",
      fit: [.34, .16, .28], pos: [-.88, .95, .10], rotY: .34,
      noShell: true, label: "线装卷册（复用）", tint: 0x9aa89c },
    // 柜门原始比例接近方形，拉成 3 m 门扇会变形，改作墙角倚放的旧门板陈设。
    { key: "cabinet", url: REUSE + "S1-08_cabinet_door_A.glb", host: "root",
      fit: [.72, .93, .12], pos: [2.86, 0, -8.4], rotY: -Math.PI / 2 - .12,
      noShell: true, label: "旧柜门（复用）", tint: 0x8d9a92 }
  ];

  // 与 scene.js 的 FOLK 表逐项一致：GLB 到位后，五个实例仍是「五个不一样的人」，
  // 不会退回成一个模型复制五遍。改动其中一处时记得同步另一处。
  // The five paper effigies: each one keeps its own height, lean, yaw and
  // turn, so they are not five copies of the same model.
  var FOLK = [
    { z: -1.55, x: -2.98, h: 1.000, lean: .052, yaw:  .00, turn: 3.20 },
    { z: -2.82, x: -2.91, h: 0.975, lean: .086, yaw:  .05, turn: 0.00 },
    { z: -4.34, x: -2.99, h: 1.022, lean: .038, yaw: -.04, turn: 2.93 },
    { z: -5.66, x: -2.92, h: 0.991, lean: .070, yaw:  .03, turn: 0.00 },
    { z: -7.03, x: -2.97, h: 1.014, lean: .048, yaw: -.02, turn: 0.00 }
  ];

  function proxyMat() {
    // 不是 visible=false：探针与点击仍要命中，包围盒也必须保持原形状。
    // colorWrite=false 让它完全不画，opacity .001 避开 app.js 的 opacity===0 跳过规则。
    return new T.MeshBasicMaterial({ transparent: true, opacity: .001,
      depthWrite: false, colorWrite: false, side: T.DoubleSide });
  }

  function isKept(o, keepObjs, keepGeom) {
    if (o.isSprite) return true;                       // 冷火光晕、引导微光
    if (keepGeom && keepGeom.indexOf(o.geometry && o.geometry.type) >= 0) return true;
    var p = o;
    while (p) {
      if (keepObjs.indexOf(p) >= 0) return true;
      p = p.parent;
    }
    return false;
  }

  // 把程序化外壳换成「不可见但可命中」的代理，GLB 成为唯一可见外观
  function shellToProxy(host, keepObjs, keepGeom) {
    var pm = proxyMat();
    host.traverse(function (o) {
      if (!o.isMesh || isKept(o, keepObjs, keepGeom)) return;
      o.material = pm;
    });
  }

  // Fit by the LONGEST edge, not by min-fit.
  //
  // The old rule was k = min(fit[i] / size[i]) -- "the model must fit inside
  // the target box on every axis at once". That collapses whenever the model's
  // own proportions differ from the target box: the blank pass is a thin
  // sheet standing on edge (0.30 x 0.243 x 0.030 m) but has to lie flat on
  // the desk (0.40 x 0.012 x 0.28 m), so the 0.012 m axis forced k = 0.4 and
  // the whole prop shrank to 0.015 m.
  //
  // Now: k comes from the longest edge, then an optional per-axis squash
  // squeezes the remaining axes to the target proportions.
  // Size of the model along its OWN axes (not the world AABB).
  //
  // Box3.setFromObject returns the world-axis-aligned box, so a model that
  // has been rotated 90 degrees measures as if it were lying on its side --
  // the fit then lands on the wrong axis entirely. Here the geometry AABB is
  // measured first, then the rotation matrix is applied to the side lengths,
  // which gives the size along the object's own axes.
  function ownSize(obj) {
    var lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
    obj.updateMatrixWorld(true);
    obj.traverse(function (m) {
      if (!m.isMesh || !m.geometry) return;
      if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
      var g = m.geometry.boundingBox;
      var pts = [
        [g.min.x, g.min.y, g.min.z], [g.max.x, g.min.y, g.min.z],
        [g.min.x, g.max.y, g.min.z], [g.max.x, g.max.y, g.min.z],
        [g.min.x, g.min.y, g.max.z], [g.max.x, g.min.y, g.max.z],
        [g.min.x, g.max.y, g.max.z], [g.max.x, g.max.y, g.max.z]
      ];
      var v = new T.Vector3();
      for (var i = 0; i < pts.length; i++) {
        v.set(pts[i][0], pts[i][1], pts[i][2]);
        v.applyMatrix4(m.matrixWorld);
        for (var a = 0; a < 3; a++) {
          if (v.getComponent(a) < lo[a]) lo[a] = v.getComponent(a);
          if (v.getComponent(a) > hi[a]) hi[a] = v.getComponent(a);
        }
      }
    });
    if (lo[0] > hi[0]) return [1, 1, 1];
    return [hi[0] - lo[0] || 1, hi[1] - lo[1] || 1, hi[2] - lo[2] || 1];
  }

  function fitTo(obj, fit, opt) {
    opt = opt || {};
    var dims = ownSize(obj);
    // target axis t takes the model axis opt.map[t] (default: identity)
    var map = opt.map || [0, 1, 2];
    // primary pair: the model axis that decides the scale
    var mi = 0, fi = 0;
    if (opt.axis) {
      mi = opt.axis[0]; fi = opt.axis[1];
    } else {
      for (var i = 1; i < 3; i++) {
        if (dims[map[i]] > dims[map[mi]]) mi = i;
        if (fit[i] > fit[fi]) fi = i;
      }
      mi = map[mi];
    }
    var k = fit[fi] / (dims[mi] || 1);
    if (!isFinite(k) || k <= 0) return obj;
    var wrap = new T.Group();
    wrap.add(obj);
    obj.scale.multiplyScalar(k);
    if (opt.squash) {
      // per-axis correction after the uniform scale
      obj.updateMatrixWorld(true);
      var b1 = new T.Box3().setFromObject(obj);
      var s1 = b1.getSize(new T.Vector3());
      var cur = [s1.x || 1, s1.y || 1, s1.z || 1];
      for (var a2 = 0; a2 < 3; a2++) {
        if (opt.squash[a2] && cur[a2]) {
          obj.scale[ ['x','y','z'][a2] ] *= opt.squash[a2] / cur[a2];
        }
      }
    }
    obj.updateMatrixWorld(true);
    var b2 = new T.Box3().setFromObject(obj);
    var c = b2.getCenter(new T.Vector3());
    obj.position.x -= c.x;
    obj.position.z -= c.z;
    obj.position.y -= b2.min.y;
    return wrap;
  }

  function clone(proto, tint) {
    var o = proto.clone(true);
    o.traverse(function (n) {
      if (n.isMesh) {
        n.castShadow = false; n.receiveShadow = true;
        if (n.material) {
          n.material = n.material.clone();
          n.material.side = T.DoubleSide;
          // pull the asset into the hall's cold grey-green value band
          if (tint) n.material.color.multiply(new T.Color(tint));
        }
      }
    });
    return o;
  }

  // 不做 HEAD 预探测：与第一殿 loadAssets 同构，直接 load + error 静默跳过。
  // 实测 HEAD + GET 双段请求在 --virtual-time-budget 下会把无头 Edge 拖住不放。
  function loadOne(loader, a) {
    return new Promise(function (resolve) {
      var settled = false;
      function finish(g) {
        if (settled) return;
        settled = true; clearTimeout(timer);
        resolve(g ? g.scene : null);
      }
      var TIMEOUT = /clean=1/.test(location.search) ? 60000 : 12000;
      var timer = setTimeout(function () { finish(null); }, TIMEOUT);
      try {
        loader.load(a.url, finish, undefined, function () { finish(null); });
      } catch (e) { finish(null); }
    });
  }

  /** 挂载。S = PrologueScene.build() 的返回值；onDone 用于补一帧。
   *  ?nolux=1   完全跳过（纯程序化对照 / 排障）
   *  ?newonly=1 只挂序厅新生成 6 件，跳过第一殿复用件（出图排障用）
   */
  function mount(S, onDone) {
    var Q = location.search || "";
    if (/nolux=1/.test(Q)) {
      window.__lux3dStatus = { total: 0, mounted: 0, missing: 0, disabled: "nolux=1" };
      return window.__lux3dStatus;
    }
    var list = /newonly=1/.test(Q)
      ? ASSETS.filter(function (a) { return a.url.indexOf(NEW) === 0; })
      : ASSETS;
    // 判官三条回退路径：?nojudge=1 不建判官、?v28judge=1 用旧几何、
    // ?nolux=1 整层跳过（上面已返回）。这些情况下都不挂 GLB 判官。
    if (/nojudge=1|v28judge=1/.test(Q)) {
      list = list.filter(function (a) { return a.key !== "judge"; });
    }
    var refs = S.refs || {};
    var hosts = refs.luxHosts || {};
    var loader = new T.GLTFLoader();
    var mounted = 0, missing = 0;

    // 单件缺失 / 超时都绝不阻断进厅（第一殿 v7.1 踩过的坑）
    list.forEach(function (a) {
      loadOne(loader, a).then(function (proto) {
          if (!proto) { missing++; return; }
          var host = a.host === "root" ? S.root : hosts[a.host];
          if (!host) { missing++; return; }

          var keepObjs = [];
          (a.keepRefs || []).forEach(function (r) {
            var v = refs[r];
            if (!v) return;
            if (Object.prototype.toString.call(v) === "[object Array]") {
              v.forEach(function (x) { keepObjs.push(x); });
            } else keepObjs.push(v);
          });

          if (!a.proxySelf && !a.noShell) {
            shellToProxy(host, keepObjs, a.keepGeom || []);
          }

          var place = function (target, idx) {
            var obj = clone(proto, a.tint);
            // Lay the prop down BEFORE measuring. The rotation is baked into
            // the geometry, not set on the object: a rotation on the object
            // would make ownSize() measure the world-axis-aligned box again
            // and the fit would land on the wrong axis.
            if (a.rotX) {
              obj.traverse(function (m) {
                if (m.isMesh && m.geometry) m.geometry.rotateX(a.rotX);
              });
            }
            if (a.rotY) obj.rotation.y = a.rotY;
            var wrap = fitTo(obj, a.fit, { squash: a.squash, axis: a.axis });
            if (a.pos) wrap.position.set(a.pos[0], a.pos[1], a.pos[2]);
            if (a.rotY && !a.applyRot) wrap.rotation.y = a.rotY;
            if (a.instances) {
              // 沿用 scene.js 的不等距站位与体态差异（前倾角很小，Euler 耦合可忽略）
              var v = FOLK[idx || 0];
              wrap.position.set(v.x, 0, v.z);
              wrap.rotation.y = -Math.PI / 2 - .95 + v.yaw + v.turn;
              wrap.rotation.x = v.lean;
              wrap.scale.setScalar(v.h);
            }
            wrap.userData.lux3d = a.key;
            target.add(wrap);
            // 判官：GLB 网格补上 pick id（mark() 在 build 期就登记了外壳，
            // 但 GLB 是异步后挂的，userData.pick 必须在这里补）。
            if (a.pick) {
              wrap.traverse(function (n) { if (n.isMesh) n.userData.pick = a.pick; });
            }
            // GLB 到位后隐藏程序化兜底身体（整棵子树关掉，避免被射线命中）
            (a.hideRefs || []).forEach(function (r) {
              var o = refs[r];
              if (!o) return;
              o.visible = false;
              o.traverse(function (n) { n.visible = false; });
            });
          };

          if (a.proxySelf) {
            // 竹牌：drop 本身的 visible / position / rotation 仍由落牌动画驱动，
            // 只把自身的程序化盒子换成透明代理，GLB 作为子物体跟着一起动。
            host.material = proxyMat();
            place(host, 0);
          } else if (a.instances) {
            for (var i = 0; i < a.instances; i++) place(host, i);
          } else {
            place(host, 0);
          }
          mounted++;
          if (onDone) onDone();
      });
    });

    // 给外部（debug 面板 / 举证脚本）一个可查询的挂载结果
    window.__lux3dStatus = { total: list.length, get mounted() { return mounted; },
                             get missing() { return missing; },
                             assets: list.map(function (a) { return a.key; }) };
    return window.__lux3dStatus;
  }

  window.PrologueLux3D = { mount: mount, ASSETS: ASSETS };
})();
