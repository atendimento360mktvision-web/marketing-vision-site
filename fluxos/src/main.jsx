/* Construtor visual de processos do painel da Marketing Vision.
   Canvas com zoom e arrasto, cards de etapa, documentação, decisão e fechamento, conexões,
   painel lateral de edição e modo "Testar fluxo". Montado pelo painel com window.MVFluxos.mount(). */
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ReactFlow, ReactFlowProvider, Background, BackgroundVariant, Controls, MiniMap, Handle, Position,
  addEdge, applyNodeChanges, applyEdgeChanges, useReactFlow, MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './fluxos.css';

const TIPOS = {
  etapa: { nome: 'Etapa ou contato', curto: 'Etapa', cor: '#CC9944' },
  doc: { nome: 'Documentação e checklist', curto: 'Documentação', cor: '#8FB3DE' },
  decisao: { nome: 'Decisão', curto: 'Decisão', cor: '#B49BE0' },
  fechamento: { nome: 'Fechamento', curto: 'Fechamento', cor: '#6FBF8A' }
};
const uid = (p) => p + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/* ---------- modelo pronto: venda de landing page com amostra grátis ---------- */
function modeloLanding() {
  const n = (id, type, x, y, data) => ({ id, type, position: { x, y }, data });
  const nodes = [
    n('m1', 'etapa', 0, 120, { titulo: 'Pedido recebido', descricao: 'O pedido chega pelo formulário da landing ou do site.', docs: [{ t: 'Nome, WhatsApp e e-mail' }, { t: 'Modelo que o cliente gostou' }] }),
    n('m2', 'etapa', 300, 120, { titulo: 'E-mail para marcar a reunião', descricao: 'Responder em até 24 horas e combinar o dia da apresentação.', docs: [] }),
    n('m3', 'doc', 600, 120, { titulo: 'Briefing e materiais', descricao: 'Tudo que precisa para montar a amostra.', docs: [{ t: 'Logo' }, { t: 'Fotos reais do trabalho' }, { t: 'Lista de serviços' }, { t: 'Região atendida e WhatsApp' }] }),
    n('m4', 'etapa', 900, 120, { titulo: 'Amostra grátis', descricao: 'Pronta em até 48 horas após o pedido.', docs: [{ t: 'Amostra publicada num link de teste' }] }),
    n('m5', 'etapa', 1200, 120, { titulo: 'Reunião de apresentação', descricao: 'Mostrar a amostra, o investimento e as condições: cartão em até 6x sem juros ou em até 12x, Pix com desconto.', docs: [] }),
    n('m6', 'decisao', 1500, 110, { titulo: 'Proposta', pergunta: 'O cliente aprovou a proposta?', rotuloSim: 'Sim', rotuloNao: 'Não', docs: [] }),
    n('m7', 'fechamento', 1820, 0, { titulo: 'Contrato e pagamento', descricao: 'Assinatura do contrato e primeiro pagamento.', docs: [{ t: 'Contrato de prestação de serviço assinado' }, { t: 'Comprovante de pagamento' }, { t: 'Dados para nota fiscal' }] }),
    n('m8', 'etapa', 2120, 0, { titulo: 'Implementação e entrega', descricao: 'Até 3 rodadas de ajustes, domínio e publicação em até 24 horas.', docs: [{ t: 'Dados do domínio' }, { t: 'Aprovação final do cliente' }] }),
    n('m9', 'etapa', 1820, 260, { titulo: 'Follow-up', descricao: 'Retomar em 7 dias e registrar o motivo se não fechar.', docs: [{ t: 'Motivo registrado no painel' }] })
  ];
  const e = (s, t, h, label) => ({ id: 'e-' + s + '-' + t + (h || ''), source: s, target: t, sourceHandle: h || null, label: label || '' });
  const edges = [e('m1', 'm2'), e('m2', 'm3'), e('m3', 'm4'), e('m4', 'm5'), e('m5', 'm6'), e('m6', 'm7', 'sim', 'Sim'), e('m6', 'm9', 'nao', 'Não'), e('m7', 'm8'), e('m9', 'm5')];
  return { nodes, edges };
}

