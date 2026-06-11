# Relatório de Regressão P0 — Lord's Burger House
Data: 2026-06-10

---

## Resumo das Correções Aplicadas

| ID    | Título                              | Arquivo(s) modificado(s)                   | Status   |
|-------|-------------------------------------|--------------------------------------------|----------|
| P0.1  | Sanitização XSS (escapeHtml)        | 8 arquivos (ver abaixo)                    | ✅ Feito |
| P0.2  | Firestore como fonte única          | assets/js/app.js                           | ✅ Feito |
| P0.3  | Padronização de categorias          | admin/products.html, admin/dashboard.html  | ✅ Feito |
| P0.4  | guestProfiles — leitura restrita    | firestore.rules                            | ✅ Feito |
| P0.5  | Validação status='pending' no create| firestore.rules                            | ✅ Feito |

---

## P0.1 — Sanitização XSS

### Função adicionada (idêntica em todos os arquivos)
```javascript
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
```

### Arquivos e vetores corrigidos

| Arquivo | Campos escapados |
|---------|-----------------|
| `assets/js/app.js` | `p.img`, `p.name`, `p.desc`, `p.catLabel`, `p.badge`, `p.badgeClass`, `p.id`, `c.img`, `c.name`, `c.items`, `c.id`, `item.img`, `item.name`, `item.obs` |
| `pages/checkout.html` | `i.img`, `i.name` em `renderSummary` |
| `pages/admin/orders.html` | `o.orderNumber`, `o.customerName`, `o.customerPhone`, `o.payment`, `i.name`, `o.address`, `o.obs` |
| `pages/admin/dashboard.html` | `o.orderNumber`, `o.customerName`, `name` em `renderTopProducts` |
| `pages/admin/products.html` | `p.img`, `p.name`, `p.desc`, `c.img`, `c.name`, `c.items` |
| `pages/admin/users.html` | `u.name`, `u.email`, `u.phone` |
| `pages/attendant/dashboard.html` | `o.orderNumber`, `o.customerName`, `o.address`, `i.name`, `o.obs` (fila e tabela) |
| `pages/customer/orders.html` | `i.name`, `o.payment`, `o.obs` |

### Vetores NÃO escapados (risco residual aceito)
- `onclick="openModal(${JSON.stringify(p).replace(/"/g,'&quot;')})"` em `admin/products.html` — requer refactor maior (P1)
- `onclick="deleteUser('${u.id}',...)"` em `admin/users.html` — Firestore UIDs são alphanumeric, risco mínimo
- `status-badge--${o.status}` em CSS classes — risco nulo (não executa JS)
- `pages/auth/login.html` e `pages/auth/register.html` — confirmados limpos (usam `textContent`)

---

## P0.2 — Firestore como Fonte Única de Produtos

### O que foi removido
- Array `PRODUCTS` (27 itens, ~256 linhas) — removido de `app.js`
- Array `COMBOS` (3 itens, ~22 linhas) — removido de `app.js`

### O que foi adicionado
```javascript
let currentProducts = [];
let currentCombos   = [];

// No DOMContentLoaded:
document.addEventListener('firebaseStoreReady', e => {
  currentProducts = e.detail.products || [];
  currentCombos   = e.detail.combos   || [];
  renderProducts(activeFilter);
  renderCombos();
  window.__APP_READY__ = true;  // ← habilita atualizações em tempo real
});

// Para atualizações live via firebase-store.js:
window.renderProducts = filter => { ... };
window.renderCombos   = () => { ... };
```

### Estado de carregamento
- Enquanto o Firestore não responde: `<p>Carregando cardápio...</p>` (placeholder)
- Se Firestore retornar vazio: `<p>Nenhum produto disponível.</p>`

### Compatibilidade de campo
`renderProducts` agora aceita tanto `p.cat` (campo legacy) quanto `p.category` (campo Firestore):
```javascript
currentProducts.filter(p => (p.cat || p.category) === filter)
```

---

## P0.3 — Padronização de Categorias

### Slug padrão definido (singular, lowercase)
| Slug | Label |
|------|-------|
| `royale` | Hambúrguer Royale |
| `smash` | Smash Burger |
| `especial` | Especial |
| `acompanhamento` | Acompanhamento |
| `bebida` | Bebida |
| `sobremesa` | Sobremesa |

