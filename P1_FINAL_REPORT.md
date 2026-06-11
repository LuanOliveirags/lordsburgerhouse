# Relatório Final P1 — Lord's Burger House
Data: 2026-06-10

---

## Resumo das Correções Aplicadas

| ID    | Título                                   | Arquivo(s) modificado(s)                          | Status   |
|-------|------------------------------------------|---------------------------------------------------|----------|
| P1.1  | Esqueci minha senha                      | pages/auth/login.html                             | ✅ Feito |
| P1.2  | Storage Rules                            | storage.rules (novo)                              | ✅ Feito |
| P1.3  | Exclusão de imagens órfãs               | pages/admin/products.html                         | ✅ Feito |
| P1.4  | Migrar persistência Firestore            | assets/js/firebase-config.js                      | ✅ Feito |
| P1.5  | Paginação de pedidos                     | admin/orders.html, attendant/dashboard.html, customer/orders.html | ✅ Feito |
| P1.6  | Renderização de ADDONS                   | assets/js/app.js                                  | ✅ Feito |
| P1.7  | Link "Acompanhar meu pedido"             | pages/checkout.html                               | ✅ Feito |
| P1.8  | Criação de staff sem logout do admin     | pages/admin/users.html, functions/index.js (novo) | ✅ Feito |

---

## P1.1 — Esqueci Minha Senha

**Arquivo:** `pages/auth/login.html`

**O que foi feito:**
- Adicionado `id="forgotPassLink"` no link "Esqueci a senha"
- Criado overlay modal com campo de e-mail, botão de envio e botão cancelar (reutiliza CSS vars da página)
- Importado `sendPasswordResetEmail` de `firebase-auth.js`
- Handler JS:
  - Valida formato de e-mail com regex antes de chamar a API
  - Pré-preenche o campo com o e-mail digitado no formulário de login
  - Feedback de sucesso: mensagem verde; modal fecha automaticamente após 3,5 s
  - Feedback de erro: mensagem vermelha com textos específicos por código Firebase
  - Botão fica desabilitado durante o envio

---

## P1.2 — Storage Rules

**Arquivo:** `storage.rules` (criado do zero)

**Regras implementadas:**
```
match /products/{allPaths=**}
  - read:   público (true)
  - write:  apenas admin, tamanho ≤ 4 MB, contentType deve iniciar com "image/"
  - delete: apenas admin

match /{allPaths=**}
  - read, write: negado (deny all)
```

**Mecanismo de autorização:** `firestore.get()` acessa o documento `users/{uid}` e verifica `role == 'admin'`.

**Nota de deploy:** Execute `firebase deploy --only storage` após `firebase login`.

---

## P1.3 — Exclusão de Imagens Órfãs

**Arquivo:** `pages/admin/products.html`

**O que foi feito:**
- No handler do botão Salvar, antes de fazer upload de nova imagem:
  - Verifica se a URL atual (`imgUrl`) contém `firebasestorage.googleapis.com`
  - Extrai o caminho de storage via regex: `url.match(/\/o\/(.+?)\?/)[1]`
  - Chama `deleteObject(storageRef(storage, decodeURIComponent(caminho)))`
  - Erros silenciados com `try/catch` (imagem pode já ter sido deletada)
- Só executa se há um `pendingFile` (nova imagem selecionada pelo usuário)
- Compatível com produtos antigos que têm URLs de CDN externas (condição `includes('firebasestorage.googleapis.com')`)

---

## P1.4 — Migração de Persistência Firestore

**Arquivo:** `assets/js/firebase-config.js`

**Antes:**
```javascript
import { getFirestore, enableIndexedDbPersistence } from '...firebase-firestore.js';
export const db = getFirestore(app);
enableIndexedDbPersistence(db).catch(() => {});
```

**Depois:**
```javascript
import { initializeFirestore, persistentLocalCache } from '...firebase-firestore.js';
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache()
});
```

**Comportamento:** Equivalente ao anterior. Sem warnings de API depreciada. Persiste pedidos em IndexedDB para funcionamento offline.

---

## P1.5 — Paginação de Pedidos

### admin/orders.html
- **Estratégia:** servidor (cursor-based)
- `limit(30)` no `onSnapshot` inicial
- `Map<id, order>` para deduplicação (evita duplicatas entre real-time e load-more)
- `startAfter(lastVisible) + limit(30)` no `getDocs` do "Carregar mais"
- Botão "Carregar mais pedidos" inserido abaixo da tabela, oculto quando não há mais dados
- Imports adicionados: `limit`, `startAfter`, `getDocs`

