from pathlib import Path
from docx import Document

sources = [
    Path(r"D:\Program Files (x86)\xwechat_files\wxid_hq7vslm9tqox22_704f\msg\file\2026-11\还魂路引_阴曹地府密室剧本.docx"),
    Path(r"D:\Program Files (x86)\xwechat_files\wxid_hq7vslm9tqox22_704f\msg\file\2026-11\阴曹地府_画风选择卡.docx"),
]

for source in sources:
    doc = Document(source)
    lines = [f"SOURCE: {source}", "", "=== PARAGRAPHS ==="]
    for i, paragraph in enumerate(doc.paragraphs, 1):
        if paragraph.text.strip():
            lines.append(f"P{i}: {paragraph.text}")
    lines.append("")
    lines.append("=== TABLES ===")
    for ti, table in enumerate(doc.tables, 1):
        lines.append(f"TABLE {ti}:")
        for ri, row in enumerate(table.rows, 1):
            cells = [cell.text.replace("\n", " / ") for cell in row.cells]
            lines.append(f"R{ri}: " + " | ".join(cells))
    target = Path(__file__).with_name(source.stem + "_提取.txt")
    target.write_text("\n".join(lines), encoding="utf-8")
    print(f"{source.name}: paragraphs={len(doc.paragraphs)}, tables={len(doc.tables)}, output={target}")
