# -*- coding: utf-8 -*-
from docx import Document
W = r"D:\群核科技黑客松"
d1 = Document(W + r"\还魂路引_阴曹地府密室剧本_通俗生动版_v1.8.docx")

def full_text(d):
    parts = [p.text for p in d.paragraphs]
    for tb in d.tables:
        for row in tb.rows:
            for c in row.cells:
                parts.append(c.text)
    return "\n".join(parts)

t1 = full_text(d1)

MUST = {
    "旧版结构": ["三分钟看懂", "完整故事", "六关执行表", "谜题提示阶梯", "三结局", "角色表", "中国元素清单", "美术与资产", "落地方案"],
    "旧版要点": ["甲字肆号", "原告、被告、凶手", "阿满", "崔珏", "洛书", "骑缝章"],
    "v1.8 唱词": ["三更鼓歇鬼门开", "因果原是自家栽", "当年跪此一宵长", "换她三载好时光", "今朝判废还阳路", "庙前回首又寻常", "不饮孟婆一盏汤", "接过朱笔坐堂前"],
    "v1.8 序厅": ["阴司便民司办事须知", "香在，案在", "泰山府", "已迁址"],
    "v1.8 六房": ["本镜不提供美颜", "你缺一样", "碗底刻着两个字：阿满"],
    "v1.8 其他": ["陈丽媛 2021", "附录三"],
}

bad = [(g, k) for g, ks in MUST.items() for k in ks if k not in t1]
for g, k in bad:
    print("MISSING [" + g + "] " + k)
print("check:", "PASS" if not bad else "FAIL " + str(len(bad)))

FORBIDDEN = ["一盏汤暖过喉间", "契书判废账销清"]
still = [k for k in FORBIDDEN if k in t1]
for k in still:
    print("SHOULD-NOT-EXIST " + k)
print("reverse:", "PASS" if not still else "FAIL")

heads = [p.text for p in d1.paragraphs if p.style.name == "Heading 1"]
print("H1 count:", len(heads)); print(" | ".join(heads))
print("tables:", len(d1.tables))

d2 = Document(W + r"\阴曹地府_画风选择卡_优化版.docx")
t2 = full_text(d2)
missing2 = [k for k in ["A · 敦煌唐风", "B · 明清工笔重彩", "C · 写实阴司衙门", "D · 中式恐怖", "图像生成提示词", "oxidized bronze", "考据依据", "风险与控制", "不出现：骷髅"] if k not in t2]
for k in missing2:
    print("MISSING [card2] " + k)
print("card2:", "PASS" if not missing2 else "FAIL")
print("VERIFY DONE")
