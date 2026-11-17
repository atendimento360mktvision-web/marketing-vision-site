// Dados do painel central (clientes, contratos, cobranças, custos, entregas, tráfego, leads, workflows e habilidades).
// Um único arquivo JSON privado no Vercel Blob, com etag para ninguém sobrescrever o que o outro salvou.
// GET devolve { db, etag, eu }. PUT recebe { db, etag, acao }. Admin também lista, baixa e restaura cópias de segurança.
// A equipe não vê nem altera valores, cobranças e custos.
const { del } = require('@vercel/blob');
const { readLimited, json } = require('./_lib/util');
const { readJson, writeJson, conflito, listar } = require('./_lib/store');
const { quem } = require('./_lib/auth');
const seed = require('./_lib/seed');

const PATH = 'db/central.json';
const LISTAS = ['clientes', 'contratos', 'entregas', 'workflows', 'habilidades'];
const NOVAS = ['cobrancas', 'custos', 'trafego', 'log', 'fluxos'];
const DA_EQUIPE = ['clientes', 'entregas', 'leads', 'workflows', 'habilidades', 'trafego', 'fluxos'];
const MANTER_BACKUPS = 30;

function hoje() { return new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10); }
function completar(db) { NOVAS.forEach(k => { if (!Array.isArray(db[k])) db[k] = []; }); if (!db.leads || typeof db.leads !== 'object') db.leads = {}; return db; }
function valido(db) {
  if (!db || typeof db !== 'object' || Array.isArray(db)) return false;
  if (!LISTAS.every(k => Array.isArray(db[k]))) return false;
  return !!db.leads && typeof db.leads === 'object' && !Array.isArray(db.leads);
}
function paraEquipe(db) {
  const c = JSON.parse(JSON.stringify(db));
  c.contratos = c.contratos.map(k => Object.assign(k, { valor: null, pagamento: '' }));
  c.cobrancas = []; c.custos = []; c.metas = {};
  return c;
}

async function backupDoDia() {
  const nome = 'backups/central-' + hoje() + '.json';
  const ja = await listar('backups/central-' + hoje());
  if (ja.length) return;
  const atual = await readJson(PATH);
  if (!atual) return;
  await writeJson(nome, atual.data);
  const todos = (await listar('backups/')).sort((a, b) => (a.pathname < b.pathname ? 1 : -1));
  await Promise.all(todos.slice(MANTER_BACKUPS).map(b => del(b.pathname).catch(() => {})));
}

module.exports = async (req, res) => {
  res.setHeader('X-Robots-Tag', 'noindex');
  const eu = await quem(req).catch(() => null);
  if (!eu) return json(res, 401);
  const admin = eu.papel === 'admin';
  const q = req.query || {};

  try {
    if (req.method === 'GET' && q.backups) {
      if (!admin) return json(res, 403);
      const l = (await listar('backups/')).sort((a, b) => (a.pathname < b.pathname ? 1 : -1));
      return json(res, 200, { itens: l.map(b => ({ id: b.pathname, data: b.pathname.slice(16, 26), tamanho: b.size })) });
    }
    if (req.method === 'GET' && q.baixar) {
      if (!admin) return json(res, 403);
      const p = String(q.baixar);
      if (p !== PATH && !/^backups\/central-\d{4}-\d{2}-\d{2}\.json$/.test(p)) return json(res, 400);
      const r = await readJson(p);
      return r ? json(res, 200, r.data) : json(res, 404);
    }
    if (req.method === 'POST' && q.restaurar) {
      if (!admin) return json(res, 403);
      const p = String(q.restaurar);
      if (!/^backups\/central-\d{4}-\d{2}-\d{2}\.json$/.test(p)) return json(res, 400);
      const b = await readJson(p), atual = await readJson(PATH);
      if (!b || !valido(b.data)) return json(res, 404);
      const db = completar(b.data);
      db.log = [{ em: new Date().toISOString(), quem: eu.nome, acao: 'Restaurou a cópia de ' + p.slice(16, 26) }].concat((atual && atual.data.log) || []).slice(0, 300);
      const etag = await writeJson(PATH, db, atual && atual.etag);
      return json(res, 200, { ok: true, etag });
    }
    if (req.method === 'GET') {
      let atual = await readJson(PATH);
      if (!atual) { const db = seed(); atual = { data: db, etag: await writeJson(PATH, db) }; }
      const db = completar(atual.data);
      return json(res, 200, { db: admin ? db : paraEquipe(db), etag: atual.etag, eu });
    }
    if (req.method === 'PUT') {
      const raw = await readLimited(req, 3000000);
      if (raw === null) return json(res, 413);
      let b; try { b = JSON.parse(raw || '{}'); } catch (e) { return json(res, 400); }
      if (!valido(b.db) || typeof b.etag !== 'string' || !b.etag) return json(res, 400, { erro: 'dados' });
      let db = completar(b.db);
      if (!admin) {
        const atual = await readJson(PATH);
        if (!atual) return json(res, 409, { erro: 'conflito' });
        if (atual.etag !== b.etag) return json(res, 409, { erro: 'conflito' });
        const base = completar(atual.data);
        DA_EQUIPE.forEach(k => { base[k] = db[k]; });
        db = base;
      }
      const entrada = { em: new Date().toISOString(), quem: eu.nome, acao: String(b.acao || 'Alterou o painel').slice(0, 160) };
      db.log = [entrada].concat(db.log || []).slice(0, 300);
      db.atualizadoEm = entrada.em;
      try { await backupDoDia(); } catch (e) { console.error('backup', e && e.message); }
      try {
        const etag = await writeJson(PATH, db, b.etag);
        return json(res, 200, { ok: true, etag, entrada });
      } catch (e) {
        if (conflito(e)) return json(res, 409, { erro: 'conflito' });
        throw e;
      }
    }
    return json(res, 405);
  } catch (e) {
    console.error('central', e && e.message);
    return json(res, 503, { erro: 'armazenamento' });
  }
};
