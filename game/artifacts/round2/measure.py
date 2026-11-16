# 与 huihun-eval visual_score.pixel_stats 同口径：mean_luma / near_black(luma<0.04)
import sys
import numpy as np
from PIL import Image

for path in sys.argv[1:]:
    arr = np.asarray(Image.open(path).convert('RGB')).astype(np.float32) / 255.0
    luma = 0.2126 * arr[..., 0] + 0.7152 * arr[..., 1] + 0.0722 * arr[..., 2]
    print(f'{path}: mean_luma={luma.mean():.4f} near_black_ratio={(luma < 0.04).mean():.4f} near_white={(luma > 0.96).mean():.4f}')