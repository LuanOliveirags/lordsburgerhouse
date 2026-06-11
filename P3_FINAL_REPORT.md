# Lord's Burger House — Relatório Final P3 (PWA)

**Data:** 10/06/2026  
**Fase:** P3 — Progressive Web App & Performance  
**Status:** ✅ Concluída

---

## Arquivos Criados

| Arquivo | Tamanho aprox. | Finalidade |
|---------|---------------|------------|
| `sw.js` | ~6 KB | Service Worker completo (P3.1 + P3.3) |
| `offline.html` | ~5 KB | Página offline branded (P3.2) |

## Arquivos Modificados

| Arquivo | O que mudou |
|---------|-------------|
| `manifest.json` | shortcuts, categories, lang, id, scope, maskable 512, screenshots (P3.5) |
| `index.html` | SW registration, install prompt, font preload não-bloqueante, image preloads, width/height em imgs, OG/Twitter meta, Schema.org JSON-LD, canonical, robots (P3.1–P3.8) |

---

## P3.1 — Service Worker

**Arquivo:** `sw.js`  
**Estratégia de versão:** `CACHE_VERSION = 'v1'` — para forçar cache bust, incrementar e redistribuir.

**Comportamento install/activate:**
- `install` → pre-caches 22 assets estáticos + todas as páginas HTML
- `skipWaiting()` → novo SW ativa imediatamente
- `activate` → deleta caches de versões anteriores + `clients.claim()`

---

## P3.2 — Funcionamento Offline

**Página offline:** `offline.html`
- Visual branded (dark background, dourado, logo)
- Detecta restauração de conexão via `navigator.onLine` / evento `online`
- Auto-redireciona para `/` quando conexão volta
- Botão "Tentar novamente" + botão "Ir para o início"
- Funciona com ou sem internet (pre-cacheada no install)

**O que está disponível offline:**
| Recurso | Disponível? |
|---------|-------------|
| Home (`/`) | ✅ (pre-cacheado) |
| Cardápio (dados do Firestore) | ⚠️ Parcial — último snapshot se já visitado |
| Assets (CSS, JS, logos, fonts) | ✅ (pre-cacheado) |
| Páginas de painel (admin/atendente) | ✅ shell HTML (sem dados live) |
| Login | ✅ (pre-cacheado) |

---

## P3.3 — Estratégias de Cache

| Tipo de Recurso | Estratégia | Cache | Justificativa |
|----------------|-----------|-------|---------------|
| HTML (navegação) | **Network First** + fallback `offline.html` | `lords-pages-v1` | Conteúdo sempre atualizado; fallback em caso de offline |
| CSS locais | **Stale While Revalidate** | `lords-static-v1` | Serve instantâneo + revalida em background |
| JS locais | **Stale While Revalidate** | `lords-static-v1` | Mesmo raciocínio do CSS |
| Firebase SDK (gstatic) | **Stale While Revalidate** | `lords-static-v1` | Versioned URLs, seguro atualizar em BG |
| Imagens locais (logos) | **Cache First** | `lords-images-v1` | Raramente mudam; não vale hit na rede |
| Firebase Storage (produtos) | **Cache First** | `lords-images-v1` | Evita re-download de imagens pesadas |
| Hero externo (Unsplash) | **Cache First** | `lords-images-v1` | Externo e estável; evita 300 KB por visita |
| Google Fonts CSS | **Stale While Revalidate** | `lords-fonts-v1` | Atualiza variantes em BG |
| Google Fonts arquivos (.woff2) | **Cache First** | `lords-fonts-v1` | URLs são versionadas; safe to cache forever |
| Firebase Firestore API | **Nunca interceptado** | — | Firebase SDK tem cache próprio (IndexedDB) |
| Firebase Auth | **Nunca interceptado** | — | Tokens rotativos; interceptar quebraria o auth |
| Cloud Functions | **Nunca interceptado** | — | Operações de escrita/lógica |

---

## P3.4 — Instalação PWA

**Implementado em:** `index.html` (inline ao final do `<body>`)

**Fluxo:**
1. Browser dispara `beforeinstallprompt` → evento é capturado e prompt é diferido
2. Após 3s (para não competir com o loader), exibe banner no rodapé
3. Usuário clica "Instalar" → `deferredPrompt.prompt()` é chamado
4. Em caso de recusa, banner some e sessão marca `pwa_install_dismissed`
5. Evento `appinstalled` fecha o banner e loga o sucesso

**Compatibilidade:**
- ✅ Android (Chrome, Samsung Browser)
- ✅ Desktop Chrome
- ✅ Microsoft Edge
- ⚠️ iOS Safari: não suporta `beforeinstallprompt` nativamente (usuário instala manualmente via "Adicionar à Tela Inicial")

---

## P3.5 — Manifest Melhorado

