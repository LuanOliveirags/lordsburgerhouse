# Lord's Burger House — Arquitetura Técnica

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | HTML5 + CSS3 + JavaScript (vanilla, sem frameworks) |
| Módulos JS | ES Modules (`<script type="module">`) via CDN + arquivo local |
| Backend / DB | Firebase Firestore (SDK v10.12.2, CDN) |
| Autenticação | Firebase Auth (email/senha) |
| Storage | Firebase Storage (imagens de produtos) |
| Cloud Functions | `createStaffUser` — criação de contas staff sem logout |
| Hospedagem | GitHub Pages (Jekyll) |

## Tipo de Aplicação

**MPA (Multi-Page Application)** — cada rota é um arquivo HTML independente. Não há roteador, bundler ou framework. Cada página importa apenas os módulos que precisa.

---

## Estrutura de Diretórios

```
lordsburgerhouse/
├── index.html                    # Landing page + cardápio público
├── assets/
│   ├── css/
│   │   ├── style.css             # Estilos da landing page
│   │   └── panel.css             # Estilos das páginas de painel (admin/atendente/cliente)
│   ├── js/
│   │   ├── firebase-config.js    # Inicialização Firebase + constantes de domínio (ORDER_STATUS, ROLE_LABELS)
│   │   ├── firebase-store.js     # Bridge: carrega produtos/combos do Firestore → dispara firebaseStoreReady
│   │   ├── app.js                # Lógica da landing page (carrinho, modal, WhatsApp)
│   │   ├── shared/               # Utilitários reutilizados por todas as páginas de painel
│   │   │   ├── constants.js      # WHATSAPP_NUMBER, DELIVERY_FEE, MIN_ORDER, PAGE_SIZES
│   │   │   ├── sanitizer.js      # escapeHtml()
│   │   │   ├── formatters.js     # fmt, formatPrice, fmtTime, fmtDate, fmtDatetime, fmtDay
│   │   │   ├── toast.js          # showToast(msg, type, containerId)
│   │   │   └── sidebar.js        # initSidebar, bindSidebarToggle, setSidebarUser
│   │   └── services/             # Abstração sobre operações Firestore/Storage
│   │       ├── orders.service.js
│   │       ├── products.service.js
│   │       ├── users.service.js
│   │       └── storage.service.js
│   └── images/
│       └── logos/
└── pages/
    ├── auth/
    │   └── login.html            # Login Firebase Auth
    ├── admin/
    │   ├── dashboard.html        # Visão geral + pedidos recentes
    │   ├── orders.html           # Gestão de pedidos (tabela + paginação)
    │   ├── products.html         # Gestão de cardápio (produtos + combos)
    │   └── users.html            # Gestão de usuários + criação de staff
    ├── attendant/
    │   └── dashboard.html        # Fila de pedidos em tempo real + novo pedido manual
    └── customer/
        └── orders.html           # Histórico de pedidos do cliente logado
```

---

## Módulos Compartilhados (`shared/`)

Todos exportados como ES modules. Importar com caminho relativo a partir de cada página:
```js
import { escapeHtml } from '../../assets/js/shared/sanitizer.js';
```

| Módulo | Exports principais | Onde usar |
|--------|--------------------|-----------|
| `constants.js` | `WHATSAPP_NUMBER`, `DELIVERY_FEE`, `MIN_ORDER`, `PAGE_SIZES` | Qualquer página que precise dessas constantes |
| `sanitizer.js` | `escapeHtml(str)` | Toda interpolação de dados externos no HTML |
| `formatters.js` | `fmt`, `fmtTime`, `fmtDate`, `fmtDatetime`, `fmtDay` | Formatação de preços e timestamps |
| `toast.js` | `showToast(msg, type)` | Feedback de ações (success/error/warning/info) |
| `sidebar.js` | `initSidebar({role,activePage})`, `bindSidebarToggle()`, `setSidebarUser(name,email)` | Toda página de painel com sidebar |

---

## Camada de Serviços (`services/`)

Abstração sobre o Firebase SDK. As páginas de painel podem — e devem — usar os serviços em vez de importar Firestore diretamente.

| Serviço | Operações |
|---------|-----------|
| `orders.service.js` | `subscribeOrders`, `fetchMoreOrders`, `updateOrderStatus`, `deleteOrder`, `createOrder` |
| `products.service.js` | `subscribeProducts`, `subscribeCombos`, `fetchAvailableProducts`, `createItem`, `updateItem`, `deleteItem`, `setAvailability` |
| `users.service.js` | `subscribeUsers`, `changeUserRole`, `deleteUserDoc` |
| `storage.service.js` | `uploadProductImage(file, onProgress)`, `deleteImageByUrl(url)` |

---

## Padrões de Código

### 1. Sidebar componentizada
Toda página de painel usa sidebar gerada por `sidebar.js` — nunca HTML estático inline:
```js
initSidebar({ role: 'admin', activePage: 'orders' });
bindSidebarToggle();
// Após obter dados do usuário:
setSidebarUser(name, email);
```

### 2. Event delegation
Nenhum atributo `onclick` / `onchange` inline no HTML. Elementos dinâmicos (linhas de tabela, cards) recebem `data-action` + `data-id` e o contêiner pai escuta os eventos:
```js
table.addEventListener('click', e => {
  const btn = e.target.closest('[data-action="delete"]');
  if (btn) deleteItem(btn.dataset.id);
});
```

### 3. Sem `window.*` para funções de callback
Funções chamadas por HTML dinâmico são locais + alcançadas via event delegation. `window.*` é reservado exclusivamente para a bridge `firebase-store.js ↔ app.js`.

### 4. Bridge firebase-store → app.js
`firebase-store.js` (módulo) não pode importar `app.js` (módulo). A comunicação acontece por:
- Evento DOM: `firebaseStoreReady` com `{ products, combos }`
- Globals: `window.__FB_PRODUCTS__`, `window.__FB_COMBOS__`, `window.__APP_READY__`, `window.__ACTIVE_FILTER__`
- Callbacks opcionais: `window.renderProducts?.()`, `window.renderCombos?.()`

---

## Coleções Firestore

| Coleção | Documentos | Campos principais |
|---------|------------|-------------------|
| `products` | Um por item do cardápio | `name, price, desc, img, category, badge, available, sortOrder` |
| `combos` | Um por combo | `name, price, desc, img, items, available, sortOrder` |
| `orders` | Um por pedido | `orderNumber, customerId, customerName, customerPhone, status, items[], total, deliveryMode, payment, createdAt, updatedAt` |
| `users` | Um por usuário (UID = doc ID) | `name, email, phone, role, createdAt, updatedAt` |

**Roles**: `customer` | `attendant` | `admin`

---

## Fluxo de Autenticação e Guard

Toda página de painel segue o mesmo padrão:
```js
onAuthStateChanged(auth, async user => {
  if (!user) { window.location.href = '../auth/login.html'; return; }
  const snap = await getDoc(doc(db, 'users', user.uid));
  if (!snap.exists() || snap.data().role !== 'admin') {
    window.location.href = '../customer/orders.html'; return;
  }
  setSidebarUser(snap.data()?.name, user.email);
  // inicializar listeners...
});
```

---

## Paginação

- **Admin/orders** e **Attendant/dashboard**: cursor-based via `limit()` + `startAfter(lastDoc)` + botão "Carregar mais"
- **Customer/orders**: client-side slice (`visibleLimit` incrementado pelo botão)
- Tamanhos padrão em `PAGE_SIZES` em `constants.js`
