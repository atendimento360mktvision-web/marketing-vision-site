(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* Entrada ao rolar, com atraso escalonado entre irmãos */
  var groups = new Map();
  $$('.rv').forEach(function (el) {
    var p = el.parentElement, i = groups.get(p) || 0;
    el.style.setProperty('--d', Math.min(i * 0.09, 0.45) + 's');
    groups.set(p, i + 1);
  });
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    $$('.rv').forEach(function (el) { io.observe(el); });
  } else {
    $$('.rv').forEach(function (el) { el.classList.add('in'); });
  }

  /* Menu do celular */
  var burger = $('#burger'), menu = $('#menu');
  function closeMenu() { menu.hidden = true; burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Abrir menu'); document.body.style.overflow = ''; }
  burger.addEventListener('click', function () {
    var open = menu.hidden;
    menu.hidden = !open;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    document.body.style.overflow = open ? 'hidden' : '';
  });
  menu.addEventListener('click', function (e) { if (e.target === menu || e.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) closeMenu(); });

  /* Nav some ao descer e volta ao subir */
  var lastY = 0, nav = $('#nav');
  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    nav.style.transform = (y > 300 && y > lastY + 4) ? 'translateY(-140%)' : (y < lastY - 4 || y < 300 ? '' : nav.style.transform);
    lastY = y;
  }, { passive: true });

  /* Espia só: período 3, 6 ou 12 meses */
  var brl = function (v) { return 'R$ ' + v.toFixed(2).replace('.', ','); };
  $$('.period button').forEach(function (b) {
    b.addEventListener('click', function () {
      var m = +b.dataset.m;
      $$('.period button').forEach(function (x) { var on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on)); });
      $$('.total').forEach(function (t) {
        var p = parseFloat(t.dataset.price);
        t.innerHTML = 'Total em ' + m + ' meses: <b>' + brl(Math.round(p * m * 100) / 100) + '</b>';
      });
    });
  });

  /* Acordeão dos serviços */
  $$('.acc-h').forEach(function (h) {
    h.addEventListener('click', function () {
      var it = h.parentElement, open = !it.classList.contains('open');
      $$('.acc-it').forEach(function (x) { x.classList.remove('open'); $('.acc-h', x).setAttribute('aria-expanded', 'false'); });
      if (open) { it.classList.add('open'); h.setAttribute('aria-expanded', 'true'); }
    });
  });

  /* Deck de projetos em leque */
  var deck = $('#deck'), cards = $$('.card', deck), dots = $('#dots'), cur = 0, n = cards.length;
  cards.forEach(function (c, i) {
    var d = document.createElement('button');
    d.type = 'button'; d.setAttribute('role', 'tab'); d.setAttribute('aria-label', 'Projeto ' + (i + 1));
    d.addEventListener('click', function () { go(i); });
    dots.appendChild(d);
  });
  function layout() {
    var mobile = window.innerWidth < 900;
    cards.forEach(function (c, i) {
      var k = (i - cur + n) % n;
      var visible = k < 3;
      var y = mobile ? k * 14 : k * 22, s = 1 - k * 0.045;
      c.style.transform = k === 0 ? 'none' : 'translateY(' + y + 'px) scale(' + s + ')';
      c.style.opacity = visible ? (k === 0 ? 1 : 0.55 - k * 0.12) : 0;
      c.style.filter = k === 0 ? 'none' : 'blur(' + (k * 1.5) + 'px)';
      c.style.zIndex = String(n - k);
      c.style.pointerEvents = k === 0 ? 'auto' : 'none';
      c.setAttribute('aria-hidden', k === 0 ? 'false' : 'true');
      $$('a', c).forEach(function (a) { a.tabIndex = k === 0 ? 0 : -1; });
    });
    $$('button', dots).forEach(function (d, i) { d.setAttribute('aria-selected', String(i === cur)); });
  }
  function go(i) { cur = (i + n) % n; layout(); }
  $('#dPrev').addEventListener('click', function () { go(cur - 1); });
  $('#dNext').addEventListener('click', function () { go(cur + 1); });
  var sx = null;
  deck.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
  deck.addEventListener('touchend', function (e) {
    if (sx === null) return;
    var dx = e.changedTouches[0].clientX - sx; sx = null;
    if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1));
  });
  window.addEventListener('resize', layout);
  layout();

  /* Título que se escreve letra a letra */
  var tw = $('.tw');
  if (tw && !reduce && 'IntersectionObserver' in window) {
    var txt = tw.dataset.tw; tw.setAttribute('aria-label', txt); tw.textContent = '';
    var spans = txt.split('').map(function (ch) { var s = document.createElement('span'); s.className = 'ch'; s.setAttribute('aria-hidden', 'true'); s.textContent = ch; tw.appendChild(s); return s; });
    var io2 = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return; io2.disconnect();
      spans.forEach(function (s, i) { setTimeout(function () { s.classList.add('on'); }, i * 24); });
    }, { threshold: 0.4 });
    io2.observe(tw);
  }

  /* Botões que já marcam o interesse no formulário */
  $$('[data-interesse]').forEach(function (a) {
    a.addEventListener('click', function () {
      var v = a.dataset.interesse;
      $$('#interesses input').forEach(function (i) { if (i.value === v) i.checked = true; });
    });
  });

  /* Formulário de reunião com validação na hora */
  var form = $('#form'), msg = $('#formMsg'), send = $('#send'), t0 = Date.now();
  var rules = {
    nome: function (v) { return v.trim().length >= 2; },
    whatsapp: function (v) { var d = v.replace(/\D/g, ''); return d.length >= 10 && d.length <= 13; },
    email: function (v) { return !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); },
    empresa: function () { return true; }
  };
  function check(inp, force) {
    var f = inp.closest('.fld'), ok = rules[inp.name](inp.value), filled = inp.value.trim() !== '';
    if (!force && !inp.dataset.touched) return ok;
    f.classList.toggle('ok', ok && filled);
    f.classList.toggle('bad', !ok);
    inp.setAttribute('aria-invalid', String(!ok));
    return ok;
  }
  Object.keys(rules).forEach(function (k) {
    var inp = form.elements[k];
    inp.addEventListener('blur', function () { inp.dataset.touched = '1'; check(inp); });
    inp.addEventListener('input', function () { if (inp.dataset.touched) check(inp); });
  });
  var wa = form.elements.whatsapp;
  wa.addEventListener('input', function () {
    var d = wa.value.replace(/\D/g, '').slice(0, 11);
    if (d.length > 6) wa.value = '(' + d.slice(0, 2) + ') ' + d.slice(2, d.length - 4) + '-' + d.slice(-4);
    else if (d.length > 2) wa.value = '(' + d.slice(0, 2) + ') ' + d.slice(2);
    else wa.value = d;
  });
  var fsInt = $('#interesses').closest('.fs');
  $$('#interesses input').forEach(function (i) { i.addEventListener('change', function () { fsInt.classList.remove('bad'); }); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    msg.textContent = '';
    var ok = true;
    Object.keys(rules).forEach(function (k) { var inp = form.elements[k]; inp.dataset.touched = '1'; if (!check(inp, true)) ok = false; });
    var ints = $$('#interesses input:checked').map(function (i) { return i.value; });
    if (!ints.length) { fsInt.classList.add('bad'); ok = false; }
    if (!ok) { msg.textContent = 'Confira os campos marcados para continuar.'; var b = $('.bad input', form) || $('#interesses input'); if (b) b.focus(); return; }
    var data = {
      nome: form.elements.nome.value.trim(),
      empresa: form.elements.empresa.value.trim(),
      whatsapp: form.elements.whatsapp.value.trim(),
      email: form.elements.email.value.trim(),
      interesses: ints,
      periodo: (form.querySelector('input[name=periodo]:checked') || {}).value || '',
      mensagem: form.elements.mensagem.value.trim(),
      site: form.elements.site.value,
      t: Date.now() - t0
    };
    send.disabled = true;
    $$('.roll span', send).forEach(function (s) { s.textContent = 'Enviando...'; });
    fetch('/api/reuniao', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function () {
        form.hidden = true;
        $('#doneName').textContent = data.nome.split(' ')[0];
        var d = $('#done'); d.hidden = false; d.focus();
      })
      .catch(function () {
        msg.textContent = 'Não conseguimos enviar agora. Tente de novo em alguns instantes.';
      })
      .then(function () {
        send.disabled = false;
        $$('.roll span', send).forEach(function (s) { s.textContent = 'Quero agendar minha reunião'; });
      });
  });

  /* Voltar ao topo */
  $('#toTop').addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });
})();
