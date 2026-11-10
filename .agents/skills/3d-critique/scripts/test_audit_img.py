"""Focused numerical and CLI checks; synthetic images are not scene reviews."""
import contextlib
import importlib.util
import io
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from PIL import Image

spec = importlib.util.spec_from_file_location("audit_img", Path(__file__).with_name("audit_img.py"))
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)


class AuditTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)

    def save(self, name, color):
        path = self.root / name
        Image.new("RGBA", (10, 10), color).save(path)
        return path

    def test_palette_and_scene_exception(self):
        red = self.save("朱砂.png", "#B23A32")
        result = audit.analyze(red, "一殿")
        self.assertEqual(result["palette_nearest_within_delta_e_20_pct"]["朱砂"], 100)
        self.assertEqual(result["red_family_candidate_pct"], 100)
        self.assertIn("超过5%", result["review_notes"][0])
        self.assertFalse(any("超过5%" in s for s in audit.analyze(red, "六殿")["review_notes"]))
        self.assertFalse(audit.analyze(red)["review_notes"])

    def test_alpha_weighting(self):
        path = self.save("透明.png", (255, 0, 0, 0))
        with Image.open(path) as source:
            image = source.copy()
        image.putpixel((0, 0), (255, 255, 255, 255))
        image.save(path)
        result = audit.analyze(path)
        self.assertEqual(result["transparent_pixel_pct"], 99)
        self.assertAlmostEqual(result["luma_mean_srgb"], 1)
        self.assertEqual(result["near_white_pct_luma_gt_0_95"], 100)
        with self.assertRaisesRegex(ValueError, "transparent"):
            audit.analyze(self.save("empty.png", (0, 0, 0, 0)))

    def test_black_white(self):
        black = audit.analyze(self.save("black.png", "black"))
        white = audit.analyze(self.save("white.png", "white"))
        self.assertEqual(black["near_black_pct_luma_lt_0_05"], 100)
        self.assertEqual(white["near_black_pct_luma_lt_0_05"], 0)
        self.assertEqual(black["luma_std_srgb"], 0)
        self.assertEqual(white["saturation_hsv_mean"], 0)

    def test_cli_batch_unicode_and_no_overwrite(self):
        images = [self.save("场景甲.png", "#5B6670"), self.save("场景乙.png", "#3A2B22")]
        output = self.root / "评审" / "pixels.json"
        argv = ["audit_img.py", *map(str, images), "--scene", "序厅", "--out", str(output)]
        with patch.object(sys, "argv", argv), contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(audit.main(), 0)
        data = json.loads(output.read_text(encoding="utf-8"))
        self.assertEqual(len(data["results"]), 2)
        before = output.read_bytes()
        with patch.object(sys, "argv", argv), contextlib.redirect_stderr(io.StringIO()):
            self.assertEqual(audit.main(), 2)
        self.assertEqual(output.read_bytes(), before)

    def test_missing_and_invalid_input(self):
        path = self.root / "bad.png"
        path.write_text("not an image", encoding="utf-8")
        for item in [path, self.root / "missing.png"]:
            with patch.object(sys, "argv", ["audit_img.py", str(item)]), contextlib.redirect_stderr(io.StringIO()):
                self.assertEqual(audit.main(), 2)


if __name__ == "__main__":
    unittest.main()
