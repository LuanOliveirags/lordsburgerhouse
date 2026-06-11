/* ============================================================
   LORD'S BURGER HOUSE — app.js
   Cardápio, Carrinho, Modal, WhatsApp, Filtros
   ============================================================ */

import { WHATSAPP_NUMBER, DELIVERY_FEE, MIN_ORDER } from './shared/constants.js';
import { escapeHtml } from './shared/sanitizer.js';
import { isStoreOpen } from './shared/settings.js';

/* ── Valores dinâmicos (atualizados via settings) ──────────── */
let _whatsapp = WHATSAPP_NUMBER;
let _fee      = DELIVERY_FEE;
let _minOrder = MIN_ORDER;
let _settings = null;

/* ── DADOS DO CARDÁPIO ───────────────────────────────────── */
let currentProducts = [];
let currentCombos   = [];

/* ── ADICIONAIS DATA ───────────────────────────────────── */
const ADDONS = [
  { name: 'Cheddar Extra',         price: 4.00 },
  { name: 'Bacon Extra',           price: 5.00 },
  { name: 'Ovo Frito',             price: 3.00 },
  { name: 'Onion Rings Extra',     price: 7.00 },
  { name: 'Hambúrguer Extra 160g', price: 10.00 },
  { name: 'Molho Especial',        price: 2.50 }
];

/* ── STATE ─────────────────────────────────────────────── */
let cart          = loadCart();
let activeFilter  = 'all';
let currentItem   = null;
let currentQty    = 1;
let selectedAddons = [];
let deliveryMode  = 'delivery';

/* ── DOM REFS ──────────────────────────────────────────── */
const $ = id => document.getElementById(id);
const loader       = $('loader');
const header       = $('header');
const menuToggle   = $('menuToggle');
const mobileNav    = $('mobileNav');
const cartBtn      = $('cartBtn');
const cartBadge    = $('cartBadge');
const cartOverlay  = $('cartOverlay');
const cartDrawer   = $('cartDrawer');
const cartClose    = $('cartClose');
const cartItems    = $('cartItems');
const cartEmpty    = $('cartEmpty');
const cartFooter   = $('cartFooter');
const cartSubtotal = $('cartSubtotal');
const cartDelivery = $('cartDeliveryFee');
const cartTotal    = $('cartTotal');
const deliveryRow  = $('deliveryRow');
const obsInput     = $('obsInput');
const checkoutBtn  = $('checkoutBtn');
const btnDelivery  = $('btnDelivery');
const btnPickup    = $('btnPickup');
const whatsappBtn  = $('whatsappOrderBtn');
const productsGrid = $('productsGrid');
const combosGrid   = $('combosGrid');
const categoryTabs = $('categoryTabs');
const modalOverlay = $('modalOverlay');
const productModal = $('productModal');
const modalClose   = $('modalClose');
const modalImg     = $('modalImg');
const modalCategory= $('modalCategory');
const modalName    = $('modalName');
const modalDesc    = $('modalDesc');
const modalAddons  = $('modalAddons');
const modalQtyMinus= $('modalQtyMinus');
const modalQtyPlus = $('modalQtyPlus');
const modalQty     = $('modalQty');
const modalTotal   = $('modalTotal');
const modalAddBtn  = $('modalAddBtn');
const toast        = $('toast');
const toastMsg     = $('toastMsg');
const fabCart      = $('fabCart');
const fabBadge     = $('fabBadge');
const fabTotal     = $('fabTotal');

