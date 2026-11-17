/* Painel central da Marketing Vision: esteira, leads, clientes, contratos, financeiro, entregas, tráfego,
   workflow, habilidades e configurações. Dados em /api/central (um JSON privado), pedidos em /api/pedidos,
   avisos em /api/push, equipe em /api/equipe e integração do Espia só em /api/integracao. */
(function () {
  'use strict';

  /* ---------- catálogo de serviços ---------- */
  var SERV = {
    espiaso_pro: { nome: 'Espia só Pro', grupo: 'espiaso', tipo: 'recorrente', preco: 9.97, etapas: ['Cadastro', 'Modelo escolhido', 'Publicado'], check: ['Dados recebidos', 'Modelo escolhido', 'Página publicada'] },
    espiaso_fpv: { nome: 'Espia só Feito para você', grupo: 'espiaso', tipo: 'recorrente', preco: 39.97, etapas: ['Cadastro', 'Modelo escolhido', 'Montagem', 'Publicado'], check: ['Dados recebidos', 'Fotos e logo recebidos', 'Modelo escolhido', 'Página montada', 'Página publicada'] },
    landing: { nome: 'Landing page ou site', grupo: 'landing', tipo: 'pontual', etapas: ['Briefing', 'Amostra', 'Reunião', 'Ajustes', 'Publicada'], check: ['Logo recebido', 'Fotos reais recebidas', 'Textos aprovados', 'Domínio configurado', 'Formulário testado', 'Pixel e Analytics instalados'] },
    trafego: { nome: 'Tráfego pago', grupo: 'trafego', tipo: 'recorrente', etapas: ['Onboarding', 'Conta e pixel', 'Campanhas no ar', 'Otimização', 'Relatório'], check: ['Acesso à conta de anúncios', 'Pixel instalado', 'Públicos criados', 'Criativos aprovados', 'Campanha no ar', 'Relatório enviado'] },
    social: { nome: 'Social media e estratégia', grupo: 'social', tipo: 'recorrente', etapas: ['Planejamento', 'Produção', 'Aprovação', 'Publicado'], check: ['Calendário aprovado', 'Artes produzidas', 'Legendas escritas', 'Posts agendados'] },
    video: { nome: 'Vídeo (roteiro e edição)', grupo: 'video', tipo: 'recorrente', etapas: ['Roteiro', 'Gravação', 'Edição', 'Aprovação', 'Postado'], check: ['Roteiro aprovado', 'Material bruto recebido', 'Primeira versão enviada', 'Ajustes feitos', 'Versão final entregue'] },
    motion: { nome: 'Motion, 3D e VFX', grupo: 'motion', tipo: 'pontual', etapas: ['Briefing', 'Modelagem', 'Animação', 'Render', 'Entregue'], check: ['Referências recebidas', 'Modelagem aprovada', 'Animação aprovada', 'Render final entregue'] }
  };
  var LEAD_ST = ['Novo', 'E-mail enviado', 'Reunião marcada', 'Amostra pronta', 'Proposta', 'Fechado', 'Perdido'];
  var MOTIVOS = ['Preço', 'Sem resposta', 'Fechou com outro', 'Não era o momento', 'Fora do perfil', 'Outro'];
  var CUSTO_CAT = ['Ferramenta ou assinatura', 'Freelancer', 'Equipe', 'Impostos e taxas', 'Anúncios da própria agência', 'Outro'];
  var HAB_ST = ['Na fila', 'Estudando', 'Praticando', 'Dominada'];
  var CLI_ST = ['ativo', 'pausado', 'encerrado'];
  var CON_ST = ['proposta', 'ativo', 'encerrado'];
  var PRODUTOS = {
    espiaso: { nome: 'Espia só', tipo: 'Produto' },
    landing: { nome: 'Landing page', tipo: 'Produto' },
    trafego: { nome: 'Tráfego pago', tipo: 'Serviço' },
    social: { nome: 'Social media e estratégia', tipo: 'Serviço' },
    video: { nome: 'Vídeo (roteiro e edição)', tipo: 'Serviço' },
    motion: { nome: 'Motion, 3D e VFX', tipo: 'Serviço' }
  };
  var ESTEIRA_PADRAO = ['espiaso', 'landing', 'trafego', 'social', 'video', 'motion'];
  var PACOTES = ['Só Espia só', 'Só landing', 'Com tráfego', 'Pacote completo', 'Conteúdo e produção', 'Sem contrato ativo'];
  var TABS = [['geral', 'Visão geral'], ['esteira', 'Esteira de produtos'], ['leads', 'Leads'], ['clientes', 'Clientes'], ['contratos', 'Contratos', 1], ['financeiro', 'Financeiro', 1], ['entregas', 'Entregas'], ['trafego', 'Tráfego pago'], ['workflow', 'Workflow comercial'], ['fluxos', 'Construtor de processos'], ['habilidades', 'Habilidades'], ['config', 'Configurações', 1]];
  var ICON = {
    geral: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
    leads: 'M4 13l3-8h10l3 8v6H4zM4 13h5l1 2h4l1-2h5',
    clientes: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14c2 .7 3 2.8 3 6',
    contratos: 'M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6',
    entregas: 'M4 4h4v16H4zM10 4h4v10h-4zM16 4h4v6h-4z',
    workflow: 'M4 5h6v5H4zM14 14h6v5h-6zM7 10v6.5h7',
    esteira: 'M3 20h5v-5h5v-5h5V5h3',
    financeiro: 'M3 6h18v13H3zM3 10h18M7 15h4',
    trafego: 'M4 4v16h16M8 15l3-4 3 2 5-6',
    config: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1',
    fluxos: 'M3 5h6v5H3zM15 4h6v5h-6zM15 15h6v5h-6zM9 7.5h3v9h3M12 6.5h3',
    habilidades: 'M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 15.6 7.1 18.2l.9-5.5-4-3.9 5.5-.8z'
  };
  function icone(id) {
    var NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg'), path = document.createElementNS(NS, 'path');
    svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('aria-hidden', 'true'); path.setAttribute('d', ICON[id] || ''); svg.appendChild(path); return svg;
  }
  function menu(abrir) { document.body.classList.toggle('menu-open', abrir); $('#menuBtn').setAttribute('aria-expanded', String(abrir)); }

  var S = { db: null, etag: '', pedidos: [], eu: null, tab: 'geral', f: {} };
  function admin() { return !!S.eu && S.eu.papel === 'admin'; }
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
  var FMT_DIA = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' });
  function hoje() { return FMT_DIA.format(new Date()); }
  function mesAtual() { return hoje().slice(0, 7); }
  function addMeses(iso, n) { var y = +iso.slice(0, 4), m = +iso.slice(5, 7) - 1 + n, d = iso.length >= 10 ? +iso.slice(8, 10) : 1; var ny = y + Math.floor(m / 12), nm = ((m % 12) + 12) % 12; var ult = new Date(Date.UTC(ny, nm + 1, 0)).getUTCDate(); return ny + '-' + pad(nm + 1) + (iso.length >= 10 ? '-' + pad(Math.min(d, ult)) : ''); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  var MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  function mesNome(m) { return MESES[+m.slice(5, 7) - 1] + '/' + m.slice(0, 4); }
  function diaNoMes(m, dia) { var ult = new Date(Date.UTC(+m.slice(0, 4), +m.slice(5, 7), 0)).getUTCDate(); return m + '-' + pad(Math.min(Math.max(1, dia || 10), ult)); }
  function horas(ms) { return ms / 3600e3; }
  function baixar(nome, texto, tipo) { var a = h('a', { href: URL.createObjectURL(new Blob([texto], { type: tipo || 'text/plain' })), download: nome }); document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500); }
  function csv(linhas) { return '\ufeff' + linhas.map(function (l) { return l.map(function (v) { v = v == null ? '' : String(v); return /[";\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(';'); }).join('\r\n'); }
  function num(v) { return (Number(v) || 0).toFixed(2).replace('.', ','); }
  function copiar(txt) { if (navigator.clipboard) return navigator.clipboard.writeText(txt).then(function () { sync('Copiado'); }, function () { window.prompt('Copie o texto:', txt); }); window.prompt('Copie o texto:', txt); }
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
  /* cobranças: mensalidade de cada contrato recorrente e parcelas dos contratos pontuais */
  function cobrancaId(k, ref) { return 'cb-' + k.id + '-' + ref; }
  function gerarCobrancas(m) {
    var n = 0, ini = m + '-01', fim = diaNoMes(m, 31);
    S.db.contratos.forEach(function (k) {
      var v = Number(k.valor) || 0;
      if (!ativo(k) || !v || k.tipo !== 'recorrente') return;
      if ((k.inicio || ini) > fim || (k.fim && k.fim < ini)) return;
      var id = cobrancaId(k, m);
      if (S.db.cobrancas.some(function (c) { return c.id === id; })) return;
      S.db.cobrancas.push({ id: id, contratoId: k.id, clienteId: k.clienteId, ref: 'Mensalidade ' + mesNome(m), vencimento: diaNoMes(m, Number(k.diaVenc) || 10), valor: v, pago: false, forma: k.pagamento || '' });
      n++;
    });
    return n;
  }
  function sincronizarCobrancas(k) {
    var v = Number(k.valor) || 0;
    if (k.tipo === 'pontual' && v && k.status !== 'proposta') {
      var p = Math.max(1, Math.min(24, Math.round(Number(k.parcelas) || 1))), base = Math.floor(v / p * 100) / 100, ini = k.inicio || hoje();
      for (var i = 0; i < p; i++) {
        var id = cobrancaId(k, 'p' + (i + 1)), valor = i === p - 1 ? Math.round((v - base * (p - 1)) * 100) / 100 : base;
        var c = S.db.cobrancas.find(function (x) { return x.id === id; });
        var dados = { contratoId: k.id, clienteId: k.clienteId, ref: serv(k.servico).nome + (p > 1 ? ' · parcela ' + (i + 1) + '/' + p : ''), vencimento: addMeses(ini, i), valor: valor, forma: k.pagamento || '' };
        if (!c) S.db.cobrancas.push(Object.assign({ id: id, pago: false }, dados)); else if (!c.pago) Object.assign(c, dados);
      }
      S.db.cobrancas = S.db.cobrancas.filter(function (x) { var m = x.id.match(/-p(\d+)$/); return !(x.contratoId === k.id && m && +m[1] > p && !x.pago); });
    }
    if (k.tipo === 'recorrente') {
      S.db.cobrancas.forEach(function (c) { if (c.contratoId === k.id && !c.pago && c.vencimento >= hoje()) { c.valor = v; c.forma = k.pagamento || c.forma; } });
      S.db.cobrancas = S.db.cobrancas.filter(function (c) { return !(c.contratoId === k.id && !c.pago && (!ativo(k) || !v) && c.vencimento >= hoje()); });
      gerarCobrancas(mesAtual()); gerarCobrancas(addMeses(mesAtual(), 1));
    }
  }
  function cobAtrasada(c) { return !c.pago && c.vencimento < hoje(); }
  function custoNoMes(x, m) {
    var v = Number(x.valor) || 0, d = (x.data || hoje()).slice(0, 7);
    if (x.recorrencia === 'mensal') return d <= m && (!x.fim || x.fim.slice(0, 7) >= m) ? v : 0;
    return d === m ? v : 0;
  }
  function custosDoMes(m, cid) { return S.db.custos.reduce(function (s, x) { return s + ((cid === undefined || (x.clienteId || '') === cid) ? custoNoMes(x, m) : 0); }, 0); }
  function recebidoNoMes(m, cid) { return S.db.cobrancas.reduce(function (s, c) { return s + (c.pago && (c.pagoEm || '').slice(0, 7) === m && (cid === undefined || c.clienteId === cid) ? Number(c.valor) || 0 : 0); }, 0); }

  /* leads: prazos e passos */
  function leadInfo(id) { return S.db.leads[id] || {}; }
  function setLead(p, campos) { S.db.leads[p.id] = Object.assign({}, S.db.leads[p.id] || {}, campos, { em: new Date().toISOString() }); }
  function prazoAmostra(p) { return p.origem === 'LP Marketing Vision' && p.recebido ? new Date(Date.parse(p.recebido) + 48 * 3600e3).toISOString() : null; }
  function amostraPendente(p) { return !!prazoAmostra(p) && ['Novo', 'E-mail enviado', 'Reunião marcada'].indexOf(leadSt(p.id)) > -1; }
  function leadParado(p) { return leadSt(p.id) === 'Novo' && Date.now() - Date.parse(p.recebido) > 24 * 3600e3; }
  function wfDoLead(p) { var l = leadInfo(p.id), ws = S.db.workflows; return ws.find(function (w) { return w.id === l.wf; }) || ws[0]; }

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
  function salvar(acao) {
    sync('Salvando…');
    fila = fila.then(function () {
      return api('PUT', '/api/central', { db: S.db, etag: S.etag, acao: acao || 'Alterou o painel' }).then(function (r) {
        S.etag = r.etag; if (r.entrada) S.db.log = [r.entrada].concat(S.db.log || []).slice(0, 300); sync('Tudo salvo');
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
        S.db = r[0].db; S.etag = r[0].etag; S.eu = r[0].eu || { nome: '', papel: 'admin' }; S.pedidos = r[1].itens || [];
        ['workflows', 'habilidades', 'cobrancas', 'custos', 'trafego', 'log', 'fluxos'].forEach(function (k) { if (!Array.isArray(S.db[k])) S.db[k] = []; });
        S.db.leads = S.db.leads || {};
        $('#login').hidden = true; $('#top').hidden = true; $('#app').hidden = false;
        $('#quem').textContent = S.eu.nome ? S.eu.nome + (admin() ? ' · administrador' : ' · equipe') : '';
        var tab = TABS.find(function (t) { return t[0] === S.tab; }); if (!tab || (tab[2] && !admin())) S.tab = 'geral';
        sync('Tudo salvo'); render();
        if (admin()) { var n = gerarCobrancas(mesAtual()) + gerarCobrancas(addMeses(mesAtual(), 1)); if (n) { render(); salvar('Gerou ' + n + (n > 1 ? ' cobranças' : ' cobrança') + ' do mês'); } }
        registrarSW();
      })
      .catch(function (e) { showLogin(e.code === 401 ? 'Chave incorreta.' : 'Não foi possível carregar o painel agora.'); });
  }
  function showLogin(msg) { menu(false); $('#app').hidden = true; $('#top').hidden = false; $('#login').hidden = false; $('#err').textContent = msg || ''; sync(''); $('#k').focus(); }

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
  function mudou(acao) { render(); salvar(acao); }

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
      onSave: function (o) { Object.assign(c, o); upsert(S.db.clientes, c); mudou((novo ? 'Cadastrou' : 'Editou') + ' o cliente ' + c.nome); if (depois) depois(c); },
      onDelete: novo ? null : function () {
        S.db.contratos = S.db.contratos.filter(function (k) { return k.clienteId !== c.id; });
        S.db.entregas = S.db.entregas.filter(function (e) { return e.clienteId !== c.id; });
        S.db.cobrancas = S.db.cobrancas.filter(function (x) { return x.clienteId !== c.id || x.pago; });
        remover(S.db.clientes, c.id); mudou('Excluiu o cliente ' + c.nome);
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
        { k: 'diaVenc', label: 'Dia do vencimento', half: true, type: 'number', def: 10, hint: 'Para mensalidades.' },
        { k: 'parcelas', label: 'Parcelas', half: true, type: 'number', def: 1, hint: 'Para pagamento único dividido.' },
        { k: 'obs', label: 'Observações', type: 'textarea', rows: 2 }
      ],
      onSave: function (o) { o.diaVenc = Math.min(28, Math.max(1, Math.round(o.diaVenc) || 10)); o.parcelas = Math.min(24, Math.max(1, Math.round(o.parcelas) || 1)); Object.assign(k, o); upsert(S.db.contratos, k); sincronizarCobrancas(k); mudou((novo ? 'Criou' : 'Editou') + ' o contrato ' + serv(k.servico).nome + ' de ' + nomeCli(k.clienteId)); },
      onDelete: novo ? null : function () { remover(S.db.contratos, k.id); S.db.cobrancas = S.db.cobrancas.filter(function (c) { return c.contratoId !== k.id || c.pago; }); mudou('Excluiu o contrato ' + serv(k.servico).nome + ' de ' + nomeCli(k.clienteId)); }
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
      onSave: function (o) { Object.assign(e, o); var max = serv(e.servico).etapas.length - 1; if (e.etapa > max) e.etapa = max; if (!e.checklist || !e.checklist.length) e.checklist = (serv(e.servico).check || []).map(function (t) { return { t: t, ok: false }; }); upsert(S.db.entregas, e); mudou((novo ? 'Criou' : 'Editou') + ' a entrega ' + e.titulo); },
      onDelete: novo ? null : function () { remover(S.db.entregas, e.id); mudou('Excluiu a entrega ' + e.titulo); }
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
    var db = S.db, adm = admin(), ativos = db.clientes.filter(function (c) { return c.status === 'ativo'; });
    var m = mrr(), comRec = ativos.filter(function (c) { return mensalCliente(c.id) > 0; }).length;
    var ticket = comRec ? m / comRec : 0, mes = mesAtual();
    var trinta = addDias(hoje(), -30), leads30 = S.pedidos.filter(function (p) { return (p.recebido || '') >= trinta; });
    var abertos = S.pedidos.filter(function (p) { var s = leadSt(p.id); return s !== 'Fechado' && s !== 'Perdido'; });
    var parados = S.pedidos.filter(leadParado), amostras = S.pedidos.filter(amostraPendente);
    var vencendo = amostras.filter(function (p) { return Date.parse(prazoAmostra(p)) - Date.now() < 24 * 3600e3; });
    var atr = db.entregas.filter(atrasada), lim = addDias(hoje(), 30);
    var renov = db.contratos.filter(function (k) { return ativo(k) && k.fim && k.fim >= hoje() && k.fim <= lim; });
    var semValor = adm ? db.contratos.filter(function (k) { return ativo(k) && !(Number(k.valor) > 0); }) : [];
    var cobAtr = db.cobrancas.filter(cobAtrasada), valorAtr = cobAtr.reduce(function (s, c) { return s + (Number(c.valor) || 0); }, 0);
    var previsto = db.cobrancas.filter(function (c) { return c.vencimento.slice(0, 7) === mes; }).reduce(function (s, c) { return s + (Number(c.valor) || 0); }, 0);
    var recebido = recebidoNoMes(mes), custos = custosDoMes(mes);

    var meses = [], d = new Date(); d.setDate(15);
    for (var i = -5; i <= 3; i++) { var x = new Date(d); x.setMonth(d.getMonth() + i); meses.push({ m: mesStr(x), p: i > 0, i: i }); }
    var meta = Number((db.metas || {}).novosClientesMes) || 0;
    meses.forEach(function (o) { o.v = o.p ? m + meta * o.i * ticket : receitaMes(o.m); });
    var max = Math.max.apply(null, meses.map(function (o) { return o.v; }).concat([1]));
    function curto(v) { return v >= 1000 ? 'R$ ' + (v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 'k' : v > 0 ? 'R$ ' + Math.round(v) : ''; }

    var porPacote = {}; PACOTES.forEach(function (p) { porPacote[p] = 0; }); ativos.forEach(function (c) { porPacote[pacote(c.id)]++; });
    var porOrigem = {}; S.pedidos.forEach(function (p) { var o = p.origem || 'Site oficial'; porOrigem[o] = (porOrigem[o] || 0) + 1; });
    var porHab = {}; HAB_ST.forEach(function (s) { porHab[s] = 0; }); db.habilidades.forEach(function (x) { porHab[x.status] = (porHab[x.status] || 0) + 1; });

    var atencao = [];
    if (parados.length) atencao.push([parados.length + (parados.length > 1 ? ' leads sem resposta há mais de 24 horas' : ' lead sem resposta há mais de 24 horas'), function () { ir('leads', { lSt: 'parados', lOrig: '' }); }]);
    if (vencendo.length) atencao.push([vencendo.length + (vencendo.length > 1 ? ' amostras grátis vencem em menos de 24 horas' : ' amostra grátis vence em menos de 24 horas'), function () { ir('leads', { lSt: 'amostra', lOrig: '' }); }]);
    if (adm && cobAtr.length) atencao.push([cobAtr.length + (cobAtr.length > 1 ? ' cobranças atrasadas' : ' cobrança atrasada') + ' somando ' + brl(valorAtr), function () { ir('financeiro'); }]);
    if (atr.length) atencao.push([atr.length + (atr.length > 1 ? ' entregas atrasadas' : ' entrega atrasada'), function () { ir('entregas'); }]);
    if (semValor.length) atencao.push([semValor.length + (semValor.length === 1 ? ' contrato ativo está sem valor' : ' contratos ativos estão sem valor') + ', o faturamento e as cobranças dependem disso', function () { ir('contratos', { kSt: 'semvalor', kCli: '' }); }]);

    var agenda = [];
    db.entregas.forEach(function (e) { if (!e.concluida && e.prazo) agenda.push({ t: 'Entrega: ' + e.titulo + ' · ' + nomeCli(e.clienteId), d: e.prazo, r: atrasada(e) }); });
    renov.forEach(function (k) { agenda.push({ t: 'Renovação: ' + serv(k.servico).nome + ' · ' + nomeCli(k.clienteId), d: k.fim, r: false }); });
    amostras.forEach(function (p) { var pz = prazoAmostra(p); agenda.push({ t: 'Amostra grátis: ' + p.nome + (p.empresa ? ' · ' + p.empresa : ''), d: pz, r: Date.parse(pz) < Date.now(), hora: true }); });
    S.pedidos.forEach(function (p) { var r = leadInfo(p.id).reuniao; if (r && r.slice(0, 10) >= hoje()) agenda.push({ t: 'Reunião: ' + p.nome + (p.empresa ? ' · ' + p.empresa : ''), d: r, r: false, hora: true }); });
    if (adm) db.cobrancas.forEach(function (c) { if (!c.pago && c.vencimento >= hoje() && c.vencimento <= addDias(hoje(), 7)) agenda.push({ t: 'Cobrança: ' + c.ref + ' · ' + nomeCli(c.clienteId) + ' · ' + brl(c.valor), d: c.vencimento, r: false }); });
    agenda.sort(function (a, b) { return a.d < b.d ? -1 : 1; });

    return h('div', null,
      cab('Visão geral', S.eu && S.eu.nome ? 'Bom te ver, ' + primeiro(S.eu.nome) + '. Tudo da Marketing Vision num lugar só.' : 'Tudo da Marketing Vision num lugar só.'),
      atencao.length ? h('div', { class: 'panel att' }, h('h3', { text: 'Precisa de atenção' }), h('div', { class: 'rows' }, atencao.map(function (a) { return h('div', { class: 'row' }, h('span', { text: a[0] }), h('button', { class: 'ghost sm', text: 'Ver', onclick: a[1] })); }))) : null,
      h('div', { class: 'kpis' },
        adm ? kpi('Recebido no mês', brl(recebido), 'de ' + brl(previsto) + ' previstos') : null,
        adm ? kpi('Receita recorrente', brl(m), 'por mês contratado') : null,
        adm ? kpi('Lucro do mês', brl(recebido - custos), 'recebido menos ' + brl(custos) + ' de custos', recebido - custos < 0) : null,
        adm ? kpi('Atrasado', brl(valorAtr), cobAtr.length + (cobAtr.length === 1 ? ' cobrança' : ' cobranças'), cobAtr.length > 0) : null,
        kpi('Clientes ativos', String(ativos.length), adm ? comRec + ' com mensalidade · ticket ' + brl(ticket) : 'na carteira'),
        kpi('Leads em aberto', String(abertos.length), leads30.length + ' nos últimos 30 dias', parados.length > 0),
        kpi('Amostras pendentes', String(amostras.length), vencendo.length + ' vencendo em 24h', vencendo.length > 0),
        kpi('Entregas atrasadas', String(atr.length), db.entregas.filter(function (e) { return !e.concluida; }).length + ' em andamento', atr.length > 0)),
      h('div', { class: 'grid2' },
        adm ? h('div', { class: 'panel' }, h('h3', { text: 'Faturamento contratado e projeção' }),
          h('div', { class: 'chart' }, meses.map(function (o) {
            return h('div', { class: 'c' }, h('div', { class: 'b' + (o.p ? ' p' : ''), style: 'height:' + Math.max(2, o.v / max * 100) + '%' }, h('span', { text: curto(o.v) })), h('div', { class: 'm', text: MESES[+o.m.slice(5) - 1] }));
          })),
          h('div', { class: 'legend' }, h('span', null, h('i'), 'Contratado'), h('span', null, h('i', { class: 'p' }), 'Projeção com ' + meta + ' cliente' + (meta === 1 ? '' : 's') + ' novo' + (meta === 1 ? '' : 's') + ' por mês')),
          h('div', { class: 'acts' }, h('button', { class: 'link', text: 'Mudar a meta de novos clientes', onclick: function () {
            abrirForm({ titulo: 'Meta de crescimento', valores: { n: String(meta) }, campos: [{ k: 'n', label: 'Novos clientes com mensalidade por mês', type: 'number', hint: 'A projeção usa essa meta e o ticket médio atual.' }], onSave: function (o) { db.metas = db.metas || {}; db.metas.novosClientesMes = Math.max(0, Math.round(o.n)); mudou('Mudou a meta de novos clientes para ' + db.metas.novosClientesMes); } });
          } }))) : null,
        h('div', { class: 'panel' }, h('h3', { text: 'Agenda' }),
          agenda.length ? h('div', { class: 'rows' }, agenda.slice(0, 10).map(function (x) { return h('div', { class: 'row' }, h('span', { text: x.t }), h('span', { class: 'tag ' + (x.r ? 'r' : 'g'), text: x.hora ? dth(x.d) : dt(x.d) })); })) : h('p', { class: 'empty', text: 'Nada agendado.' })),
        h('div', { class: 'panel' }, h('h3', { text: 'Clientes por pacote' }),
          h('div', { class: 'rows' }, PACOTES.map(function (p) { return h('div', { class: 'row' }, h('button', { class: 'link', text: p, onclick: function () { ir('clientes', { cPac: p, cBusca: '' }); } }), h('b', { text: String(porPacote[p]) })); })),
          h('div', { class: 'acts' }, h('button', { class: 'link', text: 'Ver a esteira de produtos', onclick: function () { ir('esteira'); } }))),
        h('div', { class: 'panel' }, h('h3', { text: 'De onde vêm os pedidos' }),
          Object.keys(porOrigem).length ? h('div', { class: 'rows' }, Object.keys(porOrigem).sort(function (a, b) { return porOrigem[b] - porOrigem[a]; }).map(function (o) { return h('div', { class: 'row' }, h('span', { text: o }), h('b', { text: String(porOrigem[o]) })); })) : h('p', { class: 'empty', text: 'Nenhum pedido ainda.' })),
        h('div', { class: 'panel' }, h('h3', { text: 'Aprendizado' }),
          h('div', { class: 'rows' }, HAB_ST.map(function (s) { return h('div', { class: 'row' }, h('span', { text: s }), h('b', { text: String(porHab[s] || 0) })); })),
          h('div', { class: 'acts' }, h('button', { class: 'link', text: 'Ver habilidades', onclick: function () { ir('habilidades'); } })))));
  }

  function indicadores() {
    var porO = {}, motivos = {};
    S.pedidos.forEach(function (p) {
      var o = p.origem || 'Site oficial', st = leadSt(p.id), l = leadInfo(p.id);
      var x = porO[o] = porO[o] || { total: 0, fech: 0, perd: 0, dias: [] };
      x.total++;
      if (st === 'Fechado') { x.fech++; if (l.fechadoEm) x.dias.push((Date.parse(l.fechadoEm) - Date.parse(p.recebido)) / 864e5); }
      if (st === 'Perdido') { x.perd++; var mo = l.motivo || 'Sem motivo informado'; motivos[mo] = (motivos[mo] || 0) + 1; }
    });
    var origens = Object.keys(porO).sort(function (a, b) { return porO[b].total - porO[a].total; });
    return h('div', { class: 'grid2', style: 'margin-bottom:18px' },
      h('div', { class: 'panel' }, h('h3', { text: 'Conversão por origem' }),
        origens.length ? h('div', { class: 'rows' }, origens.map(function (o) {
          var x = porO[o], media = x.dias.length ? x.dias.reduce(function (s, v) { return s + v; }, 0) / x.dias.length : null;
          return h('div', { class: 'row' }, h('span', null, h('b', { text: o }), h('span', { class: 'meta', text: ' · ' + x.total + ' leads, ' + x.fech + ' fechados, ' + x.perd + ' perdidos' + (media != null ? ', fecha em ' + Math.max(0, Math.round(media)) + ' dias em média' : '') })), h('b', { text: Math.round(x.fech / x.total * 100) + '%' }));
        })) : h('p', { class: 'meta', text: 'Sem leads ainda.' })),
      h('div', { class: 'panel' }, h('h3', { text: 'Por que perdemos' }),
        Object.keys(motivos).length ? h('div', { class: 'rows' }, Object.keys(motivos).sort(function (a, b) { return motivos[b] - motivos[a]; }).map(function (m) { return h('div', { class: 'row' }, h('span', { text: m }), h('b', { text: String(motivos[m]) })); })) : h('p', { class: 'meta', text: 'Nenhum lead perdido até agora.' })));
  }

  function mudarStatus(p, st) {
    var nome = p.nome + (p.empresa ? ' (' + p.empresa + ')' : '');
    if (st === 'Perdido') {
      return abrirForm({ titulo: 'Por que perdemos ' + primeiro(p.nome) + '?', valores: {}, textoSalvar: 'Marcar como perdido',
        campos: [{ k: 'motivo', label: 'Motivo', type: 'select', options: MOTIVOS, req: true }, { k: 'nota', label: 'Detalhe (opcional)', type: 'textarea', rows: 2 }],
        onSave: function (o) { setLead(p, { status: 'Perdido', motivo: o.motivo, notaPerda: o.nota, perdidoEm: new Date().toISOString() }); mudou('Marcou como perdido: ' + nome + ' (' + o.motivo + ')'); } });
    }
    var extra = { status: st };
    if (st === 'Fechado' && !leadInfo(p.id).fechadoEm) extra.fechadoEm = new Date().toISOString();
    setLead(p, extra); mudou('Mudou o lead ' + nome + ' para ' + st);
  }

  function telaLeads() {
    var st = S.f.lSt || 'abertos', orig = S.f.lOrig || '';
    var lista = S.pedidos.filter(function (p) {
      var s = leadSt(p.id);
      if (st === 'abertos' && (s === 'Fechado' || s === 'Perdido')) return false;
      if (st === 'parados' && !leadParado(p)) return false;
      if (st === 'amostra' && !amostraPendente(p)) return false;
      if (['abertos', 'todos', 'parados', 'amostra'].indexOf(st) < 0 && s !== st) return false;
      if (orig && (p.origem || 'Site oficial') !== orig) return false;
      return true;
    });
    var origens = []; S.pedidos.forEach(function (p) { var o = p.origem || 'Site oficial'; if (origens.indexOf(o) < 0) origens.push(o); });
    var opts = [['abertos', 'Em aberto'], ['parados', 'Sem resposta há 24h'], ['amostra', 'Amostra pendente'], ['todos', 'Todos']].concat(LEAD_ST.map(function (x) { return [x, x]; }));
    return h('div', null,
      cab('Leads', 'Pedidos de reunião e de amostra grátis que chegam pelo site e pelas landing pages.', [
        h('button', { class: 'ghost sm', text: S.f.lInd ? 'Esconder indicadores' : 'Indicadores do comercial', onclick: function () { S.f.lInd = !S.f.lInd; render(); } }),
        h('button', { class: 'ghost sm', text: 'Atualizar', onclick: carregar })]),
      S.pushEstado === 'inativo' ? h('div', { class: 'alert' }, h('span', { text: 'Ative os avisos para saber de cada pedido novo na hora, mesmo com o painel fechado.' }), h('button', { class: 'sm', text: 'Ativar avisos', onclick: function () { ativarAvisos().then(function () { S.pushEstado = 'ativo'; sync('Avisos ativados neste aparelho'); render(); }).catch(avisoErro); } })) : null,
      S.f.lInd ? indicadores() : null,
      h('div', { class: 'tools' },
        (function () { var s = h('select', { 'aria-label': 'Status', onchange: function (e) { S.f.lSt = e.target.value; render(); } }, opts.map(function (o) { return h('option', { value: o[0], text: o[1] }); })); s.value = st; return s; })(),
        (function () { var s = h('select', { 'aria-label': 'Origem', onchange: function (e) { S.f.lOrig = e.target.value; render(); } }, [h('option', { value: '', text: 'Todas as origens' })].concat(origens.map(function (o) { return h('option', { value: o, text: o }); }))); s.value = orig; return s; })()),
      lista.length ? h('div', { class: 'cards' }, lista.map(function (p) {
        var s = leadSt(p.id), l = leadInfo(p.id), amostra = p.origem === 'LP Marketing Vision', link = l.clienteId;
        var pz = prazoAmostra(p), faltam = pz ? Date.parse(pz) - Date.now() : 0;
        var sel = h('select', { 'aria-label': 'Status do lead', onchange: function (e) { mudarStatus(p, e.target.value); } }, LEAD_ST.map(function (x) { return h('option', { value: x, text: x }); })); sel.value = s;
        var assunto = amostra ? 'Sua amostra grátis: vamos marcar a reunião' : 'Seu pedido de reunião com a Marketing Vision';
        var corpo = 'Olá, ' + primeiro(p.nome) + '!\n\n' + (amostra ? 'Recebemos o seu pedido de amostra grátis' + (p.empresa ? ' para ' + p.empresa : '') + '. Sua amostra fica pronta em até 48 horas e vamos apresentá-la numa reunião com você, junto com o investimento e as condições.\n\nQual dia e horário ficam melhores para você?' : 'Recebemos o seu pedido de reunião pelo site. Qual dia e horário ficam melhores para você?') + '\n\nEquipe Marketing Vision';
        var wa = waLink(p.whatsapp, 'Olá, ' + primeiro(p.nome) + '! Aqui é da Marketing Vision. ' + (amostra ? 'Recebemos o seu pedido de amostra grátis. Qual o melhor dia para a reunião de apresentação?' : 'Recebemos o seu pedido de reunião pelo site. Qual o melhor dia para conversarmos?'));
        var wf = wfDoLead(p), passo = Math.min(l.passo || 0, wf ? wf.passos.length : 0), atual = wf && wf.passos[passo];
        var reu = h('input', { type: 'datetime-local', 'aria-label': 'Data e hora da reunião', value: l.reuniao ? l.reuniao.slice(0, 16) : '', onchange: function (e) {
          var v = e.target.value; var c = { reuniao: v };
          if (v && ['Novo', 'E-mail enviado'].indexOf(s) > -1) c.status = 'Reunião marcada';
          setLead(p, c); mudou(v ? 'Marcou reunião com ' + p.nome + ' em ' + dth(v) : 'Desmarcou a reunião com ' + p.nome);
        } });
        return h('article', { class: 'card' },
          h('div', { class: 'tags' },
            h('span', { class: 'tag f', text: p.origem || 'Site oficial' }),
            (p.interesses || []).map(function (t) { return h('span', { class: 'tag', text: t }); }),
            leadParado(p) ? h('span', { class: 'tag r', text: 'Sem resposta há mais de 24h' }) : null,
            amostraPendente(p) ? h('span', { class: 'tag ' + (faltam < 0 ? 'r' : faltam < 24 * 3600e3 ? 'w' : 'g'), text: (faltam < 0 ? 'Amostra atrasada desde ' : 'Amostra até ') + dth(pz) }) : null,
            s === 'Perdido' && l.motivo ? h('span', { class: 'tag g', text: 'Perdido: ' + l.motivo }) : null),
          h('h4', { text: p.nome + (p.empresa ? ' · ' + p.empresa : '') }),
          h('div', { class: 'meta', text: 'Recebido em ' + dth(p.recebido) + ' · ' + (p.whatsapp || '') + (p.email ? ' · ' + p.email : '') + (p.periodo ? ' · prefere ' + p.periodo.toLowerCase() : '') }),
          p.mensagem ? h('div', { class: 'msg', text: p.mensagem }) : null,
          wf && wf.passos.length ? h('div', { class: 'passo' },
            h('div', { class: 'meta', text: passo < wf.passos.length ? 'Passo ' + (passo + 1) + ' de ' + wf.passos.length + ' · ' + wf.nome : 'Processo concluído · ' + wf.nome }),
            atual ? h('b', { text: atual.titulo }) : null,
            atual && atual.docs && atual.docs.length ? h('div', { class: 'meta', text: 'Precisa de: ' + atual.docs.join(', ') }) : null,
            h('div', { class: 'acts' },
              passo > 0 ? h('button', { class: 'link', text: 'Voltar passo', onclick: function () { setLead(p, { passo: passo - 1 }); mudou('Voltou um passo no lead ' + p.nome); } }) : null,
              atual ? h('button', { class: 'ghost sm', text: 'Concluir passo', onclick: function () { setLead(p, { passo: passo + 1 }); mudou('Concluiu "' + atual.titulo + '" no lead ' + p.nome); } }) : null)) : null,
          h('label', { class: 'mini' }, 'Reunião', reu),
          h('div', { class: 'acts' }, sel,
            p.email ? h('a', { class: 'btn', href: 'mailto:' + p.email + '?subject=' + encodeURIComponent(assunto) + '&body=' + encodeURIComponent(corpo), onclick: function () { if (leadSt(p.id) === 'Novo') { setLead(p, { status: 'E-mail enviado' }); mudou('Respondeu por e-mail o lead ' + p.nome); } } }, 'Responder por e-mail') : null,
            wa ? h('a', { class: 'btn wa', href: wa, target: '_blank', rel: 'noopener' }, 'WhatsApp') : null),
          h('div', { class: 'acts' },
            link && cliente(link) ? h('button', { class: 'link', text: 'Ver cliente: ' + nomeCli(link), onclick: function () { ir('clientes', { cBusca: nomeCli(link), cPac: '' }); } })
              : h('button', { class: 'ghost sm', text: 'Virar cliente', onclick: function () {
                var c = { id: uid('c'), nome: p.nome, empresa: p.empresa || '', nicho: '', cidade: '', whatsapp: p.whatsapp || '', email: p.email || '', origem: p.origem || 'Site oficial', status: 'ativo', desde: mesAtual(), obs: p.mensagem || '' };
                formCliente(c, function (nc) { setLead(p, { status: 'Fechado', clienteId: nc.id, fechadoEm: leadInfo(p.id).fechadoEm || new Date().toISOString() }); mudou('Lead ' + p.nome + ' virou cliente'); if (admin()) formContrato(null, nc.id); });
              } }),
            h('button', { class: 'link', style: 'margin-left:auto;color:var(--nevoa)', text: 'Excluir pedido', onclick: function () {
              if (!window.confirm('Excluir este pedido? Essa ação não pode ser desfeita.')) return;
              api('DELETE', '/api/pedidos', { id: p.id }).then(function () { S.pedidos = S.pedidos.filter(function (x) { return x.id !== p.id; }); delete S.db.leads[p.id]; mudou('Excluiu o pedido de ' + p.nome); }).catch(function () { sync('Não foi possível excluir.', true); });
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
          h('div', { class: 'meta' }, !admin() ? '' : mens ? 'Mensalidade: ' + brl(mens) : 'Sem mensalidade cadastrada', ent.length ? ' · ' + ent.length + ' entrega' + (ent.length > 1 ? 's' : '') + ' em andamento' : ''),
          h('div', { class: 'acts' },
            h('button', { class: 'ghost sm', text: 'Editar', onclick: function () { formCliente(c); } }),
            admin() ? h('button', { class: 'ghost sm', text: 'Contratos', onclick: function () { ir('contratos', { kCli: c.id, kSt: '' }); } }) : null,
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

  function abrirEntrega(e) {
    var dlg = $('#dlg'), form = $('#dlgForm');
    if (!Array.isArray(e.checklist)) e.checklist = (serv(e.servico).check || []).map(function (t) { return { t: t, ok: false }; });
    e.docs = e.docs || []; e.links = e.links || [];
    function salvarE(acao) { mudou(acao + ' · ' + e.titulo); abrirEntrega(e); }
    function lista(arr, titulo, ph, nomeItem) {
      var feitos = arr.filter(function (x) { return x.ok; }).length, inp = h('input', { placeholder: ph });
      function add() { var t = inp.value.trim(); if (!t) return; arr.push({ t: t.slice(0, 120), ok: false }); salvarE('Adicionou ' + nomeItem + ' "' + t + '"'); }
      inp.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); add(); } });
      return h('div', { class: 'blk' },
        h('h4', { text: titulo + (arr.length ? ' · ' + feitos + ' de ' + arr.length : '') }),
        arr.map(function (it, i) {
          var cb = h('input', { type: 'checkbox', onchange: function () { it.ok = cb.checked; salvarE((it.ok ? 'Marcou ' : 'Desmarcou ') + '"' + it.t + '"'); } }); cb.checked = !!it.ok;
          return h('div', { class: 'chk' + (it.ok ? ' ok' : '') }, h('label', null, cb, h('span', { text: it.t })), h('button', { type: 'button', class: 'link', 'aria-label': 'Remover', text: 'Remover', onclick: function () { arr.splice(i, 1); salvarE('Removeu "' + it.t + '"'); } }));
        }),
        h('div', { class: 'addrow' }, inp, h('button', { type: 'button', class: 'ghost sm', text: 'Adicionar', onclick: add })));
    }
    var lnome = h('input', { placeholder: 'Nome do link (ex.: Pasta no Drive)' }), lurl = h('input', { type: 'url', placeholder: 'https://' });
    var nota = h('input', { placeholder: 'Quem aprovou e como (ex.: Dr. José, pelo WhatsApp)' });
    form.textContent = ''; form.onsubmit = function (ev) { ev.preventDefault(); };
    form.appendChild(h('div', null,
      h('div', { class: 'tags' }, h('span', { class: 'tag f', text: serv(e.servico).nome }), h('span', { class: 'tag g', text: nomeCli(e.clienteId) }), e.prazo ? h('span', { class: 'tag ' + (atrasada(e) ? 'r' : 'g'), text: 'Prazo ' + dt(e.prazo) }) : null),
      h('h3', { style: 'margin-top:10px', text: e.titulo })));
    form.appendChild(lista(e.checklist, 'Checklist', 'Novo item do checklist', 'o item'));
    form.appendChild(lista(e.docs, 'Materiais e documentos do cliente', 'Ex.: Logo em PNG', 'o material'));
    form.appendChild(h('div', { class: 'blk' }, h('h4', { text: 'Links' }),
      e.links.map(function (l, i) { return h('div', { class: 'chk' }, /^https:\/\//.test(l.url) ? h('a', { href: l.url, target: '_blank', rel: 'noopener', text: l.t || l.url }) : h('span', { text: l.t }), h('button', { type: 'button', class: 'link', text: 'Remover', onclick: function () { e.links.splice(i, 1); salvarE('Removeu o link ' + (l.t || '')); } })); }),
      h('div', { class: 'addrow' }, lnome, lurl, h('button', { type: 'button', class: 'ghost sm', text: 'Adicionar', onclick: function () {
        var u = lurl.value.trim(); if (!/^https:\/\/\S+$/.test(u)) { lurl.focus(); sync('O link precisa começar com https://', true); return; }
        e.links.push({ t: lnome.value.trim().slice(0, 80) || u.slice(0, 80), url: u.slice(0, 500) }); salvarE('Adicionou um link');
      } })),
      h('p', { class: 'hint', text: 'Guarde só links. Senhas e acessos nunca ficam no painel.' })));
    form.appendChild(h('div', { class: 'blk' }, h('h4', { text: 'Aprovação do cliente' }),
      e.aprovadoEm ? h('div', { class: 'chk ok' }, h('span', { text: 'Aprovado em ' + dt(e.aprovadoEm) + (e.aprovadoNota ? ' · ' + e.aprovadoNota : '') }), h('button', { type: 'button', class: 'link', text: 'Desfazer', onclick: function () { e.aprovadoEm = ''; e.aprovadoNota = ''; salvarE('Desfez a aprovação'); } }))
        : h('div', { class: 'addrow' }, nota, h('button', { type: 'button', class: 'sm', text: 'Registrar aprovação', onclick: function () { e.aprovadoEm = hoje(); e.aprovadoNota = nota.value.trim().slice(0, 120); salvarE('Registrou a aprovação do cliente'); } }))));
    form.appendChild(h('div', { class: 'foot' }, h('button', { type: 'button', class: 'ghost', text: 'Editar dados', onclick: function () { dlg.close(); formEntrega(e); } }), h('div', null, h('button', { type: 'button', text: 'Fechar', onclick: function () { dlg.close(); } }))));
    if (!dlg.open) dlg.showModal();
  }

  function telaEntregas() {
    var abertas = S.db.entregas.filter(function (e) { return !e.concluida; }).sort(function (a, b) { return (a.prazo || '9999') < (b.prazo || '9999') ? -1 : 1; });
    var atr = abertas.filter(atrasada), and = abertas.filter(function (e) { return !atrasada(e); });
    var feitas = S.db.entregas.filter(function (e) { return e.concluida; });
    function card(e) {
      var et = serv(e.servico).etapas, i = Math.min(e.etapa || 0, et.length - 1), ck = e.checklist || [], feitos = ck.filter(function (x) { return x.ok; }).length;
      return h('article', { class: 'card' },
        h('div', { class: 'tags' }, h('span', { class: 'tag f', text: serv(e.servico).nome }), e.prazo ? h('span', { class: 'tag ' + (atrasada(e) ? 'r' : 'g'), text: (atrasada(e) ? 'Atrasada · ' : 'Prazo ') + dt(e.prazo) }) : null,
          ck.length ? h('span', { class: 'tag ' + (feitos === ck.length ? 'ok' : 'g'), text: 'Checklist ' + feitos + '/' + ck.length }) : null,
          e.aprovadoEm ? h('span', { class: 'tag ok', text: 'Aprovado pelo cliente' }) : null),
        h('h4', { text: e.titulo }),
        h('div', { class: 'meta', text: nomeCli(e.clienteId) + (e.responsavel ? ' · ' + e.responsavel : '') }),
        h('div', { class: 'steps' }, et.map(function (n, j) { return h('span', { class: e.concluida || j < i ? 'done' : j === i ? 'now' : '', text: n }); })),
        e.obs ? h('div', { class: 'msg', text: e.obs }) : null,
        h('div', { class: 'acts' },
          e.concluida ? h('button', { class: 'ghost sm', text: 'Reabrir', onclick: function () { e.concluida = false; mudou('Reabriu a entrega ' + e.titulo); } }) : [
            h('button', { class: 'ghost sm', text: 'Voltar etapa', disabled: i === 0, onclick: function () { e.etapa = i - 1; mudou('Voltou a entrega ' + e.titulo + ' para ' + et[i - 1]); } }),
            i < et.length - 1 ? h('button', { class: 'sm', text: 'Avançar para ' + et[i + 1], onclick: function () { e.etapa = i + 1; mudou('Avançou a entrega ' + e.titulo + ' para ' + et[i + 1]); } })
              : h('button', { class: 'sm', text: 'Concluir', onclick: function () { e.concluida = true; e.concluidaEm = hoje(); mudou('Concluiu a entrega ' + e.titulo); } })],
          h('button', { class: 'ghost sm', style: 'margin-left:auto', text: 'Abrir', onclick: function () { abrirEntrega(e); } })));
    }
    return h('div', null,
      cab('Entregas', 'Cada projeto na etapa em que está, com checklist, materiais, links e a aprovação do cliente.', [h('button', { class: 'sm', text: 'Nova entrega', onclick: function () { formEntrega(null); } })]),
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

  function esteira() {
    var e = (S.db.esteira || []).filter(function (g) { return PRODUTOS[g]; });
    ESTEIRA_PADRAO.forEach(function (g) { if (e.indexOf(g) < 0) e.push(g); });
    return e;
  }
  function gruposAtivos(cid) { var g = {}; contratosDe(cid).filter(ativo).forEach(function (k) { g[serv(k.servico).grupo] = 1; }); return g; }
  function telaEsteira() {
    var ordem = esteira(), ativos = S.db.clientes.filter(function (c) { return c.status === 'ativo'; });
    var tem = {}; ordem.forEach(function (g) { tem[g] = []; });
    var mapa = {}; ativos.forEach(function (c) { var g = gruposAtivos(c.id); mapa[c.id] = g; Object.keys(g).forEach(function (x) { if (tem[x]) tem[x].push(c); }); });
    var completos = ativos.filter(function (c) { return ordem.every(function (g) { return mapa[c.id][g]; }); });
    var semNada = ativos.filter(function (c) { return !Object.keys(mapa[c.id]).length; });
    function receita(g) {
      return S.db.contratos.filter(function (k) { return ativo(k) && serv(k.servico).grupo === g; }).reduce(function (o, k) { var v = Number(k.valor) || 0; if (k.tipo === 'recorrente') o.m += v; else o.u += v; return o; }, { m: 0, u: 0 });
    }
    function chipCli(c) { return h('button', { class: 'chip', text: c.nome, onclick: function () { ir('clientes', { cBusca: c.nome, cPac: '', cSt: 'ativo' }); } }); }
    function mover(i, d) { var o = ordem.slice(), x = o.splice(i, 1)[0]; o.splice(i + d, 0, x); S.db.esteira = o; mudou(); }
    var editando = !!S.f.esOrdem;

    var degraus = h('div', { class: 'ladder' }, ordem.map(function (g, i) {
      var r = receita(g), p = PRODUTOS[g], planos = null;
      if (g === 'espiaso') {
        var pro = 0, fpv = 0; S.db.contratos.forEach(function (k) { if (ativo(k) && k.servico === 'espiaso_pro') pro++; if (ativo(k) && k.servico === 'espiaso_fpv') fpv++; });
        planos = h('div', { class: 'meta', text: 'Pro: ' + pro + ' · Feito para você: ' + fpv });
      }
      return h('div', { class: 'rung' },
        h('div', { class: 'tags' }, h('span', { class: 'tag g', text: (i + 1) + 'º degrau' }), h('span', { class: 'tag ' + (p.tipo === 'Produto' ? 'f' : ''), text: p.tipo })),
        h('h4', { text: p.nome }),
        h('div', { class: 'big', text: String(tem[g].length) }),
        h('div', { class: 'meta', text: tem[g].length === 1 ? 'cliente ativo' : 'clientes ativos' }),
        planos,
        !admin() ? null : h('div', { class: 'meta', text: (r.m ? brl(r.m) + ' por mês' : '') + (r.m && r.u ? ' · ' : '') + (r.u ? brl(r.u) + ' em projetos' : '') || 'Sem valor cadastrado' }),
        editando ? h('div', { class: 'acts' },
          h('button', { class: 'ghost sm', 'aria-label': 'Mover para trás', text: '←', disabled: i === 0, onclick: function () { mover(i, -1); } }),
          h('button', { class: 'ghost sm', 'aria-label': 'Mover para frente', text: '→', disabled: i === ordem.length - 1, onclick: function () { mover(i, 1); } })) : null);
    }));

    var oport = ordem.map(function (g, i) {
      var donos = tem[g];
      var alvos = ordem.slice(i + 1).concat(ordem.slice(0, i));
      var linhas = alvos.map(function (alvo, j) {
        var podem = donos.filter(function (c) { return !mapa[c.id][alvo]; });
        if (!podem.length) return null;
        var prox = alvo === ordem[i + 1];
        return h('div', { class: 'opp' + (prox ? ' next' : '') },
          h('div', { class: 'opp-h' }, h('span', { text: (prox ? 'Próximo degrau: ' : '') + PRODUTOS[alvo].nome }), h('b', { text: String(podem.length) })),
          h('div', { class: 'chips' }, podem.map(chipCli)));
      }).filter(Boolean);
      return h('div', { class: 'panel' },
        h('h3', { text: 'Quem tem ' + PRODUTOS[g].nome }),
        !donos.length ? h('p', { class: 'meta', text: 'Nenhum cliente ativo neste degrau ainda.' })
          : linhas.length ? linhas : h('p', { class: 'meta', text: 'Todos que têm este produto já fecharam os outros.' }));
    });

    return h('div', null,
      cab('Esteira de produtos', 'Quantos clientes estão em cada produto ou serviço e o que cada um ainda pode ativar.',
        [h('button', { class: 'ghost sm', text: editando ? 'Pronto' : 'Mudar a ordem', onclick: function () { S.f.esOrdem = !editando; render(); } })]),
      degraus,
      h('div', { class: 'kpis', style: 'margin-top:18px' },
        kpi('Clientes ativos', String(ativos.length), ''),
        kpi('Fecharam tudo', String(completos.length), completos.length ? completos.map(function (c) { return c.nome; }).join(', ') : 'nenhum ainda'),
        kpi('Sem produto ativo', String(semNada.length), semNada.length ? semNada.map(function (c) { return c.nome; }).join(', ') : 'nenhum', semNada.length > 0)),
      h('p', { class: 'sec', text: 'Oportunidades por degrau' }),
      h('div', { class: 'grid2' }, oport));
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

  /* ---------- financeiro ---------- */
  function navMes(chave, m, aoMudar) {
    function vai(n) { S.f[chave] = addMeses(m, n); if (aoMudar) aoMudar(S.f[chave]); render(); }
    return h('div', { class: 'monthnav' },
      h('button', { class: 'ghost sm', 'aria-label': 'Mês anterior', text: '‹', onclick: function () { vai(-1); } }),
      h('b', { text: mesNome(m) }),
      h('button', { class: 'ghost sm', 'aria-label': 'Próximo mês', text: '›', onclick: function () { vai(1); } }),
      m !== mesAtual() ? h('button', { class: 'link', text: 'Voltar para hoje', onclick: function () { S.f[chave] = mesAtual(); render(); } }) : null);
  }
  function formCobranca(c) {
    var nova = !c; c = c || { id: uid('cb'), clienteId: '', ref: '', vencimento: hoje(), valor: 0, pago: false, forma: '' };
    abrirForm({
      titulo: nova ? 'Nova cobrança avulsa' : c.ref, valores: c,
      campos: [
        { k: 'clienteId', label: 'Cliente', type: 'select', vazio: 'Escolha o cliente', options: cliOpts(), req: true },
        { k: 'ref', label: 'Referente a', req: true, ph: 'Ex.: Ajuste extra na landing' },
        { k: 'valor', label: 'Valor (R$)', type: 'number', half: true }, { k: 'vencimento', label: 'Vencimento', type: 'date', half: true, req: true },
        { k: 'forma', label: 'Forma de pagamento', type: 'select', vazio: 'Não informado', options: ['Pix', 'Pix com desconto', 'Cartão à vista', 'Cartão até 6x sem juros', 'Cartão até 12x', 'Boleto', 'Recorrência no cartão'], half: true },
        { k: 'pagoEm', label: 'Pago em (deixe vazio se não pagou)', type: 'date', half: true }
      ],
      onSave: function (o) { Object.assign(c, o); c.pago = !!c.pagoEm; upsert(S.db.cobrancas, c); mudou((nova ? 'Criou' : 'Editou') + ' a cobrança ' + c.ref + ' de ' + nomeCli(c.clienteId)); },
      onDelete: nova ? null : function () { remover(S.db.cobrancas, c.id); mudou('Excluiu a cobrança ' + c.ref + ' de ' + nomeCli(c.clienteId)); }
    });
  }
  function formCusto(x) {
    var novo = !x; x = x || { id: uid('cu'), descricao: '', categoria: CUSTO_CAT[0], clienteId: '', valor: 0, recorrencia: 'mensal', data: hoje(), fim: '' };
    abrirForm({
      titulo: novo ? 'Novo custo' : x.descricao, valores: x,
      campos: [
        { k: 'descricao', label: 'Descrição', req: true, ph: 'Ex.: CapCut Pro, editor freelancer' },
        { k: 'categoria', label: 'Categoria', type: 'select', options: CUSTO_CAT, half: true },
        { k: 'clienteId', label: 'Ligado a um cliente?', type: 'select', vazio: 'Custo geral da agência', options: cliOpts(), half: true },
        { k: 'valor', label: 'Valor (R$)', type: 'number', half: true },
        { k: 'recorrencia', label: 'Repete?', type: 'select', options: [['mensal', 'Todo mês'], ['unico', 'Só uma vez']], half: true },
        { k: 'data', label: 'A partir de / data', type: 'date', half: true }, { k: 'fim', label: 'Até (se parou de pagar)', type: 'date', half: true }
      ],
      onSave: function (o) { Object.assign(x, o); upsert(S.db.custos, x); mudou((novo ? 'Lançou' : 'Editou') + ' o custo ' + x.descricao); },
      onDelete: novo ? null : function () { remover(S.db.custos, x.id); mudou('Excluiu o custo ' + x.descricao); }
    });
  }
  function telaFinanceiro() {
    var m = S.f.fMes || mesAtual();
    var cobs = S.db.cobrancas.filter(function (c) { return c.vencimento.slice(0, 7) === m; }).sort(function (a, b) { return a.vencimento < b.vencimento ? -1 : 1; });
    var outrasAtr = S.db.cobrancas.filter(function (c) { return cobAtrasada(c) && c.vencimento.slice(0, 7) !== m; }).sort(function (a, b) { return a.vencimento < b.vencimento ? -1 : 1; });
    var soma = function (l) { return l.reduce(function (s, c) { return s + (Number(c.valor) || 0); }, 0); };
    var previsto = soma(cobs), recebido = recebidoNoMes(m), aReceber = soma(cobs.filter(function (c) { return !c.pago; }));
    var atrasado = soma(S.db.cobrancas.filter(cobAtrasada)), custos = custosDoMes(m);
    function linhaCob(c) {
      var st = c.pago ? 'Pago em ' + dt(c.pagoEm) : cobAtrasada(c) ? 'Atrasada' : 'A receber';
      return h('div', { class: 'line fin' },
        h('div', { role: 'button', tabindex: '0', onclick: function () { formCobranca(c); } }, h('div', { text: nomeCli(c.clienteId) }), h('div', { class: 'sub', text: c.ref })),
        h('div', { class: 'sub', text: 'Vence ' + dt(c.vencimento) + (c.forma ? ' · ' + c.forma : '') }),
        h('div', { class: 'val', text: brl(c.valor) }),
        h('span', { class: 'tag ' + (c.pago ? 'ok' : cobAtrasada(c) ? 'r' : 'g'), text: st }),
        c.pago ? h('button', { class: 'link', text: 'Desfazer', onclick: function () { c.pago = false; c.pagoEm = ''; mudou('Desmarcou o pagamento de ' + c.ref + ' de ' + nomeCli(c.clienteId)); } })
          : h('button', { class: 'sm', text: 'Recebi', onclick: function () { c.pago = true; c.pagoEm = hoje(); mudou('Recebeu ' + brl(c.valor) + ' de ' + nomeCli(c.clienteId) + ' (' + c.ref + ')'); } }));
    }
    var custosMes = S.db.custos.filter(function (x) { return custoNoMes(x, m) > 0; });
    var porCli = S.db.clientes.map(function (c) { return { c: c, r: recebidoNoMes(m, c.id), k: custosDoMes(m, c.id) }; }).filter(function (x) { return x.r || x.k; }).sort(function (a, b) { return (b.r - b.k) - (a.r - a.k); });
    return h('div', null,
      cab('Financeiro', 'Cobranças de cada mês, o que já entrou, o que está atrasado, os custos e o lucro.', [
        h('button', { class: 'ghost sm', text: 'Novo custo', onclick: function () { formCusto(null); } }),
        h('button', { class: 'sm', text: 'Nova cobrança', onclick: function () { formCobranca(null); } })]),
      navMes('fMes', m, function (nm) { if (nm >= mesAtual()) { var n = gerarCobrancas(nm); if (n) salvar('Gerou ' + n + ' cobranças de ' + mesNome(nm)); } }),
      h('div', { class: 'kpis' },
        kpi('Previsto', brl(previsto), cobs.length + (cobs.length === 1 ? ' cobrança' : ' cobranças') + ' no mês'),
        kpi('Recebido', brl(recebido), 'pago dentro do mês'),
        kpi('A receber', brl(aReceber), 'deste mês'),
        kpi('Atrasado', brl(atrasado), 'somando todos os meses', atrasado > 0),
        kpi('Custos', brl(custos), custosMes.length + (custosMes.length === 1 ? ' lançamento' : ' lançamentos')),
        kpi('Lucro', brl(recebido - custos), 'recebido menos custos', recebido - custos < 0)),
      h('p', { class: 'sec', text: 'Cobranças de ' + mesNome(m) }),
      cobs.length ? h('div', { class: 'list' }, cobs.map(linhaCob)) : h('p', { class: 'empty', text: 'Nenhuma cobrança neste mês. Elas são criadas sozinhas a partir dos contratos com valor preenchido.' }),
      outrasAtr.length ? [h('p', { class: 'sec', text: 'Atrasadas de outros meses · ' + outrasAtr.length }), h('div', { class: 'list' }, outrasAtr.map(linhaCob))] : null,
      h('p', { class: 'sec', text: 'Custos de ' + mesNome(m) }),
      custosMes.length ? h('div', { class: 'list' }, custosMes.map(function (x) {
        return h('div', { class: 'line fin', role: 'button', tabindex: '0', onclick: function () { formCusto(x); } },
          h('div', null, h('div', { text: x.descricao }), h('div', { class: 'sub', text: x.categoria })),
          h('div', { class: 'sub', text: x.clienteId ? nomeCli(x.clienteId) : 'Geral da agência' }),
          h('div', { class: 'val', text: brl(custoNoMes(x, m)) }),
          h('span', { class: 'tag g', text: x.recorrencia === 'mensal' ? 'Todo mês' : 'Uma vez' }), h('span'));
      })) : h('p', { class: 'empty', text: 'Nenhum custo lançado neste mês.' }),
      porCli.length ? [h('p', { class: 'sec', text: 'Resultado por cliente em ' + mesNome(m) }), h('div', { class: 'panel' }, h('div', { class: 'rows' }, porCli.map(function (x) {
        return h('div', { class: 'row' }, h('span', null, h('b', { text: x.c.nome }), h('span', { class: 'meta', text: ' · recebido ' + brl(x.r) + (x.k ? ', custos ' + brl(x.k) : '') })), h('b', { style: x.r - x.k < 0 ? 'color:var(--erro)' : '', text: brl(x.r - x.k) }));
      })))] : null);
  }

  /* ---------- tráfego pago ---------- */
  function formTrafego(cid, m, r) {
    var novo = !r; r = r || { id: uid('t'), clienteId: cid, mes: m, verba: 0, leads: 0, conversas: 0, vendas: 0, obs: '' };
    abrirForm({
      titulo: nomeCli(cid) + ' · ' + mesNome(m), valores: r,
      campos: [
        { k: 'verba', label: 'Investimento em anúncios (R$)', type: 'number', half: true, hint: 'Verba do cliente, separada do valor do serviço.' },
        { k: 'leads', label: 'Leads', type: 'number', half: true },
        { k: 'conversas', label: 'Conversas no WhatsApp', type: 'number', half: true }, { k: 'vendas', label: 'Vendas ou agendamentos', type: 'number', half: true },
        { k: 'obs', label: 'O que funcionou e próximos passos', type: 'textarea', rows: 3 }
      ],
      onSave: function (o) { ['leads', 'conversas', 'vendas'].forEach(function (k) { o[k] = Math.max(0, Math.round(o[k])); }); Object.assign(r, o); upsert(S.db.trafego, r); mudou('Lançou o resultado de tráfego de ' + nomeCli(cid) + ' em ' + mesNome(m)); },
      onDelete: novo ? null : function () { remover(S.db.trafego, r.id); mudou('Excluiu o resultado de tráfego de ' + nomeCli(cid) + ' em ' + mesNome(m)); }
    });
  }
  function relatorio(r) {
    var cpl = r.leads ? r.verba / r.leads : 0;
    return 'Relatório de tráfego pago · ' + mesNome(r.mes) + '\n' + nomeCli(r.clienteId) + '\n\n' +
      'Investimento: ' + brl(r.verba) + '\nLeads: ' + r.leads + '\nCusto por lead: ' + (r.leads ? brl(cpl) : 'sem leads') +
      (r.conversas ? '\nConversas no WhatsApp: ' + r.conversas : '') + (r.vendas ? '\nVendas ou agendamentos: ' + r.vendas : '') +
      (r.obs ? '\n\n' + r.obs : '') + '\n\nEquipe Marketing Vision';
  }
  function telaTrafego() {
    var m = S.f.tMes || mesAtual();
    var comTrafego = {}; S.db.contratos.forEach(function (k) { if (ativo(k) && serv(k.servico).grupo === 'trafego') comTrafego[k.clienteId] = 1; });
    S.db.trafego.forEach(function (r) { if (r.mes === m) comTrafego[r.clienteId] = 1; });
    var ids = Object.keys(comTrafego).filter(cliente).sort(function (a, b) { return nomeCli(a).localeCompare(nomeCli(b)); });
    var doMes = S.db.trafego.filter(function (r) { return r.mes === m; });
    var verba = doMes.reduce(function (s, r) { return s + (Number(r.verba) || 0); }, 0), leads = doMes.reduce(function (s, r) { return s + (Number(r.leads) || 0); }, 0);
    return h('div', null,
      cab('Tráfego pago', 'Resultado de cada cliente no mês: investimento, leads e custo por lead. Base do relatório mensal.'),
      navMes('tMes', m),
      h('div', { class: 'kpis' },
        kpi('Clientes com tráfego', String(ids.length), doMes.length + ' com resultado lançado'),
        kpi('Investimento', brl(verba), 'verba dos clientes no mês'),
        kpi('Leads', String(leads), 'gerados no mês'),
        kpi('Custo por lead', leads ? brl(verba / leads) : 'sem dados', 'média do mês')),
      ids.length ? h('div', { class: 'cards' }, ids.map(function (cid) {
        var r = doMes.find(function (x) { return x.clienteId === cid; });
        var hist = S.db.trafego.filter(function (x) { return x.clienteId === cid; }).sort(function (a, b) { return a.mes < b.mes ? 1 : -1; }).slice(0, 6);
        return h('article', { class: 'card' },
          h('h4', { text: nomeCli(cid) }),
          r ? h('div', { class: 'tmini' },
            h('div', null, h('span', { text: 'Investimento' }), h('b', { text: brl(r.verba) })),
            h('div', null, h('span', { text: 'Leads' }), h('b', { text: String(r.leads) })),
            h('div', null, h('span', { text: 'Custo por lead' }), h('b', { text: r.leads ? brl(r.verba / r.leads) : 'sem leads' })),
            r.vendas ? h('div', null, h('span', { text: 'Vendas' }), h('b', { text: String(r.vendas) })) : null)
            : h('p', { class: 'meta', text: 'Resultado de ' + mesNome(m) + ' ainda não lançado.' }),
          S.f.tHist === cid && hist.length ? h('div', { class: 'rows' }, hist.map(function (x) { return h('div', { class: 'row' }, h('span', { text: mesNome(x.mes) }), h('span', { class: 'meta', text: brl(x.verba) + ' · ' + x.leads + ' leads · ' + (x.leads ? brl(x.verba / x.leads) + ' por lead' : 'sem leads') })); })) : null,
          h('div', { class: 'acts' },
            h('button', { class: r ? 'ghost sm' : 'sm', text: r ? 'Editar' : 'Lançar resultado', onclick: function () { formTrafego(cid, m, r); } }),
            r ? h('button', { class: 'ghost sm', text: 'Copiar relatório', onclick: function () { copiar(relatorio(r)); } }) : null,
            hist.length ? h('button', { class: 'link', text: S.f.tHist === cid ? 'Esconder histórico' : 'Histórico', onclick: function () { S.f.tHist = S.f.tHist === cid ? null : cid; render(); } }) : null));
      })) : h('p', { class: 'empty', text: 'Nenhum cliente com contrato de tráfego pago ativo.' }));
  }

  /* ---------- avisos (push) ---------- */
  function suportaPush() { return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window; }
  function registrarSW() {
    if (!('serviceWorker' in navigator)) { S.pushEstado = 'sem'; return; }
    navigator.serviceWorker.register('/sw.js').then(function () { return estadoPush(); }).then(function (e) { if (S.pushEstado !== e) { S.pushEstado = e; render(); } }).catch(function () {});
  }
  function b64u8(b) { var p = '='.repeat((4 - b.length % 4) % 4), s = atob((b + p).replace(/-/g, '+').replace(/_/g, '/')), a = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a; }
  function estadoPush() {
    if (!suportaPush()) return Promise.resolve('sem');
    if (Notification.permission === 'denied') return Promise.resolve('bloqueado');
    return navigator.serviceWorker.ready.then(function (r) { return r.pushManager.getSubscription(); }).then(function (s) { return s ? 'ativo' : 'inativo'; });
  }
  function ativarAvisos() {
    if (!suportaPush()) return Promise.reject(new Error('sem'));
    return navigator.serviceWorker.register('/sw.js').then(function () { return Notification.requestPermission(); }).then(function (perm) {
      if (perm !== 'granted') { var e = new Error('perm'); e.perm = perm; throw e; }
      return Promise.all([navigator.serviceWorker.ready, api('GET', '/api/push')]);
    }).then(function (r) {
      return r[0].pushManager.getSubscription().then(function (s) { return s || r[0].pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64u8(r[1].publicKey) }); });
    }).then(function (sub) { return api('POST', '/api/push', { sub: sub.toJSON(), aparelho: (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '' }); });
  }
  function avisoErro(e) {
    if (e && e.message === 'sem') sync('Este navegador não recebe avisos. No iPhone, adicione o painel à tela de início primeiro.', true);
    else if (e && e.message === 'perm') sync('Os avisos foram bloqueados. Libere nas configurações do navegador.', true);
    else sync('Não foi possível ativar os avisos agora.', true);
  }

  /* ---------- configurações ---------- */
  function carregarConfig() {
    S.cfg = { carregando: true };
    Promise.all([
      api('GET', '/api/equipe').catch(function () { return { membros: [] }; }),
      api('GET', '/api/push').catch(function () { return { total: 0 }; }),
      api('GET', '/api/central?backups=1').catch(function () { return { itens: [] }; }),
      api('GET', '/api/integracao').catch(function () { return {}; })
    ]).then(function (r) { S.cfg = { membros: r[0].membros || [], aparelhos: r[1].total || 0, backups: r[2].itens || [], chave: r[3].chave || '' }; render(); });
  }
  function mostrarChave(titulo, texto, chave) {
    var dlg = $('#dlg'), form = $('#dlgForm');
    form.textContent = ''; form.onsubmit = function (ev) { ev.preventDefault(); dlg.close(); };
    form.appendChild(h('h3', { text: titulo }));
    form.appendChild(h('p', { class: 'meta', text: texto }));
    form.appendChild(h('div', { class: 'key', text: chave }));
    form.appendChild(h('div', { class: 'foot' }, h('button', { type: 'button', class: 'ghost', text: 'Copiar', onclick: function () { copiar(chave); } }), h('div', null, h('button', { type: 'submit', text: 'Já guardei' }))));
    dlg.showModal();
  }
  function exportar(qual) {
    var db = S.db, d = hoje(), L;
    if (qual === 'json') return api('GET', '/api/central?baixar=db/central.json').then(function (j) { baixar('painel-marketing-vision-' + d + '.json', JSON.stringify(j, null, 2), 'application/json'); });
    if (qual === 'clientes') L = [['Nome', 'Empresa', 'Nicho', 'Cidade', 'WhatsApp', 'E-mail', 'Origem', 'Status', 'Desde', 'Pacote', 'Mensalidade']].concat(db.clientes.map(function (c) { return [c.nome, c.empresa, c.nicho, c.cidade, c.whatsapp, c.email, c.origem, c.status, c.desde, pacote(c.id), num(mensalCliente(c.id))]; }));
    if (qual === 'contratos') L = [['Cliente', 'Serviço', 'Cobrança', 'Valor', 'Início', 'Fim', 'Status', 'Pagamento', 'Dia do vencimento', 'Parcelas']].concat(db.contratos.map(function (k) { return [nomeCli(k.clienteId), serv(k.servico).nome, k.tipo, num(k.valor), k.inicio, k.fim, k.status, k.pagamento, k.diaVenc, k.parcelas]; }));
    if (qual === 'cobrancas') L = [['Cliente', 'Referente a', 'Vencimento', 'Valor', 'Pago', 'Pago em', 'Forma']].concat(db.cobrancas.map(function (c) { return [nomeCli(c.clienteId), c.ref, c.vencimento, num(c.valor), c.pago ? 'sim' : 'não', c.pagoEm, c.forma]; }));
    if (qual === 'custos') L = [['Descrição', 'Categoria', 'Cliente', 'Valor', 'Repete', 'Data', 'Até']].concat(db.custos.map(function (x) { return [x.descricao, x.categoria, x.clienteId ? nomeCli(x.clienteId) : 'Geral', num(x.valor), x.recorrencia === 'mensal' ? 'todo mês' : 'uma vez', x.data, x.fim]; }));
    if (qual === 'trafego') L = [['Cliente', 'Mês', 'Investimento', 'Leads', 'Custo por lead', 'Conversas', 'Vendas', 'Observações']].concat(db.trafego.map(function (r) { return [nomeCli(r.clienteId), r.mes, num(r.verba), r.leads, r.leads ? num(r.verba / r.leads) : '', r.conversas, r.vendas, r.obs]; }));
    if (qual === 'leads') L = [['Recebido', 'Nome', 'Empresa', 'WhatsApp', 'E-mail', 'Origem', 'Interesses', 'Status', 'Motivo da perda', 'Reunião']].concat(S.pedidos.map(function (p) { var l = leadInfo(p.id); return [p.recebido, p.nome, p.empresa, p.whatsapp, p.email, p.origem || 'Site oficial', (p.interesses || []).join(', '), leadSt(p.id), l.motivo, l.reuniao]; }));
    baixar(qual + '-' + d + '.csv', csv(L), 'text/csv;charset=utf-8');
  }
  function telaConfig() {
    if (!S.cfg) { carregarConfig(); }
    var c = S.cfg || {};
    if (c.carregando) return h('div', null, cab('Configurações'), h('p', { class: 'empty', text: 'Carregando…' }));
    var url = location.origin + '/api/integracao';
    var exemplo = JSON.stringify({ id: 'assinatura-123', nome: 'Ana Souza', email: 'ana@exemplo.com', whatsapp: '62999990000', plano: 'pro', meses: 6, inicio: hoje(), status: 'ativa' }, null, 2);
    var estado = { ativo: 'Este aparelho recebe avisos.', inativo: 'Este aparelho ainda não recebe avisos.', bloqueado: 'Os avisos estão bloqueados neste navegador. Libere nas configurações do navegador.', sem: 'Este navegador não recebe avisos. No iPhone, abra o painel no Safari, toque em Compartilhar e em Adicionar à Tela de Início, e ative por lá.' }[S.pushEstado || 'inativo'];
    return h('div', null,
      cab('Configurações', 'Avisos, equipe, cópias de segurança, exportação e integrações.'),
      h('div', { class: 'grid2' },
        h('div', { class: 'panel' }, h('h3', { text: 'Avisos no celular e no computador' }),
          h('p', { class: 'meta', text: estado }),
          h('p', { class: 'meta', text: 'Você recebe um aviso a cada pedido novo e um resumo às 8h com leads parados, amostras vencendo, reuniões, cobranças e entregas atrasadas. ' + c.aparelhos + (c.aparelhos === 1 ? ' aparelho cadastrado.' : ' aparelhos cadastrados.') }),
          h('div', { class: 'acts' },
            S.pushEstado !== 'ativo' ? h('button', { class: 'sm', text: 'Ativar neste aparelho', onclick: function () { ativarAvisos().then(function () { S.pushEstado = 'ativo'; sync('Avisos ativados neste aparelho'); carregarConfig(); }).catch(avisoErro); } }) : null,
            h('button', { class: 'ghost sm', text: 'Enviar aviso de teste', onclick: function () { api('POST', '/api/push?teste=1', {}).then(function (r) { sync(r.enviados ? 'Aviso de teste enviado' : 'Nenhum aparelho recebe avisos ainda', !r.enviados); }).catch(function () { sync('Não foi possível enviar o teste.', true); }); } }))),
        h('div', { class: 'panel' }, h('h3', { text: 'Equipe' }),
          h('p', { class: 'meta', text: 'Cada pessoa entra com a própria chave. Quem é da equipe vê leads, clientes, entregas, tráfego, workflow e habilidades, mas não vê valores, contratos, financeiro nem esta tela.' }),
          c.membros.length ? h('div', { class: 'rows' }, c.membros.map(function (m) {
            return h('div', { class: 'row' }, h('span', null, h('b', { text: m.nome }), h('span', { class: 'meta', text: ' · ' + (m.papel === 'admin' ? 'administrador' : 'equipe') + ' · desde ' + dt(m.criadoEm) })),
              h('button', { class: 'link', style: 'color:var(--erro)', text: 'Tirar acesso', onclick: function () { if (!window.confirm('Tirar o acesso de ' + m.nome + '? A chave dela para de funcionar na hora.')) return; api('DELETE', '/api/equipe', { id: m.id }).then(function () { S.db.log.unshift({ em: new Date().toISOString(), quem: S.eu.nome, acao: 'Tirou o acesso de ' + m.nome }); carregarConfig(); }); } }));
          })) : h('p', { class: 'meta', text: 'Só você tem acesso por enquanto.' }),
          h('div', { class: 'acts' }, h('button', { class: 'sm', text: 'Adicionar pessoa', onclick: function () {
            abrirForm({ titulo: 'Dar acesso ao painel', valores: { papel: 'equipe' }, textoSalvar: 'Criar chave',
              campos: [{ k: 'nome', label: 'Nome', req: true }, { k: 'papel', label: 'Acesso', type: 'select', options: [['equipe', 'Equipe (sem financeiro)'], ['admin', 'Administrador (tudo)']] }],
              onSave: function (o) { api('POST', '/api/equipe', o).then(function (r) { carregarConfig(); mostrarChave('Chave de ' + r.membro.nome, 'Envie esta chave para ' + primeiro(r.membro.nome) + ' por um canal seguro. Ela aparece só agora; se perder, tire o acesso e crie outra.', r.chave); }).catch(function () { sync('Não foi possível criar o acesso.', true); }); } });
          } }))),
        h('div', { class: 'panel' }, h('h3', { text: 'Cópias de segurança' }),
          h('p', { class: 'meta', text: 'Uma cópia de tudo é guardada automaticamente a cada dia em que algo muda. Ficam as últimas 30.' }),
          c.backups.length ? h('div', { class: 'rows' }, c.backups.slice(0, 10).map(function (b) {
            return h('div', { class: 'row' }, h('span', { text: dt(b.data) }), h('span', { class: 'acts', style: 'margin:0' },
              h('button', { class: 'link', text: 'Baixar', onclick: function () { api('GET', '/api/central?baixar=' + encodeURIComponent(b.id)).then(function (j) { baixar('copia-painel-' + b.data + '.json', JSON.stringify(j, null, 2), 'application/json'); }); } }),
              h('button', { class: 'link', style: 'color:var(--alerta)', text: 'Restaurar', onclick: function () {
                if (!window.confirm('Voltar o painel para como estava em ' + dt(b.data) + '? O que mudou depois disso será desfeito (a versão atual vira a cópia de hoje).')) return;
                api('POST', '/api/central?restaurar=' + encodeURIComponent(b.id), {}).then(function () { sync('Cópia restaurada'); carregar(); }).catch(function () { sync('Não foi possível restaurar.', true); });
              } })));
          })) : h('p', { class: 'meta', text: 'A primeira cópia é feita na próxima alteração.' })),
        h('div', { class: 'panel' }, h('h3', { text: 'Exportar planilhas' }),
          h('p', { class: 'meta', text: 'Arquivos que abrem no Excel e no Google Planilhas.' }),
          h('div', { class: 'acts' }, [['clientes', 'Clientes'], ['contratos', 'Contratos'], ['cobrancas', 'Cobranças'], ['custos', 'Custos'], ['trafego', 'Tráfego'], ['leads', 'Leads']].map(function (x) { return h('button', { class: 'ghost sm', text: x[1], onclick: function () { exportar(x[0]); } }); }),
            h('button', { class: 'ghost sm', text: 'Tudo (arquivo completo)', onclick: function () { exportar('json'); } }))),
        h('div', { class: 'panel' }, h('h3', { text: 'Integração com o Espia só' }),
          h('p', { class: 'meta', text: 'Quando a plataforma do Espia só estiver no ar, ela avisa o painel a cada assinatura. O cliente e o contrato entram sozinhos, e você recebe um aviso.' }),
          h('div', { class: 'rows' },
            h('div', { class: 'row' }, h('span', { text: 'Endereço' }), h('button', { class: 'link', text: 'Copiar', onclick: function () { copiar(url); } })),
            h('div', { class: 'row' }, h('span', { text: 'Chave da integração' }), h('button', { class: 'link', text: 'Mostrar', onclick: function () { mostrarChave('Chave da integração do Espia só', 'Vai no cabeçalho x-integracao das chamadas da plataforma para ' + url + '. Não compartilhe fora do código da plataforma.', c.chave || 'Indisponível'); } }))),
          h('details', null, h('summary', { class: 'meta', text: 'Exemplo do que a plataforma envia' }), h('pre', { class: 'msg', text: exemplo }))),
        h('div', { class: 'panel' }, h('h3', { text: 'Histórico de alterações' }),
          (S.db.log || []).length ? h('div', { class: 'rows log' }, S.db.log.slice(0, 60).map(function (x) { return h('div', { class: 'row' }, h('span', null, h('b', { text: x.quem }), h('span', { text: ' ' + x.acao })), h('span', { class: 'meta', text: dth(x.em) })); })) : h('p', { class: 'meta', text: 'As alterações começam a aparecer aqui.' }))));
  }

  /* ---------- construtor de processos (React Flow, carregado só quando a aba abre) ---------- */
  var fluxosCarregando = null;
  function carregarFluxos() {
    if (window.MVFluxos) return Promise.resolve();
    if (fluxosCarregando) return fluxosCarregando;
    var css = h('link', { rel: 'stylesheet', href: '/css/fluxos.css?v=1' }); document.head.appendChild(css);
    fluxosCarregando = new Promise(function (ok, erro) { var sc = h('script', { src: '/js/fluxos.js?v=1' }); sc.onload = ok; sc.onerror = function () { fluxosCarregando = null; erro(); }; document.body.appendChild(sc); });
    return fluxosCarregando;
  }
  function telaFluxos() {
    var area = h('div', { class: 'fluxos-area' }, h('p', { class: 'empty', text: 'Carregando o construtor…' }));
    var wrap = h('div', { class: 'fluxos-tela' },
      cab('Construtor de processos', 'Mapa interativo da jornada do cliente, do primeiro contato ao contrato. Monte, conecte e teste o processo etapa por etapa.'),
      area);
    carregarFluxos().then(function () {
      if (!area.isConnected) return;
      area.textContent = '';
      S.fluxUnmount = window.MVFluxos.mount(area, {
        fluxos: JSON.parse(JSON.stringify(S.db.fluxos || [])), podeEditar: true,
        onSalvar: function (lista, acao) { S.db.fluxos = JSON.parse(JSON.stringify(lista)); salvar(acao); }
      });
    }).catch(function () { area.textContent = ''; area.appendChild(h('p', { class: 'empty', text: 'Não foi possível carregar o construtor. Confira a internet e abra a aba de novo.' })); });
    return wrap;
  }

  var TELAS = { fluxos: telaFluxos, geral: telaGeral, esteira: telaEsteira, financeiro: telaFinanceiro, trafego: telaTrafego, config: telaConfig, leads: telaLeads, clientes: telaClientes, contratos: telaContratos, entregas: telaEntregas, workflow: telaWorkflow, habilidades: telaHab };
  function render() {
    if (!S.db) return;
    var abertos = S.pedidos.filter(function (p) { return leadSt(p.id) === 'Novo'; }).length;
    var atr = S.db.entregas.filter(atrasada).length, nav = $('#tabs');
    nav.textContent = '';
    TABS.forEach(function (t) {
      if (t[2] && !admin()) return;
      var n = t[0] === 'leads' ? abertos : t[0] === 'entregas' ? atr : t[0] === 'financeiro' ? S.db.cobrancas.filter(cobAtrasada).length : 0;
      nav.appendChild(h('button', { type: 'button', 'aria-current': S.tab === t[0] ? 'page' : null, onclick: function () { menu(false); ir(t[0]); } }, icone(t[0]), h('span', { text: t[1] }), n ? h('span', { class: 'n', text: String(n) }) : null));
      if (S.tab === t[0]) $('#mTitle').textContent = t[1];
    });
    if (S.fluxUnmount) { try { S.fluxUnmount(); } catch (e) {} S.fluxUnmount = null; }
    document.body.classList.toggle('tela-fluxos', S.tab === 'fluxos');
    var v = $('#view'); v.textContent = ''; v.appendChild(TELAS[S.tab]());
    try { history.replaceState(null, '', '#' + S.tab); } catch (e) {}
  }

  /* ---------- início ---------- */
  var hash = (location.hash || '').slice(1); if (TELAS[hash]) S.tab = hash;
  $('#login').addEventListener('submit', function (e) { e.preventDefault(); setKey($('#k').value.trim()); $('#k').value = ''; carregar(); });
  $('#logout').addEventListener('click', function () { clearKey(); S.db = null; S.cfg = null; S.eu = null; showLogin(); });
  $('#menuBtn').addEventListener('click', function () { menu(!document.body.classList.contains('menu-open')); });
  $('#scrim').addEventListener('click', function () { menu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') menu(false); });
  carregar();
})();
