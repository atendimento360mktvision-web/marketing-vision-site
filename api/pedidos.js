// Lista os pedidos de reunião para o painel. Protegido pela chave PAINEL_TOKEN (cabeçalho x-k).
const { list, get, del } = require('@vercel/blob');
const { readLimited, json, same } = require('./_lib/util');

async function readJson(pathname) {
  const r = await get(pathname, { access: 'private', useCache: false });
  if (!r || r.statusCode !== 200) return null;
  const text = await new Response(r.stream).text();
  try { return JSON.parse(text); } catch (e) { return null; }
}

module.exports = async (req, res) => {
  res.setHeader('X-Robots-Tag', 'noindex');
  const key = process.env.PAINEL_TOKEN;
  if (!key || !same(String(req.headers['x-k'] || '').slice(0, 200), key)) return json(res, 401);

  try {
    if (req.method === 'DELETE') {
      const raw = await readLimited(req, 500);
      let b = {}; try { b = JSON.parse(raw || '{}'); } catch (e) {}
      const p = String(b.id || '');
      if (!/^pedidos\/[\w-]+\.json$/.test(p)) return json(res, 400);
      await del(p);
      return json(res, 200, { ok: true });
    }
    if (req.method !== 'GET') return json(res, 405);
    let blobs = [], cursor;
    do {
      const r = await list({ prefix: 'pedidos/', cursor, limit: 1000 });
      blobs = blobs.concat(r.blobs); cursor = r.hasMore ? r.cursor : undefined;
    } while (cursor && blobs.length < 3000);
    blobs.sort((a, b) => (a.pathname < b.pathname ? 1 : -1));
    const top = blobs.slice(0, 200);
    const items = await Promise.all(top.map(async b => {
      const d = await readJson(b.pathname);
      return d ? Object.assign({ id: b.pathname }, d) : null;
    }));
    return json(res, 200, { total: blobs.length, itens: items.filter(Boolean) });
  } catch (e) {
    console.error('pedidos', e && e.message);
    return json(res, 503, { erro: 'armazenamento' });
  }
};
