# Dashboard de Decisao Operacional Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar o dashboard principal da Transagua em uma tela executiva de diagnostico e priorizacao operacional.

**Architecture:** A mudanca fica concentrada em `src/pages/Dashboard.tsx`, derivando severidade e prioridades a partir dos dados ja existentes. A UI continua usando os componentes locais `Card`, `Badge`, `MetricCard` e os utilitarios atuais.

**Tech Stack:** React 19, Vite, TypeScript, Tailwind CSS v4, shadcn/base-nova components, lucide-react.

---

### Task 1: Dados Derivados de Decisao

**Files:**
- Modify: `src/pages/Dashboard.tsx`

- [ ] **Step 1: Criar tipos locais de prioridade**

Adicionar tipos para prioridade, severidade, snapshot de contrato e resumo executivo dentro de `Dashboard.tsx`.

- [ ] **Step 2: Calcular prioridades por contrato e solicitacao**

Expandir `getDashboardData` para produzir:
- contratos criticos;
- contratos fora do ritmo;
- contratos no ritmo;
- solicitacoes pendentes ligadas a contratos atrasados;
- lista `priorities` com ate 5 itens, ordenada por score.

- [ ] **Step 3: Derivar mensagem executiva**

Criar `operationSummary` com status `critical`, `attention` ou `stable`, titulo e descricao curta.

### Task 2: UI Executiva

**Files:**
- Modify: `src/pages/Dashboard.tsx`

- [ ] **Step 1: Substituir topo por diagnostico**

Trocar o bloco superior atual por uma faixa de diagnostico com mensagem principal, periodo e filtros preservados.

- [ ] **Step 2: Trocar cards numericos por cards conclusivos**

Atualizar os cinco cards para:
- Contratos atrasados;
- Solicitacoes pendentes;
- Efetivo diferente do planejado;
- Equipes abaixo da meta;
- Ritmo da operacao.

- [ ] **Step 3: Criar secao Atencao imediata**

Adicionar uma secao central com no maximo 5 prioridades, motivo e badge de status.

- [ ] **Step 4: Unificar ritmo como aprofundamento**

Remover blocos repetitivos e deixar uma secao secundaria com os contratos mais fora do esperado.

### Task 3: Verificacao

**Files:**
- Verify: `src/pages/Dashboard.tsx`

- [ ] **Step 1: Rodar build**

Run: `npm run build`
Expected: build TypeScript/Vite concluido com sucesso.

- [ ] **Step 2: Verificar no navegador**

Run: `npm run dev -- --host 127.0.0.1`
Expected: dashboard renderiza sem erro em desktop e mobile, com diagnostico no topo e prioridades visiveis.
