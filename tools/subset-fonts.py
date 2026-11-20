#!/usr/bin/env python3
"""Build the product page's web fonts.

Subsets GenKiMin2 TW and GenKiGothic2 TW (SIL OFL 1.1) to the characters
used in index.html and zh/index.html plus Latin, Roman Orthography tone marks and CJK
punctuation, renames them, and writes WOFF2 files to fonts/.

Run again after changing the text of index.html or zh/index.html:

    python3 tools/subset-fonts.py

Needs fontTools and brotli (pip install fonttools brotli) and the GenKi
fonts installed in ~/Library/Fonts (or pass another folder as argument).
"""
import html
import pathlib
import re
import sys

from fontTools import subset
from fontTools.ttLib import TTCollection

ROOT = pathlib.Path(__file__).resolve().parent.parent
FONT_DIR = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path.home() / "Library/Fonts"
OUT = ROOT / "fonts"

# (source file, face name inside the .ttc, new family, weight, output file)
FACES = [
    ("GenKiMin2-R.ttc", "GenKiMin2 TW R", "Pehoeji Page Serif", 400, "page-serif-400.woff2"),
    ("GenKiMin2-B.ttc", "GenKiMin2 TW B", "Pehoeji Page Serif", 700, "page-serif-700.woff2"),
    ("GenKiGothic2-R.ttc", "GenKiGothic2 TW R", "Pehoeji Page Sans", 400, "page-sans-400.woff2"),
    ("GenKiGothic2-M.ttc", "GenKiGothic2 TW M", "Pehoeji Page Sans", 500, "page-sans-500.woff2"),
    ("GenKiGothic2-B.ttc", "GenKiGothic2 TW B", "Pehoeji Page Sans", 700, "page-sans-700.woff2"),
]

# always included, so small Latin edits never need a rebuild
RANGES = [
    (0x0020, 0x007E), (0x00A0, 0x024F), (0x0300, 0x036F), (0x1E00, 0x1EFF),
    (0x2000, 0x206F), (0x207F, 0x207F), (0x2190, 0x2199), (0x2212, 0x2212),
    (0x2260, 0x2265), (0x25CB, 0x25CF), (0x3000, 0x303F), (0xFF01, 0xFF65),
]


def page_text() -> str:
    src = "".join((ROOT / p).read_text(encoding="utf-8") for p in ("index.html", "zh/index.html"))
    src = re.sub(r"<(script|style)\b.*?</\1>", " ", src, flags=re.S)
    return html.unescape(re.sub(r"<[^>]+>", " ", src))


def codepoints() -> set[int]:
    cps = {ord(c) for c in page_text() if ord(c) > 0x7F}
    for a, b in RANGES:
        cps.update(range(a, b + 1))
    return cps


def build(src: str, face: str, family: str, weight: int, out: str, cps: set[int]) -> None:
    collection = TTCollection(str(FONT_DIR / src))
    font = next(f for f in collection.fonts if str(f["name"].getName(4, 3, 1, 0x409)) == face)
    cmap = font.getBestCmap()
    keep = sorted(cp for cp in cps if cp in cmap)

    opts = subset.Options()
    opts.flavor = "woff2"
    opts.layout_features = ["*"]      # keeps mark/mkmk/ccmp so tone marks sit right
    opts.name_IDs = []
    opts.hinting = False
    opts.desubroutinize = True
    sub = subset.Subsetter(opts)
    sub.populate(unicodes=keep)
    sub.subset(font)

    style = "Regular" if weight == 400 else str(weight)
    name = font["name"]
    for nid, value in ((1, family), (2, "Regular"), (4, f"{family} {style}"),
                       (6, f"{family.replace(' ', '')}-{style}"), (16, family), (17, style)):
        name.setName(value, nid, 3, 1, 0x409)
    name.setName("Subset of GenKiMin2 / GenKiGothic2 by ButTaiwan. SIL Open Font License 1.1.", 0, 3, 1, 0x409)
    font["OS/2"].usWeightClass = weight

    OUT.mkdir(exist_ok=True)
    path = OUT / out
    font.save(str(path))
    missing = sorted(cp for cp in cps if cp not in cmap and cp > 0x2FFF)
    print(f"{out}: {len(keep)} characters, {path.stat().st_size // 1024} KB"
          + (f", missing {''.join(map(chr, missing))}" if missing else ""))


if __name__ == "__main__":
    cps = codepoints()
    for args in FACES:
        build(*args, cps=cps)
