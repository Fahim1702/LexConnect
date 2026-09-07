import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import app from './server.js';
import User from './models/User.js';
import { firebaseIdentity } from './config/firebase.js';

test('Firebase adapter asks the Admin SDK to check token revocation', async () => {
  const previous = process.env.FIREBASE_PROJECT_ID;
  process.env.FIREBASE_PROJECT_ID = 'demo-lexconnect-test';
  const firebaseApp = initializeApp({ projectId: 'demo-lexconnect-test' }, 'lexconnect-auth');
  try {
    const auth = getAuth(firebaseApp);
    const verify = mock.method(auth, 'verifyIdToken', async () => ({ uid: 'test-user', email: 'test@example.test' }));
    await firebaseIdentity.verifyIdToken('test-token');
    assert.deepEqual(verify.mock.calls[0].arguments, ['test-token', true]);
    const revoke = mock.method(auth, 'revokeRefreshTokens', async () => {});
    await firebaseIdentity.revokeRefreshTokens('test-user');
    assert.deepEqual(revoke.mock.calls[0].arguments, ['test-user']);
  } finally {
    mock.restoreAll();
    await deleteApp(firebaseApp);
    if (previous === undefined) delete process.env.FIREBASE_PROJECT_ID;
    else process.env.FIREBASE_PROJECT_ID = previous;
  }
});

test('missing, rejected and inactive identities cannot reach protected routes', async (t) => {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => { mock.restoreAll(); await new Promise(resolve => server.close(resolve)); });
  const base = `http://127.0.0.1:${server.address().port}/api`;
  mock.method(firebaseIdentity, 'verifyIdToken', async token => {
    if (token === 'expired') throw Object.assign(new Error(), { code: 'auth/id-token-expired' });
    if (token === 'revoked') throw Object.assign(new Error(), { code: 'auth/id-token-revoked' });
    if (token === 'forged') throw Object.assign(new Error(), { code: 'auth/invalid-id-token' });
    if (token === 'unavailable') throw Object.assign(new Error(), { code: 'app/invalid-credential' });
    return { uid: token, email: `${token}@example.test` };
  });
  mock.method(User, 'findOne', async ({ firebaseUid }) => firebaseUid === 'unregistered' ? null : {
    _id: 'test-profile', firebaseUid, name: 'Test Client', email: 'test@example.test', role: 'client', isActive: firebaseUid !== 'inactive'
  });
  const call = async (path, method, token, status) => {
    const response = await fetch(base + path, { method, headers: token ? { Authorization: `Bearer ${token}` } : {} });
    assert.equal(response.status, status, `${method} ${path}`);
    return response.json();
  };
  for (const [path, method] of [['/services', 'POST'], ['/services/abc', 'PUT'], ['/services/abc', 'DELETE'], ['/consultations', 'GET'], ['/consultations/abc', 'GET'], ['/consultations/abc', 'PUT'], ['/client/consultations', 'GET'], ['/auth/me', 'GET'], ['/auth/sync', 'POST']]) {
    await call(path, method, null, 401);
  }
  for (const token of ['expired', 'revoked', 'forged', 'unregistered']) await call('/auth/me', 'GET', token, 401);
  await call('/auth/me', 'GET', 'inactive', 403);
  await call('/auth/me', 'GET', 'unavailable', 503);
  await call('/services', 'POST', 'client', 403);
  await call('/consultations', 'GET', 'client', 403);
  await call('/consultations', 'POST', 'forged', 401);
  await call('/consultations', 'POST', 'inactive', 403);
  const profile = await call('/auth/me', 'GET', 'client', 200);
  assert.equal(profile.user.role, 'client');
  assert.equal(profile.user.password, undefined);
});

test('new MongoDB profiles require a Firebase UID and reject local passwords', async () => {
  await assert.rejects(new User({ name: 'Test', email: 'test@example.test' }).validate(), error => Boolean(error.errors.firebaseUid));
  await assert.rejects(new User({ firebaseUid: 'test', name: 'Test', email: 'test@example.test', password: 'not-a-stored-password' }).validate(), error => Boolean(error.errors.password));
});
