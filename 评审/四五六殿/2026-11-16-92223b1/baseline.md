# 四五六殿 · 95 口径基线采集（不评分）

- 采集时间：2026-11-16 18:54（本地）
- commit：92223b1（`fix: 戥子与九宫落位、GLB 材质分族（验收基线）`）
- 范围：第四、五、六殿；序厅与前三殿不评不扣分
- 命令：`python .agents/skills/huihun-eval/scripts/run_auto.py --out 评审/四五六殿/2026-11-16-92223b1`（未跳过构建）
- 本轮未填 `rubric.json`、未跑 `score.py`；B 项待审官复审后计入。

## 硬门槛

| 门槛 | 结论 | 证据 |
|---|---|---|
| G0 构建 | PASS | `npm run build` exit 0（4.55s，tsc --noEmit + vite build）；`npm test` exit 0，3 个文件 26 tests passed |
| G1 启动 | PASS | capture.json：canvas=1，pageErrors=[]，consoleErrors=[]，failedRequests=[]（三幕均同） |
| G2 截图 | PASS | blank=[]；三张 1440×900，std_luma 0.0861–0.1177（>0.012），文件 561–918 KB（>20KB） |
| G3 主流程 | **FAIL（证据过期）** | `game/artifacts/flow/flow-log.json`：34/34 步 ok=true、pageErrors=[]、unlockedEndings=["return","judge"]；但 `ranAt=2026-11-16T09:47:05.678Z`（本地 17:47:05），早于 HEAD 提交时间 18:53:08，且 17:47 之后含「戥子与九宫落位」改动；本轮 `run_auto.py` 不执行 flow-check，现有日志不能证明 HEAD 上流程仍可达。需在 92223b1 上重跑 `game/tests/flow-check.mjs`。 |
| G4 资产 | PASS | assets.json：6 件 GLB，gltfErrors=0，errorFiles=[]，totalWarnings=0，triangles=193610 |
| G5 性能 | PASS | minFps=59.93（五殿），maxDrawsPerFrame=288、maxMainDraws=238（四殿），均远低于 800 |

## 三幕指标

| 幕 | FPS | 主 pass draws | 总 draws | loadMs | mean_luma | near_black（luma<0.04） |
|---|---:|---:|---:|---:|---:|---:|
| 四殿 medicine | 60.279 | 238 | 288 | 689 | 0.0892 | 0.2412 |
| 五殿 palace | 59.929 | 170 | 220 | 582 | 0.1461 | 0.1225 |
| 六殿 river | 60.227 | 80 | 130 | 608 | 0.1324 | 0.0770 |

visual.json：`metric_mode=stats`（pyiqa 未装），b1=62.35，blank_views=[]。

## 与 2026-11-16-68c3504 数字差

| 项 | 四殿 | 五殿 | 六殿 |
|---|---:|---:|---:|
| FPS | +0.008 | -0.044 | -0.071 |
| 主 pass draws | +5 | 0 | 0 |
| 总 draws | +5 | 0 | 0 |
| loadMs | +66 | +22 | +40 |
| mean_luma | +0.0005 | -0.0005 | -0.0010 |
| near_black | +0.0002 | -0.0086 | -0.0048 |

- 自动画质 b1：62.08 → 62.35（+0.27）。
- GLB 6 件 bytes 与 triangles 与 68c3504 完全一致（totalTriangles=193610）。

## 截图事实核对（只描述，不判审美）

- 五殿案台上方：旧图悬浮纯黑四棱锥已消失（对比 `crops/_crop_act5_plaque_old.png` 与 `_crop_act5_plaque_new.png`）；匾额「戴九履一 · 左三右七」八字完整可读。
- 四殿左侧：`act4-medicine.png` 左缘出现木框门洞（x≈0–100），门内为纯黑，无可见雾层/纵深渐变；左侧区域 luma<0.04 占比 29.3%（旧 22.7%）。
- 四殿戥子：桌面左侧为黑色圆拱体+一根短杆（`crops/_crop_act4_dengzi_new.png`），分辨率下无法分辨杆/盘/砣三件结构，与旧图同位置形态基本一致。
- 右下角：`#nearby-list` 未出现空框；DOM 初始加 `hidden`，空列表 `display:none`（main.ts:456-476、style.css:315-335）。交付帧右下角暖金线框为 `#audio-toggle`「音 · 待启（M）」（style.css:295-306），不是 nearby-list。
- 六殿桥面：无纯白过曝块，max luma=0.918，>0.96 像素占比 0；画面最亮处为远处轮盘后的雾光（灰度），与旧图一致。

## 待办（不属本轮评分）

- P0：在 HEAD 92223b1 上重跑 `node game/tests/flow-check.mjs`（或项目自带入口），刷新 `game/artifacts/flow/flow-log.json` 后再做正式验收；当前 G3 证据过期。
