#!/usr/bin/env python
"""Aggregate auto.json + rubric.json into a strict 100-point verdict.

Usage:
  python score.py --dir 评审/四五六殿/2026-11-15-abc1234

Inputs : <dir>/auto.json, <dir>/rubric.json
Outputs: <dir>/scores.json, <dir>/report.md, <dir>/rework.md (when not passed)
"""
from __future__ import annotations

import argparse
import json
import statistics
import sys
from datetime import datetime
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[4]

# 通过线（口径 v2.1）。2026-11-16 用户指令：由 80 上调至 95。
# 旧版完整保留在 references/archive/score.v2.0.py（PASS_LINE=80，且有“有条件通过”档）。
PASS_LINE = 95.0
EXCELLENT_LINE = 98.0

MAX = {
    "A1": 4,
    "A2": 2,
    "A3": 4,
    "A4": 5,
    "B1": 5,
    "B2": 5,
    "B3": 5,
    "B4": 5,
    "B5": 5,
    "B6": 5,
    "B7": 5,
    "B8": 5,
    "B9": 5,
    "B10": 5,
    "C1": 5,
    "C2": 5,
    "C3": 5,
    "D1": 3,
    "D2": 3,
    "D3": 3,
    "D4": 1,
    "E1": 2,
    "E2": 2,
    "E3": 1,
    "F1": 2,
    "F2": 3,
}
# The ten art items keep the old 0-4 scale; the rest are scored on their point scale.
INPUT_MAX = {
    "A3": 4,
    "B1": 4, "B2": 4, "B3": 4, "B4": 4, "B5": 4,
    "B6": 4, "B7": 4, "B8": 4, "B9": 4, "B10": 4,
    "C1": 5, "C2": 5, "C3": 5,
    "D1": 3, "D2": 3, "D3": 3, "D4": 1,
    "F1": 2, "F2": 3,
}
MANUAL = ["A3"] + [f"B{i}" for i in range(1, 11)] + ["C1", "C2", "C3", "D1", "D2", "D3", "D4", "F1", "F2"]
DIMENSIONS = {
    "A 资产与自动画质": ["A1", "A2", "A3", "A4"],
    "B 美术十项": [f"B{i}" for i in range(1, 11)],
    "C 逐幕必检清单": ["C1", "C2", "C3"],
    "D 可玩流程": ["D1", "D2", "D3", "D4"],
    "E 性能与稳定": ["E1", "E2", "E3"],
    "F 交付与可复现": ["F1", "F2"],
}
HINTS = {
    "A1": "game/public/assets/generated/manifest.json, game/src/scene.ts",
    "A2": "game/public/assets/generated/, game/src/scene.ts",
    "A3": "game/src/scene.ts（GLB 尺度/朝向/材质/落位）",
    "A4": "game/src/scene.ts（灯光、材质、雾、清晰度）",
    "B1": "game/src/scene.ts（构图：主目标、前中后景、留白）",
    "B2": "game/src/scene.ts（主辅光、暗部信息、雾/辉光）",
    "B3": "game/src/scene.ts（石/木/纸/金属的粗糙度与磨损）",
    "B4": "game/src/scene.ts（冷暖配比、朱砂点缀、情绪色）",
    "B5": "game/src/scene.ts（建筑/家具/道具比例与遮挡）",
    "B6": "game/src/scene.ts（剧情道具、建筑语汇、生活痕迹）",
    "B7": "game/src/scene.ts（四五六殿材质与细节密度一致性）",
    "B8": "game/src/scene.ts, game/src/main.ts（路线、出口、交互物辨识）",
    "B9": "game/src/main.ts, game/index.html（HUD 可读性与反馈）",
    "B10": "game/src/scene.ts（穿模、悬浮、接缝、阴影错误）",
    "C1": "game/src/scene.ts（四殿药局道具与灯位）",
    "C2": "game/src/scene.ts（五殿石板、布幡、铜盏、机位）",
    "C3": "game/src/scene.ts（六殿桥拱、亭顶、彼岸花、亡魂）",
    "D1": "game/src/main.ts, game/src/story.ts（四殿配药流程）",
    "D2": "game/src/main.ts, game/src/story.ts（五殿踩板）",
    "D3": "game/src/main.ts, game/src/story.ts（六殿合符与结局）",
    "D4": "game/src/main.ts, game/index.html（HUD/提示/控制/重开）",
    "E1": "game/src/scene.ts（draw call、几何合并、LOD）",
    "E2": "game/src/scene.ts（几何合并、实例化、剔除）",
    "E3": "game/src/main.ts, game/src/scene.ts（资源异步加载）",
    "F1": "game/启动密室.bat, game/start-game.ps1, game/README.md",
    "F2": "评审目录、sessions/STATE.md、截图",
}


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def auto_scores(auto: dict) -> tuple[dict, dict]:
    scores: dict[str, float | None] = {}
    detail: dict = {}

    build = auto.get("build", {})
    assets = auto.get("assets", {})
    capture = auto.get("capture", {})
    visual = auto.get("visual", {})
    views = capture.get("views", {}) or {}

    # A1 / A2 / A3
    total_errors = assets.get("summary", {}).get("totalErrors")
    total_warnings = assets.get("summary", {}).get("totalWarnings")
    if total_errors is None:
        scores["A1"] = 0
    elif total_errors > 0:
        scores["A1"] = 0
    elif (total_warnings or 0) >= 10:
        scores["A1"] = 2
    else:
        scores["A1"] = 4
    detail["A1"] = {"errors": total_errors, "warnings": total_warnings}

    glb_failures = {
        (item.get("url") or "").split("?")[0]
        for item in capture.get("summary", {}).get("failedRequests", [])
        if ".glb" in (item.get("url") or "").lower()
    }
    scores["A2"] = clamp(2 - len(glb_failures), 0, 2)
    detail["A2"] = {"glbFailures": sorted(glb_failures)}

    # A4: automatic technical quality. pyiqa when available, otherwise pixel stats.
    tech = visual.get("b1")
    scores["A4"] = round(5 * tech / 100.0, 2) if tech is not None else 0
    detail["A4"] = {
        "score": tech,
        "mode": visual.get("metric_mode"),
        "tech_score": visual.get("tech_score"),
        "state": "missing" if tech is None else "scored",
    }

    # E1 / E2 / E3
    fps_values = [v.get("fps") for v in views.values() if isinstance(v.get("fps"), (int, float))]
    draw_values = [
        v.get("mainDrawsPerFrame", v.get("drawsPerFrame"))
        for v in views.values()
        if isinstance(v.get("mainDrawsPerFrame", v.get("drawsPerFrame")), (int, float))
    ]
    total_draw_values = [v.get("drawsPerFrame") for v in views.values() if isinstance(v.get("drawsPerFrame"), (int, float))]
    min_fps = min(fps_values) if fps_values else None
    max_draws = max(draw_values) if draw_values else None
    max_total_draws = max(total_draw_values) if total_draw_values else None
    min_fps = round(min_fps, 2) if min_fps is not None else None
    max_draws = round(max_draws, 1) if max_draws is not None else None
    max_total_draws = round(max_total_draws, 1) if max_total_draws is not None else None
    if min_fps is None:
        scores["E1"] = 0
    elif min_fps >= 45:
        scores["E1"] = 2
    elif min_fps >= 30:
        scores["E1"] = 1
    else:
        scores["E1"] = 0
    detail["E1"] = {"minFps": min_fps}

    if max_draws is None:
        scores["E2"] = 0
    elif max_draws <= 300:
        scores["E2"] = 2
    elif max_draws <= 800:
        scores["E2"] = 1
    else:
        scores["E2"] = 0
    detail["E2"] = {"maxDrawsPerFrame": max_draws, "maxTotalDrawsPerFrame": max_total_draws}

    load_values = [v.get("loadMs") for v in views.values() if isinstance(v.get("loadMs"), (int, float))]
    max_load = max(load_values) if load_values else None
    page_errors = capture.get("summary", {}).get("pageErrors", [])
    if max_load is None:
        scores["E3"] = 0
    elif page_errors or capture.get("summary", {}).get("consoleErrors"):
        scores["E3"] = 0
    elif max_load <= 6000:
        scores["E3"] = 1
    else:
        scores["E3"] = 0
    detail["E3"] = {"maxLoadMs": max_load, "pageErrors": len(page_errors), "consoleErrors": len(capture.get("summary", {}).get("consoleErrors", []))}

    return scores, detail


