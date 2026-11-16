#!/usr/bin/env python
"""Score act screenshots with pyiqa + pixel statistics.

Usage:
  python visual_score.py --screens <dir> --out <dir> [--refs <dir>] [--thresholds thresholds.json]

Output:
  <out>/visual.json
"""
from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image

VIEWS = {
    "medicine": "act4-medicine.png",
    "palace": "act5-palace.png",
    "river": "act6-reincarnation.png",
}

METRICS = ["musiq", "clipiqa+", "niqe", "topiq_nr", "brisque"]


def load_thresholds(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def normalize(value: float, kind: str, good: float, bad: float) -> float:
    """Map a metric to 0..100, clamping outside [good, bad]."""
    if value is None or not math.isfinite(value):
        return None
    if kind == "higher":
        span = good - bad
        if span == 0:
            return 100.0 if value >= good else 0.0
        return max(0.0, min(100.0, (value - bad) / span * 100.0))
    span = bad - good
    if span == 0:
        return 100.0 if value <= good else 0.0
    return max(0.0, min(100.0, (bad - value) / span * 100.0))


def pixel_stats(path: Path) -> dict:
    img = Image.open(path).convert("RGB")
    arr = np.asarray(img).astype(np.float32) / 255.0
    luma = 0.2126 * arr[..., 0] + 0.7152 * arr[..., 1] + 0.0722 * arr[..., 2]
    mx = arr.max(axis=2)
    mn = arr.min(axis=2)
    sat = np.where(mx > 1e-6, (mx - mn) / np.maximum(mx, 1e-6), 0.0)
    hist = np.histogram(luma, bins=64, range=(0.0, 1.0))[0]
    probs = hist[hist > 0] / max(1, hist.sum())
    entropy = float(-(probs * np.log2(probs)).sum())
    lap = (
        -4.0 * luma[1:-1, 1:-1]
        + luma[:-2, 1:-1]
        + luma[2:, 1:-1]
        + luma[1:-1, :-2]
        + luma[1:-1, 2:]
    )
    sharpness = float(lap.var())
    rg = arr[..., 0] - arr[..., 1]
    yb = 0.5 * (arr[..., 0] + arr[..., 1]) - arr[..., 2]
    colorfulness = float(np.hypot(rg.std(), yb.std()) + 0.3 * np.hypot(rg.mean(), yb.mean()))
    return {
        "width": img.width,
        "height": img.height,
        "mean_luma": round(float(luma.mean()), 4),
        "std_luma": round(float(luma.std()), 4),
        "near_black_ratio": round(float((luma < 0.04).mean()), 4),
        "near_white_ratio": round(float((luma > 0.96).mean()), 4),
        "mean_saturation": round(float(sat.mean()), 4),
        "entropy": round(entropy, 3),
        "sharpness": round(sharpness, 6),
        "colorfulness": round(colorfulness, 4),
        "blank": bool(float(luma.std()) < 0.012 or img.width < 64 or img.height < 64),
    }


def find_ref(refs: Path | None, view: str) -> Path | None:
    if not refs or not refs.exists():
        return None
    for ext in ("jpg", "jpeg", "png", "webp"):
        candidate = refs / f"{view}.{ext}"
        if candidate.exists():
            return candidate
    for candidate in sorted(refs.iterdir()):
        if candidate.is_file() and view in candidate.stem.lower():
            return candidate
    return None


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--screens", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--refs", default=None)
    parser.add_argument("--thresholds", default=str(Path(__file__).resolve().parents[1] / "references" / "thresholds.json"))
    parser.add_argument("--device", default="cpu")
    parser.add_argument("--skip-metrics", action="store_true")
    args = parser.parse_args()

    screens = Path(args.screens)
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    refs = Path(args.refs) if args.refs else None
    thresholds = load_thresholds(Path(args.thresholds))

    try:
        import pyiqa
        pyiqa_error = None
    except Exception as error:  # noqa: BLE001
        pyiqa = None
        pyiqa_error = str(error)

    enabled = {}
    lpips = None
    if pyiqa is not None:
        enabled = {name: pyiqa.create_metric(name, device=args.device) for name in METRICS}
        lpips = pyiqa.create_metric("lpips", device=args.device) if refs else None

    result: dict = {
        "ok": True,
        "screens": str(screens),
        "refs": str(refs) if refs else None,
        "metric_mode": "pyiqa" if pyiqa is not None else "stats",
        "pyiqa_error": pyiqa_error,
        "views": {},
    }
    normalized_means = []
    tech_scores = []
    lpips_values = []

    for view, filename in VIEWS.items():
        path = screens / filename
        if not path.exists():
            result["views"][view] = {"error": f"missing screenshot: {path}"}
            continue

        stats = pixel_stats(path)
        scores: dict[str, float | None] = {}
        normalized: dict[str, float | None] = {}
        for name, metric in enabled.items():
            try:
                value = float(metric(str(path)).item())
                scores[name] = round(value, 5)
                cfg = thresholds.get(name)
                normalized[name] = (
                    round(normalize(value, cfg["type"], cfg["good"], cfg["bad"]), 2) if cfg else None
                )
            except Exception as error:  # noqa: BLE001
                scores[name] = None
                normalized[name] = None
                result.setdefault("metric_errors", []).append({"view": view, "metric": name, "error": str(error)})

        usable = [v for v in normalized.values() if v is not None]
        pyiqa_score = round(sum(usable) / len(usable), 2) if usable else None
        if pyiqa_score is not None:
            normalized_means.append(pyiqa_score)

        tech_norm = {}
        for name, stat_key in (
            ("sharpness", "sharpness"),
            ("contrast", "std_luma"),
            ("entropy", "entropy"),
            ("colorfulness", "colorfulness"),
        ):
            cfg = thresholds.get(name)
            if cfg:
                tech_norm[name] = round(normalize(stats[stat_key], cfg["type"], cfg["good"], cfg["bad"]), 2)
        tech_usable = [v for v in tech_norm.values() if v is not None]
        tech_score = round(sum(tech_usable) / len(tech_usable), 2) if tech_usable else None
        if tech_score is not None:
            tech_scores.append(tech_score)

        b1 = pyiqa_score if pyiqa_score is not None else tech_score

        ref = find_ref(refs, view)
        lpips_score = None
        lpips_norm = None
        if ref and lpips is not None:
            try:
                lpips_score = float(lpips(str(path), str(ref)).item())
                cfg = thresholds.get("lpips")
                lpips_norm = round(normalize(lpips_score, cfg["type"], cfg["good"], cfg["bad"]), 2) if cfg else None
                lpips_values.append(lpips_norm)
            except Exception as error:  # noqa: BLE001
                result.setdefault("metric_errors", []).append({"view": view, "metric": "lpips", "error": str(error)})
        elif refs:
            lpips_norm = None

        result["views"][view] = {
            "screenshot": str(path),
            "file": filename,
            **stats,
            "metrics": scores,
            "normalized": normalized,
            "tech_normalized": tech_norm,
            "tech_score": tech_score,
            "b1": b1,
            "reference": str(ref) if ref else None,
            "lpips": lpips_score,
            "lpips_normalized": lpips_norm,
        }

    result["b1"] = round(sum(normalized_means) / len(normalized_means), 2) if normalized_means else None
    result["tech_score"] = round(sum(tech_scores) / len(tech_scores), 2) if tech_scores else None
    if result["b1"] is None:
        result["b1"] = result["tech_score"]
        result["metric_mode"] = "stats"
    result["b2"] = round(sum(lpips_values) / len(lpips_values), 2) if lpips_values else None
    result["blank_views"] = [view for view, v in result["views"].items() if v.get("blank")]
    result["thresholds"] = thresholds

    (out / "visual.json").write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"ok": True, "out": str(out / "visual.json"), "mode": result["metric_mode"], "b1": result["b1"], "tech": result["tech_score"], "b2": result["b2"], "blank": result["blank_views"]}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
