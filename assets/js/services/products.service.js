/* ============================================================
   LORD'S BURGER HOUSE — services/products.service.js
   Abstração sobre as coleções "products" e "combos".
   ============================================================ */

import { db } from '../firebase-config.js';
import {
  collection, query, orderBy, onSnapshot, doc,
  addDoc, updateDoc, deleteDoc, serverTimestamp, getDocs,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

/**
 * Inscreve em tempo real na coleção de produtos.
 * @param {(products: Object[]) => void} callback
 * @returns {() => void} unsubscribe
 */
export function subscribeProducts(callback) {
  const q = query(collection(db, 'products'), orderBy('sortOrder'));
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}

/**
 * Inscreve em tempo real na coleção de combos.
 * @param {(combos: Object[]) => void} callback
 * @returns {() => void} unsubscribe
 */
export function subscribeCombos(callback) {
  const q = query(collection(db, 'combos'), orderBy('sortOrder'));
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}

/**
 * Carrega produtos disponíveis uma única vez (para uso em formulários).
 * @returns {Promise<Object[]>}
 */
export async function fetchAvailableProducts() {
  const snap = await getDocs(query(collection(db, 'products'), orderBy('sortOrder')));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(p => p.available !== false);
}

/**
 * Cria um produto ou combo.
 * @param {string} colName - 'products' | 'combos'
 * @param {Object} data
 * @returns {Promise<DocumentReference>}
 */
export async function createItem(colName, data) {
  return addDoc(collection(db, colName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Atualiza um produto ou combo.
 * @param {string} colName - 'products' | 'combos'
 * @param {string} id
 * @param {Object} data
 */
export async function updateItem(colName, id, data) {
  await updateDoc(doc(db, colName, id), { ...data, updatedAt: serverTimestamp() });
}

/**
 * Remove um produto ou combo.
 * @param {string} colName - 'products' | 'combos'
 * @param {string} id
 */
export async function deleteItem(colName, id) {
  await deleteDoc(doc(db, colName, id));
}

/**
 * Altera disponibilidade de um item.
 * @param {string} colName
 * @param {string} id
 * @param {boolean} available
 */
export async function setAvailability(colName, id, available) {
  await updateDoc(doc(db, colName, id), { available, updatedAt: serverTimestamp() });
}
