/**
 * LORD'S BURGER HOUSE — Firebase Store Bridge
 * Carrega produtos/combos do Firestore e os disponibiliza para o app.js
 * Disparado como <script type="module"> em index.html ANTES do app.js
 */

import { db, auth, ORDER_STATUS } from './firebase-config.js';
import {
  collection, onSnapshot, addDoc, serverTimestamp, query, orderBy
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { onAuthStateChanged }
  from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

/* ── Expose current user globally so app.js can use it ── */
onAuthStateChanged(auth, user => {
  window.__FB_USER__ = user || null;
  updateAuthUI(user);
});

function updateAuthUI(user) {
  const btn = document.getElementById('authNavBtn');
  const mobileBtn = document.getElementById('authMobileBtn');
  const label = user ? 'Meus Pedidos' : 'Entrar';
  const href  = user ? 'pages/customer/orders.html' : 'pages/auth/login.html';
  if (btn)       { btn.textContent = label; btn.href = href; }
  if (mobileBtn) { mobileBtn.textContent = label; mobileBtn.href = href; }
}

/* ── Load products & combos from Firestore ── */
const qProducts = query(collection(db, 'products'), orderBy('sortOrder'));
const qCombos   = query(collection(db, 'combos'),   orderBy('sortOrder'));

let productsReady = false;
let combosReady   = false;
let fbProducts    = [];
let fbCombos      = [];

function tryDispatch() {
  if (!productsReady || !combosReady) return;
  window.__FB_PRODUCTS__ = fbProducts;
  window.__FB_COMBOS__   = fbCombos;
  document.dispatchEvent(new CustomEvent('firebaseStoreReady', {
    detail: { products: fbProducts, combos: fbCombos }
  }));
}

onSnapshot(qProducts, snap => {
  fbProducts = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(p => p.available !== false);
  productsReady = true;
  tryDispatch();
  /* live update — re-render if app already loaded */
  if (window.__APP_READY__) window.renderProducts?.(window.__ACTIVE_FILTER__ || 'all');
}, () => {
  /* Firestore not configured yet — app.js will use hardcoded data */
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
