/* ============================================================
   LORD'S BURGER HOUSE — shared/formatters.js
   ============================================================ */

/** Format a number as "12,90" (sem símbolo R$) */
export function fmt(n) {
  return Number(n || 0).toFixed(2).replace('.', ',');
}

/** Alias — usado por app.js e checkout.html */
export function formatPrice(n) {
  return Number(n || 0).toFixed(2).replace('.', ',');
}

/** Hora apenas: "14:30" — admin/dashboard recent orders */
export function fmtTime(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/** Data + hora curta: "15/06 14:30" — attendant + customer */
export function fmtDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

/** Data + hora com ano: "15/06/24 14:30" — admin/orders table */
export function fmtDatetime(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
    + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/** Data apenas: "15/06/2024" — admin/users created-at */
export function fmtDay(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('pt-BR');
}
