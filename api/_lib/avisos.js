// Avisos no celular e no computador (Web Push). As chaves VAPID são criadas pelo próprio servidor
// na primeira vez e ficam guardadas em arquivo privado; nada de chave passa por mãos humanas.
const webpush = require('web-push');
const { readJson, writeJson } = require('./store');

const VAPID = 'db/vapid.json';
const SUBS = 'db/push.json';

async function vapid() {
  const r = await readJson(VAPID);
  if (r && r.data && r.data.publicKey) return r.data;
  const k = webpush.generateVAPIDKeys();
  await writeJson(VAPID, k);
  return k;
}

async function inscricoes() { const r = await readJson(SUBS); return { lista: (r && r.data && r.data.lista) || [], etag: r && r.etag }; }

async function enviar(payload) {
  const { lista } = await inscricoes();
  if (!lista.length) return 0;
  const k = await vapid();
  webpush.setVapidDetails('mailto:atendimento360mktvision@gmail.com', k.publicKey, k.privateKey);
  const mortos = [];
  await Promise.all(lista.map(s => webpush.sendNotification(s.sub, JSON.stringify(payload), { TTL: 86400 }).catch(e => { if (e && (e.statusCode === 404 || e.statusCode === 410)) mortos.push(s.sub.endpoint); })));
  if (mortos.length) {
    try { const atual = await inscricoes(); await writeJson(SUBS, { lista: atual.lista.filter(s => mortos.indexOf(s.sub.endpoint) < 0) }, atual.etag); } catch (e) {}
  }
  return lista.length - mortos.length;
}

// Não deixa um aviso segurar a resposta do formulário por muito tempo
function enviarRapido(payload, ms) { return Promise.race([enviar(payload).catch(() => 0), new Promise(r => setTimeout(r, ms || 3500))]); }

module.exports = { vapid, inscricoes, enviar, enviarRapido, SUBS };
