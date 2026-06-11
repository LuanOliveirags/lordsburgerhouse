/**
 * LORD'S BURGER HOUSE — Firebase Store Bridge
 * Carrega produtos/combos/settings/banners do Firestore.
 * Disparado como <script type="module"> em index.html ANTES do app.js.
 */

import { db, auth, ORDER_STATUS } from './firebase-config.js';
import {
  collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, where
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { onAuthStateChanged }
  from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { loadSettings } from './shared/settings.js';

/* ── Expose current user globally ── */
onAuthStateChanged(auth, user => {
  window.__FB_USER__ = user || null;
  updateAuthUI(user);
});

function updateAuthUI(user) {
  const btn = document.getElementById('authNavBtn');
  const mobileBtn = document.getElementById('authMobileBtn');
  const label = user ? 'Meus Pedidos' : 'Entrar';
  const href  = user ? 'pages/customer/orders.html' : 'pages/auth/login.html';
  const iconUser   = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
  const iconOrders = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>';
  if (btn)       { btn.innerHTML = user ? iconOrders + label : iconUser; btn.href = href; }
  if (mobileBtn) { mobileBtn.textContent = label; mobileBtn.href = href; }
}

/* ── Load products & combos from Firestore ── */
const qProducts = query(collection(db, 'products'), orderBy('sortOrder'));
const qCombos   = query(collection(db, 'combos'),   orderBy('sortOrder'));

let productsReady = false;
let combosReady   = false;
let settingsReady = false;
let fbProducts    = [];
let fbCombos      = [];
let fbSettings    = null;

function tryDispatch() {
  if (!productsReady || !combosReady || !settingsReady) return;
  window.__FB_PRODUCTS__ = fbProducts;
  window.__FB_COMBOS__   = fbCombos;
  window.__FB_SETTINGS__ = fbSettings;
  document.dispatchEvent(new CustomEvent('firebaseStoreReady', {
    detail: { products: fbProducts, combos: fbCombos, settings: fbSettings }
  }));
}

/* ── Load settings first (one-time) ── */
loadSettings().then(s => {
  fbSettings    = s;
  settingsReady = true;
  tryDispatch();
}).catch(() => {
  settingsReady = true;
  tryDispatch();
});

onSnapshot(qProducts, snap => {
  fbProducts = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(p => p.available !== false);
  productsReady = true;
  tryDispatch();
  if (window.__APP_READY__) window.renderProducts?.(window.__ACTIVE_FILTER__ || 'all');
}, () => {
  productsReady = true;
  tryDispatch();
});

onSnapshot(qCombos, snap => {
  fbCombos = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(c => c.available !== false);
  combosReady = true;
  tryDispatch();
  if (window.__APP_READY__) window.renderCombos?.();
}, () => {
  combosReady = true;
  tryDispatch();
});

/* ── Load banners independently (non-blocking) ── */
const qBanners = query(
  collection(db, 'banners'),
  where('active', '==', true),
  orderBy('ordem')
);

onSnapshot(qBanners, snap => {
  const banners = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  window.__FB_BANNERS__ = banners;
  document.dispatchEvent(new CustomEvent('firebaseBannersReady', {
    detail: { banners }
  }));
}, () => {
  window.__FB_BANNERS__ = [];
});

/* ── Save order to Firestore ── */
export async function saveOrderToFirestore(orderData) {
  try {
    const ref = await addDoc(collection(db, 'orders'), {
      ...orderData,
      status:    'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return ref.id;
  } catch (e) {
    console.warn('Firestore order save failed:', e);
    return null;
  }
}
window.__saveOrderToFirestore__ = saveOrderToFirestore;
