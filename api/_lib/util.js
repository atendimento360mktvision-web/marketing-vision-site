// Funções comuns das APIs: origem permitida, leitura com limite e resposta JSON
const crypto = require('crypto');

const HOSTS = [
  /^marketing-vision\.vercel\.app$/,
  /^marketing-vision-[a-z0-9-]+\.vercel\.app$/,
  /^localhost(:\d+)?$/,
  /^127\.0\.0\.1(:\d+)?$/
];
// Domínio próprio, quando houver: defina SITE_HOSTS na Vercel (ex.: marketingvision.com.br,www.marketingvision.com.br)
const extra = String(process.env.SITE_HOSTS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

function hostOf(u) { try { return new URL(u).host.toLowerCase(); } catch (e) { return ''; } }

function sameSite(req) {
  const h = hostOf(req.headers.origin || req.headers.referer || '');
  return !!h && (HOSTS.some(r => r.test(h)) || extra.includes(h));
}

// Libera o formulário das landing pages (outros domínios permitidos) a enviar para esta API
function cors(req, res) {
  const o = req.headers.origin || '';
  if (o && sameSite({ headers: { origin: o } })) {
    res.setHeader('Access-Control-Allow-Origin', o);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');
  }
}

function readLimited(req, max) {
  return new Promise((resolve) => {
    if (typeof req.body === 'string') return resolve(req.body.length > max ? null : req.body);
    if (Buffer.isBuffer(req.body)) return resolve(req.body.length > max ? null : req.body.toString('utf8'));
    if (req.body && typeof req.body === 'object') { const s = JSON.stringify(req.body); return resolve(s.length > max ? null : s); }
    const chunks = []; let size = 0, done = false;
    req.on('data', c => { if (done) return; size += c.length; if (size > max) { done = true; resolve(null); return; } chunks.push(c); });
    req.on('end', () => { if (!done) { done = true; resolve(Buffer.concat(chunks).toString('utf8')); } });
    req.on('error', () => { if (!done) { done = true; resolve(null); } });
  });
}

function json(res, code, obj) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(obj || {}));
}

function same(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

module.exports = { sameSite, cors, readLimited, json, same };
