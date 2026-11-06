/* NAZARAUDAR - сценарии страницы: плиты, панели кузова «зазоры в ноль», язык, меню, до/после, форма. */
(function () {
  'use strict';

  var doc = document, root = doc.documentElement, body = doc.body;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ASSET_V = ((doc.currentScript && doc.currentScript.src.match(/[?&]v=([^&]+)/)) || [])[1] || '';
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var isMobile = function () { return window.innerWidth <= 760; };
  var WA_NUM = '77757066450'; /* полировка, шумоизоляция и PDR - свой номер в data-num */

  /* ---------- i18n ---------- */
  var I18N = { ru: {} };
  var META = { ru: { title: doc.title, desc: (doc.querySelector('meta[name="description"]') || {}).content || '' } };
  var nodes = [].slice.call(doc.querySelectorAll('[data-i]'));
  nodes.forEach(function (el) { I18N.ru[el.getAttribute('data-i')] = el.innerHTML; });

  /* готовые тексты WhatsApp (русские; казахские - в assets/lang/kk.js под ключами wa.*) */
  var WA_RU = {
    hero: 'Здравствуйте! Хочу оценить ремонт, отправлю фото.',
    pokraska: 'Здравствуйте! Интересует полная покраска авто. Какая цена и срок?',
    tolshchinomer: 'Здравствуйте! Нужна покраска под толщиномер. Отправлю фото детали.',
    avariynye: 'Здравствуйте! Машина после ДТП, нужна оценка восстановления. Отправлю фото.',
    polirovka: 'Здравствуйте! Интересует полировка кузова. Какая цена?',
    shumka: 'Здравствуйте! Интересует шумоизоляция. Какая цена и срок?',
    detali: 'Здравствуйте! Нужно покрасить деталь. Отправлю фото.',
    kostoprav: 'Здравствуйте! Нужен костоправ, есть вмятины. Отправлю фото.',
    pdr: 'Здравствуйте! Нужно убрать вмятину без покраски. Отправлю фото.',
    porogi: 'Здравствуйте! Нужна замена порогов. Какая цена?',
    arki: 'Здравствуйте! Нужна замена арок. Отправлю фото.',
    krysha: 'Здравствуйте! Нужна замена крыши. Отправлю фото.',
    morda: 'Здравствуйте! Нужна замена передней части. Отправлю фото.',
    lonzherony: 'Здравствуйте! Нужно вытянуть кузов, лонжероны. Отправлю фото.'
  };
  Object.keys(WA_RU).forEach(function (k) { I18N.ru['wa.' + k] = WA_RU[k]; });

  function waLinks(lang) {
    var d = I18N[lang] || I18N.ru;
    [].forEach.call(doc.querySelectorAll('a[data-wa]'), function (a) {
      var k = 'wa.' + a.getAttribute('data-wa');
      var msg = d[k] || I18N.ru[k] || '';
      a.href = 'https://wa.me/' + (a.getAttribute('data-num') || WA_NUM) + (msg ? '?text=' + encodeURIComponent(msg) : '');
    });
  }

  function loadLang(lang, done) {
    if (I18N[lang] || lang !== 'kk') return done();
    var s = doc.createElement('script');
    s.src = 'assets/lang/kk.js' + (ASSET_V ? '?v=' + ASSET_V : '');
    s.onload = function () {
      if (window.SITE_KK) { I18N.kk = window.SITE_KK; META.kk = { title: window.SITE_KK['meta.title'], desc: window.SITE_KK['meta.desc'] }; }
      done();
    };
    s.onerror = function () { done(); };
    doc.head.appendChild(s);
  }

  function applyLang(lang) {
    var dict = I18N[lang] || I18N.ru;
    nodes.forEach(function (el) {
      var k = el.getAttribute('data-i');
      var v = dict[k] != null ? dict[k] : I18N.ru[k];
      if (v == null) return;
      el.innerHTML = v;
    });
    root.setAttribute('lang', lang);
    var m = META[lang] || META.ru;
    if (m) {
      doc.title = m.title;
      var md = doc.querySelector('meta[name="description"]');
      if (md) md.content = m.desc;
    }
    [].forEach.call(doc.querySelectorAll('.lang button'), function (b) {
      var on = b.getAttribute('data-lang') === lang;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    try { localStorage.setItem('nz-lang', lang); } catch (e) {}
    waLinks(lang);
    fitText();
    placeCar();
    ribbonBtns();
    if (typeof nowStatus === 'function') nowStatus();
  }
  function setLang(lang) { loadLang(lang, function () { applyLang(lang); }); }

  [].forEach.call(doc.querySelectorAll('.lang button'), function (b) {
    b.addEventListener('click', function () { setLang(b.getAttribute('data-lang')); });
  });
  (function initLang() {
    var forced = (location.search.match(/[?&]lang=(ru|kk)/) || [])[1];
    var saved = null;
    try { saved = localStorage.getItem('nz-lang'); } catch (e) {}
    var lang = forced || saved || 'ru';
    waLinks('ru');
    if (lang !== 'ru') setLang(lang);
  })();

  /* ---------- fitText: дисплейный заголовок не вылезает за контейнер ---------- */
  function fitText() {
    [].forEach.call(doc.querySelectorAll('.fit'), function (h) {
      h.style.fontSize = '';
      var box = h.parentElement, max = box.clientWidth, size = parseFloat(getComputedStyle(h).fontSize), n = 0;
      var over = function () {
        var w = 0; [].forEach.call(h.children.length ? h.children : [h], function (c) { w = Math.max(w, c.scrollWidth); });
        return w > max + 1;
      };
      while (over() && n < 14 && size > 24) { size *= 0.95; h.style.fontSize = size + 'px'; n++; }
    });
  }


  /* ---------- меню ---------- */
  var burger = doc.querySelector('.burger'), menu = doc.getElementById('menu');
  function openMenu(on) {
    if (on) menu.hidden = false;
    requestAnimationFrame(function () {
      menu.classList.toggle('is-open', on);
      body.classList.toggle('menu-open', on);
      burger.setAttribute('aria-expanded', on ? 'true' : 'false');
      burger.setAttribute('aria-label', on ? 'Закрыть меню' : 'Открыть меню');
      if (!on) setTimeout(function () { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 320);
    });
  }
  burger.addEventListener('click', function () { openMenu(!body.classList.contains('menu-open')); });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && body.classList.contains('menu-open')) openMenu(false); });
  [].forEach.call(menu.querySelectorAll('a'), function (a) { a.addEventListener('click', function () { openMenu(false); }); });

  /* ---------- якоря: своя прокрутка с учётом шапки ---------- */
  var hdr = doc.getElementById('hdr');
  function targetTop(el) {
    var off = el.classList.contains('pw') && window.innerWidth > 760 ? 0 : hdr.offsetHeight + (el.classList.contains('pw') ? 0 : 12);
    return el.getBoundingClientRect().top + window.pageYOffset - off;
  }
  function goTo(id, instant) {
    var el = doc.getElementById(id);
    if (!el) return false;
    var y = targetTop(el);
    if (instant || reduce) { root.style.scrollBehavior = 'auto'; window.scrollTo(0, y); root.style.scrollBehavior = ''; }
    else window.scrollTo({ top: y, behavior: 'smooth' });
    return true;
  }
  doc.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    if (!id) return;
    if (goTo(id)) { e.preventDefault(); history.pushState(null, '', '#' + id); }
  });

  /* ---------- панели кузова: кадр собирается из шести панелей по контрольным точкам ---------- */
  var SEAM = '<svg class="seam" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' +
    '<line x1="0" y1="46" x2="100" y2="46"/><line x1="34" y1="0" x2="30" y2="100"/><line x1="68" y1="0" x2="64" y2="100"/></svg>';
  var CP_POS = [[32.2, 46], [66.2, 46], [50, 78]];
  function fmtMm(v) {
    var s = (Math.abs(v) < 0.05 ? 0 : v).toFixed(1).replace('.', ',');
    return (v > 0.05 ? '+' : '') + s;
  }
  function buildPanels(ph) {
    var media = ph.querySelector('picture, img');
    if (!media) return;
    var first = doc.createElement('div'); first.className = 'pn pn-1';
    ph.insertBefore(first, media); first.appendChild(media);
    for (var i = 2; i <= 6; i++) {
      var pn = doc.createElement('div'); pn.className = 'pn pn-' + i;
      var c = media.cloneNode(true);
      [].forEach.call(c.tagName === 'IMG' ? [c] : c.querySelectorAll('img'), function (img) { img.alt = ''; img.setAttribute('aria-hidden', 'true'); });
      pn.appendChild(c); ph.appendChild(pn);
    }
    if (ph.hasAttribute('data-static')) return;
    ph.insertAdjacentHTML('beforeend', SEAM);
    var bases = (ph.getAttribute('data-cp') || '').split(',').map(parseFloat).filter(function (n) { return !isNaN(n); });
    ph._cps = bases.map(function (b, i) {
      var cp = doc.createElement('span'); cp.className = 'cp cp-' + (i + 1);
      cp.style.left = CP_POS[i][0] + '%'; cp.style.top = CP_POS[i][1] + '%';
      cp.innerHTML = '<b>' + fmtMm(b) + '</b> мм';
      ph.appendChild(cp);
      return { el: cp, b: b, val: null };
    });
    ph._g = -1;
    setG(ph, 1);
  }
  function setG(ph, g) {
    g = Math.round(g * 1000) / 1000;
    if (ph._g === g) return;
    ph._g = g;
    ph.style.setProperty('--g', g);
    var k = clamp(g, 0, 1);
    (ph._cps || []).forEach(function (cp) {
      var v = Math.round(cp.b * k * 10) / 10;
      if (v === cp.val) return;
      cp.val = v;
      cp.el.firstChild.textContent = fmtMm(v);
      cp.el.classList.toggle('ok', Math.abs(v) < 0.05);
    });
  }
  [].forEach.call(doc.querySelectorAll('.ph[data-panels]'), buildPanels);
  var easeOutCubic = function (x) { return 1 - Math.pow(1 - x, 3); };
  var easeOutBack = function (x) { var c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };

  /* ---------- плиты ---------- */
  var pws = [].slice.call(doc.querySelectorAll('.pw'));
  var hero = doc.querySelector('.pw.hero');
  var heroPh = hero.querySelector('.hero-ph');
  var state = pws.map(function () { return { e: -1, s: -1, x: -1 }; });
  var H = window.innerHeight;
  var ticking = false;

  function setVar(el, name, v, st, key) {
    v = Math.round(v * 1000) / 1000;
    if (st[key] === v) return;
    st[key] = v;
    el.style.setProperty(name, v);
  }

  function plates() {
    ticking = false;
    H = window.innerHeight;
    var rects = pws.map(function (p) { return p.getBoundingClientRect(); });
    var enters = rects.map(function (r) { return clamp(1 - r.top / H, 0, 1); });
    pws.forEach(function (p, i) {
      var r = rects[i];
      if (r.bottom < -H || r.top > H * 2) return;
      var enter = enters[i];
      var span = r.height - H;
      var stay = span > 2 ? clamp(-r.top / span, 0, 1) : 0;
      var next = pws[i + 1];
      var exit = next && r.bottom > 0 ? enters[i + 1] : 0;
      var st = state[i];
      setVar(p, '--enter', enter, st, 'e');
      setVar(p, '--stay', stay, st, 's');
      setVar(p, '--exit', exit, st, 'x');
      p.classList.toggle('gone', exit >= 1 || r.bottom <= 0);
      var txt = p.querySelector('.txt, .hero-txt');
      if (txt && enter > 0.72 && (p !== hero || introDone)) txt.classList.add('on');
      if (p !== hero) {
        var ph = p.querySelector('.ph[data-panels]');
        if (ph) {
          var o = clamp((enter - 0.3) / 0.6, 0, 1);
          setG(ph, reduce ? 0 : 1 - easeOutCubic(o));
        }
      }
    });
    stickyBar();
    uiScroll();
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(plates); } }
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- интро героя: свет в камере, проход краскопульта, замер толщиномером, блик ---------- */
  var introDone = false;
  var booth = doc.getElementById('booth'), car = doc.getElementById('car');
  function runIntro() {
    var heroTxt = hero.querySelector('.hero-txt');
    if (!car || !booth) { introDone = true; heroTxt.classList.add('on'); onScroll(); return; }
    var paint = car.querySelector('.car-paint'), sheen = car.querySelector('.car-sheen');
    var gun = doc.getElementById('gun'), cv = doc.getElementById('spray');
    var gauges = [].slice.call(car.querySelectorAll('.gauge')).map(function (g) {
      return { el: g, x: parseFloat(g.style.left) / 100, v: +g.getAttribute('data-v'), t0: null, done: false };
    });
    function finalState() {
      booth.classList.add('lit');
      paint.style.setProperty('--p', 1);
      gauges.forEach(function (g) { g.el.firstChild.textContent = g.v; g.el.classList.add('on', 'ok'); });
      sheen.classList.add('on'); sheen.style.setProperty('--sx', '120%');
      introDone = true; heroTxt.classList.add('on'); onScroll();
    }
    var skip = reduce || location.hash || window.pageYOffset > 80;
    if (skip) { finalState(); return; }

    paint.style.setProperty('--p', 0);
    var ctx = cv.getContext && cv.getContext('2d'), parts = [], dpr = Math.min(2, window.devicePixelRatio || 1), cw = 0, chh = 0;
    function sizeCv() { var r = cv.getBoundingClientRect(); cw = r.width; chh = r.height; cv.width = cw * dpr; cv.height = chh * dpr; }
    sizeCv();
    requestAnimationFrame(function () { booth.classList.add('lit'); });
    setTimeout(function () { introDone = true; heroTxt.classList.add('on'); onScroll(); }, 450);

    /* линия поверхности кузова по x (доли кадра машины): капот ниже, крыша выше */
    var surf = function (x) { return x < .42 ? .40 - x * .05 : x < .62 ? .38 - (x - .42) * .6 : .26; };
    var T_PASS = 1000, D_PASS = 2100, T_END = T_PASS + D_PASS, t0 = null;
    var ease = function (x) { return x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; };
    function frame(t) {
      if (t0 === null) t0 = t;
      var el = t - t0, k = clamp((el - T_PASS) / D_PASS, 0, 1), p = ease(k);
      var cr = car.getBoundingClientRect(), cvr = cv.getBoundingClientRect();
      /* краска и краскопульт */
      paint.style.setProperty('--p', p);
      var gx = (p * 1.06 - .02) * cr.width, gy = (surf(clamp(p, 0, 1)) - .17 + Math.sin(el / 160) * .012) * cr.height;
      var gunIn = clamp((el - T_PASS + 350) / 350, 0, 1), gunOut = clamp((el - T_END) / 450, 0, 1);
      gun.style.opacity = gunIn * (1 - gunOut);
      var gh = gun.getBoundingClientRect().height || 100;
      gun.style.transform = 'translate(' + gx + 'px,' + (gy - gh * .375 - gunOut * 60) + 'px)';
      /* туман краски из сопла вниз-влево */
      if (ctx) {
        var nx = cr.left - cvr.left + gx, ny = cr.top - cvr.top + gy;
        if (k > 0 && k < 1) for (var i = 0; i < 9; i++) {
          var ang = 2.35 + (Math.random() - .5) * .55, sp = 2.2 + Math.random() * 3.2;
          parts.push({ x: nx, y: ny, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, l: 1, r: .8 + Math.random() * 2.4, red: Math.random() < .78 });
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, cw, chh);
        for (var j = parts.length - 1; j >= 0; j--) {
          var q = parts[j];
          q.x += q.vx; q.y += q.vy; q.vx *= .965; q.vy = q.vy * .965 + .03; q.l -= .028; q.r += .07;
          if (q.l <= 0) { parts.splice(j, 1); continue; }
          ctx.fillStyle = q.red ? 'rgba(214,28,44,' + (q.l * .5) + ')' : 'rgba(255,235,238,' + (q.l * .35) + ')';
          ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, 6.283); ctx.fill();
        }
      }
      /* толщиномер: точка загорается, когда краска её прошла */
      gauges.forEach(function (g, i) {
        if (!g.el.classList.contains('on') && el > T_PASS - 200 + i * 120) g.el.classList.add('on');
        if (g.t0 === null && p * 1.12 - .06 > g.x) g.t0 = el;
        if (g.t0 !== null && !g.done) {
          var c = clamp((el - g.t0) / 700, 0, 1);
          g.el.firstChild.textContent = Math.round(g.v * (1 - Math.pow(1 - c, 3)));
          if (c >= 1) { g.done = true; g.el.classList.add('ok'); }
        }
      });
      /* блик по свежему лаку */
      if (el > T_END + 200) {
        sheen.classList.add('on');
        sheen.style.setProperty('--sx', (-40 + clamp((el - T_END - 200) / 1300, 0, 1) * 160) + '%');
      }
      if (el < T_END + 1600 || parts.length) requestAnimationFrame(frame);
      else { if (ctx) ctx.clearRect(0, 0, cw, chh); gauges.forEach(function (g) { g.el.firstChild.textContent = g.v; g.el.classList.add('ok'); }); glossFollow(); }
    }
    requestAnimationFrame(frame);
  }

  /* мобильный герой: машина в свободном месте между ценами и кнопками */
  function placeCar() {
    if (!car) return;
    if (!isMobile()) { hero.style.removeProperty('--car-top'); return; }
    var pr = hero.querySelector('.hero-pr'), cta = hero.querySelector('.hero-cta'), pl = hero.querySelector('.plate-hero');
    if (!pr || !cta) return;
    var base = pl.getBoundingClientRect().top;
    var top = pr.getBoundingClientRect().bottom - base, bot = cta.getBoundingClientRect().top - base;
    var h = car.getBoundingClientRect().height;
    /* верх кадра машины почти пустой: можно заходить под цены на 14% высоты */
    var y = Math.max(top - h * .14, bot - h * .9);
    hero.style.setProperty('--car-top', Math.round(y) + 'px');
  }

  /* блик и параллакс за курсором (только мышь) */
  var glossOn = false;
  function glossFollow() {
    if (glossOn || reduce || !window.matchMedia('(hover:hover) and (pointer:fine)').matches || !car) return;
    glossOn = true;
    var sheen = car.querySelector('.car-sheen'), pend = false, mx = 0, my = 0;
    hero.addEventListener('pointermove', function (e) {
      mx = e.clientX / window.innerWidth - .5; my = e.clientY / window.innerHeight - .5;
      if (pend) return; pend = true;
      requestAnimationFrame(function () {
        pend = false;
        hero.style.setProperty('--mx', mx.toFixed(3)); hero.style.setProperty('--my', my.toFixed(3));
        var r = car.getBoundingClientRect();
        sheen.style.setProperty('--sx', (((window.innerWidth * (mx + .5)) - r.left) / r.width * 100 - 14).toFixed(1) + '%');
      });
    });
  }
  if (reduce) {} else window.addEventListener('load', function () { setTimeout(glossFollow, 4500); });

  /* ---------- липкая панель ---------- */
  var sticky = doc.getElementById('sticky'), kont = doc.getElementById('kontakty');
  var kontVisible = false;
  if ('IntersectionObserver' in window && kont) {
    new IntersectionObserver(function (es) { kontVisible = es[0].isIntersecting; stickyBar(); if (typeof uiScroll === 'function') uiScroll(); }, { threshold: 0.15 }).observe(kont);
  }
  function stickyBar() {
    if (!sticky) return;
    var on = window.pageYOffset > H * 0.55 && !kontVisible;
    sticky.classList.toggle('is-on', on);
  }

  /* ---------- появление блоков и статичных панелей ---------- */
  var rvs = [].slice.call(doc.querySelectorAll('.rv, .rvph'));
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    rvs.forEach(function (el) { io.observe(el); });
  } else rvs.forEach(function (el) { el.classList.add('in'); });

  /* ---------- видео в плите: грузим и крутим только в кадре ---------- */
  [].forEach.call(doc.querySelectorAll('video[data-src]'), function (v) {
    if (reduce || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) {
        if (!v.src) v.src = v.getAttribute('data-src');
        var pr = v.play(); if (pr && pr.catch) pr.catch(function () {});
      } else if (v.src) v.pause();
    }, { threshold: 0.3 }).observe(v);
  });

  /* ---------- до / после ---------- */
  var cmp = doc.getElementById('cmp');
  if (cmp) {
    var range = cmp.querySelector('.cmp-range');
    var setX = function () { cmp.style.setProperty('--x', range.value + '%'); };
    range.addEventListener('input', setX);
    setX();
    var imB = cmp.querySelector('.cmp-before img'), imA = cmp.querySelector('.cmp-after img');
    var cases = [].slice.call(doc.querySelectorAll('.cmp-case'));
    cases.forEach(function (btn) {
      btn.addEventListener('click', function () {
        cases.forEach(function (b) { var on = b === btn; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
        imB.src = btn.dataset.before; imB.alt = btn.dataset.altBefore;
        imA.src = btn.dataset.after; imA.alt = btn.dataset.altAfter;
        imB.width = imA.width = btn.dataset.w; imB.height = imA.height = btn.dataset.h;
        imB.style.objectPosition = btn.dataset.pb || ''; imA.style.objectPosition = btn.dataset.pa || '';
        range.value = 50; setX();
      });
    });
    // один раз показать, что линию можно тянуть
    var touched = false;
    range.addEventListener('pointerdown', function () { touched = true; });
    if (!reduce && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) {
        if (!en[0].isIntersecting) return;
        io.disconnect();
        var keys = [50, 22, 78, 50], D = 1800, t0 = null;
        var ease = function (x) { return x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; };
        (function step(t) {
          if (touched) return;
          if (t0 === null) t0 = t;
          var p = clamp((t - t0) / D, 0, 1) * 3, i = Math.min(2, Math.floor(p));
          range.value = keys[i] + (keys[i + 1] - keys[i]) * ease(p - i); setX();
          if (p < 3) requestAnimationFrame(step);
        })(performance.now());
      }, { threshold: .6 });
      setTimeout(function () { io.observe(cmp); }, 400);
    }
  }

  /* ---------- лента отзывов: стрелки, шаг одна карточка ---------- */
  var track = doc.getElementById('rev-track'), prevB = doc.getElementById('rev-prev'), nextB = doc.getElementById('rev-next');
  function ribbonBtns() {
    if (!track) return;
    var max = track.scrollWidth - track.clientWidth;
    var none = max <= 1;
    prevB.hidden = nextB.hidden = none;
    if (none) return;
    prevB.disabled = track.scrollLeft <= 1;
    nextB.disabled = track.scrollLeft >= max - 1;
  }
  function ribbonStep(dir) {
    var card = track.querySelector('.rev');
    if (!card) return;
    var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 16;
    track.scrollBy({ left: dir * (card.getBoundingClientRect().width + gap), behavior: reduce ? 'auto' : 'smooth' });
  }
  if (track) {
    prevB.addEventListener('click', function () { ribbonStep(-1); });
    nextB.addEventListener('click', function () { ribbonStep(1); });
    track.addEventListener('scroll', ribbonBtns, { passive: true });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { ribbonStep(1); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { ribbonStep(-1); e.preventDefault(); }
    });
  }

  /* ---------- конверсии Google Ads (теги подключаются при деплое) ---------- */
  function fireConv(key) {
    if (typeof window.gtag_report_conversion !== 'function' || !window.AW_CONV) return;
    var sendTo = window.AW_CONV[key];
    if (sendTo) window.gtag_report_conversion(undefined, sendTo);
  }
  doc.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href^="tel:"], a[href*="wa.me"]') : null;
    if (!a) return;
    fireConv(a.getAttribute('href').indexOf('tel:') === 0 ? 'phone' : 'contact');
  });

  /* ---------- форма -> WhatsApp ---------- */
  var form = doc.getElementById('form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.website.value) return;
      var name = form.name.value.trim(), phone = form.phone.value.trim();
      var err = doc.getElementById('form-err'), ok = doc.getElementById('form-ok');
      var bad = false;
      [form.name, form.phone].forEach(function (f) {
        var good = f === form.phone ? phone.replace(/\D/g, '').length >= 10 : name.length > 1;
        f.closest('.fld').classList.toggle('is-bad', !good);
        if (!good) bad = true;
      });
      err.hidden = !bad;
      if (bad) { (name.length > 1 ? form.phone : form.name).focus(); return; }
      var d = I18N[root.lang] || {};
      var t = function (k, ru) { return d[k] || ru; };
      var sel = form.service, service = sel.selectedIndex > 0 ? sel.options[sel.selectedIndex].textContent.trim() : '';
      var lines = [t('fm.hello', 'Здравствуйте! Хочу оценить ремонт.'), t('fm.name', 'Имя') + ': ' + name, t('fm.phone', 'Телефон') + ': ' + phone];
      if (service) lines.push(t('fm.service', 'Услуга') + ': ' + service);
      var msg = form.message.value.trim();
      if (msg) lines.push(t('fm.msg', 'Машина') + ': ' + msg);
      var num = (sel.selectedIndex > 0 && sel.options[sel.selectedIndex].getAttribute('data-num')) || WA_NUM;
      var url = 'https://wa.me/' + num + '?text=' + encodeURIComponent(lines.join('\n'));
      fireConv('form');
      window.open(url, '_blank', 'noopener');
      ok.hidden = false;
      form.querySelector('button[type="submit"]').blur();
    });
    form.phone.addEventListener('input', function () { form.phone.closest('.fld').classList.remove('is-bad'); });
    form.name.addEventListener('input', function () { form.name.closest('.fld').classList.remove('is-bad'); });
  }

  /* ---------- UI: прогресс чтения, текущий раздел в меню, кнопка «наверх» ---------- */
  var prog = doc.getElementById('prog'), totop = doc.getElementById('totop');
  var spyLinks = [].slice.call(doc.querySelectorAll('.nav a[href^="#"], .menu-nav a[href^="#"]'));
  var spyIds = [], spyCur = null, progLast = -1;
  spyLinks.forEach(function (a) { var id = a.getAttribute('href').slice(1); if (spyIds.indexOf(id) < 0 && doc.getElementById(id)) spyIds.push(id); });
  function uiScroll() {
    var y = window.pageYOffset, max = root.scrollHeight - H;
    var k = max > 0 ? Math.round(clamp(y / max, 0, 1) * 1000) / 1000 : 0;
    if (prog && k !== progLast) { progLast = k; hdr.style.setProperty('--prog', k); }
    var probe = hdr.offsetHeight + H * 0.3, cur = null;
    spyIds.forEach(function (id) {
      var r = doc.getElementById(id).getBoundingClientRect();
      if (r.top <= probe && r.bottom > probe) cur = id;
    });
    if (cur !== spyCur) {
      spyCur = cur;
      spyLinks.forEach(function (a) {
        var on = a.getAttribute('href') === '#' + cur;
        a.classList.toggle('is-cur', on);
        if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
    }
    if (totop) totop.classList.toggle('is-on', y > H * 1.5 && !kontVisible);
  }
  if (totop) totop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    history.pushState(null, '', location.pathname + location.search);
  });

  /* ---------- UI: сейчас открыто / закрыто (время Алматы, UTC+5) ---------- */
  var kNow = doc.getElementById('k-now');
  var NOW_RU = { 'ui.open': 'Сейчас открыто · до 22:00', 'ui.closed': 'Откроемся в 9:00 · машину примем круглосуточно' };
  Object.keys(NOW_RU).forEach(function (k) { I18N.ru[k] = NOW_RU[k]; });
  function nowStatus() {
    if (!kNow) return;
    var d = new Date(), h = (d.getUTCHours() + 5) % 24;
    var open = h >= 9 && h < 22, key = open ? 'ui.open' : 'ui.closed';
    var dict = I18N[root.lang] || I18N.ru;
    kNow.lastChild.textContent = dict[key] || I18N.ru[key];
    kNow.classList.toggle('is-off', !open);
    kNow.hidden = false;
  }
  nowStatus();
  setInterval(nowStatus, 60000);

  /* ---------- UI: фото работ на весь экран ---------- */
  var lb = doc.getElementById('lb');
  if (lb) {
    var lbImg = lb.querySelector('.lb-img'), lbCap = lb.querySelector('.lb-cap'), lbCnt = lb.querySelector('.lb-cnt');
    var lbPrev = lb.querySelector('.lb-prev'), lbNext = lb.querySelector('.lb-next'), lbX = lb.querySelector('.lb-x');
    var lbSet = [], lbI = 0, lbBack = null;
    var groups = [].slice.call(doc.querySelectorAll('.ph-seq, .ph-grid, .ph-trio, .ph-six'));
    groups.forEach(function (g) {
      var imgs = [].slice.call(g.querySelectorAll('img'));
      imgs.forEach(function (img, i) {
        img.classList.add('zoomable');
        img.setAttribute('tabindex', '0');
        img.setAttribute('role', 'button');
        var open = function () { lbOpen(imgs, i, img); };
        img.addEventListener('click', open);
        img.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
      });
    });
    function capOf(img) {
      var fc = img.closest('figure') && img.closest('figure').querySelector('figcaption');
      return fc ? fc.textContent.trim() : img.alt;
    }
    function lbShow(i, anim) {
      lbI = (i + lbSet.length) % lbSet.length;
      var src = lbSet[lbI];
      var put = function () {
        lbImg.src = src.currentSrc || src.src; lbImg.alt = src.alt;
        lbCap.textContent = capOf(src);
        lbCnt.textContent = lbSet.length > 1 ? (lbI + 1) + ' / ' + lbSet.length : '';
        lbImg.classList.remove('is-swap');
      };
      if (anim && !reduce) { lbImg.classList.add('is-swap'); setTimeout(put, 150); } else put();
      lbPrev.hidden = lbNext.hidden = lbSet.length < 2;
    }
    function lbOpen(set, i, from) {
      lbSet = set; lbBack = from;
      lbShow(i, false);
      lb.hidden = false;
      body.classList.add('lb-open');
      requestAnimationFrame(function () { lb.classList.add('is-open'); lbX.focus(); });
    }
    function lbClose() {
      lb.classList.remove('is-open');
      body.classList.remove('lb-open');
      setTimeout(function () { lb.hidden = true; lbImg.removeAttribute('src'); }, reduce ? 0 : 220);
      if (lbBack) lbBack.focus({ preventScroll: true });
    }
    lbX.addEventListener('click', lbClose);
    lbPrev.addEventListener('click', function () { lbShow(lbI - 1, true); });
    lbNext.addEventListener('click', function () { lbShow(lbI + 1, true); });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('lb-fig')) lbClose(); });
    doc.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') lbClose();
      else if (e.key === 'ArrowRight' && lbSet.length > 1) lbShow(lbI + 1, true);
      else if (e.key === 'ArrowLeft' && lbSet.length > 1) lbShow(lbI - 1, true);
      else if (e.key === 'Tab') {
        var f = [lbX, lbPrev, lbNext].filter(function (b) { return !b.hidden; });
        var at = f.indexOf(doc.activeElement);
        e.preventDefault();
        f[(at + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      }
    });
    var sx = null, sy = 0;
    lbImg.addEventListener('pointerdown', function (e) { sx = e.clientX; sy = e.clientY; });
    lbImg.addEventListener('pointerup', function (e) {
      if (sx === null) return;
      var dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) && lbSet.length > 1) lbShow(lbI + (dx < 0 ? 1 : -1), true);
    });
  }

  /* ---------- UI: маска телефона +7 777 123 45 67 ---------- */
  var tel = doc.getElementById('f-phone');
  if (tel) {
    tel.addEventListener('input', function () {
      var atEnd = tel.selectionStart === tel.value.length;
      var d = tel.value.replace(/\D/g, '');
      if (!d) { tel.value = ''; tel.closest('.fld').classList.remove('is-ok'); return; }
      if (d[0] === '8') d = '7' + d.slice(1);
      if (d[0] !== '7') d = '7' + d;
      d = d.slice(0, 11);
      var out = '+7';
      if (d.length > 1) out += ' ' + d.slice(1, 4);
      if (d.length > 4) out += ' ' + d.slice(4, 7);
      if (d.length > 7) out += ' ' + d.slice(7, 9);
      if (d.length > 9) out += ' ' + d.slice(9, 11);
      if (atEnd) tel.value = out;
      tel.closest('.fld').classList.toggle('is-ok', d.length === 11);
    });
  }

  /* ---------- старт ---------- */
  var lastW = window.innerWidth;
  window.addEventListener('resize', function () {
    if (window.innerWidth >= 1024 && body.classList.contains('menu-open')) openMenu(false);
    if (window.innerWidth === lastW) { onScroll(); return; }
    lastW = window.innerWidth;
    fitText(); ribbonBtns(); placeCar(); onScroll();
  });
  function start() {
    fitText(); ribbonBtns(); placeCar();
    if (location.hash) {
      var id = decodeURIComponent(location.hash.slice(1));
      goTo(id, true);
      setTimeout(function () { goTo(id, true); plates(); }, 400);
    }
    runIntro();
    plates();
  }
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(start); else start();
  window.addEventListener('load', function () { fitText(); ribbonBtns(); onScroll(); });
})();
