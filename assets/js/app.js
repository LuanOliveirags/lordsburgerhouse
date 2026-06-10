/* ============================================================
   LORD'S BURGER HOUSE — app.js
   Cardápio, Carrinho, Modal, WhatsApp, Filtros
   ============================================================ */

'use strict';

/* ── WHATSAPP NUMBER ───────────────────────────────────── */
const WHATSAPP = '5511940737953';

/* ── DELIVERY FEES ─────────────────────────────────────── */
const DELIVERY_FEE  = 5.00;
const MIN_ORDER     = 20.00;

/* ── PRODUCT DATA ──────────────────────────────────────── */
/* Fotos reais via Unsplash (licença gratuita para uso dev) */
const PRODUCTS = [

  /* ── HAMBÚRGUERES ROYALE ─────────────────────────────── */
  {
    id: 'lords-classic',
    cat: 'royale',
    catLabel: 'Hambúrguer Royale',
    name: "Lord's Classic",
    desc: 'Pão brioche fresquinho, hambúrguer artesanal 180g, queijo cheddar cremoso, alface americana, tomate e nosso molho especial da casa.',
    price: 24.90,
    badge: 'Mais Pedido',
    badgeClass: 'badge--popular',
    img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'rei-supremo',
    cat: 'royale',
    catLabel: 'Hambúrguer Royale',
    name: 'Rei Supremo',
    desc: 'Dois hambúrgueres artesanais 180g, cheddar duplo, bacon crocante artesanal, cebola caramelizada no vinho e o inigualável molho Lord\'s.',
    price: 39.90,
    badge: null,
    badgeClass: '',
    img: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'duque-bacon',
    cat: 'royale',
    catLabel: 'Hambúrguer Royale',
    name: 'Duque Bacon',
    desc: 'Hambúrguer artesanal 180g, cheddar cremoso, bacon crocante defumado em tiras generosas e maionese defumada artesanal.',
    price: 34.90,
    badge: null,
    badgeClass: '',
    img: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'conde-bbq',
    cat: 'royale',
    catLabel: 'Hambúrguer Royale',
    name: 'Conde BBQ',
    desc: 'Hambúrguer artesanal 180g, bacon, queijo gouda derretido, cebola crispy dourada e molho barbecue artesanal defumado.',
    price: 36.90,
    badge: null,
    badgeClass: '',
    img: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'majestade-angus',
    cat: 'royale',
    catLabel: 'Hambúrguer Royale',
    name: 'Majestade Angus',
    desc: 'Hambúrguer Angus premium 250g, queijo gouda envelhecido, rúcula fresca, tomate confit e molho especial gourmet.',
    price: 44.90,
    badge: 'Premium',
    badgeClass: 'badge--especial',
    img: 'https://images.unsplash.com/photo-1607013251379-e6eecfffe234?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'imperador',
    cat: 'royale',
    catLabel: 'Hambúrguer Royale',
    name: 'Imperador',
    desc: '3 carnes artesanais (160g cada), cheddar triplo, bacon artesanal, cebola frita crocante e o exclusivo molho Lord\'s Premium.',
    price: 54.90,
    badge: 'Especial',
    badgeClass: 'badge--especial',
    img: 'https://images.unsplash.com/photo-1619740455993-9e612b1af08a?auto=format&fit=crop&w=800&q=80'
  },

  /* ── SMASH BURGERS ────────────────────────────────────── */
  {
    id: 'smash-real',
    cat: 'smash',
    catLabel: 'Smash Burger',
    name: 'Smash Real',
    desc: '2 Smash Burgers 90g cada, smashados na chapa quente criando crosta perfeita, cheddar americano e nosso molho especial.',
    price: 25.90,
    badge: 'Novo',
    badgeClass: 'badge--novo',
    img: 'https://images.unsplash.com/photo-1685109649408-9fd1d7a8f15c?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'smashbacon-king',
    cat: 'smash',
    catLabel: 'Smash Burger',
    name: 'SmashBacon King',
    desc: '2 Smash Burgers 90g, cheddar americano derretido, strips de bacon crocante e molho especial da casa.',
    price: 29.90,
    badge: null,
    badgeClass: '',
    img: 'https://images.unsplash.com/photo-1639024471283-03518883512d?auto=format&fit=crop&w=800&q=80'
  },

  /* ── ESPECIAIS ────────────────────────────────────────── */
  {
    id: 'lord-chicken',
    cat: 'especial',
    catLabel: 'Burger Especial',
    name: 'Lord Chicken',
    desc: 'Filé de frango empanado artesanalmente, queijo cheddar, arroz basmati, alface crocante, tomate e molho especial da casa.',
    price: 29.90,
    badge: null,
    badgeClass: '',
    img: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'veggie-crown',
    cat: 'especial',
    catLabel: 'Burger Especial',
    name: 'Veggie Crown',
    desc: 'Hambúrguer vegetal artesanal, cobertura de queijo vegano, alface americana, tomate fresco e molho especial plant-based.',
    price: 28.90,
    badge: 'Veggie',
    badgeClass: 'badge--veg',
    img: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=800&q=80'
  },

  /* ── ACOMPANHAMENTOS ──────────────────────────────────── */
  {
    id: 'batata-real-p',
    cat: 'acompanhamento',
    catLabel: 'Acompanhamento',
    name: 'Batata Real P',
    desc: 'Porção pequena de batatas fritas crocantes temperadas com sal, pimenta e ervas aromáticas.',
    price: 12.90,
    badge: null,
    badgeClass: '',
    img: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'batata-real-g',
    cat: 'acompanhamento',
    catLabel: 'Acompanhamento',
    name: 'Batata Real G',
    desc: 'Porção grande de batatas fritas crocantes, generosas e bem temperadas. Perfeitas para compartilhar.',
    price: 18.90,
    badge: null,
    badgeClass: '',
    img: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'batata-lords-bacon',
    cat: 'acompanhamento',
    catLabel: 'Acompanhamento',
    name: "Batata Lord's Bacon & Cheddar",
    desc: 'Porção especial de batatas cobertas com cheddar cremoso e pedaços generosos de bacon crocante. Puro prazer.',
    price: 24.90,
    badge: 'Destaque',
    badgeClass: 'badge--popular',
    img: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'onion-rings',
    cat: 'acompanhamento',
    catLabel: 'Acompanhamento',
    name: 'Onion Rings',
    desc: '20 unidades de anéis de cebola empanados artesanalmente, crocantes por fora e suculentos por dentro.',
    price: 18.90,
    badge: null,
    badgeClass: '',
    img: 'https://images.unsplash.com/photo-1639024471283-03518883512d?auto=format&fit=crop&w=800&q=80'
  },

  /* ── BEBIDAS ──────────────────────────────────────────── */
  {
    id: 'refri-lata',
    cat: 'bebida',
    catLabel: 'Bebida',
    name: 'Refrigerante Lata',
    desc: 'Coca-Cola, Guaraná Antarctica ou Fanta Laranja. Gelada e refrescante, 350ml.',
    price: 7.00,
    badge: null,
    badgeClass: '',
    img: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'refri-600ml',
    cat: 'bebida',
    catLabel: 'Bebida',
    name: 'Refrigerante 600ml',
    desc: 'Coca-Cola, Guaraná Antarctica ou Fanta Laranja em garrafa de 600ml. Ideal para compartilhar.',
    price: 10.00,
    badge: null,
    badgeClass: '',
    img: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'agua-mineral',
    cat: 'bebida',
    catLabel: 'Bebida',
    name: 'Água Mineral',
    desc: 'Água mineral natural sem gás 500ml, refrescante e pura.',
    price: 5.00,
    badge: null,
    badgeClass: '',
    img: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'suco-natural',
    cat: 'bebida',
    catLabel: 'Bebida',
    name: 'Suco Natural',
    desc: 'Suco natural artesanal de Laranja, Limão ou Morango. Feito na hora, sem conservantes.',
    price: 10.90,
    badge: 'Natural',
    badgeClass: 'badge--veg',
    img: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'milk-shake',
    cat: 'bebida',
    catLabel: 'Bebida',
    name: 'Milk Shake 350ml',
    desc: 'Milk shake cremoso e encorpado nos sabores Chocolate, Morango, Baunilha ou Nutella. Puro prazer em cada gole.',
    price: 16.90,
    badge: 'Favorito',
    badgeClass: 'badge--popular',
    img: 'https://images.unsplash.com/photo-1541658016709-82835474a58b?auto=format&fit=crop&w=800&q=80'
  },

  /* ── SOBREMESAS ───────────────────────────────────────── */
  {
    id: 'brownie-coroa',
    cat: 'sobremesa',
    catLabel: 'Sobremesa',
    name: 'Brownie da Coroa',
    desc: 'Brownie artesanal de chocolate belga, denso e úmido, servido com calda quente de chocolate e sorvete de creme.',
    price: 14.90,
    badge: null,
    badgeClass: '',
    img: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'petit-gateau',
    cat: 'sobremesa',
    catLabel: 'Sobremesa',
    name: 'Petit Gateau Real',
    desc: 'Bolo quente de chocolate com recheio derretido, acompanhado de sorvete de creme e calda de chocolate. Experiência inesquecível.',
    price: 19.90,
    badge: 'Especial',
    badgeClass: 'badge--especial',
    img: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'sundae-lords',
    cat: 'sobremesa',
    catLabel: 'Sobremesa',
    name: "Sundae Lord's",
    desc: 'Sorvete cremoso de creme, regado com calda especial de caramelo ou chocolate e farofa crocante de biscoito.',
    price: 12.90,
    badge: null,
    badgeClass: '',
    img: 'https://images.unsplash.com/photo-1488900128323-21503983a07e?auto=format&fit=crop&w=800&q=80'
  }
];

