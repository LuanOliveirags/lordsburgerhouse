/* ============================================================
   LORD'S BURGER HOUSE — services/users.service.js
   Abstração sobre a coleção "users".
   ============================================================ */

import { db } from '../firebase-config.js';
import {
  collection, query, orderBy, onSnapshot, doc,
  updateDoc, deleteDoc, serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

/**
 * Inscreve em tempo real na lista de usuários.
 * @param {(users: Object[]) => void} callback
 * @returns {() => void} unsubscribe
 */
export function subscribeUsers(callback) {
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}

/**
 * Altera o papel (role) de um usuário.
 * @param {string} uid
 * @param {string} newRole
 */
export async function changeUserRole(uid, newRole) {
  await updateDoc(doc(db, 'users', uid), { role: newRole, updatedAt: serverTimestamp() });
}

/**
 * Remove o documento de cadastro de um usuário (Firestore only).
 * Nota: Auth record permanece — para remoção completa usar Cloud Function.
 * @param {string} uid
 */
export async function deleteUserDoc(uid) {
  await deleteDoc(doc(db, 'users', uid));
}
