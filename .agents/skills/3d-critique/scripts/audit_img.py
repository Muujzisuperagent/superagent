"""Read-only SDR screenshot statistics. Requires Pillow and numpy; no network."""
import argparse
import hashlib
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps

PALETTE = {"青灰石": "5B6670", "深木": "3A2B22", "烛黄": "E8B25C",
           "朱砂": "B23A32", "宣纸": "E6DCC8", "彼岸红": "C41E3A"}
SCENES = ["序厅", "一殿", "二殿", "三殿", "四殿", "五殿", "六殿"]


def lab(rgb):
    linear = np.where(rgb <= .04045, rgb / 12.92, ((rgb + .055) / 1.055) ** 2.4)
    xyz = linear @ np.array([[.4124564, .3575761, .1804375],
                             [.2126729, .7151522, .0721750],
                             [.0193339, .1191920, .9503041]]).T
    xyz /= np.array([.95047, 1., 1.08883])
    f = np.where(xyz > (6 / 29) ** 3, np.cbrt(xyz), xyz / (3 * (6 / 29) ** 2) + 4 / 29)
    return np.stack((116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]),
                     200 * (f[..., 1] - f[..., 2])), axis=-1)


def analyze(path, scene=None):
    path = Path(path).resolve()
    with Image.open(path) as source:
        if source.format not in {"PNG", "JPEG", "WEBP", "BMP"}:
            raise ValueError("Only SDR PNG/JPEG/WebP/BMP screenshots are supported")
        if getattr(source, "n_frames", 1) != 1:
            raise ValueError("Animated input: export an explicit frame first")
        if source.mode not in {"RGB", "RGBA", "L", "LA", "P", "1"}:
            raise ValueError("Unsupported color mode; export an 8-bit sRGB screenshot")
        icc = bool(source.info.get("icc_profile"))
        im = ImageOps.exif_transpose(source).convert("RGBA")
        pixels = np.asarray(im, dtype=np.float64) / 255.
    rgb = pixels[..., :3]
    weight = pixels[..., 3]
    total = weight.sum()
    if total <= 0:
        raise ValueError("Fully transparent image has no visible pixels")

    def mean(values):
        return float((values * weight).sum() / total)

    def percent(mask):
        return round(100 * mean(mask), 4)

    # Display-referred luma, not linear-light luminance or scene exposure.
    y = rgb @ np.array([.2126, .7152, .0722])
    mx, mn = rgb.max(axis=-1), rgb.min(axis=-1)
    saturation = np.divide(mx - mn, mx, out=np.zeros_like(mx), where=mx > 0)
    reference = np.array([[int(code[i:i + 2], 16) / 255 for i in (0, 2, 4)]
                          for code in PALETTE.values()])
    palette_lab = lab(reference)
    counts = np.zeros(len(PALETTE))
    matched = 0.
    # Bounded temporary arrays even on high-resolution screenshots.
    for start in range(0, rgb.shape[0], 64):
        tile = lab(rgb[start:start + 64])
        distances = np.linalg.norm(tile[..., None, :] - palette_lab, axis=-1)
        nearest = distances.argmin(axis=-1)
        close = distances.min(axis=-1) <= 20.
        w = weight[start:start + 64]
        matched += (w * close).sum()
        for i in range(len(PALETTE)):
            counts[i] += (w * close * (nearest == i)).sum()
    shares = {name: round(float(counts[i] / total * 100), 4)
              for i, name in enumerate(PALETTE)}
    near_red = shares["朱砂"] + shares["彼岸红"]
    notes = []
    if scene and scene != "六殿" and near_red > 5:
        notes.append("相近红色像素超过5%；不能区分朱砂、其他红色和光照，需人工核对道具区域")
    if scene == "六殿":
        notes.append("六殿允许大面积彼岸红，不按全图红色比例执行5%限制")
    if percent(y < .05) > 40:
        notes.append("近黑像素较多；五殿可能符合意图，请在实际玩家机位核对关键线索")
    if icc:
        notes.append("输入带ICC配置；本工具未做色彩管理，按sRGB数值解释，跨设备比较前请导出sRGB")
    return {
        "image": str(path), "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        "scene": scene, "width": im.width, "height": im.height,
        "aspect_ratio": round(im.width / im.height, 5),
        "visible_pixel_equivalent": float(total),
        "transparent_pixel_pct": round(float((weight == 0).mean() * 100), 4),
        "luma_mean_srgb": round(mean(y), 6),
        "luma_std_srgb": round(float(np.sqrt(mean((y - mean(y)) ** 2))), 6),
        "near_black_pct_luma_lt_0_05": percent(y < .05),
        "near_white_pct_luma_gt_0_95": percent(y > .95),
        "saturation_hsv_mean": round(mean(saturation), 6),
        "high_saturation_pct_gt_0_8": percent(saturation > .8),
        "palette_nearest_within_delta_e_20_pct": shares,
        "palette_coverage_pct": round(float(matched / total * 100), 4),
        "red_family_candidate_pct": round(near_red, 4),
        "review_notes": notes,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("images", nargs="+", type=Path)
    parser.add_argument("--scene", choices=SCENES)
    parser.add_argument("--out", type=Path, help="New JSON file; existing files are never overwritten")
    args = parser.parse_args()
    try:
        if args.out and args.out.exists():
            raise ValueError("Output already exists; choose a new version path")
        results = [analyze(p, args.scene) for p in args.images]
        payload = {"schema_version": 1,
                   "method": "Full resolution; alpha-weighted; sRGB/D65 assumed; nearest CIELAB DeltaE76 <=20",
                   "limits": "Heuristic pixel statistics, not material identification, aesthetic score, exposure measurement or performance proof",
                   "results": results}
        text = json.dumps(payload, ensure_ascii=False, indent=2)
        if args.out:
            args.out.parent.mkdir(parents=True, exist_ok=True)
            with args.out.open("x", encoding="utf-8") as stream:
                stream.write(text + "\n")
        print(text)
        return 0
    except (OSError, ValueError, Image.DecompressionBombError) as exc:
        print(f"audit_img: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
