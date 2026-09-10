(() => {
  const parts = ["game.p0.js","game.p1.js","game.p2.js","game.p3.js"];
  (async () => {
    let code = "";
    for (const p of parts) {
      const r = await fetch(p + "?v=" + Date.now());
      if (!r.ok) throw new Error("failed " + p + " " + r.status);
      code += await r.text();
    }
    (0, eval)(code);
  })().catch(e => { console.error(e); document.body.innerHTML = "<pre>game load failed: "+e+"</pre>"; });
})();
