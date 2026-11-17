// Dados iniciais do painel central. Usados só na primeira vez, quando ainda não existe db/central.json.
// Valores de contrato começam em 0 de propósito: são negociados em reunião e preenchidos no painel.
const hoje = new Date().toISOString().slice(0, 10);

module.exports = function seed() {
  return {
    v: 1,
    criadoEm: hoje,
    metas: { novosClientesMes: 2 },
    clientes: [
      { id: 'c-jose-neto', nome: 'Dr. José Neto Ribeiro', empresa: 'Dr. José Neto Ribeiro', nicho: 'Otorrino e cirurgia da face (foco em rinoplastia)', cidade: '', whatsapp: '', email: '', origem: 'Indicação', status: 'ativo', desde: '2024', obs: 'Parceiro desde 2024. Projeto de curso EAD de cirurgias da face para médicos.' },
      { id: 'c-reliv', nome: 'Reliv', empresa: 'Clínica Reliv', nicho: 'Clínica de cirurgias da face', cidade: 'Inhumas, GO', whatsapp: '', email: '', origem: 'Indicação', status: 'ativo', desde: '', obs: 'Clínica do Dr. José Neto.' },
      { id: 'c-oticas', nome: 'Óticas Brasil', empresa: 'Óticas Brasil Inhumas', nicho: 'Ótica', cidade: 'Inhumas, GO', whatsapp: '', email: '', origem: 'Indicação', status: 'ativo', desde: '', obs: 'Rede de óticas do Dr. José Neto. Contato da landing do Aviator: Nayma Lucena.' },
      { id: 'c-cruz', nome: 'Cruz Energy', empresa: 'Cruz Energy', nicho: 'Energia solar por assinatura e venda de usinas', cidade: 'Goiás', whatsapp: '', email: '', origem: 'Indicação', status: 'ativo', desde: '', obs: 'Empresa do Dr. José Neto. Grupo A, Grupo B e prefeituras.' },
      { id: 'c-royalle', nome: 'The Royalle', empresa: 'The Royalle Pizzaria', nicho: 'Pizzaria', cidade: 'Inhumas, GO', whatsapp: '', email: '', origem: '', status: 'ativo', desde: '', obs: '' },
      { id: 'c-ea', nome: 'EA Empreendimentos', empresa: 'EA Empreendimentos Imobiliários', nicho: 'Imobiliária', cidade: '', whatsapp: '', email: '', origem: '', status: 'ativo', desde: '', obs: '' }
    ],
    contratos: [
      { id: 'k-jose-video', clienteId: 'c-jose-neto', servico: 'video', tipo: 'recorrente', valor: 0, inicio: '', fim: '', status: 'ativo', pagamento: '', obs: 'Vídeos e conteúdo para o Instagram.' },
      { id: 'k-jose-motion', clienteId: 'c-jose-neto', servico: 'motion', tipo: 'pontual', valor: 0, inicio: '', fim: '', status: 'ativo', pagamento: '', obs: 'Animação 3D de deep plane facelift.' },
      { id: 'k-reliv-video', clienteId: 'c-reliv', servico: 'video', tipo: 'recorrente', valor: 0, inicio: '', fim: '', status: 'ativo', pagamento: '', obs: 'Vídeos e conteúdo para o Instagram.' },
      { id: 'k-oticas-lp', clienteId: 'c-oticas', servico: 'landing', tipo: 'pontual', valor: 0, inicio: '2026-11-15', fim: '', status: 'ativo', pagamento: '', obs: 'Landing de lançamento do Ray-Ban Aviator.' },
      { id: 'k-royalle-trafego', clienteId: 'c-royalle', servico: 'trafego', tipo: 'recorrente', valor: 0, inicio: '', fim: '', status: 'ativo', pagamento: '', obs: '' },
      { id: 'k-royalle-social', clienteId: 'c-royalle', servico: 'social', tipo: 'recorrente', valor: 0, inicio: '', fim: '', status: 'ativo', pagamento: '', obs: 'Social media e estratégia.' },
      { id: 'k-ea-trafego', clienteId: 'c-ea', servico: 'trafego', tipo: 'recorrente', valor: 0, inicio: '', fim: '', status: 'ativo', pagamento: '', obs: 'Anúncios Meta Ads.' }
    ],
    entregas: [
      { id: 'e-deep-plane', clienteId: 'c-jose-neto', contratoId: 'k-jose-motion', servico: 'motion', titulo: 'Motion deep plane facelift', etapa: 2, prazo: '', responsavel: '', obs: '', concluida: false }
    ],
    leads: {},
    workflows: [
      {
        id: 'w-landing', nome: 'Venda de landing page (amostra grátis)',
        passos: [
          { titulo: 'Pedido recebido', descricao: 'O pedido chega pelo formulário da landing ou do site e aparece na aba Leads.', prazo: 'No mesmo dia', responsavel: '', docs: [] },
          { titulo: 'E-mail para marcar a reunião', descricao: 'Responder pelo botão "Responder por e-mail" na aba Leads e combinar o dia da reunião de apresentação.', prazo: 'Até 24 horas', responsavel: '', docs: [] },
          { titulo: 'Briefing e materiais', descricao: 'Pedir as informações da marca para montar a amostra.', prazo: 'Antes da amostra', responsavel: '', docs: ['Logo', 'Fotos reais do trabalho', 'Lista de serviços', 'Região atendida e WhatsApp'] },
          { titulo: 'Amostra grátis', descricao: 'Produzir a amostra a partir do modelo que o cliente escolheu.', prazo: 'Até 48 horas após o pedido', responsavel: '', docs: [] },
          { titulo: 'Reunião de apresentação', descricao: 'Mostrar a amostra funcionando, o investimento e as condições: cartão em até 6x sem juros ou em até 12x, Pix com desconto.', prazo: '', responsavel: '', docs: [] },
          { titulo: 'Fechamento', descricao: 'Enviar o contrato, receber o pagamento e cadastrar o contrato no painel.', prazo: '', responsavel: '', docs: ['Contrato de prestação de serviço', 'Comprovante de pagamento', 'Dados para nota fiscal'] },
          { titulo: 'Implementação', descricao: 'Até 3 rodadas de ajustes, configuração do domínio e publicação. Senhas e acessos nunca ficam no painel.', prazo: 'No ar em até 24 horas após aprovação e pagamento', responsavel: '', docs: ['Dados do domínio'] },
          { titulo: 'Entrega e pós-venda', descricao: 'Enviar o link final, pedir um depoimento real e apresentar o próximo serviço (tráfego pago).', prazo: '', responsavel: '', docs: [] }
        ]
      }
    ],
    habilidades: [
      { id: 'h-vfx', nome: 'VFX e FOOH com Blender e After Effects', servico: 'motion', status: 'Praticando', fonte: 'Curso Editor VFX (Hotmart)', onde: 'Skill vfx-blender e repositório 360-skills', impacto: 'Abrir FOOH e 3D como serviço' },
      { id: 'h-lowticket', nome: 'Meta Ads low ticket', servico: 'trafego', status: 'Na fila', fonte: 'Método Low Ticket Meta Ads', onde: 'Pasta Cursos no Drive', impacto: 'Campanhas do Espia só e das landings' },
      { id: 'h-capcut', nome: 'Edição dinâmica no CapCut', servico: 'video', status: 'Praticando', fonte: 'Playbook de edição', onde: 'Skill edicao-de-video', impacto: '' },
      { id: 'h-roteiro', nome: 'Roteiros em funil (topo, meio e fundo)', servico: 'video', status: 'Praticando', fonte: 'Modelo de Roteiros Marketing Vision', onde: 'Skill roteiros-de-video', impacto: '' },
      { id: 'h-landing', nome: 'Landing pages com rolagem animada', servico: 'landing', status: 'Praticando', fonte: 'Coleção MotionSites', onde: 'Skill web-design-motionsites', impacto: '' }
    ]
  };
};
