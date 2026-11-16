# Lux3D 新资产下载记录（Chief 交接）

> 2026-11-16 18:45 · 四个 Lux3D 任务全部 SUCCEEDED，产物已下载到本地。

## 文件位置

`game/public/assets/generated/lux3d-new/`

| 文件 | 用途 | 大小 | 三角形 | taskId |
|---|---|---:|---:|---|
| `herbal-cabinet-v2.glb` | 四殿百子柜（6×7 格 + 铜环） | 14.03 MB | 186,028 | 8100487 |
| `nine-palace-v2.glb` | 五殿九宫湿青石阵（无数字刻字） | 11.10 MB | 167,138 | 8100912 |
| `stone-bridge-v2.glb` | 六殿忘川石拱桥（单拱 + 望柱 + 石狮） | 17.82 MB | 279,036 | 8100935 |
| `spider-lily-v2.glb` | 六殿彼岸花簇（血红卷蕊，12 株一簇） | 20.90 MB | 210,412 | 8100943 |

## 四件的共同结构特征

```
mesh = 1    primitive = 1    material = 1    textures = 3 (baseColor / normal / metallicRoughness)
metalness = 0.1    roughness = 1
```

**关键**：这四件都是 **单 mesh 单 primitive**，和旧版一样是「一整块」。这意味着：
- 柜面 6×7 抽屉格是否真建模，**必须渲染确认**；如果只是贴图，要走「GLB 柜体 + 程序格架」混合方案
- 九宫 9 块石板同理，如果是一整块底板，数字刻字必须用 `addEngraving` 叠上去
- 石桥的拱洞、望柱、石狮是否分离建模，也要渲染确认

**材质正常**：`metalness 0.1 / roughness 1`，不像旧四件的 `metalness=1 / roughness=1`（全金属全粗糙 → 发黑像塑料）。这四件应该能直接看。

## 渲染确认方法（Chief 试过但没跑通）

我写的 `game/glb-preview.mjs` 用 data URL 喂模型、CDN 加载 three.js，但 CDN 在这台机器上不可达（jsdelivr 请求挂起）。Qoder 可以改用：

1. **把 GLB 放进 public/ 然后起 dev server**，写一个 `?model=xxx` 的预览页，用本地 `node_modules/three` 加载 —— 最可靠
2. 或者用 Blender（本机 `C:\Users\lenovo\Tools\blender-4.5.9-windows-x64`）打开 GLB 直接看
3. 或者用 `gltf-transform inspect <file>`（全局已装 4.5.1）先看结构摘要

## 尺寸/包围盒

**未实测**——需要渲染或 inspect 拿到。落位前先算包围盒，别按旧模型的尺寸摆。

## 下一步

1. 渲染确认四件的外观与结构
2. 按真实包围盒落位到 `scene.ts` 的 `assets` 数组
3. 数字刻字、踩板反馈仍走程序逻辑叠加
4. 默认路径切到 GLB（目前 `!useLuxPrimary` 时仍是程序几何，与用户要求冲突）
