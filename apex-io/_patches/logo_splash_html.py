from pathlib import Path
import re, hashlib

idx_p = Path("apex-io/index.html")
css_p = Path("apex-io/styles.css")
idx = idx_p.read_text(encoding="utf-8")
css = css_p.read_text(encoding="utf-8")

idx = idx.replace('<div class="app" id="app">', '<div class="app waiting-intro" id="app">', 1)
idx = re.sub(r"\n?\s*<script id=\"apex-kill-intro\">[\s\S]*?</script>\n?", "\n", idx)

intro = """  <div id=\"intro\" class=\"intro\" role=\"dialog\" aria-label=\"Apex.XRP\">
    <img class=\"intro-logo\" src=\"logo-full.jpg\" alt=\"Apex.XRP\" />
    <div class=\"intro-copy\">
      <strong>APEX.XRP</strong>
      <span>Apex Predator. Hunt the canopy.</span>
    </div>
    <button type=\"button\" class=\"intro-skip\" id=\"intro-skip\">Skip</button>
  </div>
"""

pat = re.compile(r"  <div id=\"intro\"[\s\S]*?\n  <audio id=\"hiss-audio\"")
if not pat.search(idx):
    raise SystemExit("intro/audio anchor missing")
idx2 = pat.sub(intro + "  <audio id=\"hiss-audio\"", idx, count=1)
if "intro.mp4" in idx2 or "intro-vid" in idx2:
    raise SystemExit("video still in index after rewrite")

css2 = re.sub(
    r"\.intro \{[\s\S]*?\n\}",
    """.intro {
  position: fixed; inset: 0; z-index: 40;
  background: #030806 url(\"logo-full.jpg\") center / contain no-repeat;
  display: grid; place-items: center;
}""",
    css,
    count=1,
)
if ".intro-logo" not in css2:
    css2 = css2.replace(
        ".intro-copy {",
        """.intro-logo {
  width: min(72vw, 420px);
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 8px 28px #000a);
  pointer-events: none;
}
.intro-copy {""",
        1,
    )

idx_p.write_text(idx2, encoding="utf-8")
css_p.write_text(css2, encoding="utf-8")
print("html", hashlib.sha256(idx2.encode()).hexdigest())
print("css", hashlib.sha256(css2.encode()).hexdigest())
