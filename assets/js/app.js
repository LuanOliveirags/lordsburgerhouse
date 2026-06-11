/* ============================================================
   LORD'S BURGER HOUSE — app.js
   Cardápio, Carrinho, Modal, WhatsApp, Filtros
   ============================================================ */

import { WHATSAPP_NUMBER, DELIVERY_FEE, MIN_ORDER } from './shared/constants.js';
import { escapeHtml } from './shared/sanitizer.js';

/* ── DADOS DO CARDÁPIO (carregados do Firestore) ─────────── */
/* firebase-store.js dispara 'firebaseStoreReady' com products e combos */
let currentProducts = [];
let currentCombos   = [];

/* ── ADICIONAIS DATA ───────────────────────────────────── */
const ADDONS = [
  { name: 'Cheddar Extra',       price: 4.00 },
  { name: 'Bacon Extra',         price: 5.00 },
  { name: 'Ovo Frito',           price: 3.00 },
  { name: 'Onion Rings Extra',   price: 7.00 },
  { name: 'Hambúrguer Extra 160g', price: 10.00 },
  { name: 'Molho Especial',      price: 2.50 }
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
  setTimeout(() => loader.classList.add('hide'), 1400);
  setTimeout(() => document.querySelector('.hero')?.classList.add('loaded'), 200);

  // Estado de carregamento enquanto aguarda o Firestore
  if (productsGrid) productsGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:60px 0;color:var(--cream-muted)">Carregando cardápio...</p>';
  if (combosGrid)   combosGrid.innerHTML   = '<p style="grid-column:1/-1;text-align:center;padding:40px 0;color:var(--cream-muted)">Carregando combos...</p>';

  updateCartUI();
  bindEvents();
  scrollEffects();

  // Renderiza quando o Firestore estiver pronto
  document.addEventListener('firebaseStoreReady', e => {
    currentProducts = e.detail.products || [];
    currentCombos   = e.detail.combos   || [];
    renderProducts(activeFilter);
    renderCombos();
    window.__APP_READY__ = true;
  });
});

/* Exposto para firebase-store.js realizar atualizações em tempo real */
window.renderProducts = filter => {
  if (window.__FB_PRODUCTS__) currentProducts = window.__FB_PRODUCTS__;
  renderProducts(filter || activeFilter);
};
window.renderCombos = () => {
  if (window.__FB_COMBOS__) currentCombos = window.__FB_COMBOS__;
  renderCombos();
};

/* ══════════════════════════════════════════════════════
   RENDER PRODUCTS
══════════════════════════════════════════════════════ */
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
  const existing = cart.find(i => i.id === product.id);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      id:    product.id,
      name:  product.name,
      price: product.price,
      img:   product.img,
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
  if (newQty <= 0) {
    removeFromCart(id);
    return;
  }
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
  const fee      = deliveryMode === 'delivery' ? DELIVERY_FEE : 0;
  const total    = subtotal + fee;

  // Badge
  cartBadge.textContent = count;
  cartBadge.style.display = count > 0 ? 'flex' : 'none';

  // FAB
  fabBadge.textContent = count;
  fabTotal.textContent = `R$ ${formatPrice(total)}`;
  fabCart.style.display = count > 0 ? 'flex' : 'none';

  // Empty state
  if (cart.length === 0) {
    cartEmpty.style.display = 'flex';
    cartFooter.style.display = 'none';
    const items = cartItems.querySelectorAll('.cart-item');
    items.forEach(el => el.remove());
    return;
  }

  cartEmpty.style.display = 'none';
  cartFooter.style.display = 'flex';

  // Render items
  const existing = cartItems.querySelectorAll('.cart-item');
  existing.forEach(el => el.remove());

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

  // Totals
  cartSubtotal.textContent = `R$ ${formatPrice(subtotal)}`;
  cartDelivery.textContent = fee > 0 ? `R$ ${formatPrice(fee)}` : 'Grátis';
  cartTotal.textContent    = `R$ ${formatPrice(total)}`;

  // Checkout button state
  if (subtotal < MIN_ORDER) {
    checkoutBtn.textContent = `Mínimo R$ ${formatPrice(MIN_ORDER)}`;
    checkoutBtn.style.opacity = '.6';
    checkoutBtn.style.pointerEvents = 'none';
  } else {
    checkoutBtn.innerHTML = `Finalizar Pedido <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
    checkoutBtn.style.opacity = '1';
    checkoutBtn.style.pointerEvents = 'auto';
  }

  // Save to session for checkout
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
  const fee      = deliveryMode === 'delivery' ? DELIVERY_FEE : 0;
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
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ══════════════════════════════════════════════════════
   EVENT BINDING
══════════════════════════════════════════════════════ */
function bindEvents() {

  /* Header cart */
  cartBtn?.addEventListener('click', openCart);
  cartClose?.addEventListener('click', closeCartFn);
  cartOverlay?.addEventListener('click', closeCartFn);

  /* FAB */
  fabCart?.addEventListener('click', openCart);

  /* Mobile menu */
  menuToggle?.addEventListener('click', () => {
    const open = mobileNav.classList.toggle('open');
    menuToggle.classList.toggle('open', open);
    menuToggle.setAttribute('aria-expanded', open);
  });

  /* Close mobile nav on link click */
  mobileNav?.querySelectorAll('.mobile-nav__link').forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      menuToggle.classList.remove('open');
    });
  });

  /* Category filter */
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

  /* Footer links with cat filter */
  document.querySelectorAll('[data-cat]').forEach(a => {
    a.addEventListener('click', e => {
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

  /* Delivery toggle */
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

  /* WhatsApp order */
  whatsappBtn?.addEventListener('click', () => {
    if (cart.length === 0) return showToast('Adicione itens ao carrinho!');
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${buildWhatsappMessage()}`;
    window.open(url, '_blank');
  });

  /* Modal controls */
  modalClose?.addEventListener('click', closeModal);
  modalOverlay?.addEventListener('click', closeModal);

  modalQtyMinus?.addEventListener('click', () => {
    if (currentQty > 1) {
      currentQty--;
      modalQty.textContent = currentQty;
      updateModalTotal();
    }
  });
  modalQtyPlus?.addEventListener('click', () => {
    currentQty++;
    modalQty.textContent = currentQty;
    updateModalTotal();
  });

  modalAddBtn?.addEventListener('click', () => {
    if (!currentItem) return;
    const addonTotal = selectedAddons.reduce((s, a) => s + a.price, 0);
    const addonNames = selectedAddons.map(a => a.name).join(', ');
    const productWithAddons = {
      ...currentItem,
      id:    addonNames ? `${currentItem.id}::${addonNames}` : currentItem.id,
      price: currentItem.price + addonTotal
    };
    addToCart(productWithAddons, currentQty, addonNames);
    closeModal();
  });

  /* Keyboard close */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeModal();
      closeCartFn();
    }
  });

  /* Smooth scroll for nav links */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href').slice(1);
      const el = document.getElementById(id);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
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

/* ── HELPER ─────────────────────────────────────────────── */
function formatPrice(n) {
  return n.toFixed(2).replace('.', ',');
}
