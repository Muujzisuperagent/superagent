/* 序厅 · 阴司便民司 — 剧本对白层
 *
 * 台词出处：《还魂路引 · 阴司勘合录》
 *   2.1 开场（L211-234）：崔珏三句、水牌、《阴司办事须知》、递牒点香
 *   L133：签名人本人不认账才可启动复核（「我不认」的程序依据）
 *   L205：更香 = 四十九日倒计时
 *   观察点台词：队友《场景生图提示词 v3 · 恐怖版》「1｜序厅」
 * 少量为了衔接而写的句子一律标「非剧本原文」。
 *
 * 设计原则：
 *   1) 非阻断。字幕条只在底部，玩家随时能走动、转视角、点 3D 物件；
 *      对白是「剧情」，不是「下一步点哪里」的文字教程。
 *   2) 场景内仍无清晰可读文字（v3 负面词）：所有台词都是 DOM 字幕，
 *      不往水牌 / 木牌 / 墙面上贴图写字。
 *   3) 可整体关掉：?nodlg=1 回纯无字版；?clean=1（出图）、?probe=1（探针）
 *      一律不显示，保证纯净定稿图与教学链验证不受影响。
 *   4) ?dlg=1 停在开场首句不自动推进，专供「带对白」举证实拍。
 *
 * v28（mina：「一开始直接让玩家点击我不认好了，不要有认的选项」）：
 *   - 抉择从三选一改成**唯一按钮「我不认」**，且揭幕后立刻出现，不再等开场播完；
 *     去掉「认」「先看看」两个分支及对应台词。
 *   - 判官崔珏是 3D 可点对象（scene.js）：点他 / 按 F 可重听他的话，
 *     没申辩时按钮会重新亮出来，算「与他对话」。
 *   - 卷宗改成 5 组 28 行，申辩后解锁判官的全部台词。
 */
