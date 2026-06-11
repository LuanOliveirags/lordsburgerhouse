/* ============================================================
   LORD'S BURGER HOUSE — shared/constants.js
   Fonte única de verdade para constantes de negócio.
   Usado por todos os scripts de módulo (panel pages, services).
   NOTA: app.js e checkout.html usam scripts regulares (não-módulo)
         e ainda mantêm cópias locais até migração para módulo (P3).
   ============================================================ */

export const WHATSAPP_NUMBER = '5511940737953';
export const DELIVERY_FEE    = 5.00;
export const MIN_ORDER       = 20.00;

export const PAGE_SIZES = {
  admin:     30,
  attendant: 50,
  customer:  10,
};
