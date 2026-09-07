import { readFile, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';

// Run from the repository root with npm run setup. Existing settings stay intact.
for (const workspace of ['server', 'client']) {
  const template = new URL(`../${workspace}/.env.example`, import.meta.url);
  const destination = new URL(`../${workspace}/.env`, import.meta.url);
  let contents = await readFile(template, 'utf8');
  if (workspace === 'server') {
    contents = contents.replace('replace-with-a-long-random-secret', randomBytes(32).toString('hex'));
  }
  try {
    await writeFile(destination, contents, { flag: 'wx' });
    console.log(`Created ${workspace}/.env from its example.`);
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    console.log(`Kept existing ${workspace}/.env.`);
  }
}
console.log('Set MONGODB_URI in server/.env to your own local MongoDB or Atlas database, then run npm run dev.');