def gate_checks(auto: dict, rubric: dict, derived: dict) -> list[dict]:
    build = auto.get("build", {})
    capture = auto.get("capture", {})
    assets = auto.get("assets", {})
    views = capture.get("views", {}) or {}
    visual = auto.get("visual", {})
    summary = capture.get("summary", {}) or {}

    critical = [
        item for item in summary.get("failedRequests", [])
        if any(token in (item.get("url") or "").lower() for token in (".glb", "/src/", ".js", ".css"))
    ]
    screens_exist = all((Path(v.get("screenshot", ""))).exists() for v in views.values()) and len(views) == 3
    min_fps = derived["E1"].get("minFps")
    max_draws = derived["E2"].get("maxDrawsPerFrame")

    return [
        {
            "id": "G0",
            "name": "构建与单测",
            "pass": build.get("ok") is True and build.get("tests_ok") is True,
            "evidence": f"build={build.get('ok')}, tests={build.get('tests_ok')}",
        },
        {
            "id": "G1",
            "name": "页面启动",
            "pass": summary.get("canvas", 0) >= 1 and not summary.get("pageErrors") and not critical,
            "evidence": f"canvas={summary.get('canvas')}, pageErrors={len(summary.get('pageErrors', []))}, criticalRequests={len(critical)}",
        },
        {
            "id": "G2",
            "name": "三幕截图有效",
            "pass": screens_exist and not visual.get("blank_views"),
            "evidence": f"screens={len(views)}, blank={visual.get('blank_views')}",
        },
        {
            "id": "G3",
            "name": "主流程可达",
            "pass": bool(rubric.get("flow_reachable", {}).get("value")),
            "evidence": rubric.get("flow_reachable", {}).get("evidence", "未记录"),
        },
        {
            "id": "G4",
            "name": "资产合规与不阻塞",
            "pass": assets.get("summary", {}).get("totalErrors") == 0 and not derived["A2"].get("glbFailures"),
            "evidence": f"gltfErrors={assets.get('summary', {}).get('totalErrors')}, glbFailures={len(derived['A2'].get('glbFailures', []))}",
        },
        {
            "id": "G5",
            "name": "性能底线",
            "pass": (min_fps or 0) >= 24 and (max_draws or 10**9) <= 800,
            "evidence": f"minFps={min_fps}, maxDrawsPerFrame={max_draws}",
        },
    ]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dir", required=True)
    args = parser.parse_args()

    work = Path(args.dir)
    if not work.is_absolute():
        work = REPO_ROOT / work
    auto_path = work / "auto.json"
    rubric_path = work / "rubric.json"
    if not auto_path.exists():
        print(json.dumps({"ok": False, "error": f"missing {auto_path}; run run_auto.py first"}, ensure_ascii=False))
        return 2
    if not rubric_path.exists():
        print(json.dumps({"ok": False, "error": f"missing {rubric_path}; copy rubric.template.json and fill every score with evidence"}, ensure_ascii=False))
        return 2

    auto = json.loads(auto_path.read_text(encoding="utf-8"))
    rubric = json.loads(rubric_path.read_text(encoding="utf-8"))

    auto_values, derived = auto_scores(auto)
    scores: dict[str, float | None] = dict(auto_values)
    missing: list[str] = []

    criteria = rubric.get("criteria", {})
    manual_detail: dict = {}
    for key in MANUAL:
        entry = criteria.get(key, {})
        score = entry.get("score")
        max_score = entry.get("max", INPUT_MAX[key])
        if score is None:
            missing.append(key)
            scores[key] = None
            continue
        if max_score != INPUT_MAX[key]:
            print(json.dumps({"ok": False, "error": f"{key} max mismatch: rubric={max_score}, expected={INPUT_MAX[key]}"}, ensure_ascii=False))
            return 2
        if not str(entry.get("evidence", "")).strip():
            print(json.dumps({"ok": False, "error": f"{key} has a score but no evidence"}, ensure_ascii=False))
            return 2
        if isinstance(score, str) and score.strip().lower() == "n/a":
            if not str(entry.get("reason", "")).strip():
                print(json.dumps({"ok": False, "error": f"{key} is n/a but has no reason"}, ensure_ascii=False))
                return 2
            scores[key] = None
            manual_detail[key] = {"raw": "n/a", "points": None, "max": INPUT_MAX[key]}
            continue
        raw_score = clamp(float(score), 0, INPUT_MAX[key])
        points = round(raw_score / INPUT_MAX[key] * MAX[key], 2)
        scores[key] = points
        manual_detail[key] = {"raw": raw_score, "points": points, "max": INPUT_MAX[key], "points_max": MAX[key]}

    if missing:
        print(json.dumps({"ok": False, "error": "rubric incomplete", "missing": missing}, ensure_ascii=False))
        return 2

    if not rubric.get("flow_reachable", {}).get("evidence"):
        print(json.dumps({"ok": False, "error": "flow_reachable.evidence is required (steps, video or command log)"}, ensure_ascii=False))
        return 2

    # n/a items (allowed by the old 3D rubric) drop out of the denominator.
    # Every other criterion is always counted; a missing auto metric scores 0.
    denominator = sum(MAX[k] for k in MAX if scores.get(k) is not None)
    raw = sum(v for v in scores.values() if v is not None)
    total = round(raw / denominator * 100.0, 1) if denominator else 0.0

    gates = gate_checks(auto, rubric, derived)
    hard_fail = [g for g in gates if not g["pass"]]

    if hard_fail:
        verdict = "打回重改（硬门槛）"
    elif total >= EXCELLENT_LINE:
        verdict = "优秀"
    elif total >= PASS_LINE:
        verdict = "通过"
    else:
        # v2.1 起取消“有条件通过”档：低于通过线一律打回重改，不设灰色结论。
        verdict = "打回重改"

    # Dimension rollups
    dimensions = {}
    for name, keys in DIMENSIONS.items():
        got = sum(scores[k] for k in keys if scores.get(k) is not None)
        possible = sum(MAX[k] for k in keys if scores.get(k) is not None)
        dimensions[name] = {
            "score": round(got, 2),
            "max": possible,
            "percent": round(got / possible * 100.0, 1) if possible else None,
        }

    # Rework items
    rework = []
    for gate in hard_fail:
        rework.append({"priority": "P0", "id": gate["id"], "issue": gate["name"], "evidence": gate["evidence"], "fix": "先修硬门槛，再复评"})
    for key, max_score in MAX.items():
        value = scores.get(key)
        if value is None:
            continue
        ratio = value / max_score if max_score else 0
        if ratio >= 1.0:
            continue
        priority = "P0" if ratio < 0.6 else "P1" if ratio < 0.8 else "P2"
        entry = criteria.get(key, {})
        rework.append(
            {
                "priority": priority,
                "id": key,
                "issue": f"{value}/{max_score} 分",
                "evidence": entry.get("evidence") or derived.get(key, ""),
                "fix": HINTS.get(key, ""),
            }
        )
    order = {"P0": 0, "P1": 1, "P2": 2}
    rework.sort(key=lambda item: (order[item["priority"]], item["id"]))

    result = {
        "ok": True,
        "meta": auto.get("meta", {}),
        "verdict": verdict,
        "passed": verdict in {"优秀", "通过"} and not hard_fail,
        "total": total,
        "denominator": denominator,
        "scores": scores,
        "max": MAX,
        "dimensions": dimensions,
        "gates": gates,
        "auto": derived,
        "manual": manual_detail,
        "rubric": rubric,
        "rework": rework,
        "scoredAt": datetime.now().isoformat(timespec="seconds"),
    }
    (work / "scores.json").write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")

    # report.md
    lines: list[str] = []
    meta = auto.get("meta", {})
    lines += [
        "# 还魂路引 · 四五六殿验收报告",
        "",
        f"- 版本：`{meta.get('commit')}`",
        f"- 时间：{result['scoredAt']}",
        f"- 范围：{meta.get('scope')}",
        f"- 结论：**{verdict}**（{total}/100，通过线 {PASS_LINE:g}）",
        "",
        "## 维度得分",
        "",
        "| 维度 | 得分 | 满分 | 百分比 |",
        "|---|---:|---:|---:|",
    ]
    for name, dim in dimensions.items():
        lines.append(f"| {name} | {dim['score']} | {dim['max']} | {dim['percent']}% |")
    lines += ["", "## 硬门槛", "", "| 门槛 | 结果 | 证据 |", "|---|---|---|"]
    for gate in gates:
        lines.append(f"| {gate['id']} {gate['name']} | {'PASS' if gate['pass'] else 'FAIL'} | {gate['evidence']} |")

    lines += ["", "## 自动指标", ""]
    visual = auto.get("visual", {}) or {}
    lines += [f"指标模式：`{visual.get('metric_mode', 'stats')}`；自动分只进 A4，不替代美术判断。", ""]
    capture_views = auto.get("capture", {}).get("views", {}) or {}
    visual_views = visual.get("views", {}) or {}
    lines += ["| 幕 | FPS | 主Draws/帧 | 总Draws/帧 | 加载 ms | 技术分 | MUSIQ | CLIP-IQA+ | NIQE | 亮度 | 近黑% |", "|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|"]
    for view in ("medicine", "palace", "river"):
        cap = capture_views.get(view, {})
        vis = visual_views.get(view, {})
        metrics = vis.get("metrics", {})
        lines.append(
            "| {view} | {fps} | {draws} | {total} | {load} | {tech} | {musiq} | {clipiqa} | {niqe} | {luma} | {black} |".format(
                view=view,
                fps=cap.get("fps"),
                draws=cap.get("mainDrawsPerFrame", cap.get("drawsPerFrame")),
                total=cap.get("drawsPerFrame"),
                load=cap.get("loadMs"),
                tech=vis.get("tech_score"),
                musiq=metrics.get("musiq"),
                clipiqa=metrics.get("clipiqa+"),
                niqe=metrics.get("niqe"),
                luma=vis.get("mean_luma"),
                black=(vis.get("near_black_ratio") or 0) * 100,
            )
        )

    lines += ["", "## 人工评分", "", "| ID | 原始分 | 折算分 | 满分 | 证据 |", "|---|---:|---:|---:|---|"]
    for key in MANUAL:
        entry = criteria.get(key, {})
        detail = manual_detail.get(key, {})
        lines.append(
            f"| {key} | {detail.get('raw', entry.get('score'))} | {detail.get('points')} | {MAX[key]} | {entry.get('evidence', '')} |"
        )

    lines += ["", "## 截图", ""]
    for view, cap in capture_views.items():
        shot = cap.get("screenshot")
        if shot:
            try:
                rel = Path(shot).resolve().relative_to(work.resolve())
            except Exception:  # noqa: BLE001
                rel = Path(shot)
            lines.append(f"- {view}: [{Path(shot).name}]({rel.as_posix()})")

    lines += ["", "## 返工清单", ""]
    if not rework:
        lines.append("无。")
    else:
        lines += ["| 优先级 | ID | 问题 | 证据 | 修复入口 |", "|---|---|---|---|---|"]
        for item in rework:
            lines.append(f"| {item['priority']} | {item['id']} | {item['issue']} | {item['evidence']} | {item['fix']} |")

    lines += [
        "",
        "## 规则",
        "",
        f"- 通过线 {PASS_LINE:g} 分（口径 v2.1）；任一硬门槛失败直接打回。",
        "- 只评四五六殿；前三殿由队友负责，不计分。",
        "- 每项分数必须有证据；无证据的分数按无效处理。",
    ]
    (work / "report.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    if not result["passed"]:
        rework_lines = ["# 返工清单", "", f"结论：**{verdict}**（{total}/100）", ""]
        for item in rework:
            rework_lines += [
                f"## {item['priority']} · {item['id']} · {item['issue']}",
                "",
                f"- 证据：{item['evidence']}",
                f"- 修复入口：{item['fix']}",
                "",
            ]
        (work / "rework.md").write_text("\n".join(rework_lines), encoding="utf-8")

    print(json.dumps({"ok": True, "verdict": verdict, "total": total, "gates": {g["id"]: g["pass"] for g in gates}, "report": str(work / "report.md")}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