/* ---------- card ---------- */
function Card({ data, type, selected }) {
  const t = TIPOS[type] || TIPOS.etapa;
  const docs = data.docs || [];
  return (
    <div className={'fx-node fx-' + type + (selected ? ' sel' : '')} style={{ '--cor': t.cor }}>
      <Handle type="target" position={Position.Left} className="fx-h" />
      <div className="fx-tipo">{t.nome}</div>
      <div className="fx-tit">{data.titulo || 'Sem título'}</div>
      {type === 'decisao' && data.pergunta ? <div className="fx-perg">{data.pergunta}</div> : null}
      {type !== 'decisao' && data.descricao ? <div className="fx-desc">{data.descricao}</div> : null}
      {docs.length ? <div className="fx-docs">{docs.length} {docs.length === 1 ? 'item' : 'itens'} no checklist</div> : null}
      {type === 'decisao' ? (
        <>
          <Handle type="source" id="sim" position={Position.Right} className="fx-h h-sim" style={{ top: '38%' }} />
          <span className="fx-lab sim" style={{ top: '38%' }}>{data.rotuloSim || 'Sim'}</span>
          <Handle type="source" id="nao" position={Position.Right} className="fx-h h-nao" style={{ top: '76%' }} />
          <span className="fx-lab nao" style={{ top: '76%' }}>{data.rotuloNao || 'Não'}</span>
        </>
      ) : <Handle type="source" position={Position.Right} className="fx-h" />}
    </div>
  );
}
const nodeTypes = { etapa: Card, doc: Card, decisao: Card, fechamento: Card };

/* ---------- limpeza para salvar ---------- */
function limparNo(n) {
  const d = n.data || {};
  const data = { titulo: d.titulo || '', descricao: d.descricao || '', docs: (d.docs || []).map((x) => ({ t: String(x.t || '') })), obs: d.obs || '' };
  if (n.type === 'decisao') Object.assign(data, { pergunta: d.pergunta || '', rotuloSim: d.rotuloSim || 'Sim', rotuloNao: d.rotuloNao || 'Não' });
  return { id: n.id, type: n.type, position: { x: Math.round(n.position.x), y: Math.round(n.position.y) }, data };
}
const limparAresta = (e) => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle || null, label: e.label || '' });

/* ---------- validação da estrutura ---------- */
function validar(nodes, edges) {
  const avisos = [];
  if (!nodes.length) return ['O fluxo está vazio. Adicione cards para começar.'];
  const entra = {}, sai = {};
  edges.forEach((e) => { entra[e.target] = (entra[e.target] || 0) + 1; (sai[e.source] = sai[e.source] || []).push(e); });
  const inicios = nodes.filter((n) => !entra[n.id]);
  if (!inicios.length) avisos.push('Não há um card de início (todos recebem uma conexão).');
  if (inicios.length > 1) avisos.push('Há ' + inicios.length + ' cards sem nada chegando neles: ' + inicios.map((n) => n.data.titulo || 'Sem título').join(', ') + '. O teste começa pelo mais à esquerda.');
  nodes.forEach((n) => {
    const nome = '"' + (n.data.titulo || 'Sem título') + '"';
    if (!n.data.titulo) avisos.push('Um card de ' + TIPOS[n.type].curto.toLowerCase() + ' está sem título.');
    if (n.type === 'decisao') {
      const hs = (sai[n.id] || []).map((e) => e.sourceHandle);
      if (hs.indexOf('sim') < 0) avisos.push('A decisão ' + nome + ' não tem caminho para "' + (n.data.rotuloSim || 'Sim') + '".');
      if (hs.indexOf('nao') < 0) avisos.push('A decisão ' + nome + ' não tem caminho para "' + (n.data.rotuloNao || 'Não') + '".');
    } else if (!sai[n.id] && n.type !== 'fechamento') avisos.push('O card ' + nome + ' não leva a lugar nenhum.');
  });
  if (!nodes.some((n) => n.type === 'fechamento')) avisos.push('O fluxo não tem nenhum card de fechamento.');
  else if (inicios.length) {
    const visto = {}, fila = [inicios.sort((a, b) => a.position.x - b.position.x)[0].id];
    while (fila.length) { const id = fila.shift(); if (visto[id]) continue; visto[id] = 1; (sai[id] || []).forEach((e) => fila.push(e.target)); }
    if (!nodes.some((n) => n.type === 'fechamento' && visto[n.id])) avisos.push('Nenhum fechamento pode ser alcançado a partir do início.');
    const soltos = nodes.filter((n) => !visto[n.id]);
    if (soltos.length) avisos.push(soltos.length + (soltos.length > 1 ? ' cards não são alcançados' : ' card não é alcançado') + ' a partir do início: ' + soltos.map((n) => n.data.titulo || 'Sem título').join(', ') + '.');
  }
  return avisos;
}

