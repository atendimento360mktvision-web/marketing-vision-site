// Lista e exclui os pedidos dos formulários (site e landing pages). Precisa de uma chave do painel.
const { del } = require('@vercel/blob');
const { readLimited, json } = require('./_lib/util');
const { lerPedidos } = require('./_lib/store');
const { quem } = require('./_lib/auth');

module.exports = async (req, res) => {
  res.setHeader('X-Robots-Tag', 'noindex');
  const eu = await quem(req).catch(() => null);
  if (!eu) return json(res, 401);
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
    return json(res, 200, await lerPedidos(200));
  } catch (e) {
    console.error('pedidos', e && e.message);
    return json(res, 503, { erro: 'armazenamento' });
  }
};
