import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname, basename, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

test('setup creates templates once and never overwrites existing settings', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'lexconnect-setup-test-'));
  try {
    for (const name of ['scripts', 'server', 'client']) await mkdir(join(directory, name));
    const script = join(directory, 'scripts/setup-env.mjs');
    await writeFile(script, await readFile(new URL('./setup-env.mjs', import.meta.url)));
    await writeFile(join(directory, 'server/.env.example'), 'JWT_SECRET=replace-with-a-long-random-secret\n');
    await writeFile(join(directory, 'client/.env.example'), 'VITE_API_URL=http://localhost:5000/api\n');
    const run = () => spawnSync(process.execPath, [script], { cwd: directory, encoding: 'utf8' });
    const first = run();
    assert.equal(first.status, 0);
    const serverEnv = await readFile(join(directory, 'server/.env'), 'utf8');
    assert.match(serverEnv, /^JWT_SECRET=[a-f0-9]{64}\n$/);
    assert.ok(!first.stdout.includes(serverEnv.trim().split('=')[1]));
    await writeFile(join(directory, 'client/.env'), 'VITE_API_URL=http://custom.example/api\n');
    assert.equal(run().status, 0);
    assert.equal(await readFile(join(directory, 'server/.env'), 'utf8'), serverEnv);
    assert.equal(await readFile(join(directory, 'client/.env'), 'utf8'), 'VITE_API_URL=http://custom.example/api\n');
  } finally {
    // directory is the unique temporary directory created by this test.
    assert.equal(dirname(directory), resolve(tmpdir()));
    assert.ok(basename(directory).startsWith('lexconnect-setup-test-'));
    await rm(directory, { recursive: true, force: true });
  }
});
