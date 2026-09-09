/* Lightweight intro clear — no video. Testnet untouched. */
(function () {
  function clearIntro() {
    try {
      var app = document.getElementById("app");
      if (app) app.classList.remove("waiting-intro");
      var wrap = document.getElementById("intro");
      if (!wrap) return;
      try { wrap.classList.add("gone"); } catch (e) {}
      try { wrap.remove(); } catch (e) {
        try { wrap.style.display = "none"; } catch (e2) {}
      }
    } catch (e) {}
  }
  function arm() {
    var skip = document.getElementById("intro-skip");
    var wrap = document.getElementById("intro");
    function go(e) {
      try { if (e) { e.preventDefault(); e.stopPropagation(); } } catch (err) {}
      clearIntro();
    }
    if (skip) {
      skip.addEventListener("click", go, true);
      skip.addEventListener("touchend", go, { capture: true, passive: false });
      skip.addEventListener("pointerup", go, true);
    }
    if (wrap) {
      wrap.addEventListener("click", go, true);
      wrap.addEventListener("touchend", go, { capture: true, passive: false });
    }
    setTimeout(clearIntro, 1500);
    setTimeout(clearIntro, 2500);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", arm);
  else arm();
})();