/* ---------- painel lateral de edição ---------- */
function Editor({ no, aresta, onData, onExcluir, onExcluirAresta, onLabel, fechar, podeEditar }) {
  const [novo, setNovo] = useState('');
  if (aresta) {
    return (
      <aside className="fx-side">
        <div className="fx-side-h"><b>Conexão</b><button className="fx-x" onClick={fechar} aria-label="Fechar">×</button></div>
        <label>Texto na linha (opcional)<input value={aresta.label || ''} disabled={!podeEditar} onChange={(e) => onLabel(e.target.value)} placeholder="Ex.: Se pagou no Pix" /></label>
        {podeEditar ? <button className="fx-danger" onClick={onExcluirAresta}>Excluir conexão</button> : null}
      </aside>
    );
  }
  if (!no) return null;
  const d = no.data, docs = d.docs || [];
  const set = (k, v) => onData({ ...d, [k]: v });
  return (
    <aside className="fx-side">
      <div className="fx-side-h"><span className="fx-pill" style={{ '--cor': TIPOS[no.type].cor }}>{TIPOS[no.type].nome}</span><button className="fx-x" onClick={fechar} aria-label="Fechar">×</button></div>
      <label>Título<input value={d.titulo || ''} disabled={!podeEditar} onChange={(e) => set('titulo', e.target.value)} placeholder="Ex.: Reunião de diagnóstico" /></label>
      {no.type === 'decisao' ? (
        <>
          <label>Pergunta<input value={d.pergunta || ''} disabled={!podeEditar} onChange={(e) => set('pergunta', e.target.value)} placeholder="Ex.: O cliente aprovou a proposta?" /></label>
          <div className="fx-two">
            <label>Saída verde<input value={d.rotuloSim || ''} disabled={!podeEditar} onChange={(e) => set('rotuloSim', e.target.value)} placeholder="Sim" /></label>
            <label>Saída vermelha<input value={d.rotuloNao || ''} disabled={!podeEditar} onChange={(e) => set('rotuloNao', e.target.value)} placeholder="Não" /></label>
          </div>
        </>
      ) : null}
      <label>Descrição<textarea rows={3} value={d.descricao || ''} disabled={!podeEditar} onChange={(e) => set('descricao', e.target.value)} placeholder="O que acontece nesta etapa" /></label>
      <div className="fx-blk">
        <b>{no.type === 'doc' ? 'Documentos e tarefas obrigatórias' : 'Checklist para avançar'}</b>
        {docs.map((x, i) => (
          <div className="fx-item" key={i}>
            <input value={x.t} disabled={!podeEditar} onChange={(e) => set('docs', docs.map((y, j) => (j === i ? { t: e.target.value } : y)))} />
            {podeEditar ? <button className="fx-x" aria-label="Remover item" onClick={() => set('docs', docs.filter((_, j) => j !== i))}>×</button> : null}
          </div>
        ))}
        {podeEditar ? (
          <form className="fx-item" onSubmit={(e) => { e.preventDefault(); const t = novo.trim(); if (!t) return; set('docs', docs.concat([{ t }])); setNovo(''); }}>
            <input value={novo} onChange={(e) => setNovo(e.target.value)} placeholder="Novo item" />
            <button type="submit" className="fx-btn sm">Adicionar</button>
          </form>
        ) : null}
      </div>
      <label>Observações<textarea rows={3} value={d.obs || ''} disabled={!podeEditar} onChange={(e) => set('obs', e.target.value)} placeholder="Dicas, prazos, quem é responsável" /></label>
      {podeEditar ? <button className="fx-danger" onClick={onExcluir}>Excluir card</button> : null}
    </aside>
  );
}