(function () {
  "use strict";
  var Q = location.search;
  var OFF = /nodlg=1/.test(Q) || /clean=1/.test(Q) || /[?&]probe=1(?:&|$)/.test(Q);
  var FREEZE = /dlg=1/.test(Q) || /dlgchoice=1/.test(Q) ||
               /dlglog=1/.test(Q) || /dlgapproach=1/.test(Q);

  // ——— 剧本台词表 ———
  var SCRIPT = {
    intro: [
      { who: "判官崔珏", text: "怪事。你寿数未终，簿上却已勾了名。",
        src: "剧本 2.1 · L228" },
      { who: "判官崔珏", text: "按律，错勾的，得自己举证。四十九日，六殿各盖半印，拼成骑缝章，换一张还魂路引。",
        src: "剧本 2.1 · L229" },
      { who: "判官崔珏", text: "别问我谁改的——上头核账，我也得担责。",
        src: "剧本 2.1 · L230" },
      { who: "", text: "他把一册簿子推到你面前，还有一张空白路引、一枚竹牌、一支秃笔。香点上了。",
        src: "剧本 2.1 · L232（叙述改写）" }
    ],
    // v28：只保留「我不认」一条路，问句也不再给「认」这个选项
    oath: { who: "判官崔珏", text: "签名人本人不认账，才可启动复核。要翻案，得你自己开口。",
      src: "剧本 L133（程序设定）+ 衔接句" },
    oathNo: [
      { who: "", text: "「我不认。」", src: "剧本 L133 原句" },
      { who: "", text: "他一个字也没替你说，只把牒、竹牌和秃笔推过来。",
        src: "剧本 L133 / L232（叙述改写）" }
    ],
    // 申辩之后判官才交代案情：原来开场就播的三句挪到这里，节奏更顺
    afterOath: [
      { who: "判官崔珏", text: "好。按律，错勾的得自己举证。四十九日，六殿各盖半印，拼成骑缝章，换一张还魂路引。",
        src: "剧本 2.1 · L229（改写）" },
      { who: "", text: "他把一册簿子推到你面前，还有一张空白路引、一枚竹牌、一支秃笔。香点上了。",
        src: "剧本 2.1 · L232（叙述改写）" }
    ],
    // 点 3D 判官 / 按 F 时轮播：与判官对话，不推进主线
    talk: [
      { who: "判官崔珏", text: "怪事。你寿数未终，簿上却已勾了名。", src: "剧本 2.1 · L228" },
      { who: "判官崔珏", text: "按律，错勾的，得自己举证。四十九日，六殿各盖半印，拼成骑缝章，换一张还魂路引。",
        src: "剧本 2.1 · L229" },
      { who: "判官崔珏", text: "别问我谁改的——上头核账，我也得担责。", src: "剧本 2.1 · L230" },
      { who: "判官崔珏", text: "香还长。自己看案卷，本司不提供咨询。", src: "剧本 2.1 · L223（衔接改写）" }
    ],
    steps: [
      { who: "", text: "木柄转了一圈，一枚竹牌落出来。", src: "剧本 2.1 · L219" },
      { who: "", text: "竹牌收进袖里。", src: "衔接句（非剧本原文）" },
      { who: "", text: "两半纸合上了骑缝。", src: "剧本 2.1 · L232" },
      { who: "", text: "香点上了。第一殿的门，自己开了。", src: "剧本 2.1 · L232 + 场景" }
    ],
    end: [
      { who: "", text: "四十九日，从这一炷香算起。", src: "剧本 L205 / L232（叙述改写）" },
      { who: "判官崔珏", text: "去吧。别问我谁改的。", src: "回扣 L230（衔接句）" }
    ],
    observe: {
      handprint: { who: "", text: "窗纸上一层模糊的掌印，指节压得很深，看不出是谁留下的。",
        src: "v3 · 模糊掌印" },
      bench: { who: "", text: "凳面还凹着，像刚有人坐过。你说不清是不是自己。",
        src: "剧本 2.1 · 你在木长凳上醒来" },
      folk: { who: "", text: "一排纸人面壁站着，没一个回头。", src: "v3 · 面壁纸扎人" },
      smoke: { who: "", text: "香还没点，烟却贴着地往门外流。", src: "v3 · 贴地倒流香烟" },
      notice: { who: "", text: "《阴司办事须知》第三条：本司不提供咨询，请自行查阅案卷。",
        src: "剧本 2.1 · L223" },
      watercard: { who: "", text: "甲字叁号 · 请至叁号窗口办理 · 叁号窗口：暂停服务。",
        src: "剧本 2.1 · L213-217" },
      window: { who: "", text: "六扇窗只开了一扇，外头是白得没有边际的雾。",
        src: "v3 · 六扇窗只开一扇" },
      lamp: { who: "", text: "白纸灯笼里一点青白冷火，不摇，也不暖。", src: "v3 · 青白冷火" },
      door: { who: "", text: "门后透进冷白。无引者不得离殿——须知第一条是这么写的。",
        src: "剧本 2.1 · L221" }
    }
  };

  var OBS_LABEL = {
    handprint: "窗上掌印", bench: "长凳凹痕", folk: "面壁纸人", smoke: "贴地香烟",
    notice: "办事须知", watercard: "朱笔水牌", window: "半开的窗",
    lamp: "白纸灯笼", door: "第一殿门"
  };

  // 卷宗：开场 / 申辩 / 四步 / 所见 / 通关，已读的才展开全文
  var read = { intro: false, oath: false, talk: false,
               steps: [false, false, false, false],
               seen: Object.create(null), end: false };
  var queue = [], onIdle = null, timer = null, on = !OFF, started = false;
  // v34：开场两句判官台词是否播完。「我不认」按钮必须等它为 true 才准弹出，
  // 否则 talk()/protest()/走近反复触发会在第一句话还没播完时就把按钮亮出来，
  // 视觉上就是「按钮和判官的话重叠」。
  var introDone = false;
  var box, whoEl, textEl, srcEl, choiceEl, logEl, toggleEl;

  function el(tag, id, cls, html) {
    var e = document.createElement(tag);
    if (id) e.id = id;
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function injectStyle() {
    var s = el("style");
    s.textContent = [
      "#dlgBox{position:fixed;left:50%;bottom:88px;transform:translate(-50%,10px);z-index:14;",
      "  width:min(720px,88vw);padding:16px 22px 15px;box-sizing:border-box;",
      "  background:rgba(12,17,16,.90);border:1px solid rgba(186,200,190,.24);",
      "  border-left:2px solid rgba(184,87,62,.75);border-radius:4px;",
      "  backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);",
      "  box-shadow:0 14px 44px rgba(0,0,0,.55);opacity:0;pointer-events:none;transition:.3s;cursor:pointer}",
      "#dlgBox.on{opacity:1;transform:translate(-50%,0);pointer-events:auto}",
      "#dlgBox.narr{border-left-color:rgba(168,201,187,.45)}",
      ".dlg-who{font:400 11px/1.4 var(--serif);letter-spacing:.16em;margin-bottom:7px}",
      ".dlg-who.npc{color:var(--cinnabar)}.dlg-who.narr{color:var(--dim)}",
      ".dlg-text{font:400 15px/1.85 var(--serif);letter-spacing:.045em;color:var(--ink);min-height:28px}",
      ".dlg-foot{display:flex;justify-content:space-between;gap:12px;margin-top:9px;",
      "  font:10px/1.4 var(--mono);color:var(--dim);opacity:.72}",
      ".dlg-next{color:var(--jade);white-space:nowrap}",
      "#dlgChoice{position:fixed;left:50%;bottom:196px;transform:translate(-50%,8px);z-index:15;",
      "  width:min(560px,88vw);padding:17px 20px;box-sizing:border-box;text-align:center;",
      "  background:rgba(14,19,18,.95);border:1px solid rgba(184,87,62,.42);border-radius:6px;",
      "  box-shadow:0 16px 50px rgba(0,0,0,.6);opacity:0;pointer-events:none;transition:.3s;display:none}",
      "#dlgChoice.on{display:block;opacity:1;transform:translate(-50%,0);pointer-events:auto}",
      // v30：抉择面板与字幕条上下叠着时读起来像两层卡片；抉择一亮就把上一句字幕淡下
      "#dlgBox{transition:opacity .35s ease}",
      // v30：出图冻结模式（?dlg=1 / ?dlgapproach=1 等）要清楚举证字幕，不淡化；
      // 只有玩家真实走近触发时才把上一句压下去，避免两层卡片叠着读。
      "body.choosing:not(.freeze) #dlgBox{opacity:.22}",
      ".dlg-cq{font:400 13px/1.8 var(--serif);letter-spacing:.05em;color:var(--ink);margin-bottom:14px}",
      ".dlg-cq em{display:block;font:10px/1.5 var(--mono);font-style:normal;color:var(--dim);margin-top:7px;letter-spacing:.08em}",
      ".dlg-opts{display:flex;gap:9px;justify-content:center;flex-wrap:wrap}",
      ".dlg-opt{padding:8px 17px;border:1px solid rgba(186,200,190,.28);border-radius:4px;",
      "  background:rgba(255,255,255,.025);color:var(--ink);font:400 13px/1.4 var(--serif);",
      "  letter-spacing:.08em;cursor:pointer;transition:.15s}",
      ".dlg-opt:hover{border-color:var(--jade);background:rgba(168,201,187,.10)}",
      ".dlg-opt.key{border-color:rgba(184,87,62,.6);color:#e7c7bb;",
      "  padding:10px 34px;font-size:15px;letter-spacing:.18em}",
      "#dlgLog{position:fixed;right:18px;top:70px;z-index:16;width:330px;max-height:70vh;",
      "  overflow-y:auto;padding:16px 18px;box-sizing:border-box;background:rgba(12,17,16,.95);",
      "  border:1px solid var(--line);border-radius:7px;box-shadow:0 18px 54px rgba(0,0,0,.6);display:none}",
      "#dlgLog.on{display:block}",
      "#dlgLog h3{margin:0 0 4px;font:400 15px/1.4 var(--serif);letter-spacing:.14em}",
      "#dlgLog .lg-sub{font:10px/1.6 var(--mono);color:var(--dim);margin:0 0 14px}",
      ".lg-grp{margin:0 0 13px;padding-top:10px;border-top:1px solid rgba(186,200,190,.13)}",
      ".lg-lab{font:10px/1.5 var(--mono);letter-spacing:.14em;color:var(--jade);margin-bottom:7px}",
      ".lg-row{font:400 11.5px/1.75 var(--serif);color:var(--ink);margin:0 0 6px;letter-spacing:.02em}",
      ".lg-row.locked{color:var(--dim);opacity:.45}",
      ".lg-src{display:block;font:9px/1.5 var(--mono);color:var(--dim);opacity:.7;margin-top:2px}",
      "#dlgToggle{position:fixed;right:20px;bottom:62px;z-index:17;padding:7px 12px;",
      "  border:1px solid rgba(168,201,187,.42);border-radius:18px;background:rgba(14,19,18,.84);",
      "  color:var(--jade);font:11px/1.3 var(--serif);letter-spacing:.06em;cursor:pointer}",
      "#dlgToggle:hover{background:rgba(168,201,187,.16)}",
      "body.clean #dlgBox,body.clean #dlgChoice,body.clean #dlgLog,body.clean #dlgToggle{display:none!important}",
      "@media(max-width:820px){#dlgBox{bottom:78px;padding:12px 16px}.dlg-text{font-size:13px}",
      "  #dlgLog{left:10px;right:10px;width:auto;top:auto;bottom:10px;max-height:52vh}}"
    ].join("");
    document.head.appendChild(s);
  }

  function mount() {
    injectStyle();
    if (FREEZE) document.body.classList.add("freeze");
    box = el("div", "dlgBox");
    whoEl = el("div", null, "dlg-who narr", "");
    textEl = el("div", null, "dlg-text", "");
    var foot = el("div", null, "dlg-foot");
    srcEl = el("span", null, "dlg-src", "");
    foot.appendChild(srcEl);
    foot.appendChild(el("span", null, "dlg-next", "点击 / 空格 继续 ▸"));
    box.appendChild(whoEl); box.appendChild(textEl); box.appendChild(foot);
    document.body.appendChild(box);

    choiceEl = el("div", "dlgChoice");
    // v28：唯一选项。没有「认」、没有「先看看」——剧情里这一步只有一条路。
    choiceEl.innerHTML =
      '<div class="dlg-cq">判官把簿子推过来，等你开口。' +
      '<em>剧本 L133 · 点判官或按 F 可再听一遍</em></div>' +
      '<div class="dlg-opts">' +
      '<button class="dlg-opt key" data-k="no">我不认</button></div>';
    document.body.appendChild(choiceEl);

    logEl = el("div", "dlgLog");
    document.body.appendChild(logEl);

    toggleEl = el("button", "dlgToggle", null, "对白 · 开");
    document.body.appendChild(toggleEl);

    box.addEventListener("click", function () { advance(); }, false);
    toggleEl.addEventListener("click", toggle, false);
    choiceEl.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest(".dlg-opt") : null;
      if (b) choose(b.getAttribute("data-k"));
    }, false);
    window.addEventListener("keydown", onKey, false);

    // 自测开关：直接展开面板并把结果写进 title，供无头 dump-dom 验证交互真的可开。
    // 只在这两个调试参数下改 title，正常页面标题不受影响。
    if (/dlgchoice=1/.test(Q)) {
      introDone = true;   // 探针：跳过开场闸门，直接验证按钮 DOM 结构
      openChoice();
      document.title = "DLG choice=" + choiceEl.classList.contains("on") +
        " opts=" + choiceEl.querySelectorAll(".dlg-opt").length +
        " yes=" + /data-k="yes"/.test(choiceEl.innerHTML);
    }
    if (/dlglog=1/.test(Q)) {
      openLog();
      document.title = "DLG log=" + logEl.classList.contains("on") +
        " groups=" + logEl.querySelectorAll(".lg-grp").length +
        " rows=" + logEl.querySelectorAll(".lg-row").length;
    }
    // 模拟「点 3D 判官」触发的那条 talk() 链路，验证与他对谈真的会出字幕
    if (/dlgtalk=1/.test(Q)) {
      introDone = true;   // 探针：跳过开场闸门，直接验证 talk 链路本身
      talk();
      document.title = "DLG talk=" + box.classList.contains("on") +
        " idx=" + talkIdx + " choice=" + choiceEl.classList.contains("on");
    }
    // v34 自测：判官开场白播完之前按钮必须关；模拟播完（onIdle）后才放行。
    if (/dlgdone=1/.test(Q)) {
      start();
      var before = choiceEl.classList.contains("on");
      introDone = true;
      openChoice();
      document.title = "DONE before=" + before +
        " after=" + choiceEl.classList.contains("on") + " introDone=" + introDone;
    }
    // v34 自测：判官先说话、开场两句播完才弹「我不认」——开局这一帧按钮必须为关。
    // 同时验证 talk 走完一轮后不再循环（连点多次，idx 停在长度上限）。
    if (/dlgseq=1/.test(Q)) {
      start();
      var firstLine = textEl.textContent;
      var choiceAtStart = choiceEl.classList.contains("on");
      var introGate = introDone;          // 开场闸门应为 false
      introDone = true;                   // 放行后再验证 talk 单轮上限
      for (var t = 0; t < 6; t++) talk();
      document.title = "SEQ first=" + (firstLine.length > 0 ? "shown" : "empty") +
        " firstIsJudge=" + /判官崔珏/.test(whoEl.textContent) +
        " choiceAtStart=" + choiceAtStart +
        " introGate=" + introGate +
        " talkCapped=" + (talkIdx <= SCRIPT.talk.length);
    }
  }

  function render(line) {
    if (!line) return;
    whoEl.textContent = line.who || "旁白";
    whoEl.className = "dlg-who " + (line.who ? "npc" : "narr");
    box.className = line.who ? "on" : "on narr";
    textEl.textContent = line.text;
    srcEl.textContent = line.src || "";
  }

  function showNext() {
    clearTimeout(timer);
    if (!on) return;
    if (!queue.length) {
      box.classList.remove("on");
      var cb = onIdle; onIdle = null;
      if (cb) cb();
      return;
    }
    render(queue.shift());
    if (!FREEZE) timer = setTimeout(advance, 5200);
  }

  function advance() {
    if (!on) return;
    clearTimeout(timer);
    showNext();
  }

  function sayNow(line, after) {
    if (!on) return;
    clearTimeout(timer);
    queue = line ? [line] : [];
    onIdle = after || null;
    showNext();
  }

  function play(lines, after) {
    if (!on || !lines || !lines.length) return;
    clearTimeout(timer);
    queue = lines.slice();
    onIdle = after || null;
    showNext();
  }

  function start() {
    if (!on || started) return;
    started = true;
    read.intro = true;
    if (FREEZE) {
      // 出图 / 举证探针（?dlg=1 / ?dlgapproach=1 等）：保留 v28 行为，
      // 首句 + 按钮同屏，保证 18 张定稿图与探针 title 语义不变。
      sayNow(SCRIPT.oath);
      introDone = true;
      openChoice();
      return;
    }
    // v34：真实游玩——判官先把第一句话说出来（L228「怪事…簿上却已勾了名」），
    // 再把程序问句说完（L133），问句播完才亮出唯一的「我不认」。
    // 关键：openChoice 现在有 introDone 闸门，中途任何 talk()/protest()/
    // 走近反复触发都弹不出按钮，只有这里整段播完（onIdle）才放行。
    // 玩家点字幕可加速；不再「一句没显示就弹按钮」。
    play([SCRIPT.intro[0], SCRIPT.oath], function () {
      introDone = true;
      openChoice();
    });
  }

  function openChoice() {
    if (!on || read.oath) return;
    if (!introDone) return;   // v34：开场判官台词没播完，绝不准弹按钮
    choiceEl.classList.add("on");
    document.body.classList.add("choosing");
  }

  function choose(k) {
    choiceEl.classList.remove("on");
    document.body.classList.remove("choosing");
    if (k !== "no") return;                  // 唯一选项，其余一律不响应
    if (read.oath) { talk(); return; }       // 已申辩过再点，就再听判官说一句
    read.oath = true;
    read.talk = true;
    // 申辩 → 他把东西推过来 → 交代四十九日与六殿半印，然后才轮到教学链
    play(SCRIPT.oathNo.concat(SCRIPT.afterOath));
  }

  // 点 3D 判官 = 与他对谈：每点一次说一句，说完一轮（4 句）就结束，
  // v32：**不再 % length 循环轮播**——用户反馈「他说的话点完就该结束」。
  // 还没申辩时顺手把「我不认」重新亮出来，玩家随时能接上剧情。
  var talkIdx = 0;
  function talk() {
    if (!on) return;
    if (!introDone) return;     // v34：开场两句还没播完，点判官不打断、不弹按钮
    read.talk = true;
    if (talkIdx >= SCRIPT.talk.length) return;  // 一轮说完，静默，不回头循环
    sayNow(SCRIPT.talk[talkIdx]);
    talkIdx++;
    if (!read.oath) openChoice();
  }
  // F 键 / 已申辩后再点按钮：重听问话或轮播判官台词
  function protest() {
    if (!on) return;
    if (!introDone) return;     // v34：同上，开场白优先，不许中途插话弹按钮
    if (read.oath) { talk(); return; }
    sayNow(SCRIPT.oath);
    openChoice();
  }

  function step(i) {
    if (!on) return;
    if (i >= 0 && i < 4) read.steps[i] = true;
    // 第 4 步（点香 / 门开）后面自动接收尾两句，避免被下一句台词吞掉
    if (i === 3) play([SCRIPT.steps[3]], function () { end(); });
    else sayNow(SCRIPT.steps[i]);
  }

  function observe(id) {
    if (!on) return;
    var line = SCRIPT.observe[id];
    if (!line) return;
    read.seen[id] = true;
    sayNow(line);
  }

  function end() {
    if (!on || read.end) return;
    read.end = true;
    play(SCRIPT.end);
  }

  function toggle() {
    on = !on;
    toggleEl.textContent = "对白 · " + (on ? "开" : "关");
    if (!on) {
      clearTimeout(timer);
      box.classList.remove("on");
      choiceEl.classList.remove("on");
      logEl.classList.remove("on");
      document.body.classList.remove("choosing");
      queue = []; onIdle = null;
    } else if (!started) {
      start();
    }
  }

  function group(title, rows) {
    return '<div class="lg-grp"><div class="lg-lab">' + title + '</div>' + rows + '</div>';
  }
  function row(line, unlocked) {
    if (!unlocked) return '<p class="lg-row locked">—　尚未读到</p>';
    return '<p class="lg-row">' + (line.who ? line.who + "：" : "") + line.text +
           '<span class="lg-src">' + (line.src || "") + '</span></p>';
  }

  function openLog() {
    if (!on) return;
    var html = '<h3>阴司勘合录 · 序厅卷宗</h3>' +
      '<p class="lg-sub">读过的对白留在这里 · T 收起 · 出处见每行小字</p>';
    html += group("一 · 申辩（亲口说「我不认」）",
      row(SCRIPT.oath, read.intro) +
      SCRIPT.oathNo.concat(SCRIPT.afterOath).map(function (l) {
        return row(l, read.oath);
      }).join(""));
    html += group("二 · 判官的话（点他可再听）",
      SCRIPT.talk.concat(SCRIPT.intro).map(function (l) {
        return row(l, read.talk);
      }).join(""));
    html += group("三 · 领牒四步",
      SCRIPT.steps.map(function (l, i) { return row(l, read.steps[i]); }).join(""));
    html += group("四 · 所见（可点观察处）",
      Object.keys(OBS_LABEL).map(function (k) {
        return row(SCRIPT.observe[k], !!read.seen[k]);
      }).join(""));
    html += group("五 · 门开",
      SCRIPT.end.map(function (l) { return row(l, read.end); }).join(""));
    logEl.innerHTML = html;
    logEl.classList.toggle("on");
  }

  function onKey(ev) {
    var k = (ev.key || "").toLowerCase();
    if (k === " " || k === "spacebar" || k === "enter") {
      if (box && box.classList.contains("on")) { ev.preventDefault(); advance(); }
    } else if (k === "escape") {
      if (logEl) logEl.classList.remove("on");
      if (choiceEl) choiceEl.classList.remove("on");
      document.body.classList.remove("choosing");
      clearTimeout(timer);
      if (box) box.classList.remove("on");
      queue = []; onIdle = null;
    } else if (k === "f") {
      protest();
    } else if (k === "t") {
      openLog();
    }
  }

  function boot() {
    if (OFF) return;           // 出图 / 探针 / 显式关闭：完全不注入 DOM
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", mount, false);
    } else mount();
  }

  window.PrologueDialogue = {
    enabled: !OFF,
    start: start, step: step, observe: observe, end: end,
    talk: talk, protest: protest,
    openChoice: openChoice, openLog: openLog, toggle: toggle,
    state: function () {
      return { on: on, started: started, sworn: read.oath,
               talked: talkIdx, seen: Object.keys(read.seen).length,
               steps: read.steps.filter(Boolean).length };
    }
  };
  boot();
})();
