# Evolução corporativa do Gerenciador de Demandas

## 1. Proposta do produto

Transformar o aplicativo em uma plataforma corporativa de serviços de campo: **receber uma demanda, planejar o atendimento, executar com evidências, controlar materiais e custos, obter o aceite do cliente e entregar um relatório confiável**. Tudo conectado, sem telas isoladas ou ações que prometem algo e não entregam.

A evolução será incremental, preservando demandas, fotos, assinaturas, equipes e relatórios existentes. Não será apenas uma troca de aparência nem uma reconstrução que descarte o histórico.

### Escopo confirmado
- Design corporativo, sofisticado, moderno e sem aparência genérica de sistema feito por IA.
- Financeiro limitado ao **resultado por demanda**: materiais, mão de obra, deslocamento, valor cobrado e margem. Contabilidade, pagamentos e fluxo de caixa ficam fora desta evolução.
- Cliente poderá acompanhar, receber o relatório, aprovar orçamento, assinar e avaliar.
- Também entram histórico de clientes/equipamentos, registros de chegada e saída, operação sem sinal, exportações em lote e aperfeiçoamento dos alertas de estoque.

## 2. Base verificada e prioridades

A leitura das rotas, telas, serviços e algumas funções/regras do Supabase confirmou:
- Existem demandas, agenda, equipe, estoque, campos técnicos, fotos, mensagens, assinaturas e PDF individual. Isso confirma a estrutura implementada, **não comprova que todos os caminhos funcionam em produção**.
- Em Demandas, o botão Exportar está sem ação. A criação pode ignorar falhas ao adicionar materiais e ainda informar sucesso.
- Na finalização, “adicionar estoque” aponta para `/inventory`, mas a rota existente é `/estoque`. “Prosseguir mesmo assim” chama novamente a mesma validação, sem um caminho real de exceção.
- O tipo de status inclui “agendado”, mas o controle de finalização não o representa integralmente.
- Há custos unitários no estoque; orçamento e resultado financeiro por demanda precisam ser adicionados.
- A função de alerta de estoque mínimo já existe no banco. A proposta é verificar seu acionamento e melhorar o comportamento, não duplicá-la.
- O visual usa gradientes, painéis sobrepostos, sombras e regras globais de tamanho que dificultam consistência. O PWA tem declarações de identidade em mais de um lugar.
- A política de inserção de papéis admite um primeiro papel pelo próprio usuário; a exclusão de demandas tem uma condição administrativa sem filtro explícito de organização. Esses pontos exigem revisão prioritária de privilégios, funções auxiliares e isolamento antes de ampliar o acesso externo.

**Limite do diagnóstico:** ainda faltam testes completos com sessões reais, revisão integral das permissões e comprovação da instalação/sincronização do aplicativo. Não assumir que a análise anterior comprovou tudo. Não remover arquivos aparentemente antigos sem verificar também importações dinâmicas; o PDF profissional é chamado dinamicamente nos detalhes da demanda.

## 3. Direção visual: console corporativo REVO

Adotar a identidade REVO já trabalhada nos relatórios como referência, preservando a logo correta existente, sem inventar uma nova marca.

- Superfícies claras, texto grafite, divisórias discretas e amarelo REVO `#F4FF00` em pontos de destaque. Amarelo nunca como texto de baixo contraste sobre branco.
- Navegação lateral no computador e navegação inferior enxuta no celular, com nomes claros e ações acessíveis. Eliminar a duplicação da marca no cabeçalho e na barra inferior do computador.
- Tipografia sem serifa, hierarquia objetiva, números fáceis de comparar, espaçamento consistente e cantos discretos. Sem gradientes decorativos, brilho, sombras pesadas, emojis ou caixas dentro de caixas.
- Listas e tabelas para gestão; informações agrupadas e ações grandes para execução em campo. O técnico vê sua agenda e atendimentos; o gestor vê pendências e operação, sem uma nova tela de indicadores decorativos.
- Detalhe da demanda organizado em **Resumo, Execução, Materiais, Financeiro, Evidências e Histórico**, com identificação/status visíveis e uma próxima ação principal.
- Status sempre com nome e símbolo; cor nunca como único sinal. Contraste AA, foco de teclado e movimento reduzido.
- Tema escuro complementar legível. As preferências existentes serão compatibilizadas, evitando combinações que descaracterizem a marca ou prejudiquem contraste.
- PDF com páginas internas leves, fotos tituladas, assinaturas legíveis e capa já aprovada. Não reabrir o redesign da capa nem trocar a imagem correta.

## 4. Um fluxo único de atendimento

```text
Cliente/local/equipamento → Demanda → Planejamento e orçamento
→ Aprovação, quando aplicável → Agenda/equipe/materiais
→ Chegada e execução → Conferência técnica e de estoque
→ Conclusão técnica → Aceite do cliente → Relatório e histórico
```