/* ---------- painel do teste ---------- */
function Teste({ sim, nodes, edges, avisos, marcar, seguir, voltar, reiniciar, concluir, sair }) {
  const atual = nodes.find((n) => n.id === sim.atual);
  if (sim.fim) {
    const ok = sim.fim === 'ok';
    const docs = Object.values(sim.feitos).reduce((s, o) => s + Object.values(o).filter(Boolean).length, 0);
    return (
      <aside className="fx-side fx-teste">
        <div className="fx-side-h"><b>Testar fluxo</b><button className="fx-x" onClick={sair} aria-label="Sair do teste">×</button></div>
        <div className={'fx-result ' + (ok ? 'ok' : 'erro')}>
          <b>{ok ? 'Fluxo validado do início ao fim' : 'O fluxo travou'}</b>
          <p>{sim.msg}</p>
        </div>
        <p className="fx-meta">{sim.hist.length} {sim.hist.length === 1 ? 'etapa percorrida' : 'etapas percorridas'} · {docs} {docs === 1 ? 'item entregue' : 'itens entregues'}</p>
        <ol className="fx-trilha">{sim.hist.map((id, i) => { const n = nodes.find((x) => x.id === id); return <li key={i}>{n ? n.data.titulo || 'Sem título' : 'Card removido'}</li>; })}</ol>
        <div className="fx-acts"><button className="fx-btn ghost" onClick={voltar}>Voltar um passo</button><button className="fx-btn" onClick={reiniciar}>Testar de novo</button></div>
      </aside>
    );
  }
  if (!atual) return null;
  const docs = atual.data.docs || [], feitos = sim.feitos[atual.id] || {};
  const faltam = docs.filter((_, i) => !feitos[i]).length;
  const sai = edges.filter((e) => e.source === atual.id);
  const titulo = (id) => { const n = nodes.find((x) => x.id === id); return n ? n.data.titulo || 'Sem título' : '?'; };
  return (
    <aside className="fx-side fx-teste">
      <div className="fx-side-h"><b>Testar fluxo</b><button className="fx-x" onClick={sair} aria-label="Sair do teste">×</button></div>
      {avisos.length && sim.hist.length === 1 ? (
        <details className="fx-avisos" open><summary>{avisos.length} {avisos.length === 1 ? 'aviso' : 'avisos'} na estrutura</summary><ul>{avisos.map((a, i) => <li key={i}>{a}</li>)}</ul></details>
      ) : null}
      <p className="fx-meta">Etapa {sim.hist.length} · {TIPOS[atual.type].nome}</p>
      <h3>{atual.data.titulo || 'Sem título'}</h3>
      {atual.type === 'decisao' && atual.data.pergunta ? <p className="fx-perg2">{atual.data.pergunta}</p> : null}
      {atual.data.descricao ? <p className="fx-desc2">{atual.data.descricao}</p> : null}
      {docs.length ? (
        <div className="fx-blk">
          <b>{faltam ? 'Marque o que foi entregue (' + (docs.length - faltam) + ' de ' + docs.length + ')' : 'Tudo entregue'}</b>
          {docs.map((x, i) => (
            <label className={'fx-check' + (feitos[i] ? ' ok' : '')} key={i}><input type="checkbox" checked={!!feitos[i]} onChange={() => marcar(atual.id, i)} /><span>{x.t}</span></label>
          ))}
        </div>
      ) : null}
      {atual.data.obs ? <p className="fx-obs">{atual.data.obs}</p> : null}
      <div className="fx-blk">
        {faltam ? <p className="fx-trava">Faltam {faltam} {faltam === 1 ? 'item' : 'itens'} para avançar.</p> : null}
        {atual.type === 'decisao' ? (
          <div className="fx-acts col">
            {[['sim', atual.data.rotuloSim || 'Sim'], ['nao', atual.data.rotuloNao || 'Não']].map(([h, rot]) => {
              const e = sai.find((x) => x.sourceHandle === h);
              return <button key={h} className={'fx-btn ' + (h === 'sim' ? 'verde' : 'verm')} disabled={!!faltam || !e} onClick={() => seguir(e)}>{rot}{e ? ' · vai para ' + titulo(e.target) : ' · sem caminho'}</button>;
            })}
          </div>
        ) : sai.length ? (
          <div className="fx-acts col">
            {sai.map((e) => <button key={e.id} className="fx-btn" disabled={!!faltam} onClick={() => seguir(e)}>{sai.length > 1 ? (e.label ? e.label + ' · ' : '') + 'Ir para ' + titulo(e.target) : 'Avançar para ' + titulo(e.target)}</button>)}
            {atual.type === 'fechamento' ? <button className="fx-btn ghost" disabled={!!faltam} onClick={() => concluir('ok', 'O processo chegou ao fechamento "' + (atual.data.titulo || 'Sem título') + '".')}>Encerrar o teste aqui</button> : null}
          </div>
        ) : atual.type === 'fechamento' ? (
          <button className="fx-btn verde" disabled={!!faltam} onClick={() => concluir('ok', 'O processo chegou ao fechamento "' + (atual.data.titulo || 'Sem título') + '" com tudo entregue.')}>Concluir o processo</button>
        ) : (
          <button className="fx-btn verm" onClick={() => concluir('erro', 'O card "' + (atual.data.titulo || 'Sem título') + '" não leva a lugar nenhum e não é um fechamento. Conecte ele à próxima etapa.')}>Este card não tem saída</button>
        )}
      </div>
      <div className="fx-acts">{sim.hist.length > 1 ? <button className="fx-btn ghost" onClick={voltar}>Voltar um passo</button> : null}<button className="fx-btn ghost" onClick={reiniciar}>Reiniciar</button></div>
    </aside>
  );
}

