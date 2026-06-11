/* ============================================================
   LORD'S BURGER HOUSE — shared/toast.js
   ============================================================ */

const ICONS = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };

export function showToast(msg, type = 'info', containerId = 'toastContainer') {
  const container = document.getElementById(containerId);
  if (!container) return;
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.innerHTML = `<span class="toast__icon">${ICONS[type] || 'ℹ️'}</span> ${msg}`;
  container.appendChild(el);
  setTimeout(() => {
    el.classList.add('removing');
    setTimeout(() => el.remove(), 300);
  }, 3500);
}
