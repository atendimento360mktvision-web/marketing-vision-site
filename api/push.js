// Avisos do painel no celular e no computador.
// GET: chave pública e quantos aparelhos recebem avisos. POST: inscreve este aparelho. DELETE: remove.
// POST ?teste=1: manda um aviso de teste. GET ?lembrete=1: resumo diário (chamado pelo agendamento da Vercel, no máximo uma vez por dia).
const { readLimited, json } = require('./_lib/util');
const { readJson, writeJson, lerPedidos } = require('./_lib/store');
const { quem } = require('./_lib/auth');
const avisos = require('./_lib/avisos');

function hojeBR() { return new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10); }

async function resumo() {
  const c = await readJson('db/central.json');
  if (!c) return null;
  const db = c.data, agora = Date.now(), hoje = hojeBR(), partes = [];
  const ped = (await lerPedidos(200)).itens;
  const st = id => ((db.leads || {})[id] || {}).status || 'Novo';
  const parados = ped.filter(p => st(p.id) === 'Novo' && agora - Date.parse(p.recebido) > 24 * 3600e3).length;
  const amostras = ped.filter(p => p.origem === 'LP Marketing Vision' && ['Novo', 'E-mail enviado', 'Reunião marcada'].indexOf(st(p.id)) > -1 && Date.parse(p.recebido) + 48 * 3600e3 - agora < 24 * 3600e3).length;
  const reunioes = Object.keys(db.leads || {}).filter(k => (db.leads[k].reuniao || '').slice(0, 10) === hoje).length;
  const atrasadas = (db.cobrancas || []).filter(x => !x.pago && x.vencimento < hoje).length;
  const entregas = (db.entregas || []).filter(e => !e.concluida && e.prazo && e.prazo < hoje).length;
  if (parados) partes.push(parados + (parados > 1 ? ' leads sem resposta há mais de 24h' : ' lead sem resposta há mais de 24h'));
  if (amostras) partes.push(amostras + (amostras > 1 ? ' amostras vencem em menos de 24h' : ' amostra vence em menos de 24h'));
  if (reunioes) partes.push(reunioes + (reunioes > 1 ? ' reuniões hoje' : ' reunião hoje'));
  if (atrasadas) partes.push(atrasadas + (atrasadas > 1 ? ' cobranças atrasadas' : ' cobrança atrasada'));
  if (entregas) partes.push(entregas + (entregas > 1 ? ' entregas atrasadas' : ' entrega atrasada'));
  return partes;
}

module.exports = async (req, res) => {
  res.setHeader('X-Robots-Tag', 'noindex');
  const q = req.query || {};
  try {
    if (req.method === 'GET' && q.lembrete) {
      const r = await readJson('db/lembrete.json');
      if (r && r.data && r.data.dia === hojeBR()) return json(res, 200, { ok: true, ja: true });
      await writeJson('db/lembrete.json', { dia: hojeBR() }, r && r.etag);
      const partes = await resumo();
      if (partes && partes.length) await avisos.enviar({ title: 'Bom dia! Atenção no painel', body: partes.join(' · '), url: '/painel#geral' });
      return json(res, 200, { ok: true, itens: partes ? partes.length : 0 });
    }

    const eu = await quem(req).catch(() => null);
    if (!eu) return json(res, 401);
    if (req.method === 'GET') {
      const k = await avisos.vapid();
      const { lista } = await avisos.inscricoes();
      return json(res, 200, { publicKey: k.publicKey, total: lista.length });
    }
    const raw = await readLimited(req, 5000);
    let b = {}; try { b = JSON.parse(raw || '{}'); } catch (e) { return json(res, 400); }
    if (req.method === 'POST' && q.teste) {
      const n = await avisos.enviar({ title: 'Aviso de teste', body: 'Os avisos do painel estão funcionando neste aparelho.', url: '/painel#config' });
      return json(res, 200, { ok: true, enviados: n });
    }
    if (req.method === 'POST' || req.method === 'DELETE') {
      const ep = b.sub && b.sub.endpoint ? String(b.sub.endpoint) : String(b.endpoint || '');
      if (!/^https:\/\//.test(ep) || ep.length > 1000) return json(res, 400);
      const { lista, etag } = await avisos.inscricoes();
      let nova = lista.filter(s => s.sub.endpoint !== ep);
      if (req.method === 'POST') {
        const sub = { endpoint: ep, keys: { p256dh: String((b.sub.keys || {}).p256dh || '').slice(0, 200), auth: String((b.sub.keys || {}).auth || '').slice(0, 100) } };
        if (!sub.keys.p256dh || !sub.keys.auth) return json(res, 400);
        nova = nova.concat([{ sub, quem: eu.nome, aparelho: String(b.aparelho || '').slice(0, 80), em: new Date().toISOString() }]).slice(-30);
      }
      await writeJson(avisos.SUBS, { lista: nova }, etag);
      return json(res, 200, { ok: true, total: nova.length });
    }
    return json(res, 405);
  } catch (e) {
    console.error('push', e && e.message);
    return json(res, 503, { erro: 'avisos' });
  }
};
