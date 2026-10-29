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
   
    ribbonBtns();
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
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(plates); } }
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- интро героя: панели кузова встают в зазоры, точки уходят в ноль ---------- */
  var introDone = false;
  function runIntro() {
    var heroTxt = hero.querySelector('.hero-txt');
    var skip = reduce || location.hash || window.pageYOffset > 80 || !heroPh;
    if (skip) {
      if (heroPh) setG(heroPh, 0);
      introDone = true; heroTxt.classList.add('on'); onScroll(); return;
    }
    var t0 = null, HOLD = 320, D = 1150;
    setG(heroPh, 1);
    setTimeout(function () { heroTxt.classList.add('on'); }, 520);
    function frame(t) {
      if (t0 === null) t0 = t;
      var k = clamp((t - t0 - HOLD) / D, 0, 1);
      setG(heroPh, 1 - easeOutBack(k));
      if (k < 1) requestAnimationFrame(frame);
      else { setG(heroPh, 0); introDone = true; onScroll(); }
    }
    requestAnimationFrame(frame);
  }

  /* ---------- липкая панель ---------- */
  var sticky = doc.getElementById('sticky'), kont = doc.getElementById('kontakty');
  var kontVisible = false;
  if ('IntersectionObserver' in window && kont) {
    new IntersectionObserver(function (es) { kontVisible = es[0].isIntersecting; stickyBar(); }, { threshold: 0.15 }).observe(kont);
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

  /* ---------- старт ---------- */
  var lastW = window.innerWidth;
  window.addEventListener('resize', function () {
    if (window.innerWidth === lastW) { onScroll(); return; }
    lastW = window.innerWidth;
    fitText(); ribbonBtns(); onScroll();
  });
  function start() {
    fitText(); ribbonBtns();
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
