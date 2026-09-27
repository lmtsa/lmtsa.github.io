(function () {
  "use strict";

  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // --- Scroll reveals (sections + staggered grids) ------------------------
  var revealTargets = document.querySelectorAll(".reveal, .stagger");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealTargets.forEach(function (el) {
      el.classList.add("is-visible");
    });
  } else {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealTargets.forEach(function (el) {
      observer.observe(el);
    });
  }

  // --- Mobile menu --------------------------------------------------------
  var menu = document.getElementById("mobile-menu");
  var toggle = document.querySelector("[data-menu-toggle]");
  if (menu && toggle) {
    var iconOpen = toggle.querySelector('[data-menu-icon="open"]');
    var iconClose = toggle.querySelector('[data-menu-icon="close"]');
    var setOpen = function (open) {
      menu.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      iconOpen.classList.toggle("hidden", open);
      iconClose.classList.toggle("hidden", !open);
    };
    toggle.addEventListener("click", function () { setOpen(menu.hidden); });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !menu.hidden) { setOpen(false); toggle.focus(); }
    });
    var desktop = window.matchMedia("(min-width: 1024px)");
    var onChange = function () { if (desktop.matches) setOpen(false); };
    if (desktop.addEventListener) desktop.addEventListener("change", onChange);

    // Mark the current page (works with or without ".html" in the URL).
    var page = location.pathname.split("/").pop().replace(/\.html$/, "") || "index";
    menu.querySelectorAll("a[href]").forEach(function (a) {
      var href = a.getAttribute("href");
      if (href.indexOf("#") !== -1) return;
      if (href.replace(/\.html$/, "") === page) {
        a.classList.remove("text-navy", "text-navy/80");
        a.classList.add("text-scarlet");
        a.setAttribute("aria-current", "page");
      }
    });
  }

  // --- Header scroll state (subtle shadow once scrolled) -------------------
  var header = document.querySelector("header");
  if (header) {
    var sentinel = document.createElement("div");
    sentinel.style.position = "absolute";
    sentinel.style.top = "0";
    sentinel.style.left = "0";
    sentinel.style.height = "1px";
    sentinel.style.width = "1px";
    sentinel.style.pointerEvents = "none";
    sentinel.setAttribute("aria-hidden", "true");
    document.body.prepend(sentinel);

    if ("IntersectionObserver" in window) {
      var headerObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          header.classList.toggle("is-scrolled", !entry.isIntersecting);
        });
      });
      headerObserver.observe(sentinel);
    }
  }
})();
