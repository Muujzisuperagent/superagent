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
    { key: "machine", url: NEW + "S0-12_ticket_machine_A.glb", host: "machine",
      fit: [.50, .60, .42], pos: [0, 0, 0], keepRefs: ["crank"], label: "取号机",
      tint: 0x8d9a92 },
    { key: "ticket", url: NEW + "S0-13_bamboo_tally_A.glb", host: "ticket",
      fit: [.12, .012, .042], proxySelf: true, label: "竹牌", tint: 0x9aa89c },
    { key: "bench", url: NEW + "S0-07_elm_bench_A.glb", host: "bench",
      fit: [1.82, .50, .46], label: "榆木长凳", tint: 0x8c9188 },
    { key: "folk", url: NEW + "S0-37_paper_effigy_A.glb", host: "folk",
      fit: [.56, 1.82, .20], instances: 5, label: "面壁纸扎人", tint: 0x8e9c92 },
    { key: "lamp", url: NEW + "S0-15_paper_lantern_A.glb", host: "lamp",
      fit: [.40, .50, .40], keepGeom: ["SphereGeometry"], label: "白纸灯笼" },
    // 路引的「两半可合」是状态不是模型结构，两半 + 半印 + 命中板全部保留；
    // Lux3D 实物挂在木案上，作为同一张牒的可信表面。
    { key: "pass", url: NEW + "S0-21_blank_pass_A.glb", host: "desk",
      fit: [.40, .012, .28], pos: [.86, .95, .24], rotY: -.22,
      noShell: true, label: "空白路引", tint: 0xa8b0a0 },
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
  var FOLK = [
    { z: -1.55, x: -2.98, h: 1.000, lean: .052, yaw:  .00, turn: 3.20 },
    { z: -2.82, x: -2.91, h: 0.958, lean: .086, yaw:  .05, turn: 0.00 },
    { z: -4.34, x: -2.99, h: 1.035, lean: .038, yaw: -.04, turn: 2.93 },
    { z: -5.66, x: -2.92, h: 0.978, lean: .070, yaw:  .03, turn: 0.00 },
    { z: -7.03, x: -2.97, h: 1.012, lean: .048, yaw: -.02, turn: 0.00 }
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

  function fitTo(obj, fit) {
    obj.updateMatrixWorld(true);
    var bb = new T.Box3().setFromObject(obj);
    if (bb.isEmpty()) return obj;
    var s = bb.getSize(new T.Vector3());
    var k = Math.min(fit[0] / (s.x || 1), fit[1] / (s.y || 1), fit[2] / (s.z || 1));
    if (!isFinite(k) || k <= 0) return obj;
    var wrap = new T.Group();
    wrap.add(obj);
    obj.scale.multiplyScalar(k);
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
            var wrap = fitTo(obj, a.fit);
            if (a.pos) wrap.position.set(a.pos[0], a.pos[1], a.pos[2]);
            if (a.rotY) wrap.rotation.y = a.rotY;
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
