from pathlib import Path
import re, hashlib
idx_p = Path("apex-io/index.html")
css_p = Path("apex-io/styles.css")
idx = idx_p.read_text(encoding="utf-8")
css = css_p.read_text(encoding="utf-8")

if "intro-boot.js" not in idx:
    idx = idx.replace(
        '<script src="game.js"></script>',
        '<script src="intro-boot.js"></script>\n<script src="game.js"></script>',
        1,
    )
idx = re.sub(
    r'<video id="intro-vid"[^>]*>',
    '<video id="intro-vid" src="intro.mp4" poster="lobby-bg.jpg" muted playsinline preload="metadata"></video>',
    idx,
    count=1,
)
css = re.sub(
    r"\.intro video \{[\s\S]*?\n\}",
    """.intro video {
  width: 100%; height: 100%;
  object-fit: cover;
  display: block;
  background: #030806;
  pointer-events: none;
}""",
    css,
    count=1,
)
css = re.sub(
    r"\.intro-skip \{[\s\S]*?\n\}",
    """.intro-skip {
  position: absolute; top: 16px; right: 16px; z-index: 100;
  background: rgba(8,18,12,0.75); color: #e8f0ea; border: 1px solid #e7c56a88;
  border-radius: 999px; padding: 12px 18px; cursor: pointer; font: inherit;
  pointer-events: auto; min-height: 44px; min-width: 72px;
}""",
    css,
    count=1,
)
if "intro-boot.js" not in idx:
    raise SystemExit("intro-boot not linked")
idx_p.write_text(idx, encoding="utf-8")
css_p.write_text(css, encoding="utf-8")
print("html_ok", hashlib.sha256(idx.encode()).hexdigest()[:16])
