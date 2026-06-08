# Dashboard de decisao operacional da Transagua

## Objetivo

Reorganizar o dashboard principal para funcionar como uma tela de decisao operacional. A tela deve responder em poucos segundos:

- O que esta acontecendo agora?
- O que exige atencao primeiro?
- Qual contrato ou equipe esta mais critica?
- Qual acao o coordenador deveria priorizar?

O dashboard deve ficar mais enxuto, menos repetitivo e mais executivo, mantendo a identidade visual profissional da Transagua.

## Principio de design

A hierarquia da tela deve priorizar diagnostico e acao. Numeros continuam presentes, mas cada indicador precisa explicar a conclusao operacional associada ao numero.

Dados de ritmo, metas abaixo do esperado, contratos atrasados, efetivo e solicitacoes nao devem aparecer como blocos concorrentes. Eles devem alimentar uma leitura unica de severidade e prioridade.

## Layout proposto

### 1. Diagnostico geral no topo

O primeiro elemento percebido pelo usuario sera uma faixa de resumo com uma mensagem direta da situacao geral.

Exemplos de mensagem:

- "Operacao critica: 2 contratos exigem acao imediata, 5 equipes abaixo da meta e 4 solicitacoes pendentes."
- "Operacao em atencao: 4 contratos atrasados, 5 equipes abaixo da meta e 4 solicitacoes pendentes."
- "Operacao dentro do esperado: contratos no ritmo e sem prioridades criticas no periodo."

A mensagem deve variar conforme os dados:

- Critica: existe pelo menos um contrato muito abaixo do cronograma ou uma combinacao de atraso, meta abaixo e efetivo diferente do planejado.
- Em atencao: existem atrasos moderados, equipes abaixo da meta, efetivo divergente ou solicitacoes pendentes.
- Dentro do esperado: nao ha sinais relevantes de atraso ou pendencia.

### 2. Indicadores com conclusao

Manter os principais indicadores, mas cada card deve trazer uma frase curta de interpretacao.

Cards previstos:

- Contratos atrasados: quantidade de contratos atrasados e quantos exigem acao imediata.
- Solicitacoes pendentes: quantidade pendente e orientacao para priorizar as vinculadas a contratos atrasados.
- Efetivo diferente do planejado: quantidade de contratos afetados e se isso impacta contratos atrasados.
- Equipes abaixo da meta: quantidade e onde esta o maior impacto, quando houver dado suficiente.
- Ritmo da operacao: quantidade de contratos no ritmo e fora do esperado.

Os textos devem usar linguagem de coordenacao, nao jargao de sistema.

Renomeacoes:

- "Divergencia de efetivo" vira "Efetivo diferente do planejado".
- "Contratos dentro do ritmo" vira "Ritmo da operacao".
- "Metas abaixo do esperado" vira "Equipes abaixo da meta".
- "Alertas operacionais" vira "Atencao imediata".

### 3. Atencao imediata

Criar uma secao central chamada "Atencao imediata" ou "Prioridades operacionais", com no maximo 5 itens.

Cada item deve mostrar:

- Nome do contrato ou servico.
- Motivo da prioridade.
- Status visual: Critico, Atencao ou Pendente.
- Uma conclusao curta que indique por que o coordenador deve olhar para aquilo.

Exemplo:

- "Rede coletora - Vila Esperanca"
  "Contrato atrasado, execucao abaixo do esperado e efetivo diferente do planejado."
  Status: "Critico"

### 4. Ritmo da operacao como aprofundamento

Unificar os blocos hoje separados de ritmo, metas e comparativo em uma unica secao secundaria.

Essa secao deve mostrar os contratos mais fora do esperado, ordenados pelo desvio entre executado e esperado. Ela deve ajudar o coordenador a entender o contexto depois de ler as prioridades, sem competir com a secao central.

## Regra de criticidade

A criticidade sera inferida automaticamente a partir do atraso em relacao a meta e cronograma. Nao sera criado um campo manual de criticidade.

Sinais usados na priorizacao:

- Contrato muito abaixo do cronograma esperado.
- Servico ou equipe abaixo da meta diaria do periodo.
- Efetivo diferente do planejado.
- Solicitacao pendente associada a contrato atrasado.
- Combinacao de dois ou mais sinais no mesmo contrato.

Ordenacao recomendada:

1. Contratos com maior atraso percentual e sinais combinados.
2. Contratos atrasados com equipes abaixo da meta.
3. Solicitacoes pendentes associadas a contratos atrasados.
4. Efetivo diferente do planejado em contratos ativos.
5. Demais desvios moderados.

## Dados e comportamento

O dashboard continuara usando os dados ja carregados de contratos, lancamentos diarios e solicitacoes operacionais.

O filtro de periodo atual deve ser preservado: Hoje, Semana e Total.

As metricas de atraso por cronograma devem considerar contratos ativos. As metricas de metas e efetivo devem respeitar o periodo selecionado.

Quando nao houver dados suficientes, a tela deve mostrar conclusoes neutras e estados vazios objetivos, sem criar alarmes falsos.

## Componentes afetados

Arquivo principal esperado:

- `src/pages/Dashboard.tsx`

Componentes auxiliares podem ser ajustados apenas se isso melhorar clareza sem ampliar o escopo:

- `src/components/MetricCard.tsx`
- componentes `Card`, `Badge` e utilitarios ja existentes

Nao faz parte do escopo alterar cadastro de contratos, solicitacoes, revisao ou lancamentos diarios.

## Criterios de aceitacao

- O topo do dashboard apresenta uma mensagem clara de diagnostico operacional.
- A tela tem menos blocos simultaneos que a versao atual.
- Indicadores principais mostram numero e interpretacao curta.
- Existe uma secao central de prioridades com no maximo 5 itens.
- As prioridades sao ordenadas por severidade operacional inferida dos dados.
- Informacoes repetidas de ritmo, metas e contratos atrasados aparecem agrupadas.
- Os textos ficam mais compreensiveis para coordenadores.
- A tela permanece responsiva, limpa e alinhada a identidade visual da Transagua.

## Verificacao

Depois da implementacao, verificar:

- Build TypeScript/Vite.
- Renderizacao do dashboard em desktop e mobile.
- Estados com dados, sem dados e com diferentes periodos selecionados.
- Se a primeira leitura da tela destaca diagnostico e prioridade, nao apenas numeros.