/* ══════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => loader?.classList.add('hide'), 1400);
  setTimeout(() => document.querySelector('.hero')?.classList.add('loaded'), 200);

  if (productsGrid) productsGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:60px 0;color:var(--cream-muted)">Carregando cardápio...</p>';
  if (combosGrid)   combosGrid.innerHTML   = '<p style="grid-column:1/-1;text-align:center;padding:40px 0;color:var(--cream-muted)">Carregando combos...</p>';

  updateCartUI();
  bindEvents();
  scrollEffects();

  document.addEventListener('firebaseStoreReady', e => {
    currentProducts = e.detail.products || [];
    currentCombos   = e.detail.combos   || [];
    if (e.detail.settings) applySettings(e.detail.settings);
    renderProducts(activeFilter);
    renderCombos();
    window.__APP_READY__ = true;
  });

  document.addEventListener('firebaseBannersReady', e => {
    renderBanners(e.detail.banners || []);
  });
});

/* ══════════════════════════════════════════════════════
   APPLY SETTINGS
══════════════════════════════════════════════════════ */
function applySettings(s) {
  _settings = s;
  _whatsapp = s.whatsapp  || WHATSAPP_NUMBER;
  _fee      = s.deliveryFee != null ? Number(s.deliveryFee) : DELIVERY_FEE;
  _minOrder = s.minOrder   != null ? Number(s.minOrder)    : MIN_ORDER;

  /* Hero subtitle */
  const sub = $('heroSubtitle');
  if (sub && s.subtitle) sub.textContent = s.subtitle;

  /* Hero delivery time stat */
  const dt = $('heroDeliveryTime');
  if (dt && s.deliveryTime) dt.textContent = s.deliveryTime;

  /* Info strip delivery fee */
  const stripFee = $('infoStripFee');
  if (stripFee) stripFee.textContent = `R$ ${formatPrice(_fee)}`;

  /* Contact: address */
  const addrEl = $('contactAddress');
  if (addrEl && s.address) addrEl.innerHTML = escapeHtml(s.address) + (s.city ? `<br />${escapeHtml(s.city)}` : '');

  /* Contact: hours */
  const hoursEl = $('contactHours');
  if (hoursEl && s.openingHours) hoursEl.innerHTML = formatHoursHtml(s.openingHours);

  /* Contact: whatsapp links */
  const waNum = `+${_whatsapp.replace(/\D/g, '')}`;
  document.querySelectorAll('[data-wa-link]').forEach(el => {
    if (el.tagName === 'A') el.href = `https://wa.me/${_whatsapp.replace(/\D/g, '')}`;
  });
  const waText = $('contactWaText');
  if (waText) {
    const digits = _whatsapp.replace(/\D/g, '');
    const fmt = digits.length >= 11
      ? `(${digits.slice(2,4)}) ${digits.slice(4,9)}-${digits.slice(9)}`
      : _whatsapp;
    waText.textContent = fmt;
    waText.href = `https://wa.me/${digits}`;
  }

  /* Contact: instagram */
  const igEl = $('contactInstagram');
  if (igEl && s.instagram) {
    igEl.href = s.instagram.startsWith('http') ? s.instagram : `https://instagram.com/${s.instagram.replace('@','')}`;
    igEl.textContent = s.instagram.startsWith('@') ? s.instagram : `@${s.instagram}`;
  }

  /* Footer: whatsapp link */
  const footerWa = $('footerWhatsapp');
  if (footerWa) footerWa.href = `https://wa.me/${_whatsapp.replace(/\D/g, '')}`;

  /* Footer: instagram */
  const footerIg = $('footerInstagram');
  if (footerIg && s.instagram) {
    footerIg.href = s.instagram.startsWith('http') ? s.instagram : `https://instagram.com/${s.instagram.replace('@','')}`;
  }

  /* Footer: facebook */
  const footerFb = $('footerFacebook');
  if (footerFb && s.facebook) {
    footerFb.href = s.facebook.startsWith('http') ? s.facebook : `https://facebook.com/${s.facebook}`;
  }

  /* Map placeholder address */
  const mapAddr = $('mapAddress');
  if (mapAddr && s.address) mapAddr.textContent = s.address;

  /* Store open/closed status */
  updateStoreStatus(s);

  /* Re-render cart totals with new fee */
  updateCartUI();
}

function formatHoursHtml(openingHours) {
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const lines = [];
  for (let i = 1; i <= 6; i++) {
    const r = openingHours[i];
    if (!r) continue;
    if (r.closed) { lines.push(`${days[i]}: Fechado`); continue; }
    lines.push(`${days[i]}: ${r.open} às ${r.close}`);
  }
  const dom = openingHours[0];
  if (dom) lines.push(dom.closed ? 'Dom: Fechado' : `Dom: ${dom.open} às ${dom.close}`);
  return lines.join('<br />');
}

function updateStoreStatus(s) {
  const open = isStoreOpen(s);
  const dot  = document.querySelector('.header__status .status-dot');
  const txt  = document.querySelector('.header__status .status-text');
  const banner = $('storeClosedBanner');

  if (dot) {
    dot.classList.toggle('status-dot--open',   open);
    dot.classList.toggle('status-dot--closed', !open);
  }
  if (txt) txt.textContent = open ? 'Aberto agora' : 'Fechado';
  if (banner) banner.style.display = open ? 'none' : 'block';
}

