import assert from 'node:assert/strict';
import { mock } from 'node:test';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import mongoose from 'mongoose';
import app from '../server/src/server.js';
import { connectDatabase, disconnectDatabase } from '../server/src/config/db.js';
import { seedDemoData } from '../server/src/seeds/demo.js';
import { seedPublicData } from '../server/src/seeds/seed.js';
import Service from '../server/src/models/Service.js';
import FAQ from '../server/src/models/FAQ.js';
import Lawyer from '../server/src/models/Lawyer.js';
import User from '../server/src/models/User.js';
import Testimonial from '../server/src/models/Testimonial.js';
import BlogPost from '../server/src/models/BlogPost.js';
import CaseStudy from '../server/src/models/CaseStudy.js';
import ConsultationRequest from '../server/src/models/ConsultationRequest.js';
import { firebaseIdentity } from '../server/src/config/firebase.js';
import { initialForm, formPayload } from '../client/src/components/adminForm.js';
import { adminConfigs } from '../client/src/pages/admin/adminConfigs.js';

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
  lawyer: { uid: 'smoke-lawyer', email: 'smoke@example.test' },
  candidate: { uid: 'smoke-candidate', email: 'candidate@example.test' },
  noProfile: { uid: 'smoke-no-profile', email: 'no-profile@example.test' },
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
  assert.equal((await request(`/services/${basic._id}`)).item.isActive, false);
  await request(`/public/services/${basic._id}`, 'GET', undefined, 404);
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

  for (const path of ['/admin/overview', '/admin/lawyers', '/admin/consultations']) {
    await request(path, 'GET', undefined, 401, null);
    await request(path, 'GET', undefined, 403, 'client');
  }
  const overview = await request('/admin/overview', 'GET', undefined, 200, 'admin');
  assert.equal(overview.stats.users, await User.countDocuments());
  assert.ok(Array.isArray(overview.recent));
  assert.ok((await request('/admin/lawyers?eligible=true', 'GET', undefined, 200, 'admin')).items.some(item => item._id === String(lawyer._id)));
  const assignable = (await request('/consultations', 'POST', payload, 201, 'client')).request;
  const adminPath = `/admin/consultations/${assignable._id}`;
  await request(adminPath, 'PATCH', { assignedLawyer: lawyer._id }, 403, 'client');
  await request(adminPath, 'DELETE', undefined, 403, 'client');
  await request(adminPath, 'PATCH', { status: 'assigned' }, 400, 'admin');
  await request(`/consultations/${assignable._id}`, 'PUT', { status: 'assigned' }, 400, 'admin');
  for (const invalid of [{ assignedLawyer: 'abc' }, { assignedLawyer: String(new mongoose.Types.ObjectId()) }, { status: 'unknown' }, { adminNote: {} }, { guestEmail: 'not-editable@example.test' }]) {
    await request(adminPath, 'PATCH', invalid, 400, 'admin');
  }
  await User.findByIdAndUpdate(user._id, { isActive: false });
  await request(adminPath, 'PATCH', { assignedLawyer: lawyer._id }, 400, 'admin');
  assert.equal((await request('/admin/lawyers?eligible=true', 'GET', undefined, 200, 'admin')).items.length, 0);
  await User.findByIdAndUpdate(user._id, { isActive: true, role: 'client' });
  await request(adminPath, 'PATCH', { assignedLawyer: lawyer._id }, 400, 'admin');
  await User.findByIdAndUpdate(user._id, { role: 'lawyer' });
  await User.findByIdAndUpdate(user._id, { $unset: { firebaseUid: 1 } });
  await request(adminPath, 'PATCH', { assignedLawyer: lawyer._id }, 400, 'admin');
  await User.findByIdAndUpdate(user._id, { firebaseUid: 'smoke-lawyer' });
  await Lawyer.findByIdAndUpdate(lawyer._id, { isActive: false });
  await request(adminPath, 'PATCH', { assignedLawyer: lawyer._id }, 400, 'admin');
  await Lawyer.findByIdAndUpdate(lawyer._id, { isActive: true });
  assert.equal((await ConsultationRequest.findById(assignable._id)).status, 'pending');
  const assigned = (await request(adminPath, 'PATCH', { assignedLawyer: String(lawyer._id), adminNote: 'Internal test note', client: user._id }, 200, 'admin')).item;
  assert.equal(assigned.status, 'assigned');
  assert.equal(assigned.assignedLawyer.user.name, user.name);
  assert.equal(assigned.client, client.id);
  assert.equal(assigned.statusHistory.at(-1).changedBy, String((await User.findOne({ firebaseUid: identities.admin.uid }))._id));
  const listed = (await request('/admin/consultations?status=assigned', 'GET', undefined, 200, 'admin')).items;
  assert.ok(listed.some(item => item._id === assignable._id));
  await request('/admin/consultations?status=invalid', 'GET', undefined, 400, 'admin');
  const clientView = (await request('/client/consultations', 'GET', undefined, 200, 'client')).items.find(item => item._id === assignable._id);
  assert.equal(clientView.assignedLawyer.user.name, user.name);
  assert.equal(clientView.adminNote, undefined);
  assert.equal(clientView.statusHistory, undefined);
  await request(`/client/consultations/${assignable._id}/cancel`, 'PATCH', {}, 400, 'client');
  const unassigned = (await request(adminPath, 'PATCH', { assignedLawyer: '' }, 200, 'admin')).item;
  assert.equal(unassigned.status, 'pending');
  assert.equal(unassigned.assignedLawyer, undefined);
  const stale = await ConsultationRequest.findById(assignable._id);
  await request(`/client/consultations/${assignable._id}/cancel`, 'PATCH', {}, 200, 'client');
  stale.status = 'assigned';
  stale.assignedLawyer = lawyer._id;
  await assert.rejects(stale.save(), error => error.name === 'VersionError');
  const beforeCancel = await ConsultationRequest.countDocuments();
  await request(adminPath, 'DELETE', undefined, 200, 'admin');
  await request(`/admin/consultations/${created._id}`, 'DELETE', undefined, 200, 'admin');
  assert.equal(await ConsultationRequest.countDocuments(), beforeCancel);
  assert.equal((await ConsultationRequest.findById(created._id)).status, 'cancelled');
  await request('/admin/consultations/abc', 'PATCH', { status: 'pending' }, 400, 'admin');
  await request(`/admin/consultations/${new mongoose.Types.ObjectId()}`, 'PATCH', { status: 'pending' }, 404, 'admin');
  console.log('PASS: admin overview, validated assignment/unassignment, history, client visibility, retained cancellations and conflicting-update protection.');

  const candidate = (await request('/auth/sync', 'POST', { name: 'New Advocate' }, 200, 'candidate')).user;
  const candidateData = { user: candidate.id, designation: 'Advocate', barCouncilNumber: 'SMOKE-002', bio: 'New lawyer', services: [String(service._id)] };
  await request('/admin/lawyers', 'POST', candidateData, 403, 'client');
  await request('/admin/lawyer-candidates', 'GET', undefined, 403, 'client');
  assert.ok((await request('/admin/lawyer-candidates', 'GET', undefined, 200, 'admin')).items.some(item => item._id === candidate.id));
  for (const invalid of [{ barCouncilNumber: undefined }, { services: ['abc'] }, { services: [String(new mongoose.Types.ObjectId())] }, { user: String((await User.findOne({ role: 'admin' }))._id) }]) {
    await request('/admin/lawyers', 'POST', { ...candidateData, ...invalid }, 400, 'admin');
  }
  assert.equal((await User.findById(candidate.id)).role, 'client');
  assert.equal(await Lawyer.countDocuments({ user: candidate.id }), 0);
  await User.findByIdAndUpdate(candidate.id, { isActive: false });
  await request('/admin/lawyers', 'POST', candidateData, 400, 'admin');
  await User.findByIdAndUpdate(candidate.id, { isActive: true });
  await User.findByIdAndUpdate(candidate.id, { $unset: { firebaseUid: 1 } });
  await request('/admin/lawyers', 'POST', candidateData, 400, 'admin');
  await User.findByIdAndUpdate(candidate.id, { firebaseUid: identities.candidate.uid });
  // Fault injection: a database write failure must not leave a usable orphan profile.
  const failedPromotion = mock.method(User, 'findOneAndUpdate', () => { throw new Error('Simulated write failure'); });
  try {
    await request('/admin/lawyers', 'POST', candidateData, 500, 'admin');
  } finally {
    failedPromotion.mock.restore();
  }
  assert.equal(await Lawyer.countDocuments({ user: candidate.id }), 0);
  assert.equal((await User.findById(candidate.id)).role, 'client');
  const provisioned = (await request('/admin/lawyers', 'POST', { ...candidateData, role: 'admin', password: 'ignored' }, 201, 'admin')).item;
  assert.equal(provisioned.user._id, candidate.id);
  assert.equal((await User.findById(candidate.id)).firebaseUid, identities.candidate.uid);
  assert.equal((await User.findById(candidate.id).select('+password')).password, undefined);
  assert.equal((await request('/auth/me', 'GET', undefined, 200, 'candidate')).user.role, 'lawyer');
  await request('/admin/lawyers', 'POST', candidateData, 409, 'admin');
  assert.ok(!(await request('/admin/lawyer-candidates', 'GET', undefined, 200, 'admin')).items.some(item => item._id === candidate.id));
  await request('/lawyer/profile', 'GET', undefined, 401);
  await request('/lawyer/profile', 'GET', undefined, 403, 'client');
  const edited = (await request('/lawyer/profile', 'PATCH', { bio: 'Edited biography', user: client.id, isActive: false, isFeatured: true, barCouncilNumber: 'OVERRIDE' }, 200, 'candidate')).profile;
  assert.equal(edited.bio, 'Edited biography');
  assert.equal(edited.user._id, candidate.id);
  assert.equal(edited.isActive, true);
  assert.equal(edited.isFeatured, false);
  assert.equal(edited.barCouncilNumber, candidateData.barCouncilNumber);
  await request('/lawyer/profile', 'PATCH', { services: ['abc'] }, 400, 'candidate');
  await request(`/admin/lawyers/${provisioned._id}`, 'PATCH', { designation: 'Senior Advocate', user: client.id }, 200, 'admin');
  assert.equal((await Lawyer.findById(provisioned._id)).user.toString(), candidate.id);
  const working = (await request('/consultations', 'POST', payload, 201, 'client')).request;
  await request(`/admin/consultations/${working._id}`, 'PATCH', { assignedLawyer: provisioned._id, adminNote: 'Admin only' }, 200, 'admin');
  const lawyerView = (await request('/lawyer/consultations', 'GET', undefined, 200, 'candidate')).items;
  assert.deepEqual(lawyerView.map(item => item._id), [working._id]);
  assert.equal(lawyerView[0].adminNote, undefined);
  assert.equal(lawyerView[0].statusHistory, undefined);
  const workPath = `/lawyer/consultations/${working._id}`;
  await request(workPath, 'PATCH', { status: 'resolved' }, 404, 'lawyer');
  await request(`/lawyer/consultations/${created._id}`, 'PATCH', { status: 'resolved' }, 404, 'candidate');
  for (const invalid of [{ status: 'assigned' }, { status: 'in-review', lawyerNote: {} }, { status: 'in-review', lawyerNote: 'x'.repeat(3001) }]) {
    await request(workPath, 'PATCH', invalid, 400, 'candidate');
  }
  const progress = (await request(workPath, 'PATCH', { status: 'in-review', lawyerNote: 'Private working note', assignedLawyer: lawyer._id, adminNote: 'forged' }, 200, 'candidate')).item;
  assert.equal(progress.assignedLawyer, provisioned._id);
  assert.equal(progress.adminNote, undefined);
  assert.equal(progress.statusHistory, undefined);
  const savedWork = await ConsultationRequest.findById(working._id);
  assert.equal(savedWork.lawyerNote, 'Private working note');
  assert.equal(savedWork.adminNote, 'Admin only');
  assert.equal(savedWork.statusHistory.at(-1).changedBy.toString(), candidate.id);
  assert.equal((await request('/client/consultations', 'GET', undefined, 200, 'client')).items.find(item => item._id === working._id).lawyerNote, undefined);
  await request(workPath, 'PATCH', { status: 'scheduled' }, 200, 'candidate');
  await request(workPath, 'PATCH', { status: 'resolved' }, 200, 'candidate');
  await request(workPath, 'PATCH', { status: 'in-review' }, 400, 'candidate');
  await request(`/admin/consultations/${working._id}`, 'DELETE', undefined, 200, 'admin');
  await request(workPath, 'PATCH', { status: 'in-review' }, 400, 'candidate');
  await request(`/admin/lawyers/${provisioned._id}`, 'DELETE', undefined, 200, 'admin');
  await request('/lawyer/profile', 'GET', undefined, 403, 'candidate');
  await request('/lawyer/profile', 'PATCH', { isActive: true }, 403, 'candidate');
  await request('/lawyer/consultations', 'GET', undefined, 403, 'candidate');
  await request(workPath, 'PATCH', { status: 'scheduled' }, 403, 'candidate');
  assert.ok((await request('/admin/lawyers', 'GET', undefined, 200, 'admin')).items.some(item => item._id === provisioned._id && !item.isActive));
  assert.ok(!(await request('/admin/lawyers?eligible=true', 'GET', undefined, 200, 'admin')).items.some(item => item._id === provisioned._id));
  assert.ok(await ConsultationRequest.exists({ _id: working._id }));
  await request(`/admin/lawyers/${provisioned._id}`, 'PATCH', { isActive: true }, 200, 'admin');
  await request('/lawyer/profile', 'GET', undefined, 200, 'candidate');
  await User.create({ firebaseUid: identities.noProfile.uid, email: identities.noProfile.email, name: 'No Profile', role: 'lawyer' });
  await request('/lawyer/consultations', 'GET', undefined, 404, 'noProfile');
  await request(`/lawyer/consultations/${created._id}`, 'PATCH', { status: 'resolved' }, 404, 'noProfile');
  console.log('PASS: Firebase-linked lawyer provisioning, profile ownership, private notes, assigned-only updates, closure and archive/reactivation.');

  const draftPayload = { title: 'New lawyer draft', excerpt: 'Short introduction', content: 'Article text', category: 'General', author: client.id, isPublished: true, isFeatured: true };
  await request('/lawyer/blog', 'POST', draftPayload, 403, 'client');
  await request('/lawyer/blog', 'POST', draftPayload, 404, 'noProfile');
  await request(`/admin/lawyers/${provisioned._id}`, 'DELETE', undefined, 200, 'admin');
  await request('/lawyer/blog', 'POST', draftPayload, 403, 'candidate');
  await request('/lawyer/blog', 'GET', undefined, 403, 'candidate');
  await request(`/admin/lawyers/${provisioned._id}`, 'PATCH', { isActive: true }, 200, 'admin');
  const draft = (await request('/lawyer/blog', 'POST', draftPayload, 201, 'candidate')).item;
  assert.equal(draft.author, candidate.id);
  assert.equal(draft.isPublished, false);
  assert.equal(draft.isFeatured, false);
  assert.equal(draft.publishedAt, undefined);
  assert.deepEqual((await request('/lawyer/blog', 'GET', undefined, 200, 'candidate')).items.map(item => item._id), [draft._id]);
  assert.ok(!(await request('/lawyer/blog', 'GET', undefined, 200, 'lawyer')).items.some(item => item._id === draft._id));
  await request(`/public/blog/${draft.slug}`, 'GET', undefined, 404);
  const draftPath = `/admin/content/blog/${draft._id}`;
  await request('/admin/content/blog', 'GET', undefined, 401);
  await request('/admin/content/blog', 'GET', undefined, 403, 'candidate');
  await request(draftPath, 'PATCH', { isPublished: true }, 403, 'candidate');
  await request(draftPath, 'PATCH', { isPublished: 'false' }, 400, 'admin');
  assert.ok((await request('/admin/content/blog', 'GET', undefined, 200, 'admin')).items.some(item => item._id === draft._id));
  const published = (await request(draftPath, 'PATCH', { isPublished: true, author: client.id, title: 'Reviewed lawyer article' }, 200, 'admin')).item;
  assert.equal(published.author._id, candidate.id);
  assert.ok(published.publishedAt);
  assert.equal(published.slug, 'reviewed-lawyer-article');
  assert.equal((await request(`/public/blog/${published.slug}`)).item._id, draft._id);
  await request(draftPath, 'DELETE', undefined, 200, 'admin');
  await request(`/public/blog/${published.slug}`, 'GET', undefined, 404);
  assert.ok(await BlogPost.exists({ _id: draft._id }));
  const republished = (await request(draftPath, 'PATCH', { isPublished: true }, 200, 'admin')).item;
  assert.equal(republished.publishedAt, published.publishedAt);
  const adminPost = (await request('/admin/content/blog', 'POST', { ...draftPayload, title: 'Admin announcement' }, 201, 'admin')).item;
  assert.equal(adminPost.author.role, 'admin');
  await request('/admin/content/blog/abc', 'PATCH', { title: 'Invalid' }, 400, 'admin');
  await request(`/admin/content/blog/${new mongoose.Types.ObjectId()}`, 'DELETE', undefined, 404, 'admin');
  await request('/lawyer/blog', 'POST', { ...draftPayload, content: '' }, 400, 'candidate');
  console.log('PASS: lawyer drafts stay private until admin publication; authorship, publication dates and hiding are preserved.');

  const reviewPayload = { consultation: working._id, rating: 5, comment: ' Helpful consultation. ', client: user._id, lawyer: lawyer._id, isApproved: true, approvedBy: user._id };
  await request('/client/testimonials', 'GET', undefined, 401);
  await request('/client/testimonials', 'POST', reviewPayload, 403, 'candidate');
  await request('/client/testimonials', 'POST', reviewPayload, 400, 'client'); // cancelled
  await request(`/admin/consultations/${working._id}`, 'PATCH', { status: 'resolved' }, 200, 'admin');
  await request('/client/testimonials', 'POST', reviewPayload, 400, 'other');
  for (const invalid of [{ rating: 0 }, { rating: 6 }, { rating: 2.5 }, { rating: '5' }, { comment: '   ' }, { comment: 'x'.repeat(1201) }, { consultation: 'abc' }]) {
    await request('/client/testimonials', 'POST', { ...reviewPayload, ...invalid }, 400, 'client');
  }
  const review = (await request('/client/testimonials', 'POST', reviewPayload, 201, 'client')).item;
  assert.equal(review.client, client.id);
  assert.equal(review.lawyer, provisioned._id);
  assert.equal(review.comment, 'Helpful consultation.');
  assert.equal(review.isApproved, false);
  assert.equal(review.approvedBy, undefined);
  await request('/client/testimonials', 'POST', reviewPayload, 409, 'client');
  assert.equal(await Testimonial.countDocuments({ consultation: working._id }), 1);
  assert.deepEqual((await request('/client/testimonials', 'GET', undefined, 200, 'other')).items, []);
  assert.equal((await request('/client/testimonials', 'GET', undefined, 200, 'client')).items[0].consultation._id, working._id);
  assert.equal((await request('/public/home')).data.testimonials.length, 0);
  await request('/admin/testimonials', 'GET', undefined, 403, 'client');
  const reviewPath = `/admin/testimonials/${review._id}`;
  await request(reviewPath, 'PATCH', { isApproved: true }, 403, 'client');
  await request(reviewPath, 'PATCH', { isApproved: 'false' }, 400, 'admin');
  await request(reviewPath, 'PATCH', {}, 400, 'admin');
  const approved = (await request(reviewPath, 'PATCH', { isApproved: true, comment: 'Overwritten' }, 200, 'admin')).item;
  assert.equal(approved.comment, review.comment);
  assert.equal(approved.approvedBy, String((await User.findOne({ role: 'admin' }))._id));
  assert.ok(approved.approvedAt);
  const publicReview = (await request('/public/home')).data.testimonials[0];
  assert.equal(publicReview._id, review._id);
  assert.equal(publicReview.client.name, 'Updated Client');
  assert.equal(publicReview.client.email, undefined);
  assert.equal(publicReview.consultation, undefined);
  assert.equal(publicReview.approvedBy, undefined);
  assert.equal((await request('/admin/testimonials', 'GET', undefined, 200, 'admin')).items[0].consultation.reference, working.reference);
  await request(reviewPath, 'PATCH', { isApproved: false }, 200, 'admin');
  assert.equal((await request('/public/home')).data.testimonials.length, 0);
  assert.equal((await Testimonial.findById(review._id)).approvedBy, undefined);
  assert.equal((await Testimonial.findById(review._id)).approvedAt, undefined);
  await request('/admin/testimonials/abc', 'PATCH', { isApproved: true }, 400, 'admin');
  await request(`/admin/testimonials/${new mongoose.Types.ObjectId()}`, 'PATCH', { isApproved: true }, 404, 'admin');
  console.log('PASS: one review per owned resolved consultation, rating validation, admin approval/hiding and public-field privacy.');

  for (const path of ['/admin/content/services', '/admin/content/faqs', '/admin/content/case-studies', '/admin/users', '/admin/messages']) {
    await request(path, 'GET', undefined, 401);
    await request(path, 'GET', undefined, 403, 'client');
    await request(path, 'GET', undefined, 200, 'admin');
  }
  const managedService = (await request('/admin/content/services', 'POST', { title: 'Managed service', category: 'Test', description: 'Details', summary: 'Summary' }, 201, 'admin')).item;
  const casePayload = { title: 'Managed case', service: managedService._id, lawyers: [provisioned._id], summary: 'Summary', challenge: 'Challenge', approach: 'Approach', outcome: 'Outcome', isPublished: false };
  await request('/admin/content/case-studies', 'POST', { ...casePayload, service: 'abc' }, 400, 'admin');
  await request('/admin/content/case-studies', 'POST', { ...casePayload, lawyers: [String(new mongoose.Types.ObjectId())] }, 400, 'admin');
  const managedCase = (await request('/admin/content/case-studies', 'POST', casePayload, 201, 'admin')).item;
  await request(`/public/case-studies/${managedCase._id}`, 'GET', undefined, 404);
  const casePath = `/admin/content/case-studies/${managedCase._id}`;
  const caseFields = adminConfigs['case-studies'].fields;
  const editorPayload = formPayload(caseFields, { ...initialForm(caseFields, managedCase), summary: 'Edited without reselecting the service' }, true);
  const editedCase = (await request(casePath, 'PATCH', editorPayload, 200, 'admin')).item;
  assert.equal(editedCase.service._id, managedService._id);
  assert.equal(editedCase.summary, editorPayload.summary);
  const publishedCase = (await request(casePath, 'PATCH', { title: 'Reviewed case', isPublished: true, publishedAt: '2000-01-01' }, 200, 'admin')).item;
  assert.equal(publishedCase.slug, 'reviewed-case');
  assert.ok(new Date(publishedCase.publishedAt).getFullYear() > 2000);
  assert.equal((await request(`/public/case-studies/${publishedCase.slug}`)).item._id, managedCase._id);
  const linkedRequest = (await request('/consultations', 'POST', { ...payload, service: managedService._id }, 201, 'client')).request;
  await request('/lawyer/profile', 'PATCH', { services: [managedService._id] }, 200, 'candidate');
  await request(`/services/${managedService._id}`, 'DELETE');
  await request('/lawyer/profile', 'PATCH', { bio: 'Still editable', services: [managedService._id] }, 200, 'candidate');
  await request('/lawyer/profile', 'PATCH', { services: [managedService._id] }, 400, 'lawyer');
  await request(`/public/services/${managedService._id}`, 'GET', undefined, 404);
  await request('/consultations', 'POST', { ...payload, service: managedService._id }, 400, 'client');
  assert.equal((await request(`/consultations/${linkedRequest._id}`)).item.service._id, managedService._id);
  assert.equal((await request(`/public/case-studies/${publishedCase.slug}`)).item.service._id, managedService._id);
  await request(`/admin/content/services/${managedService._id}`, 'PATCH', { isActive: true }, 200, 'admin');
  await request(`/admin/content/services/${managedService._id}`, 'DELETE', undefined, 200, 'admin');
  assert.ok(await Service.exists({ _id: managedService._id }));
  await request(casePath, 'DELETE', undefined, 200, 'admin');
  await request(`/public/case-studies/${managedCase._id}`, 'GET', undefined, 404);
  assert.ok(await CaseStudy.exists({ _id: managedCase._id }));
  const faq = (await request('/admin/content/faqs', 'POST', { question: 'Managed question?', answer: 'Answer', category: 'Test' }, 201, 'admin')).item;
  await request(`/admin/content/faqs/${faq._id}`, 'PATCH', { answer: 'Updated', sortOrder: 2 }, 200, 'admin');
  assert.ok((await request('/public/faqs')).items.some(item => item._id === faq._id && item.answer === 'Updated'));
  await request(`/admin/content/faqs/${faq._id}`, 'DELETE', undefined, 200, 'admin');
  assert.ok(!(await request('/public/faqs')).items.some(item => item._id === faq._id));
  await request('/admin/content/unknown', 'POST', {}, 404, 'admin');
  await request('/admin/content/faqs/abc', 'PATCH', {}, 400, 'admin');
  await request(`/admin/content/faqs/${faq._id}`, 'PATCH', { isActive: 'false' }, 400, 'admin');
  const accounts = (await request('/admin/users', 'GET', undefined, 200, 'admin')).items;
  assert.equal(accounts.find(item => item._id === candidate.id).firebaseUid, undefined);
  const adminAccount = accounts.find(item => item.role === 'admin');
  await request(`/admin/users/${adminAccount._id}`, 'PATCH', { isActive: false }, 400, 'admin');
  await request(`/admin/users/${candidate.id}`, 'PATCH', { isActive: 'false' }, 400, 'admin');
  await request(`/admin/users/${candidate.id}`, 'PATCH', { isActive: false, role: 'admin' }, 200, 'admin');
  assert.equal((await User.findById(candidate.id)).role, 'lawyer');
  await request('/auth/sync', 'POST', {}, 403, 'candidate');
  await request('/lawyer/profile', 'GET', undefined, 403, 'candidate');
  await request(`/public/lawyers/${provisioned._id}`, 'GET', undefined, 404);
  assert.ok(!(await request('/public/lawyers')).items.some(item => item._id === provisioned._id));
  await request('/consultations', 'POST', { ...payload, preferredLawyer: provisioned._id }, 400, 'client');
  await request(`/admin/users/${candidate.id}`, 'PATCH', { isActive: true }, 200, 'admin');
  await request('/lawyer/profile', 'GET', undefined, 200, 'candidate');
  const messages = (await request('/admin/messages', 'GET', undefined, 200, 'admin')).items;
  assert.ok(messages.length);
  const messagePath = `/admin/messages/${messages[0]._id}`;
  await request(messagePath, 'PATCH', { status: 'read' }, 403, 'client');
  await request(messagePath, 'PATCH', { status: 'invalid' }, 400, 'admin');
  const readMessage = (await request(messagePath, 'PATCH', { status: 'read', email: 'overwrite@example.test' }, 200, 'admin')).item;
  assert.equal(readMessage.email, messages[0].email);
  assert.equal(readMessage.status, 'read');
  await request(messagePath, 'PATCH', { status: 'archived' }, 200, 'admin');
  console.log('PASS: admin content CRUD, retained service references, account activation, unavailable lawyers and contact inbox.');

  const ownPostPath = `/lawyer/blog/${draft._id}`;
  await request(ownPostPath, 'PATCH', { isPublished: false }, 404, 'lawyer');
  await request(ownPostPath, 'DELETE', undefined, 404, 'lawyer');
  await request(ownPostPath, 'PATCH', { isPublished: true }, 403, 'client');
  const lawyerEdited = (await request(ownPostPath, 'PATCH', { title: 'Lawyer revised post', isPublished: true, author: client.id, isFeatured: true }, 200, 'candidate')).item;
  assert.equal(lawyerEdited.author, candidate.id);
  assert.equal(lawyerEdited.isFeatured, false);
  assert.equal((await request(`/public/blog/${lawyerEdited.slug}`)).item.title, 'Lawyer revised post');
  await request(ownPostPath, 'DELETE', undefined, 200, 'candidate');
  await request(`/public/blog/${lawyerEdited.slug}`, 'GET', undefined, 404);
  await request(`/admin/lawyers/${provisioned._id}`, 'DELETE', undefined, 200, 'admin');
  await request(ownPostPath, 'PATCH', { isPublished: true }, 403, 'candidate');
  await request(`/admin/lawyers/${provisioned._id}`, 'PATCH', { isActive: true }, 200, 'admin');
  assert.ok((await request('/public/services')).categories.includes('Business'));
  assert.ok((await request('/public/service-options')).items.every(item => item.title && item._id));
  assert.ok((await request('/public/lawyer-options')).items.some(item => item._id === provisioned._id));
  const bulkServices = await Service.insertMany(Array.from({ length: 51 }, (_, i) => ({ title: `Pagination service ${i}`, category: 'Pagination', description: 'Temporary' })));
  const secondPage = await request('/public/services?category=Pagination&page=2&limit=50');
  assert.equal(secondPage.items.length, 1);
  assert.equal(secondPage.pagination.total, 51);
  assert.ok((await request('/public/service-options')).items.length > 50);
  await Service.deleteMany({ _id: { $in: bulkServices.map(item => item._id) } });
  await seedDemoData();
  const demoUser = await User.findOne({ firebaseUid: 'demo:lexconnect:lawyer:0' });
  const demoProfile = await Lawyer.findOne({ user: demoUser._id });
  assert.equal((await request(`/public/lawyers/${demoProfile.slug}`)).lawyer.photoUrl, '/demo/lawyer-avatar.svg');
  await Lawyer.updateOne({ _id: demoProfile._id }, { bio: 'Preserve teammate edit' });
  const demoCounts = await Promise.all([User.countDocuments(), Lawyer.countDocuments(), ConsultationRequest.countDocuments(), BlogPost.countDocuments(), CaseStudy.countDocuments(), FAQ.countDocuments()]);
  await seedDemoData();
  assert.deepEqual(await Promise.all([User.countDocuments(), Lawyer.countDocuments(), ConsultationRequest.countDocuments(), BlogPost.countDocuments(), CaseStudy.countDocuments(), FAQ.countDocuments()]), demoCounts);
  assert.equal((await Lawyer.findById(demoProfile._id)).bio, 'Preserve teammate edit');
  console.log('PASS: owned lawyer publishing, filters/options beyond 50 records and repeatable fictional demo data.');

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
