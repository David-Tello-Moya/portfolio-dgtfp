/* Portfolio page: project grid, popup with pictures, zoomed picture viewer.
   Texts come from js/lang/*.js (keys projects.<id>.*). Pictures live in img/projects/<id>/1.svg, 2.svg ... */
(function () {
  var t = i18n.t;
  var PROJECTS = [
    { id: 'robot-c',  year: '2025/26', tags: ['Python'],           pics: 4, vids: 2 }
    // { id: 'lumen',  year: '2025', tags: ['Next.js', 'Tailwind', 'Stripe'],       pics: 4 },
    // { id: 'pulse',  year: '2024', tags: ['Vue', 'PWA', 'IndexedDB'],             pics: 6 },
    // { id: 'atlas',  year: '2024', tags: ['Next.js', 'Mapbox', 'WebSockets'],     pics: 5 },
    // { id: 'notely', year: '2023', tags: ['Svelte', 'CodeMirror', 'Vite'],        pics: 3 },
    // { id: 'kite',   year: '2023', tags: ['JavaScript', 'Canvas', 'REST API'],    pics: 6 }
  ];
  /* change '.svg' to '.jpg' / '.png' when you drop in real screenshots */
  function src(i, j) { return 'img/projects/' + PROJECTS[i].id + '/' + (j + 1) + '.jpg'; }
  /* videos come after the pictures: img/projects/<id>/video1.mp4, video2.mp4 ... */
  function total(p) { return p.pics + (p.vids || 0); }
  function isVideo(p, j) { return j >= p.pics; }
  function vsrc(i, j) { return 'img/projects/' + PROJECTS[i].id + '/video' + (j - PROJECTS[i].pics + 1) + '.mp4'; }

  function el(tag, props, text) {
    var n = document.createElement(tag), k;
    for (k in props) if (props.hasOwnProperty(k)) n.setAttribute(k, props[k]);
    if (text != null) n.textContent = text;
    return n;
  }
  var $ = function (s) { return document.querySelector(s); };

  var grid = $('#grid'), shell = $('#shell'), scrim = $('#scrim'), modal = $('#modal'), lb = $('#lightbox');
  var cur = -1, curPic = 0, lastCard = -1, lastPicIdx = -1;

  function renderGrid() {
    grid.textContent = '';
    PROJECTS.forEach(function (p, i) {
      var k = 'projects.' + p.id, card = el('article', { 'class': 'pcard' }), body = el('div', { 'class': 'body' });
      card.appendChild(el('img', { src: src(i, 0), alt: t('portfolio.previewAlt', { title: t(k + '.title') }) }));
      body.appendChild(el('h3', {}, t(k + '.title')));
      body.appendChild(el('p', {}, t(k + '.blurb')));
      body.appendChild(el('button', { 'class': 'btn-open', type: 'button', 'data-i': i }, t('portfolio.view')));
      card.appendChild(body);
      grid.appendChild(card);
    });
  }

  function fillModal() {
    var p = PROJECTS[cur], k = 'projects.' + p.id, title = t(k + '.title'), j;
    $('#m-title').textContent = title;
    $('#m-meta').textContent = p.year + '  ·  ' + t(k + '.role');
    var tags = $('#m-tags'); tags.textContent = '';
    p.tags.forEach(function (x) { tags.appendChild(el('li', {}, x)); });
    var text = $('#m-text'); text.textContent = '';
    text.appendChild(el('p', {}, t(k + '.text1')));
    text.appendChild(el('p', {}, t(k + '.text2')));
    var pics = $('#m-pics'); pics.textContent = '';
    for (j = 0; j < total(p); j++) {
      var vid = isVideo(p, j);
      var b = el('button', { 'class': 'pic', type: 'button', 'data-j': j,
        'aria-label': vid ? t('portfolio.play', { n: j - p.pics + 1 }) : t('portfolio.zoom', { n: j + 1, total: total(p) }) });
      if (vid) {
        var v = el('video', { src: vsrc(cur, j) + '#t=0.1', preload: 'metadata', playsinline: '', tabindex: '-1' });
        v.muted = true;
        b.appendChild(v);
        b.appendChild(el('span', { 'class': 'play', 'aria-hidden': 'true' }));
      } else {
        b.appendChild(el('img', { src: src(cur, j), alt: t('portfolio.shot', { n: j + 1, title: title }) }));
      }
      pics.appendChild(b);
    }
  }

  function openProject(i) {
    cur = i; lastCard = i;
    fillModal();
    scrim.hidden = false; shell.inert = true;
    modal.scrollTop = 0;
    $('#m-close').focus();
  }
  function closeProject() {
    scrim.hidden = true; shell.inert = false; cur = -1;
    var b = grid.querySelector('[data-i="' + lastCard + '"]');
    if (b) b.focus();
  }
  function showPic(j, play) {
    var p = PROJECTS[cur], title = t('projects.' + p.id + '.title'), n = total(p);
    var img = $('#l-img'), vp = $('#l-video');
    curPic = (j + n) % n;
    if (isVideo(p, curPic)) {
      var s = vsrc(cur, curPic);
      img.hidden = true; vp.hidden = false;
      if (vp.getAttribute('src') !== s) vp.setAttribute('src', s); /* same file = no restart (language switch) */
      if (play) { var r = vp.play(); if (r && r.catch) r.catch(function () {}); }
    } else {
      vp.pause(); vp.hidden = true; img.hidden = false;
      img.src = src(cur, curPic);
      img.alt = t('portfolio.shot', { n: curPic + 1, title: title });
    }
    $('#l-cap').textContent = title + '  ·  ' + (curPic + 1) + ' / ' + n;
  }
  function openPic(j) {
    lastPicIdx = j; showPic(j, true);
    lb.hidden = false; modal.inert = true;
    $('#l-close').focus();
  }
  function closePic() {
    $('#l-video').pause();
    lb.hidden = true; modal.inert = false;
    var b = $('#m-pics [data-j="' + lastPicIdx + '"]');
    if (b) b.focus();
  }

  grid.addEventListener('click', function (e) {
    var b = e.target.closest('.btn-open'); if (b) openProject(+b.getAttribute('data-i'));
  });
  $('#m-pics').addEventListener('click', function (e) {
    var b = e.target.closest('.pic'); if (b) openPic(+b.getAttribute('data-j'));
  });
  $('#m-close').addEventListener('click', closeProject);
  scrim.addEventListener('mousedown', function (e) { if (e.target === scrim) closeProject(); });
  $('#l-close').addEventListener('click', closePic);
  lb.addEventListener('mousedown', function (e) { if (e.target === lb) closePic(); });
  $('#l-prev').addEventListener('click', function () { showPic(curPic - 1, true); });
  $('#l-next').addEventListener('click', function () { showPic(curPic + 1, true); });

  document.addEventListener('keydown', function (e) {
    var layer = !lb.hidden ? lb : (!scrim.hidden ? modal : null);
    if (!layer) return;
    if (e.key === 'Escape') { e.preventDefault(); if (!lb.hidden) closePic(); else closeProject(); }
    else if (e.key === 'ArrowLeft' && !lb.hidden && document.activeElement !== $('#l-video')) showPic(curPic - 1, true);
    else if (e.key === 'ArrowRight' && !lb.hidden && document.activeElement !== $('#l-video')) showPic(curPic + 1, true);
    else if (e.key === 'Tab') {
      var f = Array.prototype.filter.call(layer.querySelectorAll('button'), function (n) { return n.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* switching language re-renders every text, even with a popup open */
  document.addEventListener('i18n:change', function () {
    renderGrid();
    if (cur >= 0) fillModal();
    if (!lb.hidden) showPic(curPic);
  });

  renderGrid();
})();
