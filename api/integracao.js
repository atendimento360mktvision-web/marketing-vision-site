// Ponto de entrada para a plataforma Espia só avisar o painel sobre assinaturas.
// GET (admin): mostra o endereço e a chave da integração. POST (com cabeçalho x-integracao): registra a assinatura,
// criando ou atualizando o cliente e o contrato do Espia só no painel central.
const crypto = require('crypto');
const { readLimited, json, same } = require('./_lib/util');
const { readJson, writeJson, conflito } = require('./_lib/store');
const { quem } = require('./_lib/auth');
const avisos = require('./_lib/avisos');

const CFG = 'db/integracao.json';
const PLANOS = { pro: { servico: 'espiaso_pro', preco: 9.97 }, fpv: { servico: 'espiaso_fpv', preco: 39.97 } };
function limpa(s, n) { return String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, n); }
function addMeses(iso, n) { const d = new Date(iso + 'T12:00:00Z'); d.setUTCMonth(d.getUTCMonth() + n); return d.toISOString().slice(0, 10); }

async function chave() {
  const r = await readJson(CFG);
  if (r && r.data && r.data.chave) return r.data.chave;
  const k = crypto.randomBytes(24).toString('base64url');
  await writeJson(CFG, { chave: k, criadaEm: new Date().toISOString() });
  return k;
}

async function registrar(a) {
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    const atual = await readJson('db/central.json');
    if (!atual) throw new Error('sem dados');
    const db = atual.data;
    db.clientes = db.clientes || []; db.contratos = db.contratos || [];
    let c = db.clientes.find(x => (a.email && (x.email || '').toLowerCase() === a.email) || (a.idExterno && x.espiasoId === a.idExterno));
    let novo = false;
    if (!c) {
      novo = true;
      c = { id: 'c-' + crypto.randomBytes(5).toString('hex'), nome: a.nome || a.email, empresa: a.empresa, nicho: '', cidade: '', whatsapp: a.whatsapp, email: a.email, origem: 'LP Espia só', status: 'ativo', desde: a.inicio.slice(0, 7), obs: 'Criado pela integração do Espia só.' };
      db.clientes.push(c);
    }
    if (a.idExterno) c.espiasoId = a.idExterno;
    const p = PLANOS[a.plano];
    let k = db.contratos.find(x => x.clienteId === c.id && (x.servico === 'espiaso_pro' || x.servico === 'espiaso_fpv') && x.status !== 'encerrado');
    if (!k) { k = { id: 'k-' + crypto.randomBytes(5).toString('hex'), clienteId: c.id, tipo: 'recorrente', obs: 'Assinatura pela plataforma Espia só.', diaVenc: Number(a.inicio.slice(8, 10)) || 10 }; db.contratos.push(k); }
    Object.assign(k, { servico: p.servico, valor: p.preco, inicio: a.inicio, fim: addMeses(a.inicio, a.meses), status: a.status === 'cancelada' ? 'encerrado' : 'ativo', pagamento: 'Recorrência no cartão' });
    const acao = (a.status === 'cancelada' ? 'Espia só: assinatura cancelada de ' : 'Espia só: assinatura ' + (a.plano === 'pro' ? 'Pro' : 'Feito para você') + ' de ') + c.nome;
    db.log = [{ em: new Date().toISOString(), quem: 'Integração Espia só', acao }].concat(db.log || []).slice(0, 300);
    try { await writeJson('db/central.json', db, atual.etag); return { cliente: c.id, contrato: k.id, novo, acao }; }
    catch (e) { if (!conflito(e)) throw e; }
  }
  throw new Error('conflito');
}

module.exports = async (req, res) => {
  res.setHeader('X-Robots-Tag', 'noindex');
  try {
    if (req.method === 'GET') {
      const eu = await quem(req).catch(() => null);
      if (!eu) return json(res, 401);
      if (eu.papel !== 'admin') return json(res, 403);
      return json(res, 200, { chave: await chave() });
    }
    if (req.method !== 'POST') return json(res, 405);
    const k = await chave();
    if (!same(String(req.headers['x-integracao'] || '').slice(0, 100), k)) return json(res, 401);
    const raw = await readLimited(req, 5000);
    let b = {}; try { b = JSON.parse(raw || '{}'); } catch (e) { return json(res, 400); }
    const a = {
      idExterno: limpa(b.id, 80), nome: limpa(b.nome, 80), empresa: limpa(b.empresa, 80), email: limpa(b.email, 120).toLowerCase(),
      whatsapp: limpa(b.whatsapp, 25), plano: b.plano === 'fpv' ? 'fpv' : 'pro', meses: [3, 6, 12].indexOf(Number(b.meses)) > -1 ? Number(b.meses) : 3,
      inicio: /^\d{4}-\d{2}-\d{2}$/.test(String(b.inicio || '')) ? b.inicio : new Date().toISOString().slice(0, 10), status: b.status === 'cancelada' ? 'cancelada' : 'ativa'
    };
    if (!a.email && !a.idExterno) return json(res, 400, { erro: 'email ou id' });
    const r = await registrar(a);
    await avisos.enviarRapido({ title: 'Espia só', body: r.acao, url: '/painel#esteira' }, 3000);
    return json(res, 200, Object.assign({ ok: true }, r));
  } catch (e) {
    console.error('integracao', e && e.message);
    return json(res, 503, { erro: 'integracao' });
  }
};
