import assert from 'node:assert/strict';
import { mock } from 'node:test';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import mongoose from 'mongoose';
import app from '../server/src/server.js';
import { connectDatabase, disconnectDatabase } from '../server/src/config/db.js';
import { seedPublicData } from '../server/src/seeds/seed.js';
import Service from '../server/src/models/Service.js';
import FAQ from '../server/src/models/FAQ.js';
import Lawyer from '../server/src/models/Lawyer.js';
import User from '../server/src/models/User.js';
import BlogPost from '../server/src/models/BlogPost.js';
import CaseStudy from '../server/src/models/CaseStudy.js';
import ConsultationRequest from '../server/src/models/ConsultationRequest.js';
import { firebaseIdentity } from '../server/src/config/firebase.js';

// Always override the configured database name. Never seed or clear the user's DB.
const database = `lexconnect_smoke_${randomUUID().replaceAll('-', '').slice(0, 16)}`;
let server;
let connected = false;
let base;
// Only the external Firebase boundary is mocked; HTTP routes and MongoDB are real.
const identities = {
  admin: { uid: 'smoke-admin', email: 'admin@example.test' },
  client: { uid: 'smoke-client', email: 'client@example.test' },
  other: { uid: 'smoke-other', email: 'other@example.test' },
  collision: { uid: 'smoke-collision', email: 'legacy@example.test' }
};
const revoked = new Set();
mock.method(firebaseIdentity, 'verifyIdToken', async token => {
  if (!identities[token] || revoked.has(token)) throw Object.assign(new Error(), { code: 'auth/invalid-id-token' });
  return identities[token];
});
mock.method(firebaseIdentity, 'revokeRefreshTokens', async uid => {
  for (const [token, identity] of Object.entries(identities)) if (identity.uid === uid) revoked.add(token);
});

async function request(path, method = 'GET', payload, status = 200, token = (path.startsWith('/services') || (path.startsWith('/consultations') && method !== 'POST')) ? 'admin' : null) {
  const response = await fetch(base + path, {
    method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: payload === undefined ? undefined : JSON.stringify(payload),
    signal: AbortSignal.timeout(10000)
  });
  assert.equal(response.status, status, `${method} ${path}`);
  const body = await response.json();
  assert.equal(body.success, status < 400);
  return body;
}

