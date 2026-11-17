// Dados do painel central (clientes, contratos, entregas, leads, workflows e habilidades).
// Um único arquivo JSON privado no Vercel Blob. Protegido pela chave PAINEL_TOKEN (cabeçalho x-k).
// GET devolve { db, etag }. PUT recebe { db, etag } e só grava se ninguém tiver salvo antes (etag igual).
const { get, put } = require('@vercel/blob');
const { readLimited, json, same } = require('./_lib/util');
const seed = require('./_lib/seed');

const PATH = 'db/central.json';
const LISTAS = ['clientes', 'contratos', 'entregas', 'workflows', 'habilidades'];

async function ler() {
  const r = await get(PATH, { access: 'private', useCache: false });
  if (!r || r.statusCode !== 200) return null;
  const text = await new Response(r.stream).text();
  return { db: JSON.parse(text), etag: r.blob.etag };
}

async function gravar(db, etag) {
  const opts = { access: 'private', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true };
  if (etag) opts.ifMatch = etag;
  const r = await put(PATH, JSON.stringify(db), opts);
  return r.etag;
}

function valido(db) {
  if (!db || typeof db !== 'object' || Array.isArray(db)) return false;
  if (!LISTAS.every(k => Array.isArray(db[k]))) return false;
  if (!db.leads || typeof db.leads !== 'object' || Array.isArray(db.leads)) return false;
  return true;
}

module.exports = async (req, res) => {
  res.setHeader('X-Robots-Tag', 'noindex');
  const key = process.env.PAINEL_TOKEN;
  if (!key || !same(String(req.headers['x-k'] || '').slice(0, 200), key)) return json(res, 401);

  try {
    if (req.method === 'GET') {
      let atual = await ler();
      if (!atual) {
        const db = seed();
        atual = { db, etag: await gravar(db) };
      }
      return json(res, 200, atual);
    }
    if (req.method === 'PUT') {
      const raw = await readLimited(req, 2000000);
      if (raw === null) return json(res, 413);
      let b; try { b = JSON.parse(raw || '{}'); } catch (e) { return json(res, 400); }
      if (!valido(b.db) || typeof b.etag !== 'string' || !b.etag) return json(res, 400, { erro: 'dados' });
      b.db.atualizadoEm = new Date().toISOString();
      try {
        const etag = await gravar(b.db, b.etag);
        return json(res, 200, { ok: true, etag });
      } catch (e) {
        if (e && (e.name === 'BlobPreconditionFailedError' || /precondition/i.test(e.message || ''))) return json(res, 409, { erro: 'conflito' });
        throw e;
      }
    }
    return json(res, 405);
  } catch (e) {
    console.error('central', e && e.message);
    return json(res, 503, { erro: 'armazenamento' });
  }
};