Orçamento, execução e aceite terão estados próprios: uma demanda tecnicamente concluída pode aguardar assinatura, sem voltar artificialmente para “em andamento”. Demandas sem orçamento continuam possíveis. As etapas comerciais não serão obrigatórias retroativamente para registros antigos.

### Regras de coerência
1. Cada etapa mostra responsável, pendência e próxima ação; toda ação visível funciona ou explica por que está indisponível.
2. Transições de status são validadas no servidor. Cancelamento e reabertura exigem motivo e permissão; reagendamento conserva o histórico.
3. Conclusão confere os requisitos do tipo de serviço e os materiais consumidos. Falta de estoque bloqueia a baixa e oferece resolução real; não haverá um “ignorar” fictício.
4. A conclusão e a baixa acontecem de forma atômica e uma única vez, inclusive com cliques repetidos ou sincronização. Reabertura não duplica consumo; correções geram movimentos compensatórios autorizados.
5. Mensagem interna, custo, margem e observações reservadas nunca aparecem para o cliente por acidente. Relatório interno e relatório do cliente têm conteúdo explicitamente separado.
6. Valores estimados e realizados são distintos; ausência de informação não vira zero silenciosamente. Alterar o cadastro de um material não altera o custo histórico de uma demanda encerrada.
7. Fotos mantêm título, ordem e vínculo com a demanda. Falha de upload é visível e recuperável; foto ausente não é ocultada como se tivesse sido enviada.
8. Alterações relevantes registram autor e horário. Assinaturas/aprovações identificam a versão aceita; mudanças posteriores exigem nova versão, não sobrescrita silenciosa.

## 5. Etapas de entrega, em ordem

### Etapa 1 — Confiabilidade e proteção da operação
- Percorrer criação, atribuição, agenda, fotos, materiais, conclusão e PDF; reproduzir erros antes de corrigi-los.
- Corrigir exportação sem ação, caminho do estoque, finalização contraditória e falhas parciais de criação. Unificar regras dos status existentes.
- Revisar permissões por organização e perfil, privilégios administrativos, convites e acesso a fotos. Remover possibilidades de autoelevação; restringir diagnóstico em produção.
- Revisar criação de saldo, concorrência, consumo único, cancelamento e reabertura. Verificar os gatilhos realmente ativos e o alerta de estoque mínimo.
- Recuperar os testes existentes e acrescentar proteção para os caminhos críticos.

**Aceite:** criar uma demanda com materiais, atribuir técnico, executar e concluir; falta de estoque mostra o item correto e a resolução; saldo é baixado uma única vez. Testes negativos comprovam que outro perfil/organização não acessa nem altera o que não deve.

### Etapa 2 — Nova experiência visual de ponta a ponta
- Definir um único conjunto de estilos e componentes; aplicar primeiro em navegação, Demandas e detalhes, depois agenda, estoque, equipe, relatórios, configurações e acesso.
- Reorganizar criação em passos curtos: identificação → planejamento → revisão. Preservar o preenchimento ao voltar e mostrar erros junto ao campo.
- Implementar filtros claros, pesquisa, ordenação, seleção em lote e estados vazios/de erro. Preservar filtros ao entrar e voltar de uma demanda.
- Simplificar a tela inicial conforme perfil e uniformizar carregamentos, confirmações e notificações.

**Aceite:** percurso operacional completo com a mesma linguagem visual, sem sobreposições ou cortes em computador/celular; teclado, contraste e mensagens de erro conferidos. Nenhuma tela principal fica no visual antigo.

### Etapa 3 — Clientes, locais, equipamentos e resultado financeiro
- Criar fichas de clientes com contatos e locais, equipamentos com modelo/número de série e histórico vinculado às demandas.
- Fazer vinculação assistida dos registros antigos; não unir clientes automaticamente apenas pelo nome.
- Orçamento versionado com itens, validade e total. Registrar materiais, mão de obra, deslocamento e outros custos declarados, separando previsão e realizado.
- Mostrar valor cobrado, custo total, resultado e margem. Preservar custos utilizados no atendimento; respeitar as unidades de medida e precisão do domínio.
- Custos/margens visíveis apenas a perfis autorizados. Não inventar preços, taxas, moeda ou regras fiscais; preservar a configuração real e confirmar o que não estiver definido.

**Aceite:** orçamento e realizado podem divergir com rastreabilidade; total confere com os itens e custo histórico não muda ao editar o material. Cliente vê orçamento, não margem interna.

