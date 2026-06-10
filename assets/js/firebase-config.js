/**
 * LORD'S BURGER HOUSE — Firebase Configuration
 *
 * 🔧 SETUP (faça isso antes de tudo):
 *   1. Acesse https://console.firebase.google.com
 *   2. Crie um projeto (ex: "lords-burger-house")
 *   3. Ative: Authentication > Email/Senha
 *   4. Ative: Firestore Database (modo produção)
 *   5. Ative: Storage
 *   6. Em "Configurações do Projeto > Seus apps > Web app", copie as credenciais abaixo
 */

import { initializeApp }                          from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth }                                from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore, enableIndexedDbPersistence } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { getStorage }                             from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';

// ⚠️  Falta preencher: apiKey e appId
// → Configurações do Projeto > "Seus apps" > clique em </> (Web) > Registrar app > copie apiKey e appId
const firebaseConfig = {
  apiKey:            "AIzaSyDzd5hpVwnum80TqH6RwO5J70xpztc1xEw",
  authDomain:        "lordsburgerhouse.firebaseapp.com",
  projectId:         "lordsburgerhouse",
  storageBucket:     "lordsburgerhouse.firebasestorage.app",
  messagingSenderId: "914748889312",
  appId:             "1:914748889312:web:e2e45dfd1634fbf5bed885",
  measurementId:     "G-QRBQKGQ164"
};

export const app     = initializeApp(firebaseConfig);
export const auth    = getAuth(app);
export const db      = getFirestore(app);
export const storage = getStorage(app);

// Persistência offline: pedidos ficam no cache mesmo sem internet
enableIndexedDbPersistence(db).catch(() => {});

/* ── ROLES ─────────────────────────────────────────────── */
export const ROLES = {
  CUSTOMER:  'customer',
  ATTENDANT: 'attendant',
  ADMIN:     'admin'
};

export const ROLE_LABELS = {
  customer:  'Cliente',
  attendant: 'Atendente',
  admin:     'Administrador'
};

export const ROLE_HOME = {
  customer:  '../../pages/customer/orders.html',
  attendant: '../../pages/attendant/dashboard.html',
  admin:     '../../pages/admin/dashboard.html'
};

/* ── ORDER STATUS ───────────────────────────────────────── */
export const ORDER_STATUS = {
  pending:    { label: 'Aguardando',    color: '#f39c12', icon: '⏳' },
  confirmed:  { label: 'Confirmado',    color: '#3498db', icon: '✅' },
  preparing:  { label: 'Em preparo',    color: '#9b59b6', icon: '👨‍🍳' },
  ready:      { label: 'Pronto',        color: '#27ae60', icon: '🟢' },
  delivering: { label: 'Saiu p/ entrega', color: '#e67e22', icon: '🛵' },
  delivered:  { label: 'Entregue',      color: '#2ecc71', icon: '🏁' },
  cancelled:  { label: 'Cancelado',     color: '#e74c3c', icon: '❌' }
};