### Alterações em `admin/products.html`
- `CATS` array: `['royale','smash','especial','acompanhamento','bebida','sobremesa']`
- `CAT_LABELS` atualizado com todos os slugs
- `<select id="fCategory">` — 6 options com slugs corretos
- `categoryLabel` no handler de save — mapeamento completo

### Alterações em `admin/dashboard.html` (seed)
- `'acompanhamentos'` → `'acompanhamento'` (2 produtos)
- `'bebidas'` → `'bebida'` (3 produtos)
- `'sobremesas'` → `'sobremesa'` (1 produto)
- `categoryLabel` equivalentes atualizados

---

## P0.4 — guestProfiles: Leitura Restrita

### Regra anterior
```
match /guestProfiles/{phone} {
  allow read, write: if true;  // qualquer pessoa lia qualquer perfil guest
}
```

### Regra nova
```
match /guestProfiles/{phone} {
  allow read:   if isAdmin() || (isAuth() && userPhone() == phone);
  allow write:  if true;   // guest checkout precisa escrever sem autenticação
  allow delete: if isAdmin();
}
```

### Impacto
- Guest checkout **não afetado** — a escrita continua pública (necessário)
- Leitura: apenas admin ou o próprio usuário autenticado com aquele telefone
- Deleção: apenas admin

---

## P0.5 — Validação de Status no Create de Pedidos

### Regra anterior
```
allow create: if (
  (request.auth == null && request.resource.data.customerId == null)
  || ...
);
```

### Regra nova
```
allow create: if (
  request.resource.data.status == 'pending'  // ← nova condição
  && (
    (request.auth == null && request.resource.data.customerId == null)
    || ...
  )
);
```

### Impacto
- Pedidos criados com `status != 'pending'` (ex: `'delivered'`, `'admin'`) são **rejeitados** pelo Firestore
- Frontend em `pages/checkout.html` já enviava `status: 'pending'` — sem regressão
- Frontend em `pages/attendant/dashboard.html` já enviava `status: 'pending'` — sem regressão

---

## Checklist de Regressão Manual

### Fluxo do cliente (cardápio → carrinho → checkout)
- [ ] Página inicial carrega com `"Carregando cardápio..."` até Firestore responder
- [ ] Produtos do Firestore aparecem após evento `firebaseStoreReady`
- [ ] Filtros de categoria funcionam (royale, smash, especial, acompanhamento, bebida, sobremesa)
- [ ] Botão "+" adiciona produto ao carrinho
- [ ] Modal do produto abre/fecha corretamente
- [ ] Carrinho exibe itens com nomes e imagens corretos
- [ ] Botão "Finalizar Pedido" redireciona para checkout.html
- [ ] Checkout exibe resumo dos itens corretamente
- [ ] Pedido é criado com `status: 'pending'` no Firestore

### Fluxo admin
- [ ] Login admin funciona
- [ ] Dashboard exibe pedidos recentes com nomes escapados
- [ ] "Popular cardápio inicial" cria produtos com slugs corretos
- [ ] Admin/products: adicionar produto usa categoria correta (singular)
- [ ] Admin/orders: tabela exibe nomes/telefones/endereços escapados
- [ ] Admin/orders: expandir linha mostra itens e obs escapados
- [ ] Admin/users: tabela exibe nome/email/telefone escapados

### Fluxo atendente
- [ ] Login atendente funciona
- [ ] Fila exibe pedidos com nomes e obs escapados
- [ ] Tabela "Todos os pedidos" exibe dados escapados
- [ ] Novo pedido manual cria com `status: 'pending'`

### Fluxo cliente logado
- [ ] Login cliente funciona
- [ ] Página "Meus Pedidos" exibe itens e obs escapados

### Segurança
- [ ] Tentar criar pedido com `status: 'confirmed'` direto via API → rejeitado pelo Firestore
- [ ] Tentar ler `guestProfiles/{phone}` sem autenticação → negado
- [ ] Payload com `<script>alert(1)</script>` em nome de produto → aparece escapado como `&lt;script&gt;`

---

## Itens P0 NÃO Introduzidos (confirmado)
- Nenhuma nova funcionalidade adicionada
- Nenhuma mudança de design
- Nenhuma biblioteca adicionada
- Nenhuma mudança de UX
- P1, P2, P3 não tocados
