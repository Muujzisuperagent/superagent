#!/usr/bin/env python
"""Run all automated checks for the 还魂路引 acts 4-6 evaluation.

Steps: build/tests -> capture screenshots+perf -> validate GLB -> visual metrics
(pyiqa when installed, otherwise light-weight numpy/Pillow statistics).
Then writes <out>/auto.json and <out>/rubric.template.json.

Usage:
  python run_auto.py --out 评审/四五六殿/2026-11-15-abc1234
  python run_auto.py --out <dir> --skip-build --url http://127.0.0.1:5173
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime
from pathlib import Path

SKILL_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = Path(__file__).resolve().parents[4]
GAME_DIR = REPO_ROOT / "game"
SCRIPTS = SKILL_DIR / "scripts"
TEMPLATE_CRITERIA = {
    "A3": 4,
    "B1": 4, "B2": 4, "B3": 4, "B4": 4, "B5": 4,
    "B6": 4, "B7": 4, "B8": 4, "B9": 4, "B10": 4,
    "C1": 5,
    "C2": 5,
    "C3": 5,
    "D1": 3,
    "D2": 3,
    "D3": 3,
    "D4": 1,
    "F1": 2,
    "F2": 3,
}


def run(cmd: list[str], cwd: Path, timeout: int = 180) -> dict:
    started = time.time()
    try:
        proc = subprocess.run(
            cmd,
            cwd=str(cwd),
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=timeout,
        )
        return {
            "cmd": cmd,
            "code": proc.returncode,
            "ok": proc.returncode == 0,
            "seconds": round(time.time() - started, 2),
            "stdout_tail": proc.stdout[-2500:],
            "stderr_tail": proc.stderr[-2500:],
        }
    except Exception as error:  # noqa: BLE001
        return {"cmd": cmd, "code": -1, "ok": False, "seconds": round(time.time() - started, 2), "error": str(error)}


def can_import(python: str) -> bool:
    """True when the interpreter can import the light-weight metric deps."""
    try:
        probe = subprocess.run(
            [python, "-c", "import numpy, PIL"],
            capture_output=True,
            timeout=20,
        )
        return probe.returncode == 0
    except Exception:  # noqa: BLE001
        return False


def metrics_python() -> str:
    """Pick an interpreter that actually has numpy+Pillow.

    The skill venv may exist only for pyiqa; without numpy/Pillow the light
    fallback cannot run and A4 would silently score 0. Prefer any candidate
    that passes the import probe, then fall back to the current interpreter.
    """
    candidates: list[str] = []
    for rel in (".venv/Scripts/python.exe", ".venv/bin/python"):
        candidate = SKILL_DIR / rel
        if candidate.exists():
            candidates.append(str(candidate))
    candidates.append(sys.executable)
    for name in ("python", "python3"):
        found = shutil.which(name)
        if found:
            candidates.append(found)

    seen: set[str] = set()
    for candidate in candidates:
        key = str(Path(candidate).resolve()).lower()
        if key in seen:
            continue
        seen.add(key)
        if can_import(candidate):
            return candidate
    return sys.executable


def npm() -> str:
    return shutil.which("npm.cmd") or shutil.which("npm") or "npm"


def url_ok(url: str) -> bool:
    try:
        with urllib.request.urlopen(url, timeout=2) as response:
            return response.status < 500
    except Exception:  # noqa: BLE001
        return False


def port_free(host: str, port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(1)
        return sock.connect_ex((host, port)) != 0


def git_commit() -> str | None:
    try:
        out = subprocess.check_output(["git", "rev-parse", "--short", "HEAD"], cwd=str(REPO_ROOT), text=True).strip()
        return out
    except Exception:  # noqa: BLE001
        return None


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", required=True)
    parser.add_argument("--url", default="http://127.0.0.1:5173")
    parser.add_argument("--refs", default=None)
    parser.add_argument("--skip-build", action="store_true")
    parser.add_argument("--skip-metrics", action="store_true")
    parser.add_argument("--sample-ms", default="2200")
    parser.add_argument("--settle-ms", default="6000")
    args = parser.parse_args()

    out = Path(args.out)
    if not out.is_absolute():
        out = REPO_ROOT / out
    out.mkdir(parents=True, exist_ok=True)

    env = os.environ.copy()
    env["GAME_DIR"] = str(GAME_DIR)
    env["HF_ENDPOINT"] = env.get("HF_ENDPOINT", "https://hf-mirror.com")
    env.setdefault("PYTHONIOENCODING", "utf-8")

    result: dict = {
        "meta": {
            "generatedAt": datetime.now().isoformat(timespec="seconds"),
            "repo": str(REPO_ROOT),
            "game": str(GAME_DIR),
            "commit": git_commit(),
            "url": args.url,
            "scope": "acts 4-6 only; acts 1-3 excluded by product decision",
        },
        "steps": {},
    }

    # 1. build + tests
    if args.skip_build:
        result["build"] = {"skipped": True, "ok": None, "tests_ok": None}
    else:
        build = run([npm(), "run", "build"], GAME_DIR, timeout=300)
        tests = run([npm(), "test"], GAME_DIR, timeout=180)
        result["build"] = {
            **build,
            "tests": tests,
            "ok": build["ok"],
            "tests_ok": tests["ok"],
        }

    # 2. ensure dev server
    started_server = None
    if not url_ok(args.url):
        host, port = "127.0.0.1", 5173
        if not port_free(host, port):
            result["server"] = {"ok": False, "error": f"port {port} busy but {args.url} not responding"}
        else:
            log = open(out / "vite.log", "w", encoding="utf-8")
            started_server = subprocess.Popen(
                [npm(), "run", "start"],
                cwd=str(GAME_DIR),
                stdout=log,
                stderr=subprocess.STDOUT,
                env=env,
            )
            for _ in range(60):
                if url_ok(args.url):
                    break
                time.sleep(0.5)
            result["server"] = {"ok": url_ok(args.url), "pid": started_server.pid, "startedByEval": True}
    else:
        result["server"] = {"ok": True, "startedByEval": False}

    try:
        # 3. capture
        capture = run(
            [
                "node",
                str(SCRIPTS / "capture.mjs"),
                "--out",
                str(out),
                "--url",
                args.url,
                "--game",
                str(GAME_DIR),
                "--sample-ms",
                str(args.sample_ms),
                "--settle-ms",
                str(args.settle_ms),
            ],
            REPO_ROOT,
            timeout=180,
        )
        result["steps"]["capture"] = capture
        if (out / "capture.json").exists():
            result["capture"] = json.loads((out / "capture.json").read_text(encoding="utf-8"))

        # 4. assets
        assets = run(
            ["node", str(SCRIPTS / "check_assets.mjs"), "--out", str(out), "--game", str(GAME_DIR)],
            REPO_ROOT,
            timeout=120,
        )
        result["steps"]["assets"] = assets
        if (out / "assets.json").exists():
            result["assets"] = json.loads((out / "assets.json").read_text(encoding="utf-8"))

        # 5. visual metrics
        if args.skip_metrics:
            result["visual"] = {"skipped": True}
        else:
            visual_cmd = [
                metrics_python(),
                str(SCRIPTS / "visual_score.py"),
                "--screens",
                str(out / "screens"),
                "--out",
                str(out),
                "--thresholds",
                str(SKILL_DIR / "references" / "thresholds.json"),
            ]
            if args.refs:
                visual_cmd += ["--refs", args.refs]
            visual = run(visual_cmd, REPO_ROOT, timeout=900)
            result["steps"]["visual"] = visual
            if (out / "visual.json").exists():
                result["visual"] = json.loads((out / "visual.json").read_text(encoding="utf-8"))
    finally:
        if started_server is not None:
            subprocess.run(["taskkill", "/PID", str(started_server.pid), "/T", "/F"], capture_output=True)

    (out / "auto.json").write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")

    rubric = {
        "version": "1.0",
        "commit": result["meta"]["commit"],
        "date": datetime.now().strftime("%Y-%m-%d"),
        "flow_reachable": {"value": None, "evidence": ""},
        "criteria": {
            key: {"max": max_score, "score": None, "evidence": "", "reason": ""}
            for key, max_score in TEMPLATE_CRITERIA.items()
        },
    }
    (out / "rubric.template.json").write_text(json.dumps(rubric, ensure_ascii=False, indent=2), encoding="utf-8")

    summary = {
        "ok": True,
        "out": str(out),
        "build": result.get("build", {}).get("ok"),
        "tests": result.get("build", {}).get("tests_ok"),
        "server": result.get("server", {}).get("ok"),
        "assets": result.get("assets", {}).get("summary"),
        "b1": result.get("visual", {}).get("b1"),
        "b2": result.get("visual", {}).get("b2"),
        "blank": result.get("visual", {}).get("blank_views"),
        "visual_ok": result.get("visual", {}).get("b1") is not None,
        "visual_mode": result.get("visual", {}).get("metric_mode"),
    }
    print(json.dumps(summary, ensure_ascii=False))
    return 0 if summary["build"] is not False and summary["tests"] is not False else 1


if __name__ == "__main__":
    sys.exit(main())
