# Lord's Burger House — Relatório Final P4 (Admin Panel)

**Data:** 10/06/2026  
**Fase:** P4 — Painel Administrativo Profissional  
**Status:** ✅ Concluída

---

## Arquivos Criados

| Arquivo | Finalidade |
|---------|------------|
| `pages/admin/analytics.html` | Dashboard de analytics com charts, relatórios, export CSV/PDF, top produtos, métricas de clientes |

## Arquivos Modificados

| Arquivo | O que mudou |
|---------|-------------|
| `pages/admin/dashboard.html` | Reescrito com 12 KPIs, queries otimizadas, sistema de alertas, link para analytics |
| `assets/js/shared/sidebar.js` | Ícone `chart` adicionado; link "Analytics" inserido na nav admin |
| `sw.js` | `analytics.html` adicionado ao precache; CACHE_VERSION bumped para `v2` |

---

## P4.1 — Dashboard com 12 KPIs

### Estrutura dos KPIs

**Linha 1 — Hoje (tempo real)**
| KPI | Fonte |
|-----|-------|
| Pedidos Hoje | `onSnapshot` restrito ao dia atual |
| Receita Hoje | Soma de `total` nos pedidos válidos do dia |
| Ticket Médio | Receita / quantidade de pedidos válidos |
| Entregues Hoje | Contagem `status === 'delivered'` no dia |

**Linha 2 — Semana e Mês (agregado)**
| KPI | Fonte |
|-----|-------|
| Pedidos Semana | `getDocs` últimos 7 dias, filtrado client-side |
| Receita Semana | Soma do resultado acima |
| Pedidos Mês | `getDocs` desde dia 1 do mês |
| Receita Mês | Soma do resultado acima |

**Linha 3 — Operacional**
| KPI | Fonte |
|-----|-------|
| Pendentes | Contagem `status === 'pending'` no dia |
| Em Preparo | Contagem confirmed + preparing + ready + delivering |
| Produtos Ativos | `getCountFromServer` — `available == true` |
| Clientes | `getCountFromServer` — `role == customer` |

---

## P4.2 — Charts com Chart.js

**CDN:** `https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js`

### Charts em `analytics.html`

| Chart | Tipo | Dados |
|-------|------|-------|
| Vendas por Dia | Bar + Line (dual axis) | Receita (barras) + Contagem de pedidos (linha) |
| Categorias | Doughnut | Quantidade vendida por categoria de produto |
| Top 5 Produtos | Bar horizontal | Top 5 produtos por quantidade no período |

**Tema escuro:** `Chart.defaults.color` e `Chart.defaults.borderColor` configurados para gold/escuro.

**Atualização:** Charts são destruídos e recriados a cada mudança de período para garantir dados corretos.

---

## P4.3 — Relatório de Vendas com Filtro de Período

**Filtros disponíveis:**
- Hoje
- Ontem
- Últimos 7 dias (padrão ao abrir)
- Últimos 30 dias
- Personalizado (date pickers: de/até)

**Comportamento:** Ao selecionar um período, todos os componentes da página são atualizados em paralelo:
1. Summary KPIs
2. Charts (sales + categories + top 5)
3. Top 10 produtos
4. Métricas de clientes
5. Tabela de pedidos

---

## P4.4 — Exportação CSV

**Formato:** UTF-8 com BOM (`﻿`) para compatibilidade Excel  
**Separador:** ponto-e-vírgula (`;`) — padrão Excel pt-BR  
**Campos:** Número, Cliente, Telefone, Data, Total, Status  
**Valores numéricos:** vírgula como decimal (`R$ 24,90`)  
**Strings:** entre aspas duplas com escape de aspas internas (`""`)

**Nome do arquivo:** `pedidos-{periodo}-{data-iso}.csv`

---

## P4.5 — Relatório PDF

**Implementação:** `window.print()` com `@media print` CSS  
**Sem dependências externas** — sem jsPDF, sem servidor

**O que aparece no PDF:**
- Header oculto na tela mas visível na impressão: logo + título + período + data de geração
- Summary KPIs (4 cards)
- Top 10 produtos (tabela completa)
- Métricas de clientes (4 cards)
- Tabela de pedidos (todos os campos)

**O que é ocultado na impressão:**
- Sidebar, topbar, period picker, charts (canvas), botões de export

**Cores adaptadas:** fundo branco, texto preto, bordas cinza para legibilidade impressa.

---

## P4.6 — Ranking Top 10 Produtos

**Campos:** # | Produto | Qtd | Receita | % Participação  
**Cálculo de receita:** `price × qty` de cada item nos pedidos válidos  
**% Participação:** `(qty_produto / total_qty_todos) × 100`  
**Visualização:** barra de progresso proporcional + percentual numérico  
**Ordenação:** por quantidade decrescente

---

## P4.7 — Métricas de Clientes

| Métrica | Cálculo |
|---------|---------|
| Clientes Únicos | `Set` de `customerUid || customerEmail || customerName` nos pedidos válidos do período |
| Novos Cadastros | `getDocs(users, createdAt >= start)` filtrado por `role === 'customer'` client-side |
| Recorrentes | Clientes com 2+ pedidos no período |
| Média Pedidos/Cliente | `total_pedidos / clientes_únicos` |

---