/* ══════════════════════════════════════════════════════
   BANNERS
══════════════════════════════════════════════════════ */
function renderBanners(banners) {
  const section = $('bannersSection');
  if (!section || !banners.length) return;
  section.style.display = '';
  const grid = section.querySelector('.container');
  if (!grid) return;
  grid.innerHTML = banners.map(b => `
    <div class="promo-banner" style="
      position:relative;overflow:hidden;border-radius:16px;
      background:${b.image ? `url('${escapeHtml(b.image)}') center/cover no-repeat` : 'var(--bg-card)'};
      min-height:180px;display:flex;align-items:flex-end;
      border:1px solid rgba(201,162,39,.2);
    ">
      <div style="
        position:absolute;inset:0;
        background:linear-gradient(to top,rgba(0,0,0,.75) 0%,transparent 60%);
      "></div>
      <div style="position:relative;padding:24px;z-index:1">
        ${b.title ? `<h3 style="font-family:'Cinzel',serif;font-size:1.1rem;color:#e6c84a;margin-bottom:4px">${escapeHtml(b.title)}</h3>` : ''}
        ${b.subtitle ? `<p style="font-size:.85rem;color:rgba(232,213,163,.8)">${escapeHtml(b.subtitle)}</p>` : ''}
      </div>
    </div>`).join('');
}

/* ══════════════════════════════════════════════════════
   RENDER PRODUCTS
══════════════════════════════════════════════════════ */
window.renderProducts = filter => {
  if (window.__FB_PRODUCTS__) currentProducts = window.__FB_PRODUCTS__;
  renderProducts(filter || activeFilter);
};
window.renderCombos = () => {
  if (window.__FB_COMBOS__) currentCombos = window.__FB_COMBOS__;
  renderCombos();
};

function renderProducts(filter) {
  activeFilter = filter;
  window.__ACTIVE_FILTER__ = filter;

  const items = filter === 'all'
    ? currentProducts
    : currentProducts.filter(p => (p.cat || p.category) === filter);

  productsGrid.innerHTML = '';

  if (!currentProducts.length) {
    productsGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:60px 0;color:var(--cream-muted)">Nenhum produto disponível.</p>';
    return;
  }

  items.forEach((p, i) => {
    const card = document.createElement('article');
    card.className = 'product-card';
    card.setAttribute('role', 'listitem');
    card.style.animationDelay = `${i * 0.06}s`;
    card.innerHTML = `
      <div class="product-card__img">
        <img src="${escapeHtml(p.img)}" alt="${escapeHtml(p.name)}" loading="lazy" />
        ${p.badge ? `<span class="product-card__badge ${escapeHtml(p.badgeClass)}">${escapeHtml(p.badge)}</span>` : ''}
        <span class="ilustrativa-tag">Imagem meramente ilustrativa</span>
      </div>
      <div class="product-card__body">
        <span class="product-card__category">${escapeHtml(p.catLabel || p.categoryLabel || '')}</span>
        <h3 class="product-card__name">${escapeHtml(p.name)}</h3>
        <p class="product-card__desc">${escapeHtml(p.desc)}</p>
        <div class="product-card__footer">
          <div class="product-card__price">
            <span>R$</span>${formatPrice(p.price)}
          </div>
          <button class="product-card__add" aria-label="Adicionar ${escapeHtml(p.name)} ao carrinho" data-id="${escapeHtml(p.id)}">+</button>
        </div>
      </div>
    `;
    card.addEventListener('click', e => {
      if (!e.target.classList.contains('product-card__add')) openModal(p);
    });
    card.querySelector('.product-card__add').addEventListener('click', e => {
      e.stopPropagation();
      addToCart(p, 1);
    });
    productsGrid.appendChild(card);
  });
}

