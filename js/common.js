/* Shared behaviour: edge waves, language toggle, toast and page navigation.

   Navigation has two modes:
   - Smooth mode: once the page has loaded, the other two pages are fetched in the background and placed next to
     the current one inside .stage. Clicking a tab slides the screens sideways with no reload.
     (Needs the site served over http(s); the browser blocks reading other files when opened straight from disk.)
   - Fallback: if the other pages cannot be read, the tabs are normal links. The current screen slides out,
     the next page loads and slides in. */
(function () {
  var $ = function (s) { return document.querySelector(s); };

  /* decorative waves on the page edges */
  (function () {
    var out = '', k;
    for (k = 0; k < 28; k++) {
      out += '<path d="M-60 ' + (370 + k * 8.5) + ' C 30 ' + (330 + k * 7) + ' 90 ' + (430 + k * 5) + ' 290 ' + (490 + k * 11) +
        '" stroke="hsl(' + (200 + k * 1.3) + ' 95% 60%)" stroke-opacity="' + (0.35 + (k % 5) * 0.12) + '" stroke-width="1.4" fill="none" vector-effect="non-scaling-stroke"/>';
      out += '<path d="M1980 ' + (350 + k * 8) + ' C 1890 ' + (320 + k * 7) + ' 1830 ' + (400 + k * 6) + ' 1630 ' + (440 + k * 9) +
        '" stroke="hsl(' + (215 + k * 1.0) + ' 95% 62%)" stroke-opacity="' + (0.3 + (k % 5) * 0.12) + '" stroke-width="1.4" fill="none" vector-effect="non-scaling-stroke"/>';
    }
    $('#waves').innerHTML = out;
  })();

  /* translations */
  i18n.apply();
  var langBtn = $('#lang');
  if (langBtn) langBtn.addEventListener('click', function () { i18n.toggle(); });

  /* ---------- navigation ---------- */
  var ORDER = ['index', 'portfolio', 'contact'];
  var PAGES = {
    index:     { href: 'index.html',     css: 'css/home.css',      js: 'js/home.js',      title: 'meta.title.home' },
    portfolio: { href: 'portfolio.html', css: 'css/portfolio.css', js: 'js/portfolio.js', title: 'meta.title.portfolio' },
    contact:   { href: 'contact.html',   css: 'css/contact.css',   js: 'js/contact.js',   title: 'meta.title.contact' }
  };
  var page = document.body.getAttribute('data-page');
  var stage = $('#stage');
  var panel = $('#panel');
  var panels = {};
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: no-preference)').matches;
  var soft = false, leaving = false, moveTimer;

  /* fallback: remember the slide direction across the page load */
  function putDir(dir) {
    var v = dir + '|' + Date.now();
    try { sessionStorage.setItem('slide', v); } catch (e) { window.name = 'slide:' + v; }
  }
  function takeDir() {
    var v = null;
    try { v = sessionStorage.getItem('slide'); sessionStorage.removeItem('slide'); } catch (e) {}
    if (!v && /^slide:/.test(window.name)) { v = window.name.slice(6); window.name = ''; }
    if (!v) return null;
    var p = v.split('|');
    return (Date.now() - Number(p[1]) < 5000 && (p[0] === 'left' || p[0] === 'right')) ? p[0] : null;
  }
  var arrived = takeDir();
  panel.classList.add(arrived ? 'in-' + arrived : 'in-fade');

  window.addEventListener('pageshow', function (e) {
    if (e.persisted) { leaving = false; panel.classList.remove('out-left', 'out-right'); }
  });

  function hardNav(target) {
    var href = PAGES[target].href;
    if (reduce) { location.href = href; return; }
    leaving = true;
    var dir = ORDER.indexOf(target) > ORDER.indexOf(page) ? 'left' : 'right';
    panel.classList.remove('in-left', 'in-right', 'in-fade');
    panel.classList.add('out-' + dir);
    putDir(dir);
    setTimeout(function () { location.href = href; }, 340);
  }

  /* smooth mode: place every screen relative to the one being shown */
  function place(to) {
    ORDER.forEach(function (p, i) {
      var n = panels[p];
      n.style.transform = 'translateX(' + ((i - to) * 100) + '%)';
      n.classList.toggle('is-active', i === to);
      if (i === to) n.removeAttribute('inert'); else n.setAttribute('inert', '');
    });
  }

  function softNav(target, push) {
    var info = PAGES[target];
    if (push) {
      try { history.pushState({ page: target }, '', info.href); }
      catch (e) { location.href = info.href; return; }
    }
    page = target;
    document.body.setAttribute('data-page', target);
    document.body.setAttribute('data-title', info.title);
    document.title = i18n.t(info.title);
    document.querySelectorAll('.nav a[data-page]').forEach(function (a) {
      if (a.getAttribute('data-page') === target) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    if (!reduce) stage.classList.add('moving', 'animate');
    place(ORDER.indexOf(target));
    clearTimeout(moveTimer);
    moveTimer = setTimeout(function () { stage.classList.remove('moving', 'animate'); }, reduce ? 0 : 680);
  }

  document.querySelectorAll('a[data-page]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      var target = a.getAttribute('data-page');
      if (target === page || leaving) return;
      if (soft) softNav(target, true); else hardNav(target);
    });
  });

  window.addEventListener('popstate', function () {
    if (!soft) return;
    var seg = location.pathname.split('/').pop();
    var p = /portfolio/.test(seg) ? 'portfolio' : (/contact/.test(seg) ? 'contact' : 'index');
    if (p !== page) softNav(p, false);
  });

  /* fetch the other pages once, keep them in the document */
  function fetchText(url) {
    return fetch(url).then(function (r) { if (!r.ok) throw new Error(url + ' ' + r.status); return r.text(); });
  }
  function loadCss(href) {
    return new Promise(function (done) {
      var l = document.createElement('link');
      l.rel = 'stylesheet'; l.href = href; l.onload = l.onerror = function () { done(); };
      document.head.appendChild(l);
    });
  }
  function loadJs(src) {
    return new Promise(function (done) {
      var s = document.createElement('script');
      s.src = src; s.onload = s.onerror = function () { done(); };
      document.body.appendChild(s);
    });
  }

  function upgrade() {
    if (!window.fetch || !window.DOMParser || !stage) return;
    var others = ORDER.filter(function (p) { return p !== page; });
    var curIdx = ORDER.indexOf(page);
    Promise.all(others.map(function (p) { return fetchText(PAGES[p].href); })).then(function (texts) {
      panels[page] = panel;
      others.forEach(function (p, i) {
        var doc = new DOMParser().parseFromString(texts[i], 'text/html');
        var src = doc.getElementById('panel');
        if (!src) throw new Error('panel missing in ' + p);
        var node = document.importNode(src, true);
        node.style.visibility = 'hidden';
        node.setAttribute('inert', '');
        if (ORDER.indexOf(p) < curIdx) stage.insertBefore(node, panel); else stage.appendChild(node);
        panels[p] = node;
        doc.querySelectorAll('#card > .scrim, #card > .lightbox').forEach(function (x) {
          $('#card').appendChild(document.importNode(x, true));
        });
      });
      ORDER.forEach(function (p) { panels[p].id = 'panel-' + p; });
      i18n.apply();
      return Promise.all(others.map(function (p) { return loadCss(PAGES[p].css); }))
        .then(function () { return Promise.all(others.map(function (p) { return loadJs(PAGES[p].js); })); });
    }).then(function () {
      place(curIdx);
      stage.classList.add('soft');
      others.forEach(function (p) { panels[p].style.visibility = ''; });
      soft = true;
    }).catch(function () { /* stays in fallback mode */ });
  }

  if (document.readyState === 'complete') setTimeout(upgrade, 0);
  else window.addEventListener('load', function () { setTimeout(upgrade, 0); });

  /* small message at the bottom of the card */
  var toastEl, toastTimer;
  window.site = {
    toast: function (msg) {
      if (!toastEl) {
        toastEl = document.createElement('div');
        toastEl.className = 'toast'; toastEl.setAttribute('role', 'status');
        $('#card').appendChild(toastEl);
      }
      toastEl.textContent = msg; toastEl.hidden = false;
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { toastEl.hidden = true; }, 3200);
    }
  };
})();
