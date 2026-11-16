---
name: huihun-eval
description: 对《还魂路引》四五六殿（药局、九宫阵、忘川桥）做严格验收打分：合并旧版十项 0–4 分审美标准（构图、灯光、材质、色彩、空间、叙事、跨场景一致性、导航、HUD、完成度）与新版工程验收（构建、Playwright 截图与性能、Khronos glTF 校验、自动画质、逐幕清单、可玩流程、交付）。总分低于 95 或任一硬门槛失败时必须输出返工清单，不得宣称通过。前三殿由队友负责，不计分。不用于通用网页审计或纯代码 review。
---

# 还魂路引 · 四五六殿验收打分

只评第四、五、六殿与这三幕的群核资产接入。序厅和前三殿是队友范围，**不评、不扣分**，只在“集成风险”里提一句。

> 执行本技能时先声明：“正在用 huihun-eval 打分，评的是四五六殿，通过线 95。”

> **口径版本 v2.1（2026-11-16 用户指令）**：通过线 80 → **95**，取消「有条件通过」档，低于 95 一律打回重改。旧版 `references/archive/rubric.v2.0.md`、`references/archive/score.v2.0.py`、`references/archive/SKILL.v2.0.md` 逐字留档，评分结构与阈值未改。

## 输入

- 仓库根目录：默认 `D:\群核科技黑客松`（本文件向上四级）。
- 游戏目录：`game/`。
- 参考图（可选）：三张参考图的本地目录；没有就标 `n/a`，不能脑补相似度。
- 输出目录：`评审/四五六殿/<YYYY-MM-DD>-<git短哈希>/`。

## 两套标准怎么合并

- 旧版十项审美评分**原样保留**：每项 0–4，缺失证据标 `n/a`；每项折算 5 分，十项共 **50 分**。
- 新版工程验收占另外 **50 分**：A 资产与自动画质 15、C 逐幕清单 15、D 可玩流程 10、E 性能 5、F 交付 5。
- 不重复计分：B 项评“好不好”，C 项只数“有没有、结构对不对”。

## 硬规则

1. **没有证据不给分。** 每项必须写 `evidence`：截图文件名 + 区域，或 `文件:行号`，或命令输出片段。
2. **不能只靠自动指标。** 自动画质只占 A4 的 5 分；构图、材质、叙事由评审者看图按十项填。
3. **不能跳过构建。** G0 未验证就按失败处理。
4. **不能改口径。** 评分表和阈值在 `references/rubric.md`、`references/thresholds.json`；要改必须写明原因并保留旧版。
5. **不通过就返回重改。** 总分 < 95 或任一硬门槛失败，输出 `rework.md`，不要把“有条件通过”说成“通过”（v2.1 已取消该档）。
6. **每次重改全量重跑。** 不允许只补评修改项。

## 流程

### 1. 准备

```powershell
cd D:\群核科技黑客松
python .agents\skills\huihun-eval\scripts\run_auto.py --out 评审\四五六殿\<日期>-<哈希>
```

`run_auto.py` 会依次：

1. `npm run build` + `npm test`（G0）；
2. 启动/复用 `http://127.0.0.1:5173`（若未启动）；
3. `capture.mjs`：三幕截图、FPS、draw calls、加载耗时、console/pageerror/404；
4. `check_assets.mjs`：6 件 GLB 的 Khronos glTF Validator 报告；
5. `visual_score.py`：技术画质。装了 pyiqa 时用 MUSIQ / CLIP-IQA+ / NIQE / TOPIQ-NR / BRISQUE；没装时自动退回清晰度 / 对比 / 信息熵 / 色彩丰富度，不阻塞流程。

产出：`auto.json`、`capture.json`、`assets.json`、`visual.json`、`screens/*.png`、`rubric.template.json`。

首次使用或依赖缺失时：

```powershell
# 必装：glTF 校验器
cd .agents\skills\huihun-eval\scripts
npm install
```

pyiqa 是**可选增强**，不是必装：

