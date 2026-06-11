# Lord's Burger House — Relatório Final P2

**Data:** 10/06/2026  
**Fase:** P2 — Refatoração Arquitetural  
**Status:** ✅ Concluída

---

## Resumo Executivo

A Fase P2 transformou o projeto de uma coleção de páginas HTML monolíticas em uma MPA modular, com código centralizado, padrões consistentes e fácil manutenção. Nenhuma funcionalidade foi alterada, criada ou removida.

---

## Itens Entregues

### P2.1 — Eliminação de duplicação de código ✅
Funções `escapeHtml`, `fmt`/`formatPrice`, `fmtDate*`, `toast` estavam replicadas em 5+ arquivos HTML. Todas foram centralizadas nos módulos `shared/` e removidas das páginas individuais.

### P2.2 — Centralização de configurações ✅
Criado `assets/js/shared/constants.js` com:
- `WHATSAPP_NUMBER = '5511940737953'`
- `DELIVERY_FEE = 5.00`
- `MIN_ORDER = 20.00`
- `PAGE_SIZES = { admin: 30, attendant: 50, customer: 10 }`

`app.js` convertido para `<script type="module">` e importa as constantes. Parâmetros antes hardcoded em 4 arquivos agora têm ponto único de manutenção.

### P2.3 — Componentização da Sidebar ✅
Criado `assets/js/shared/sidebar.js` com:
- `buildAdminSidebar(activePage)` — inclui "Acesso Rápido" apenas no dashboard
- `buildAttendantSidebar()` — com `data-view`, `id="queueBadge"`, `id="btnNewOrder"`
- `initSidebar({role, activePage})`, `bindSidebarToggle()`, `setSidebarUser(name, email)`

HTML de sidebar estático removido de todos os 5 painéis. A sidebar tem agora **um único ponto de manutenção**.

### P2.4 — Camada de Serviços ✅
Criados 4 serviços em `assets/js/services/`:

| Arquivo | Operações |
|---------|-----------|
| `orders.service.js` | subscribeOrders, fetchMoreOrders, updateOrderStatus, deleteOrder, createOrder |
| `products.service.js` | subscribeProducts, subscribeCombos, fetchAvailableProducts, createItem, updateItem, deleteItem, setAvailability |
| `users.service.js` | subscribeUsers, changeUserRole, deleteUserDoc |
| `storage.service.js` | uploadProductImage, deleteImageByUrl |

### P2.5 — Organização de Utilitários ✅
Criados em `assets/js/shared/`:

| Módulo | Funções |
|--------|---------|
| `sanitizer.js` | `escapeHtml` |
| `formatters.js` | `fmt`, `formatPrice`, `fmtTime`, `fmtDate`, `fmtDatetime`, `fmtDay` |
| `toast.js` | `showToast(msg, type, containerId)` |

### P2.6 — Padronização de Eventos ✅
Eliminados em todas as páginas migradas:
- `onclick="funcao(...)"` inline no HTML
- `onchange="funcao(...)"` inline no HTML
- `window.nomeDaFuncao = ...` para callbacks de template strings
- `onmouseover` / `onmouseout` inline

Substituídos por **event delegation** com `data-action` + `data-id`:
```js
container.addEventListener('click', e => {
  const btn = e.target.closest('[data-action="delete"]');
  if (btn) deleteItem(btn.dataset.id);
});
```

Páginas migradas: `admin/dashboard`, `admin/orders`, `admin/products`, `admin/users`, `attendant/dashboard`, `customer/orders`.

### P2.7 — Limpeza de Código Morto ✅
Removidos de todas as páginas migradas:
- Funções `escapeHtml`, `fmt`, `fmtDate*`, `toast` locais duplicadas
- Atribuições `window.*` de funções de callback
- Bloco de sidebar toggle inline (3 linhas → `bindSidebarToggle()`)
- Código manual de atualização de avatar/nome/email → `setSidebarUser()`

### P2.8 — Documentação Técnica ✅
Criado `ARCHITECTURE.md` com:
- Stack e tipo de aplicação
- Estrutura de diretórios anotada
- Tabela de módulos compartilhados e serviços
- Padrões de código com exemplos
- Coleções Firestore e campos
- Fluxo de autenticação e guard
- Estratégias de paginação

---

## Arquivos Criados

```
assets/js/shared/constants.js
assets/js/shared/sanitizer.js
assets/js/shared/formatters.js
assets/js/shared/toast.js
assets/js/shared/sidebar.js
assets/js/services/orders.service.js
assets/js/services/products.service.js
assets/js/services/users.service.js
assets/js/services/storage.service.js
ARCHITECTURE.md
P2_FINAL_REPORT.md
```

## Arquivos Modificados

```
index.html                          — app.js agora <script type="module">
assets/js/app.js                    — import constants + sanitizer, remove duplicatas locais
pages/admin/dashboard.html          — shared modules + sidebar component
pages/admin/orders.html             — shared modules + sidebar + event delegation
pages/admin/products.html           — shared modules + sidebar + event delegation
pages/admin/users.html              — shared modules + sidebar + event delegation
pages/attendant/dashboard.html      — shared modules + sidebar + remove window.*
pages/customer/orders.html          — shared modules + remove window.*
```

---

## Restrições Respeitadas

- ✅ Nenhuma funcionalidade alterada
- ✅ Nenhuma regra de negócio alterada
- ✅ Nenhuma alteração visual
- ✅ Nenhuma funcionalidade criada
- ✅ Nenhuma funcionalidade removida

---

## Débito Técnico Documentado (P3)

| Item | Descrição |
|------|-----------|
| Serviços não consumidos | Os serviços em `services/` foram criados mas as páginas ainda usam Firebase SDK diretamente. Migrar gradualmente nas próximas iterações. |
| `firebase-store.js` bridge | O padrão `window.*` entre `firebase-store.js` e `app.js` é um legado da arquitetura não-módulo. Pode ser eliminado refatorando `app.js` para consumir `products.service.js` diretamente. |
| Toast da landing page | `app.js` usa um toast próprio (DOM estático `#toast`/`#toastMsg`) diferente do `showToast` dos painéis. Unificar em uma implementação. |
