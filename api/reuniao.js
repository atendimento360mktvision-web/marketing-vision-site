// Recebe os pedidos de reunião do formulário do site e guarda cada um no Vercel Blob (privado).
// POST {nome, empresa, whatsapp, email, interesses[], periodo, mensagem, origem, site(isca), t(ms na página)}
// Também recebe os pedidos de amostra grátis das landing pages (origem diz de qual página veio).
const crypto = require('crypto');
const { put } = require('@vercel/blob');
const { sameSite, cors, readLimited, json } = require('./_lib/util');

const INTERESSES = ['Tráfego pago', 'Landing page ou site', 'Motion, 3D e VFX', 'Espia só Feito para você', 'Ainda não sei'];
const PERIODOS = ['Manhã', 'Tarde', 'Noite'];
const ORIGENS = ['Site oficial', 'LP Marketing Vision', 'LP Espia só'];
const cut = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, n);

module.exports = async (req, res) => {
  cors(req, res);
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
  if (req.method !== 'POST') return json(res, 405);
  if (!sameSite(req)) return json(res, 403);
  const raw = await readLimited(req, 6000);
  if (raw === null) return json(res, 413);
  let b;
  try { b = JSON.parse(raw || '{}'); } catch (e) { return json(res, 400); }

  // Robôs: campo isca preenchido ou envio rápido demais. Responde ok sem salvar.
  if (b.site || (Number(b.t) > 0 && Number(b.t) < 2500)) return json(res, 200, { ok: true });

  const lead = {
    nome: cut(b.nome, 80),
    empresa: cut(b.empresa, 80),
    whatsapp: cut(b.whatsapp, 20),
    email: cut(b.email, 120),
    interesses: (Array.isArray(b.interesses) ? b.interesses : []).filter(i => INTERESSES.includes(i)),
    periodo: PERIODOS.includes(b.periodo) ? b.periodo : '',
    mensagem: String(b.mensagem == null ? '' : b.mensagem).replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, ' ').trim().slice(0, 1500),
    origem: ORIGENS.includes(b.origem) ? b.origem : 'Site oficial'
  };
  const digits = lead.whatsapp.replace(/\D/g, '');
  if (lead.nome.length < 2 || digits.length < 10 || digits.length > 13 || !lead.interesses.length) return json(res, 400, { erro: 'dados' });
  if (lead.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) return json(res, 400, { erro: 'email' });

  const now = new Date();
  lead.recebido = now.toISOString();
  const id = now.toISOString().replace(/[:.]/g, '-') + '-' + crypto.randomBytes(4).toString('hex');
  try {
    await put('pedidos/' + id + '.json', JSON.stringify(lead), {
      access: 'private', contentType: 'application/json', addRandomSuffix: false
    });
  } catch (e) {
    console.error('blob', e && e.message);
    return json(res, 503, { erro: 'armazenamento' });
  }
  return json(res, 200, { ok: true });
};
