from pathlib import Path
import re, hashlib

idx_p = Path("apex-io/index.html")
css_p = Path("apex-io/styles.css")
idx = idx_p.read_text(encoding="utf-8")
css = css_p.read_text(encoding="utf-8")

# No waiting-intro on app
idx = idx.replace('<div class="app waiting-intro" id="app">', '<div class="app" id="app">', 1)
idx = re.sub(r"\n?\s*<script id=\"apex-kill-intro\">[\s\S]*?</script>\n?", "\n", idx)

# Remove entire intro block if present
idx2 = re.sub(
    r"\n?\s*<div id=\"intro\"[\s\S]*?</div>\s*(?=<audio id=\"hiss-audio\")",
    "\n  ",
    idx,
    count=1,
)
if 'id="intro"' in idx2:
    raise SystemExit("intro still present after strip")

# CSS: keep .intro hidden hard if markup ever returns
css2 = re.sub(
    r"\.intro \{[\s\S]*?\n\}",
    """.intro {
  display: none !important;
}""",
    css,
    count=1,
)
# Remove .intro-logo block if present
css2 = re.sub(r"\n\.intro-logo \{[\s\S]*?\n\}", "\n", css2, count=1)

idx_p.write_text(idx2, encoding="utf-8")
css_p.write_text(css2, encoding="utf-8")
print("html", hashlib.sha256(idx2.encode()).hexdigest())
print("css", hashlib.sha256(css2.encode()).hexdigest())
print("no intro", 'id="intro"' not in idx2)