/* ══════════════════════════════════════════════════════
   RENDER COMBOS
══════════════════════════════════════════════════════ */
function renderCombos() {
  combosGrid.innerHTML = '';
  currentCombos.forEach(c => {
    const card = document.createElement('article');
    card.className = 'combo-card';
    card.setAttribute('role', 'listitem');
    card.innerHTML = `
      <img class="combo-card__img" src="${escapeHtml(c.img)}" alt="${escapeHtml(c.name)}" loading="lazy" />
      <span class="ilustrativa-tag combo-ilustrativa">Imagem meramente ilustrativa</span>
      <div class="combo-card__overlay"></div>
      <div class="combo-card__content">
        <div class="combo-card__label">Combo Real</div>
        <div class="combo-card__name">${escapeHtml(c.name)}</div>
        <div class="combo-card__items">${escapeHtml(c.items)}</div>
        <div class="combo-card__footer">
          <div class="combo-card__price">R$ ${formatPrice(c.price)}</div>
          <button class="combo-card__btn" data-id="${escapeHtml(c.id)}">Pedir</button>
        </div>
      </div>
    `;
    card.querySelector('.combo-card__btn').addEventListener('click', e => {
      e.stopPropagation();
      addToCart({ ...c, catLabel: 'Combo Real', desc: c.items }, 1);
    });
    combosGrid.appendChild(card);
  });
}

/* ══════════════════════════════════════════════════════
   MODAL
══════════════════════════════════════════════════════ */
function openModal(product) {
  currentItem    = product;
  currentQty     = 1;
  selectedAddons = [];

  modalImg.src       = product.img;
  modalImg.alt       = product.name;
  modalCategory.textContent = product.catLabel || product.categoryLabel || '';
  modalName.textContent     = product.name;
  modalDesc.textContent     = product.desc;
  modalQty.textContent      = '1';

  if (modalAddons) {
    modalAddons.innerHTML = ADDONS.map((a, i) => `
      <label style="display:flex;align-items:center;justify-content:space-between;
                    padding:8px 12px;border-radius:8px;cursor:pointer;
                    border:1px solid rgba(201,162,39,.18);margin-bottom:6px;
                    transition:background .15s">
        <span style="display:flex;align-items:center;gap:10px">
          <input type="checkbox" data-idx="${i}"
                 style="width:16px;height:16px;accent-color:#c9a227;cursor:pointer"/>
          <span style="font-size:.85rem;color:var(--cream-2)">${escapeHtml(a.name)}</span>
        </span>
        <span style="font-size:.8rem;color:#c9a227;font-weight:600">+R$ ${a.price.toFixed(2).replace('.',',')}</span>
      </label>`).join('');
    modalAddons.querySelectorAll('input[type=checkbox]').forEach(cb => {
      cb.addEventListener('change', () => {
        const addon = ADDONS[+cb.dataset.idx];
        if (cb.checked) selectedAddons.push(addon);
        else selectedAddons = selectedAddons.filter(a => a !== addon);
        updateModalTotal();
      });
    });
  }

  updateModalTotal();
  modalOverlay.classList.add('open');
  productModal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modalOverlay.classList.remove('open');
  productModal.classList.remove('open');
  document.body.style.overflow = '';
  currentItem    = null;
  selectedAddons = [];
}

function updateModalTotal() {
  if (!currentItem) return;
  const addonTotal = selectedAddons.reduce((s, a) => s + a.price, 0);
  modalTotal.textContent = `R$ ${formatPrice((currentItem.price + addonTotal) * currentQty)}`;
}

/* ══════════════════════════════════════════════════════
   CART OPERATIONS
══════════════════════════════════════════════════════ */
function addToCart(product, qty, obs = '') {
  /* Bloqueia pedido quando loja está fechada */
  if (_settings && !isStoreOpen(_settings)) {
    showToast('Loja fechada no momento. Volte em breve!');
    return;
  }

  const existing = cart.find(i => i.id === product.id);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      id:       product.id,
      name:     product.name,
      price:    product.price,
      img:      product.img,
      catLabel: product.catLabel || product.categoryLabel || '',
      qty,
      obs
    });
  }
  saveCart();
  updateCartUI();
  showToast(`${product.name} adicionado ao pedido!`);
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart();
  updateCartUI();
}

function updateQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  const newQty = item.qty + delta;
  if (newQty <= 0) { removeFromCart(id); return; }
  item.qty = newQty;
  saveCart();
  updateCartUI();
}

function clearCart() {
  cart = [];
  saveCart();
  updateCartUI();
}

