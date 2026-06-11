/**
 * LORD'S BURGER HOUSE — shared/loyalty.js
 * Sistema Coroas Lord's — acúmulo, resgate, saldo, métricas.
 *
 * Regra: R$1 gasto = 1 Coroa. Apenas pedidos com status "delivered" geram pontos.
 * Idempotência garantida pelo campo `pointsAwarded: true` no documento do pedido.
 */

import {
  doc, getDoc, setDoc, collection, addDoc, getDocs, collectionGroup,
  query, where, orderBy, limit, runTransaction,
  serverTimestamp, increment
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

export const POINTS_PER_REAL = 1; // 1 Coroa por R$1

/* ────────────────────────────────────────────
   P6.2 — Acúmulo automático ao entregar pedido
──────────────────────────────────────────────*/

/**
 * Verifica o pedido e, se elegível, credita Coroas ao cliente.
 * Deve ser chamado APÓS updateDoc(order, {status:'delivered'}).
 * @param {string} orderId
 * @param {object} db  - instância Firestore
 * @returns {number|null} pontos creditados, ou null se não elegível
 */
export async function tryAwardPoints(orderId, db) {
  try {
    const orderRef  = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);
    if (!orderSnap.exists()) return null;

    const order = orderSnap.data();

    // Só pedidos delivered com customer logado que ainda não receberam pontos
    if (order.status !== 'delivered')   return null;
    if (!order.customerId)              return null;
    if (order.pointsAwarded === true)   return null;

    const points = Math.floor(Number(order.total || 0) * POINTS_PER_REAL);
    if (points <= 0) return null;

    const loyaltyRef = doc(db, 'loyalty', order.customerId);

    // Atualização atômica: saldo + marca pedido como pontuado
    await runTransaction(db, async tx => {
      const loySnap = await tx.get(loyaltyRef);
      const cur = loySnap.exists()
        ? loySnap.data()
        : { balance: 0, totalEarned: 0, totalRedeemed: 0 };

      tx.set(loyaltyRef, {
        userId:        order.customerId,
        balance:       (cur.balance       || 0) + points,
        totalEarned:   (cur.totalEarned   || 0) + points,
        totalRedeemed: cur.totalRedeemed  || 0,
        updatedAt:     serverTimestamp()
      }, { merge: true });

      tx.update(orderRef, { pointsAwarded: true, pointsAmount: points });
    });

    // Registro de transação (fora da runTransaction para simplicidade)
    await addDoc(collection(db, 'transactions'), {
      userId:      order.customerId,
      type:        'earn',
      amount:      points,
      description: `Pedido #${order.orderNumber || orderId.slice(0, 8).toUpperCase()} entregue`,
      orderId:     orderId,
      createdAt:   serverTimestamp()
    });

    return points;
  } catch (e) {
    console.warn('[Loyalty] tryAwardPoints error:', e);
    return null;
  }
}

/* ────────────────────────────────────────────
   P6.5 — Resgate de recompensa
──────────────────────────────────────────────*/

/**
 * Resgata uma recompensa para o usuário.
 * @param {string} userId
 * @param {{ id:string, nome:string, custo:number }} reward
 * @param {object} db
 * @returns {{ success:boolean, message:string }}
 */
export async function redeemReward(userId, reward, db) {
  try {
    const loyaltyRef = doc(db, 'loyalty', userId);

    const result = await runTransaction(db, async tx => {
      const loySnap = await tx.get(loyaltyRef);
      if (!loySnap.exists()) throw new Error('Você ainda não possui Coroas acumuladas.');
      const cur = loySnap.data();
      if ((cur.balance || 0) < reward.custo) throw new Error('Coroas insuficientes.');

      tx.update(loyaltyRef, {
        balance:       (cur.balance       || 0) - reward.custo,
        totalRedeemed: (cur.totalRedeemed || 0) + reward.custo,
        updatedAt:     serverTimestamp()
      });
      return true;
    });

    // Registro da transação de resgate
    await addDoc(collection(db, 'transactions'), {
      userId:      userId,
      type:        'redeem',
      amount:      -reward.custo,
      description: `Resgate: ${reward.nome}`,
      rewardId:    reward.id,
      orderId:     null,
      createdAt:   serverTimestamp()
    });

    return { success: true, message: `${reward.nome} resgatado com sucesso!` };
  } catch (e) {
    return { success: false, message: e.message || 'Erro ao resgatar.' };
  }
}

/* ────────────────────────────────────────────
   Leitura de saldo e histórico
──────────────────────────────────────────────*/

export async function getBalance(userId, db) {
  try {
    const snap = await getDoc(doc(db, 'loyalty', userId));
    if (!snap.exists()) return { balance: 0, totalEarned: 0, totalRedeemed: 0 };
    return snap.data();
  } catch {
    return { balance: 0, totalEarned: 0, totalRedeemed: 0 };
  }
}

export async function getTransactions(userId, db, n = 20) {
  try {
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(n)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch {
    return [];
  }
}

/* ────────────────────────────────────────────
   P6.6 — Métricas do dashboard admin
──────────────────────────────────────────────*/

export async function getLoyaltyMetrics(db) {
  try {
    const [loySnap, txSnap] = await Promise.all([
      getDocs(collection(db, 'loyalty')),
      getDocs(collection(db, 'transactions'))
    ]);

    let totalIssued   = 0;
    let totalRedeemed = 0;
    let activeClients = 0;

    loySnap.docs.forEach(d => {
      const data = d.data();
      totalIssued   += data.totalEarned   || 0;
      totalRedeemed += data.totalRedeemed || 0;
      if ((data.balance || 0) > 0) activeClients++;
    });

    // Recompensa mais resgatada
    const redeemCounts = {};
    txSnap.docs.forEach(d => {
      const data = d.data();
      if (data.type === 'redeem' && data.description) {
        const key = data.description.replace('Resgate: ', '');
        redeemCounts[key] = (redeemCounts[key] || 0) + 1;
      }
    });
    const topReward = Object.entries(redeemCounts)
      .sort((a, b) => b[1] - a[1])[0];

    return {
      totalIssued,
      totalRedeemed,
      activeClients,
      topReward: topReward ? `${topReward[0]} (${topReward[1]}x)` : '—'
    };
  } catch {
    return { totalIssued: 0, totalRedeemed: 0, activeClients: 0, topReward: '—' };
  }
}
