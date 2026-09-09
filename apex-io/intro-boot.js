/* Early intro fail-open — must load before game.js. Does not touch Testnet/Xaman. */
(function () {
  function clearIntro() {
    try {
      var app = document.getElementById("app");
      if (app) app.classList.remove("waiting-intro");
      var wrap = document.getElementById("intro");
      if (!wrap) return;
      var vid = document.getElementById("intro-vid");
      try { if (vid) vid.pause(); } catch (e) {}
      try { wrap.classList.add("gone"); } catch (e) {}
      try { wrap.remove(); } catch (e) {
        try { wrap.style.display = "none"; } catch (e2) {}
      }
    } catch (e) {}
  }
  function arm() {
    var skip = document.getElementById("intro-skip");
    var wrap = document.getElementById("intro");
    if (skip) {
      var go = function (e) {
        try { if (e) { e.preventDefault(); e.stopPropagation(); } } catch (err) {}
        clearIntro();
      };
      skip.addEventListener("click", go, true);
      skip.addEventListener("touchend", go, { capture: true, passive: false });
      skip.addEventListener("pointerup", go, true);
    }
    if (wrap) {
      wrap.addEventListener("click", function (e) {
        if (e.target && e.target.id === "intro-skip") return clearIntro();
        clearIntro();
      }, true);
      wrap.addEventListener("touchend", function (e) {
        try { e.preventDefault(); } catch (err) {}
        clearIntro();
      }, { capture: true, passive: false });
    }
    setTimeout(clearIntro, 2000);
    setTimeout(clearIntro, 3500);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", arm);
  else arm();
})();
