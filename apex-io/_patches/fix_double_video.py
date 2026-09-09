from pathlib import Path
p = Path("apex-io/index.html")
t = p.read_text(encoding="utf-8")
t2 = t.replace("</video></video>", "</video>")
if "</video></video>" in t2:
    raise SystemExit("still doubled")
p.write_text(t2, encoding="utf-8")
print("fixed" if t2 != t else "already clean")
