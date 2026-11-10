# -*- coding: utf-8 -*-
from docx import Document
W = r"D:\新建文件夹"
d1 = Document(W + r"\还魂路引_阴曹地府密室剧本_通俗生动版.docx")
t1 = "\n".join(p.text for p in d1.paragraphs)
for key in ["三分钟看懂", "完整故事", "六关执行表", "谜题提示阶梯", "三结局", "角色表", "中国元素清单", "美术与资产", "落地方案", "甲字肆号", "原告、被告、凶手", "阿满", "崔珏", "洛书", "骑缝章"]:
    assert key in t1, key
heads = [p.text for p in d1.paragraphs if p.style.name == "Heading 1"]
print("H1 count:", len(heads)); print(" | ".join(heads))
print("tables:", len(d1.tables))
d2 = Document(W + r"\阴曹地府_画风选择卡_优化版.docx")
t2 = "\n".join(p.text for p in d2.paragraphs)
for key in ["A · 敦煌唐风", "B · 明清工笔重彩", "C · 写实阴司衙门", "D · 中式恐怖", "图像生成提示词", "oxidized bronze", "考据依据", "风险与控制", "不出现：骷髅"]:
    assert key in t2, key
print("card2 paragraphs:", len(d2.paragraphs))
print("VERIFY OK")