## P4.8 — Alertas Operacionais

### Alerta visual — Banner

- Banner vermelho no topo do dashboard quando há pedidos `pending > 0`
- Animação de pulso na bolinha vermelha
- Contador de pendentes atualizado em tempo real
- Botão "Ver agora" → `orders.html`
- Desaparece automaticamente quando todos os pedidos pendentes são confirmados

### Alerta visual — KPI Card

- Card "Pendentes" muda para texto vermelho quando `pending > 0`

### Alerta visual — Sidebar badge

- Badge `#pendingBadge` exibe `pending + preparing` (pedidos ativos)

### Alerta sonoro — Web Audio API

```javascript
// Toca quando novos pedidos pending aparecem na subscription
const osc = audioCtx.createOscillator();
osc.frequency: 880Hz → 660Hz (descend, 0.45s)
gain: 0.3 → fade exponential
```

**Regra de disparo:** Som + toast só tocam quando `prevPendingIds.size > 0` e há novos IDs — evita tocar no carregamento inicial da página.

**Toast:** `🍔 N novo(s) pedido(s) pendente(s)!` com `showToast(..., 'warning')`

---

## P4.9 — Performance

### Antes (problema)
```javascript
// Subscrevia TODOS os pedidos de todos os tempos
onSnapshot(query(collection(db,'orders'), orderBy('createdAt','desc')), ...)
```

### Depois (solução)

**Dashboard — Live subscription restrita:**
```javascript
// Apenas pedidos de HOJE — reduz leituras em ~99% para histórico longo
onSnapshot(query(orders, where('createdAt','>=', todayStart), orderBy('createdAt','desc')), ...)
```

**Dashboard — Aggregates one-time:**
```javascript
// Week + month: uma chamada getDocs por período, não subscription
const [weekSnap, monthSnap] = await Promise.all([
  getDocs(query(orders, where('createdAt','>=', weekStart))),
  getDocs(query(orders, where('createdAt','>=', monthStart))),
]);
```

**Dashboard — Contagens estáticas:**
```javascript
// getCountFromServer: não baixa documentos, só o count
getCountFromServer(query(products, where('available','==',true)))
getCountFromServer(query(users, where('role','==','customer')))
```

**Analytics — Sem subscriptions:**
- Todas as queries usam `getDocs` (one-time)
- Carregamento paralelo com `Promise.all`
- Re-query somente quando o usuário muda o período manualmente

---

## P4.10 — Checklist Final

### Dashboard (`pages/admin/dashboard.html`)
- [x] 12 KPIs em 3 linhas de 4 cards
- [x] Performance: `onSnapshot` restrito ao dia atual
- [x] Performance: `getDocs` para semana e mês
- [x] Performance: `getCountFromServer` para produtos e clientes
- [x] Alerta banner com animação de pulso
- [x] Alerta sonoro via Web Audio API (sem arquivos externos)
- [x] Toast para novos pedidos pendentes
- [x] Badge na sidebar atualizado em tempo real
- [x] Link "Analytics & Relatórios" nas Quick Actions

### Analytics (`pages/admin/analytics.html`)
- [x] Filtro de período: Hoje, Ontem, 7 dias, 30 dias, Personalizado
- [x] 4 KPIs de resumo do período
- [x] Chart: Vendas por dia (bar + line dual axis)
- [x] Chart: Categorias (doughnut)
- [x] Chart: Top 5 produtos (horizontal bar)
- [x] Top 10 produtos com qty, receita e % participação
- [x] 4 métricas de clientes (únicos, novos, recorrentes, média)
- [x] Tabela completa de pedidos com todos os campos
- [x] Exportar CSV (UTF-8 BOM, ponto-e-vírgula, Excel-compatível)
- [x] Gerar PDF (window.print + @media print CSS)
- [x] Auth guard (somente admin)
- [x] Sidebar com link "Analytics" ativo

### Sidebar (`assets/js/shared/sidebar.js`)
- [x] Ícone `chart` adicionado ao objeto `I`
- [x] Link "Analytics" adicionado entre "Pedidos" e "Usuários"
- [x] `activePage === 'analytics'` suportado

### Service Worker (`sw.js`)
- [x] `analytics.html` adicionado ao PRECACHE_ASSETS
- [x] CACHE_VERSION bumped para `v2` (força re-cache em todos os dispositivos)

---

## Limitações Conhecidas

1. **Período personalizado**: O date picker nativo tem aparência dependente do browser. Para produção, considerar flatpickr ou similar.
2. **Novos Cadastros (P4.7)**: A query de novos usuários por `createdAt` requer que o campo `createdAt` seja populado no registro. Se usuários antigos não têm esse campo, a contagem será imprecisa.
3. **Métricas de cliente**: A deduplicação de clientes usa `customerUid || customerEmail || customerName` — se a coluna `customerUid` não estiver nos documentos de pedido, a accuracy cai.
4. **Charts no PDF**: Canvases são ocultados no `@media print`. Para incluir charts no PDF, seria necessário renderizar como imagem (`canvas.toDataURL`) — não implementado pois `window.print()` é suficiente para relatórios operacionais.
5. **Chart.js CDN**: `analytics.html` requer conexão para carregar Chart.js. Para uso offline completo, seria necessário incluir o bundle no projeto.