### attendant/dashboard.html
- **Estratégia:** servidor (cursor-based)
- `limit(50)` no `onSnapshot` captura os 50 pedidos mais recentes em tempo real (suficiente para a fila ativa)
- `loadMoreOrders()` via `getDocs + startAfter` para histórico
- Botão "Carregar mais" aparece apenas na view "Todos os Pedidos"
- Queue (fila ativa) sempre exibe todos os pedidos carregados sem paginação extra

### customer/orders.html
- **Estratégia:** cliente (slice)
- Queries mantidas sem `limit` (clientes têm poucos pedidos)
- Variável `visibleLimit = 10`, incrementada em 10 ao clicar "Carregar mais"
- `mergeAndRender()` aplica `.slice(0, visibleLimit)` antes de renderizar
- Sem necessidade de índice composto no Firestore

---

## P1.6 — Renderização dos ADDONS

**Arquivo:** `assets/js/app.js`

**O que foi feito:**
- Adicionado `let selectedAddons = []` ao estado do módulo
- `openModal(product)` agora:
  - Reseta `selectedAddons = []`
  - Renderiza checkboxes no `div#modalAddons` com nome e preço de cada addon
  - Cada checkbox usa `data-idx` para referenciar o item em `ADDONS[]`
  - Ao marcar/desmarcar, atualiza `selectedAddons` e chama `updateModalTotal()`
- `updateModalTotal()` soma `selectedAddons.reduce((s,a) => s+a.price, 0)` ao preço base
- `closeModal()` reseta `selectedAddons = []`
- `modalAddBtn` click handler:
  - Calcula `addonTotal` e `addonNames`
  - Cria `productWithAddons` com `id` composto (`${product.id}::${addonNames}`) para deduplicação correta
  - `price` baked-in com custo dos addons
  - Passa `addonNames` como `obs` (exibido no carrinho)
- Compatibilidade total com checkout.html (usa `item.price * item.qty`)

---

## P1.7 — Link "Acompanhar meu Pedido"

**Arquivo:** `pages/checkout.html`

**Problema identificado:** O `onAuthStateChanged` executa de forma assíncrona. Se `submitOrder()` for chamado antes de o Firebase determinar o estado de auth, `window.__currentUser__` pode ser `null` temporariamente, exibindo a CTA de "criar conta" para usuários logados.

**Correção:** No callback de `onAuthStateChanged`, após setar `window.__currentUser__`, verifica se a success screen está visível (`classList.contains('show')`). Se sim, re-executa `window.__renderTrackingCta__()` para corrigir a CTA com o estado de auth real.

**Caminho do link verificado:** `href="customer/orders.html"` de `pages/checkout.html` resolve corretamente para `pages/customer/orders.html`. ✓

---

## P1.8 — Criação de Staff Sem Logout do Admin

**Arquivos novos:** `functions/index.js`, `functions/package.json`, `firebase.json`  
**Arquivo modificado:** `pages/admin/users.html`

**Problema anterior:** `createUserWithEmailAndPassword()` no cliente muda a sessão ativa do Firebase Auth para o novo usuário. O código anterior tentava fazer re-login mas a variável `adminPass` nunca era preenchida.

**Solução:** Firebase Callable Cloud Function com Admin SDK.

**Cloud Function `createStaffUser`:**
- Verifica se o chamador está autenticado
- Verifica `role === 'admin'` no Firestore do chamador
- Cria usuário com `admin.auth().createUser()` (sem afetar sessão do cliente)
- Cria documento no Firestore `users/{uid}`
- Trata erros específicos (`auth/email-already-exists` → `HttpsError('already-exists')`)

**Cliente (admin/users.html):**
- Remove imports: `createUserWithEmailAndPassword`, `updateProfile`, `signInWithEmailAndPassword`
- Adiciona imports: `getFunctions`, `httpsCallable` de `firebase-functions.js`
- Importa `app` de `firebase-config.js` (necessário para `getFunctions(app)`)
- Chama `httpsCallable(getFunctions(app), 'createStaffUser')(data)` no click de "Criar conta"
- Admin permanece logado durante e após a criação ✓

**Texto do modal atualizado:** Removido aviso de "será redirecionado", substituído por confirmação de que o admin permanece logado.

