/* ============================================================
   LORD'S BURGER HOUSE — shared/sidebar.js
   Componente de sidebar para admin e atendente.
   Uso:
     initSidebar({ role: 'admin', activePage: 'orders' })
     initSidebar({ role: 'attendant' })
     bindSidebarToggle()
     setSidebarUser(name, email)
   ============================================================ */

/* ── SVG icons ──────────────────────────────────────────────── */
const I = {
  grid:     `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  chart:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>`,
  store:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>`,
  orders:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>`,
  users:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>`,
  attend:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>`,
  external: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
  list:     `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,
  plus:     `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,
  settings: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`,
  logout:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
};

function navLink(href, icon, label, active = false, extra = '') {
  return `<a href="${href}" class="sidebar__link${active ? ' active' : ''}">${icon}${label}${extra}</a>`;
}

const FOOTER = `
  <div class="sidebar__footer">
    <div class="sidebar__user">
      <div class="sidebar__avatar" id="avatarInitial">A</div>
      <div class="sidebar__user-info">
        <div class="sidebar__user-name" id="userName">Admin</div>
        <div class="sidebar__user-email" id="userEmail"></div>
      </div>
    </div>
    <button class="btn-logout" id="logoutBtn">${I.logout} Sair</button>
  </div>`;

function buildAdminSidebar(activePage = 'dashboard') {
  const badge = '<span class="sidebar__badge" id="pendingBadge">0</span>';
  const quickAccess = activePage === 'dashboard' ? `
      <div class="sidebar__section">Acesso Rápido</div>
      ${navLink('../attendant/dashboard.html', I.attend, 'Painel Atendente')}
      <a href="../../index.html" class="sidebar__link" target="_blank">${I.external}Ver Site</a>` : '';
  return `
    <div class="sidebar__logo">
      <img src="../../assets/images/logos/logo.png" alt=""/>
      <div class="sidebar__logo-text">
        <span class="sidebar__logo-name">Lord's Burger</span>
        <span class="sidebar__logo-role">Administrador</span>
      </div>
    </div>
    <nav class="sidebar__nav">
      <div class="sidebar__section">Painel</div>
      ${navLink('dashboard.html', I.grid, 'Dashboard', activePage === 'dashboard')}
      <div class="sidebar__section">Gestão</div>
      ${navLink('products.html', I.store, 'Cardápio', activePage === 'products')}
      ${navLink('orders.html', I.orders, 'Pedidos', activePage === 'orders', badge)}
      ${navLink('analytics.html', I.chart, 'Analytics', activePage === 'analytics')}
      ${navLink('users.html', I.users, 'Usuários', activePage === 'users')}
      ${navLink('settings.html', I.settings, 'Configurações', activePage === 'settings')}
      ${quickAccess}
    </nav>
    ${FOOTER}`;
}

function buildAttendantSidebar() {
  return `
    <div class="sidebar__logo">
      <img src="../../assets/images/logos/logo.png" alt=""/>
      <div class="sidebar__logo-text">
        <span class="sidebar__logo-name">Lord's Burger</span>
        <span class="sidebar__logo-role">Atendente</span>
      </div>
    </div>
    <nav class="sidebar__nav">
      <div class="sidebar__section">Pedidos</div>
      <a href="#" class="sidebar__link active" data-view="queue">
        ${I.orders}Fila de Pedidos
        <span class="sidebar__badge" id="queueBadge">0</span>
      </a>
      <a href="#" class="sidebar__link" data-view="all">
        ${I.list}Todos os Pedidos
      </a>
      <div class="sidebar__section" style="margin-top:8px">Ações</div>
      <a href="#" class="sidebar__link" id="btnNewOrder">
        ${I.plus}Novo Pedido Manual
      </a>
    </nav>
    <div class="sidebar__footer">
      <div class="sidebar__user">
        <div class="sidebar__avatar" id="avatarInitial">?</div>
        <div class="sidebar__user-info">
          <div class="sidebar__user-name" id="userName">Carregando...</div>
          <div class="sidebar__user-email" id="userEmail"></div>
        </div>
      </div>
      <button class="btn-logout" id="logoutBtn">${I.logout} Sair</button>
    </div>`;
}

/**
 * Injeta o HTML da sidebar no elemento #sidebar.
 * @param {{ role: 'admin'|'attendant', activePage?: string }} options
 */
export function initSidebar({ role, activePage = 'dashboard' }) {
  const el = document.getElementById('sidebar');
  if (!el) return;
  el.innerHTML = role === 'attendant'
    ? buildAttendantSidebar()
    : buildAdminSidebar(activePage);
}

/** Vincula os eventos do botão toggle e do overlay. */
export function bindSidebarToggle() {
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('sidebarOverlay');
  document.getElementById('sidebarToggle')?.addEventListener('click', () => {
    sb?.classList.toggle('open');
    ov?.classList.toggle('show');
  });
  ov?.addEventListener('click', () => {
    sb?.classList.remove('open');
    ov?.classList.remove('show');
  });
}

/** Atualiza avatar, nome e e-mail na sidebar após login. */
export function setSidebarUser(name, email) {
  const avatar = document.getElementById('avatarInitial');
  const nameEl = document.getElementById('userName');
  const emailEl = document.getElementById('userEmail');
  if (avatar) avatar.textContent = (name || email || '?')[0].toUpperCase();
  if (nameEl)  nameEl.textContent  = name  || 'Admin';
  if (emailEl) emailEl.textContent = email || '';
}
