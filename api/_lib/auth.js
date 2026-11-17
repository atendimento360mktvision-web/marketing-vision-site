// Quem está usando o painel. A chave PAINEL_TOKEN é o administrador; cada pessoa da equipe tem a própria chave,
// guardada só como hash em db/equipe.json.
const crypto = require('crypto');
const { same } = require('./util');
const { readJson } = require('./store');

const EQUIPE = 'db/equipe.json';
function hash(salt, chave) { return crypto.createHash('sha256').update(salt + ':' + chave).digest('hex'); }

async function quem(req) {
  const k = String(req.headers['x-k'] || '').slice(0, 200).trim();
  if (!k) return null;
  const admin = process.env.PAINEL_TOKEN;
  if (admin && same(k, admin)) return { id: 'admin', nome: 'João', papel: 'admin' };
  const r = await readJson(EQUIPE);
  const membros = (r && r.data && r.data.membros) || [];
  for (const m of membros) if (m.hash && same(hash(m.salt, k), m.hash)) return { id: m.id, nome: m.nome, papel: m.papel === 'admin' ? 'admin' : 'equipe' };
  return null;
}

module.exports = { quem, hash, EQUIPE };
