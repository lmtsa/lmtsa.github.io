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

  // --- Announcement popup (shown once per browser session) ----------------
  var POPUP = {
    key: "lmtsa-popup-runoffs-2026",
    url: "https://docs.google.com/document/d/1bIuts_D_-i0QU5VHikbx25wgYH7NlChh0chBx6NQVwE/edit?usp=sharing",
  };
  var alreadySeen = false;
  try { alreadySeen = sessionStorage.getItem(POPUP.key) === "1"; } catch (e) {}
  if (!alreadySeen) {
    setTimeout(function () {
      try { sessionStorage.setItem(POPUP.key, "1"); } catch (e) {}
      var lastFocus = document.activeElement;
      var modal = document.createElement("div");
      modal.className = "popup-backdrop fixed inset-0 z-[60] flex items-center justify-center p-4";
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.setAttribute("aria-labelledby", "popup-title");
      modal.innerHTML =
        '<div class="absolute inset-0 bg-navydeep/60" data-close></div>' +
        '<div class="popup-card relative w-full max-w-lg max-h-[calc(100vh-2rem)] overflow-y-auto bg-white rounded-lg shadow-2xl px-6 sm:px-12 py-8 sm:py-10 text-center">' +
          '<button type="button" class="absolute top-3 right-3 w-11 h-11 inline-flex items-center justify-center rounded-md text-navy hover:bg-creamdeep transition-colors" aria-label="Close" data-close>' +
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="w-6 h-6"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
          '</button>' +
          '<p class="font-mono text-xs font-bold tracking-[0.15em] uppercase text-scarlet">Announcement</p>' +
          '<h2 id="popup-title" class="mt-3 font-display font-bold text-3xl sm:text-4xl text-navy leading-tight">Attention LMTSA Members!</h2>' +
          '<p class="mt-3 font-display font-semibold text-xl text-scarlet">Runoffs have been posted!</p>' +
          '<p class="mt-3 font-sans text-navy/70 leading-relaxed">The 2026&ndash;2027 runoffs are now available. Open the document for details and submission instructions.</p>' +
          '<p class="mt-4 font-sans text-sm text-navy/80 bg-creamdeep border border-line rounded-md px-4 py-2.5"><strong class="font-semibold text-navy">Note:</strong> You must be signed in to your school email to access the document.</p>' +
          '<a href="' + POPUP.url + '" target="_blank" rel="noopener noreferrer" class="mt-7 inline-block bg-navy text-white font-display font-semibold text-lg rounded-md px-8 py-3.5 hover:bg-scarlet transition-colors" data-primary>View the Runoffs</a>' +
          '<button type="button" class="mt-5 block mx-auto font-sans text-sm font-semibold text-navy underline underline-offset-4 hover:text-scarlet transition-colors" data-close>Continue Browsing</button>' +
        '</div>';

      var close = function () {
        modal.remove();
        document.documentElement.style.overflow = "";
        document.removeEventListener("keydown", onKey);
        if (lastFocus && lastFocus.focus) lastFocus.focus();
      };
      var onKey = function (e) {
        if (e.key === "Escape") { close(); return; }
        if (e.key !== "Tab") return;
        var items = modal.querySelectorAll("a[href], button");
        var first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      };
      modal.addEventListener("click", function (e) {
        if (e.target.closest("[data-close]") || e.target.closest("[data-primary]")) close();
      });
      document.addEventListener("keydown", onKey);
      document.documentElement.style.overflow = "hidden";
      document.body.appendChild(modal);
      modal.querySelector("[data-primary]").focus();
    }, 700);
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
