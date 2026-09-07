import assert from 'node:assert/strict';
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

// Always override the configured database name. Never seed or clear the user's DB.
const database = `lexconnect_smoke_${randomUUID().replaceAll('-', '').slice(0, 16)}`;
let server;
let connected = false;
let base;
async function request(path, method = 'GET', payload, status = 200) {
  const response = await fetch(base + path, {
    method, headers: { 'Content-Type': 'application/json' },
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

  const user = await User.create({ name: 'Smoke Test Lawyer', email: 'smoke@example.test', password: randomUUID(), role: 'lawyer' });
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
    await disconnectDatabase();
  }
}
