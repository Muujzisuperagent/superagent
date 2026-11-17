#!/usr/bin/env python3
"""重新生成 game/src/copy-manifest.ts（游戏内文案清单）。

用法（在 game/ 目录）：
    python tools/extract-copy.py

只收静态中文文案：排除含 ${} 的模板、HTML 片段和超长代码块；
动态文案由编辑器里的「当前界面（动态文案）」分组在运行时补收。
"""
from __future__ import annotations

import json
import pathlib
import re

FILES = [
    ("界面 · HUD / 交互", "src/main.ts"),
    ("剧情 · 对白 / 结局", "src/story.ts"),
    ("场景 · 匾额 / 刻字", "src/scene.ts"),
    ("谜题 · 二至六殿", "src/puzzles_act23.ts"),
]
EXTRA = [
    "还魂路引",
    "阴司 · 引路",
    "引路中…",
    "正在铺开阴司",
    "引路已毕",
    "WASD 移动 · 鼠标环视 · E 交互 · Esc 释放鼠标",
    "WASD 移动 · 鼠标环视 · E 交互 · M 静音",
    "重走四五六殿",
    "请用启动器打开密室",
    "点击画面 · 锁定鼠标，开始引路",
    "点击画面重新锁定；若光标被困，连按 Esc 刷新页面",
    "音 · 开（M）",
    "音 · 静音（M）",
    "音 · 待启（M）",
]


def acceptable(value: str) -> bool:
    if len(value) > 160:
        return False
    if "<" in value or ">" in value:
        return False
    if "=>" in value or "function(" in value:
        return False
    return bool(re.search(r"[\u4e00-\u9fff]", value))


def extract(path: str) -> list[str]:
    source = pathlib.Path(path).read_text(encoding="utf-8")
    found: list[str] = []
    for pattern in (r"'([^'\\\n]*(?:\\.[^'\\\n]*)*)'", r'"([^"\\\n]*(?:\\.[^"\\\n]*)*)"'):
        for match in re.finditer(pattern, source):
            value = match.group(1)
            if "${" not in value and acceptable(value):
                found.append(value)
    for match in re.finditer(r"`([^`]*)`", source, re.S):
        value = match.group(1)
        if "${" not in value and acceptable(value):
            found.append(value)
    return found


def main() -> None:
    seen: set[str] = set()
    entries: list[dict[str, str]] = []
    for group, path in FILES:
        for raw in extract(path):
            value = raw.replace("\\n", "\n").replace("\\'", "'").replace('\\"', '"')
            if value in seen or not acceptable(value):
                continue
            seen.add(value)
            entries.append({"group": group, "text": value})
    for value in EXTRA:
        if value not in seen:
            seen.add(value)
            entries.append({"group": "界面 · HUD / 交互", "text": value})

    lines = [
        "// 由 tools/extract-copy.py 生成：游戏内文案清单（静态原文）。",
        "// 改文案走 copy-editor 运行时覆盖，不改本文件；动态文案由「当前界面」分组补收。",
        "export type CopyEntry = { group: string; text: string }",
        "",
        "export const COPY_MANIFEST: readonly CopyEntry[] = [",
    ]
    for entry in entries:
        lines.append(
            "  { group: %s, text: %s },"
            % (json.dumps(entry["group"], ensure_ascii=False), json.dumps(entry["text"], ensure_ascii=False))
        )
    lines.append("]")
    pathlib.Path("src/copy-manifest.ts").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"entries: {len(entries)}")


if __name__ == "__main__":
    main()