/* ── COMBOS DATA ───────────────────────────────────────── */
const COMBOS = [
  {
    id: 'combo-lords-classic',
    name: "Combo Lord's Classic",
    items: "Lord's Classic + Batata Real P + Refrigerante Lata",
    price: 42.90,
    img: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'combo-rei-supremo',
    name: 'Combo Rei Supremo',
    items: 'Rei Supremo + Batata Real G + Refrigerante Lata',
    price: 52.90,
    img: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'combo-imperador',
    name: 'Combo Imperador',
    items: 'Imperador + Batata Real G + Refrigerante 600ml',
    price: 69.90,
    img: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=900&q=80'
  }
];

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
  // Loader
  setTimeout(() => loader.classList.add('hide'), 1400);

  // Hero bg transition
  setTimeout(() => document.querySelector('.hero')?.classList.add('loaded'), 200);

  renderProducts('all');
  renderCombos();

  updateCartUI();
  bindEvents();
  scrollEffects();
});

/* ══════════════════════════════════════════════════════
   RENDER PRODUCTS
══════════════════════════════════════════════════════ */
function renderProducts(filter) {
  const items = filter === 'all'
    ? PRODUCTS
    : PRODUCTS.filter(p => p.cat === filter);

  productsGrid.innerHTML = '';

  items.forEach((p, i) => {
    const card = document.createElement('article');
    card.className = 'product-card';
    card.setAttribute('role', 'listitem');
    card.style.animationDelay = `${i * 0.06}s`;
    card.innerHTML = `
      <div class="product-card__img">
        <img src="${p.img}" alt="${p.name}" loading="lazy" />
        ${p.badge ? `<span class="product-card__badge ${p.badgeClass}">${p.badge}</span>` : ''}
        <span class="ilustrativa-tag">Imagem meramente ilustrativa</span>
      </div>
      <div class="product-card__body">
        <span class="product-card__category">${p.catLabel}</span>
        <h3 class="product-card__name">${p.name}</h3>
        <p class="product-card__desc">${p.desc}</p>
        <div class="product-card__footer">
          <div class="product-card__price">
            <span>R$</span>${formatPrice(p.price)}
          </div>
          <button class="product-card__add" aria-label="Adicionar ${p.name} ao carrinho" data-id="${p.id}">+</button>
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
  COMBOS.forEach(c => {
    const card = document.createElement('article');
    card.className = 'combo-card';
    card.setAttribute('role', 'listitem');
    card.innerHTML = `
      <img class="combo-card__img" src="${c.img}" alt="${c.name}" loading="lazy" />
      <span class="ilustrativa-tag combo-ilustrativa">Imagem meramente ilustrativa</span>
      <div class="combo-card__overlay"></div>
      <div class="combo-card__content">
        <div class="combo-card__label">Combo Real</div>
        <div class="combo-card__name">${c.name}</div>
        <div class="combo-card__items">${c.items}</div>
        <div class="combo-card__footer">
          <div class="combo-card__price">R$ ${formatPrice(c.price)}</div>
          <button class="combo-card__btn" data-id="${c.id}">Pedir</button>
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
  currentItem = product;
  currentQty  = 1;

  modalImg.src       = product.img;
  modalImg.alt       = product.name;
  modalCategory.textContent = product.catLabel;
  modalName.textContent     = product.name;
  modalDesc.textContent     = product.desc;
  modalQty.textContent      = '1';
  updateModalTotal();

  modalOverlay.classList.add('open');
  productModal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modalOverlay.classList.remove('open');
  productModal.classList.remove('open');
  document.body.style.overflow = '';
  currentItem = null;
}

function updateModalTotal() {
  if (!currentItem) return;
  modalTotal.textContent = `R$ ${formatPrice(currentItem.price * currentQty)}`;
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
      catLabel: product.catLabel,
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
    // Clear items except empty state
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
      <img class="cart-item__img" src="${item.img}" alt="${item.name}" loading="lazy" />
      <div class="cart-item__info">
        <div class="cart-item__name">${item.name}</div>
        ${item.obs ? `<div class="cart-item__obs">Obs: ${item.obs}</div>` : ''}
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

    /* listeners diretos — sem event delegation, sem risco de falha */
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

  /* Cart item buttons: listeners são adicionados diretamente em updateCartUI */

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
    const url = `https://wa.me/${WHATSAPP}?text=${buildWhatsappMessage()}`;
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
    addToCart(currentItem, currentQty);
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
