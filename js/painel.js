(function () {
  'use strict';
  var K = 'mv_painel_k';
  var $ = function (s) { return document.querySelector(s); };
  function getKey() { try { return sessionStorage.getItem(K) || ''; } catch (e) { return window.__k || ''; } }
  function setKey(v) { try { sessionStorage.setItem(K, v); } catch (e) { window.__k = v; } }
  function clearKey() { try { sessionStorage.removeItem(K); } catch (e) { window.__k = ''; } }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function fmt(iso) { try { return new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' }); } catch (e) { return iso; } }

  function showLogin(msg) { $('#app').hidden = true; $('#login').hidden = false; $('#err').textContent = msg || ''; $('#k').focus(); }

  function load() {
    var k = getKey(); if (!k) return showLogin();
    fetch('/api/pedidos', { headers: { 'x-k': k } })
      .then(function (r) {
        if (r.status === 401) { clearKey(); throw new Error('chave'); }
        if (!r.ok) throw new Error('falha');
        return r.json();
      })
      .then(render)
      .catch(function (e) { showLogin(e.message === 'chave' ? 'Chave incorreta.' : 'Não foi possível carregar os pedidos agora.'); });
  }

  function render(d) {
    $('#login').hidden = true; $('#app').hidden = false;
    $('#count').textContent = d.total === 1 ? '1 pedido recebido' : d.total + ' pedidos recebidos';
    var list = $('#list'); list.textContent = '';
    if (!d.itens.length) { list.appendChild(el('p', 'empty', 'Nenhum pedido ainda. Assim que alguém preencher o formulário do site, ele aparece aqui.')); return; }
    d.itens.forEach(function (p) {
      var it = el('article', 'item');
      var info = el('div');
      info.appendChild(el('h2', null, p.nome + (p.empresa ? ' · ' + p.empresa : '')));
      info.appendChild(el('p', 'meta', fmt(p.recebido) + ' · ' + p.whatsapp + (p.email ? ' · ' + p.email : '') + (p.periodo ? ' · prefere ' + p.periodo.toLowerCase() : '')));
      var tags = el('div', 'tags'); tags.appendChild(el('span', 'orig', p.origem || 'Site oficial')); (p.interesses || []).forEach(function (t) { tags.appendChild(el('span', null, t)); }); info.appendChild(tags);
      it.appendChild(info);
      var acts = el('div', 'acts');
      var digits = String(p.whatsapp || '').replace(/\D/g, '');
      if (digits) {
        var a = el('a', null, 'Chamar no WhatsApp');
        var txt = 'Olá, ' + p.nome.split(' ')[0] + '! Aqui é da Marketing Vision. ' + (p.origem === 'LP Marketing Vision' ? 'Recebemos o seu pedido de amostra grátis. Qual o melhor dia para a reunião de apresentação?' : 'Recebemos o seu pedido de reunião pelo site. Qual o melhor dia para conversarmos?');
        a.href = 'https://wa.me/' + (digits.length <= 11 ? '55' + digits : digits) + '?text=' + encodeURIComponent(txt);
        a.target = '_blank'; a.rel = 'noopener';
        acts.appendChild(a);
      }
      if (p.email) {
        var m = el('a', null, 'Responder por e-mail');
        var amostra = p.origem === 'LP Marketing Vision';
        var assunto = amostra ? 'Sua amostra grátis: vamos marcar a reunião' : 'Seu pedido de reunião com a Marketing Vision';
        var corpo = 'Olá, ' + p.nome.split(' ')[0] + '!\n\n' + (amostra
          ? 'Recebemos o seu pedido de amostra grátis' + (p.empresa ? ' para ' + p.empresa : '') + '. Sua amostra fica pronta em até 48 horas e vamos apresentá-la numa reunião com você, junto com o investimento e as condições.\n\nQual dia e horário ficam melhores para você?'
          : 'Recebemos o seu pedido de reunião pelo site. Qual dia e horário ficam melhores para você?') + '\n\nEquipe Marketing Vision';
        m.href = 'mailto:' + p.email + '?subject=' + encodeURIComponent(assunto) + '&body=' + encodeURIComponent(corpo);
        acts.appendChild(m);
      }
      var del = el('button', 'ghost', 'Excluir'); del.type = 'button';
      del.addEventListener('click', function () {
        if (!window.confirm('Excluir este pedido? Essa ação não pode ser desfeita.')) return;
        fetch('/api/pedidos', { method: 'DELETE', headers: { 'x-k': getKey(), 'Content-Type': 'application/json' }, body: JSON.stringify({ id: p.id }) })
          .then(function (r) { if (r.ok) it.remove(); });
      });
      acts.appendChild(del);
      it.appendChild(acts);
      if (p.mensagem) it.appendChild(el('p', 'msg', p.mensagem));
      list.appendChild(it);
    });
  }

  $('#login').addEventListener('submit', function (e) { e.preventDefault(); setKey($('#k').value.trim()); $('#k').value = ''; load(); });
  $('#reload').addEventListener('click', load);
  $('#logout').addEventListener('click', function () { clearKey(); showLogin(); });
  load();
})();