### Etapa 4 — Jornada do cliente
- Página restrita à demanda por link seguro, com acompanhamento, orçamento, aprovação/recusa, relatório final, assinatura e avaliação.
- Link com expiração e revogação, validado no servidor, sem tornar demandas ou fotos públicas. Ações sensíveis exigem confirmação adicional da identidade do destinatário.
- Aprovação registra versão, identificação e data. Ajustar orçamento após aprovação cria revisão e solicita novo aceite.
- Assinatura remota identifica signatário, aceite e documento; registrar trilha de evidência sem prometer certificação digital ou validade jurídica universal.
- Compartilhamento inicial pelo WhatsApp abre mensagem pronta para o usuário enviar. Automação fica como complemento condicionado a conta Business, permissões, modelos aprovados e custos do serviço; não inclui uma central de conversas nesta etapa.

**Aceite:** cliente acompanha, aprova/recusa, assina e avalia; resultado aparece para a equipe. Link expirado/revogado falha com segurança, e nenhuma comunicação interna ou margem é exposta.

### Etapa 5 — Campo e operação sem sinal
- Registrar chegada/saída por técnico e visita, duração e localização pontual quando autorizada; sem rastreamento contínuo.
- Se GPS for negado ou indisponível, permitir justificativa e marcar a localização como não verificada, sem afirmar presença comprovada.
- Salvar localmente rascunhos, dados técnicos e fotos dos atendimentos previamente carregados, com fila de envio e indicação de pendências.
- Sincronizar ao reabrir/recuperar sinal, com repetição segura e resolução explícita de conflito. Separar dados por conta/organização e tratar saída da conta sem descartar pendências silenciosamente.
- Aprovação externa e conclusão com baixa de estoque dependem de confirmação online; offline permite preparar, não simular confirmação do servidor.
- Padronizar nome, ícones e atualização do PWA; evitar atualização forçada que interrompa preenchimento ou envio.

**Aceite:** carregar atendimento, perder sinal, preencher e fotografar, fechar/reabrir e reconectar; conteúdo reaparece e é enviado uma vez. Verificação offline será feita no aplicativo publicado, não prometida no editor.

### Etapa 6 — Relatórios, exportações e fechamento
- Exportar Demandas e estoque em CSV/XLSX respeitando filtros, seleção, permissões e conjunto completo, sem corte silencioso por limite de consulta.
- PDFs individuais/em lote com progresso, tratamento de falhas e opção de repetir itens; preservar título da demanda no nome do arquivo.
- Conferir fotos e títulos, paginação, textos longos, campos técnicos, materiais e assinaturas. Relatório do cliente exclui conteúdo interno por padrão.
- Alertas de estoque mínimo sem duplicação repetitiva, com acesso direto ao item e ação de reposição.
- Consolidar implementação somente após mapa de uso: rotas, consultas, relatórios, notificações, estilos e configurações do PWA/testes.

**Aceite:** quantidade exportada confere com a seleção; PDFs extensos não cortam conteúdo; evidências e custos autorizados conferem com a demanda; erros de itens do lote são identificáveis.

## 6. Detalhes técnicos e disciplina de execução

- Manter React/Vite e o Supabase conectado. Não migrar de plataforma nem introduzir integrações pagas como condição para o fluxo básico.
- Modelagem nova vinculada à organização e à demanda; migrações aditivas, permissões explícitas e preservação dos dados. Revisar SQL e impactos antes de cada mudança.
- Centralizar transições, cálculos e permissões; decisões sensíveis também no servidor. Acesso externo por funções com validação e resposta mínima autorizada.
- Arquivos privados com acesso temporário; aprovação e assinatura não dependem de uma URL de foto duradoura. Tokens de compartilhamento protegidos e fora dos registros de diagnóstico.
- Fila offline em IndexedDB com identificadores idempotentes, versões e estados de erro; service worker gerado e registro controlado, sem interferir no preview.
- Registrar regras visuais/de negócio e decisões técnicas no início da implementação; manter lista de entregas e pendências por etapa. Arquivos antigos só são removidos após comprovar desuso.
- Testes unitários de cálculos/transições; integração de estoque/permissões; navegador para o fluxo de gestor, técnico e cliente; revisão visual e PDFs representativos.

## 7. Critério de conclusão e primeira entrega

Cada etapa termina com evidência do fluxo funcionando, não apenas telas prontas. Testar uma demanda representativa com cliente, equipamento, mais de um técnico, materiais, fotos tituladas, assinatura e relatório, além de caminhos de erro e acesso negado. Usar dados de teste autorizados, sem alterar atendimentos de produção para demonstrar funcionamento.

**Primeira entrega após aprovação:** Etapa 1 e a fundação visual da Etapa 2, aplicada à navegação, Demandas e detalhes. Depois avançar às demais etapas, sem tratar a aprovação deste roteiro como promessa de implementar todas as frentes em uma única rodada. Dependências externas e acessos necessários serão nomeados, nunca escondidos como recursos concluídos.