/* ---------- construtor ---------- */
function Construtor({ fluxosIniciais, podeEditar, onSalvar }) {
  const rf = useReactFlow();
  const wrap = useRef(null);
  const [fluxos, setFluxos] = useState(() => (fluxosIniciais || []).map((f) => ({ ...f })));
  const [atualId, setAtualId] = useState(() => (fluxosIniciais && fluxosIniciais[0] ? fluxosIniciais[0].id : null));
  const fluxo = fluxos.find((f) => f.id === atualId) || null;
  const [nodes, setNodes] = useState(() => (fluxo ? fluxo.nodes : []));
  const [edges, setEdges] = useState(() => (fluxo ? fluxo.edges : []));
  const [sel, setSel] = useState(null);
  const [selAresta, setSelAresta] = useState(null);
  const [sim, setSim] = useState(null);
  const [renomeando, setRenomeando] = useState(false);
  const ultimo = useRef('');
  const timer = useRef(null);

  // salva com atraso curto, só quando algo de verdade mudou
  useEffect(() => {
    if (!fluxo) return;
    const limpo = { nodes: nodes.map(limparNo), edges: edges.map(limparAresta) };
    const json = JSON.stringify(limpo);
    if (!ultimo.current) { ultimo.current = json; return; }
    if (json === ultimo.current) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      ultimo.current = json;
      const novos = fluxos.map((f) => (f.id === fluxo.id ? { ...f, ...limpo, atualizadoEm: new Date().toISOString() } : f));
      setFluxos(novos); onSalvar(novos, 'Editou o fluxo ' + fluxo.nome);
    }, 700);
    return () => clearTimeout(timer.current);
  }, [nodes, edges]); // eslint-disable-line

  const trocar = (id, lista) => {
    const l = lista || fluxos, f = l.find((x) => x.id === id);
    setAtualId(id); setSel(null); setSelAresta(null); setSim(null);
    ultimo.current = f ? JSON.stringify({ nodes: f.nodes.map(limparNo), edges: f.edges.map(limparAresta) }) : '';
    setNodes(f ? f.nodes : []); setEdges(f ? f.edges : []);
    setTimeout(() => rf.fitView({ padding: 0.2, duration: 300 }), 50);
  };
  const salvarLista = (l, acao) => { setFluxos(l); onSalvar(l, acao); };
  const novoFluxo = (modelo) => {
    const base = modelo ? modeloLanding() : { nodes: [], edges: [] };
    const nome = modelo ? 'Venda de landing page (amostra grátis)' : 'Novo processo ' + (fluxos.length + 1);
    const f = { id: uid('fx'), nome, nodes: base.nodes, edges: base.edges, criadoEm: new Date().toISOString() };
    const l = fluxos.concat([f]); salvarLista(l, 'Criou o fluxo ' + nome); trocar(f.id, l);
  };
  const excluirFluxo = () => {
    if (!fluxo || !window.confirm('Excluir o fluxo "' + fluxo.nome + '"? Essa ação não pode ser desfeita.')) return;
    const l = fluxos.filter((f) => f.id !== fluxo.id); salvarLista(l, 'Excluiu o fluxo ' + fluxo.nome); trocar(l[0] ? l[0].id : null, l);
  };
  const renomear = (nome) => { const l = fluxos.map((f) => (f.id === fluxo.id ? { ...f, nome } : f)); salvarLista(l, 'Renomeou o fluxo para ' + nome); };

  const onNodesChange = useCallback((ch) => setNodes((nds) => applyNodeChanges(podeEditar && !sim ? ch : ch.filter((c) => c.type === 'select' || c.type === 'dimensions'), nds)), [podeEditar, sim]);
  const onEdgesChange = useCallback((ch) => setEdges((eds) => applyEdgeChanges(podeEditar && !sim ? ch : ch.filter((c) => c.type === 'select'), eds)), [podeEditar, sim]);
  const onConnect = useCallback((c) => {
    if (!podeEditar || sim || c.source === c.target) return;
    const label = c.sourceHandle === 'sim' || c.sourceHandle === 'nao' ? (nodes.find((n) => n.id === c.source)?.data[c.sourceHandle === 'sim' ? 'rotuloSim' : 'rotuloNao'] || (c.sourceHandle === 'sim' ? 'Sim' : 'Não')) : '';
    setEdges((eds) => addEdge({ ...c, id: uid('e'), label }, eds.filter((e) => !(e.source === c.source && e.sourceHandle && e.sourceHandle === c.sourceHandle))));
  }, [podeEditar, sim, nodes]);

  const adicionar = (type) => {
    const r = wrap.current.getBoundingClientRect();
    const p = rf.screenToFlowPosition({ x: r.left + r.width / 2 - 110 + Math.random() * 40, y: r.top + r.height / 2 - 50 + Math.random() * 40 });
    const data = { titulo: '', descricao: '', docs: [], obs: '' };
    if (type === 'decisao') Object.assign(data, { pergunta: '', rotuloSim: 'Sim', rotuloNao: 'Não' });
    const n = { id: uid('n'), type, position: p, data, selected: true };
    setNodes((nds) => nds.map((x) => ({ ...x, selected: false })).concat([n])); setSel(n.id); setSelAresta(null);
  };

  /* ----- teste ----- */
  const avisos = useMemo(() => validar(nodes, edges), [nodes, edges]);
  const centralizar = (id) => { const n = nodes.find((x) => x.id === id); if (n) rf.setCenter(n.position.x + 120, n.position.y + 60, { zoom: Math.max(rf.getZoom(), 0.9), duration: 400 }); };
  const iniciar = () => {
    if (!nodes.length) return;
    const entra = {}; edges.forEach((e) => { entra[e.target] = 1; });
    const inicios = nodes.filter((n) => !entra[n.id]).sort((a, b) => a.position.x - b.position.x);
    const ini = (inicios[0] || nodes.slice().sort((a, b) => a.position.x - b.position.x)[0]).id;
    setSel(null); setSelAresta(null);
    setSim({ atual: ini, hist: [ini], caminho: [], feitos: {}, fim: null, msg: '' }); centralizar(ini);
  };
  const marcar = (id, i) => setSim((s) => ({ ...s, feitos: { ...s.feitos, [id]: { ...(s.feitos[id] || {}), [i]: !(s.feitos[id] || {})[i] } } }));
  const seguir = (e) => { setSim((s) => ({ ...s, atual: e.target, hist: s.hist.concat([e.target]), caminho: s.caminho.concat([e.id]) })); centralizar(e.target); };
  const voltar = () => setSim((s) => {
    if (s.fim) return { ...s, fim: null, msg: '' };
    if (s.hist.length < 2) return s;
    const hist = s.hist.slice(0, -1); centralizar(hist[hist.length - 1]);
    return { ...s, hist, atual: hist[hist.length - 1], caminho: s.caminho.slice(0, -1) };
  });
  const concluir = (fim, msg) => {
    setSim((s) => ({ ...s, fim, msg }));
    if (fluxo) { const l = fluxos.map((f) => (f.id === fluxo.id ? { ...f, ultimoTeste: { em: new Date().toISOString(), ok: fim === 'ok', etapas: sim ? sim.hist.length : 0 } } : f)); salvarLista(l, 'Testou o fluxo ' + fluxo.nome + (fim === 'ok' ? ' (validado)' : ' (travou)')); }
  };

  const visitados = useMemo(() => (sim ? new Set(sim.hist) : null), [sim]);
  const viewNodes = useMemo(() => nodes.map((n) => ({
    ...n, draggable: podeEditar && !sim, connectable: podeEditar && !sim,
    className: sim ? (n.id === sim.atual && !sim.fim ? 'sim-atual' : visitados.has(n.id) ? 'sim-feito' : 'sim-fora') : ''
  })), [nodes, sim, visitados, podeEditar]);
  const viewEdges = useMemo(() => edges.map((e) => {
    const cor = e.sourceHandle === 'sim' ? '#6FBF8A' : e.sourceHandle === 'nao' ? '#E88A80' : '#9A9596';
    const ativo = sim && sim.caminho.indexOf(e.id) > -1;
    return { ...e, type: 'smoothstep', animated: !!ativo, markerEnd: { type: MarkerType.ArrowClosed, color: ativo ? '#E4B05D' : cor, width: 18, height: 18 },
      style: { stroke: ativo ? '#E4B05D' : cor, strokeWidth: ativo ? 2.6 : 1.6, opacity: sim && !ativo ? 0.35 : 1 },
      labelStyle: { fill: '#F6F2EA', fontSize: 12, fontWeight: 600 }, labelBgStyle: { fill: '#2a2829' }, labelBgPadding: [6, 3], labelBgBorderRadius: 6 };
  }), [edges, sim]);

  const noSel = sel ? nodes.find((n) => n.id === sel) : null;
  const arestaSel = selAresta ? edges.find((e) => e.id === selAresta) : null;

  if (!fluxo) {
    return (
      <div className="fx-vazio">
        <h3>Monte o mapa da jornada do cliente</h3>
        <p>Do primeiro contato ao contrato assinado: arraste etapas, ligue os cards, liste os documentos de cada passo e teste o processo do início ao fim.</p>
        {podeEditar ? <div className="fx-acts"><button className="fx-btn" onClick={() => novoFluxo(true)}>Começar pelo modelo de venda de landing page</button><button className="fx-btn ghost" onClick={() => novoFluxo(false)}>Começar do zero</button></div> : <p>Nenhum fluxo criado ainda.</p>}
      </div>
    );
  }

  return (
    <div className="fx-root">
      <div className="fx-bar">
        <div className="fx-bar-l">
          {renomeando ? (
            <form onSubmit={(e) => { e.preventDefault(); const v = e.target.nome.value.trim(); if (v) renomear(v); setRenomeando(false); }} className="fx-ren">
              <input name="nome" defaultValue={fluxo.nome} autoFocus onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== fluxo.nome) renomear(v); setRenomeando(false); }} />
            </form>
          ) : (
            <select value={fluxo.id} onChange={(e) => trocar(e.target.value)} aria-label="Fluxo">
              {fluxos.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
            </select>
          )}
          {podeEditar && !sim ? (
            <>
              <button className="fx-btn ghost sm" onClick={() => setRenomeando(true)}>Renomear</button>
              <button className="fx-btn ghost sm" onClick={() => novoFluxo(false)}>Novo fluxo</button>
              <button className="fx-btn ghost sm" onClick={() => novoFluxo(true)}>Novo pelo modelo</button>
              <button className="fx-btn ghost sm fx-del" onClick={excluirFluxo}>Excluir</button>
            </>
          ) : null}
        </div>
        <div className="fx-bar-r">
          {fluxo.ultimoTeste ? <span className={'fx-ult ' + (fluxo.ultimoTeste.ok ? 'ok' : 'erro')}>{fluxo.ultimoTeste.ok ? 'Validado' : 'Travou'} em {new Date(fluxo.ultimoTeste.em).toLocaleDateString('pt-BR')}</span> : null}
          {sim ? <button className="fx-btn" onClick={() => setSim(null)}>Sair do teste</button> : <button className="fx-btn" onClick={iniciar} disabled={!nodes.length}>Testar fluxo</button>}
        </div>
      </div>
      <div className="fx-area" ref={wrap}>
        {podeEditar && !sim ? (
          <div className="fx-paleta" aria-label="Adicionar card">
            {Object.keys(TIPOS).map((k) => <button key={k} onClick={() => adicionar(k)} style={{ '--cor': TIPOS[k].cor }}><i />{TIPOS[k].curto}</button>)}
          </div>
        ) : null}
        <ReactFlow
          nodes={viewNodes} edges={viewEdges} nodeTypes={nodeTypes} colorMode="dark"
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect}
          onNodeClick={(_, n) => { if (!sim) { setSel(n.id); setSelAresta(null); } }}
          onEdgeClick={(_, e) => { if (!sim) { setSelAresta(e.id); setSel(null); } }}
          onPaneClick={() => { setSel(null); setSelAresta(null); }}
          onNodesDelete={(ds) => { if (ds.some((d) => d.id === sel)) setSel(null); }}
          deleteKeyCode={podeEditar && !sim ? ['Backspace', 'Delete'] : null}
          fitView fitViewOptions={{ padding: 0.2 }} minZoom={0.2} maxZoom={2} proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{ type: 'smoothstep' }} connectionLineStyle={{ stroke: '#E4B05D', strokeWidth: 2 }}
        >
          <Background variant={BackgroundVariant.Dots} gap={22} size={1.4} color="rgba(246,242,234,.16)" />
          <Controls showInteractive={false} position="bottom-left" />
          <MiniMap position="bottom-right" pannable zoomable nodeColor={(n) => (TIPOS[n.type] || TIPOS.etapa).cor} maskColor="rgba(20,19,19,.7)" style={{ background: '#1e1c1d' }} />
        </ReactFlow>
        {sim ? (
          <Teste sim={sim} nodes={nodes} edges={edges} avisos={avisos} marcar={marcar} seguir={seguir} voltar={voltar} reiniciar={iniciar} concluir={concluir} sair={() => setSim(null)} />
        ) : (noSel || arestaSel) ? (
          <Editor no={noSel} aresta={arestaSel} podeEditar={podeEditar} fechar={() => { setSel(null); setSelAresta(null); }}
            onData={(data) => setNodes((nds) => nds.map((n) => (n.id === noSel.id ? { ...n, data } : n)))}
            onExcluir={() => { setNodes((nds) => nds.filter((n) => n.id !== noSel.id)); setEdges((eds) => eds.filter((e) => e.source !== noSel.id && e.target !== noSel.id)); setSel(null); }}
            onExcluirAresta={() => { setEdges((eds) => eds.filter((e) => e.id !== arestaSel.id)); setSelAresta(null); }}
            onLabel={(label) => setEdges((eds) => eds.map((e) => (e.id === arestaSel.id ? { ...e, label } : e)))} />
        ) : !nodes.length && podeEditar ? (
          <div className="fx-dica">Use os botões no canto para adicionar cards. Puxe a bolinha da direita de um card até outro para conectar.</div>
        ) : null}
      </div>
    </div>
  );
}

window.MVFluxos = {
  mount(el, opts) {
    const root = createRoot(el);
    root.render(<ReactFlowProvider><Construtor fluxosIniciais={opts.fluxos || []} podeEditar={opts.podeEditar !== false} onSalvar={opts.onSalvar || (() => {})} /></ReactFlowProvider>);
    return () => root.unmount();
  }
};