try {
  await connectDatabase({ dbName: database });
  connected = true;
  assert.equal(mongoose.connection.name, database);
  await Promise.all(Object.values(mongoose.models).map(model => model.init()));
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}/api`;
  await User.create({ firebaseUid: identities.admin.uid, name: 'Test Admin', email: identities.admin.email, role: 'admin' });

  for (const route of ['services', 'lawyers', 'case-studies', 'blog', 'faqs']) {
    assert.deepEqual((await request(`/public/${route}`)).items, []);
  }
  assert.deepEqual((await request('/public/home')).data.services, []);
  console.log('PASS: public pages receive valid responses on a fresh, empty database.');

  await seedPublicData();
  const service = await Service.findOne({ slug: 'corporate-company-law' });
  await Service.updateOne({ _id: service._id }, { description: 'A teammate edited this.' });
  await seedPublicData();
  assert.equal(await Service.countDocuments(), 3);
  assert.equal(await FAQ.countDocuments(), 1);
  assert.equal((await Service.findById(service._id)).description, 'A teammate edited this.');
  assert.equal((await request('/public/services?q=Corporate')).items.length, 1);
  assert.equal((await request('/public/services?category=Business')).items.length, 1);
  assert.equal((await request('/public/services?page=2&limit=1')).items.length, 1);
  assert.equal((await request(`/public/services/${service._id}`)).service._id, String(service._id));
  assert.equal((await request('/public/services/corporate-company-law')).service._id, String(service._id));
  assert.equal((await request('/public/home')).data.services.length, 3);
  console.log('PASS: repeat seeding preserves edits; service search, pagination, home and detail routes work.');

  const basic = (await request('/services', 'POST', { title: 'Basic service', category: 'Test', description: 'No slug or summary required.' }, 201)).item;
  assert.equal((await request(`/public/services/${basic._id}`)).service.title, 'Basic service');
  await request(`/services/${basic._id}`, 'PUT', { title: 'Updated basic service' });
  await request(`/services/${basic._id}`, 'DELETE');
  await request(`/services/${basic._id}`, 'GET', undefined, 404);
  console.log('PASS: the rebuilt service CRUD still works alongside public routes.');

  const user = await User.create({ firebaseUid: 'smoke-lawyer', name: 'Smoke Test Lawyer', email: 'smoke@example.test', role: 'lawyer' });
  const lawyer = await Lawyer.create({ user: user._id, designation: 'Advocate', barCouncilNumber: 'SMOKE-001', bio: 'Temporary test profile', services: [service._id], isFeatured: true });
  const blog = await BlogPost.create({ title: 'Smoke test article', excerpt: 'Temporary excerpt', content: 'Temporary content', category: 'Test', author: user._id, isPublished: true });
  const caseStudy = await CaseStudy.create({ title: 'Smoke test case', summary: 'Temporary case', challenge: 'Test', approach: 'Test', outcome: 'Test', service: service._id, lawyers: [lawyer._id], isPublished: true });
  assert.equal((await request('/public/lawyers?q=Smoke')).items.length, 1);
  assert.equal((await request(`/public/lawyers/${lawyer.slug}`)).lawyer._id, String(lawyer._id));
  assert.equal((await request(`/public/blog/${blog.slug}`)).item._id, String(blog._id));
  assert.equal((await request('/public/blog?q=Smoke')).items.length, 1);
  assert.equal((await request(`/public/case-studies/${caseStudy.slug}`)).item._id, String(caseStudy._id));
  console.log('PASS: lawyer directory, blog and case study list/detail contracts work.');

  const payload = { guestName: 'Test Client', guestEmail: 'guest@example.test', guestPhone: '01700000000', service: String(service._id), subject: 'Smoke test request', details: 'Temporary request', preferredDate: '', preferredLawyer: String(lawyer._id) };
  const created = (await request('/consultations', 'POST', { ...payload, status: 'resolved', reference: 'OVERRIDE' }, 201)).request;
  assert.equal(created.status, 'pending');
  assert.notEqual(created.reference, 'OVERRIDE');
  assert.equal(created.preferredLawyer, String(lawyer._id));
  assert.equal((await ConsultationRequest.findById(created._id)).preferredLawyer.toString(), String(lawyer._id));
  assert.equal((await request(`/consultations/${created._id}`)).item.service.title, service.title);
  assert.equal((await request('/consultations')).items.length, 1);
  assert.equal((await request(`/consultations/${created._id}`, 'PUT', { status: 'in-review' })).item.status, 'in-review');
  await request(`/consultations/${created._id}`, 'PUT', { status: 'unknown' }, 400);
  await request('/consultations/abc', 'GET', undefined, 400);
  await request(`/consultations/${new mongoose.Types.ObjectId()}`, 'GET', undefined, 404);
  await request('/consultations', 'POST', { ...payload, preferredLawyer: 'abc' }, 400);
  await request('/consultations', 'POST', { ...payload, preferredLawyer: String(new mongoose.Types.ObjectId()) }, 400);
  await request('/consultations', 'POST', { ...payload, service: 'abc' }, 400);
  await request('/consultations', 'POST', { ...payload, guestName: '' }, 400);
  await request('/public/contact', 'POST', { name: 'Test Contact', email: 'contact@example.test', subject: 'Smoke test', message: 'Temporary test message' }, 201);
  console.log('PASS: consultation form selections persist, validation works, and contact submission succeeds.');

  const client = (await request('/auth/sync', 'POST', { name: 'Registered Client', phone: '01700000000', role: 'admin', firebaseUid: identities.admin.uid, email: identities.admin.email, password: 'ignored' }, 200, 'client')).user;
  assert.equal(client.role, 'client');
  assert.equal(client.firebaseUid, identities.client.uid);
  assert.equal(client.email, identities.client.email);
  assert.equal((await User.findById(client.id).select('+password')).password, undefined);
  await request('/auth/sync', 'POST', { role: 'admin', isActive: false }, 200, 'client');
  assert.equal((await User.findById(client.id)).role, 'client');
  await request('/auth/sync', 'POST', { name: 'Other Client' }, 200, 'other');
  await request('/services', 'POST', {}, 401, null);
  await request('/services', 'POST', {}, 403, 'client');
  await request('/consultations', 'GET', undefined, 403, 'client');
  await request('/consultations', 'POST', payload, 401, 'forged');
  console.log('PASS: Firebase UID/email are trusted from verification only; profile input cannot grant admin access.');

  const owned = (await request('/consultations', 'POST', { ...payload, guestEmail: 'spoof@example.test', client: user._id }, 201, 'client')).request;
  assert.equal(owned.client, client.id);
  assert.equal(owned.guestEmail, identities.client.email);
  const mine = (await request('/client/consultations', 'GET', undefined, 200, 'client')).items;
  assert.deepEqual(mine.map(item => item._id), [owned._id]);
  assert.deepEqual((await request('/client/consultations', 'GET', undefined, 200, 'other')).items, []);
  await request(`/client/consultations/${owned._id}/cancel`, 'PATCH', {}, 404, 'other');
  await request(`/client/consultations/${created._id}/cancel`, 'PATCH', {}, 404, 'client');
  assert.equal((await request(`/client/consultations/${owned._id}/cancel`, 'PATCH', {}, 200, 'client')).item.status, 'cancelled');
  await request(`/client/consultations/${owned._id}/cancel`, 'PATCH', {}, 400, 'client');
  const profile = (await request('/auth/me', 'PATCH', { name: 'Updated Client', role: 'admin', email: 'override@example.test' }, 200, 'client')).user;
  assert.equal(profile.name, 'Updated Client');
  assert.equal(profile.role, 'client');
  assert.equal(profile.email, identities.client.email);
  console.log('PASS: clients can only read/cancel their own pending requests and edit allowed profile fields.');

  await User.collection.insertOne({ name: 'Legacy Admin', email: identities.collision.email, role: 'admin', isActive: true });
  await request('/auth/sync', 'POST', {}, 409, 'collision');
  assert.equal(await User.countDocuments({ firebaseUid: identities.collision.uid }), 0);
  await User.findByIdAndUpdate(client.id, { isActive: false });
  await request('/auth/me', 'GET', undefined, 403, 'client');
  await request('/auth/sync', 'POST', { isActive: true }, 403, 'client');
  await request('/consultations', 'POST', payload, 403, 'client');
  await request('/auth/logout', 'POST', {}, 200, 'other');
  await request('/auth/me', 'GET', undefined, 401, 'other');
  console.log('PASS: legacy-email collisions cannot take over accounts; inactive users and revoked sessions are rejected.');
} catch (error) {
  // Do not print connection strings, credentials or document contents on failure.
  console.error(`Integration check failed (${error.name}).`);
  if (error.code === 'ERR_ASSERTION') console.error(error.message);
  process.exitCode = 1;
} finally {
  if (server) await new Promise(resolve => server.close(resolve));
  try {
    if (connected) {
      assert.ok(database.startsWith('lexconnect_smoke_'));
      assert.equal(mongoose.connection.name, database);
      await mongoose.connection.dropDatabase();
      console.log('Temporary integration database removed.');
    }
  } catch {
    console.error(`Could not remove temporary test database ${database}. Remove this test database manually.`);
    process.exitCode = 1;
  } finally {
    mock.restoreAll();
    await disconnectDatabase();
  }
}
