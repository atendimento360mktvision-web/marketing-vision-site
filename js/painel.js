/* Painel central da Marketing Vision: leads, clientes, contratos, entregas, workflow e habilidades.
   Dados em /api/central (um JSON privado) e pedidos dos formulários em /api/pedidos. */
(function () {
  'use strict';

  /* ---------- catálogo de serviços ---------- */
  var SERV = {
    espiaso_pro: { nome: 'Espia só Pro', grupo: 'espiaso', tipo: 'recorrente', preco: 9.97, etapas: ['Cadastro', 'Modelo escolhido', 'Publicado'] },
    espiaso_fpv: { nome: 'Espia só Feito para você', grupo: 'espiaso', tipo: 'recorrente', preco: 39.97, etapas: ['Cadastro', 'Modelo escolhido', 'Montagem', 'Publicado'] },
    landing: { nome: 'Landing page ou site', grupo: 'landing', tipo: 'pontual', etapas: ['Briefing', 'Amostra', 'Reunião', 'Ajustes', 'Publicada'] },
    trafego: { nome: 'Tráfego pago', grupo: 'trafego', tipo: 'recorrente', etapas: ['Onboarding', 'Conta e pixel', 'Campanhas no ar', 'Otimização', 'Relatório'] },
    social: { nome: 'Social media e estratégia', grupo: 'social', tipo: 'recorrente', etapas: ['Planejamento', 'Produção', 'Aprovação', 'Publicado'] },
    video: { nome: 'Vídeo (roteiro e edição)', grupo: 'video', tipo: 'recorrente', etapas: ['Roteiro', 'Gravação', 'Edição', 'Aprovação', 'Postado'] },
    motion: { nome: 'Motion, 3D e VFX', grupo: 'motion', tipo: 'pontual', etapas: ['Briefing', 'Modelagem', 'Animação', 'Render', 'Entregue'] }
  };
  var LEAD_ST = ['Novo', 'E-mail enviado', 'Reunião marcada', 'Amostra pronta', 'Proposta', 'Fechado', 'Perdido'];
  var HAB_ST = ['Na fila', 'Estudando', 'Praticando', 'Dominada'];
  var CLI_ST = ['ativo', 'pausado', 'encerrado'];
  var CON_ST = ['proposta', 'ativo', 'encerrado'];
  var PACOTES = ['Só Espia só', 'Só landing', 'Com tráfego', 'Pacote completo', 'Conteúdo e produção', 'Sem contrato ativo'];
  var TABS = [['geral', 'Visão geral'], ['leads', 'Leads'], ['clientes', 'Clientes'], ['contratos', 'Contratos'], ['entregas', 'Entregas'], ['workflow', 'Workflow'], ['habilidades', 'Habilidades']];

  var S = { db: null, etag: '', pedidos: [], tab: 'geral', f: {} };
  var KEY = 'mv_painel_k';

  /* ---------- utilidades ---------- */
  function $(s) { return document.querySelector(s); }
  function h(tag, p) {
    var e = document.createElement(tag), k, kids = Array.prototype.slice.call(arguments, 2);
    if (p) for (k in p) {
      if (p[k] == null || p[k] === false) continue;
      if (k === 'class') e.className = p[k];
      else if (k === 'text') e.textContent = p[k];
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), p[k]);
      else e.setAttribute(k, p[k] === true ? '' : p[k]);
    }
    (function add(list) { for (var i = 0; i < list.length; i++) { var c = list[i]; if (c == null || c === false) continue; if (Array.isArray(c)) add(c); else e.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c); } })(kids);
    return e;
  }
  function getKey() { try { return sessionStorage.getItem(KEY) || ''; } catch (e) { return window.__k || ''; } }
  function setKey(v) { try { sessionStorage.setItem(KEY, v); } catch (e) { window.__k = v; } }
  function clearKey() { try { sessionStorage.removeItem(KEY); } catch (e) { window.__k = ''; } }
  function uid(p) { return p + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  var BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  function brl(v) { return BRL.format(Number(v) || 0); }
  function hoje() { return new Date().toISOString().slice(0, 10); }
  function dt(iso) { if (!iso) return ''; var d = new Date(iso.length === 10 ? iso + 'T12:00:00' : iso); return isNaN(d) ? iso : d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }); }
  function dth(iso) { try { return new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' }); } catch (e) { return iso; } }
  function addDias(iso, n) { var d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
  function mesStr(d) { return d.toISOString().slice(0, 7); }
  function cliente(id) { return S.db.clientes.find(function (c) { return c.id === id; }); }
  function nomeCli(id) { var c = cliente(id); return c ? c.nome : 'Cliente removido'; }
  function serv(id) { return SERV[id] || { nome: id || 'Serviço', grupo: id, tipo: 'pontual', etapas: ['A fazer', 'Em produção', 'Concluída'] }; }
  function servOpts() { return Object.keys(SERV).map(function (k) { return [k, SERV[k].nome]; }); }
  function cliOpts() { return S.db.clientes.slice().sort(function (a, b) { return a.nome.localeCompare(b.nome); }).map(function (c) { return [c.id, c.nome]; }); }
  function onlyDigits(s) { return String(s || '').replace(/\D/g, ''); }
  function waLink(num, txt) { var d = onlyDigits(num); if (!d) return null; return 'https://wa.me/' + (d.length <= 11 ? '55' + d : d) + (txt ? '?text=' + encodeURIComponent(txt) : ''); }
  function primeiro(n) { return String(n || '').trim().split(/\s+/)[0] || ''; }

  /* ---------- regras de negócio ---------- */
  function ativo(k) { return k.status === 'ativo'; }
  function contratosDe(cid) { return S.db.contratos.filter(function (k) { return k.clienteId === cid; }); }
  function pacote(cid) {
    var g = {}; contratosDe(cid).filter(ativo).forEach(function (k) { g[serv(k.servico).grupo] = 1; });
    var n = Object.keys(g), semEspia = n.filter(function (x) { return x !== 'espiaso'; });
    if (!n.length) return 'Sem contrato ativo';
    if (!semEspia.length) return 'Só Espia só';
    if (g.trafego && semEspia.length >= 3) return 'Pacote completo';
    if (g.trafego) return 'Com tráfego';
    if (semEspia.length === 1 && g.landing) return 'Só landing';
    return 'Conteúdo e produção';
  }
  function mensalCliente(cid) { return contratosDe(cid).filter(function (k) { return ativo(k) && k.tipo === 'recorrente'; }).reduce(function (s, k) { return s + (Number(k.valor) || 0); }, 0); }
  function mrr() { return S.db.contratos.filter(function (k) { return ativo(k) && k.tipo === 'recorrente'; }).reduce(function (s, k) { return s + (Number(k.valor) || 0); }, 0); }
  function receitaMes(m) {
    var ini = m + '-01', fim = m + '-31', atual = mesStr(new Date());
    return S.db.contratos.reduce(function (s, k) {
      var v = Number(k.valor) || 0; if (!v || k.status === 'proposta') return s;
      if (k.tipo === 'pontual') return s + ((k.inicio || '').slice(0, 7) === m ? v : 0);
      var comeca = k.inicio || (atual + '-01');
      var acaba = k.fim || (k.status === 'encerrado' ? '0000' : '9999');
      return s + (comeca <= fim && acaba >= ini ? v : 0);
    }, 0);
  }
  function atrasada(e) { return !e.concluida && e.prazo && e.prazo < hoje(); }
  function leadSt(id) { var l = S.db.leads[id]; return (l && l.status) || 'Novo'; }

  /* ---------- servidor ---------- */
  function api(method, url, body) {
    return fetch(url, { method: method, headers: { 'x-k': getKey(), 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
      .then(function (r) {
        if (r.status === 401) { clearKey(); var e = new Error('chave'); e.code = 401; throw e; }
        return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var er = new Error(j.erro || 'falha'); er.code = r.status; throw er; } return j; });
      });
  }
  function sync(txt, bad) { var s = $('#sync'); s.textContent = txt; s.classList.toggle('bad', !!bad); }
  var fila = Promise.resolve();
  function salvar() {
    sync('Salvando…');
    fila = fila.then(function () {
      return api('PUT', '/api/central', { db: S.db, etag: S.etag }).then(function (r) {
        S.etag = r.etag; sync('Tudo salvo');
      }).catch(function (e) {
        if (e.code === 401) return showLogin('Sua sessão expirou. Entre de novo.');
        if (e.code === 409) { sync('Outra pessoa salvou antes. Recarregando…', true); return carregar(); }
        sync('Não foi possível salvar. Confira a internet.', true);
      });
    });
    return fila;
  }
  function carregar() {
    if (!getKey()) return showLogin();
    sync('Carregando…');
    return Promise.all([api('GET', '/api/central'), api('GET', '/api/pedidos').catch(function () { return { itens: [] }; })])
      .then(function (r) {
        S.db = r[0].db; S.etag = r[0].etag; S.pedidos = r[1].itens || [];
        S.db.leads = S.db.leads || {}; S.db.workflows = S.db.workflows || []; S.db.habilidades = S.db.habilidades || [];
        $('#login').hidden = true; $('#app').hidden = false; $('#logout').hidden = false;
        sync('Tudo salvo'); render();
      })
      .catch(function (e) { showLogin(e.code === 401 ? 'Chave incorreta.' : 'Não foi possível carregar o painel agora.'); });
  }
  function showLogin(msg) { $('#app').hidden = true; $('#logout').hidden = true; $('#login').hidden = false; $('#err').textContent = msg || ''; sync(''); $('#k').focus(); }

  /* ---------- formulário genérico ---------- */
  function abrirForm(cfg) {
    var dlg = $('#dlg'), form = $('#dlgForm'), v = cfg.valores || {}, inputs = {};
    form.textContent = '';
    form.appendChild(h('h3', { text: cfg.titulo }));
    var campos = cfg.campos, i = 0;
    function campo(c) {
      var val = v[c.k] == null ? (c.def == null ? '' : c.def) : v[c.k], inp;
      if (c.type === 'select') {
        inp = h('select', { name: c.k }, (c.vazio ? [h('option', { value: '', text: c.vazio })] : []).concat(c.options.map(function (o) { var ov = Array.isArray(o) ? o[0] : o, ot = Array.isArray(o) ? o[1] : o; return h('option', { value: ov, text: ot }); })));
        inp.value = val;
      } else if (c.type === 'textarea' || c.type === 'lista') {
        inp = h('textarea', { name: c.k, rows: c.rows || 3, placeholder: c.ph || '' }); inp.value = c.type === 'lista' ? (val || []).join('\n') : val;
      } else {
        inp = h('input', { name: c.k, type: c.type || 'text', placeholder: c.ph || '', step: c.type === 'number' ? '0.01' : null, min: c.type === 'number' ? '0' : null, inputmode: c.type === 'number' ? 'decimal' : null }); inp.value = val;
      }
      if (c.req) inp.required = true;
      if (c.onchange) inp.addEventListener('change', function () { c.onchange(inp, inputs); });
      inputs[c.k] = { el: inp, c: c };
      return h('label', null, c.label, inp, c.hint ? h('span', { class: 'hint', text: c.hint }) : null);
    }
    while (i < campos.length) {
      var c = campos[i];
      if (c.half && campos[i + 1] && campos[i + 1].half) { form.appendChild(h('div', { class: 'two' }, campo(c), campo(campos[i + 1]))); i += 2; }
      else { form.appendChild(campo(c)); i++; }
    }
    var err = h('p', { class: 'err' });
    form.appendChild(err);
    form.appendChild(h('div', { class: 'foot' },
      cfg.onDelete ? h('button', { type: 'button', class: 'danger sm', text: cfg.textoExcluir || 'Excluir', onclick: function () { if (window.confirm(cfg.confirmar || 'Excluir? Essa ação não pode ser desfeita.')) { dlg.close(); cfg.onDelete(); } } }) : null,
      h('div', null,
        h('button', { type: 'button', class: 'ghost', text: 'Cancelar', onclick: function () { dlg.close(); } }),
        h('button', { type: 'submit', text: cfg.textoSalvar || 'Salvar' }))));
    form.onsubmit = function (ev) {
      ev.preventDefault();
      var out = {}, falta = [];
      Object.keys(inputs).forEach(function (k) {
        var it = inputs[k], raw = it.el.value;
        if (it.c.type === 'number') out[k] = raw === '' ? 0 : Math.round(parseFloat(String(raw).replace(',', '.')) * 100) / 100 || 0;
        else if (it.c.type === 'lista') out[k] = raw.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
        else out[k] = raw.trim();
        if (it.c.req && !out[k]) falta.push(it.c.label);
      });
      if (falta.length) { err.textContent = 'Preencha: ' + falta.join(', ') + '.'; return; }
      dlg.close(); cfg.onSave(out);
    };
    dlg.showModal();
    var first = form.querySelector('input,select,textarea'); if (first) first.focus();
  }
  function upsert(lista, item) { var i = lista.findIndex(function (x) { return x.id === item.id; }); if (i > -1) lista[i] = item; else lista.push(item); }
  function remover(lista, id) { var i = lista.findIndex(function (x) { return x.id === id; }); if (i > -1) lista.splice(i, 1); }
  function mudou() { render(); salvar(); }

  /* ---------- formulários de cada coisa ---------- */
  function formCliente(c, depois) {
    var novo = !c; c = c || { id: uid('c'), status: 'ativo', desde: mesStr(new Date()) };
    abrirForm({
      titulo: novo ? 'Novo cliente' : c.nome, valores: c,
      campos: [
        { k: 'nome', label: 'Nome (como você chama o cliente)', req: true },
        { k: 'empresa', label: 'Empresa', half: true }, { k: 'nicho', label: 'Nicho ou segmento', half: true },
        { k: 'cidade', label: 'Cidade', half: true }, { k: 'desde', label: 'Cliente desde', ph: 'Ex.: 2026-11', half: true },
        { k: 'whatsapp', label: 'WhatsApp', type: 'tel', half: true }, { k: 'email', label: 'E-mail', type: 'email', half: true },
        { k: 'origem', label: 'Origem', half: true, type: 'select', vazio: 'Não informado', options: ['Indicação', 'Site oficial', 'LP Marketing Vision', 'LP Espia só', 'Instagram', 'Anúncio', 'Outro'] },
        { k: 'status', label: 'Status', half: true, type: 'select', options: CLI_ST.map(function (s) { return [s, s[0].toUpperCase() + s.slice(1)]; }) },
        { k: 'obs', label: 'Observações', type: 'textarea', hint: 'Nunca guarde senhas, acessos ou dados de pacientes aqui.' }
      ],
      onSave: function (o) { Object.assign(c, o); upsert(S.db.clientes, c); mudou(); if (depois) depois(c); },
      onDelete: novo ? null : function () {
        S.db.contratos = S.db.contratos.filter(function (k) { return k.clienteId !== c.id; });
        S.db.entregas = S.db.entregas.filter(function (e) { return e.clienteId !== c.id; });
        remover(S.db.clientes, c.id); mudou();
      },
      confirmar: 'Excluir este cliente, os contratos e as entregas dele? Essa ação não pode ser desfeita.'
    });
  }
  function formContrato(k, cid) {
    var novo = !k; k = k || { id: uid('k'), clienteId: cid || '', servico: '', tipo: 'recorrente', valor: 0, inicio: hoje(), fim: '', status: 'ativo', pagamento: '' };
    abrirForm({
      titulo: novo ? 'Novo contrato' : serv(k.servico).nome + ' · ' + nomeCli(k.clienteId), valores: k,
      campos: [
        { k: 'clienteId', label: 'Cliente', type: 'select', vazio: 'Escolha o cliente', options: cliOpts(), req: true },
        { k: 'servico', label: 'Serviço', type: 'select', vazio: 'Escolha o serviço', options: servOpts(), req: true, onchange: function (el, all) { var s = SERV[el.value]; if (!s) return; all.tipo.el.value = s.tipo; if (s.preco && !Number(all.valor.el.value)) all.valor.el.value = s.preco; } },
        { k: 'tipo', label: 'Cobrança', half: true, type: 'select', options: [['recorrente', 'Mensal (recorrente)'], ['pontual', 'Pagamento único (pontual)']] },
        { k: 'valor', label: 'Valor (R$)', half: true, type: 'number', hint: 'Mensal se for recorrente; total se for pontual.' },
        { k: 'inicio', label: 'Início', type: 'date', half: true }, { k: 'fim', label: 'Fim ou renovação', type: 'date', half: true },
        { k: 'status', label: 'Status', half: true, type: 'select', options: CON_ST.map(function (s) { return [s, s[0].toUpperCase() + s.slice(1)]; }) },
        { k: 'pagamento', label: 'Forma de pagamento', half: true, type: 'select', vazio: 'Não informado', options: ['Pix', 'Pix com desconto', 'Cartão à vista', 'Cartão até 6x sem juros', 'Cartão até 12x', 'Boleto', 'Recorrência no cartão'] },
        { k: 'obs', label: 'Observações', type: 'textarea', rows: 2 }
      ],
      onSave: function (o) { Object.assign(k, o); upsert(S.db.contratos, k); mudou(); },
      onDelete: novo ? null : function () { remover(S.db.contratos, k.id); mudou(); }
    });
  }
  function formEntrega(e, cid) {
    var novo = !e; e = e || { id: uid('e'), clienteId: cid || '', servico: '', titulo: '', etapa: 0, prazo: '', responsavel: '', obs: '', concluida: false };
    abrirForm({
      titulo: novo ? 'Nova entrega' : e.titulo, valores: e,
      campos: [
        { k: 'titulo', label: 'O que vai ser entregue', req: true, ph: 'Ex.: Landing de lançamento' },
        { k: 'clienteId', label: 'Cliente', type: 'select', vazio: 'Escolha o cliente', options: cliOpts(), req: true },
        { k: 'servico', label: 'Serviço', type: 'select', vazio: 'Escolha o serviço', options: servOpts(), req: true },
        { k: 'prazo', label: 'Prazo', type: 'date', half: true }, { k: 'responsavel', label: 'Responsável', half: true },
        { k: 'obs', label: 'Observações', type: 'textarea', rows: 2 }
      ],
      onSave: function (o) { Object.assign(e, o); var max = serv(e.servico).etapas.length - 1; if (e.etapa > max) e.etapa = max; upsert(S.db.entregas, e); mudou(); },
      onDelete: novo ? null : function () { remover(S.db.entregas, e.id); mudou(); }
    });
  }
  function formHab(x) {
    var novo = !x; x = x || { id: uid('h'), status: 'Na fila' };
    abrirForm({
      titulo: novo ? 'Nova habilidade' : x.nome, valores: x,
      campos: [
        { k: 'nome', label: 'Habilidade', req: true },
        { k: 'servico', label: 'Serviço que ela melhora', type: 'select', vazio: 'Geral', options: servOpts(), half: true },
        { k: 'status', label: 'Status', type: 'select', options: HAB_ST, half: true },
        { k: 'fonte', label: 'Fonte (curso, livro, prática)', half: true }, { k: 'onde', label: 'Onde o conhecimento está guardado', half: true },
        { k: 'impacto', label: 'O que ela destrava no negócio', type: 'textarea', rows: 2 }
      ],
      onSave: function (o) { Object.assign(x, o); upsert(S.db.habilidades, x); mudou(); },
      onDelete: novo ? null : function () { remover(S.db.habilidades, x.id); mudou(); }
    });
  }
  function formPasso(w, idx) {
    var novo = idx == null, p = novo ? { docs: [] } : w.passos[idx];
    abrirForm({
      titulo: novo ? 'Novo passo' : p.titulo, valores: p,
      campos: [
        { k: 'titulo', label: 'Passo', req: true },
        { k: 'descricao', label: 'Como fazer', type: 'textarea' },
        { k: 'prazo', label: 'Prazo', half: true }, { k: 'responsavel', label: 'Responsável', half: true },
        { k: 'docs', label: 'Documentos necessários (um por linha)', type: 'lista', rows: 4 }
      ],
      onSave: function (o) { if (novo) w.passos.push(o); else w.passos[idx] = Object.assign(p, o); mudou(); },
      onDelete: novo ? null : function () { w.passos.splice(idx, 1); mudou(); }
    });
  }
  function formProcesso(w) {
    var novo = !w; w = w || { id: uid('w'), nome: '', passos: [] };
    abrirForm({
      titulo: novo ? 'Novo processo' : 'Renomear processo', valores: w,
      campos: [{ k: 'nome', label: 'Nome do processo', req: true, ph: 'Ex.: Onboarding de tráfego pago' }],
      onSave: function (o) { w.nome = o.nome; upsert(S.db.workflows, w); S.f.wf = w.id; mudou(); },
      onDelete: novo ? null : function () { remover(S.db.workflows, w.id); S.f.wf = null; mudou(); },
      confirmar: 'Excluir este processo e todos os passos dele?'
    });
  }

  /* ---------- telas ---------- */
  function cab(titulo, sub, botoes) { return h('div', { class: 'head' }, h('div', null, h('h2', { text: titulo }), sub ? h('p', { text: sub }) : null), botoes ? h('div', { class: 'acts' }, botoes) : null); }
  function kpi(l, v, s, warn) { return h('div', { class: 'kpi' + (warn ? ' warn' : '') }, h('div', { class: 'l', text: l }), h('div', { class: 'v', text: v }), s ? h('div', { class: 's', text: s }) : null); }
  function ir(tab, f) { S.tab = tab; if (f) Object.assign(S.f, f); render(); window.scrollTo(0, 0); }

  function telaGeral() {
    var db = S.db, ativos = db.clientes.filter(function (c) { return c.status === 'ativo'; });
    var m = mrr(), comRec = ativos.filter(function (c) { return mensalCliente(c.id) > 0; }).length;
    var ticket = comRec ? m / comRec : 0, mesAtual = mesStr(new Date());
    var pontualMes = db.contratos.filter(function (k) { return k.tipo === 'pontual' && k.status !== 'proposta' && (k.inicio || '').slice(0, 7) === mesAtual; }).reduce(function (s, k) { return s + (Number(k.valor) || 0); }, 0);
    var trinta = addDias(hoje(), -30), leads30 = S.pedidos.filter(function (p) { return (p.recebido || '') >= trinta; });
    var abertos = S.pedidos.filter(function (p) { var s = leadSt(p.id); return s !== 'Fechado' && s !== 'Perdido'; });
    var atr = db.entregas.filter(atrasada), lim = addDias(hoje(), 30);
    var renov = db.contratos.filter(function (k) { return ativo(k) && k.fim && k.fim >= hoje() && k.fim <= lim; });
    var semValor = db.contratos.filter(function (k) { return ativo(k) && !(Number(k.valor) > 0); });

    var meses = [], d = new Date(); d.setDate(15);
    for (var i = -5; i <= 3; i++) { var x = new Date(d); x.setMonth(d.getMonth() + i); meses.push({ m: mesStr(x), p: i > 0, i: i }); }
    var meta = Number((db.metas || {}).novosClientesMes) || 0;
    meses.forEach(function (o) { o.v = o.p ? m + meta * o.i * ticket : receitaMes(o.m); });
    var max = Math.max.apply(null, meses.map(function (o) { return o.v; }).concat([1]));
    var nomesMes = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    function curto(v) { return v >= 1000 ? 'R$ ' + (v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 'k' : v > 0 ? 'R$ ' + Math.round(v) : ''; }

    var porPacote = {}; PACOTES.forEach(function (p) { porPacote[p] = 0; }); ativos.forEach(function (c) { porPacote[pacote(c.id)]++; });
    var porOrigem = {}; S.pedidos.forEach(function (p) { var o = p.origem || 'Site oficial'; porOrigem[o] = (porOrigem[o] || 0) + 1; });
    var porHab = {}; HAB_ST.forEach(function (s) { porHab[s] = 0; }); db.habilidades.forEach(function (x) { porHab[x.status] = (porHab[x.status] || 0) + 1; });

    return h('div', null,
      cab('Visão geral', 'Tudo da Marketing Vision num lugar só: faturamento, clientes, pedidos e entregas.'),
      semValor.length ? h('div', { class: 'alert' }, h('span', { text: semValor.length + (semValor.length === 1 ? ' contrato ativo está sem valor' : ' contratos ativos estão sem valor') + '. Preencha para o faturamento e a projeção ficarem certos.' }), h('button', { class: 'ghost sm', text: 'Preencher valores', onclick: function () { ir('contratos', { kSt: 'semvalor', kCli: '' }); } })) : null,
      h('div', { class: 'kpis' },
        kpi('Receita recorrente', brl(m), 'por mês'),
        kpi('Projetos do mês', brl(pontualMes), 'pagamentos únicos em ' + nomesMes[new Date().getMonth()]),
        kpi('Clientes ativos', String(ativos.length), comRec + ' com mensalidade'),
        kpi('Ticket médio', brl(ticket), 'mensal por cliente'),
        kpi('Leads em aberto', String(abertos.length), leads30.length + ' nos últimos 30 dias'),
        kpi('Entregas atrasadas', String(atr.length), db.entregas.filter(function (e) { return !e.concluida; }).length + ' em andamento', atr.length > 0),
        kpi('Renovações', String(renov.length), 'nos próximos 30 dias', renov.length > 0)),
      h('div', { class: 'grid2' },
        h('div', { class: 'panel' }, h('h3', { text: 'Faturamento e projeção' }),
          h('div', { class: 'chart' }, meses.map(function (o) {
            var n = parseInt(o.m.slice(5), 10) - 1;
            return h('div', { class: 'c' }, h('div', { class: 'b' + (o.p ? ' p' : ''), style: 'height:' + Math.max(2, o.v / max * 100) + '%' }, h('span', { text: curto(o.v) })), h('div', { class: 'm', text: nomesMes[n] }));
          })),
          h('div', { class: 'legend' }, h('span', null, h('i'), 'Realizado'), h('span', null, h('i', { class: 'p' }), 'Projeção com ' + meta + ' cliente' + (meta === 1 ? '' : 's') + ' novo' + (meta === 1 ? '' : 's') + ' por mês')),
          h('div', { class: 'acts' }, h('button', { class: 'link', text: 'Mudar a meta de novos clientes', onclick: function () {
            abrirForm({ titulo: 'Meta de crescimento', valores: { n: String(meta) }, campos: [{ k: 'n', label: 'Novos clientes com mensalidade por mês', type: 'number', hint: 'A projeção usa essa meta e o ticket médio atual.' }], onSave: function (o) { db.metas = db.metas || {}; db.metas.novosClientesMes = Math.max(0, Math.round(o.n)); mudou(); } });
          } }))),
        h('div', { class: 'panel' }, h('h3', { text: 'Clientes por pacote' }),
          h('div', { class: 'rows' }, PACOTES.map(function (p) { return h('div', { class: 'row' }, h('button', { class: 'link', text: p, onclick: function () { ir('clientes', { cPac: p, cBusca: '' }); } }), h('b', { text: String(porPacote[p]) })); })),
          h('p', { class: 'meta', style: 'margin-top:10px', text: 'Quem tem só Espia só é candidato a landing. Quem tem landing é candidato a tráfego.' })),
        h('div', { class: 'panel' }, h('h3', { text: 'De onde vêm os pedidos' }),
          Object.keys(porOrigem).length ? h('div', { class: 'rows' }, Object.keys(porOrigem).sort(function (a, b) { return porOrigem[b] - porOrigem[a]; }).map(function (o) { return h('div', { class: 'row' }, h('span', { text: o }), h('b', { text: String(porOrigem[o]) })); })) : h('p', { class: 'empty', text: 'Nenhum pedido ainda.' })),
        h('div', { class: 'panel' }, h('h3', { text: 'Próximos prazos' }),
          (function () {
            var prox = db.entregas.filter(function (e) { return !e.concluida && e.prazo; }).sort(function (a, b) { return a.prazo < b.prazo ? -1 : 1; }).slice(0, 5);
            var ren = renov.map(function (k) { return { t: 'Renovação: ' + serv(k.servico).nome + ' · ' + nomeCli(k.clienteId), d: k.fim, r: false }; });
            var it = prox.map(function (e) { return { t: e.titulo + ' · ' + nomeCli(e.clienteId), d: e.prazo, r: atrasada(e) }; }).concat(ren).sort(function (a, b) { return a.d < b.d ? -1 : 1; });
            return it.length ? h('div', { class: 'rows' }, it.map(function (x) { return h('div', { class: 'row' }, h('span', { text: x.t }), h('span', { class: 'tag ' + (x.r ? 'r' : 'g'), text: dt(x.d) })); })) : h('p', { class: 'empty', text: 'Nenhum prazo cadastrado.' });
          })()),
        h('div', { class: 'panel' }, h('h3', { text: 'Aprendizado' }),
          h('div', { class: 'rows' }, HAB_ST.map(function (s) { return h('div', { class: 'row' }, h('span', { text: s }), h('b', { text: String(porHab[s] || 0) })); })),
          h('div', { class: 'acts' }, h('button', { class: 'link', text: 'Ver habilidades', onclick: function () { ir('habilidades'); } })))));
  }

  function telaLeads() {
    var st = S.f.lSt || 'abertos', orig = S.f.lOrig || '';
    var lista = S.pedidos.filter(function (p) {
      var s = leadSt(p.id);
      if (st === 'abertos' && (s === 'Fechado' || s === 'Perdido')) return false;
      if (st !== 'abertos' && st !== 'todos' && s !== st) return false;
      if (orig && (p.origem || 'Site oficial') !== orig) return false;
      return true;
    });
    var origens = []; S.pedidos.forEach(function (p) { var o = p.origem || 'Site oficial'; if (origens.indexOf(o) < 0) origens.push(o); });
    function setLead(p, campos) { S.db.leads[p.id] = Object.assign({}, S.db.leads[p.id] || {}, campos, { em: new Date().toISOString() }); }
    return h('div', null,
      cab('Leads', 'Pedidos de reunião e de amostra grátis que chegam pelo site e pelas landing pages.', [h('button', { class: 'ghost sm', text: 'Atualizar', onclick: carregar })]),
      h('div', { class: 'tools' },
        (function () { var s = h('select', { 'aria-label': 'Status', onchange: function (e) { S.f.lSt = e.target.value; render(); } }, [['abertos', 'Em aberto'], ['todos', 'Todos']].concat(LEAD_ST.map(function (x) { return [x, x]; })).map(function (o) { return h('option', { value: o[0], text: o[1] }); })); s.value = st; return s; })(),
        (function () { var s = h('select', { 'aria-label': 'Origem', onchange: function (e) { S.f.lOrig = e.target.value; render(); } }, [h('option', { value: '', text: 'Todas as origens' })].concat(origens.map(function (o) { return h('option', { value: o, text: o }); }))); s.value = orig; return s; })()),
      lista.length ? h('div', { class: 'cards' }, lista.map(function (p) {
        var s = leadSt(p.id), amostra = p.origem === 'LP Marketing Vision', link = S.db.leads[p.id] && S.db.leads[p.id].clienteId;
        var sel = h('select', { 'aria-label': 'Status do lead', onchange: function (e) { setLead(p, { status: e.target.value }); mudou(); } }, LEAD_ST.map(function (x) { return h('option', { value: x, text: x }); })); sel.value = s;
        var assunto = amostra ? 'Sua amostra grátis: vamos marcar a reunião' : 'Seu pedido de reunião com a Marketing Vision';
        var corpo = 'Olá, ' + primeiro(p.nome) + '!\n\n' + (amostra ? 'Recebemos o seu pedido de amostra grátis' + (p.empresa ? ' para ' + p.empresa : '') + '. Sua amostra fica pronta em até 48 horas e vamos apresentá-la numa reunião com você, junto com o investimento e as condições.\n\nQual dia e horário ficam melhores para você?' : 'Recebemos o seu pedido de reunião pelo site. Qual dia e horário ficam melhores para você?') + '\n\nEquipe Marketing Vision';
        var wa = waLink(p.whatsapp, 'Olá, ' + primeiro(p.nome) + '! Aqui é da Marketing Vision. ' + (amostra ? 'Recebemos o seu pedido de amostra grátis. Qual o melhor dia para a reunião de apresentação?' : 'Recebemos o seu pedido de reunião pelo site. Qual o melhor dia para conversarmos?'));
        return h('article', { class: 'card' },
          h('div', { class: 'tags' }, h('span', { class: 'tag f', text: p.origem || 'Site oficial' }), (p.interesses || []).map(function (t) { return h('span', { class: 'tag', text: t }); })),
          h('h4', { text: p.nome + (p.empresa ? ' · ' + p.empresa : '') }),
          h('div', { class: 'meta', text: dth(p.recebido) + ' · ' + (p.whatsapp || '') + (p.email ? ' · ' + p.email : '') + (p.periodo ? ' · prefere ' + p.periodo.toLowerCase() : '') }),
          p.mensagem ? h('div', { class: 'msg', text: p.mensagem }) : null,
          h('div', { class: 'acts' }, sel,
            p.email ? h('a', { class: 'btn', href: 'mailto:' + p.email + '?subject=' + encodeURIComponent(assunto) + '&body=' + encodeURIComponent(corpo), onclick: function () { if (leadSt(p.id) === 'Novo') { setLead(p, { status: 'E-mail enviado' }); mudou(); } } }, 'Responder por e-mail') : null,
            wa ? h('a', { class: 'btn wa', href: wa, target: '_blank', rel: 'noopener' }, 'WhatsApp') : null),
          h('div', { class: 'acts' },
            link && cliente(link) ? h('button', { class: 'link', text: 'Ver cliente: ' + nomeCli(link), onclick: function () { ir('clientes', { cBusca: nomeCli(link), cPac: '' }); } })
              : h('button', { class: 'ghost sm', text: 'Virar cliente', onclick: function () {
                var c = { id: uid('c'), nome: p.nome, empresa: p.empresa || '', nicho: '', cidade: '', whatsapp: p.whatsapp || '', email: p.email || '', origem: p.origem || 'Site oficial', status: 'ativo', desde: mesStr(new Date()), obs: p.mensagem || '' };
                formCliente(c, function (nc) { setLead(p, { status: 'Fechado', clienteId: nc.id }); mudou(); formContrato(null, nc.id); });
              } }),
            h('button', { class: 'link', style: 'margin-left:auto;color:var(--nevoa)', text: 'Excluir pedido', onclick: function () {
              if (!window.confirm('Excluir este pedido? Essa ação não pode ser desfeita.')) return;
              api('DELETE', '/api/pedidos', { id: p.id }).then(function () { S.pedidos = S.pedidos.filter(function (x) { return x.id !== p.id; }); delete S.db.leads[p.id]; mudou(); }).catch(function () { sync('Não foi possível excluir.', true); });
            } })));
      })) : h('p', { class: 'empty', text: S.pedidos.length ? 'Nenhum lead com esse filtro.' : 'Nenhum pedido ainda. Assim que alguém preencher um formulário, ele aparece aqui.' }));
  }

  function telaClientes() {
    var busca = (S.f.cBusca || '').toLowerCase(), pac = S.f.cPac || '', st = S.f.cSt || 'ativo';
    var lista = S.db.clientes.filter(function (c) {
      if (st && c.status !== st) return false;
      if (pac && pacote(c.id) !== pac) return false;
      if (busca && (c.nome + ' ' + (c.empresa || '') + ' ' + (c.nicho || '') + ' ' + (c.cidade || '')).toLowerCase().indexOf(busca) < 0) return false;
      return true;
    }).sort(function (a, b) { return a.nome.localeCompare(b.nome); });
    var inp = h('input', { type: 'search', placeholder: 'Buscar cliente', value: S.f.cBusca || '', oninput: function (e) { S.f.cBusca = e.target.value; var pos = e.target.selectionStart; render(); var n = $('#view input[type=search]'); if (n) { n.focus(); n.setSelectionRange(pos, pos); } } });
    var sst = h('select', { 'aria-label': 'Status', onchange: function (e) { S.f.cSt = e.target.value; render(); } }, [['ativo', 'Ativos'], ['pausado', 'Pausados'], ['encerrado', 'Encerrados'], ['', 'Todos']].map(function (o) { return h('option', { value: o[0], text: o[1] }); })); sst.value = st;
    return h('div', null,
      cab('Clientes', 'Cada cliente com o pacote que contratou, o que paga por mês e o que está sendo entregue.', [h('button', { class: 'sm', text: 'Novo cliente', onclick: function () { formCliente(null); } })]),
      h('div', { class: 'tools' }, inp, sst),
      h('div', { class: 'chips', style: 'margin-bottom:18px' }, [''].concat(PACOTES).map(function (p) { return h('button', { class: 'chip', 'aria-pressed': String(pac === p), text: p || 'Todos os pacotes', onclick: function () { S.f.cPac = p; render(); } }); })),
      lista.length ? h('div', { class: 'cards' }, lista.map(function (c) {
        var ks = contratosDe(c.id).filter(ativo), ent = S.db.entregas.filter(function (e) { return e.clienteId === c.id && !e.concluida; });
        var mens = mensalCliente(c.id), p = pacote(c.id);
        return h('article', { class: 'card' },
          h('div', { class: 'tags' }, h('span', { class: 'tag f', text: p }), c.status !== 'ativo' ? h('span', { class: 'tag g', text: c.status }) : null),
          h('h4', { text: c.nome }),
          h('div', { class: 'meta', text: [c.nicho, c.cidade].filter(Boolean).join(' · ') || 'Sem nicho e cidade' }),
          ks.length ? h('div', { class: 'tags' }, ks.map(function (k) { return h('span', { class: 'tag g', text: serv(k.servico).nome }); })) : null,
          h('div', { class: 'meta' }, mens ? 'Mensalidade: ' + brl(mens) : 'Sem mensalidade cadastrada', ent.length ? ' · ' + ent.length + ' entrega' + (ent.length > 1 ? 's' : '') + ' em andamento' : ''),
          h('div', { class: 'acts' },
            h('button', { class: 'ghost sm', text: 'Editar', onclick: function () { formCliente(c); } }),
            h('button', { class: 'ghost sm', text: 'Contratos', onclick: function () { ir('contratos', { kCli: c.id, kSt: '' }); } }),
            h('button', { class: 'ghost sm', text: 'Nova entrega', onclick: function () { formEntrega(null, c.id); } }),
            waLink(c.whatsapp) ? h('a', { class: 'btn wa', href: waLink(c.whatsapp), target: '_blank', rel: 'noopener' }, 'WhatsApp') : null));
      })) : h('p', { class: 'empty', text: 'Nenhum cliente com esse filtro.' }));
  }

  function telaContratos() {
    var cli = S.f.kCli || '', st = S.f.kSt || '';
    var lista = S.db.contratos.filter(function (k) {
      if (cli && k.clienteId !== cli) return false;
      if (st === 'semvalor') return ativo(k) && !(Number(k.valor) > 0);
      if (st && k.status !== st) return false;
      return true;
    }).sort(function (a, b) { return nomeCli(a.clienteId).localeCompare(nomeCli(b.clienteId)); });
    var sc = h('select', { 'aria-label': 'Cliente', onchange: function (e) { S.f.kCli = e.target.value; render(); } }, [h('option', { value: '', text: 'Todos os clientes' })].concat(cliOpts().map(function (o) { return h('option', { value: o[0], text: o[1] }); }))); sc.value = cli;
    var ss = h('select', { 'aria-label': 'Status', onchange: function (e) { S.f.kSt = e.target.value; render(); } }, [['', 'Todos os status'], ['ativo', 'Ativos'], ['proposta', 'Propostas'], ['encerrado', 'Encerrados'], ['semvalor', 'Sem valor preenchido']].map(function (o) { return h('option', { value: o[0], text: o[1] }); })); ss.value = st;
    var total = lista.filter(function (k) { return ativo(k) && k.tipo === 'recorrente'; }).reduce(function (s, k) { return s + (Number(k.valor) || 0); }, 0);
    return h('div', null,
      cab('Contratos', 'O que cada cliente contratou, quanto paga e até quando. Os valores são os fechados em reunião.', [h('button', { class: 'sm', text: 'Novo contrato', onclick: function () { formContrato(null, cli); } })]),
      h('div', { class: 'tools' }, sc, ss, h('span', { class: 'meta', text: 'Recorrente nesta lista: ' + brl(total) + ' por mês' })),
      lista.length ? h('div', { class: 'list' }, lista.map(function (k) {
        var v = Number(k.valor) || 0, venc = k.fim && ativo(k) && k.fim <= addDias(hoje(), 30);
        return h('div', { class: 'line', role: 'button', tabindex: '0', onclick: function () { formContrato(k); }, onkeydown: function (e) { if (e.key === 'Enter') formContrato(k); } },
          h('div', null, h('div', { text: nomeCli(k.clienteId) }), h('div', { class: 'sub', text: k.obs || '' })),
          h('div', null, h('div', { text: serv(k.servico).nome }), h('div', { class: 'sub', text: k.tipo === 'recorrente' ? 'Mensal' : 'Pagamento único' })),
          h('div', { class: 'val' + (v ? '' : ' zero'), text: v ? brl(v) : 'Preencher' }),
          h('div', { class: 'sub', text: (k.inicio ? 'Desde ' + dt(k.inicio) : 'Sem início') }),
          h('div', { class: 'sub', text: k.fim ? 'Até ' + dt(k.fim) : 'Sem data de fim' }),
          h('span', { class: 'tag ' + (venc ? 'w' : k.status === 'ativo' ? 'ok' : 'g'), text: venc ? 'Renova logo' : k.status }));
      })) : h('p', { class: 'empty', text: 'Nenhum contrato com esse filtro.' }));
  }

  function telaEntregas() {
    var abertas = S.db.entregas.filter(function (e) { return !e.concluida; }).sort(function (a, b) { return (a.prazo || '9999') < (b.prazo || '9999') ? -1 : 1; });
    var atr = abertas.filter(atrasada), and = abertas.filter(function (e) { return !atrasada(e); });
    var feitas = S.db.entregas.filter(function (e) { return e.concluida; });
    function card(e) {
      var et = serv(e.servico).etapas, i = Math.min(e.etapa || 0, et.length - 1);
      return h('article', { class: 'card' },
        h('div', { class: 'tags' }, h('span', { class: 'tag f', text: serv(e.servico).nome }), e.prazo ? h('span', { class: 'tag ' + (atrasada(e) ? 'r' : 'g'), text: (atrasada(e) ? 'Atrasada · ' : 'Prazo ') + dt(e.prazo) }) : null),
        h('h4', { text: e.titulo }),
        h('div', { class: 'meta', text: nomeCli(e.clienteId) + (e.responsavel ? ' · ' + e.responsavel : '') }),
        h('div', { class: 'steps' }, et.map(function (n, j) { return h('span', { class: e.concluida || j < i ? 'done' : j === i ? 'now' : '', text: n }); })),
        e.obs ? h('div', { class: 'msg', text: e.obs }) : null,
        h('div', { class: 'acts' },
          e.concluida ? h('button', { class: 'ghost sm', text: 'Reabrir', onclick: function () { e.concluida = false; mudou(); } }) : [
            h('button', { class: 'ghost sm', text: 'Voltar etapa', disabled: i === 0, onclick: function () { e.etapa = i - 1; mudou(); } }),
            i < et.length - 1 ? h('button', { class: 'sm', text: 'Avançar para ' + et[i + 1], onclick: function () { e.etapa = i + 1; mudou(); } })
              : h('button', { class: 'sm', text: 'Concluir', onclick: function () { e.concluida = true; e.concluidaEm = hoje(); mudou(); } })],
          h('button', { class: 'link', style: 'margin-left:auto', text: 'Editar', onclick: function () { formEntrega(e); } })));
    }
    return h('div', null,
      cab('Entregas', 'Cada projeto na etapa em que está. Avance a etapa conforme o trabalho anda.', [h('button', { class: 'sm', text: 'Nova entrega', onclick: function () { formEntrega(null); } })]),
      atr.length ? [h('p', { class: 'sec', text: 'Atrasadas · ' + atr.length }), h('div', { class: 'cards' }, atr.map(card))] : null,
      h('p', { class: 'sec', text: 'Em andamento · ' + and.length }),
      and.length ? h('div', { class: 'cards' }, and.map(card)) : h('p', { class: 'empty', text: 'Nenhuma entrega em andamento.' }),
      feitas.length ? [h('p', { class: 'sec', text: 'Concluídas · ' + feitas.length }), S.f.eFeitas ? h('div', { class: 'cards' }, feitas.map(card)) : h('button', { class: 'ghost sm', text: 'Mostrar concluídas', onclick: function () { S.f.eFeitas = true; render(); } })] : null);
  }

  function telaWorkflow() {
    var ws = S.db.workflows, w = ws.find(function (x) { return x.id === S.f.wf; }) || ws[0];
    var sel = ws.length > 1 ? (function () { var s = h('select', { 'aria-label': 'Processo', onchange: function (e) { S.f.wf = e.target.value; render(); } }, ws.map(function (x) { return h('option', { value: x.id, text: x.nome }); })); s.value = w.id; return s; })() : null;
    return h('div', null,
      cab('Workflow comercial', 'O passo a passo de cada processo, com os documentos de cada etapa. Monte e ajuste do seu jeito.', [h('button', { class: 'ghost sm', text: 'Novo processo', onclick: function () { formProcesso(null); } })]),
      !w ? h('p', { class: 'empty', text: 'Nenhum processo ainda. Crie o primeiro.' }) : [
        h('div', { class: 'tools' }, sel, h('h3', { style: 'font-size:22px', text: ws.length > 1 ? '' : w.nome }), h('button', { class: 'link', text: 'Renomear', onclick: function () { formProcesso(w); } })),
        h('div', { class: 'flow' }, w.passos.map(function (p, i) {
          return h('div', { class: 'step' },
            h('div', { class: 'num', text: String(i + 1) }),
            h('div', null, h('h4', { text: p.titulo }), p.descricao ? h('p', { text: p.descricao }) : null,
              (p.prazo || p.responsavel) ? h('div', { class: 'tags', style: 'margin-top:8px' }, p.prazo ? h('span', { class: 'tag g', text: p.prazo }) : null, p.responsavel ? h('span', { class: 'tag g', text: p.responsavel }) : null) : null,
              p.docs && p.docs.length ? h('ul', null, p.docs.map(function (d) { return h('li', { text: d }); })) : null),
            h('div', { class: 'side' },
              h('button', { class: 'link', text: 'Editar', onclick: function () { formPasso(w, i); } }),
              h('button', { class: 'link', 'aria-label': 'Subir passo', text: '↑', disabled: i === 0, onclick: function () { w.passos.splice(i - 1, 0, w.passos.splice(i, 1)[0]); mudou(); } }),
              h('button', { class: 'link', 'aria-label': 'Descer passo', text: '↓', disabled: i === w.passos.length - 1, onclick: function () { w.passos.splice(i + 1, 0, w.passos.splice(i, 1)[0]); mudou(); } })));
        })),
        h('div', { class: 'acts', style: 'margin-top:14px' }, h('button', { class: 'sm', text: 'Adicionar passo', onclick: function () { formPasso(w, null); } }))]);
  }

  function telaHab() {
    return h('div', null,
      cab('Habilidades', 'O que você está aprendendo para entregar melhor e abrir serviços novos.', [h('button', { class: 'sm', text: 'Nova habilidade', onclick: function () { formHab(null); } })]),
      h('div', { class: 'cols' }, HAB_ST.map(function (s) {
        var l = S.db.habilidades.filter(function (x) { return x.status === s; });
        return h('div', { class: 'col' }, h('h3', { text: s + ' · ' + l.length }),
          l.length ? h('div', { class: 'cards' }, l.map(function (x) {
            return h('article', { class: 'card click', role: 'button', tabindex: '0', onclick: function () { formHab(x); }, onkeydown: function (e) { if (e.key === 'Enter') formHab(x); } },
              x.servico ? h('div', { class: 'tags' }, h('span', { class: 'tag g', text: serv(x.servico).nome })) : null,
              h('h4', { text: x.nome }),
              x.fonte ? h('div', { class: 'meta', text: 'Fonte: ' + x.fonte }) : null,
              x.onde ? h('div', { class: 'meta', text: 'Guardado em: ' + x.onde }) : null,
              x.impacto ? h('div', { class: 'meta', text: 'Destrava: ' + x.impacto }) : null);
          })) : h('p', { class: 'meta', text: 'Nada aqui.' }));
      })));
  }

  var TELAS = { geral: telaGeral, leads: telaLeads, clientes: telaClientes, contratos: telaContratos, entregas: telaEntregas, workflow: telaWorkflow, habilidades: telaHab };
  function render() {
    if (!S.db) return;
    var abertos = S.pedidos.filter(function (p) { return leadSt(p.id) === 'Novo'; }).length;
    var atr = S.db.entregas.filter(atrasada).length, nav = $('#tabs');
    nav.textContent = '';
    TABS.forEach(function (t) {
      var n = t[0] === 'leads' ? abertos : t[0] === 'entregas' ? atr : 0;
      nav.appendChild(h('button', { type: 'button', 'aria-current': S.tab === t[0] ? 'page' : null, onclick: function () { ir(t[0]); } }, t[1], n ? h('span', { class: 'n', text: String(n) }) : null));
    });
    var v = $('#view'); v.textContent = ''; v.appendChild(TELAS[S.tab]());
    try { history.replaceState(null, '', '#' + S.tab); } catch (e) {}
  }

  /* ---------- início ---------- */
  var hash = (location.hash || '').slice(1); if (TELAS[hash]) S.tab = hash;
  $('#login').addEventListener('submit', function (e) { e.preventDefault(); setKey($('#k').value.trim()); $('#k').value = ''; carregar(); });
  $('#logout').addEventListener('click', function () { clearKey(); S.db = null; showLogin(); });
  carregar();
})();
