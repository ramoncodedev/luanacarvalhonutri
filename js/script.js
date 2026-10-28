/* =========================================================
   Luana Carvalho — Nutricionista | interações
   Animações inspiradas em micheleanadao.com.br
   ========================================================= */
(function () {
  'use strict';

  /* Número de WhatsApp do formulário (55 + DDD + número) */
  var WHATSAPP = '5571999999999';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(Math.max(v, a), b); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* =======================================================
     1. Quebra de texto: palavras (.split) e preenchimento (data-fill)
     ======================================================= */
  function walkText(el, fn) {
    Array.prototype.slice.call(el.childNodes).forEach(function (n) {
      if (n.nodeType === 3) fn(n);
      else if (n.nodeType === 1 && n.tagName !== 'BR') walkText(n, fn);
    });
  }

  function splitWords(el) {
    var i = 0;
    walkText(el, function (n) {
      var frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
        var inner = document.createElement('span');
        inner.className = 'w__i';
        inner.textContent = part;
        inner.style.setProperty('--i', i++);
        var w = document.createElement('span');
        w.className = 'w';
        w.appendChild(inner);
        frag.appendChild(w);
      });
      n.replaceWith(frag);
    });
  }

  function splitFill(el) {
    walkText(el, function (n) {
      var frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
        var s = document.createElement('span');
        s.className = 'fw';
        s.textContent = part;
        frag.appendChild(s);
      });
      n.replaceWith(frag);
    });
  }

  $$('.split').forEach(splitWords);
  var fills = $$('[data-fill]').map(function (el) {
    splitFill(el);
    return { el: el, words: $$('.fw', el) };
  });
  if (reduced) document.body.classList.add('no-fill');

  /* =======================================================
     2. Reveal ao entrar na tela
     ======================================================= */
  $$('[data-d]').forEach(function (el) {
    el.style.setProperty('--d', (parseFloat(el.getAttribute('data-d')) * 0.09) + 's');
  });
  var revealEls = $$('.reveal, .split, .img-reveal, .tl__item, [data-footer-word]');

  /* Palavra gigante do rodapé: letras sobem em sequência */
  var word = $('[data-footer-word]');
  if (word) {
    var text = word.textContent;
    word.textContent = '';
    text.split('').forEach(function (c, k) {
      var s = document.createElement('span');
      s.className = 'ch';
      s.style.setProperty('--i', k);
      s.textContent = c === ' ' ? ' ' : c;
      word.appendChild(s);
    });
    var fitWord = function () {
      word.style.fontSize = '';
      var stage = word.parentElement;
      var cs = getComputedStyle(stage);
      var avail = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      var r = document.createRange();
      r.selectNodeContents(word);
      var w = r.getBoundingClientRect().width;
      if (w) word.style.fontSize = (parseFloat(getComputedStyle(word).fontSize) * avail / w) + 'px';
    };
    fitWord();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitWord);
    window.addEventListener('resize', fitWord);
  }

  if (!hasIO || reduced) {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* =======================================================
     3. Menu (overlay) + ESC
     ======================================================= */
  var menuBtn = $('#menuBtn');
  var menu = $('#menu');
  function setMenu(open) {
    document.body.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-hidden', String(!open));
  }
  menuBtn.addEventListener('click', function () { setMenu(!document.body.classList.contains('menu-open')); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  window.addEventListener('resize', function () { if (window.innerWidth > 1080) setMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.body.classList.contains('menu-open')) setMenu(false);
  });

  /* =======================================================
     4. Rolagem suave (inércia) — só mouse, sem "reduzir movimento"
     ======================================================= */
  var smooth = null;
  if (!reduced && finePointer) {
    document.documentElement.classList.add('is-lerp');
    var target = window.scrollY, current = window.scrollY, raf = 0, t0 = 0;
    var maxY = function () { return document.documentElement.scrollHeight - window.innerHeight; };
    var step = function (t) {
      var dt = Math.min(t - (t0 || t), 50) || 16.7;
      t0 = t;
      current += (target - current) * (1 - Math.pow(1 - 0.085, dt / 16.7));
      if (Math.abs(target - current) < 0.4) { current = target; raf = 0; t0 = 0; }
      else raf = requestAnimationFrame(step);
      window.scrollTo({ top: current, behavior: 'instant' });
    };
    smooth = function (y) {
      if (!raf) { current = window.scrollY; }
      target = clamp(y, 0, maxY());
      if (!raf) raf = requestAnimationFrame(step);
    };
    window.addEventListener('wheel', function (e) {
      if (e.ctrlKey || document.body.classList.contains('menu-open')) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();
      var d = e.deltaMode === 1 ? e.deltaY * 40 : e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY;
      if (!raf) { current = window.scrollY; target = window.scrollY; }
      smooth(target + d);
    }, { passive: false });
  }

  /* links âncora */
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      var y = el.getBoundingClientRect().top + window.scrollY - (id === '#inicio' ? 0 : 0);
      if (smooth) smooth(y);
      else window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
    });
  });

  /* =======================================================
     5. Carrosséis automáticos (sinais + depoimentos)
     ======================================================= */
  function carousel(root, slideSel, dur, onChange) {
    var slides = $$(slideSel, root);
    if (!slides.length) return;
    var bar = $('[data-bar]', root);
    var segsBox = $('[data-segs]', root), segs = [];
    if (segsBox) {
      slides.forEach(function () { var s = document.createElement('span'); s.className = 'seg'; s.appendChild(document.createElement('i')); segsBox.appendChild(s); segs.push(s); });
    }
    var now = $('[data-now]', root);
    var total = $('[data-total]', root);
    var index = 0, hover = false, inView = false;
    var pad = function (n) { return String(n).padStart(2, '0'); };
    if (total) total.textContent = pad(slides.length);
    root.style.setProperty('--dur', dur + 's');

    function restartBar() {
      root.classList.remove('is-running');
      void root.offsetWidth;
      if (!reduced) root.classList.add('is-running');
    }
    function go(n) {
      index = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle('is-active', k === index); });
      if (now) now.textContent = pad(index + 1);
      segs.forEach(function (s, k) { s.classList.toggle('is-done', k < index); s.classList.toggle('is-current', k === index); });
      if (onChange) onChange(slides[index]);
      restartBar();
    }
    function sync() {
      root.classList.toggle('is-paused', !inView || hover);
    }
    $('[data-prev]', root).addEventListener('click', function () { go(index - 1); });
    $('[data-next]', root).addEventListener('click', function () { go(index + 1); });
    root.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { hover = true; sync(); } });
    root.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { hover = false; sync(); } });
    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') go(index + 1);
      if (e.key === 'ArrowLeft') go(index - 1);
    });
    if (bar) bar.addEventListener('animationend', function () { go(index + 1); });
    if (segsBox) segsBox.addEventListener('animationend', function () { go(index + 1); });

    /* arrastar no toque */
    var x0 = null;
    root.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    root.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 45) go(index + (dx < 0 ? 1 : -1));
      x0 = null;
    });

    if (hasIO) {
      new IntersectionObserver(function (en) { inView = en[0].isIntersecting; sync(); }, { threshold: 0.3 }).observe(root);
    } else { inView = true; }
    sync();
    go(0);
  }
  $$('[data-carousel="signs"]').forEach(function (r) { carousel(r, '.sign', 6); });
  $$('[data-carousel="voices"]').forEach(function (r) { var meta = $('.voices__meta', r);
    carousel(r, '.voice', 8, function (s) { var f = $('footer', s); if (meta && f) meta.innerHTML = f.innerHTML; });
  });

  /* =======================================================
     6. Áreas de atuação: carrossel por páginas (setas + contador)
     ======================================================= */
  var areas = $('[data-areas]');
  if (areas) {
    var vp = $('[data-areas-viewport]', areas);
    var list = $('[data-areas-list]', areas);
    var cards = $$('.area', list);
    var prevA = $('[data-areas-prev]', areas), nextA = $('[data-areas-next]', areas);
    var nowA = $('[data-areas-now]', areas), totA = $('[data-areas-total]', areas);
    var pad2 = function (n) { return String(n).padStart(2, '0'); };
    var geom = function () {
      var gap = parseFloat(getComputedStyle(list).columnGap) || 0;
      var stepW = cards[0].getBoundingClientRect().width + gap;
      var per = Math.max(1, Math.round((vp.clientWidth + gap) / stepW));
      return { step: stepW, per: per, pages: Math.ceil(cards.length / per) };
    };
    var pageNow = function () { var g = geom(); return clamp(Math.round(vp.scrollLeft / (g.step * g.per)), 0, g.pages - 1); };
    var updateA = function () {
      var g = geom(), p = pageNow();
      nowA.textContent = pad2(p + 1);
      totA.textContent = pad2(g.pages);
      prevA.disabled = p <= 0;
      nextA.disabled = p >= g.pages - 1;
    };
    var goA = function (d) {
      var g = geom(), p = clamp(pageNow() + d, 0, g.pages - 1);
      vp.scrollTo({ left: p * g.step * g.per, behavior: reduced ? 'auto' : 'smooth' });
    };
    prevA.addEventListener('click', function () { goA(-1); });
    nextA.addEventListener('click', function () { goA(1); });
    vp.addEventListener('scroll', updateA, { passive: true });
    window.addEventListener('resize', updateA);
    window.addEventListener('load', updateA);
    updateA();
  }

  /* =======================================================
     7. Scroll: header, parallax, preenchimento de texto, timeline
     ======================================================= */
  var header = $('#header');
  var wpp = $('.wpp');
  var parallax = $$('[data-parallax] img');
  var tl = $('[data-timeline]');
  var tlFill = $('[data-timeline-fill]');
  var tlItems = tl ? $$('.tl__item', tl) : [];
  var lastY = window.scrollY;
  var queued = false;

  function render() {
    queued = false;
    var y = window.scrollY, vh = window.innerHeight;
    var menuOpen = document.body.classList.contains('menu-open');
    header.classList.toggle('is-scrolled', y > 24);
    if (!menuOpen) header.classList.toggle('is-hidden', y > lastY && y > 500);
    wpp.classList.toggle('is-visible', y > 700);
    lastY = y;
    if (reduced) {
      if (tlFill) tlFill.parentElement.style.setProperty('--p', 1);
      tlItems.forEach(function (it) { it.classList.add('is-reached'); });
      return;
    }

    /* parallax das fotos */
    parallax.forEach(function (img) {
      var r = img.parentElement.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      var p = (r.top + r.height / 2 - vh / 2) / vh;
      img.style.translate = '0 ' + (p * -6).toFixed(2) + '%';
    });

    /* texto que se preenche palavra por palavra */
    fills.forEach(function (f) {
      var r = f.el.getBoundingClientRect();
      var p = clamp((vh * 0.88 - r.top) / (vh * 0.55 + r.height * 0.5), 0, 1);
      var n = Math.round(p * f.words.length);
      f.words.forEach(function (w, k) { w.classList.toggle('on', k < n); });
    });

    /* timeline */
    if (tl) {
      var tr = tl.getBoundingClientRect();
      var tp = clamp((vh * 0.6 - tr.top) / tr.height, 0, 1);
      tl.style.setProperty('--p', tp.toFixed(3));
      tlItems.forEach(function (it) {
        var r = it.getBoundingClientRect();
        var mid = window.innerWidth <= 720 ? r.top + 20 : r.top + r.height / 2;
        it.classList.toggle('is-reached', mid < vh * 0.6);
      });
    }
  }
  function queue() { if (!queued) { queued = true; requestAnimationFrame(render); } }
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  window.addEventListener('load', queue);
  render();

  /* link ativo do menu (sublinhado) */
  var spyLinks = $$('.header__nav a[href^="#"]');
  var spySecs = spyLinks.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  function spy() {
    var pos = window.scrollY + window.innerHeight * 0.35, cur = -1;
    spySecs.forEach(function (s, k) { if (s && s.offsetTop <= pos) cur = k; });
    if (cur < 0) cur = 0;
    spyLinks.forEach(function (a, k) { a.classList.toggle('is-active', k === cur); });
  }
  window.addEventListener('scroll', spy, { passive: true });
  spy();

  /* =======================================================
     8. Contadores
     ======================================================= */
  function animateCount(el) {
    var tg = parseInt(el.dataset.target, 10), suf = el.dataset.suffix || '';
    if (reduced) { el.textContent = tg + suf; return; }
    var start = null, dur = 1600;
    (function tick(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(tg * e) + suf;
      if (p < 1) requestAnimationFrame(tick);
    })(performance.now());
  }
  var counters = $$('.count');
  if (hasIO) {
    var cio = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { animateCount(e.target); cio.unobserve(e.target); } });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  } else counters.forEach(animateCount);

  /* =======================================================
     9. Faixa do Instagram (duplica para o loop infinito)
     ======================================================= */
  var instaTrack = $('[data-insta] .insta__track');
  if (instaTrack) {
    if (reduced) instaTrack.parentElement.classList.add('is-static');
    else {
      Array.prototype.slice.call(instaTrack.children).forEach(function (li) {
        var c = li.cloneNode(true);
        c.setAttribute('aria-hidden', 'true');
        var a = c.querySelector('a'); if (a) a.tabIndex = -1;
        instaTrack.appendChild(c);
      });
    }
  }

  /* =======================================================
     10. FAQ (um aberto por vez)
     ======================================================= */
  var qas = $$('.qa');
  qas.forEach(function (qa) {
    $('.qa__q', qa).addEventListener('click', function () {
      var open = !qa.classList.contains('is-open');
      qas.forEach(function (o) {
        o.classList.remove('is-open');
        $('.qa__q', o).setAttribute('aria-expanded', 'false');
      });
      if (open) { qa.classList.add('is-open'); $('.qa__q', qa).setAttribute('aria-expanded', 'true'); }
    });
  });

  /* =======================================================
     11. CTA "líquido": distorção que segue o mouse
     ======================================================= */
  var cta = $('[data-cta]');
  var liquid = $('[data-cta-liquid]');
  var isSafari = /^((?!chrome|chromium|android|crios|fxios|edg).)*safari/i.test(navigator.userAgent);
  if (cta && liquid && !reduced && finePointer && !isSafari) {
    var noise = $('[data-liquid-noise]'), map = $('[data-liquid-map]');
    var on = false, lraf = 0, scale = 0, rad = 0, tx = 0, ty = 0, x = 0, y = 0;
    var loop = function (t) {
      scale += ((on ? 60 : 0) - scale) * 0.08;
      rad += ((on ? 280 : 0) - rad) * 0.1;
      x += (tx - x) * 0.18; y += (ty - y) * 0.18;
      var f = 0.009 + Math.sin(t / 900) * 0.0025;
      noise.setAttribute('baseFrequency', f.toFixed(4) + ' ' + (f * 1.5).toFixed(4));
      map.setAttribute('scale', scale.toFixed(1));
      liquid.style.setProperty('--r', rad.toFixed(0) + 'px');
      liquid.style.setProperty('--mx', x.toFixed(0) + 'px');
      liquid.style.setProperty('--my', y.toFixed(0) + 'px');
      if (!on && rad < 1 && scale < 0.5) { cta.classList.remove('is-liquid'); lraf = 0; return; }
      lraf = requestAnimationFrame(loop);
    };
    cta.addEventListener('pointermove', function (e) {
      var r = cta.getBoundingClientRect();
      tx = e.clientX - r.left; ty = e.clientY - r.top;
      if (!on) { x = tx; y = ty; on = true; cta.classList.add('is-liquid'); if (!lraf) lraf = requestAnimationFrame(loop); }
    });
    cta.addEventListener('pointerleave', function () { on = false; if (!lraf) lraf = requestAnimationFrame(loop); });
  }

  /* =======================================================
     12. Formulário → WhatsApp
     ======================================================= */
  var form = $('#form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      ['nome', 'tel', 'objetivo', 'formato'].forEach(function (id) {
        var el = document.getElementById(id);
        var empty = !el.value.trim();
        el.closest('.field').classList.toggle('is-error', empty);
        if (empty && ok) { el.focus(); ok = false; }
      });
      if (!ok) return;
      var texto =
        'Olá, Luana! Meu nome é ' + $('#nome').value.trim() + '.\n' +
        'Objetivo: ' + $('#objetivo').value + '\n' +
        'Formato: ' + $('#formato').value + '\n' +
        'WhatsApp: ' + $('#tel').value.trim();
      var extra = $('#msg').value.trim();
      if (extra) texto += '\n\n' + extra;
      texto += '\n\nGostaria de agendar uma consulta.';
      window.open('https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(texto), '_blank');
    });
    var clearErr = function (e) { var w = e.target.closest('.field'); if (w) w.classList.remove('is-error'); };
    form.addEventListener('input', clearErr);
    form.addEventListener('change', clearErr);
  }

  /* =======================================================
     13. Ano do rodapé
     ======================================================= */
  $('#ano').textContent = new Date().getFullYear();
})();