**Adições ao `manifest.json`:**
- `"id": "/"` — App identity estável para Chrome
- `"lang": "pt-BR"` — Idioma declarado
- `"scope": "/"` — Escopo correto
- `"categories": ["food","shopping","lifestyle"]` — Visível nas app stores
- `"prefer_related_applications": false` — Sem redirect para Play Store
- `"description"` — Texto completo e descritivo
- `"start_url"` — Com `utm_source=pwa` para analytics
- Ícone maskable 512×512 adicionado
- 3 **shortcuts** (Ver Cardápio, Meus Pedidos, Fazer Pedido)
- **screenshots** (requer criação manual das imagens — ver abaixo)

**Ação necessária — Screenshots:**  
Criar manualmente e salvar em `assets/images/screenshots/`:
- `desktop.png` — 1280×800px — screenshot da home no desktop
- A imagem mobile já usa `assets/images/cardapio.png` existente

---

## P3.6 — Otimização de Fontes

**Antes:** `<link rel="stylesheet">` bloqueante — atrasa FCP/LCP  
**Depois:** Carregamento não-bloqueante com 3 camadas:

```html
<!-- 1. Preload: descobre o recurso mais cedo -->
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?...&display=swap" />

<!-- 2. Carrega sem bloquear render (media trick) -->
<link rel="stylesheet" href="..." media="print" onload="this.media='all'" />

<!-- 3. Fallback sem JS -->
<noscript><link rel="stylesheet" href="..." /></noscript>
```

**Impacto estimado:** Redução de 200–600ms no FCP dependendo da velocidade da rede.  
`font-display: swap` já estava configurado no URL do Google Fonts em todos os arquivos.

---

## P3.7 — Otimização de Imagens

| Imagem | Ação aplicada |
|--------|---------------|
| `logo.png` (header) | `width="56" height="56"` + `fetchpriority="high"` — previne CLS, prioriza LCP |
| `logo.png` (loader) | `width="120" height="120"` — previne layout shift durante carregamento |
| `logo.png` (footer) | `width="80" height="80"` + `loading="lazy"` — below-fold |
| `logo.png` (geral) | `<link rel="preload" as="image" fetchpriority="high">` no `<head>` |
| Imagens de produtos | `loading="lazy"` já aplicado em `app.js` (P2) |
| Hero (Unsplash) | CSS background — não tem `<img>`, não precisa de atributos; cacheado pelo SW |

---

## P3.8 — Lighthouse

**Melhorias implementadas:**

| Categoria | Melhoria |
|-----------|----------|
| Performance | Preload de logo, font não-bloqueante, `fetchpriority="high"`, `loading="lazy"` em imgs below-fold, SW cache |
| SEO | `canonical`, `robots`, `keywords`, `author`, Schema.org JSON-LD `Restaurant` |
| PWA | SW completo, manifest com todas as propriedades, offline fallback, install prompt |
| Best Practices | `width`/`height` em todas as imgs críticas (evita CLS) |
| Accessibility | `aria-label` no banner de install, `role="banner"`, atributos `alt` em todas as imagens |
| Social / OG | Open Graph + Twitter Card completos |

**Targets esperados após P3:**
| Categoria | Estimativa |
|-----------|-----------|
| Performance | 85–95 (depende de hosting/CDN e imagens) |
| Accessibility | 90–100 (estrutura já era boa) |
| Best Practices | 95–100 |
| SEO | 95–100 |
| PWA | 100 (com SW + manifest + offline) |

---

## Como Validar Offline

1. Abrir Chrome DevTools → Application → Service Workers
2. Verificar que `sw.js` está registrado e ativo (status: running)
3. Marcar checkbox **"Offline"** no DevTools
4. Recarregar a página → deve carregar do cache
5. Navegar para `/pages/admin/dashboard.html` → deve carregar o shell HTML
6. Navegar para uma URL não existente → deve exibir `offline.html`

**Via Lighthouse:**
1. DevTools → Lighthouse → configurar "Mobile + PWA"
2. Clicar "Analyze page load"
3. Verificar seção PWA: todos os checks devem estar verdes

---

## Checklist de Deploy

### Antes de publicar

- [ ] Confirmar que `sw.js` está na raiz do site (mesmo nível de `index.html`)
- [ ] Confirmar que `offline.html` está na raiz
- [ ] Criar `assets/images/screenshots/desktop.png` (1280×800) para manifest rico
- [ ] Validar manifest em: https://web.dev/pwa-checklist/
- [ ] Testar install prompt no Android Chrome
- [ ] Testar modo offline com DevTools

### Firebase Hosting

```bash
firebase deploy --only hosting
```

Verificar que `firebase.json` inclui headers corretos para SW:
```json
"headers": [
  {
    "source": "/sw.js",
    "headers": [{ "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" }]
  }
]
```

> **Importante:** O `sw.js` nunca deve ser cacheado pelo servidor HTTP — o browser precisa verificar updates a cada visita.

### GitHub Pages

Se usar GitHub Pages, adicionar `Service-Worker-Allowed: /` nos headers ou garantir que o SW está na raiz do repositório publicado.

---

## Atualizar o Cache (Futuro)

Para forçar todos os usuários a baixarem novos assets:

1. Incrementar `CACHE_VERSION` em `sw.js`: `'v1'` → `'v2'`
2. Republicar o site
3. Na próxima visita, o activate do novo SW deleta os caches antigos automaticamente
