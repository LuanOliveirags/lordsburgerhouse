# Lord's Burger House — Relatório Final P5 (Operação Gerenciável)

**Data:** 10/06/2026  
**Fase:** P5 — Eliminar dependências de código para operações do dia a dia  
**Status:** ✅ Concluída

---

## Objetivo

> "Eliminar qualquer dependência de alterações de código para operações do dia a dia da hamburgueria."

Após P5, o administrador pode alterar **taxa de entrega, WhatsApp, horários, endereço, banners, redes sociais e todas as configurações da loja** diretamente pelo painel — sem nenhum deploy.

---

## Arquivos Criados

| Arquivo | Finalidade |
|---------|------------|
| `assets/js/shared/settings.js` | Módulo ES: `loadSettings`, `watchSettings`, `saveSettings`, `isStoreOpen`, `logAudit` |
| `pages/admin/settings.html` | Painel completo: Loja, Horários, Banners, Backup e Logs |
| `P5_FINAL_REPORT.md` | Este relatório |

## Arquivos Modificados

| Arquivo | O que mudou |
|---------|-------------|
| `assets/js/firebase-store.js` | Importa `loadSettings`; inclui `settings` no evento `firebaseStoreReady`; nova subscription de `banners` (dispara `firebaseBannersReady`) |
| `assets/js/app.js` | `applySettings()` atualiza DOM dinamicamente; `_whatsapp`, `_fee`, `_minOrder` dinâmicos; `isStoreOpen()` guarda `addToCart()`; `renderBanners()` |
| `index.html` | IDs adicionados: `heroSubtitle`, `heroDeliveryTime`, `infoStripFee`, `contactAddress`, `contactHours`, `contactWaText`, `contactInstagram`, `footerWhatsapp`, `footerInstagram`, `footerFacebook`, `mapAddress`; banner `#storeClosedBanner`; seção `#bannersSection` |
| `pages/checkout.html` | `const` → `var` para `WHATSAPP` e `DELIVERY_FEE`; `loadSettings()` atualiza os vars e label da UI |
| `assets/js/shared/sidebar.js` | Ícone `settings` adicionado; link "Configurações" na nav admin |
| `firestore.rules` | Novas regras: `settings` (public read, admin write), `banners` (public read, admin write), `audit_logs` (admin read/create) |
| `sw.js` | `settings.js` e `settings.html` adicionados ao precache; `CACHE_VERSION` bumped para `v3` |

---

## P5.1 — Documento `settings/config` no Firestore

**Schema do documento:**

```
settings/config {
  storeName:    string
  slogan:       string
  subtitle:     string   // hero subtitle
  whatsapp:     string   // somente dígitos
  deliveryFee:  number
  minOrder:     number
  deliveryTime: string   // ex: "30min"
  address:      string
  city:         string
  instagram:    string
  facebook:     string
  openingHours: {
    0: { open: "HH:MM", close: "HH:MM", closed: bool }  // Dom
    1: { ... }  // Seg
    ...
    6: { ... }  // Sáb
  }
}
```

**DEFAULT_SETTINGS** em `settings.js` serve como fallback se o documento ainda não existir.

---

## P5.2 — `pages/admin/settings.html`

**Tabs:**
| Tab | Conteúdo |
|-----|----------|
| Loja | Nome, slogan, subtítulo hero, WhatsApp, tempo de entrega, Instagram, Facebook, endereço, cidade, taxa de entrega, pedido mínimo |
| Horários | Grid com abertura/fechamento por dia da semana + toggle "Fechado" |
| Banners | Lista de banners com editar/excluir, botão "Novo Banner", modal de criação/edição |
| Backup | Exportar JSON (settings + banners) / Importar JSON |
| Logs | Tabela com últimas 50 ações registradas em `audit_logs` |

---

## P5.3 — Coleção `banners`

**Schema de documento:**

```
banners/{id} {
  title:     string
  subtitle:  string
  image:     string  // URL Firebase Storage ou externa
  active:    boolean
  ordem:     number
  createdAt: timestamp
  updatedAt: timestamp
}
```

Banners com `active == true` são carregados via `onSnapshot` em `firebase-store.js` e renderizados na seção `#bannersSection` do `index.html` (visível apenas quando há banners).

---

