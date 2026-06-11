/* ============================================================
   LORD'S BURGER HOUSE — services/orders.service.js
   Abstração sobre operações Firestore da coleção "orders".
   ============================================================ */

import { db, ORDER_STATUS } from '../firebase-config.js';
import {
  collection, query, orderBy, onSnapshot, doc,
  updateDoc, deleteDoc, addDoc, serverTimestamp,
  limit, startAfter, getDocs,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

/**
 * Inscreve em tempo real na coleção de pedidos, com paginação inicial.
 * @param {number} pageSize
 * @param {(docs: QueryDocumentSnapshot[]) => void} onPage
 * @returns {{ unsubscribe: () => void }}
 */
export function subscribeOrders(pageSize, onPage) {
  const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(pageSize));
  const unsubscribe = onSnapshot(q, snap => onPage(snap.docs));
  return { unsubscribe };
}

/**
 * Carrega a próxima página de pedidos (cursor-based).
 * @param {QueryDocumentSnapshot} lastDoc
 * @param {number} pageSize
 * @returns {Promise<QueryDocumentSnapshot[]>}
 */
export async function fetchMoreOrders(lastDoc, pageSize) {
  const q = query(
    collection(db, 'orders'),
    orderBy('createdAt', 'desc'),
    startAfter(lastDoc),
    limit(pageSize),
  );
  const snap = await getDocs(q);
  return snap.docs;
}

/**
 * Atualiza o status de um pedido.
 * @param {string} orderId
 * @param {string} status - chave de ORDER_STATUS
 */
export async function updateOrderStatus(orderId, status) {
  await updateDoc(doc(db, 'orders', orderId), { status, updatedAt: serverTimestamp() });
}

/**
 * Exclui um pedido permanentemente.
 * @param {string} orderId
 */
export async function deleteOrder(orderId) {
  await deleteDoc(doc(db, 'orders', orderId));
}

/**
 * Cria um novo pedido (pedido manual do atendente).
 * @param {Object} orderData
 * @returns {Promise<DocumentReference>}
 */
export async function createOrder(orderData) {
  return addDoc(collection(db, 'orders'), {
    ...orderData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
