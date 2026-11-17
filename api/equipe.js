// Pessoas da equipe com acesso ao painel. Só o administrador gerencia.
// A chave de cada pessoa é criada aqui, mostrada uma única vez e guardada só como hash.
const crypto = require('crypto');
const { readLimited, json } = require('./_lib/util');
const { readJson, writeJson } = require('./_lib/store');
const { quem, hash, EQUIPE } = require('./_lib/auth');

module.exports = async (req, res) => {
  res.setHeader('X-Robots-Tag', 'noindex');
  const eu = await quem(req).catch(() => null);
  if (!eu) return json(res, 401);
  if (eu.papel !== 'admin') return json(res, 403);
  try {
    const r = await readJson(EQUIPE);
    const membros = (r && r.data && r.data.membros) || [];
    const publico = m => ({ id: m.id, nome: m.nome, papel: m.papel, criadoEm: m.criadoEm });
    if (req.method === 'GET') return json(res, 200, { membros: membros.map(publico) });
    const raw = await readLimited(req, 2000);
    let b = {}; try { b = JSON.parse(raw || '{}'); } catch (e) { return json(res, 400); }
    if (req.method === 'POST') {
      const nome = String(b.nome || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 60);
      if (nome.length < 2) return json(res, 400);
      const chave = crypto.randomBytes(15).toString('base64url');
      const salt = crypto.randomBytes(12).toString('hex');
      const m = { id: 'u-' + crypto.randomBytes(5).toString('hex'), nome, papel: b.papel === 'admin' ? 'admin' : 'equipe', salt, hash: hash(salt, chave), criadoEm: new Date().toISOString() };
      await writeJson(EQUIPE, { membros: membros.concat([m]) }, r && r.etag);
      return json(res, 200, { membro: publico(m), chave });
    }
    if (req.method === 'DELETE') {
      await writeJson(EQUIPE, { membros: membros.filter(m => m.id !== String(b.id || '')) }, r && r.etag);
      return json(res, 200, { ok: true });
    }
    return json(res, 405);
  } catch (e) {
    console.error('equipe', e && e.message);
    return json(res, 503, { erro: 'armazenamento' });
  }
};