## P5.4 — Conteúdo Hero Dinâmico

| Elemento | ID | Atualizado por |
|----------|----|----------------|
| Subtítulo hero | `heroSubtitle` | `applySettings()` em `app.js` |
| Tempo de entrega (stat "30min") | `heroDeliveryTime` | `applySettings()` |
| Fee no info-strip | `infoStripFee` | `applySettings()` |

---

## P5.5 — Sistema de Horário Aberto/Fechado

**`isStoreOpen(settings)`** em `settings.js`:
- Lê `openingHours[weekday]` do settings
- Compara hora atual com `open`/`close`
- Suporta fechamento após meia-noite (ex: "11:00" às "00:00")
- Retorna `false` se `closed === true`

**Efeitos no front-end (`applySettings`):**
- Dot `.status-dot` muda de classe (`status-dot--open` / `status-dot--closed`)
- Texto "Aberto agora" / "Fechado"
- `#storeClosedBanner` exibido quando fechado
- `addToCart()` bloqueado com toast quando fechado

---

## P5.6 — Taxa de Entrega Dinâmica

| Ponto | Como |
|-------|------|
| `app.js` | `_fee` inicializado com `DELIVERY_FEE` (fallback), atualizado por `applySettings()` |
| `checkout.html` | `var DELIVERY_FEE` atualizado pelo módulo settings via `window.DELIVERY_FEE` |
| UI checkout | Label "Delivery — R$ X,XX" atualizado via `#checkoutFeeLabel` |
| `updateTotals()` no checkout | Usa `DELIVERY_FEE` global (var) — re-chamado após settings carregarem |

---

## P5.7 — WhatsApp Dinâmico

Todos os links WhatsApp no site são atualizados por `applySettings()`:

| Elemento | Mecanismo |
|----------|-----------|
| `#contactWaText` | `href` + `textContent` formatado |
| `[data-wa-link]` | `href` atualizado em loop |
| `whatsappBtn` (carrinho) | Usa `_whatsapp` em memória |
| `checkout.html` | `var WHATSAPP` atualizado via `window.WHATSAPP` |
| Footer, social btn | IDs `footerWhatsapp`, `footerWaSocial` |

---

## P5.8 — Audit Logs

**Coleção `audit_logs`:**

```
audit_logs/{id} {
  usuario:  string   // email do admin
  uid:      string
  acao:     string   // ex: "settings_update", "banner_create", "hours_update"
  detalhes: object
  data:     timestamp
}
```

**Ações registradas:** `settings_update`, `hours_update`, `banner_create`, `banner_update`, `banner_delete`, `export_json`, `import_json`

**Regra:** escrita best-effort (`logAudit` nunca lança erro para o usuário), leitura somente admin.

---

## P5.9 — Export / Import JSON

**Exportar:** gera `lords-config-YYYY-MM-DD.json` com `{ settings, banners[] }` — download imediato via Blob.

**Importar:** lê o JSON, valida presença da chave `settings`, aplica com `saveSettings()` e upsert de banners — confirma antes de sobrescrever.

---

## P5.10 — Restrições Respeitadas

- ✅ Não implementada fidelidade
- ✅ Checkout não teve UX/fluxo alterado (apenas `const`→`var` e load de settings)
- ✅ Dashboard P4 não foi alterado
- ✅ Funcionalidades existentes preservadas
- ✅ Design não alterado
- ✅ Compatibilidade não quebrada
- ✅ Arquitetura das fases anteriores preservada

---

## Limitações Conhecidas

1. **`loadSettings()` no checkout:** é uma Promise; se o usuário submeter o pedido antes do carregamento da settings (< 1s), usará o valor hardcoded como fallback — comportamento seguro.
2. **`isStoreOpen` no lado do cliente:** um usuário mal-intencionado pode contornar pela console. Para produção, a regra deve ser validada também no Cloud Function de criação de pedidos.
3. **Banners com imagem:** requer URL de uma imagem já hospedada (Firebase Storage ou CDN externo). Upload direto de arquivo não foi implementado nesta fase.
4. **audit_logs de login admin:** o login dos admins não é logado nesta fase (login ocorre em `login.html` que não importa `logAudit`). Futuro: adicionar no callback `onAuthStateChanged` de `dashboard.html`.
