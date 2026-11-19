// Leitura e gravação de JSON privado no Vercel Blob.
const { get, put, list } = require('@vercel/blob');

async function readJson(pathname) {
  const r = await get(pathname, { access: 'private', useCache: false });
  if (!r || r.statusCode !== 200) return null;
  const text = await new Response(r.stream).text();
  try { return { data: JSON.parse(text), etag: r.blob && r.blob.etag }; } catch (e) { return null; }
}

// Grava sem depender do etag do armazenamento: o etag que o download devolve nem sempre bate com o da gravação,
// o que fazia toda primeira alteração ser recusada. O controle de versão do painel usa o campo rev (ver central.js).
async function writeJson(pathname, data) {
  const opts = { access: 'private', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true };
  const r = await put(pathname, JSON.stringify(data), opts);
  return r.etag;
}

function conflito(e) { return !!e && (e.name === 'BlobPreconditionFailedError' || /precondition/i.test(e.message || '')); }

async function listar(prefix, max) {
  let blobs = [], cursor;
  do {
    const r = await list({ prefix, cursor, limit: 1000 });
    blobs = blobs.concat(r.blobs); cursor = r.hasMore ? r.cursor : undefined;
  } while (cursor && blobs.length < (max || 3000));
  return blobs;
}

// Pedidos dos formulários (site e landing pages), do mais novo para o mais antigo
async function lerPedidos(max) {
  const blobs = await listar('pedidos/');
  blobs.sort((a, b) => (a.pathname < b.pathname ? 1 : -1));
  const top = blobs.slice(0, max || 200);
  const itens = await Promise.all(top.map(async b => { const r = await readJson(b.pathname); return r ? Object.assign({ id: b.pathname }, r.data) : null; }));
  return { total: blobs.length, itens: itens.filter(Boolean) };
}

module.exports = { readJson, writeJson, conflito, listar, lerPedidos };