**Para deploy:**
```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

---

## Checklist de Testes Manuais

### P1.1
- [ ] Clicar "Esqueci a senha" abre modal
- [ ] Submeter e-mail inexistente mostra erro
- [ ] Submeter e-mail válido mostra mensagem de sucesso e fecha modal
- [ ] Botão fica desabilitado durante o envio
- [ ] Campo pré-preenchido com e-mail digitado no formulário de login

### P1.2
- [ ] Imagem de produto é acessível publicamente sem autenticação
- [ ] Upload via Firebase Console (não-admin) é rejeitado pela rule
- [ ] Upload admin de arquivo > 4 MB é rejeitado
- [ ] Upload admin de PDF é rejeitado

### P1.3
- [ ] Trocar imagem de produto: a imagem antiga não aparece mais no Storage
- [ ] Criar produto novo (sem imagem anterior): funciona sem erro
- [ ] Produto antigo com URL externa (não Firestore): funciona sem erro

### P1.4
- [ ] Sem erros/warnings no console ao carregar qualquer página
- [ ] Modo offline: pedidos já carregados continuam visíveis

### P1.5
- [ ] Admin/orders: tabela exibe 30 pedidos; botão "Carregar mais" aparece se há mais
- [ ] Admin/orders: "Carregar mais" appenda pedidos mais antigos sem duplicar
- [ ] Attendant/dashboard: fila exibe pedidos em tempo real; "Todos" mostra histórico paginado
- [ ] Customer/orders: exibe 10 pedidos; "Carregar mais" exibe 10 adicionais

### P1.6
- [ ] Abrir modal de produto exibe 6 checkboxes de adicionais com nome e preço
- [ ] Marcar checkbox atualiza o total do modal
- [ ] Adicionar produto com adicionais: carrinho exibe obs com nome dos adicionais
- [ ] Adicionar mesmo produto com addons diferentes: cria dois itens separados no carrinho
- [ ] Fechar modal e reabrir: checkboxes desmarcados

### P1.7
- [ ] Completar pedido como usuário logado: botão "Acompanhar meu pedido" aparece
- [ ] Completar pedido como guest: aparece CTA de "Criar conta"
- [ ] Botão "Acompanhar meu pedido" redireciona para customer/orders.html

### P1.8
- [ ] Admin logado → criar atendente → admin permanece logado após criação
- [ ] Novo atendente aparece na lista de usuários
- [ ] Novo atendente consegue logar com as credenciais criadas
- [ ] Tentar criar com e-mail já existente mostra erro, admin permanece logado

---

## Arquivos Modificados (P1)

| Arquivo | Tipo de mudança |
|---------|----------------|
| `assets/js/firebase-config.js` | Migração persistência |
| `assets/js/app.js` | ADDONS modal rendering |
| `pages/auth/login.html` | Password reset flow |
| `pages/checkout.html` | Auth race condition fix |
| `pages/admin/products.html` | Orphan image deletion |
| `pages/admin/orders.html` | Server-side pagination |
| `pages/admin/users.html` | Cloud Function client call |
| `pages/attendant/dashboard.html` | Server-side pagination |
| `pages/customer/orders.html` | Client-side pagination |
| `storage.rules` | **Criado** — Storage security |
| `functions/index.js` | **Criado** — Cloud Function |
| `functions/package.json` | **Criado** — Functions deps |
| `firebase.json` | **Criado** — Firebase config |

---

## Riscos Remanescentes (não P1)

| Item | Risco | Recomendação P2 |
|------|-------|-----------------|
| `onclick="openModal(${JSON.stringify(p)...})"` em `admin/products.html` | JSON injetado em HTML (mitigado por `replace(/"/g,'&quot;')`, mas estruturalmente frágil) | Migrar para event delegation com `data-id` |
| `onclick="deleteUser(...)"` em `admin/users.html` | UIDs alphanumeric — risco mínimo | Migrar para event delegation |
| Cloud Function não deployada | P1.8 não funciona em produção sem deploy | Executar `firebase deploy --only functions` |
| Storage rules não deployadas | P1.2 não ativa em produção sem deploy | Executar `firebase deploy --only storage` |
| Paginação customer sem cursor real | Carrega todos os pedidos do cliente em memória | P2: adicionar índice composto `(customerId, createdAt)` para cursor real |
| sendPasswordResetEmail sem rate-limit client-side | Possível spam de cliques | P2: debounce ou cooldown no botão |

---

## Melhorias Recomendadas para P2

1. **Event delegation nos admins** — Eliminar `onclick` inline com JSON em produtos e usuários; usar data attributes e addEventListener
2. **Índice composto Firestore** — Criar `(customerId, createdAt DESC)` para paginação real em customer/orders
3. **Storage URL via signed URLs** — Imagens de admin (privadas) poderiam usar signed URLs em vez de download URLs públicos
4. **Role em Custom Claims** — Mover role para Firebase Auth Custom Claims para evitar leitura Firestore extra em Storage rules e reduzir latência
5. **CSP (Content Security Policy)** — Adicionar header CSP para mitigar XSS residual
6. **Rate limiting no reset de senha** — Debounce de 5 s no botão "Enviar link"
7. **Audit log** — Registrar criações/exclusões de usuários em coleção `auditLog` para rastreabilidade
8. **Testes automatizados** — Cypress E2E para os fluxos críticos (checkout, login, admin CRUD)