/* ══════════════════════════════════════════════════════
   CART UI
══════════════════════════════════════════════════════ */
function updateCartUI() {
  const count    = cart.reduce((s, i) => s + i.qty, 0);
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const fee      = deliveryMode === 'delivery' ? _fee : 0;
  const total    = subtotal + fee;

  cartBadge.textContent = count;
  cartBadge.style.display = count > 0 ? 'flex' : 'none';

  fabBadge.textContent = count;
  fabTotal.textContent = `R$ ${formatPrice(total)}`;
  fabCart.style.display = count > 0 ? 'flex' : 'none';

  if (cart.length === 0) {
    cartEmpty.style.display = 'flex';
    cartFooter.style.display = 'none';
    cartItems.querySelectorAll('.cart-item').forEach(el => el.remove());
    return;
  }

  cartEmpty.style.display = 'none';
  cartFooter.style.display = 'flex';

  cartItems.querySelectorAll('.cart-item').forEach(el => el.remove());

  cart.forEach(item => {
    const el = document.createElement('div');
    el.className = 'cart-item';
    el.innerHTML = `
      <img class="cart-item__img" src="${escapeHtml(item.img)}" alt="${escapeHtml(item.name)}" loading="lazy" />
      <div class="cart-item__info">
        <div class="cart-item__name">${escapeHtml(item.name)}</div>
        ${item.obs ? `<div class="cart-item__obs">Obs: ${escapeHtml(item.obs)}</div>` : ''}
        <div class="cart-item__controls">
          <div class="qty-ctrl">
            <button class="qty-btn btn-minus" aria-label="Diminuir">−</button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn btn-plus" aria-label="Aumentar">+</button>
          </div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;justify-content:space-between">
        <button class="cart-item__remove btn-remove" aria-label="Remover">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="pointer-events:none"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        </button>
        <span class="cart-item__price">R$ ${formatPrice(item.price * item.qty)}</span>
      </div>
    `;
    el.querySelector('.btn-minus').addEventListener('click', () => updateQty(item.id, -1));
    el.querySelector('.btn-plus').addEventListener('click',  () => updateQty(item.id,  1));
    el.querySelector('.btn-remove').addEventListener('click', () => removeFromCart(item.id));
    cartItems.appendChild(el);
  });

  cartSubtotal.textContent = `R$ ${formatPrice(subtotal)}`;
  cartDelivery.textContent = fee > 0 ? `R$ ${formatPrice(fee)}` : 'Grátis';
  cartTotal.textContent    = `R$ ${formatPrice(total)}`;

  if (subtotal < _minOrder) {
    checkoutBtn.textContent = `Mínimo R$ ${formatPrice(_minOrder)}`;
    checkoutBtn.style.opacity = '.6';
    checkoutBtn.style.pointerEvents = 'none';
  } else {
    checkoutBtn.innerHTML = `Finalizar Pedido <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
    checkoutBtn.style.opacity = '1';
    checkoutBtn.style.pointerEvents = 'auto';
  }

  sessionStorage.setItem('lords_cart', JSON.stringify({
    items: cart,
    subtotal, fee, total,
    mode: deliveryMode,
    obs: obsInput?.value || ''
  }));
}

/* ══════════════════════════════════════════════════════
   WHATSAPP ORDER
══════════════════════════════════════════════════════ */
function buildWhatsappMessage() {
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const fee      = deliveryMode === 'delivery' ? _fee : 0;
  const total    = subtotal + fee;
  const mode     = deliveryMode === 'delivery' ? '🛵 Delivery' : '🏠 Retirada no local';
  const obs      = obsInput?.value?.trim();

  let msg = `*LORD'S BURGER HOUSE* 👑\n`;
  msg += `*NOVO PEDIDO* 🍔\n`;
  msg += `──────────────────────\n`;
  msg += `*Modalidade:* ${mode}\n\n`;
  msg += `*Itens do Pedido:*\n`;

  cart.forEach(item => {
    msg += `▸ ${item.qty}x ${item.name} — R$ ${formatPrice(item.price * item.qty)}\n`;
    if (item.obs) msg += `  _Obs: ${item.obs}_\n`;
  });

  msg += `──────────────────────\n`;
  msg += `*Subtotal:* R$ ${formatPrice(subtotal)}\n`;
  if (fee > 0) msg += `*Entrega:* R$ ${formatPrice(fee)}\n`;
  msg += `*TOTAL: R$ ${formatPrice(total)}*\n`;
  msg += `*Pagamento:* a combinar na entrega/retirada\n`;
  if (obs) msg += `\n*Observações:* ${obs}\n`;
  msg += `\n_Pedido realizado pelo site — Lord's Burger House_`;

  return encodeURIComponent(msg);
}

/* ══════════════════════════════════════════════════════
   OPEN / CLOSE CART
══════════════════════════════════════════════════════ */
function openCart() {
  cartDrawer.classList.add('open');
  cartOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCartFn() {
  cartDrawer.classList.remove('open');
  cartOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

/* ══════════════════════════════════════════════════════
   TOAST
══════════════════════════════════════════════════════ */
let toastTimeout;
function showToast(msg) {
  toastMsg.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 2800);
}

/* ══════════════════════════════════════════════════════
   SCROLL EFFECTS
══════════════════════════════════════════════════════ */
function scrollEffects() {
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ══════════════════════════════════════════════════════
   EVENT BINDING
══════════════════════════════════════════════════════ */
function bindEvents() {
  cartBtn?.addEventListener('click', openCart);
  cartClose?.addEventListener('click', closeCartFn);
  cartOverlay?.addEventListener('click', closeCartFn);
  fabCart?.addEventListener('click', openCart);

  menuToggle?.addEventListener('click', () => {
    const open = mobileNav.classList.toggle('open');
    menuToggle.classList.toggle('open', open);
    menuToggle.setAttribute('aria-expanded', open);
  });

  mobileNav?.querySelectorAll('.mobile-nav__link').forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      menuToggle.classList.remove('open');
    });
  });

  categoryTabs?.querySelectorAll('.cat-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      categoryTabs.querySelectorAll('.cat-tab').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      activeFilter = btn.dataset.cat;
      renderProducts(activeFilter);
    });
  });

  document.querySelectorAll('[data-cat]').forEach(a => {
    a.addEventListener('click', () => {
      const cat = a.dataset.cat;
      if (!cat) return;
      categoryTabs?.querySelectorAll('.cat-tab').forEach(b => {
        const active = b.dataset.cat === cat;
        b.classList.toggle('active', active);
        b.setAttribute('aria-selected', active);
      });
      renderProducts(cat);
    });
  });

  btnDelivery?.addEventListener('click', () => {
    deliveryMode = 'delivery';
    btnDelivery.classList.add('active');
    btnPickup.classList.remove('active');
    deliveryRow.style.display = '';
    updateCartUI();
  });
  btnPickup?.addEventListener('click', () => {
    deliveryMode = 'pickup';
    btnPickup.classList.add('active');
    btnDelivery.classList.remove('active');
    deliveryRow.style.display = 'none';
    updateCartUI();
  });

  whatsappBtn?.addEventListener('click', () => {
    if (cart.length === 0) return showToast('Adicione itens ao carrinho!');
    window.open(`https://wa.me/${_whatsapp.replace(/\D/g,'')}?text=${buildWhatsappMessage()}`, '_blank');
  });

  modalClose?.addEventListener('click', closeModal);
  modalOverlay?.addEventListener('click', closeModal);

  modalQtyMinus?.addEventListener('click', () => {
    if (currentQty > 1) { currentQty--; modalQty.textContent = currentQty; updateModalTotal(); }
  });
  modalQtyPlus?.addEventListener('click', () => {
    currentQty++; modalQty.textContent = currentQty; updateModalTotal();
  });

  modalAddBtn?.addEventListener('click', () => {
    if (!currentItem) return;
    const addonTotal = selectedAddons.reduce((s, a) => s + a.price, 0);
    const addonNames = selectedAddons.map(a => a.name).join(', ');
    addToCart({
      ...currentItem,
      id:    addonNames ? `${currentItem.id}::${addonNames}` : currentItem.id,
      price: currentItem.price + addonTotal
    }, currentQty, addonNames);
    closeModal();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeModal(); closeCartFn(); }
  });

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href').slice(1);
      const el = document.getElementById(id);
      if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });
}

/* ══════════════════════════════════════════════════════
   PERSISTENCE
══════════════════════════════════════════════════════ */
function loadCart() {
  try { return JSON.parse(localStorage.getItem('lords_cart') || '[]'); }
  catch { return []; }
}
function saveCart() {
  localStorage.setItem('lords_cart', JSON.stringify(cart));
}

function formatPrice(n) {
  return n.toFixed(2).replace('.', ',');
}
