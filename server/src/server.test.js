import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import app from './server.js';

test('browser requests receive compatible CORS and JSON errors without a database', async (t) => {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
  const base = `http://127.0.0.1:${server.address().port}`;
  const origin = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim();

  const preflight = await fetch(`${base}/api/public/contact`, {
    method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' }
  });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('access-control-allow-origin'), origin);
  assert.equal(preflight.headers.get('access-control-allow-credentials'), 'true');
  const disallowed = await fetch(`${base}/api/health`, { headers: { Origin: 'https://unlisted-origin.example' } });
  assert.equal(disallowed.headers.get('access-control-allow-origin'), null);

  for (const [path, status, options] of [
    ['/api/missing-route', 404, {}],
    ['/api/public/services?q=one&q=two', 400, {}],
    ['/api/public/services?page=Infinity', 400, {}],
    ['/api/public/services?limit=-1', 400, {}],
    ['/api/public/lawyers?minExperience=-2', 400, {}],
    ['/api/public/contact', 400, { method: 'POST' }],
    ['/api/consultations', 400, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{broken' }]
  ]) {
    const response = await fetch(base + path, options);
    assert.equal(response.status, status, path);
    const body = await response.json();
    assert.equal(body.success, false);
    assert.equal(typeof body.message, 'string');
    assert.equal(body.stack, undefined);
  }
});
