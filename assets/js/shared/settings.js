/**
 * LORD'S BURGER HOUSE — shared/settings.js
 * Carrega/salva configurações da loja via Firestore (settings/config).
 * Usado por firebase-store.js, app.js, admin/settings.html e checkout.html.
 */

import { db } from '../firebase-config.js';
import {
  doc, getDoc, setDoc, onSnapshot, collection, addDoc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

export const DEFAULT_SETTINGS = {
  storeName:    "Lord's Burger House",
  slogan:       'O Sabor Digno da Realeza',
  subtitle:     'Ingredientes selecionados, receitas exclusivas e o compromisso de entregar o melhor hambúrguer artesanal da cidade.',
  whatsapp:     '5511940737953',
  deliveryFee:  5.00,
  minOrder:     20.00,
  deliveryTime: '30min',
  address:      'Rua das Realezas, 123 — Centro',
  city:         'Sua Cidade, Estado',
  instagram:    '',
  facebook:     '',
  openingHours: {
    0: { open: '11:00', close: '00:00', closed: false }, // Dom
    1: { open: '11:00', close: '23:00', closed: false }, // Seg
    2: { open: '11:00', close: '23:00', closed: false }, // Ter
    3: { open: '11:00', close: '23:00', closed: false }, // Qua
    4: { open: '11:00', close: '23:00', closed: false }, // Qui
    5: { open: '11:00', close: '23:00', closed: false }, // Sex
    6: { open: '11:00', close: '00:00', closed: false }, // Sáb
  }
};

let _cached = null;
const SETTINGS_REF = () => doc(db, 'settings', 'config');

/** Lê settings uma vez (com cache em memória). */
export async function loadSettings() {
  if (_cached) return _cached;
  try {
    const snap = await getDoc(SETTINGS_REF());
    _cached = snap.exists()
      ? { ...DEFAULT_SETTINGS, ...snap.data() }
      : { ...DEFAULT_SETTINGS };
  } catch {
    _cached = { ...DEFAULT_SETTINGS };
  }
  return _cached;
}

/** Observa mudanças em settings (live). Chama callback(settings) imediatamente e a cada update. */
export function watchSettings(callback) {
  return onSnapshot(SETTINGS_REF(), snap => {
    _cached = snap.exists()
      ? { ...DEFAULT_SETTINGS, ...snap.data() }
      : { ...DEFAULT_SETTINGS };
    callback(_cached);
  }, () => {
    callback({ ...DEFAULT_SETTINGS });
  });
}

/** Salva settings no Firestore. */
export async function saveSettings(data) {
  await setDoc(SETTINGS_REF(), data, { merge: true });
  _cached = null; // invalida cache
}

/** Verifica se a loja está aberta agora com base em openingHours. */
export function isStoreOpen(settings) {
  const hours = settings?.openingHours || DEFAULT_SETTINGS.openingHours;
  const now   = new Date();
  const day   = now.getDay();
  const rule  = hours[day];
  if (!rule || rule.closed) return false;

  const [oh, om] = (rule.open  || '00:00').split(':').map(Number);
  const [ch, cm] = (rule.close || '00:00').split(':').map(Number);

  const nowMins   = now.getHours() * 60 + now.getMinutes();
  const openMins  = oh * 60 + om;
  let   closeMins = ch * 60 + cm;

  // Meia-noite ou fechamento depois de meia-noite
  if (closeMins === 0 || closeMins <= openMins) closeMins = 24 * 60;

  return nowMins >= openMins && nowMins < closeMins;
}

/** Grava uma linha no audit_log (best-effort — sem throw). */
export async function logAudit(user, action, details = {}) {
  try {
    await addDoc(collection(db, 'audit_logs'), {
      usuario:   user?.email || user?.displayName || 'desconhecido',
      uid:       user?.uid   || null,
      acao:      action,
      detalhes:  details,
      data:      serverTimestamp()
    });
  } catch {
    // silencioso — não bloqueia fluxo principal
  }
}