- 轻量回退只依赖 `numpy` + `Pillow`（系统 Python 已装即可）。`run_auto.py` 会自动探测解释器，跳过没有这两个包的 `.venv`，不会再把 A4 静默记 0。
- Python 3.14 上 pyiqa 构建失败；要用就建 3.12 venv：`C:\Users\lenovo\AppData\Roaming\uv\python\cpython-3.12.14-windows-x86_64-none\python.exe -m venv .agents\skills\huihun-eval\.venv`，再 `.venv\Scripts\python.exe -m pip install pyiqa`。
- 它会拖 torch、torchvision、transformers、datasets、tensorboard 等，约 3–5 GB；不装时 `visual_score.py` 自动用清晰度 / 对比 / 信息熵 / 色彩丰富度，流程照跑。
- 若系统里连 numpy/Pillow 都没有，`auto.json` 的 `summary.visual_ok` 会是 `false`，A4 记 0，需先补这两个轻量包。
- 无外网时设 `HF_ENDPOINT=https://hf-mirror.com`。

### 2. 看图，填 rubric

复制 `rubric.template.json` 为 `rubric.json`，逐项填写：

- `flow_reachable`：四殿配药 → 五殿踩板 → 六殿合符 → 至少一个结局。必须写步骤、命令日志或录屏路径。
- `A3`：逐件看 6 个 GLB 的尺度、朝向、材质、接触面（0–4）。
- `B1`–`B10`：旧版十项审美，按构图、灯光、材质、色彩、空间、叙事、跨场景一致性、导航、HUD、完成度逐项 0–4。每项必须看图并写区域证据。
- `C1/C2/C3`：按 `references/rubric.md` 的逐幕清单数达标项（0–5）。
- `D1/D2/D3`：必须实际走流程；只看结局截图不算（0–3）。
- `D4`：鼠标锁定、HUD、Esc、重开（0–1）。
- `F1/F2`：启动器与交付证据。

每项格式（旧十项保持 0–4）：

```json
{ "score": 2, "max": 4, "evidence": "act4-medicine.png 左侧为实墙，符纸排成楼梯状", "reason": "构图有主焦点，但左门纵深缺失且装饰抢焦点" }
```

确实无法核实的项可填 `"score": "n/a"`，必须在 `reason` 里说明为什么无法取得证据；`n/a` 会从分母剔除，不能当 0 也不能当满分。

### 3. 合成结论

```powershell
python .agents\skills\huihun-eval\scripts\score.py --dir 评审\四五六殿\<日期>-<哈希>
```

产出：

- `report.md`：维度分、硬门槛、自动指标、人工证据、返工清单。
- `scores.json`：机器可读总分与明细。
- `rework.md`：未通过时生成，按 P0/P1/P2 排序。

结论线：

| 总分 | 结论 |
|---:|---|
| 98–100 | 优秀 |
| 95–97.9 | 通过 |
| < 95 | 打回重改 |

任一硬门槛失败 → 直接“打回重改（硬门槛）”，不看总分。

### 4. 返工

按 `rework.md` 修，优先级：

1. **P0**：硬门槛失败、维度 <60%。先修这些。
2. **P1**：维度 60%–79%。演示前修。
3. **P2**：纯观感。时间够再修。

修完回到第 1 步，用新目录重跑，不覆盖旧报告。

## 输出约定

```
评审/四五六殿/<日期>-<哈希>/
  report.md
  scores.json
  auto.json
  capture.json
  assets.json
  visual.json
  rubric.json
  rework.md        # 未通过时
  screens/
    act4-medicine.png
    act5-palace.png
    act6-reincarnation.png
```

报告必须包含：提交号、时间、范围、结论、维度表、硬门槛表、自动指标表、人工证据表、返工清单。

## 常见误判

- **把“能打开”当“通过”**：G1 只证明页面能加载，不证明流程可达。
- **只看三张截图**：D 项必须实际走流程，否则 G3 失败。
- **用自动分替代美术判断**：自动画质只占 A4 的 5 分；暗场、雾、低对比会让 NIQE 偏差，B1–B10 必须看图。
- **把前三殿缺口算进扣分**：不在范围内，不扣分。
- **参考图机位不同还硬算 LPIPS**：机位/构图不一致时 LPIPS 无效；它只作证据，不进分数。
- **五殿黑就说画面差**：大量暗像素是设计意图；按 B2 看关键交互是否可读，不按近黑比例扣分。
- **六殿红就说违反 5%**：六殿允许大面积彼岸红，必须人工确认语义对象。
- **headless FPS 当演示机 FPS**：headless 数据只作回归基线，演示机需人工复测一次并记录。
