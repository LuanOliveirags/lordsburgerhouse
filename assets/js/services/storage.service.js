/* ============================================================
   LORD'S BURGER HOUSE — services/storage.service.js
   Abstração sobre Firebase Storage (upload e exclusão de imagens).
   ============================================================ */

import { storage } from '../firebase-config.js';
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';

/**
 * Faz upload de uma imagem para o path "products/".
 * @param {File} file
 * @param {(pct: number) => void} [onProgress]
 * @returns {Promise<string>} Download URL
 */
export function uploadProductImage(file, onProgress) {
  return new Promise((resolve, reject) => {
    const path = `products/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const ref  = storageRef(storage, path);
    const task = uploadBytesResumable(ref, file);
    task.on(
      'state_changed',
      snap => onProgress?.((snap.bytesTransferred / snap.totalBytes) * 100),
      reject,
      async () => resolve(await getDownloadURL(task.snapshot.ref)),
    );
  });
}

/**
 * Exclui uma imagem pelo URL de download do Firebase Storage.
 * Silencia erros (imagem pode já ter sido removida).
 * @param {string} downloadUrl
 */
export async function deleteImageByUrl(downloadUrl) {
  if (!downloadUrl?.includes('firebasestorage.googleapis.com')) return;
  try {
    const match = downloadUrl.match(/\/o\/(.+?)\?/);
    if (match) await deleteObject(storageRef(storage, decodeURIComponent(match[1])));
  } catch (_) { /* já removida ou sem permissão */ }
}
