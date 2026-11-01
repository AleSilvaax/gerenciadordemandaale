import type { ChecklistTemplate } from '@/types/checklist';

export const EV_TEMPLATE_NAME = 'Vistoria / Instalação de Carregador Veicular (EV)';

export const evChargerTemplate: ChecklistTemplate = {
  steps: [
    {
      id: 'dados_iniciais',
      title: 'Dados Iniciais',
      fields: [
        { id: 'inicio_vistoria', label: 'Início da Vistoria', type: 'timestamp', help: 'Registre o momento em que a vistoria começou.' },
        { id: 'cep', label: 'CEP', type: 'text', required: true, placeholder: '00000-000' },
        { id: 'logradouro', label: 'Logradouro', type: 'text', required: true },
        { id: 'numero', label: 'Número', type: 'text', required: true },
        { id: 'complemento', label: 'Complemento', type: 'text' },
        { id: 'bairro', label: 'Bairro', type: 'text' },
        { id: 'cidade_uf', label: 'Cidade/UF', type: 'text', required: true },
        {
          id: 'km_ida', label: 'Km de ida (base até o cliente)', type: 'number',
          help: 'Com o endereço preenchido, consulte no Maps/Waze a distância somente de ida da base até este endereço.',
        },
        {
          id: 'tipo_imovel', label: 'Tipo de Imóvel', type: 'cards', required: true,
          options: [
            { value: 'Casa', label: 'Casa', icon: 'home' },
            { value: 'Apto', label: 'Apto', icon: 'building' },
            { value: 'Condomínio', label: 'Condomínio', icon: 'buildings' },
            { value: 'Comercial', label: 'Comercial', icon: 'store' },
            { value: 'Eletroposto', label: 'Eletroposto', icon: 'zap' },
            { value: 'Frota', label: 'Frota', icon: 'truck' },
          ],
        },
      ],
    },
    {
      id: 'quadro_eletrico',
      title: 'Quadro Elétrico',
      notice: 'Esta etapa exige fotos: fotografe o quadro aberto, fechado e o aterramento. As fotos devem ser adicionadas na aba Fotos.',
      fields: [
        {
          id: 'tipo_rede', label: 'Tipo de rede', type: 'select', required: true,
          options: [
            { value: 'Monofásico (F+N+T)', label: 'Monofásico (F+N+T)' },
            { value: 'Bifásico (2F+N+T)', label: 'Bifásico (2F+N+T)' },
            { value: 'Bifásico (2F+N)', label: 'Bifásico (2F+N)' },
            { value: 'Trifásico (3F+N+T)', label: 'Trifásico (3F+N+T)' },
            { value: 'Trifásico sem neutro', label: 'Trifásico sem neutro' },
          ],
        },
        { id: 'disjuntor_geral', label: 'Disjuntor geral (A)', type: 'number' },
        { id: 'bitola_entrada', label: 'Bitola do cabo de entrada (mm²)', type: 'number' },
        { id: 'tensao_fases', label: 'Tensão entre fases (V)', type: 'number' },
        { id: 'tensao_fase_neutro', label: 'Tensão entre fase + neutro (V)', type: 'number' },
        { id: 'fase_amperimetro', label: 'Fase - amperímetro (A)', type: 'number' },
        {
          id: 'espaco_disjuntor_idr', label: 'Espaço para disjuntor e IDR?', type: 'pills',
          options: [
            { value: 'Sim', label: '✓ Sim' },
            { value: 'Não — ampliar', label: '✕ Não — ampliar' },
          ],
        },
        {
          id: 'tem_aterramento', label: 'Tem aterramento?', type: 'pills',
          options: [
            { value: 'Sim', label: '✓ Sim' },
            { value: 'Não', label: '✕ Não' },
            { value: 'A verificar', label: '? A verificar' },
          ],
        },
        {
          id: 'tem_dps', label: 'Tem DPS instalado?', type: 'pills',
          options: [
            { value: 'Sim', label: '✓ Sim' },
            { value: 'Não', label: '✕ Não' },
          ],
        },
        { id: 'obs_quadro', label: 'Observações do quadro', type: 'textarea', placeholder: 'Estado geral, ferrugem, fios expostos...' },
      ],
    },
    {
      id: 'cabo_dimensionamento',
      title: 'Cabo e Dimensionamento',
      notice: 'Esta etapa exige fotos: fotografe o local de instalação e a rota do cabeamento na aba Fotos.',
      fields: [
        {
          id: 'distancia_quadro_carregador', label: 'Distância quadro → carregador (m)', type: 'number', required: true,
          help: 'Medir o caminho real do cabo, não em linha reta.',
        },
        { id: 'equipamento', label: 'Equipamento (modelo do carregador)', type: 'text', placeholder: 'Ex: Intelbras EV1032, Wallbox Pulsar...' },
        {
          id: 'potencia_carregador', label: 'Potência do Carregador', type: 'select', required: true,
          options: [
            { value: '3,7 kW — Mono 16A', label: '3,7 kW — Mono 16A' },
            { value: '7,4 kW — Mono/Bifásico 32A', label: '7,4 kW — Mono/Bifásico 32A' },
            { value: '11 kW — Trifásico 16A', label: '11 kW — Trifásico 16A' },
            { value: '22 kW — Trifásico 32A', label: '22 kW — Trifásico 32A' },
          ],
        },
        { id: 'especificacao_gerada', label: 'Especificação gerada', type: 'computed', compute: 'ev_spec' },
        {
          id: 'config_ligacao', label: 'Configuração de ligação do carregador', type: 'select',
          help: 'Como o carregador está realmente ligado no quadro. É isso que define a quantidade de cabos.',
          options: [
            { value: 'Monofásico (F + N + PE)', label: 'Monofásico (F + N + PE)' },
            { value: 'Bifásico (2F + PE)', label: 'Bifásico (2F + PE)' },
            { value: 'Bifásico (2F + N + PE)', label: 'Bifásico (2F + N + PE)' },
            { value: 'Trifásico (3F + N + PE)', label: 'Trifásico (3F + N + PE)' },
          ],
        },
        {
          id: 'bitola_cabo', label: 'Bitola do cabo', type: 'pills',
          options: [
            { value: '6mm²', label: '6mm²' },
            { value: '10mm²', label: '10mm²' },
            { value: '16mm²', label: '16mm²' },
            { value: '25mm²', label: '25mm²' },
            { value: 'Outra', label: 'Outra' },
          ],
        },
        { id: 'cabo_preto', label: 'Cabo Preto (Fase)', type: 'number', compute: 'cabo_preto', help: 'nº de fases × distância (m)' },
        { id: 'cabo_azul', label: 'Cabo Azul (Neutro)', type: 'number', compute: 'cabo_azul', help: 'nº de neutros × distância (m)' },
        { id: 'cabo_verde', label: 'Cabo Verde (Terra PE)', type: 'number', compute: 'cabo_verde', help: '1 × distância (m)' },
        { id: 'cabo_total', label: 'Total de cabo', type: 'computed', compute: 'cabo_total' },
        {
          id: 'posicao_definida', label: 'Posição definida com o cliente?', type: 'pills',
          options: [
            { value: 'Sim', label: '✓ Sim' },
            { value: 'Não', label: '✕ Não' },
          ],
        },
        {
          id: 'local_externo', label: 'Carregador em local externo?', type: 'pills',
          options: [
            { value: 'Sim, coberto', label: 'Sim, coberto' },
            { value: 'Sim, descoberto', label: 'Sim, descoberto' },
            { value: 'Não, interno', label: 'Não, interno' },
          ],
        },
        { id: 'obs_cabo', label: 'Observações', type: 'textarea', placeholder: 'Queda de tensão, agrupamento, método de instalação...' },
      ],
    },
    {
      id: 'adicionais',
      title: 'Adicionais',
      fields: [
        {
          id: 'adicionais', label: 'Itens adicionais', type: 'binary_list', required: true,
          help: 'Responda todos os itens abaixo — é obrigatório informar SIM ou NÃO para cada um.',
          items: [
            { id: 'furo_tecnico', title: 'Necessário furo técnico?', subtitle: 'Passagem por parede, laje ou estrutura' },
            { id: 'documento_adicional', title: 'Documento adicional?', subtitle: 'Diagrama unifilar, croqui, memorial descritivo' },
            { id: 'medidor_dedicado', title: 'Medidor de energia dedicado?' },
            { id: 'totem_pedestal', title: 'Precisa de totem / pedestal?' },
            { id: 'andaime_altura', title: 'Andaime / trabalho em altura?', subtitle: 'Instalação acima de 2m' },
            { id: 'servico_alvenaria', title: 'Serviço de alvenaria?', subtitle: 'Rasgo, fechamento ou acabamento' },
            { id: 'pintura_eletroduto', title: 'Serviço de pintura de eletroduto?' },
          ],
        },
      ],
    },
    {
      id: 'especifico',
      title: 'Específico',
      highlightIf: { field: 'tipo_imovel', in: ['Apto', 'Condomínio'] },
      fields: [
        {
          id: 'aprovacao_condominio', label: 'Aprovação do condomínio?', type: 'pills',
          options: [
            { value: 'Sim', label: '✓ Sim' },
            { value: 'Não', label: '✕ Não' },
            { value: 'Em andamento', label: 'Em andamento' },
          ],
        },
        {
          id: 'sindico_notificado', label: 'Síndico notificado?', type: 'pills',
          options: [
            { value: 'Sim', label: '✓ Sim' },
            { value: 'Não', label: '✕ Não' },
          ],
        },
        {
          id: 'avcb_vigente', label: 'Possui AVCB/CLCB vigente?', type: 'pills', help: 'Confirmar com o cliente.',
          options: [
            { value: 'Sim', label: '✓ Sim' },
            { value: 'Não', label: '✕ Não' },
            { value: 'A verificar', label: '? A verificar' },
          ],
        },
        {
          id: 'adequacao_it41', label: 'Adequação IT-41 necessária?', type: 'pills',
          options: [
            { value: 'Sim', label: '✓ Sim' },
            { value: 'Não', label: '✕ Não' },
            { value: 'Validar com responsável técnico', label: 'Validar com responsável técnico' },
          ],
        },
        { id: 'obs_especifico', label: 'Observações', type: 'textarea', placeholder: 'Restrições, horários de obra...' },
      ],
    },
  ],
  photoSlots: [
    { id: 'fachada', title: 'Fachada do imóvel', instruction: 'Fotografe a frente do imóvel / entrada da garagem.', required: true },
    { id: 'quadro_aberto', title: 'Quadro — aberto', instruction: 'Fotografe com a tampa aberta, mostrando disjuntores, fiação e barramentos.', required: true },
    { id: 'quadro_fechado', title: 'Quadro — fechado', instruction: 'Fotografe o quadro fechado com a identificação dos circuitos visível.', required: true },
    { id: 'aterramento', title: 'Aterramento', instruction: 'Se houver haste de aterramento visível, fotografe com contexto do local.', required: false },
    { id: 'local_instalacao', title: 'Local de instalação do carregador', instruction: 'Fotografe o local exato onde o carregador será fixado.', required: true },
    { id: 'rota_cabeamento', title: 'Rota do cabeamento', instruction: 'Fotografe o caminho completo do cabo, do quadro até o ponto de instalação.', required: true },
    { id: 'visao_geral', title: 'Visão geral do ambiente', instruction: 'Foto ampla da garagem ou área de instalação.', required: true },
    { id: 'multimetro', title: 'Tela do multímetro', instruction: 'Fotografe o display mostrando tensão, corrente e resistência de terra.', required: true },
  ],
};
