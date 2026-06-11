'use strict';

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp }      = require('firebase-admin/app');
const { getAuth }            = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

initializeApp();

/**
 * Creates a new staff (attendant / admin) account without affecting
 * the caller's active session, since it runs server-side with Admin SDK.
 *
 * Client call: httpsCallable(getFunctions(app), 'createStaffUser')({ name, email, password, phone, role })
 */
exports.createStaffUser = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Autenticação necessária.');
  }

  const db = getFirestore();
  const callerDoc = await db.doc(`users/${request.auth.uid}`).get();
  if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
    throw new HttpsError('permission-denied', 'Apenas administradores podem criar contas de staff.');
  }

  const { name, email, password, phone, role } = request.data;

  if (!name || !email || !password || password.length < 6) {
    throw new HttpsError('invalid-argument', 'Preencha todos os campos (senha mín. 6 chars).');
  }
  if (!['attendant', 'admin'].includes(role)) {
    throw new HttpsError('invalid-argument', 'Função inválida: use "attendant" ou "admin".');
  }

  const auth = getAuth();

  let userRecord;
  try {
    userRecord = await auth.createUser({ email, password, displayName: name });
  } catch (e) {
    if (e.code === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', 'Já existe uma conta com este e-mail.');
    }
    throw new HttpsError('internal', e.message);
  }

  await db.doc(`users/${userRecord.uid}`).set({
    name,
    email,
    phone: (phone || '').replace(/\D/g, ''),
    role,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  });

  return { uid: userRecord.uid };
});
